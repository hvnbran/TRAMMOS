
CREATE OR REPLACE FUNCTION public.sync_conductor_vence_licencia()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conductor_id uuid;
  v_fecha date;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_conductor_id := OLD.conductor_id;
    IF OLD.tipo <> 'licencia_conduccion' THEN RETURN OLD; END IF;
  ELSE
    v_conductor_id := NEW.conductor_id;
    IF NEW.tipo <> 'licencia_conduccion'
       AND (TG_OP = 'INSERT' OR OLD.tipo <> 'licencia_conduccion') THEN
      RETURN NEW;
    END IF;
  END IF;

  SELECT MAX(fecha_vencimiento) INTO v_fecha
  FROM public.conductor_documentos
  WHERE conductor_id = v_conductor_id
    AND tipo = 'licencia_conduccion';

  UPDATE public.conductores
     SET vence_licencia = v_fecha,
         updated_at = now()
   WHERE id = v_conductor_id;

  -- Si el tipo cambió DE licencia_conduccion a otro, también recalcular para el OLD
  IF TG_OP = 'UPDATE' AND OLD.tipo = 'licencia_conduccion' AND NEW.tipo <> 'licencia_conduccion' THEN
    SELECT MAX(fecha_vencimiento) INTO v_fecha
    FROM public.conductor_documentos
    WHERE conductor_id = OLD.conductor_id
      AND tipo = 'licencia_conduccion';
    UPDATE public.conductores
       SET vence_licencia = v_fecha, updated_at = now()
     WHERE id = OLD.conductor_id;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_conductor_vence_licencia ON public.conductor_documentos;
CREATE TRIGGER trg_sync_conductor_vence_licencia
AFTER INSERT OR UPDATE OR DELETE ON public.conductor_documentos
FOR EACH ROW EXECUTE FUNCTION public.sync_conductor_vence_licencia();

-- Backfill: todos los conductores con documento de licencia
UPDATE public.conductores c
   SET vence_licencia = sub.fecha,
       updated_at = now()
  FROM (
    SELECT conductor_id, MAX(fecha_vencimiento) AS fecha
      FROM public.conductor_documentos
     WHERE tipo = 'licencia_conduccion'
     GROUP BY conductor_id
  ) sub
 WHERE c.id = sub.conductor_id
   AND c.vence_licencia IS DISTINCT FROM sub.fecha;
