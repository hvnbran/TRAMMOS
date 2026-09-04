-- Multidestino: paradas por servicio
ALTER TABLE public.servicios ADD COLUMN IF NOT EXISTS es_multidestino boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.servicio_paradas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  servicio_id uuid NOT NULL REFERENCES public.servicios(id) ON DELETE CASCADE,
  orden integer NOT NULL DEFAULT 1,
  direccion text NOT NULL,
  hora_estimada text,
  nota text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_servicio_paradas_servicio ON public.servicio_paradas(servicio_id, orden);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.servicio_paradas TO authenticated;
GRANT ALL ON public.servicio_paradas TO service_role;

ALTER TABLE public.servicio_paradas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_servicio_paradas" ON public.servicio_paradas FOR SELECT
USING (EXISTS (SELECT 1 FROM public.servicios s WHERE s.id = servicio_paradas.servicio_id AND public.can_access_cliente(s.cliente)));

CREATE POLICY "insert_servicio_paradas" ON public.servicio_paradas FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.servicios s WHERE s.id = servicio_paradas.servicio_id AND public.can_access_cliente(s.cliente)));

CREATE POLICY "update_servicio_paradas" ON public.servicio_paradas FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.servicios s WHERE s.id = servicio_paradas.servicio_id AND public.can_access_cliente(s.cliente)));

CREATE POLICY "delete_servicio_paradas" ON public.servicio_paradas FOR DELETE
USING (EXISTS (SELECT 1 FROM public.servicios s WHERE s.id = servicio_paradas.servicio_id AND public.can_access_cliente(s.cliente)));

CREATE POLICY "conductor_select_paradas" ON public.servicio_paradas FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.servicios s
  JOIN public.conductores c ON c.auth_user_id = auth.uid()
  WHERE s.id = servicio_paradas.servicio_id
    AND lower(trim(c.nombre)) = lower(trim(s.conductor))
));

CREATE TRIGGER update_servicio_paradas_updated_at BEFORE UPDATE ON public.servicio_paradas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Consecutivo de orden de servicio: OS-000123
CREATE SEQUENCE IF NOT EXISTS public.orden_servicio_seq;

CREATE OR REPLACE FUNCTION public.siguiente_orden_servicio()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _max integer;
  _n bigint;
BEGIN
  -- Alinear la secuencia con el mayor consecutivo existente (una sola vez / por si acaso)
  SELECT COALESCE(MAX((regexp_replace(numero_orden, '\D', '', 'g'))::integer), 0)
    INTO _max
    FROM public.servicios
   WHERE numero_orden ~ '^OS-?\d+$';

  IF _max IS NOT NULL AND _max >= COALESCE(last_value, 0) THEN
    PERFORM setval('public.orden_servicio_seq', _max);
  END IF;

  _n := nextval('public.orden_servicio_seq');
  RETURN 'OS-' || lpad(_n::text, 6, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.siguiente_orden_servicio() TO authenticated, service_role;