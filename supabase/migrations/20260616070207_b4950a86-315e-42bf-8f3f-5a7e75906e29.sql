
DROP FUNCTION IF EXISTS public.get_conductor_publico_por_nombre(text);

CREATE OR REPLACE FUNCTION public.get_conductor_publico_por_nombre(_nombre text)
 RETURNS TABLE(nombre text, telefono text, foto_url text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT c.nombre, c.telefono, c.foto_url
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
$function$;
