## Objetivo

1. **Monitorizar tiempos de respuesta** en dos escenarios:
   - Servicios creados directamente por administrativos (cuánto tarda cada persona en crearlos / gestionarlos).
   - Solicitudes que entran desde la app del pasajero → cuánto tarda un encargado en asignar conductor + vehículo.
2. **Vehículos y conductores multi-cliente**: que un mismo vehículo o conductor pueda pertenecer a Corona, Sodimac, **ambos**, o quedar **sin asignar**.

---

## Parte 1 — Vehículos y conductores compartidos entre clientes

### Cambios de base de datos (migración)

Hoy las tablas `vehiculos` y `conductores` usan `cliente cliente_tipo NOT NULL` (un solo valor: corona o sodimac). Para soportar ambos / ninguno haremos:

- Añadir columna nueva `clientes cliente_tipo[] NOT NULL DEFAULT '{}'` en `vehiculos` y `conductores`.
  - `{}` = sin asignar
  - `{corona}` = solo Corona
  - `{sodimac}` = solo Sodimac
  - `{corona,sodimac}` = ambos
- Migrar datos existentes: `clientes := ARRAY[cliente]`.
- Mantener la columna `cliente` por compatibilidad temporal pero dejar de usarla en lectura/escritura.
- Reemplazar las RLS policies de `vehiculos` y `conductores` para que admitan el array:
  - Admin: acceso total.
  - Corona/Sodimac: ven las filas donde `'corona' = ANY(clientes)` o `array_length(clientes,1) IS NULL` (sin asignar) — opción a decidir; por defecto **ven solo las filas de su cliente** y las "sin asignar" para poder reclamarlas.
- Actualizar la función `get_vehiculo_publico_por_placa` para no filtrar por cliente sino solo por la solicitud activa del pasajero (ya lo hace).

### Cambios de UI

- **`src/routes/vehiculos.tsx`** y **`src/routes/conductores.tsx`**:
  - Reemplazar el `<select>` único de cliente por un grupo de **2 checkboxes** (Corona / Sodimac). Ninguno marcado = "Sin asignar".
  - Mostrar en la tarjeta los badges de cliente(s): `Corona`, `Sodimac`, `Ambos`, o `Sin asignar`.
  - Filtro superior: "Todos / Corona / Sodimac / Sin asignar".
- **Asignación en servicios**: al crear un servicio Corona, el dropdown de vehículo/conductor mostrará los que tienen Corona en su array (o sin asignar).

---

## Parte 2 — Monitoreo de tiempos de respuesta

### Cambios de base de datos (migración)

Añadir timestamps de auditoría:

**Tabla `servicios`** (creados desde el admin):
- `asignado_at timestamptz` — primer momento en que se completaron `conductor` y `vehiculo`.
- `asignado_by uuid` — usuario que hizo la asignación.
- Trigger `trg_servicios_track_asignacion`: si `OLD.conductor IS NULL OR OLD.vehiculo IS NULL` y `NEW` los tiene ambos, set `asignado_at = now()` y `asignado_by = auth.uid()`.

**Tabla `solicitudes_pasajero`** (origen app del pasajero):
- `asignado_at timestamptz` — cuando se asignó conductor + placa.
- `asignado_by uuid` — admin que aceptó/asignó.
- `aceptada_at timestamptz` — cuando pasó a estado `aceptada`.
- Trigger paralelo que rellena estos campos al cambiar estado o llenar conductor/placa.

Métricas derivadas (calculadas en el frontend a partir de los timestamps):
- **Tiempo de creación admin**: `created_at` → `asignado_at` por servicio y agregado por `created_by`.
- **Tiempo de respuesta a solicitudes pasajero**: `solicitudes_pasajero.created_at` → `aceptada_at` (tiempo hasta aceptar) y → `asignado_at` (tiempo hasta tener conductor + vehículo).

### Nueva sección de UI: "Tiempos de respuesta"

Agregar un nuevo tab/panel en **`src/routes/reportes.tsx`** (o nueva ruta `/tiempos-respuesta` accesible solo a admin) con:

1. **KPIs superiores** (rango de fechas seleccionable):
   - Tiempo promedio de asignación (solicitudes pasajero).
   - Tiempo mediano de asignación.
   - % de solicitudes asignadas en < 5 min, < 15 min, < 30 min, > 30 min.
   - Total de solicitudes pendientes ahora mismo y su antigüedad.

2. **Tabla por administrador** (quién asigna):
   - Columnas: Admin · Servicios creados · Solicitudes asignadas · Tiempo prom. de asignación · Tiempo mediano.
   - Ordenable por cualquier columna.

3. **Gráfico de líneas**: tiempo promedio de asignación por día (últimos 30 días).

4. **Lista de solicitudes lentas**: tabla con las solicitudes que tardaron > 30 min en asignarse, para análisis de casos.

Los datos se leen vía `supabase.from("solicitudes_pasajero").select(...)` y `from("servicios").select(...)` filtrando por rango de fechas y agrupando en cliente.

---

## Detalles técnicos

### Archivos a crear
- `supabase/migrations/<ts>_clientes_array_y_tiempos.sql` — nuevas columnas, triggers, RLS.
- `src/routes/tiempos-respuesta.tsx` — nueva ruta admin con los paneles de métricas.
- `src/lib/metricas/tiempos.ts` — helpers para calcular promedios/medianas/percentiles.

### Archivos a modificar
- `src/routes/vehiculos.tsx` — checkboxes multi-cliente, filtro, badges.
- `src/routes/conductores.tsx` — checkboxes multi-cliente, filtro, badges.
- `src/routes/servicios.tsx` — al crear servicio, registrar `asignado_by` automáticamente vía trigger; el dropdown de vehículos/conductores debe filtrar por `'<cliente>' = ANY(clientes) OR array_length(clientes,1) IS NULL`.
- `src/components/operacion/SolicitudesEntrantes.tsx` — al aceptar, los timestamps los rellena el trigger; no requiere cambios funcionales.
- `src/components/layout/Sidebar.tsx` — agregar entrada "Tiempos de respuesta" para admin.
- `src/integrations/supabase/types.ts` — se regenera automáticamente.

### Consideraciones
- Las RLS sobre `vehiculos`/`conductores` cambian de `can_access_cliente(cliente)` a una función nueva `can_access_clientes(_clientes cliente_tipo[])` que devuelve true si el usuario es admin, o si su cliente está en el array, o si el array está vacío (sin asignar — todos los admins de cualquier cliente pueden reclamarlo).
- Los triggers usan `SECURITY DEFINER` con `auth.uid()` para capturar quién hace el cambio.
- Para no romper código existente, `cliente` en vehículos/conductores se mantiene como columna pero se sincroniza al primer elemento de `clientes` (o se deja `NULL`-able). Eventualmente se podrá eliminar.

¿Apruebas el plan o quieres ajustar algo antes de implementarlo?