-- 1. Add 'pasajero' role to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pasajero';

-- 2. Extend pasajeros_pcd
ALTER TABLE public.pasajeros_pcd
  ADD COLUMN IF NOT EXISTS auth_user_id uuid,
  ADD COLUMN IF NOT EXISTS autorizado boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS direccion_habitual text,
  ADD COLUMN IF NOT EXISTS centros_costo_permitidos text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS password_backup text,
  ADD COLUMN IF NOT EXISTS primer_login_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_pasajeros_pcd_email ON public.pasajeros_pcd (lower(email));
CREATE INDEX IF NOT EXISTS idx_pasajeros_pcd_auth_user_id ON public.pasajeros_pcd (auth_user_id);

-- 3. solicitudes_pasajero table
CREATE TABLE IF NOT EXISTS public.solicitudes_pasajero (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pasajero_pcd_id uuid NOT NULL,
  cliente public.cliente_tipo NOT NULL,
  created_by_pasajero uuid NOT NULL,
  origen text NOT NULL,
  destino text NOT NULL,
  hora_recogida timestamptz NOT NULL DEFAULT now(),
  programado boolean NOT NULL DEFAULT false,
  notas text,
  estado text NOT NULL DEFAULT 'solicitada',
  servicio_id uuid,
  conductor_nombre text,
  vehiculo_placa text,
  cancelado_motivo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_pasajero_user ON public.solicitudes_pasajero (created_by_pasajero, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_solicitudes_pasajero_cliente ON public.solicitudes_pasajero (cliente, estado, created_at DESC);

ALTER TABLE public.solicitudes_pasajero ENABLE ROW LEVEL SECURITY;

-- Pasajero: only own
CREATE POLICY "pasajero_select_own_solicitudes"
  ON public.solicitudes_pasajero FOR SELECT
  USING (auth.uid() = created_by_pasajero);

CREATE POLICY "pasajero_insert_own_solicitudes"
  ON public.solicitudes_pasajero FOR INSERT
  WITH CHECK (auth.uid() = created_by_pasajero);

CREATE POLICY "pasajero_update_own_solicitudes"
  ON public.solicitudes_pasajero FOR UPDATE
  USING (auth.uid() = created_by_pasajero);

CREATE POLICY "pasajero_delete_own_solicitudes"
  ON public.solicitudes_pasajero FOR DELETE
  USING (auth.uid() = created_by_pasajero);

-- Admin/cliente: by cliente
CREATE POLICY "staff_select_solicitudes"
  ON public.solicitudes_pasajero FOR SELECT
  USING (public.can_access_cliente(cliente));

CREATE POLICY "staff_insert_solicitudes"
  ON public.solicitudes_pasajero FOR INSERT
  WITH CHECK (public.can_access_cliente(cliente));

CREATE POLICY "staff_update_solicitudes"
  ON public.solicitudes_pasajero FOR UPDATE
  USING (public.can_access_cliente(cliente));

CREATE POLICY "staff_delete_solicitudes"
  ON public.solicitudes_pasajero FOR DELETE
  USING (public.can_access_cliente(cliente));

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_solicitudes_pasajero_updated_at ON public.solicitudes_pasajero;
CREATE TRIGGER update_solicitudes_pasajero_updated_at
  BEFORE UPDATE ON public.solicitudes_pasajero
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Function to link pasajero to auth user on first login
CREATE OR REPLACE FUNCTION public.link_pasajero_to_auth()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_pasajero RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_auth');
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  IF v_email IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_email');
  END IF;

  SELECT * INTO v_pasajero
  FROM public.pasajeros_pcd
  WHERE lower(email) = lower(v_email)
    AND autorizado = true
  LIMIT 1;

  IF v_pasajero.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authorized');
  END IF;

  -- Link auth user id
  UPDATE public.pasajeros_pcd
  SET auth_user_id = v_user_id,
      primer_login_at = COALESCE(primer_login_at, now())
  WHERE id = v_pasajero.id;

  -- Assign pasajero role if missing
  INSERT INTO public.user_roles (user_id, role)
  SELECT v_user_id, 'pasajero'::app_role
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = v_user_id AND role = 'pasajero'::app_role
  );

  RETURN jsonb_build_object(
    'ok', true,
    'pasajero_id', v_pasajero.id,
    'cliente', v_pasajero.cliente
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_pasajero_to_auth() TO authenticated;

-- 5. Function to check if email is authorized (for pre-OTP validation)
CREATE OR REPLACE FUNCTION public.is_pasajero_email_authorized(_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pasajeros_pcd
    WHERE lower(email) = lower(_email) AND autorizado = true
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_pasajero_email_authorized(text) TO anon, authenticated;

-- 6. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.solicitudes_pasajero;
ALTER TABLE public.solicitudes_pasajero REPLICA IDENTITY FULL;