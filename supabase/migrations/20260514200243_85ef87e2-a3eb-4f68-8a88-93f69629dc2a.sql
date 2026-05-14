
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Quitar job previo si existía
DO $$
BEGIN
  PERFORM cron.unschedule('trammos-gps-sync-30s');
EXCEPTION WHEN OTHERS THEN NULL;
END$$;

SELECT cron.schedule(
  'trammos-gps-sync-30s',
  '30 seconds',
  $cron$
  SELECT net.http_post(
    url := 'https://project--bdf59e75-ba41-4181-9cd2-66cdff5e0a6a.lovable.app/api/public/gps/sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5eG1od2NvdWR0d3dzb2tmY2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDI0OTcsImV4cCI6MjA5MjAxODQ5N30.WeHSx6XO7TRQfHL--6jNYDZ706TtUPCaWGT5MaBInik'
    ),
    body := '{}'::jsonb
  );
  $cron$
);
