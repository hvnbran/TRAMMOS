
-- Tabla de invitaciones de registro de un solo uso
CREATE TABLE public.registro_invitaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  tipo text NOT NULL CHECK (tipo IN ('empresa','pasajero')),
  rol app_role,
  cliente cliente_tipo,
  email_sugerido text,
  display_name_sugerido text,
  datos_sugeridos jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  used_at timestamptz,
  consumed_user_id uuid,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_registro_inv_token ON public.registro_invitaciones (token);
CREATE INDEX idx_registro_inv_created_by ON public.registro_invitaciones (created_by);

ALTER TABLE public.registro_invitaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_registro_inv ON public.registro_invitaciones
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
