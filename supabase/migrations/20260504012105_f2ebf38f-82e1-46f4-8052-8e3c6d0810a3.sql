CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DROP FUNCTION IF EXISTS public.set_conductor_password(uuid, text);
DROP FUNCTION IF EXISTS public.verify_conductor_password(text, text);

CREATE FUNCTION public.set_conductor_password(_conductor_id uuid, _password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF length(_password) < 6 THEN
    RAISE EXCEPTION 'La contraseña debe tener al menos 6 caracteres';
  END IF;

  UPDATE public.conductores
  SET password_hash = extensions.crypt(_password, extensions.gen_salt('bf', 10)),
      acceso_habilitado = true,
      updated_at = now()
  WHERE id = _conductor_id;
END;
$$;

CREATE FUNCTION public.verify_conductor_password(_cedula text, _password text)
RETURNS TABLE(conductor_id uuid, nombre text, ok boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id,
         c.nombre,
         (c.password_hash IS NOT NULL
          AND c.acceso_habilitado = true
          AND c.password_hash = extensions.crypt(_password, c.password_hash)) AS ok
  FROM public.conductores c
  WHERE c.cedula = _cedula
  LIMIT 1;
END;
$$;