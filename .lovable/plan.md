## Plan: Autocompletado de direcciones para Colombia

### Objetivo
Agregar sugerencias inteligentes de origen y destino en dos lugares:
1. **App del pasajero** (`PedirServicioForm`) — usa GPS del teléfono y autocompleta direcciones cercanas.
2. **Servicios del admin** (`servicios.tsx`) — sugiere primero rutas conocidas de Operación, y como respaldo cualquier dirección de Colombia.

### Proveedor: Photon (gratis, sin API key)
- Endpoint: `https://photon.komoot.io/api/?q={query}&lang=es&limit=8&lat={lat}&lon={lon}&location_bias_scale=0.5`
- Filtro por país: `&osm_tag=:!boundary` y validamos en cliente que `country_code === 'co'`.
- Reverse geocoding: `https://photon.komoot.io/reverse?lat={lat}&lon={lon}&lang=es`

### Componentes nuevos

**`src/lib/geo/photon.ts`** — Cliente con:
- `searchAddresses(query, { lat?, lon? })` — devuelve `{ label, lat, lon, departamento, ciudad }[]` filtrado a Colombia.
- `reverseGeocode(lat, lon)` — devuelve dirección legible.
- Debounce de 300ms y cache en memoria por sesión para no spamear el API público.

**`src/hooks/useGeolocation.ts`** — Wrapper de `navigator.geolocation` con estados (`idle | requesting | granted | denied | error`) y permiso recordado en `localStorage`.

**`src/components/AddressAutocomplete.tsx`** — Input con dropdown de sugerencias (basado en `Popover` + `Command` de shadcn). Props:
```ts
{
  value: string;
  onChange: (value: string, meta?: { lat?: number; lon?: number }) => void;
  placeholder?: string;
  bias?: { lat: number; lon: number } | null;  // sesgo geográfico
  extraSuggestions?: { label: string; sublabel?: string; group?: string }[]; // para mostrar rutas de Operación
  icon?: ReactNode;
}
```
Muestra primero `extraSuggestions` agrupadas (ej. "Rutas de Operación"), luego resultados de Photon agrupados como "Sugerencias cercanas".

### Cambios en pantallas

**`PedirServicioForm.tsx`** (pasajero)
- Al montar, llama `useGeolocation()` y, si el usuario acepta, hace reverse geocoding para prellenar `origen` (solo si está vacío y no hay `direccion_habitual`).
- Si rechaza GPS o falla, mantiene `direccion_habitual` como fallback (comportamiento actual).
- Reemplaza los `<input>` de origen y destino por `<AddressAutocomplete>` pasando `bias={ lat, lon }` cuando hay GPS.
- Agrega una notita pequeña "Usando tu ubicación" cuando el GPS está activo.

**`src/routes/servicios.tsx`** (admin — formulario crear/editar servicio)
- Carga al montar `centros_costo` activos del cliente actual: `select('codigo, origen, destino, departamento')`.
- Construye listas únicas de `origenes` y `destinos` a partir de esos centros.
- Reemplaza los inputs de origen/destino por `<AddressAutocomplete>` con `extraSuggestions` poblado de esas rutas (etiqueta = `origen`, sublabel = `código · departamento`).
- Sin sesgo de GPS (admin trabaja desde escritorio).

### Detalles técnicos

- **Sin nuevas dependencias**: Photon se llama con `fetch`, el dropdown usa shadcn `Command` + `Popover` ya instalados.
- **Sin secretos nuevos** ni cambios en backend o base de datos.
- **Rate limit Photon**: ~1 req/s público. Mitigamos con debounce 300ms, mínimo 3 caracteres y cache LRU simple en memoria.
- **Privacidad**: la posición GPS solo se usa en el cliente para sesgar búsquedas; nunca se persiste en la base de datos sin acción explícita del usuario.
- **Accesibilidad**: el componente mantiene navegación por teclado (flechas + Enter) gracias a `cmdk`.

### Archivos a crear
- `src/lib/geo/photon.ts`
- `src/hooks/useGeolocation.ts`
- `src/components/AddressAutocomplete.tsx`

### Archivos a editar
- `src/components/pasajero/PedirServicioForm.tsx`
- `src/routes/servicios.tsx`

### Fuera de alcance (para después)
- Mapa visual con pin para ajustar ubicación.
- Guardar coordenadas en `solicitudes_pasajero` (hoy solo se guarda texto).
- Autocompletar en otros formularios (incidentes, conductor, etc.).
