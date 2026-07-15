
-- =============== servicios_fijos ===============
CREATE TABLE public.servicios_fijos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conductor text NOT NULL,
  vehiculo text,
  pasajero text,
  origen text,
  destino text,
  centro_costo text,
  tipo text,
  cliente text,
  dias_semana int[] NOT NULL DEFAULT '{1,2,3,4,5}',
  hora_inicio_prog time,
  hora_fin_prog time,
  fecha_inicio date NOT NULL DEFAULT current_date,
  fecha_fin date,
  activo boolean NOT NULL DEFAULT true,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.servicios_fijos TO authenticated;
GRANT ALL ON public.servicios_fijos TO service_role;

ALTER TABLE public.servicios_fijos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_servicios_fijos" ON public.servicios_fijos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "conductor_ve_sus_fijos" ON public.servicios_fijos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conductores c
      WHERE c.auth_user_id = auth.uid()
        AND lower(trim(c.nombre)) = lower(trim(servicios_fijos.conductor))
    )
  );

CREATE TRIGGER trg_servicios_fijos_updated_at
  BEFORE UPDATE ON public.servicios_fijos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_servicios_fijos_conductor ON public.servicios_fijos(lower(trim(conductor))) WHERE activo;

-- =============== servicio_fijo_ejecuciones ===============
CREATE TABLE public.servicio_fijo_ejecuciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_fijo_id uuid NOT NULL REFERENCES public.servicios_fijos(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  iniciado_at timestamptz,
  finalizado_at timestamptz,
  estado text NOT NULL DEFAULT 'pendiente',
  notas_conductor text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (servicio_fijo_id, fecha)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.servicio_fijo_ejecuciones TO authenticated;
GRANT ALL ON public.servicio_fijo_ejecuciones TO service_role;

ALTER TABLE public.servicio_fijo_ejecuciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_ejecuciones" ON public.servicio_fijo_ejecuciones
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "conductor_ve_sus_ejecuciones" ON public.servicio_fijo_ejecuciones
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.servicios_fijos sf
      JOIN public.conductores c ON lower(trim(c.nombre)) = lower(trim(sf.conductor))
      WHERE sf.id = servicio_fijo_ejecuciones.servicio_fijo_id
        AND c.auth_user_id = auth.uid()
    )
  );

CREATE TRIGGER trg_ejecuciones_updated_at
  BEFORE UPDATE ON public.servicio_fijo_ejecuciones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============== RPCs ===============

-- Listar servicios fijos de hoy para el conductor autenticado
CREATE OR REPLACE FUNCTION public.listar_fijos_hoy_conductor()
RETURNS TABLE (
  fijo_id uuid,
  pasajero text,
  origen text,
  destino text,
  vehiculo text,
  centro_costo text,
  hora_inicio_prog time,
  hora_fin_prog time,
  ejecucion_id uuid,
  estado text,
  iniciado_at timestamptz,
  finalizado_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sf.id,
    sf.pasajero,
    sf.origen,
    sf.destino,
    sf.vehiculo,
    sf.centro_costo,
    sf.hora_inicio_prog,
    sf.hora_fin_prog,
    e.id,
    COALESCE(e.estado, 'pendiente'),
    e.iniciado_at,
    e.finalizado_at
  FROM public.servicios_fijos sf
  JOIN public.conductores c
    ON lower(trim(c.nombre)) = lower(trim(sf.conductor))
  LEFT JOIN public.servicio_fijo_ejecuciones e
    ON e.servicio_fijo_id = sf.id AND e.fecha = current_date
  WHERE c.auth_user_id = auth.uid()
    AND sf.activo = true
    AND sf.fecha_inicio <= current_date
    AND (sf.fecha_fin IS NULL OR sf.fecha_fin >= current_date)
    AND EXTRACT(DOW FROM current_date)::int = ANY(sf.dias_semana)
  ORDER BY sf.hora_inicio_prog NULLS LAST;
$$;

-- Iniciar la ejecución de hoy
CREATE OR REPLACE FUNCTION public.conductor_iniciar_fijo(_fijo_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_autorizado boolean;
  v_ejec_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_auth');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.servicios_fijos sf
    JOIN public.conductores c ON lower(trim(c.nombre)) = lower(trim(sf.conductor))
    WHERE sf.id = _fijo_id
      AND c.auth_user_id = v_user_id
      AND sf.activo = true
      AND EXTRACT(DOW FROM current_date)::int = ANY(sf.dias_semana)
  ) INTO v_autorizado;

  IF NOT v_autorizado THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  INSERT INTO public.servicio_fijo_ejecuciones (servicio_fijo_id, fecha, iniciado_at, estado)
  VALUES (_fijo_id, current_date, now(), 'en_curso')
  ON CONFLICT (servicio_fijo_id, fecha) DO UPDATE
    SET iniciado_at = COALESCE(public.servicio_fijo_ejecuciones.iniciado_at, EXCLUDED.iniciado_at),
        estado = CASE WHEN public.servicio_fijo_ejecuciones.estado = 'finalizado' THEN 'finalizado' ELSE 'en_curso' END,
        updated_at = now()
  RETURNING id INTO v_ejec_id;

  RETURN jsonb_build_object('ok', true, 'ejecucion_id', v_ejec_id);
END;
$$;

-- Finalizar la ejecución de hoy
CREATE OR REPLACE FUNCTION public.conductor_finalizar_fijo(_fijo_id uuid, _notas text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_autorizado boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_auth');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.servicios_fijos sf
    JOIN public.conductores c ON lower(trim(c.nombre)) = lower(trim(sf.conductor))
    WHERE sf.id = _fijo_id AND c.auth_user_id = v_user_id
  ) INTO v_autorizado;

  IF NOT v_autorizado THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  INSERT INTO public.servicio_fijo_ejecuciones (servicio_fijo_id, fecha, iniciado_at, finalizado_at, estado, notas_conductor)
  VALUES (_fijo_id, current_date, now(), now(), 'finalizado', _notas)
  ON CONFLICT (servicio_fijo_id, fecha) DO UPDATE
    SET finalizado_at = now(),
        estado = 'finalizado',
        notas_conductor = COALESCE(EXCLUDED.notas_conductor, public.servicio_fijo_ejecuciones.notas_conductor),
        updated_at = now();

  RETURN jsonb_build_object('ok', true);
END;
$$;
