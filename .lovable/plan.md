# Plan: GPS desde el celular del conductor (tipo Uber)

## 1. Limpieza de GPSWox

Eliminar por completo:
- `src/lib/gps/gpswox.server.ts`
- `src/lib/gps/gpswox.functions.ts`
- `src/components/vehiculos/GpsManager.tsx` y cualquier referencia en `cuentas.tsx`/vehículos
- `src/routes/api/public/gps.sync.ts`
- Imports/secciones en `MonitoreoMap.tsx`, `VehiculosLiveList.tsx`, `VehiculoLiveMiniMap.tsx` que dependan de GPSWox

Migración SQL:
- Borrar tabla `vehiculos_gps` (no la reutilizamos para no mezclar conceptos).
- Crear tabla nueva `conductor_ubicaciones`:
  - `conductor_id uuid PK` (1 fila por conductor, upsert)
  - `lat double precision`, `lng double precision`
  - `accuracy`, `speed_kmh`, `heading` (nullables)
  - `online boolean default false`
  - `updated_at timestamptz default now()`
- RLS: el conductor solo puede upsert/leer su propia fila (vía `auth_user_id`); admin lee todo; pasajero lee solo la del conductor de su servicio activo (via función SECURITY DEFINER `get_ubicacion_conductor_servicio(servicio_id)`).
- Habilitar Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE conductor_ubicaciones`.

Secretos a borrar: `GPSWOX_API_BASE`, `GPSWOX_USER_API_HASH` (avisar al usuario para borrarlos manualmente).

## 2. Lado conductor — botón "Estoy en línea"

En `src/routes/conductor.index.tsx`:
- Botón toggle "Estoy en línea / Desconectarme".
- Al activar:
  1. `navigator.geolocation.watchPosition` con `enableHighAccuracy: true`.
  2. Cada 5 s (throttle) hace `upsertUbicacion({ lat, lng, speed, heading, accuracy, online: true })` vía server fn.
  3. `wake lock` opcional para que no se duerma la pantalla.
- Al desactivar / cerrar sesión / cerrar pestaña (`beforeunload`): `clearWatch` + server fn `setOffline()` que pone `online=false`.
- Indicador visual del estado (verde online / gris offline) y manejo de permiso denegado.

Server fn nuevo: `src/lib/gps/ubicacion.functions.ts` con `upsertUbicacion` y `setOffline`, ambos con `requireSupabaseAuth` (resuelven `conductor_id` desde `auth_user_id`).

## 3. Lado admin — `/monitoreo`

Reescribir `MonitoreoMap.tsx` con **Leaflet + OpenStreetMap** (`react-leaflet` + `leaflet`):
- Suscripción Realtime a `conductor_ubicaciones` filtrando `online=true`.
- Un marker por conductor online, con popup: nombre, vehículo asignado actual (si hay servicio activo), velocidad, hace cuánto.
- Lista lateral `VehiculosLiveList` muestra solo conductores online (no vehículos GPS).
- Auto-marca `online=false` los registros con `updated_at < now() - 60s` (cliente lo filtra; opcional: cron pg cada minuto).

## 4. Lado pasajero — mapa tipo Uber

En la vista del pasajero (donde ve su solicitud activa), cuando `estado IN ('aceptada','en_camino','a_bordo')`:
- Mini-mapa Leaflet centrado en el conductor.
- Suscripción Realtime a `conductor_ubicaciones` del conductor asignado (via función segura `get_ubicacion_conductor_servicio`).
- Muestra marker del conductor + marker del origen del pasajero + línea recta entre ambos (no routing, para no requerir API).
- ETA opcional: distancia haversine / velocidad promedio.

Reescribir `VehiculoLiveMiniMap.tsx` para usar este flujo en vez de GPSWox.

## 5. Dependencias

`bun add leaflet react-leaflet` + `bun add -d @types/leaflet`. Importar CSS de Leaflet en `__root.tsx` o en los componentes que lo usan.

## Consideraciones técnicas

- **Batería/datos**: 5 s es agresivo. Mitigamos enviando solo si la posición cambió > X metros o pasaron > 5 s.
- **HTTPS obligatorio** para `geolocation` (ya lo es en producción).
- **iOS Safari** suspende `watchPosition` en background al bloquear el teléfono. Solución: mantener pantalla encendida con Wake Lock API mientras esté "en línea"; advertir al conductor.
- **Permisos**: si el usuario los niega, mostrar instrucciones para reactivarlos.
- **No hay routing real** (calles) — solo línea recta. Si más adelante quieres ruta real necesitaríamos Mapbox/Google.

## Resumen de archivos

Borrar: `src/lib/gps/gpswox.*`, `src/components/vehiculos/GpsManager.tsx`, `src/routes/api/public/gps.sync.ts`.
Crear: `src/lib/gps/ubicacion.functions.ts`, migración SQL.
Modificar: `src/routes/conductor.index.tsx`, `src/routes/monitoreo.tsx`, `src/components/MonitoreoMap.tsx`, `src/components/monitoreo/VehiculosLiveList.tsx`, `src/components/pasajero/VehiculoLiveMiniMap.tsx`, `src/routes/cuentas.tsx` (quitar GpsManager si aparece).

¿Apruebas para implementarlo?
