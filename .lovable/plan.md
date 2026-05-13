
# Integrar el GPS de serverusa.digital a TRAMMOS

## Qué es serverusa.digital

Es una plataforma tipo **GPSWOX** (la app móvil oficial es "My Tracking Client"). Expone una API REST en `https://serverusa.digital/api/` con endpoints estándar:

- `POST /api/login` → devuelve un `user_api_hash` (token permanente, no expira hasta que cambies la contraseña).
- `GET  /api/get_devices?user_api_hash=...` → lista de dispositivos GPS (IMEI, nombre, placa, ícono, grupo).
- `GET  /api/get_devices_short_info?user_api_hash=...` → posición y estado en vivo de cada dispositivo (lat, lon, velocidad, curso, online/offline, batería, ignición, hora del último fix).
- `GET  /api/get_route?...` → histórico de un dispositivo entre dos fechas.

Esto es ideal: **no hay que pedirte la contraseña cada vez**, basta con generar el `user_api_hash` una vez y guardarlo como secreto en el backend. Tu correo y contraseña no quedan en la app.

> **Importante de seguridad:** no voy a iniciar sesión yo con tu cuenta. El paso 1 lo haces tú una sola vez (te dejo un comando listo) y pegas el hash en Lovable Cloud como secreto.

## Plan en 4 pasos

### 1. Conectar la cuenta (una sola vez, tú)

Te paso un `curl` que ejecutas tú (o yo desde el sandbox cuando apruebes):

```bash
curl -s "https://serverusa.digital/api/login" \
  -d "email=brandonmunetonavendano@gmail.com" \
  -d "password=TU_PASSWORD"
```

Devuelve algo como `{"status":1,"user_api_hash":"$2y$10$abc..."}`.

Ese `user_api_hash` se guarda como **secreto** en Lovable Cloud:
- `GPSWOX_API_BASE` = `https://serverusa.digital/api`
- `GPSWOX_USER_API_HASH` = el hash que devolvió el login

> Recomendación adicional: cambia la contraseña que compartiste en este chat (cualquier persona con acceso al historial podría usarla). Una vez generado el `user_api_hash`, la app ya no necesita la contraseña.

### 2. Tabla `vehiculos_gps` y enlace con `vehiculos`

Migración nueva:

- Tabla `vehiculos_gps`:
  - `vehiculo_id` (FK a `vehiculos`, nullable: un GPS puede llegar antes de tener vehículo creado)
  - `gpswox_device_id` (int, único) — el id que devuelve la API
  - `imei` (text, único)
  - `nombre_dispositivo`, `placa_gps`, `grupo`
  - `last_lat`, `last_lon`, `last_speed_kmh`, `last_course`, `last_fix_at`, `online` (bool), `bateria`, `ignicion`
  - `last_synced_at`
  - `activo` (bool, default true)

- Añadir a `vehiculos`:
  - `gps_device_id` (int, nullable) — referencia rápida al `gpswox_device_id`.

- RLS: lectura para `admin` y `corona`; escritura solo `admin` y server functions.

- Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE public.vehiculos_gps;` para que `MonitoreoMap` se actualice solo.

### 3. Server functions (TanStack)

Archivo `src/lib/gps/gpswox.functions.ts`:

- `gpswoxImportDevices()` — admin only:
  1. Llama a `GET /api/get_devices`.
  2. Hace `upsert` en `vehiculos_gps` por `gpswox_device_id`.
  3. Intenta auto-emparejar con `vehiculos` por placa (normalizada: mayúsculas, sin espacios). Si no encuentra match, deja `vehiculo_id = null` y queda visible en una pantalla de "GPS sin vehículo".
  4. Devuelve `{ importados, emparejados, sin_emparejar }`.

- `gpswoxSyncPositions()` — admin / cron:
  1. Llama a `GET /api/get_devices_short_info`.
  2. Actualiza lat/lon/speed/online/last_fix_at en `vehiculos_gps`.
  3. Idempotente, seguro de llamar cada 15-30 segundos.

- `gpswoxGetHistory(vehiculoId, desde, hasta)` — admin: histórico de un vehículo entre dos fechas para reportes.

Helpers en `src/lib/gps/gpswox.server.ts` (no se importa desde cliente).

### 4. Cron + UI

**Cron (sincronización en vivo):**
- Ruta pública firmada `src/routes/api/public/gps.sync.ts` que llama a `gpswoxSyncPositions()`.
- pg_cron cada 30 segundos golpea esa URL con un header `X-Cron-Secret`.
- Resultado: `vehiculos_gps` siempre tiene la última posición sin que el cliente pegue al GPS directamente (más rápido y respeta el rate limit de la API).

**Cambios de UI (esto es lo que recomiendo):**

1. **`/vehiculos`** — nueva pestaña/sección "GPS":
   - Botón "Importar dispositivos desde serverusa.digital" (llama a `gpswoxImportDevices`).
   - Lista de GPS con estado (online/offline, último fix, vehículo emparejado).
   - Para cada GPS sin vehículo: selector para vincularlo manualmente con un `vehiculo` existente.

2. **`/monitoreo`** — pasar de mock a datos reales:
   - `MonitoreoMap.tsx` deja de pintar el marcador fijo en Medellín y consulta `vehiculos_gps` (con realtime).
   - Cada vehículo online muestra ícono cyan TRAMMOS, popup con placa, conductor asignado (si hay servicio activo), velocidad y hora del último fix.
   - Vehículos offline > 5 min se ven en gris.
   - Filtros por departamento (ya tenemos el bbox), por estado (en servicio / libre), y por conductor.

3. **`/servicios`** y **`/conductor/servicio/$id`**:
   - Cuando un servicio tenga vehículo asignado y ese vehículo tenga GPS, mostrar mini-mapa con la posición en vivo.
   - El pasajero (`/pasajero` → `ViajeEnCurso.tsx`) ve el carrito moviéndose en el mapa cuando el servicio está `en_camino` o `a_bordo` (esto es el cambio más visible para el usuario final).

4. **Reportes** (`/reportes`, `/tiempos-respuesta`):
   - Usar `gpswoxGetHistory` para calcular kilómetros recorridos por servicio, velocidad promedio, tiempos reales puerta a puerta.
   - Detección de excesos de velocidad (umbral configurable por departamento).

5. **Alertas** (`/alertas`):
   - Nueva alerta "GPS desconectado" cuando un vehículo en servicio activo no reporta hace > 3 min.
   - Alerta "Vehículo fuera de ruta" comparando posición vs origen/destino del servicio.

## Riesgos y notas

- **Rate limit:** GPSWOX permite tranquilamente 1 request cada 10-30 s para `get_devices_short_info`. No exponer la API directo al navegador; siempre pasar por el cron + tabla `vehiculos_gps`.
- **Emparejamiento por placa:** algunos GPS vienen con nombres tipo "MOTO-123" en vez de la placa real; por eso queda el match manual.
- **El `user_api_hash` se invalida** si cambias la contraseña en serverusa.digital. Si pasa, simplemente regeneras el hash y actualizas el secreto.
- **Si serverusa.digital no es exactamente GPSWOX** (puede ser un fork con diferencias menores), hago una llamada de prueba al login real al ejecutar el plan y ajusto los nombres de campos sobre la marcha antes de crear las tablas.

## Archivos

- **Nuevos:** `src/lib/gps/gpswox.server.ts`, `src/lib/gps/gpswox.functions.ts`, `src/routes/api/public/gps.sync.ts`, `src/components/vehiculos/GpsManager.tsx`, `src/components/monitoreo/VehiculoEnVivoMarker.tsx`.
- **Editar:** `src/components/MonitoreoMap.tsx`, `src/routes/vehiculos.tsx`, `src/routes/monitoreo.tsx`, `src/components/pasajero/ViajeEnCurso.tsx`, `src/routes/servicios.tsx`.
- **Migración:** crear `vehiculos_gps`, añadir `gps_device_id` a `vehiculos`, RLS, realtime, pg_cron.
- **Secretos nuevos:** `GPSWOX_API_BASE`, `GPSWOX_USER_API_HASH`, `GPS_CRON_SECRET`.

## ¿Qué necesito de ti antes de empezar?

1. Confirmar que apruebas este enfoque.
2. Cambiar la contraseña que compartiste y generar el `user_api_hash` (te guío con el `curl` exacto).
3. Decidir si quieres que el pasajero vea el carro moviéndose en vivo en el mapa (recomendado) o solo los admins.
