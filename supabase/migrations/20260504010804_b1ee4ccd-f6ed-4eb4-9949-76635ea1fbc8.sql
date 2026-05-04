revoke execute on function public.set_conductor_password(uuid, text) from public, anon;
revoke execute on function public.link_conductor_to_auth(text) from public, anon;
revoke execute on function public.conductor_set_estado_servicio(uuid, text, text) from public, anon;
revoke execute on function public.get_pasajero_brief_for_conductor(uuid) from public, anon;