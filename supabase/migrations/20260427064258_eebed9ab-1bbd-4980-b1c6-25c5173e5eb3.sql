
-- ===== CALIFICACIONES: nuevas columnas =====
ALTER TABLE public.calificaciones
  ADD COLUMN IF NOT EXISTS solicitud_id uuid,
  ADD COLUMN IF NOT EXISTS pasajero_id uuid,
  ADD COLUMN IF NOT EXISTS conductor text,
  ADD COLUMN IF NOT EXISTS vehiculo text,
  ADD COLUMN IF NOT EXISTS resena text;

CREATE INDEX IF NOT EXISTS calificaciones_solicitud_id_idx ON public.calificaciones(solicitud_id);
CREATE INDEX IF NOT EXISTS calificaciones_pasajero_id_idx ON public.calificaciones(pasajero_id);

-- Permitir que el pasajero inserte/lea sus propias calificaciones
DROP POLICY IF EXISTS "pasajero_insert_own_calificaciones" ON public.calificaciones;
CREATE POLICY "pasajero_insert_own_calificaciones"
  ON public.calificaciones FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "pasajero_select_own_calificaciones" ON public.calificaciones;
CREATE POLICY "pasajero_select_own_calificaciones"
  ON public.calificaciones FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

-- ===== INCIDENTES: nuevas columnas =====
ALTER TABLE public.incidentes
  ADD COLUMN IF NOT EXISTS solicitud_id uuid,
  ADD COLUMN IF NOT EXISTS pasajero_id uuid,
  ADD COLUMN IF NOT EXISTS reportado_por text NOT NULL DEFAULT 'staff';

CREATE INDEX IF NOT EXISTS incidentes_solicitud_id_idx ON public.incidentes(solicitud_id);
CREATE INDEX IF NOT EXISTS incidentes_pasajero_id_idx ON public.incidentes(pasajero_id);

DROP POLICY IF EXISTS "pasajero_insert_own_incidentes" ON public.incidentes;
CREATE POLICY "pasajero_insert_own_incidentes"
  ON public.incidentes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by AND reportado_por = 'pasajero');

DROP POLICY IF EXISTS "pasajero_select_own_incidentes" ON public.incidentes;
CREATE POLICY "pasajero_select_own_incidentes"
  ON public.incidentes FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

-- ===== Trigger: notificar a admins por nuevas calificaciones / incidentes =====
CREATE OR REPLACE FUNCTION public.notify_admins_feedback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid;
  v_title text;
  v_body text;
  v_url text;
  v_tag text;
BEGIN
  IF TG_TABLE_NAME = 'calificaciones' THEN
    v_title := '⭐ Nueva calificación de pasajero';
    v_body := COALESCE('Pasajero: ' || NEW.nombre, 'Pasajero')
              || ' · ' || NEW.estrellas || '/5'
              || COALESCE(' · Conductor: ' || NEW.conductor, '');
    v_url := '/feedback';
    v_tag := 'calif-' || NEW.id::text;
  ELSIF TG_TABLE_NAME = 'incidentes' THEN
    v_title := '🚨 Incidente reportado por pasajero';
    v_body := COALESCE(NEW.tipo_incidente, 'Incidente')
              || COALESCE(' · Conductor: ' || NEW.conductor, '');
    v_url := '/feedback';
    v_tag := 'inc-' || NEW.id::text;
  ELSE
    RETURN NEW;
  END IF;

  FOR v_admin_id IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role
  LOOP
    INSERT INTO public.push_notifications_queue (user_id, title, body, url, tag, data)
    VALUES (
      v_admin_id, v_title, v_body, v_url, v_tag,
      jsonb_build_object('source', TG_TABLE_NAME, 'row_id', NEW.id)
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_calificaciones ON public.calificaciones;
CREATE TRIGGER trg_notify_admins_calificaciones
  AFTER INSERT ON public.calificaciones
  FOR EACH ROW
  WHEN (NEW.tipo = 'conductor' OR NEW.created_by IS NOT NULL)
  EXECUTE FUNCTION public.notify_admins_feedback();

DROP TRIGGER IF EXISTS trg_notify_admins_incidentes ON public.incidentes;
CREATE TRIGGER trg_notify_admins_incidentes
  AFTER INSERT ON public.incidentes
  FOR EACH ROW
  WHEN (NEW.reportado_por = 'pasajero')
  EXECUTE FUNCTION public.notify_admins_feedback();
