-- Helper: has CRM access (admin OR crm role)
CREATE OR REPLACE FUNCTION public.has_crm_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role)
      OR public.has_role(_user_id, 'crm'::app_role)
$$;

-- Update RLS to allow admin OR crm
DROP POLICY IF EXISTS "admin_all_crm_concesionarios" ON public.crm_concesionarios;
CREATE POLICY "crm_access_all_concesionarios" ON public.crm_concesionarios
  FOR ALL TO authenticated
  USING (public.has_crm_access(auth.uid()))
  WITH CHECK (public.has_crm_access(auth.uid()));

DROP POLICY IF EXISTS "admin_all_crm_asesores" ON public.crm_asesores;
CREATE POLICY "crm_access_all_asesores" ON public.crm_asesores
  FOR ALL TO authenticated
  USING (public.has_crm_access(auth.uid()))
  WITH CHECK (public.has_crm_access(auth.uid()));

DROP POLICY IF EXISTS "admin_all_crm_clientes" ON public.crm_clientes;
CREATE POLICY "crm_access_all_clientes" ON public.crm_clientes
  FOR ALL TO authenticated
  USING (public.has_crm_access(auth.uid()))
  WITH CHECK (public.has_crm_access(auth.uid()));