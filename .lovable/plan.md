## Objetivo

Que la fecha "Vence" (licencia) de **todos** los conductores siempre sea la del documento `licencia_conduccion` cargado en su perfil, sin necesidad de tocar nada manualmente. Si la fecha del documento ya no está vencida, el conductor deja de aparecer como "Vencido" automáticamente.

## Problema actual

Hoy la fecha vive en dos lugares:
- `conductores.vence_licencia` (campo manual, viejo) → lo usan dashboard, alertas, notificaciones, reportes Excel/PDF, modal de perfil, asignación de servicios, cumplimiento.
- `conductor_documentos` tipo `licencia_conduccion` (la fecha real del PDF subido).

El parche anterior solo arregló la pantalla `/conductores`. Por eso el resto sigue mostrando la fecha vieja y el conductor sigue como "Vencido" aunque ya haya cargado licencia nueva.

## Solución (una sola ley para todo el sistema)

**El documento manda. Siempre.** Lo logramos con un trigger en la base de datos que mantiene `conductores.vence_licencia` espejeado con la fecha del documento `licencia_conduccion`. Así, todo el código existente sigue funcionando sin tocar nada — la fecha simplemente está siempre correcta.

### Pasos

1. **Trigger en la base de datos**
   En `conductor_documentos`, cada vez que se inserta, actualiza o borra un documento de tipo `licencia_conduccion`, se actualiza `conductores.vence_licencia` del conductor afectado con la fecha del documento más reciente (o `NULL` si no queda ninguno).

2. **Backfill inicial**
   Una sola corrida que recorre todos los conductores con documento de licencia y copia la fecha del documento al campo `vence_licencia`. Esto corrige el estado actual de todos de una vez.

3. **Reactivación automática**
   No requiere código extra: el estado "Vencido" en la UI se calcula en vivo con `isVencido(vence_licencia)`. Si la fecha sincronizada queda en el futuro, el conductor vuelve a aparecer "Activo" solo. Se aplica en `/conductores`, modal de perfil, vehículos, asignación de servicios, alertas, dashboard, notificaciones y reportes.

4. **Limpieza en `/conductores`**
   - Quitar el campo manual "Vence licencia" del formulario de crear/editar conductor (la fuente única ahora es el documento — evita que un admin escriba una fecha y el trigger se la sobrescriba).
   - Quitar el `merge` manual que hicimos antes en `load()`, ya no hace falta porque la columna ya está correcta en la BD.

## Detalles técnicos

- **Trigger**: `AFTER INSERT OR UPDATE OR DELETE` en `public.conductor_documentos`, filtrado por `tipo = 'licencia_conduccion'`. Recalcula con `SELECT MAX(fecha_vencimiento)` (o el más reciente por `created_at`) de los documentos vigentes de ese conductor.
- **Sin tocar `estado`**: dejamos que la UI lo derive. Evitamos pelear con valores guardados como "Vencido" que ya no aplican.
- **Archivos afectados**: solo `src/routes/conductores.tsx` (quitar input + merge). Migración nueva para el trigger + backfill. Nada más necesita cambios.

## Lo que NO cambia

- Subida y gestión de documentos en el modal de perfil.
- Lógica de alertas, reportes, asignación, notificaciones — todas siguen leyendo `vence_licencia` y ahora reciben el valor correcto sin saberlo.
