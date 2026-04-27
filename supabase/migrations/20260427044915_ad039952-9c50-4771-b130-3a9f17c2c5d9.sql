-- ============================================
-- TRAMMOS Accesible+ Fase A: Perfil PCD
-- ============================================

-- Tabla de pasajeros con perfil de accesibilidad
CREATE TABLE public.pasajeros_pcd (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente public.cliente_tipo NOT NULL,
  nombre TEXT NOT NULL,
  cedula TEXT,
  telefono TEXT,
  email TEXT,
  -- Perfil de accesibilidad (estructurado)
  tipo_discapacidad TEXT NOT NULL DEFAULT 'ninguna',
    -- valores: 'ninguna' | 'visual' | 'auditiva' | 'motriz' | 'cognitiva' | 'multiple'
  ayudas_tecnicas TEXT[] NOT NULL DEFAULT '{}',
    -- ej: 'silla_ruedas','baston','perro_guia','audifono','interprete_lsc','muletas','andador'
  silla_ruedas_medidas TEXT, -- "ancho x largo cm" si aplica
  comunicacion_preferida TEXT NOT NULL DEFAULT 'voz',
    -- 'voz' | 'texto_grande' | 'pictogramas' | 'lengua_senas' | 'escrita_simple'
  nivel_asistencia INT NOT NULL DEFAULT 0,
    -- 0 autónomo, 1 leve, 2 media, 3 requiere acompañante
  -- Datos sensibles
  contacto_emergencia_nombre TEXT,
  contacto_emergencia_telefono TEXT,
  contacto_emergencia_relacion TEXT,
  condiciones_medicas TEXT, -- texto libre, voluntario
  alergias TEXT,
  medicamentos TEXT,
  -- Preferencias del servicio
  notas_conductor TEXT, -- brief que verá el conductor
  requiere_vehiculo_adaptado BOOLEAN NOT NULL DEFAULT false,
  permite_acompanante BOOLEAN NOT NULL DEFAULT true,
  consentimiento_datos BOOLEAN NOT NULL DEFAULT false,
  -- Auditoría
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_pasajeros_pcd_cliente ON public.pasajeros_pcd(cliente);
CREATE INDEX idx_pasajeros_pcd_nombre ON public.pasajeros_pcd(nombre);
CREATE INDEX idx_pasajeros_pcd_tipo ON public.pasajeros_pcd(tipo_discapacidad);

-- RLS
ALTER TABLE public.pasajeros_pcd ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_pasajeros_pcd"
  ON public.pasajeros_pcd FOR SELECT
  USING (public.can_access_cliente(cliente));

CREATE POLICY "insert_pasajeros_pcd"
  ON public.pasajeros_pcd FOR INSERT
  WITH CHECK (public.can_access_cliente(cliente));

CREATE POLICY "update_pasajeros_pcd"
  ON public.pasajeros_pcd FOR UPDATE
  USING (public.can_access_cliente(cliente));

CREATE POLICY "delete_pasajeros_pcd"
  ON public.pasajeros_pcd FOR DELETE
  USING (public.can_access_cliente(cliente));

-- Trigger updated_at
CREATE TRIGGER update_pasajeros_pcd_updated_at
  BEFORE UPDATE ON public.pasajeros_pcd
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- FK opcional en servicios para enlazar a pasajero PCD
ALTER TABLE public.servicios
  ADD COLUMN pasajero_pcd_id UUID REFERENCES public.pasajeros_pcd(id) ON DELETE SET NULL;

CREATE INDEX idx_servicios_pasajero_pcd ON public.servicios(pasajero_pcd_id);

-- Validación de tipo_discapacidad
CREATE OR REPLACE FUNCTION public.validar_pasajero_pcd()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.tipo_discapacidad NOT IN ('ninguna','visual','auditiva','motriz','cognitiva','multiple') THEN
    RAISE EXCEPTION 'tipo_discapacidad inválido: %', NEW.tipo_discapacidad;
  END IF;
  IF NEW.comunicacion_preferida NOT IN ('voz','texto_grande','pictogramas','lengua_senas','escrita_simple') THEN
    RAISE EXCEPTION 'comunicacion_preferida inválida: %', NEW.comunicacion_preferida;
  END IF;
  IF NEW.nivel_asistencia NOT BETWEEN 0 AND 3 THEN
    RAISE EXCEPTION 'nivel_asistencia debe estar entre 0 y 3';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validar_pasajero_pcd
  BEFORE INSERT OR UPDATE ON public.pasajeros_pcd
  FOR EACH ROW EXECUTE FUNCTION public.validar_pasajero_pcd();