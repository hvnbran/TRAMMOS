-- Catálogo de vehículos
CREATE TABLE public.crm_vehiculos_catalogo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marca text NOT NULL,
  linea text NOT NULL,
  modelo text,
  version text,
  capacidad_pasajeros integer,
  precio_referencia numeric NOT NULL DEFAULT 0,
  costo_referencia numeric NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  foto_url text,
  notas text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_vehiculos_catalogo TO authenticated;
GRANT ALL ON public.crm_vehiculos_catalogo TO service_role;

ALTER TABLE public.crm_vehiculos_catalogo ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_access_all_vehiculos_catalogo ON public.crm_vehiculos_catalogo
  FOR ALL TO authenticated
  USING (public.has_crm_access(auth.uid()))
  WITH CHECK (public.has_crm_access(auth.uid()));

CREATE TRIGGER update_crm_vehiculos_catalogo_updated_at
  BEFORE UPDATE ON public.crm_vehiculos_catalogo
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ventas (cierre de oportunidad)
CREATE TABLE public.crm_ventas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text,
  oportunidad_id uuid,
  cliente_id uuid NOT NULL,
  asesor_id uuid,
  concesionario_id uuid,
  vehiculo_catalogo_id uuid,
  vehiculo_descripcion text NOT NULL,
  placa text,
  fecha_venta date NOT NULL DEFAULT CURRENT_DATE,
  fecha_entrega date,
  estado text NOT NULL DEFAULT 'Confirmada', -- Confirmada, Entregada, Cancelada
  precio_cliente numeric NOT NULL DEFAULT 0,
  costo numeric NOT NULL DEFAULT 0,
  margen numeric GENERATED ALWAYS AS (precio_cliente - costo) STORED,
  comision_asesor numeric NOT NULL DEFAULT 0,
  comision_asesor_pct numeric,
  comision_trammos numeric NOT NULL DEFAULT 0,
  comision_trammos_pct numeric,
  forma_pago text,
  notas text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_ventas_asesor ON public.crm_ventas(asesor_id);
CREATE INDEX idx_crm_ventas_cliente ON public.crm_ventas(cliente_id);
CREATE INDEX idx_crm_ventas_fecha ON public.crm_ventas(fecha_venta);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_ventas TO authenticated;
GRANT ALL ON public.crm_ventas TO service_role;

ALTER TABLE public.crm_ventas ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_access_all_ventas ON public.crm_ventas
  FOR ALL TO authenticated
  USING (public.has_crm_access(auth.uid()))
  WITH CHECK (public.has_crm_access(auth.uid()));

CREATE TRIGGER update_crm_ventas_updated_at
  BEFORE UPDATE ON public.crm_ventas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();