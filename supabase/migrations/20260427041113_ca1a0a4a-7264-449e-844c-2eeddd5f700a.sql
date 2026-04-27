-- Add expiration tracking fields to document tables
ALTER TABLE public.conductor_documentos
  ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE,
  ADD COLUMN IF NOT EXISTS fecha_emision DATE,
  ADD COLUMN IF NOT EXISTS numero_documento TEXT,
  ADD COLUMN IF NOT EXISTS verificado BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS observaciones TEXT;

ALTER TABLE public.vehiculo_documentos
  ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE,
  ADD COLUMN IF NOT EXISTS fecha_emision DATE,
  ADD COLUMN IF NOT EXISTS numero_documento TEXT,
  ADD COLUMN IF NOT EXISTS verificado BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS observaciones TEXT;

-- Allow UPDATE on document tables
CREATE POLICY "update_conductor_documentos"
  ON public.conductor_documentos
  FOR UPDATE
  USING (can_access_cliente(cliente));

CREATE POLICY "update_vehiculo_documentos"
  ON public.vehiculo_documentos
  FOR UPDATE
  USING (can_access_cliente(cliente));

-- N:M relation between vehicles and drivers
CREATE TABLE IF NOT EXISTS public.vehiculo_conductores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente cliente_tipo NOT NULL,
  vehiculo_id UUID NOT NULL,
  conductor_id UUID NOT NULL,
  es_principal BOOLEAN NOT NULL DEFAULT false,
  asignado_desde DATE NOT NULL DEFAULT CURRENT_DATE,
  asignado_hasta DATE,
  notas TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (vehiculo_id, conductor_id)
);

CREATE INDEX IF NOT EXISTS idx_vehiculo_conductores_vehiculo ON public.vehiculo_conductores(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_vehiculo_conductores_conductor ON public.vehiculo_conductores(conductor_id);

ALTER TABLE public.vehiculo_conductores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_vehiculo_conductores"
  ON public.vehiculo_conductores
  FOR SELECT
  USING (can_access_cliente(cliente));

CREATE POLICY "insert_vehiculo_conductores"
  ON public.vehiculo_conductores
  FOR INSERT
  WITH CHECK (can_access_cliente(cliente));

CREATE POLICY "update_vehiculo_conductores"
  ON public.vehiculo_conductores
  FOR UPDATE
  USING (can_access_cliente(cliente));

CREATE POLICY "delete_vehiculo_conductores"
  ON public.vehiculo_conductores
  FOR DELETE
  USING (can_access_cliente(cliente));

CREATE TRIGGER update_vehiculo_conductores_updated_at
  BEFORE UPDATE ON public.vehiculo_conductores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();