## Qué vamos a cambiar en la pestaña de Pasajero

### 1. Autocompletado de direcciones tipo Uber/Didi
Hoy usamos **Photon (OpenStreetMap)**, que en Colombia entiende calles pero falla con lugares populares ("Parque de Belén", "Éxito Poblado", "Clínica El Rosario"). Por eso la ubicación no "sugiere" como Uber.

La solución correcta es usar **Google Places API (New)** con sesgo por proximidad (la ubicación GPS del pasajero), igual que Uber/Didi:

- Conectar el conector **Google Maps Platform** (gratis, sin pedirte llave — Lovable lo gestiona).
- Reemplazar el motor de búsqueda dentro de `AddressAutocomplete`:
  - Llamar a `places:autocomplete` (Places API New) por el **gateway**, con `locationBias.circle` centrado en `geo.lat/geo.lon` y radio 20 km.
  - Restringir país a Colombia (`includedRegionCodes: ["co"]`).
  - Mostrar dos columnas como Uber: nombre del lugar (ej. "Parque de Belén") + dirección/barrio debajo.
  - Al elegir una sugerencia, hacer `places/{id}` con `fieldMask: location,formattedAddress` para obtener lat/lng exactos.
  - Mantener fallback a Photon si por alguna razón el gateway falla.
- El componente sigue siendo el mismo (`AddressAutocomplete`), así también mejora el origen ("Sales de"), el destino ("Vas a"), y todos los demás formularios que ya lo usan (operación, etc.).
- Reverse geocode inicial (cuando el GPS resuelve y el origen está vacío) pasa también a Google → la dirección detectada será mucho más legible que el "0000" que ves ahora.

Nota: como el conector aún no está enlazado, lo primero será conectarlo (es un paso de un clic que abre el diálogo de Lovable). Si decides no conectarlo, puedo mejorar Photon con priorización de POIs pero **no llegará al nivel Uber** — Google Places es la diferencia real.

### 2. Reemplazar el carrito SVG por la foto real (Renault Duster blanca)
- Subir la imagen adjunta como **Lovable Asset** (CDN), nombre `pasajero-hero-car.png`, usando `lovable-assets create` desde `/mnt/user-uploads/image-12.png`.
- En `PasajeroHero.tsx`, quitar todo el bloque `<svg width="240" ...>` del carrito y reemplazarlo por un `<img>` con la URL del asset:
  - Tamaño responsive (`max-w-[260px] sm:max-w-[300px]`), centrada.
  - Mantener la sombra suave (`drop-shadow`) y la animación `hero-car-wrap` (bounce de entrada + flotación) que ya existe en CSS — sólo cambiamos el contenido, no el wrapper.
  - `alt="Camioneta TRAMMOS"` para accesibilidad.
- El resto del hero (fondo lima, líneas decorativas, pines, tipografía cyan) se mantiene intacto.

### Archivos que se tocan
- `src/components/AddressAutocomplete.tsx` — nuevo flujo de búsqueda + render de sugerencias estilo Uber.
- `src/lib/geo/places.ts` (nuevo) — cliente del gateway Google Places (autocomplete + details + reverse).
- `src/lib/geo/photon.ts` — se mantiene como fallback.
- `src/components/pasajero/PasajeroHero.tsx` — `<img>` en lugar del SVG del carrito.
- `src/assets/pasajero-hero-car.png.asset.json` (nuevo) — pointer del asset.
- Conector Google Maps Platform — enlace de un clic.

### Resultado esperado
- Escribes "Parque de Belén" → aparece el parque en Medellín con su dirección, además de variantes cercanas.
- Escribes "Éxito" → ves los Éxito más cercanos a ti primero.
- El hero muestra la Duster real con su sombra y animación, en vez del dibujito.
