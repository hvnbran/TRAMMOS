## Mejoras al módulo de Operación: filtros + paginación

Reorganizar la tabla de rutas en `src/routes/operacion.tsx` para que sea fácil encontrar y editar rutas cuando hay cientos (como las 283 de Bogotá).

### 1. Barra de filtros (encima de la tabla)

Una fila compacta con 4 controles:

- **Buscar** (input de texto): filtra por código, origen o destino (case-insensitive, match parcial)
- **Cliente** (select): Todos · Corona · Sodimac (oculto si el usuario ya está fijado a un cliente)
- **Departamento** (select): Todos + lista única de departamentos presentes en los datos, ordenada alfabéticamente
- **Tipo** (select): Todos · Empresarial · VIP · Especial · Otro

Botón "Limpiar filtros" aparece solo cuando hay algún filtro activo.

Los filtros se guardan en **search params de la URL** (`?q=...&cliente=...&depto=...&tipo=...&page=1`) usando `zodValidator + fallback` de TanStack, para que recargar la página o compartir el link mantenga el estado.

### 2. Agrupación visual por departamento (opcional, toggle)

Botón "Agrupar por departamento" que cuando está activo:
- Inserta filas separadoras con el nombre del departamento y el conteo (`Cundinamarca · 45 rutas`)
- Las rutas se ordenan: departamento → código
- Cuando está apagado, la tabla es plana ordenada por código

Por defecto: agrupado **encendido** porque ayuda con cientos de rutas.

### 3. Paginación

- **10 rutas por página** por defecto, con selector (10 / 25 / 50 / 100)
- Controles abajo de la tabla: `« 1 2 3 ... 28 »` + texto "Mostrando 1–10 de 283"
- Cuando se cambia un filtro, vuelve a página 1 automáticamente
- Si está activado el modo "agrupar", la paginación cuenta filas de datos (no separadores) para no cortar grupos a la mitad de forma extraña

### 4. Edición rápida de departamento (in-place)

Hoy `Tarifa` y `Tipo` ya se editan inline. Añadir lo mismo para **Departamento**:
- Nuevo componente `DepartamentoEditable.tsx` similar a `TarifaEditable.tsx`
- Click → input de texto con autocompletado de departamentos existentes (datalist HTML nativo)
- Guarda con `supabase.from("centros_costo").update({ departamento })`

También permitir editar **Tipo** inline con un `<select>` (hoy es solo lectura como badge).

### 5. Contador en las tarjetas de resumen

La tarjeta "Rutas activas" muestra ahora `X de Y` cuando hay filtros aplicados (ej: `45 de 283`), para dejar claro cuántas se están viendo.

---

### Archivos a crear

- `src/components/operacion/DepartamentoEditable.tsx` — input inline con datalist
- `src/components/operacion/TipoEditable.tsx` — select inline

### Archivos a editar

- `src/routes/operacion.tsx`:
  - Agregar `validateSearch` con zod para `q`, `cliente`, `depto`, `tipo`, `page`, `pageSize`, `agrupar`
  - Calcular `departamentosUnicos` con `useMemo` desde `rows`
  - Calcular `rowsFiltradas` con `useMemo` aplicando filtros
  - Calcular `rowsPaginadas` y `totalPages`
  - Renderizar barra de filtros + tabla agrupada/plana + paginación
  - Reemplazar celda de tipo por `<TipoEditable>` y celda de departamento por `<DepartamentoEditable>`

### Detalles técnicos

- Search params con `zodValidator(z.object({ q: fallback(z.string(), "").default(""), page: fallback(z.number().int().min(1), 1).default(1), pageSize: fallback(z.enum(["10","25","50","100"]), "10").default("10"), agrupar: fallback(z.boolean(), true).default(true), cliente: fallback(z.enum(["all","corona","sodimac"]), "all").default("all"), depto: fallback(z.string(), "all").default("all"), tipo: fallback(z.string(), "all").default("all") }))`
- Navegación con `navigate({ search: (prev) => ({ ...prev, page: 1, q: value }) })` para no perder otros filtros
- No se necesita migración de BD ni cambios en Supabase — todo es UI sobre los datos ya existentes
