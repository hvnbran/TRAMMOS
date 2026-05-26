## Cambios

### 1. Buscador en página de Vehículos
Añadir un campo de búsqueda en `src/routes/vehiculos.tsx` (encima de los filtros de cliente) que filtre la lista por: placa, marca, línea, color, número interno o nombre del conductor. Búsqueda en vivo, case-insensitive, combinada con el filtro de cliente actual.

### 2. Apertura directa desde búsqueda global
- En `src/components/GlobalSearch.tsx`: cuando el resultado es un vehículo, navegar con un query param `?open=<id>` (en lugar de solo `/vehiculos`).
- En `src/routes/vehiculos.tsx`: leer `open` desde la URL al cargar; cuando coincide con un vehículo, expandir su panel (`setExpanded(id)`) y hacer scroll suave hacia la tarjeta.

### Detalles técnicos
- Filtro local sobre el array `items` ya cargado (no nueva query a Supabase).
- `useSearch` de TanStack Router para leer `?open=<uuid>` con `validateSearch`.
- Si el id no está en la lista filtrada actual, limpiar el filtro automáticamente para que la tarjeta sea visible.

### Archivos
- `src/routes/vehiculos.tsx` (editar)
- `src/components/GlobalSearch.tsx` (editar — cambiar `to: "/vehiculos"` por incluir search param para vehículos)
