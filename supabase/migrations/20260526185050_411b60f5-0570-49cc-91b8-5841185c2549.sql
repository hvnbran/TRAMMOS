
-- Enum para temperatura del lead
CREATE TYPE public.crm_temperatura AS ENUM ('frio', 'tibio', 'caliente');

-- Concesionarios
CREATE TABLE public.crm_concesionarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  ciudad TEXT,
  direccion TEXT,
  telefono TEXT,
  email TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  activo BOOLEAN NOT NULL DEFAULT true,
  notas TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_concesionarios TO authenticated;
GRANT ALL ON public.crm_concesionarios TO service_role;

ALTER TABLE public.crm_concesionarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_crm_concesionarios" ON public.crm_concesionarios
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_crm_concesionarios_updated_at
  BEFORE UPDATE ON public.crm_concesionarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Asesores
CREATE TABLE public.crm_asesores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  cedula TEXT,
  telefono TEXT,
  email TEXT,
  fecha_nacimiento DATE,
  cargo TEXT,
  concesionario_id UUID REFERENCES public.crm_concesionarios(id) ON DELETE SET NULL,
  foto_url TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  notas TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_asesores TO authenticated;
GRANT ALL ON public.crm_asesores TO service_role;

ALTER TABLE public.crm_asesores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_crm_asesores" ON public.crm_asesores
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_crm_asesores_concesionario ON public.crm_asesores(concesionario_id);

CREATE TRIGGER trg_crm_asesores_updated_at
  BEFORE UPDATE ON public.crm_asesores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Clientes (leads)
CREATE TABLE public.crm_clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  cedula TEXT,
  telefono TEXT,
  email TEXT,
  fecha_nacimiento DATE,
  direccion TEXT,
  ciudad TEXT,
  temperatura public.crm_temperatura NOT NULL DEFAULT 'frio',
  asesor_id UUID REFERENCES public.crm_asesores(id) ON DELETE SET NULL,
  concesionario_id UUID REFERENCES public.crm_concesionarios(id) ON DELETE SET NULL,
  origen TEXT,
  notas TEXT,
  ultima_interaccion DATE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_clientes TO authenticated;
GRANT ALL ON public.crm_clientes TO service_role;

ALTER TABLE public.crm_clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_crm_clientes" ON public.crm_clientes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_crm_clientes_asesor ON public.crm_clientes(asesor_id);
CREATE INDEX idx_crm_clientes_concesionario ON public.crm_clientes(concesionario_id);
CREATE INDEX idx_crm_clientes_temperatura ON public.crm_clientes(temperatura);

CREATE TRIGGER trg_crm_clientes_updated_at
  BEFORE UPDATE ON public.crm_clientes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
