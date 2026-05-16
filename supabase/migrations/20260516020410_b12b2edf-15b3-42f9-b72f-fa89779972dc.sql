-- 1) Drop GPSWox table and FK column
ALTER TABLE public.vehiculos DROP COLUMN IF EXISTS gps_device_id;
DROP TABLE IF EXISTS public.vehiculos_gps CASCADE;

-- 2) New table: one row per conductor, upserted from their phone
CREATE TABLE public.conductor_ubicaciones (
  conductor_id uuid PRIMARY KEY REFERENCES public.conductores(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  accuracy double precision,
  speed_kmh double precision,
  heading double precision,
  online boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_conductor_ubicaciones_online ON public.conductor_ubicaciones(online) WHERE online = true;
CREATE INDEX idx_conductor_ubicaciones_updated_at ON public.conductor_ubicaciones(updated_at DESC);

ALTER TABLE public.conductor_ubicaciones ENABLE ROW LEVEL SECURITY;

-- 3) RLS: conductor manages own row (via conductores.auth_user_id)
CREATE POLICY conductor_select_own_ubicacion
  ON public.conductor_ubicaciones FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conductores c
    WHERE c.id = conductor_ubicaciones.conductor_id
      AND c.auth_user_id = auth.uid()
  ));

CREATE POLICY conductor_insert_own_ubicacion
  ON public.conductor_ubicaciones FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.conductores c
    WHERE c.id = conductor_ubicaciones.conductor_id
      AND c.auth_user_id = auth.uid()
  ));

CREATE POLICY conductor_update_own_ubicacion
  ON public.conductor_ubicaciones FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conductores c
    WHERE c.id = conductor_ubicaciones.conductor_id
      AND c.auth_user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.conductores c
    WHERE c.id = conductor_ubicaciones.conductor_id
      AND c.auth_user_id = auth.uid()
  ));

-- Admin sees everything
CREATE POLICY admin_select_all_ubicaciones
  ON public.conductor_ubicaciones FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 4) Secure function so a passenger can read their assigned conductor's live position
CREATE OR REPLACE FUNCTION public.get_ubicacion_conductor_para_pasajero(_nombre_conductor text)
RETURNS TABLE(
  lat double precision,
  lng double precision,
  speed_kmh double precision,
  heading double precision,
  online boolean,
  updated_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.lat, u.lng, u.speed_kmh, u.heading, u.online, u.updated_at
  FROM public.conductor_ubicaciones u
  JOIN public.conductores c ON c.id = u.conductor_id
  WHERE lower(trim(c.nombre)) = lower(trim(_nombre_conductor))
    AND EXISTS (
      SELECT 1 FROM public.solicitudes_pasajero s
      WHERE s.created_by_pasajero = auth.uid()
        AND lower(trim(s.conductor_nombre)) = lower(trim(_nombre_conductor))
        AND s.estado IN ('aceptada','en_camino','a_bordo')
    )
  LIMIT 1;
$$;

-- 5) Enable Realtime
ALTER TABLE public.conductor_ubicaciones REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conductor_ubicaciones;