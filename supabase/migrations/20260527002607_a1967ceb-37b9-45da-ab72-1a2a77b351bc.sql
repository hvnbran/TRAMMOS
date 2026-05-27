DELETE FROM public.user_roles
WHERE user_id = '251b4696-1754-4df5-8473-6e3ccd2dc63a'
  AND role = 'pasajero'::app_role;

INSERT INTO public.user_roles (user_id, role)
VALUES ('251b4696-1754-4df5-8473-6e3ccd2dc63a', 'crm'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;