
-- ============== 1. Tabla empresas ==============
CREATE TABLE IF NOT EXISTS public.empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  cliente_legacy public.cliente_tipo,
  activo boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_view_empresas" ON public.empresas;
CREATE POLICY "auth_view_empresas" ON public.empresas
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_empresas" ON public.empresas;
CREATE POLICY "admin_manage_empresas" ON public.empresas
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS empresas_set_updated_at ON public.empresas;
CREATE TRIGGER empresas_set_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== 2. Tabla user_empresas ==============
CREATE TABLE IF NOT EXISTS public.user_empresas (
  user_id uuid NOT NULL,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  rol_empresa text NOT NULL DEFAULT 'admin_empresa',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, empresa_id)
);

CREATE INDEX IF NOT EXISTS idx_user_empresas_empresa ON public.user_empresas(empresa_id);

ALTER TABLE public.user_empresas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_view_own_user_empresas" ON public.user_empresas;
CREATE POLICY "user_view_own_user_empresas" ON public.user_empresas
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "admin_manage_user_empresas" ON public.user_empresas;
CREATE POLICY "admin_manage_user_empresas" ON public.user_empresas
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============== 3. Columnas empresa_id en tablas existentes ==============
ALTER TABLE public.registro_invitaciones
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE SET NULL;

ALTER TABLE public.pasajeros_pcd
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE SET NULL;

ALTER TABLE public.conductores
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pasajeros_pcd_empresa ON public.pasajeros_pcd(empresa_id);
CREATE INDEX IF NOT EXISTS idx_conductores_empresa ON public.conductores(empresa_id);
CREATE INDEX IF NOT EXISTS idx_registro_invitaciones_empresa ON public.registro_invitaciones(empresa_id);

-- ============== 4. Helpers de seguridad ==============
CREATE OR REPLACE FUNCTION public.user_empresa_ids(_user uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(empresa_id), '{}')::uuid[]
  FROM public.user_empresas
  WHERE user_id = _user
$$;

CREATE OR REPLACE FUNCTION public.can_access_empresa(_empresa_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.user_empresas
      WHERE user_id = auth.uid() AND empresa_id = _empresa_id
    )
$$;

-- ============== 5. Migración de datos ==============
INSERT INTO public.empresas (nombre, slug, cliente_legacy)
VALUES
  ('Corona',  'corona',  'corona'::public.cliente_tipo),
  ('Sodimac', 'sodimac', 'sodimac'::public.cliente_tipo)
ON CONFLICT (nombre) DO NOTHING;

-- Backfill empresa_id en pasajeros_pcd y conductores según cliente legacy
UPDATE public.pasajeros_pcd p
SET empresa_id = e.id
FROM public.empresas e
WHERE p.empresa_id IS NULL
  AND e.cliente_legacy = p.cliente;

UPDATE public.conductores c
SET empresa_id = e.id
FROM public.empresas e
WHERE c.empresa_id IS NULL
  AND e.cliente_legacy = c.cliente;

UPDATE public.registro_invitaciones r
SET empresa_id = e.id
FROM public.empresas e
WHERE r.empresa_id IS NULL
  AND e.cliente_legacy = r.cliente;

-- Backfill user_empresas: a partir de roles existentes corona/sodimac
INSERT INTO public.user_empresas (user_id, empresa_id, rol_empresa)
SELECT ur.user_id, e.id, 'admin_empresa'
FROM public.user_roles ur
JOIN public.empresas e ON e.cliente_legacy::text = ur.role::text
WHERE ur.role::text IN ('corona', 'sodimac')
ON CONFLICT (user_id, empresa_id) DO NOTHING;
