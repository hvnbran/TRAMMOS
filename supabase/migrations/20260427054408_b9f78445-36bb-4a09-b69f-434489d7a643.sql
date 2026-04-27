-- Create public bucket for email assets (logo, etc.) so we can embed them in transactional/auth emails
insert into storage.buckets (id, name, public)
values ('email-assets', 'email-assets', true)
on conflict (id) do update set public = true;

-- Allow public read access to email-assets bucket
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Public read access to email-assets'
  ) then
    create policy "Public read access to email-assets"
      on storage.objects for select
      using (bucket_id = 'email-assets');
  end if;
end$$;