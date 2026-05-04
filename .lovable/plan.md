# Plan: Mejora de Servicios + App privada de Conductor

Tres bloques independientes que se entregan juntos.

---

## Bloque 1 — Auto-vehículo al elegir conductor (Servicios)

En `src/routes/servicios.tsx`, cuando el admin elige conductor en el formulario de nuevo servicio o en la fila de la tabla:

- Si el conductor tiene **1 vehículo** asignado en `vehiculo_conductores` → se selecciona automáticamente ese vehículo (placa).
- Si tiene **2+** → el dropdown de vehículos se filtra solo a esos, con el principal marcado primero.
- Si tiene **0** → mensaje "Este conductor no tiene vehículos asignados" y se deja el dropdown abierto a todos los disponibles (fallback actual).
- El admin siempre puede sobrescribir manualmente.

Cambios:
- Cargar `vehiculo_conductores` (id conductor → placas) junto con conductores y vehículos.
- Crear helper `vehiculosDeConductor(conductorId)` que devuelve placas ordenadas (principal primero).
- En `handleFieldChange("conductor", ...)`: si la lista resultante tiene 1 placa, hacer un segundo update con `vehiculo`.
- En el formulario de nuevo servicio: efecto que reacciona a `form.conductor` y autollena `form.vehiculo`.

---

## Bloque 2 — App privada de Conductor

### Acceso
- Nueva ruta **`/conductor`** (no aparece en la sidebar, no aparece como tab en `/login`).
- Nueva ruta **`/conductor/login`** pública con formulario **cédula + contraseña** (sin OAuth, sin OTP).
- Para entrar, el conductor escribe la URL directa o usa un acceso directo PWA "Instalar app". Se le comparte el link por WhatsApp/correo.

### Modelo de autenticación
Para no romper el sistema actual de roles ni meter los conductores en `auth.users` con email (muchos no tienen):

- Nuevo rol `'conductor'` en el enum `app_role`.
- A cada `conductores` se le agrega:
  - `password_hash text` (bcrypt vía pg-extension `pgcrypto`)
  - `auth_user_id uuid` (vinculado tras primer login)
  - `acceso_habilitado bool default false`
- El admin, desde la página Conductores, hace clic en "Generar acceso": se le pide una contraseña inicial (o se autogenera), se hashea con `crypt()` y se guarda. Se muestra una sola vez para compartirla.
- Login: server function `loginConductor({ cedula, password })` que:
  1. Busca el conductor por cédula.
  2. Verifica `crypt(password, password_hash) = password_hash`.
  3. Si es la primera vez, crea un usuario en `auth.users` con email sintético `conductor-<cedula>@trammos.local` y password aleatoria, asigna rol `conductor`, vincula `auth_user_id`.
  4. Devuelve credenciales para que el cliente haga `supabase.auth.signInWithPassword`.
- El conductor puede cambiar su contraseña desde su app.

### Pantallas de la app conductor
- `/conductor` — Lista de **mis servicios de hoy** + próximos (filtra `servicios` donde `conductor = mi_nombre` o `vehiculo` está asignado a mí).
- `/conductor/servicio/$id` — Detalle del servicio:
  - Origen, destino, hora, número de orden, centro de costo.
  - **Brief del pasajero PCD** si aplica: tipo discapacidad, ayudas técnicas, comunicación preferida, nivel asistencia, contacto emergencia, notas conductor (lectura segura vía función `get_pasajero_brief_for_conductor(servicio_id)` que valida que el conductor logueado es el asignado).
  - Botones de **navegación**: "Ir al origen" → `https://www.google.com/maps/dir/?api=1&destination=…` y "Ir al destino" igual.
  - Botones de **estado**: "Iniciar servicio" (→ `En curso`), "Finalizar" (→ `Finalizado`), "Cancelar" (→ `Cancelado`, pide motivo).
  - Cada cambio actualiza `servicios.estado`. Los triggers existentes (`track_servicio_tiempos`, `sync_servicio_to_solicitud`, `enqueue_push_on_solicitud_change`) ya propagan al admin y notifican al pasajero. **No se duplica lógica.**

### Sidebar y layout
- Layout dedicado `ConductorLayout` (no usa `AppLayout` ni `Sidebar` admin). Header simple con nombre del conductor, foto, vehículo asignado y botón cerrar sesión.
- Diseño mobile-first (la mayoría usará el celular).
- PWA: ya hay `public/sw.js` y `manifest.webmanifest`; añadir banner "Instalar app" como en `/pasajero`.

