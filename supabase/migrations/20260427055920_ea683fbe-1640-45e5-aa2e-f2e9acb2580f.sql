-- Allow a logged-in passenger to view their own pasajeros_pcd row
CREATE POLICY "pasajero_view_own_row"
ON public.pasajeros_pcd
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

-- Allow a logged-in passenger to update their own pasajeros_pcd row
CREATE POLICY "pasajero_update_own_row"
ON public.pasajeros_pcd
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());