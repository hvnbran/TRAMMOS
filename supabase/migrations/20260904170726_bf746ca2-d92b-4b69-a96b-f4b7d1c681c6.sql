CREATE POLICY "cliente_select_ubicaciones_de_sus_conductores"
ON public.conductor_ubicaciones
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conductores c
    WHERE c.id = conductor_ubicaciones.conductor_id
      AND public.can_access_clientes(c.clientes)
  )
);