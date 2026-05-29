
CREATE TABLE public.crm_creditos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid NOT NULL,
  oportunidad_id uuid,
  venta_id uuid,
  asesor_id uuid,
  entidad text NOT NULL,
  valor_financiado numeric NOT NULL DEFAULT 0,
  cuota_inicial numeric NOT NULL DEFAULT 0,
  plazo_meses integer,
  tasa_mensual numeric,
  cuota_mensual numeric,
  estado text NOT NULL DEFAULT 'Solicitado',
  fecha_solicitud date NOT NULL DEFAULT CURRENT_DATE,
  fecha_aprobacion date,
  fecha_desembolso date,
  dias_mora integer NOT NULL DEFAULT 0,
  saldo_pendiente numeric,
  motivo_rechazo text,
  notas text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_creditos TO authenticated;
GRANT ALL ON public.crm_creditos TO service_role;

ALTER TABLE public.crm_creditos ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_access_all_creditos ON public.crm_creditos
  FOR ALL TO authenticated
  USING (has_crm_access(auth.uid()))
  WITH CHECK (has_crm_access(auth.uid()));

CREATE TRIGGER update_crm_creditos_updated_at
  BEFORE UPDATE ON public.crm_creditos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.crm_capacidades (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid NOT NULL,
  entidad text NOT NULL,
  cupo_total numeric NOT NULL DEFAULT 0,
  cupo_asignado numeric NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'Activa',
  fecha_activacion date,
  fecha_vencimiento date,
  rentabilidad_pct numeric,
  documentacion_pendiente text,
  notas text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_capacidades TO authenticated;
GRANT ALL ON public.crm_capacidades TO service_role;

ALTER TABLE public.crm_capacidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_access_all_capacidades ON public.crm_capacidades
  FOR ALL TO authenticated
  USING (has_crm_access(auth.uid()))
  WITH CHECK (has_crm_access(auth.uid()));

CREATE TRIGGER update_crm_capacidades_updated_at
  BEFORE UPDATE ON public.crm_capacidades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
