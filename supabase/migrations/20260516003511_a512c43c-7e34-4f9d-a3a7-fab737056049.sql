
-- 1. Drop privilege-escalation policy
DROP POLICY IF EXISTS "self_bootstrap_role" ON public.user_roles;

-- 2. Fix can_access_clientes empty-array bypass
CREATE OR REPLACE FUNCTION public.can_access_clientes(_clientes cliente_tipo[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN _clientes IS NULL THEN false
      WHEN array_length(_clientes, 1) IS NULL THEN false
      WHEN public.has_role(auth.uid(), 'admin'::app_role) THEN true
      ELSE EXISTS (
        SELECT 1
        FROM unnest(_clientes) c
        WHERE public.has_role(auth.uid(), c::text::app_role)
      )
    END
$$;

-- 3. Drop plaintext password storage
ALTER TABLE public.conductores DROP COLUMN IF EXISTS password_plain;
ALTER TABLE public.pasajeros_pcd DROP COLUMN IF EXISTS password_backup;
DROP FUNCTION IF EXISTS public.get_conductor_password(uuid);

-- 4. Restrict vehicle photo writes to admin staff
DROP POLICY IF EXISTS "Auth can upload vehiculo fotos" ON storage.objects;
DROP POLICY IF EXISTS "Auth can update vehiculo fotos" ON storage.objects;
DROP POLICY IF EXISTS "Auth can delete vehiculo fotos" ON storage.objects;

CREATE POLICY "Staff can upload vehiculo fotos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'vehiculos-fotos'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'corona'::app_role)
      OR public.has_role(auth.uid(), 'sodimac'::app_role)
    )
  );

CREATE POLICY "Staff can update vehiculo fotos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'vehiculos-fotos'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'corona'::app_role)
      OR public.has_role(auth.uid(), 'sodimac'::app_role)
    )
  );

CREATE POLICY "Staff can delete vehiculo fotos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'vehiculos-fotos'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'corona'::app_role)
      OR public.has_role(auth.uid(), 'sodimac'::app_role)
    )
  );
