
CREATE TABLE public.empresa_sedes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  direccion text NOT NULL,
  lat double precision,
  lng double precision,
  orden integer NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX empresa_sedes_empresa_idx ON public.empresa_sedes(empresa_id, orden);

GRANT SELECT ON public.empresa_sedes TO authenticated;
GRANT ALL ON public.empresa_sedes TO service_role;

ALTER TABLE public.empresa_sedes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leen sedes activas"
  ON public.empresa_sedes FOR SELECT
  TO authenticated
  USING (activo = true);

CREATE POLICY "Admins gestionan sedes"
  ON public.empresa_sedes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER empresa_sedes_updated_at
  BEFORE UPDATE ON public.empresa_sedes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed: sedes del Hospital del Sur Itagüí
INSERT INTO public.empresa_sedes (empresa_id, nombre, direccion, orden)
SELECT e.id, s.nombre, s.direccion, s.orden
FROM public.empresas e
CROSS JOIN (VALUES
  ('San Pío',     'Calle 33 Nº 50a-25, Itagüí',    1),
  ('Santamaría',  'Carrera 52 Nº 78-158, Itagüí',  2),
  ('Calatrava',   'Calle 63 Nº 58FF-11, Itagüí',   3)
) AS s(nombre, direccion, orden)
WHERE e.slug = 'hospital-sur-itagui'
  AND NOT EXISTS (
    SELECT 1 FROM public.empresa_sedes es
    WHERE es.empresa_id = e.id AND es.nombre = s.nombre
  );
