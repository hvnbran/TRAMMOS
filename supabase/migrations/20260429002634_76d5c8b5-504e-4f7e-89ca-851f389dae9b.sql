ALTER TABLE public.conductor_documentos DROP CONSTRAINT IF EXISTS conductor_documentos_tipo_check;
ALTER TABLE public.vehiculo_documentos  DROP CONSTRAINT IF EXISTS vehiculo_documentos_tipo_check;

ALTER TABLE public.conductor_documentos
  ADD CONSTRAINT conductor_documentos_tipo_valid
  CHECK (tipo IS NOT NULL AND length(tipo) BETWEEN 1 AND 64);

ALTER TABLE public.vehiculo_documentos
  ADD CONSTRAINT vehiculo_documentos_tipo_valid
  CHECK (tipo IS NOT NULL AND length(tipo) BETWEEN 1 AND 64);