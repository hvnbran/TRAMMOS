# Arreglar autocompletado y filtrar por departamento

## Problema detectado

Hoy el autocompletado dice "Sin resultados" en muchos casos porque el código filtra del lado del cliente con `p.countrycode === "CO"`, pero Photon **no siempre devuelve `countrycode` en `properties`** (sobre todo en calles y POIs). Como resultado, casi todos los features se descartan y el usuario ve la lista vacía aunque la API devolvió resultados válidos.

Además, hoy solo hay un sesgo de proximidad (`location_bias_scale`), pero no hay filtro real por país ni por departamento, así que aparecen calles homónimas de Bogotá cuando el usuario está en Medellín o Barranquilla.

## Objetivo

1. Que el autocompletado **funcione** (deje de salir "Sin resultados" cuando sí los hay).
2. Que **filtre por Colombia** de forma confiable.
3. Que **priorice y limite** los resultados al **departamento del teléfono** del usuario.

## Cambios

### 1. `src/lib/geo/photon.ts` — filtro robusto a Colombia

- Quitar el filtro estricto `countrycode === "CO"`. En su lugar, aceptar el feature si **cualquiera** de estas condiciones se cumple:
  - `properties.countrycode` es `"CO"`, **o**
  - `properties.country` es `"Colombia"` / `"Colombia (CO)"`, **o**
  - las coordenadas caen dentro del bounding box de Colombia (`lon ∈ [-79, -66]`, `lat ∈ [-4.3, 13.5]`).
- Añadir un parámetro opcional `bbox` a `searchAddresses(query, { lat, lon, bbox, departamento, signal })`.
  - `bbox`: `[minLon, minLat, maxLon, maxLat]` que se envía a Photon como `bbox=...` para acotar la búsqueda al departamento del usuario.
  - `departamento`: si está, se usa además como filtro post-hoc (`properties.state` debe coincidir, ignorando tildes/mayúsculas).
- Añadir helper `colombiaBboxFor(departamento: string): [number, number, number, number] | null` con un mapa estático de los 32 departamentos + Bogotá D.C. (bounding box aproximado por departamento). Cuando no se conozca el departamento, fallback al bbox país.
- Añadir `subirRanking`: las sugerencias cuyo `state` coincide con el departamento del usuario van primero; las de otro departamento van después o se descartan según una bandera `strict`.
- Mantener el cache LRU pero incluir `departamento` en la `cacheKey`.

### 2. `src/hooks/useGeolocation.ts` — exponer departamento detectado

- Tras obtener `lat/lon`, llamar a `reverseGeocode(lat, lon)` una vez y exponer:
  - `departamento: string | null`
  - `ciudad: string | null`
  - `bbox: [number,number,number,number] | null` (vía `colombiaBboxFor`)
- Persistir en `localStorage` el último `departamento` conocido para que el primer render ya tenga sesgo aunque el GPS aún esté pidiendo permiso.
- Mejorar mensaje de error: distinguir `denied` (usuario lo bloqueó), `unsupported` (navegador sin GPS), `timeout` y `error` para mostrar acciones distintas en la UI.

### 3. `src/components/AddressAutocomplete.tsx` — usar el filtro por departamento

- Aceptar nuevas props: `departamento?: string | null`, `bbox?: [number,number,number,number] | null`, `strictDepartamento?: boolean` (default `true` en pasajero, `false` en admin).
- Pasar esos parámetros a `searchAddresses`.
- Cambiar el copy del estado vacío a algo accionable:
  - Sin GPS: "Activa la ubicación para ver direcciones cercanas".
  - Con GPS pero sin resultados: "No encontramos esa dirección en {Departamento}. Prueba con el barrio o intenta otra ciudad."
- Reducir el umbral mínimo de 3 a **2 caracteres** y aumentar el debounce a 350 ms (Photon agradece menos requests).
- Si Photon devuelve 0 resultados con `strictDepartamento`, hacer un **segundo intento** sin el filtro de departamento y mostrar esos resultados bajo un grupo "Otras zonas de Colombia". Así el usuario nunca ve un dropdown completamente vacío cuando hay resultados nacionales.

### 4. `src/components/pasajero/PedirServicioForm.tsx`

- Pasar `departamento`, `bbox` y `strictDepartamento={true}` a los dos `AddressAutocomplete` (origen y destino).
- En el indicador "Usando tu ubicación", añadir el departamento detectado: "Usando tu ubicación · Antioquia".
- Si `geo.status === "denied"`, mostrar arriba del formulario un banner sutil: "Activa tu ubicación para ver direcciones cercanas a ti", con botón que llama a `geo.request()`.

### 5. `src/routes/servicios.tsx` (admin)

- Pasar `strictDepartamento={false}` para que los operadores puedan crear servicios en cualquier ciudad, conservando solo el sesgo por proximidad.

## Detalles técnicos

```ts
// Bbox por departamento (extracto)
const DEPT_BBOX: Record<string, [number,number,number,number]> = {
  "Antioquia":      [-77.13, 5.42, -73.88, 8.88],
  "Cundinamarca":   [-75.00, 3.69, -73.04, 5.83],
  "Bogotá D.C.":    [-74.45, 4.46, -73.99, 4.84],
  "Valle del Cauca":[-77.66, 3.05, -75.69, 5.08],
  "Atlántico":      [-75.10,10.24, -74.71,11.10],
  // …32 entradas
};

// Llamada a Photon
const params = new URLSearchParams({ q, lang: "es", limit: "10" });
if (bbox) params.set("bbox", bbox.join(","));      // minLon,minLat,maxLon,maxLat
if (lat && lon) {
  params.set("lat", String(lat));
  params.set("lon", String(lon));
  params.set("location_bias_scale", "0.6");
}
```

```ts
function isInColombia(props, lon, lat) {
  if (props.countrycode === "CO") return true;
  if (typeof props.country === "string" && props.country.toLowerCase().includes("colombia")) return true;
  return lon >= -79 && lon <= -66 && lat >= -4.3 && lat <= 13.5;
}
```

## Archivos

- Editar: `src/lib/geo/photon.ts`, `src/hooks/useGeolocation.ts`, `src/components/AddressAutocomplete.tsx`, `src/components/pasajero/PedirServicioForm.tsx`, `src/routes/servicios.tsx`
- Sin nuevas dependencias, sin secretos, sin cambios de backend.

## Riesgos

- El bbox por departamento es aproximado; en municipios fronterizos puede excluir resultados válidos. Por eso el fallback nacional ("Otras zonas de Colombia") siempre está disponible.
- Photon es público y a veces lento; el debounce (350 ms) y el cache mitigan el impacto.
