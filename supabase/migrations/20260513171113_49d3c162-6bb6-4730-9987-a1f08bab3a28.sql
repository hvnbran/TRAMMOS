
-- Tabla de dispositivos GPS importados desde serverusa.digital (GPSWOX)
CREATE TABLE public.vehiculos_gps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gpswox_device_id BIGINT NOT NULL UNIQUE,
  imei TEXT,
  nombre_dispositivo TEXT NOT NULL,
  grupo TEXT,
  vehiculo_id UUID REFERENCES public.vehiculos(id) ON DELETE SET NULL,
  last_lat DOUBLE PRECISION,
  last_lon DOUBLE PRECISION,
  last_speed_kmh DOUBLE PRECISION,
  last_course DOUBLE PRECISION,
  last_fix_at TIMESTAMPTZ,
  online TEXT,
  bateria TEXT,
  ignicion BOOLEAN,
  icon_color TEXT,
  raw JSONB,
  activo BOOLEAN NOT NULL DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vehiculos_gps_vehiculo_id ON public.vehiculos_gps(vehiculo_id);
CREATE INDEX idx_vehiculos_gps_online ON public.vehiculos_gps(online);

ALTER TABLE public.vehiculos ADD COLUMN IF NOT EXISTS gps_device_id BIGINT;
CREATE INDEX IF NOT EXISTS idx_vehiculos_gps_device_id ON public.vehiculos(gps_device_id);

ALTER TABLE public.vehiculos_gps ENABLE ROW LEVEL SECURITY;

-- Lectura: cualquier usuario autenticado (mapa de monitoreo + pasajero viendo su carro)
CREATE POLICY "auth_view_vehiculos_gps"
  ON public.vehiculos_gps FOR SELECT
  TO authenticated
  USING (true);

-- Escritura: solo admin
CREATE POLICY "admin_insert_vehiculos_gps"
  ON public.vehiculos_gps FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin_update_vehiculos_gps"
  ON public.vehiculos_gps FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin_delete_vehiculos_gps"
  ON public.vehiculos_gps FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_vehiculos_gps_updated_at
  BEFORE UPDATE ON public.vehiculos_gps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER TABLE public.vehiculos_gps REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehiculos_gps;
