-- ============================================
-- PARTE 1: Vehículos y conductores multi-cliente
-- ============================================

-- Añadir columna clientes (array) a vehiculos
ALTER TABLE public.vehiculos
  ADD COLUMN IF NOT EXISTS clientes cliente_tipo[] NOT NULL DEFAULT '{}';

-- Migrar datos existentes
UPDATE public.vehiculos
   SET clientes = ARRAY[cliente]::cliente_tipo[]
 WHERE cliente IS NOT NULL
   AND (clientes IS NULL OR array_length(clientes, 1) IS NULL);

-- Hacer nullable la columna cliente (para soportar "sin asignar")
ALTER TABLE public.vehiculos ALTER COLUMN cliente DROP NOT NULL;

-- Añadir columna clientes a conductores
ALTER TABLE public.conductores
  ADD COLUMN IF NOT EXISTS clientes cliente_tipo[] NOT NULL DEFAULT '{}';

UPDATE public.conductores
   SET clientes = ARRAY[cliente]::cliente_tipo[]
 WHERE cliente IS NOT NULL
   AND (clientes IS NULL OR array_length(clientes, 1) IS NULL);

ALTER TABLE public.conductores ALTER COLUMN cliente DROP NOT NULL;

-- Función helper: ¿el usuario puede acceder a esta fila multi-cliente?
CREATE OR REPLACE FUNCTION public.can_access_clientes(_clientes cliente_tipo[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(auth.uid(), 'admin')
    OR (_clientes IS NULL OR array_length(_clientes, 1) IS NULL)
    OR EXISTS (
      SELECT 1
      FROM unnest(_clientes) c
      WHERE public.has_role(auth.uid(), c::text::app_role)
    );
$$;

-- Reemplazar policies de vehiculos para usar el array
DROP POLICY IF EXISTS view_vehiculos ON public.vehiculos;
DROP POLICY IF EXISTS insert_vehiculos ON public.vehiculos;
DROP POLICY IF EXISTS update_vehiculos ON public.vehiculos;
DROP POLICY IF EXISTS delete_vehiculos ON public.vehiculos;

CREATE POLICY view_vehiculos ON public.vehiculos
  FOR SELECT USING (public.can_access_clientes(clientes));
CREATE POLICY insert_vehiculos ON public.vehiculos
  FOR INSERT WITH CHECK (public.can_access_clientes(clientes));
CREATE POLICY update_vehiculos ON public.vehiculos
  FOR UPDATE USING (public.can_access_clientes(clientes));
CREATE POLICY delete_vehiculos ON public.vehiculos
  FOR DELETE USING (public.can_access_clientes(clientes));

-- Reemplazar policies de conductores
DROP POLICY IF EXISTS view_conductores ON public.conductores;
DROP POLICY IF EXISTS insert_conductores ON public.conductores;
DROP POLICY IF EXISTS update_conductores ON public.conductores;
DROP POLICY IF EXISTS delete_conductores ON public.conductores;

CREATE POLICY view_conductores ON public.conductores
  FOR SELECT USING (public.can_access_clientes(clientes));
CREATE POLICY insert_conductores ON public.conductores
  FOR INSERT WITH CHECK (public.can_access_clientes(clientes));
CREATE POLICY update_conductores ON public.conductores
  FOR UPDATE USING (public.can_access_clientes(clientes));
CREATE POLICY delete_conductores ON public.conductores
  FOR DELETE USING (public.can_access_clientes(clientes));

-- Índices GIN para consultas de array
CREATE INDEX IF NOT EXISTS idx_vehiculos_clientes ON public.vehiculos USING GIN (clientes);
CREATE INDEX IF NOT EXISTS idx_conductores_clientes ON public.conductores USING GIN (clientes);

-- ============================================
-- PARTE 2: Métricas de tiempos de respuesta
-- ============================================

-- Servicios: marcar cuándo se completa la asignación (conductor + vehiculo)
ALTER TABLE public.servicios
  ADD COLUMN IF NOT EXISTS asignado_at timestamptz,
  ADD COLUMN IF NOT EXISTS asignado_by uuid;

CREATE OR REPLACE FUNCTION public.track_servicio_asignacion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si ya estaba asignado antes, no tocar
  IF OLD.asignado_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.conductor IS NOT NULL
     AND length(trim(NEW.conductor)) > 0
     AND NEW.vehiculo IS NOT NULL
     AND length(trim(NEW.vehiculo)) > 0 THEN
    NEW.asignado_at := now();
    NEW.asignado_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_servicios_track_asignacion ON public.servicios;
CREATE TRIGGER trg_servicios_track_asignacion
  BEFORE UPDATE ON public.servicios
  FOR EACH ROW
  EXECUTE FUNCTION public.track_servicio_asignacion();

-- En INSERT: si ya viene completo, marcar también
CREATE OR REPLACE FUNCTION public.track_servicio_asignacion_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.conductor IS NOT NULL
     AND length(trim(NEW.conductor)) > 0
     AND NEW.vehiculo IS NOT NULL
     AND length(trim(NEW.vehiculo)) > 0 THEN
    NEW.asignado_at := now();
    NEW.asignado_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_servicios_track_asignacion_insert ON public.servicios;
CREATE TRIGGER trg_servicios_track_asignacion_insert
  BEFORE INSERT ON public.servicios
  FOR EACH ROW
  EXECUTE FUNCTION public.track_servicio_asignacion_insert();

-- Solicitudes pasajero: timestamps de aceptación y asignación
ALTER TABLE public.solicitudes_pasajero
  ADD COLUMN IF NOT EXISTS aceptada_at timestamptz,
  ADD COLUMN IF NOT EXISTS asignado_at timestamptz,
  ADD COLUMN IF NOT EXISTS asignado_by uuid;

CREATE OR REPLACE FUNCTION public.track_solicitud_tiempos()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Aceptada: primera vez que estado pasa de 'solicitada' a algo distinto a cancelada
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

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_solicitud_track_tiempos ON public.solicitudes_pasajero;
CREATE TRIGGER trg_solicitud_track_tiempos
  BEFORE UPDATE ON public.solicitudes_pasajero
  FOR EACH ROW
  EXECUTE FUNCTION public.track_solicitud_tiempos();

-- Índices para consultas analíticas
CREATE INDEX IF NOT EXISTS idx_servicios_asignado_at ON public.servicios (asignado_at);
CREATE INDEX IF NOT EXISTS idx_servicios_created_by ON public.servicios (created_by);
CREATE INDEX IF NOT EXISTS idx_solicitudes_asignado_at ON public.solicitudes_pasajero (asignado_at);
CREATE INDEX IF NOT EXISTS idx_solicitudes_aceptada_at ON public.solicitudes_pasajero (aceptada_at);
CREATE INDEX IF NOT EXISTS idx_solicitudes_asignado_by ON public.solicitudes_pasajero (asignado_by);

-- Backfill aproximado: marcar como ya asignados los servicios/solicitudes existentes
-- (usamos updated_at como aproximación del momento de asignación previo a esta migración)
UPDATE public.servicios
   SET asignado_at = updated_at
 WHERE asignado_at IS NULL
   AND conductor IS NOT NULL AND length(trim(conductor)) > 0
   AND vehiculo IS NOT NULL AND length(trim(vehiculo)) > 0;

UPDATE public.solicitudes_pasajero
   SET aceptada_at = updated_at
 WHERE aceptada_at IS NULL
   AND estado IN ('aceptada','en_camino','a_bordo','finalizada');

UPDATE public.solicitudes_pasajero
   SET asignado_at = updated_at
 WHERE asignado_at IS NULL
   AND conductor_nombre IS NOT NULL AND length(trim(conductor_nombre)) > 0
   AND vehiculo_placa IS NOT NULL AND length(trim(vehiculo_placa)) > 0;