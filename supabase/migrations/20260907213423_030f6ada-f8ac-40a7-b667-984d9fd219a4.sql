CREATE OR REPLACE FUNCTION public.enqueue_push_on_servicio_asignado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid;
  _titulo text;
  _cuerpo text;
BEGIN
  IF NEW.conductor IS NULL OR btrim(NEW.conductor) = '' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND COALESCE(OLD.conductor, '') = COALESCE(NEW.conductor, '') THEN
    RETURN NEW;
  END IF;

  SELECT c.auth_user_id INTO _uid
  FROM public.conductores c
  WHERE lower(btrim(c.nombre)) = lower(btrim(NEW.conductor))
    AND c.auth_user_id IS NOT NULL
  LIMIT 1;

  IF _uid IS NULL THEN
    RETURN NEW;
  END IF;

  _titulo := 'Nuevo servicio asignado';
  _cuerpo := to_char(NEW.fecha, 'DD/MM') || COALESCE(' ' || NEW.hora, '') ||
             COALESCE(' · ' || NEW.origen, '') || COALESCE(' → ' || NEW.destino, '');

  INSERT INTO public.push_notifications_queue (user_id, title, body, url, tag, data)
  VALUES (
    _uid,
    _titulo,
    _cuerpo,
    '/conductor/servicio/' || NEW.id::text,
    'servicio-' || NEW.id::text,
    jsonb_build_object('servicio_id', NEW.id, 'tipo', 'servicio_asignado')
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_push_on_servicio_asignado ON public.servicios;
CREATE TRIGGER trg_enqueue_push_on_servicio_asignado
  AFTER INSERT OR UPDATE OF conductor ON public.servicios
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_push_on_servicio_asignado();