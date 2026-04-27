CREATE OR REPLACE FUNCTION public.get_conductor_publico_por_nombre(_nombre text)
RETURNS TABLE (
  nombre text,
  telefono text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.nombre, c.telefono
  FROM public.conductores c
  WHERE lower(trim(c.nombre)) = lower(trim(_nombre))
    AND EXISTS (
      SELECT 1
      FROM public.solicitudes_pasajero s
      WHERE s.created_by_pasajero = auth.uid()
        AND lower(trim(s.conductor_nombre)) = lower(trim(_nombre))
        AND s.estado IN ('aceptada','en_camino','a_bordo','finalizada')
    )
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_conductor_publico_por_nombre(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_conductor_publico_por_nombre(text) TO authenticated;