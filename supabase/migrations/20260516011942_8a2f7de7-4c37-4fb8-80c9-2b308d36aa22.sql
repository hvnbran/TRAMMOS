
CREATE POLICY admin_view_all_vehiculos ON public.vehiculos
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY admin_update_all_vehiculos ON public.vehiculos
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY admin_insert_vehiculos ON public.vehiculos
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY admin_delete_vehiculos ON public.vehiculos
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
