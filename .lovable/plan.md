## Plan 1 — Monitoreo estilo GPSWOX (serverusa.digital)

### Diagnóstico de por qué hoy no aparecen datos

El cliente HTTP a GPSWOX ya existe (`src/lib/gps/gpswox.server.ts`) y llama a `https://serverusa.digital/api/get_devices` usando `GPSWOX_USER_API_HASH`. La sincronización corre por:
- `gpswoxSyncPositions` (server fn, admin) — botón en `GpsManager`.
- `/api/public/gps.sync` (cron cada 30s).

Causas probables de "no veo datos":
1. El secret `GPSWOX_USER_API_HASH` no está configurado o expiró (la sesión de `serverusa.digital/objects` usa cookies; el API hash se obtiene en *Settings → API* del usuario en GPSWOX, no en cookies).
2. El cron público nunca se está disparando (no hay job pg_cron creado contra `/api/public/gps.sync`).
3. La API devuelve `{ status:0, message:"Unauthorized" }` y nuestro código lo trata como respuesta válida (no es `!res.ok`, es 200 con error en el body).
4. El parser actual asume `Array<{items}>`, pero el endpoint también puede responder con un objeto `{status, items}` o `{ items: [...] }` según la versión — hay que tolerar las dos formas.

### Qué voy a traer y cómo

GPSWOX expone una API REST documentada. Para replicar lo de la imagen necesito estos endpoints (todos con `?user_api_hash=…&lang=es`):

| Endpoint | Para qué |
|---|---|
| `GET /api/get_devices` | Listado de la izquierda + posición actual, velocidad, online, sensores, dirección, batería GPS, batería vehículo, ignición, kilometraje, satélites |
| `GET /api/get_device_sensors?device_id=` | Detalle de sensores cuando se abre la tarjeta inferior (vibration, energizado, bloqueo, etc.) |
| `GET /api/get_history?device_id=&from_date=&to_date=` | (Opcional) trazado de recorrido al hacer clic en "ruta" |
| `GET /api/get_events?device_id=` | (Opcional) eventos/alertas del dispositivo |

Estrategia:
- Mantengo **nuestro propio mapa Leaflet** (ya armado) y consumimos GPSWOX como *fuente de verdad* via cron 30s → `vehiculos_gps` → realtime al cliente. No embebemos `serverusa.digital/objects` (requiere su sesión y no es estable).
- Endurezco `fetchGpswoxDevices` para soportar las dos formas de respuesta y para lanzar error cuando GPSWOX responde 200 con `status:0`.
- Amplío `normalizeDevice` para extraer: `direccion` (reverse geocode opcional, o `address` si GPSWOX lo trae), `bateria_gps`, `bateria_vehiculo`, `sim_signal`, `satelites`, `kilometraje`, `ignicion`, `bloqueo`, `duracion_estado` (calculado desde `last_fix_at` y el último cambio de estado), `novedad`.
- Migración: agrego esas columnas a `vehiculos_gps` (todas nullable).
- UI `/monitoreo` (sólo admin) se rediseña para parecerse a la imagen:
  - **Sidebar izquierdo** (320px) con búsqueda, grupo "Sin grupo (N)", cada item muestra placa, hora último fix y velocidad + icono wifi de estado (verde/amarillo/gris). Click centra y selecciona.
  - **Mapa grande** central con marcadores agrupados (cluster con conteo, como los círculos azules de la imagen) — usar `react-leaflet-cluster`.
  - **Tarjeta inferior** al seleccionar un vehículo, con tres bloques: *Datos* (dirección, hora, duración, conductor), *Sensores* (vehículo on/off, energizado, kilometraje, bloqueo, batería GPS %, 4G SIM, batería vehículo V, satélites), *Novedad/Distancia/Velocidad*, y *Servicios* (acciones contextuales).
- **Cron real cada 30s**: configuro `pg_cron` + `pg_net` para llamar `https://trammos.lovable.app/api/public/gps.sync` con header `apikey`. Hoy el cron no existe — por eso `last_synced_at` no avanza.

### Acción requerida del usuario

1. Verificar / dar el `GPSWOX_USER_API_HASH` actual (de *Settings → API* en `serverusa.digital`). Si está mal o expiró, no hay nada que traer. Si me confirmas, pido el secret con el formulario seguro.
2. Confirmar si quieres también ruta histórica y eventos (endpoints 3 y 4) o sólo el live de la imagen.

