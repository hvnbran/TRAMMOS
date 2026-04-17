-- Storage bucket privado para documentos
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', false)
ON CONFLICT (id) DO NOTHING;

-- Tabla de documentos de conductores
CREATE TABLE public.conductor_documentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conductor_id UUID NOT NULL REFERENCES public.conductores(id) ON DELETE CASCADE,
  cliente public.cliente_tipo NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('poliza_arl','licencia_conduccion','tarjeta_operacion')),
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_conductor_documentos_conductor ON public.conductor_documentos(conductor_id);
ALTER TABLE public.conductor_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY view_conductor_documentos ON public.conductor_documentos FOR SELECT USING (public.can_access_cliente(cliente));
CREATE POLICY insert_conductor_documentos ON public.conductor_documentos FOR INSERT WITH CHECK (public.can_access_cliente(cliente));
CREATE POLICY delete_conductor_documentos ON public.conductor_documentos FOR DELETE USING (public.can_access_cliente(cliente));

-- Tabla de documentos de vehículos
CREATE TABLE public.vehiculo_documentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehiculo_id UUID NOT NULL REFERENCES public.vehiculos(id) ON DELETE CASCADE,
  cliente public.cliente_tipo NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('tarjeta_operacion','soat','tecnico_mecanica')),
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vehiculo_documentos_vehiculo ON public.vehiculo_documentos(vehiculo_id);
ALTER TABLE public.vehiculo_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY view_vehiculo_documentos ON public.vehiculo_documentos FOR SELECT USING (public.can_access_cliente(cliente));
CREATE POLICY insert_vehiculo_documentos ON public.vehiculo_documentos FOR INSERT WITH CHECK (public.can_access_cliente(cliente));
CREATE POLICY delete_vehiculo_documentos ON public.vehiculo_documentos FOR DELETE USING (public.can_access_cliente(cliente));

-- Storage policies para bucket 'documentos'
-- Estructura de path: {cliente}/{conductores|vehiculos}/{entity_id}/{tipo}-{timestamp}.{ext}
CREATE POLICY "view docs by cliente" ON storage.objects FOR SELECT
  USING (bucket_id = 'documentos' AND public.can_access_cliente((storage.foldername(name))[1]::public.cliente_tipo));

CREATE POLICY "upload docs by cliente" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documentos' AND public.can_access_cliente((storage.foldername(name))[1]::public.cliente_tipo));

CREATE POLICY "delete docs by cliente" ON storage.objects FOR DELETE
  USING (bucket_id = 'documentos' AND public.can_access_cliente((storage.foldername(name))[1]::public.cliente_tipo));