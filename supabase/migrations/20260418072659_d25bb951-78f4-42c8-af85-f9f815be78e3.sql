-- Tabla: formatos_auditoria
CREATE TABLE public.formatos_auditoria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente public.cliente_tipo NOT NULL,
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'cliente', -- 'cliente' | 'vendedor'
  entidad TEXT NOT NULL, -- nombre del cliente o vendedor auditado
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  estado TEXT NOT NULL DEFAULT 'Pendiente', -- Pendiente | En revisión | Completado
  vehiculos_auditados INTEGER NOT NULL DEFAULT 0,
  storage_path TEXT,
  file_name TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  notas TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (cliente, codigo)
);

ALTER TABLE public.formatos_auditoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_formatos_auditoria" ON public.formatos_auditoria
  FOR SELECT USING (public.can_access_cliente(cliente));
CREATE POLICY "insert_formatos_auditoria" ON public.formatos_auditoria
  FOR INSERT WITH CHECK (public.can_access_cliente(cliente));
CREATE POLICY "update_formatos_auditoria" ON public.formatos_auditoria
  FOR UPDATE USING (public.can_access_cliente(cliente));
CREATE POLICY "delete_formatos_auditoria" ON public.formatos_auditoria
  FOR DELETE USING (public.can_access_cliente(cliente));

CREATE TRIGGER update_formatos_auditoria_updated_at
  BEFORE UPDATE ON public.formatos_auditoria
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_formatos_auditoria_cliente ON public.formatos_auditoria(cliente);
CREATE INDEX idx_formatos_auditoria_tipo ON public.formatos_auditoria(cliente, tipo);