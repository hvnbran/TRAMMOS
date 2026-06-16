ALTER TABLE public.conductor_documentos ADD COLUMN IF NOT EXISTS requiere_actualizacion boolean NOT NULL DEFAULT false;
ALTER TABLE public.conductor_documentos ADD COLUMN IF NOT EXISTS requiere_actualizacion_at timestamptz;
ALTER TABLE public.vehiculo_documentos ADD COLUMN IF NOT EXISTS requiere_actualizacion boolean NOT NULL DEFAULT false;
ALTER TABLE public.vehiculo_documentos ADD COLUMN IF NOT EXISTS requiere_actualizacion_at timestamptz;