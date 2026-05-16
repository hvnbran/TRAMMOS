CREATE POLICY "conductor_select_own_row"
  ON public.conductores
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "conductor_update_own_row"
  ON public.conductores
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());