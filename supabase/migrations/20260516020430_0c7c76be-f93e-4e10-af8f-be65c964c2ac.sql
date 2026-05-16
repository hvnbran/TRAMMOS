REVOKE EXECUTE ON FUNCTION public.get_ubicacion_conductor_para_pasajero(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ubicacion_conductor_para_pasajero(text) TO authenticated;