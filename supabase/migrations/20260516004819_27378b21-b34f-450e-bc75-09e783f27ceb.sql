
-- ============= 1. GPS sensor columns =============
ALTER TABLE public.vehiculos_gps
  ADD COLUMN IF NOT EXISTS direccion text,
  ADD COLUMN IF NOT EXISTS bateria_gps integer,
  ADD COLUMN IF NOT EXISTS bateria_vehiculo numeric,
  ADD COLUMN IF NOT EXISTS sim_signal integer,
  ADD COLUMN IF NOT EXISTS satelites integer,
  ADD COLUMN IF NOT EXISTS kilometraje numeric,
  ADD COLUMN IF NOT EXISTS bloqueo boolean,
  ADD COLUMN IF NOT EXISTS novedad text,
  ADD COLUMN IF NOT EXISTS estado_desde timestamptz;

-- ============= 2. pg_cron every 30 seconds =============
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any previous schedule, then re-create both 30s offsets
SELECT cron.unschedule(jobid)
  FROM cron.job
 WHERE jobname IN ('trammos-gps-sync-00','trammos-gps-sync-30');

SELECT cron.schedule(
  'trammos-gps-sync-00',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://trammos.lovable.app/api/public/gps/sync',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'apikey','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5eG1od2NvdWR0d3dzb2tmY2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDI0OTcsImV4cCI6MjA5MjAxODQ5N30.WeHSx6XO7TRQfHL--6jNYDZ706TtUPCaWGT5MaBInik'
    ),
    body := '{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'trammos-gps-sync-30',
  '* * * * *',
  $$
  SELECT pg_sleep(30);
  SELECT net.http_post(
    url := 'https://trammos.lovable.app/api/public/gps/sync',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'apikey','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5eG1od2NvdWR0d3dzb2tmY2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDI0OTcsImV4cCI6MjA5MjAxODQ5N30.WeHSx6XO7TRQfHL--6jNYDZ706TtUPCaWGT5MaBInik'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ============= 3. Admin reads for /cuentas module =============
-- Admin can view all conductores (regardless of clientes[] filter)
DROP POLICY IF EXISTS admin_view_all_conductores ON public.conductores;
CREATE POLICY admin_view_all_conductores ON public.conductores
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS admin_update_all_conductores ON public.conductores;
CREATE POLICY admin_update_all_conductores ON public.conductores
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS admin_insert_conductores ON public.conductores;
CREATE POLICY admin_insert_conductores ON public.conductores
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Same for pasajeros_pcd
DROP POLICY IF EXISTS admin_view_all_pasajeros ON public.pasajeros_pcd;
CREATE POLICY admin_view_all_pasajeros ON public.pasajeros_pcd
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS admin_update_all_pasajeros ON public.pasajeros_pcd;
CREATE POLICY admin_update_all_pasajeros ON public.pasajeros_pcd
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS admin_insert_pasajeros ON public.pasajeros_pcd;
CREATE POLICY admin_insert_pasajeros ON public.pasajeros_pcd
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
