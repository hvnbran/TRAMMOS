-- Add photo column to vehiculos
ALTER TABLE public.vehiculos ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Create public bucket for vehicle photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehiculos-fotos', 'vehiculos-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Vehiculos fotos publicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehiculos-fotos');

-- Authenticated upload
CREATE POLICY "Auth can upload vehiculo fotos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vehiculos-fotos');

-- Authenticated update
CREATE POLICY "Auth can update vehiculo fotos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'vehiculos-fotos');

-- Authenticated delete
CREATE POLICY "Auth can delete vehiculo fotos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'vehiculos-fotos');