---

## Plan 2 — Apartado admin "Creación de cuentas"

Nuevo módulo unificado, **sólo visible para rol `admin`** (no para `corona`/`sodimac`). Reemplaza los tres flujos dispersos de hoy.

### Ruta y ubicación

- Nueva ruta `src/routes/cuentas.tsx` envuelta en `<AdminOnly>`.
- Entrada en `Sidebar.tsx` "Creación de cuentas" (icono `UserPlus`), visible sólo si `role === 'admin'`.
- Las páginas `/conductores` y `/pasajeros-pcd` siguen existiendo para *gestionar* registros; pero los botones de "Generar acceso / contraseña" se redirigen al nuevo módulo o se mantienen como atajo. La creación queda *centralizada* aquí.

### Estructura de la página (tabs)

```text
Creación de cuentas (admin only)
├── Tab 1: Empresa (monitoreo)    → Corona, Sodimac y futuras
├── Tab 2: Pasajero PcD           → ahora con contraseña, sin OTP
└── Tab 3: Conductor              → igual al flujo actual, unificado aquí
```

#### Tab 1 — Cuentas de empresa (monitoreo)
- Formulario: nombre, email corporativo, contraseña (con generador), empresa (`corona | sodimac | otra`).
- Acción server fn `crearCuentaEmpresa`:
  1. `supabaseAdmin.auth.admin.createUser({ email, password, email_confirm:true })`.
  2. Insert en `user_roles` con el rol correspondiente (`corona`/`sodimac`).
  3. Devuelve credenciales para copiar/mostrar al admin.
- Lista debajo de cuentas existentes por rol con acción "Restablecer contraseña" y "Revocar".

#### Tab 2 — Pasajeros PcD (cambio importante: contraseña en vez de OTP)
- Formulario: datos del pasajero (nombre, cédula, teléfono, email, datos PcD ya existentes en `pasajeros_pcd`) + **contraseña** (con generador, mínimo 8).
- Server fn `crearCuentaPasajero`:
  1. `supabaseAdmin.auth.admin.createUser({ email, password, email_confirm:true })`.
  2. Insert/upsert en `pasajeros_pcd` con `autorizado=true` y `auth_user_id` (nueva columna FK a `auth.users`).
  3. Insert en `user_roles` rol `pasajero`.
- Cambio en `/login` (flujo pasajero): de `signInWithOtp` → `signInWithPassword`. Quito UI del OTP de 6 dígitos para el rol pasajero (mantengo OTP sólo si quedó otro flujo que lo use; revisaré).
- `AccesoPasajeroPanel` actual: cambio "Reenviar código OTP" por "Restablecer contraseña" usando `supabaseAdmin.auth.admin.updateUserById`.

#### Tab 3 — Conductores
- Reusar el componente `GenerarAccesoConductor` actual, embebido como pestaña con formulario de alta del conductor (placa asignada, cédula, nombre, teléfono) + generación de contraseña.
- Mantiene RPC `set_conductor_password` existente.

### Cambios de BD (una sola migración)

- `ALTER TABLE pasajeros_pcd ADD COLUMN auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL`.
- RLS: política "pasajero ve su propio registro" basada en `auth.uid() = auth_user_id`.
- (No se almacenan contraseñas en claro — todo vive en `auth.users` vía Admin API. Seguimos la regla del security memory.)

### Server functions nuevas

`src/lib/cuentas/cuentas.functions.ts` con:
- `crearCuentaEmpresa({ email, password, rol })`
- `crearCuentaPasajero({ datosPasajero, password })`
- `crearCuentaConductor({ datosConductor, password })` (envuelve la RPC existente)
- `resetPasswordCuenta({ userId, newPassword })`
- Todas con `requireSupabaseAuth` + chequeo explícito `has_role(admin)` server-side.

### Acción requerida del usuario

1. Confirmar que el cambio de OTP → contraseña para pasajeros es global (¿borro el flujo OTP del login o lo dejo como respaldo?).
2. Confirmar que las cuentas de empresa pueden tener el mismo email para distintos roles o no (asumo: email único por cuenta).

---

¿Apruebo y procedo, o ajustamos algo antes? Si me confirmas el `GPSWOX_USER_API_HASH` arrancamos por el Plan 1.