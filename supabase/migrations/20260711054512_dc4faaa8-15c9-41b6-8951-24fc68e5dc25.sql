
-- Add hospital_sur to enums
ALTER TYPE public.cliente_tipo ADD VALUE IF NOT EXISTS 'hospital_sur';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hospital_sur';
