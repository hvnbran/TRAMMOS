## Servicios Fijos (recurrentes) para conductores

Objetivo: crear un "servicio fijo" que se asigna una sola vez a un conductor y a un vehículo, con días de la semana y horario, y que el conductor pueda abrir/cerrar (marcar inicio y fin real) cada día desde su app. La monitorización y reportes lo tratan como servicio operativo sin necesidad de generar N servicios manuales.

---

### 1. Modelo de datos

Nueva tabla `servicios_fijos` (plantilla del contrato recurrente):
- `conductor` (nombre) + `vehiculo` (placa) — igual que `servicios` para reutilizar RLS/lookups
- `pasajero`, `origen`, `destino`, `centro_costo`, `tipo`, `cliente`
- `dias_semana`: `int[]` (0=Dom … 6=Sáb) — ej: `{1,2,3,4,5}` para L-V
- `hora_inicio_prog`, `hora_fin_prog` (time) — horario esperado
- `fecha_inicio`, `fecha_fin` (date, `fecha_fin` opcional = indefinido)
- `activo` (bool)
- `notas`

Nueva tabla `servicio_fijo_ejecuciones` (una fila por día real trabajado):
- `servicio_fijo_id` → FK
- `fecha` (date)
- `iniciado_at`, `finalizado_at` (timestamptz) — los marca el conductor
- `estado`: `pendiente | en_curso | finalizado | ausente`
- `notas_conductor`
- Unique (`servicio_fijo_id`, `fecha`)

Ambas con GRANTs + RLS:
- Admin: full access
- Conductor: SELECT de sus propios fijos (join por `conductores.auth_user_id`), INSERT/UPDATE de sus ejecuciones vía RPC

### 2. RPCs

- `conductor_iniciar_fijo(_fijo_id, _fecha)` → crea/actualiza ejecución del día como `en_curso` con `iniciado_at = now()`. Valida que el conductor autenticado sea el asignado y que hoy sea un día válido según `dias_semana`.
- `conductor_finalizar_fijo(_fijo_id, _fecha, _notas?)` → marca `finalizado` con `finalizado_at = now()`.
- `listar_fijos_hoy_conductor()` → devuelve los fijos activos del conductor autenticado cuyo `dias_semana` incluye el día actual, con el estado de la ejecución de hoy (si existe).

### 3. UI Admin — panel Operación

Nueva pestaña / botón "Servicios fijos" en `src/routes/operacion.tsx`:
- Tabla con listado + botón "Nuevo fijo"
- Modal de creación/edición: conductor, vehículo, pasajero, origen, destino, checkboxes L-M-M-J-V-S-D, hora inicio/fin, rango de fechas, activo.
- Vista "Ejecuciones" por fijo: calendario/lista de últimos 30 días con horas reales vs programadas.

### 4. UI Conductor

En `src/routes/conductor.index.tsx`, nueva sección arriba "Servicio fijo de hoy":
- Card por cada fijo del día con origen/destino/pasajero + horario programado
- Si `pendiente` → botón grande "Iniciar servicio" (verde)
- Si `en_curso` → muestra hora de inicio + botón "Finalizar servicio" (rojo)
- Si `finalizado` → muestra ambas horas y check verde
- Enlace opcional a Google Maps para el origen/destino igual que `conductor.servicio.$id.tsx`.

### 5. Monitoreo / métricas

- Las ejecuciones con `iniciado_at`/`finalizado_at` alimentan los mismos reportes de tiempos (extender `src/lib/metricas/tiempos.ts` para incluir ejecuciones de fijos junto a `servicios`).
- El monitoreo GPS ya funciona por conductor, no requiere cambios.

### 6. Fuera de alcance en esta fase

- No se generan filas en `servicios` por cada día — se mantienen las tablas separadas para no ensuciar el panel operativo diario.
- No hay notificaciones push automáticas de recordatorio (se puede añadir luego con `push_notifications_queue` + cron).

---

¿Procedo con este diseño, o prefieres que los servicios fijos se materialicen automáticamente como filas en `servicios` cada día (útil si quieres verlos mezclados en el panel diario, pero genera más ruido)?
