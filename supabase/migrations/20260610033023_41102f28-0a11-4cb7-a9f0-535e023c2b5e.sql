CREATE TABLE public.crm_cumpleanos_manual (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  fecha_nacimiento date NOT NULL,
  telefono text,
  relacion text,
  notas text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_cumpleanos_manual TO authenticated;
GRANT ALL ON public.crm_cumpleanos_manual TO service_role;
ALTER TABLE public.crm_cumpleanos_manual ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_manage_cumpleanos_manual" ON public.crm_cumpleanos_manual FOR ALL TO authenticated USING (public.has_crm_access(auth.uid())) WITH CHECK (public.has_crm_access(auth.uid()));
CREATE TRIGGER trg_crm_cumpleanos_manual_updated BEFORE UPDATE ON public.crm_cumpleanos_manual FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();