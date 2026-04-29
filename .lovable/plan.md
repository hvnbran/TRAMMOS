## Diagnóstico

El error **no es del archivo PDF**. Es un `CHECK constraint` desactualizado en la base de datos:

- `conductor_documentos.tipo` solo permite: `poliza_arl`, `licencia_conduccion`, `tarjeta_operacion`
- `vehiculo_documentos.tipo` solo permite: `tarjeta_operacion`, `soat`, `tecnico_mecanica`

Pero el frontend (`DocumentManager.tsx`) intenta insertar 9 tipos de conductor (`cedula`, `seguridad_social`, `examenes_medicos`, `antecedentes`, `simit`, `curso_defensivo`, `curso_teorico_practico`, `hoja_vida`, `licencia_conduccion`) y 10 tipos de vehículo (`tarjeta_propiedad`, `cedula_propietario`, `seguro_rc`, `revision_preventiva`, `certificado_gps`, `antecedentes_propietario`, `simit_vehiculo`, etc.).

Por eso el insert falla con `violates check constraint "conductor_documentos_tipo_check"` apenas eliges Cédula, Planilla, SIMIT, Antecedentes, etc. — y el toast actual muestra el mensaje crudo de Postgres en inglés.

## Cambios

### 1. Migración SQL — quitar restricciones obsoletas

Eliminar los CHECK rígidos en ambas tablas y reemplazarlos por una validación más flexible (longitud razonable, no vacío) que no quede desactualizada cada vez que agregamos un tipo de documento nuevo:

```sql
ALTER TABLE public.conductor_documentos DROP CONSTRAINT IF EXISTS conductor_documentos_tipo_check;
ALTER TABLE public.vehiculo_documentos  DROP CONSTRAINT IF EXISTS vehiculo_documentos_tipo_check;

ALTER TABLE public.conductor_documentos
  ADD CONSTRAINT conductor_documentos_tipo_valid
  CHECK (tipo IS NOT NULL AND length(tipo) BETWEEN 1 AND 64);

ALTER TABLE public.vehiculo_documentos
  ADD CONSTRAINT vehiculo_documentos_tipo_valid
  CHECK (tipo IS NOT NULL AND length(tipo) BETWEEN 1 AND 64);
```

La fuente de verdad de los tipos válidos pasa a ser `TIPOS_CONDUCTOR` y `TIPOS_VEHICULO` en el frontend, que ya muestran exactamente los documentos que la operación necesita.

### 2. `src/components/DocumentManager.tsx` — traducir errores de BD

Hoy, cuando el insert falla, el catch hace `toast({ description: e.message })` y muestra el inglés de Postgres. Vamos a:

- Detectar errores comunes de Supabase/Postgres y mapearlos a mensajes en español:
  - `violates check constraint` → "Tipo de documento no permitido por la base de datos."
  - `violates row-level security` → "No tienes permiso para subir este documento en este cliente."
  - `duplicate key` → "Ya existe un documento de este tipo."
  - `Payload too large` / `413` → "El archivo supera el tamaño permitido."
  - `bucket` / `storage` errors → "No se pudo guardar el archivo en el almacenamiento."
  - Cualquier otro → "No se pudo subir el documento. Intenta de nuevo o contacta soporte."
- Aplicar el mismo helper tanto al error de `storage.upload` como al de `insert` en la tabla, para que SIEMPRE veas el motivo en español específico.

## Resultado esperado

- Podrás subir Cédula, Licencia, Planilla, SIMIT, Antecedentes, Exámenes, etc. en conductores.
- Podrás subir todos los documentos de vehículo (incluyendo Tarjeta de propiedad, Seguro RC, Revisión preventiva, GPS, SIMIT vehículo, etc.).
- Si en el futuro algo falla al subir (permisos, tamaño, tipo, almacenamiento), la notificación te dirá en español exactamente por qué.

## Archivos a modificar

- `supabase/migrations/<nueva>.sql` (nueva migración)
- `src/components/DocumentManager.tsx` (mapeo de errores en español)