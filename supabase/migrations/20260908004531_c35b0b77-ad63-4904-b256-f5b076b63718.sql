create or replace function public.dispatch_push_now()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform net.http_post(
    url := 'https://trammos.lovable.app/api/public/push/process',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'apikey','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5eG1od2NvdWR0d3dzb2tmY2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDI0OTcsImV4cCI6MjA5MjAxODQ5N30.WeHSx6XO7TRQfHL--6jNYDZ706TtUPCaWGT5MaBInik'
    ),
    body := '{}'::jsonb
  );
  return null;
exception when others then
  return null;
end;
$$;

revoke execute on function public.dispatch_push_now() from public, anon, authenticated;

drop trigger if exists trg_dispatch_push_now on public.push_notifications_queue;
create trigger trg_dispatch_push_now
after insert on public.push_notifications_queue
for each row
when (new.status = 'pending')
execute function public.dispatch_push_now();