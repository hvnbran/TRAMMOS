-- Añadir hospital_sur a los enums
ALTER TYPE public.cliente_tipo ADD VALUE IF NOT EXISTS 'hospital_sur';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hospital_sur';

-- Actualizar link_pasajero_to_auth para reconocer hospital_sur como rol prioritario
CREATE OR REPLACE FUNCTION public.link_pasajero_to_auth()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_pasajero RECORD;
  v_has_priority_role boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_auth');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_user_id
      AND role::text IN ('admin','crm','corona','sodimac','hospital_sur','conductor')
  ) INTO v_has_priority_role;

  IF v_has_priority_role THEN
    RETURN jsonb_build_object('ok', false, 'error', 'has_priority_role');
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  IF v_email IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_email');
  END IF;

  SELECT * INTO v_pasajero
  FROM public.pasajeros_pcd
  WHERE lower(email) = lower(v_email)
    AND autorizado = true
  LIMIT 1;

  IF v_pasajero.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authorized');
  END IF;

  UPDATE public.pasajeros_pcd
  SET auth_user_id = v_user_id,
      primer_login_at = COALESCE(primer_login_at, now())
  WHERE id = v_pasajero.id;

  INSERT INTO public.user_roles (user_id, role)
  SELECT v_user_id, 'pasajero'::app_role
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = v_user_id AND role = 'pasajero'::app_role
  );

  RETURN jsonb_build_object(
    'ok', true,
    'pasajero_id', v_pasajero.id,
    'cliente', v_pasajero.cliente
  );
END;
$function$;