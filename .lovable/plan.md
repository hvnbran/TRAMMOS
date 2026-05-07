## Objetivo

Tres cambios en TRAMMOS:

1. **Apagar TRAMI** (la mascota IA) sin borrar el código — se reactiva más adelante.
2. **Importar masivamente** las rutas amarillas del Excel `Cuadro_auxiliar_tarifas_edwin_bogotá.xlsx` como centros de costo en Operación.
3. **Subir Excel y editar tarifas** desde la pantalla de Operación (sin volver a tocar código cada vez).

---

## 1. Deshabilitar TRAMI

Comentar/condicionar el render del asistente para que no aparezca en ningún lado, conservando todos los archivos para reactivarlo después con un solo flag.

- Crear `src/lib/feature-flags.ts` con `export const TRAMI_ENABLED = false;`.
- En `src/components/layout/AppLayout.tsx`, `src/routes/pasajero.tsx`, `src/routes/login.tsx`, `src/routes/conductor.login.tsx`, `src/components/pasajero/PasajeroWelcomeSplash.tsx`: envolver `<TramiAssistant />` y los `<TramiAvatar>` decorativos con `{TRAMI_ENABLED && (...)}`.
- No tocar tablas `trami_*` ni la edge function (quedan dormidas, sin costo).

Para volver a encenderla en el futuro: cambiar el flag a `true`.

---

## 2. Importar las rutas del Excel (one-shot, automático)

El archivo tiene **343 filas amarillas** (las que tienen `VALOR UNITARIO` en amarillo) en la hoja `BOGOTA INTER-URBANA`. Vamos a generar un script local que las inserte en `centros_costo` con esta lógica:

- **Cliente**: si la columna `SODIMAC URBANA` tiene marca → `sodimac`, si no → `corona`.
- **Código**: `BOG-XXX` autoincremental por ruta (BOG-001, BOG-002…).
- **Origen / destino / departamento / tarifa**: directos del Excel.
- **Tipo**: `Empresarial`.
- Se omiten filas sin valor unitario o no amarillas.
- Se evita duplicar: si ya existe un centro con mismo `(cliente, origen, destino)` se actualiza la tarifa en vez de insertar.

Esto se ejecuta una sola vez como migración de datos (vía script `code--exec` con `psql` insert).

---

## 3. Editar y subir Excel desde Operación

Mejorar `src/routes/operacion.tsx` con dos nuevas capacidades:

### 3a. Editar tarifa inline
- En la tabla, la celda **Tarifa** se vuelve clickeable: al hacer click se convierte en input numérico, al guardar (Enter o blur) actualiza vía `supabase.from("centros_costo").update({ tarifa }).eq("id", ...)`.
- Indicador de guardado (spinner pequeño) + toast de éxito/error.
- Mismo patrón para `tipo` (select inline).

### 3b. Botón "Importar Excel"
- Botón nuevo junto a "Nueva Ruta" → abre modal con dropzone.
- Acepta `.xlsx`. Parseo en el navegador con la librería **`xlsx`** (SheetJS, ~200KB, sin dependencias del lado servidor).
- El parser detecta automáticamente las columnas: `ORIGEN`, `DESTINO`, `CIUDAD` (departamento), `VALOR UNITARIO`, `SODIMAC URBANA`.
- Muestra **vista previa** (primeras 20 filas) con conteo total y permite:
  - Elegir cliente por defecto (Corona / Sodimac / Auto-detectar por columna SODIMAC).
  - Elegir prefijo de código (default `BOG`).
  - Elegir si actualizar precios cuando ya existe la ruta o saltarla.
- Al confirmar, inserta/upserta en lotes de 100 con feedback de progreso.
- Tras importar, refresca la tabla.

### Dependencia nueva
- `bun add xlsx` (SheetJS, compatible con browser y SSR).

---

## Archivos

**Nuevos**
- `src/lib/feature-flags.ts`
- `src/components/operacion/ImportarExcelModal.tsx`
- `src/components/operacion/TarifaEditable.tsx`

**Editados**
- `src/components/layout/AppLayout.tsx`
- `src/routes/pasajero.tsx`
- `src/routes/login.tsx`
- `src/routes/conductor.login.tsx`
- `src/components/pasajero/PasajeroWelcomeSplash.tsx`
- `src/routes/operacion.tsx` (botón importar + edición inline + columna acciones extendida)
- `package.json` (dependencia `xlsx`)

**Migración de datos (one-shot)**
- Script para insertar las 343 rutas amarillas de Bogotá como centros de costo.

---

## Resultado para el usuario

- TRAMI desaparece visualmente de toda la app (queda dormida, lista para encenderse).
- Las 343 rutas de Bogotá quedan cargadas hoy mismo en Operación, listas para usarse.
- En adelante, cada vez que llegue un Excel nuevo (otra ciudad, ajuste de tarifas, etc.) se sube desde un botón sin tocar código.
- Las tarifas se pueden cambiar haciendo click directo en la celda de la tabla.
