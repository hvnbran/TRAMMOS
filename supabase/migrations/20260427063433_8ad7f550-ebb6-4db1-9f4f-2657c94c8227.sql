-- Tabla para guardar las suscripciones push de cada pasajero
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_push_subs_user ON public.push_subscriptions(user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- El propio usuario maneja sus suscripciones
CREATE POLICY "user_select_own_push_subs"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_insert_own_push_subs"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_delete_own_push_subs"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "user_update_own_push_subs"
  ON public.push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Cola de notificaciones a enviar (procesada por endpoint serverless)
CREATE TABLE public.push_notifications_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  url text,
  tag text,
  data jsonb,
  status text NOT NULL DEFAULT 'pending',
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE INDEX idx_push_queue_pending ON public.push_notifications_queue(status, created_at)
  WHERE status = 'pending';

ALTER TABLE public.push_notifications_queue ENABLE ROW LEVEL SECURITY;

-- Solo staff puede ver la cola; el push se envía con service role
CREATE POLICY "staff_view_push_queue"
  ON public.push_notifications_queue FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Función trigger: cuando cambia conductor/vehículo/estado en solicitudes_pasajero,
-- encola un push para el pasajero dueño de la solicitud.
CREATE OR REPLACE FUNCTION public.enqueue_push_on_solicitud_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_body text;
  v_should_notify boolean := false;
  v_tag text;
BEGIN
  -- Caso 1: se asignó conductor o cambió a 'aceptada'
  IF (OLD.conductor_nombre IS DISTINCT FROM NEW.conductor_nombre
      AND NEW.conductor_nombre IS NOT NULL)
     OR (OLD.estado IS DISTINCT FROM NEW.estado AND NEW.estado = 'aceptada') THEN
    v_title := '¡Tu carro fue asignado!';
    v_body := COALESCE('Conductor: ' || NEW.conductor_nombre, 'Tu conductor está confirmado')
              || COALESCE(' · Placa: ' || NEW.vehiculo_placa, '');
    v_tag := 'asignacion-' || NEW.id::text;
    v_should_notify := true;

  -- Caso 2: estado cambió a 'en_camino'
  ELSIF OLD.estado IS DISTINCT FROM NEW.estado AND NEW.estado = 'en_camino' THEN
    v_title := 'Tu carro va en camino';
    v_body := COALESCE(NEW.conductor_nombre || ' viene hacia ti', 'Tu conductor va hacia ti')
              || COALESCE(' · Placa: ' || NEW.vehiculo_placa, '');
    v_tag := 'en-camino-' || NEW.id::text;
    v_should_notify := true;

  -- Caso 3: estado cambió a 'a_bordo' (llegó y subiste)
  ELSIF OLD.estado IS DISTINCT FROM NEW.estado AND NEW.estado = 'a_bordo' THEN
    v_title := 'Tu carro llegó';
    v_body := 'Disfruta tu viaje con TRAMMOS.';
    v_tag := 'llegada-' || NEW.id::text;
    v_should_notify := true;
  END IF;

  IF v_should_notify THEN
    INSERT INTO public.push_notifications_queue (user_id, title, body, url, tag, data)
    VALUES (
      NEW.created_by_pasajero,
      v_title,
      v_body,
      '/pasajero',
      v_tag,
      jsonb_build_object(
        'solicitud_id', NEW.id,
        'estado', NEW.estado,
        'conductor', NEW.conductor_nombre,
        'placa', NEW.vehiculo_placa
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enqueue_push_on_solicitud_change
  AFTER UPDATE ON public.solicitudes_pasajero
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_push_on_solicitud_change();