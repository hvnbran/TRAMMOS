
-- 1. Añadir columnas para tiempos de servicio (inicio y fin del viaje)
ALTER TABLE public.solicitudes_pasajero
  ADD COLUMN IF NOT EXISTS iniciado_at timestamptz,
  ADD COLUMN IF NOT EXISTS finalizado_at timestamptz;

ALTER TABLE public.servicios
  ADD COLUMN IF NOT EXISTS iniciado_at timestamptz,
  ADD COLUMN IF NOT EXISTS finalizado_at timestamptz;

-- 2. Resetear datos viejos imprecisos de tiempos
UPDATE public.solicitudes_pasajero
   SET asignado_at = NULL,
       asignado_by = NULL,
       aceptada_at = NULL,
       iniciado_at = NULL,
       finalizado_at = NULL;

UPDATE public.servicios
   SET asignado_at = NULL,
       asignado_by = NULL,
       iniciado_at = NULL,
       finalizado_at = NULL;

-- 3. Trigger en solicitudes_pasajero: registrar inicio/fin del servicio según estado
CREATE OR REPLACE FUNCTION public.track_solicitud_tiempos()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Aceptada: primera vez que pasa de 'solicitada' a algo confirmado
  IF OLD.aceptada_at IS NULL
     AND NEW.estado IN ('aceptada','en_camino','a_bordo','finalizada') THEN
    NEW.aceptada_at := now();
    IF NEW.asignado_by IS NULL THEN
      NEW.asignado_by := auth.uid();
    END IF;
  END IF;

  -- Asignación completa: hay conductor y placa
  IF OLD.asignado_at IS NULL
     AND NEW.conductor_nombre IS NOT NULL
     AND length(trim(NEW.conductor_nombre)) > 0
     AND NEW.vehiculo_placa IS NOT NULL
     AND length(trim(NEW.vehiculo_placa)) > 0 THEN
    NEW.asignado_at := now();
    IF NEW.asignado_by IS NULL THEN
      NEW.asignado_by := auth.uid();
    END IF;
  END IF;

  -- Inicio de servicio: pasajero a bordo o en camino confirmado
  IF OLD.iniciado_at IS NULL
     AND NEW.estado IN ('a_bordo','en_camino') THEN
    NEW.iniciado_at := now();
  END IF;

  -- Fin de servicio: estado finalizada (parar el conteo SIEMPRE aquí)
  IF NEW.estado = 'finalizada' AND NEW.finalizado_at IS NULL THEN
    NEW.finalizado_at := now();
    -- Si nunca se marcó como iniciado, usar aceptada_at o created_at como fallback
    IF NEW.iniciado_at IS NULL THEN
      NEW.iniciado_at := COALESCE(NEW.aceptada_at, NEW.created_at);
    END IF;
  END IF;

  -- Cancelada: limpiar tiempos de servicio (no aplica medición)
  IF NEW.estado = 'cancelada' THEN
    NEW.finalizado_at := COALESCE(NEW.finalizado_at, now());
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_track_solicitud_tiempos ON public.solicitudes_pasajero;
CREATE TRIGGER trg_track_solicitud_tiempos
BEFORE INSERT OR UPDATE ON public.solicitudes_pasajero
FOR EACH ROW EXECUTE FUNCTION public.track_solicitud_tiempos();

-- 4. Trigger en servicios: registrar inicio/fin según estado
CREATE OR REPLACE FUNCTION public.track_servicio_tiempos()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Asignación: cuando ya tiene conductor y vehículo (solo primera vez)
  IF (TG_OP = 'INSERT' OR OLD.asignado_at IS NULL)
     AND NEW.conductor IS NOT NULL
     AND length(trim(NEW.conductor)) > 0
     AND NEW.vehiculo IS NOT NULL
     AND length(trim(NEW.vehiculo)) > 0 THEN
    NEW.asignado_at := now();
    NEW.asignado_by := auth.uid();
  END IF;

  -- Inicio del servicio: estado 'En curso'
  IF (TG_OP = 'INSERT' OR OLD.iniciado_at IS NULL)
     AND NEW.estado = 'En curso' THEN
    NEW.iniciado_at := now();
  END IF;

  -- Fin del servicio: estado 'Finalizado' (PARAR EL CONTEO AQUÍ)
  IF NEW.estado = 'Finalizado' AND NEW.finalizado_at IS NULL THEN
    NEW.finalizado_at := now();
    IF NEW.iniciado_at IS NULL THEN
      NEW.iniciado_at := COALESCE(NEW.asignado_at, NEW.created_at);
    END IF;
  END IF;

  -- Cancelado: parar conteo
  IF NEW.estado = 'Cancelado' AND NEW.finalizado_at IS NULL THEN
    NEW.finalizado_at := now();
  END IF;

  RETURN NEW;
END;
$function$;

-- Reemplazar el trigger viejo (era solo para asignación)
DROP TRIGGER IF EXISTS trg_servicios_track_asignacion ON public.servicios;
DROP TRIGGER IF EXISTS trg_servicios_track_asignacion_insert ON public.servicios;
DROP TRIGGER IF EXISTS trg_track_servicio_tiempos ON public.servicios;
CREATE TRIGGER trg_track_servicio_tiempos
BEFORE INSERT OR UPDATE ON public.servicios
FOR EACH ROW EXECUTE FUNCTION public.track_servicio_tiempos();
