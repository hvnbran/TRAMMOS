-- Función segura: devuelve datos públicos de un vehículo
-- sólo si el pasajero autenticado tiene una solicitud activa con esa placa.
CREATE OR REPLACE FUNCTION public.get_vehiculo_publico_por_placa(_placa text)
RETURNS TABLE (
  foto_url text,
  marca text,
  linea text,
  color text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.foto_url, v.marca, v.linea, v.color
  FROM public.vehiculos v
  WHERE upper(trim(v.placa)) = upper(trim(_placa))
    AND EXISTS (
      SELECT 1
      FROM public.solicitudes_pasajero s
      WHERE s.created_by_pasajero = auth.uid()
        AND upper(trim(s.vehiculo_placa)) = upper(trim(_placa))
        AND s.estado IN ('aceptada','en_camino','a_bordo','finalizada')
    )
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_vehiculo_publico_por_placa(text) TO authenticated;