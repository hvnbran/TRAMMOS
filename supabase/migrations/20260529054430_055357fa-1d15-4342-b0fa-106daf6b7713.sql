
-- Fase 1 CRM: Pipeline comercial (oportunidades, interacciones, cotizaciones)

CREATE TABLE public.crm_oportunidades (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid NOT NULL,
  asesor_id uuid,
  concesionario_id uuid,
  titulo text NOT NULL,
  vehiculo_interes text,
  valor_estimado numeric NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'prospecto',
  fuente text,
  motivo_perdida text,
  probabilidad integer NOT NULL DEFAULT 20,
  fecha_cierre_estimada date,
  fecha_cierre_real date,
  notas text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_oportunidades_estado_check
    CHECK (estado IN ('prospecto','contactado','cotizado','negociacion','ganado','perdido')),
  CONSTRAINT crm_oportunidades_probabilidad_check
    CHECK (probabilidad BETWEEN 0 AND 100)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_oportunidades TO authenticated;
GRANT ALL ON public.crm_oportunidades TO service_role;

ALTER TABLE public.crm_oportunidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_access_all_oportunidades ON public.crm_oportunidades
  FOR ALL TO authenticated
  USING (public.has_crm_access(auth.uid()))
  WITH CHECK (public.has_crm_access(auth.uid()));

CREATE INDEX idx_crm_oportunidades_cliente ON public.crm_oportunidades(cliente_id);
CREATE INDEX idx_crm_oportunidades_asesor ON public.crm_oportunidades(asesor_id);
CREATE INDEX idx_crm_oportunidades_estado ON public.crm_oportunidades(estado);

CREATE TRIGGER trg_crm_oportunidades_updated
  BEFORE UPDATE ON public.crm_oportunidades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.crm_interacciones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  oportunidad_id uuid,
  cliente_id uuid NOT NULL,
  asesor_id uuid,
  tipo text NOT NULL DEFAULT 'llamada',
  fecha timestamptz NOT NULL DEFAULT now(),
  nota text,
  proximo_seguimiento timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_interacciones_tipo_check
    CHECK (tipo IN ('llamada','whatsapp','email','visita','cotizacion','reunion','otro'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_interacciones TO authenticated;
GRANT ALL ON public.crm_interacciones TO service_role;

ALTER TABLE public.crm_interacciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_access_all_interacciones ON public.crm_interacciones
  FOR ALL TO authenticated
  USING (public.has_crm_access(auth.uid()))
  WITH CHECK (public.has_crm_access(auth.uid()));

CREATE INDEX idx_crm_interacciones_cliente ON public.crm_interacciones(cliente_id);
CREATE INDEX idx_crm_interacciones_oportunidad ON public.crm_interacciones(oportunidad_id);
CREATE INDEX idx_crm_interacciones_seguimiento ON public.crm_interacciones(proximo_seguimiento);


CREATE TABLE public.crm_cotizaciones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  oportunidad_id uuid,
  cliente_id uuid NOT NULL,
  numero text,
  monto numeric NOT NULL DEFAULT 0,
  vehiculo text,
  vigencia_hasta date,
  estado text NOT NULL DEFAULT 'enviada',
  archivo_url text,
  notas text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_cotizaciones_estado_check
    CHECK (estado IN ('borrador','enviada','aceptada','rechazada','vencida'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_cotizaciones TO authenticated;
GRANT ALL ON public.crm_cotizaciones TO service_role;

ALTER TABLE public.crm_cotizaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_access_all_cotizaciones ON public.crm_cotizaciones
  FOR ALL TO authenticated
  USING (public.has_crm_access(auth.uid()))
  WITH CHECK (public.has_crm_access(auth.uid()));

CREATE INDEX idx_crm_cotizaciones_oportunidad ON public.crm_cotizaciones(oportunidad_id);
CREATE INDEX idx_crm_cotizaciones_cliente ON public.crm_cotizaciones(cliente_id);

CREATE TRIGGER trg_crm_cotizaciones_updated
  BEFORE UPDATE ON public.crm_cotizaciones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
