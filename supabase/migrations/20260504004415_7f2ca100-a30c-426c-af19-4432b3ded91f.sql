-- Tabla auditable de aceptaciones de políticas (Ley 1581 Colombia)
CREATE TABLE public.policy_acceptances (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid,
  pasajero_id     uuid,
  email           text,
  policy_type     text NOT NULL CHECK (policy_type IN ('terminos','privacidad','datos_sensibles_pcd')),
  policy_version  text NOT NULL,
  accepted_at     timestamptz NOT NULL DEFAULT now(),
  ip              text,
  user_agent      text,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_policy_acceptances_user        ON public.policy_acceptances (user_id, policy_type);
CREATE INDEX idx_policy_acceptances_pasajero    ON public.policy_acceptances (pasajero_id);
CREATE INDEX idx_policy_acceptances_email       ON public.policy_acceptances (lower(email));
CREATE INDEX idx_policy_acceptances_accepted_at ON public.policy_acceptances (accepted_at DESC);

ALTER TABLE public.policy_acceptances ENABLE ROW LEVEL SECURITY;

-- INSERT: el usuario autenticado puede registrar su propia aceptación
CREATE POLICY "user_insert_own_acceptance"
  ON public.policy_acceptances
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- INSERT: staff/admin puede registrar aceptación asociada a un pasajero PCD que pueden ver
CREATE POLICY "staff_insert_pasajero_acceptance"
  ON public.policy_acceptances
  FOR INSERT
  TO authenticated
  WITH CHECK (
    pasajero_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.pasajeros_pcd p
      WHERE p.id = pasajero_id
        AND public.can_access_cliente(p.cliente)
    )
  );

-- SELECT: el propio usuario ve sus aceptaciones
CREATE POLICY "user_view_own_acceptance"
  ON public.policy_acceptances
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- SELECT: admin ve todo
CREATE POLICY "admin_view_all_acceptance"
  ON public.policy_acceptances
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- SELECT: staff con acceso al cliente del pasajero ve las aceptaciones del pasajero
CREATE POLICY "staff_view_pasajero_acceptance"
  ON public.policy_acceptances
  FOR SELECT
  TO authenticated
  USING (
    pasajero_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.pasajeros_pcd p
      WHERE p.id = pasajero_id
        AND public.can_access_cliente(p.cliente)
    )
  );

-- UPDATE/DELETE: solo admin (auditoría inmutable)
CREATE POLICY "admin_update_acceptance"
  ON public.policy_acceptances
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin_delete_acceptance"
  ON public.policy_acceptances
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger: al registrar un pasajero PCD nuevo, exigir consentimiento_datos = true
CREATE OR REPLACE FUNCTION public.require_pcd_consentimiento()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.consentimiento_datos IS NOT TRUE THEN
    RAISE EXCEPTION 'Debe registrarse el consentimiento de tratamiento de datos sensibles antes de crear el pasajero.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_require_pcd_consentimiento ON public.pasajeros_pcd;
CREATE TRIGGER trg_require_pcd_consentimiento
  BEFORE INSERT ON public.pasajeros_pcd
  FOR EACH ROW
  EXECUTE FUNCTION public.require_pcd_consentimiento();