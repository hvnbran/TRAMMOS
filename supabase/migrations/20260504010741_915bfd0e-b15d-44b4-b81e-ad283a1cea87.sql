-- Extensión para hashing de contraseñas
create extension if not exists pgcrypto;

-- 1. Nuevo rol "conductor" en el enum
alter type public.app_role add value if not exists 'conductor';

-- 2. Columnas de acceso en conductores
alter table public.conductores
  add column if not exists password_hash text,
  add column if not exists auth_user_id uuid,
  add column if not exists acceso_habilitado boolean not null default false,
  add column if not exists primer_login_at timestamptz;

create index if not exists idx_conductores_cedula_lower
  on public.conductores (lower(cedula));

create unique index if not exists uq_conductores_auth_user
  on public.conductores (auth_user_id) where auth_user_id is not null;

-- 3. Función: admin define password de un conductor
create or replace function public.set_conductor_password(
  _conductor_id uuid,
  _password text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;
  if _password is null or length(_password) < 6 then
    return jsonb_build_object('ok', false, 'error', 'password_corta');
  end if;

  update public.conductores
     set password_hash = crypt(_password, gen_salt('bf', 10)),
         acceso_habilitado = true,
         updated_at = now()
   where id = _conductor_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'no_encontrado');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

-- 4. Función: verificar credenciales y devolver email sintético + password aleatoria
-- (la usamos antes de signInWithPassword en el cliente)
create or replace function public.verify_conductor_password(
  _cedula text,
  _password text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v record;
begin
  select id, nombre, cedula, password_hash, acceso_habilitado, auth_user_id
    into v
    from public.conductores
   where lower(trim(cedula)) = lower(trim(_cedula))
   limit 1;

  if v.id is null then
    return jsonb_build_object('ok', false, 'error', 'no_encontrado');
  end if;
  if not v.acceso_habilitado or v.password_hash is null then
    return jsonb_build_object('ok', false, 'error', 'sin_acceso');
  end if;
  if crypt(_password, v.password_hash) <> v.password_hash then
    return jsonb_build_object('ok', false, 'error', 'credenciales');
  end if;

  return jsonb_build_object(
    'ok', true,
    'conductor_id', v.id,
    'nombre', v.nombre,
    'cedula', v.cedula
  );
end;
$$;

-- 5. Vincular conductor autenticado: corre tras signInWithPassword
create or replace function public.link_conductor_to_auth(
  _cedula text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v record;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'no_auth');
  end if;

  select id, nombre, cedula, auth_user_id
    into v
    from public.conductores
   where lower(trim(cedula)) = lower(trim(_cedula))
     and acceso_habilitado = true
   limit 1;

  if v.id is null then
    return jsonb_build_object('ok', false, 'error', 'no_encontrado');
  end if;

  -- Si ya está vinculado a otro auth user, error
  if v.auth_user_id is not null and v.auth_user_id <> v_user_id then
    return jsonb_build_object('ok', false, 'error', 'ya_vinculado');
  end if;

  update public.conductores
     set auth_user_id = v_user_id,
         primer_login_at = coalesce(primer_login_at, now()),
         updated_at = now()
   where id = v.id;

  -- Asignar rol conductor si no lo tiene
  insert into public.user_roles (user_id, role)
  select v_user_id, 'conductor'::app_role
  where not exists (
    select 1 from public.user_roles
     where user_id = v_user_id and role = 'conductor'::app_role
  );

  return jsonb_build_object(
    'ok', true,
    'conductor_id', v.id,
    'nombre', v.nombre
  );
end;
$$;

-- 6. RLS: conductor ve sus servicios (matcheando por nombre)
drop policy if exists conductor_select_own_servicios on public.servicios;
create policy conductor_select_own_servicios on public.servicios
for select to authenticated
using (
  exists (
    select 1 from public.conductores c
     where c.auth_user_id = auth.uid()
       and lower(trim(c.nombre)) = lower(trim(servicios.conductor))
  )
);

-- 7. Función: el conductor cambia el estado de su servicio
create or replace function public.conductor_set_estado_servicio(
  _servicio_id uuid,
  _nuevo_estado text,
  _motivo text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_serv record;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'no_auth');
  end if;

  if _nuevo_estado not in ('En curso','Finalizado','Cancelado') then
    return jsonb_build_object('ok', false, 'error', 'estado_invalido');
  end if;

  select s.id, s.conductor, s.estado
    into v_serv
    from public.servicios s
   where s.id = _servicio_id;

  if v_serv.id is null then
    return jsonb_build_object('ok', false, 'error', 'no_encontrado');
  end if;

  -- Validar que es el conductor asignado
  if not exists (
    select 1 from public.conductores c
     where c.auth_user_id = v_user_id
       and lower(trim(c.nombre)) = lower(trim(v_serv.conductor))
  ) then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  update public.servicios
     set estado = _nuevo_estado,
         updated_at = now()
   where id = _servicio_id;

  return jsonb_build_object('ok', true, 'estado', _nuevo_estado);
end;
$$;

-- 8. Función: brief del pasajero PCD para el conductor asignado
create or replace function public.get_pasajero_brief_for_conductor(
  _servicio_id uuid
) returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_authorized boolean;
  v_brief jsonb;
begin
  if v_user_id is null then
    return null;
  end if;

  select exists (
    select 1
      from public.servicios s
      join public.conductores c on lower(trim(c.nombre)) = lower(trim(s.conductor))
     where s.id = _servicio_id
       and c.auth_user_id = v_user_id
  ) into v_authorized;

  if not v_authorized then
    return null;
  end if;

  select to_jsonb(p) - 'password_backup' - 'auth_user_id' - 'consentimiento_datos'
    into v_brief
    from public.servicios s
    join public.pasajeros_pcd p on p.id = s.pasajero_pcd_id
   where s.id = _servicio_id;

  return v_brief;
end;
$$;

-- 9. Permisos de ejecución
grant execute on function public.set_conductor_password(uuid, text) to authenticated;
grant execute on function public.verify_conductor_password(text, text) to anon, authenticated;
grant execute on function public.link_conductor_to_auth(text) to authenticated;
grant execute on function public.conductor_set_estado_servicio(uuid, text, text) to authenticated;
grant execute on function public.get_pasajero_brief_for_conductor(uuid) to authenticated;