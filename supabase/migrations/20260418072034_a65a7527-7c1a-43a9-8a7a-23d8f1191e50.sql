-- Tabla: centros_costo (rutas operativas con tarifa)
CREATE TABLE public.centros_costo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente public.cliente_tipo NOT NULL,
  codigo TEXT NOT NULL,
  origen TEXT NOT NULL,
  destino TEXT NOT NULL,
  departamento TEXT,
  tipo TEXT NOT NULL DEFAULT 'Empresarial',
  tarifa NUMERIC(12,2) NOT NULL DEFAULT 0,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (cliente, codigo)
);

ALTER TABLE public.centros_costo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_centros_costo" ON public.centros_costo
  FOR SELECT USING (public.can_access_cliente(cliente));
CREATE POLICY "insert_centros_costo" ON public.centros_costo
  FOR INSERT WITH CHECK (public.can_access_cliente(cliente));
CREATE POLICY "update_centros_costo" ON public.centros_costo
  FOR UPDATE USING (public.can_access_cliente(cliente));
CREATE POLICY "delete_centros_costo" ON public.centros_costo
  FOR DELETE USING (public.can_access_cliente(cliente));

CREATE TRIGGER update_centros_costo_updated_at
  BEFORE UPDATE ON public.centros_costo
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_centros_costo_cliente ON public.centros_costo(cliente);

-- Tabla: facturas
CREATE TABLE public.facturas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente public.cliente_tipo NOT NULL,
  numero TEXT NOT NULL,
  periodo TEXT NOT NULL,
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_pago DATE,
  servicios_incluidos INTEGER NOT NULL DEFAULT 0,
  monto NUMERIC(14,2) NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'Pendiente',
  notas TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (cliente, numero)
);

ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_facturas" ON public.facturas
  FOR SELECT USING (public.can_access_cliente(cliente));
CREATE POLICY "insert_facturas" ON public.facturas
  FOR INSERT WITH CHECK (public.can_access_cliente(cliente));
CREATE POLICY "update_facturas" ON public.facturas
  FOR UPDATE USING (public.can_access_cliente(cliente));
CREATE POLICY "delete_facturas" ON public.facturas
  FOR DELETE USING (public.can_access_cliente(cliente));

CREATE TRIGGER update_facturas_updated_at
  BEFORE UPDATE ON public.facturas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_facturas_cliente ON public.facturas(cliente);
CREATE INDEX idx_facturas_estado ON public.facturas(cliente, estado);