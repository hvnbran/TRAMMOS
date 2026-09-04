REVOKE EXECUTE ON FUNCTION public.siguiente_orden_servicio() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.siguiente_orden_servicio() TO authenticated, service_role;