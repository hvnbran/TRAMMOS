-- Add password_plain column to store retrievable password for admins
ALTER TABLE public.conductores ADD COLUMN IF NOT EXISTS password_plain text;

-- Update set_conductor_password to also store the plaintext (for admin retrieval)
CREATE OR REPLACE FUNCTION public.set_conductor_password(_conductor_id uuid, _password text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF length(_password) < 6 THEN
    RAISE EXCEPTION 'La contraseña debe tener al menos 6 caracteres';
  END IF;

  UPDATE public.conductores
  SET password_hash = extensions.crypt(_password, extensions.gen_salt('bf', 10)),
      password_plain = _password,
      acceso_habilitado = true,
      updated_at = now()
  WHERE id = _conductor_id;
END;
$function$;

-- Function for admins to retrieve a conductor's current password
CREATE OR REPLACE FUNCTION public.get_conductor_password(_conductor_id uuid)
 RETURNS TABLE(password text, acceso_habilitado boolean, primer_login_at timestamptz)
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT c.password_plain, c.acceso_habilitado, c.primer_login_at
  FROM public.conductores c
  WHERE c.id = _conductor_id
  LIMIT 1;
END;
$function$;