
CREATE POLICY "self_bootstrap_role" ON public.user_roles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid())
);
