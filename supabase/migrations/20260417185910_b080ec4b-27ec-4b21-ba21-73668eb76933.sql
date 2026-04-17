
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'corona', 'sodimac');
CREATE TYPE public.cliente_tipo AS ENUM ('corona', 'sodimac');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role function (security definer, bypasses RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- helper: client the user can access (returns null for admin, meaning any)
CREATE OR REPLACE FUNCTION public.user_client(_user_id UUID)
RETURNS cliente_tipo
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'corona') THEN 'corona'::cliente_tipo
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'sodimac') THEN 'sodimac'::cliente_tipo
    ELSE NULL
  END
$$;

-- Timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Auto profile + role on signup (role default 'corona', will be overridden manually for seeds)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profiles policies
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- user_roles policies
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Shared trigger for updated_at
-- Data tables
CREATE TABLE public.conductores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente cliente_tipo NOT NULL,
  nombre TEXT NOT NULL,
  cedula TEXT,
  telefono TEXT,
  licencia TEXT,
  categoria_lic TEXT,
  estado TEXT NOT NULL DEFAULT 'Activo',
  vence_licencia DATE,
  servicios INT DEFAULT 0,
  cumplimiento INT DEFAULT 100,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.conductores ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER tg_conductores_updated BEFORE UPDATE ON public.conductores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.vehiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente cliente_tipo NOT NULL,
  placa TEXT NOT NULL,
  marca TEXT,
  linea TEXT,
  modelo INT,
  color TEXT,
  num_interno TEXT,
  estado TEXT NOT NULL DEFAULT 'Disponible',
  vence_soat DATE,
  vence_rtm DATE,
  conductor TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER tg_vehiculos_updated BEFORE UPDATE ON public.vehiculos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.servicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente cliente_tipo NOT NULL,
  fecha DATE NOT NULL,
  hora TEXT,
  origen TEXT,
  destino TEXT,
  pasajero TEXT,
  centro_costo TEXT,
  conductor TEXT,
  vehiculo TEXT,
  estado TEXT NOT NULL DEFAULT 'Programado',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER tg_servicios_updated BEFORE UPDATE ON public.servicios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.calificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente cliente_tipo NOT NULL,
  tipo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  servicio TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  estrellas INT NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
  mejoras TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.calificaciones ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER tg_calificaciones_updated BEFORE UPDATE ON public.calificaciones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.incidentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente cliente_tipo NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  conductor TEXT,
  vehiculo TEXT,
  tipo_incidente TEXT NOT NULL,
  que_paso TEXT,
  cuando TEXT,
  por_que TEXT,
  soporte TEXT,
  solucion TEXT,
  plan_mejoramiento TEXT,
  estado TEXT NOT NULL DEFAULT 'Abierto',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.incidentes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER tg_incidentes_updated BEFORE UPDATE ON public.incidentes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Shared RLS function: can access client?
CREATE OR REPLACE FUNCTION public.can_access_cliente(_cliente cliente_tipo)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), _cliente::text::app_role)
$$;

-- Policies (SELECT, INSERT, UPDATE, DELETE) — scoped by cliente
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['conductores','vehiculos','servicios','calificaciones','incidentes']
  LOOP
    EXECUTE format('CREATE POLICY "view_%s" ON public.%I FOR SELECT USING (public.can_access_cliente(cliente))', t, t);
    EXECUTE format('CREATE POLICY "insert_%s" ON public.%I FOR INSERT WITH CHECK (public.can_access_cliente(cliente))', t, t);
    EXECUTE format('CREATE POLICY "update_%s" ON public.%I FOR UPDATE USING (public.can_access_cliente(cliente))', t, t);
    EXECUTE format('CREATE POLICY "delete_%s" ON public.%I FOR DELETE USING (public.can_access_cliente(cliente))', t, t);
  END LOOP;
END$$;