### Privacidad / RLS
- Nuevas policies en `servicios`: `conductor_view_own_servicios` (`exists (select 1 from conductores c where c.auth_user_id = auth.uid() and c.nombre = servicios.conductor)`).
- `conductor_update_own_servicios` solo para columnas `estado` y `cancelado_motivo`.
- Función `get_pasajero_brief_for_conductor(_servicio_id uuid)` SECURITY DEFINER que valida la asignación antes de devolver datos sensibles.

---

## Bloque 3 — Cambios en BD (migración)

```sql
-- 1. Rol nuevo
alter type app_role add value if not exists 'conductor';

-- 2. Conductores: campos de acceso
alter table conductores
  add column if not exists password_hash text,
  add column if not exists auth_user_id uuid,
  add column if not exists acceso_habilitado bool not null default false,
  add column if not exists primer_login_at timestamptz;

create index if not exists idx_conductores_cedula_lower
  on conductores (lower(cedula));
create unique index if not exists uq_conductores_auth_user
  on conductores (auth_user_id) where auth_user_id is not null;

-- 3. Función de login
create or replace function login_conductor(_cedula text, _password text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v record;
begin
  select * into v from conductores
   where lower(cedula) = lower(_cedula) and acceso_habilitado = true;
  if v.id is null then return jsonb_build_object('ok', false, 'error', 'no_encontrado'); end if;
  if v.password_hash is null
     or crypt(_password, v.password_hash) <> v.password_hash then
    return jsonb_build_object('ok', false, 'error', 'credenciales');
  end if;
  return jsonb_build_object('ok', true, 'conductor_id', v.id,
                            'auth_user_id', v.auth_user_id, 'nombre', v.nombre);
end $$;

-- 4. RLS en servicios para el conductor
create policy conductor_select_own_servicios on servicios for select
  using (exists (select 1 from conductores c
                  where c.auth_user_id = auth.uid() and c.nombre = servicios.conductor));

create policy conductor_update_estado_servicios on servicios for update
  using (exists (select 1 from conductores c
                  where c.auth_user_id = auth.uid() and c.nombre = servicios.conductor));
```

(Se ajustan permisos de `update` para que el conductor solo pueda mover `estado` / `cancelado_motivo` mediante una RPC dedicada `conductor_set_estado_servicio(_id, _nuevo_estado, _motivo)`.)

---

## Archivos a crear

- `supabase/migrations/<ts>_conductor_app.sql`
- `src/server/conductor.functions.ts` — `loginConductor`, `setEstadoServicioConductor`, `getMyServicios`, `getServicioDetalle`
- `src/lib/auth-conductor.ts` — helpers para sesión conductor
- `src/routes/conductor.login.tsx`
- `src/routes/conductor.index.tsx` (listado de servicios)
- `src/routes/conductor.servicio.$id.tsx`
- `src/components/conductor/ConductorLayout.tsx`
- `src/components/conductor/ServicioCard.tsx`
- `src/components/conductor/PasajeroBrief.tsx`
- `src/components/conductor/EstadoActions.tsx`

## Archivos a editar

- `src/routes/servicios.tsx` — auto-vehículo al elegir conductor
- `src/routes/conductores.tsx` — botón "Generar acceso" + modal con contraseña inicial
- `src/routes/__root.tsx` — excluir `/conductor/*` del enforcement de aceptación de políticas si no aplica (o aplicarlo igual, según preferencia)
- `src/lib/auth-context.tsx` — soportar el nuevo rol `conductor` y redirigir a `/conductor`
- `src/integrations/supabase/types.ts` — se regenera solo

---

## Cómo se siente para el usuario

- **Admin**: en Servicios elige conductor → vehículo aparece solo (o filtrado a 2 opciones). En Conductores hay un botón "Generar acceso a la app" que muestra la contraseña una sola vez para compartirla.
- **Conductor**: abre `tramos.online/conductor/login` (o el ícono PWA), entra con su cédula y contraseña, ve sus servicios del día con un toque, abre uno, ve a quién recoge y dónde, navega con Maps y marca "Iniciar / Finalizar". El cambio aparece al instante en el panel del admin y le llega notificación al pasajero.
- **Privacidad**: la URL de la app no está enlazada en ningún lado público; solo accede quien tenga cédula + contraseña + acceso habilitado por el admin.

---

## Riesgos y notas

- Email sintético (`conductor-<cedula>@trammos.local`) es necesario porque Supabase Auth requiere email. No se envían correos a esta dirección — solo es una llave técnica.
- Si más adelante quieres que el conductor también reciba notificaciones push, ya hay infraestructura (`push_subscriptions`) lista para reutilizar.
- La cédula como usuario es cómoda pero conviene que las contraseñas sean razonables (mínimo 8 caracteres). Lo validamos en el formulario "Generar acceso".
