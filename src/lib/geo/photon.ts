// Cliente liviano para Photon (OpenStreetMap geocoder), filtrado a Colombia.
// Sin API key. Rate limit moderado: usar con debounce y cache.

export interface AddressSuggestion {
  label: string;
  sublabel?: string;
  lat: number;
  lon: number;
  ciudad?: string;
  departamento?: string;
}

export type Bbox = [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]

const PHOTON_BASE = "https://photon.komoot.io";

// Bounding box de Colombia (aprox)
const CO_BBOX: Bbox = [-79, -4.3, -66, 13.5];

// Bounding box aproximado por departamento + Bogotá D.C.
// Fuente: aproximaciones desde límites administrativos OSM.
const DEPT_BBOX: Record<string, Bbox> = {
  "amazonas":           [-74.00, -4.30, -69.40, -0.50],
  "antioquia":          [-77.13,  5.42, -73.88,  8.88],
  "arauca":             [-72.45,  6.00, -69.40,  7.10],
  "atlantico":          [-75.10, 10.24, -74.71, 11.10],
  "atlántico":          [-75.10, 10.24, -74.71, 11.10],
  "bogota":             [-74.45,  4.46, -73.99,  4.84],
  "bogota d.c.":        [-74.45,  4.46, -73.99,  4.84],
  "bogotá":             [-74.45,  4.46, -73.99,  4.84],
  "bogotá d.c.":        [-74.45,  4.46, -73.99,  4.84],
  "bolivar":            [-75.85,  7.00, -73.85, 10.85],
  "bolívar":            [-75.85,  7.00, -73.85, 10.85],
  "boyaca":             [-74.65,  4.66, -71.95,  7.10],
  "boyacá":             [-74.65,  4.66, -71.95,  7.10],
  "caldas":             [-75.97,  4.85, -74.74,  5.80],
  "caqueta":            [-76.30, -0.10, -71.50,  2.95],
  "caquetá":            [-76.30, -0.10, -71.50,  2.95],
  "casanare":           [-73.10,  4.20, -69.85,  6.40],
  "cauca":              [-77.85,  1.30, -75.45,  3.50],
  "cesar":              [-74.40,  7.40, -72.65, 10.95],
  "choco":              [-77.95,  4.00, -75.95,  8.70],
  "chocó":              [-77.95,  4.00, -75.95,  8.70],
  "cordoba":            [-76.45,  7.50, -74.85,  9.45],
  "córdoba":            [-76.45,  7.50, -74.85,  9.45],
  "cundinamarca":       [-75.00,  3.69, -73.04,  5.83],
  "guainia":            [-71.20,  0.65, -66.85,  4.05],
  "guainía":            [-71.20,  0.65, -66.85,  4.05],
  "guaviare":           [-74.65,  0.65, -69.55,  3.10],
  "huila":              [-76.65,  1.55, -74.45,  3.85],
  "la guajira":         [-73.40, 10.40, -71.07, 12.50],
  "magdalena":          [-74.95,  8.95, -73.55, 11.55],
  "meta":               [-74.95,  1.55, -71.55,  4.95],
  "narino":             [-78.85,  0.55, -76.40,  2.70],
  "nariño":             [-78.85,  0.55, -76.40,  2.70],
  "norte de santander": [-73.55,  6.85, -72.00,  9.35],
  "putumayo":           [-77.45, -0.65, -73.95,  1.45],
  "quindio":            [-75.85,  4.20, -75.40,  4.85],
  "quindío":            [-75.85,  4.20, -75.40,  4.85],
  "risaralda":          [-76.40,  4.40, -75.40,  5.55],
  "san andres":         [-81.85, 12.35, -81.65, 13.40],
  "san andrés":         [-81.85, 12.35, -81.65, 13.40],
  "santander":          [-74.55,  5.70, -72.45,  8.10],
  "sucre":              [-75.75,  8.15, -74.55, 10.15],
  "tolima":             [-76.35,  2.85, -74.45,  5.55],
  "valle del cauca":    [-77.66,  3.05, -75.69,  5.08],
  "vaupes":             [-72.05, -1.20, -69.20,  2.05],
  "vaupés":             [-72.05, -1.20, -69.20,  2.05],
  "vichada":            [-72.10,  2.65, -67.40,  6.55],
};

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function colombiaBboxFor(departamento?: string | null): Bbox {
  if (!departamento) return CO_BBOX;
  const key = normalize(departamento);
  return DEPT_BBOX[key] ?? CO_BBOX;
}

const cache = new Map<string, AddressSuggestion[]>();
const MAX_CACHE = 100;

function cacheKey(q: string, lat?: number, lon?: number, dept?: string | null) {
  return `${q.toLowerCase()}|${lat?.toFixed(2) ?? ""}|${lon?.toFixed(2) ?? ""}|${dept ?? ""}`;
}

function setCache(key: string, value: AddressSuggestion[]) {
  if (cache.size >= MAX_CACHE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, value);
}

function formatLabel(props: Record<string, any>): string {
  const parts = [
    props.name,
    props.street && (props.housenumber ? `${props.street} ${props.housenumber}` : props.street),
  ].filter(Boolean);
  const seen = new Set<string>();
  return parts.filter((p) => {
    const k = String(p).toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).join(", ") || (props.city || props.county || "Ubicación");
}

function formatSublabel(props: Record<string, any>): string {
  const parts = [props.city || props.county || props.locality, props.state].filter(Boolean);
  return parts.join(" · ");
}

function isInColombia(props: Record<string, any>, lon: number, lat: number): boolean {
  if (props.countrycode && String(props.countrycode).toUpperCase() === "CO") return true;
  if (typeof props.country === "string" && normalize(props.country).includes("colombia")) return true;
  return lon >= CO_BBOX[0] && lon <= CO_BBOX[2] && lat >= CO_BBOX[1] && lat <= CO_BBOX[3];
}

function toSuggestion(feature: any): AddressSuggestion | null {
  const p = feature?.properties;
  const c = feature?.geometry?.coordinates;
  if (!p || !Array.isArray(c) || c.length < 2) return null;
  const lon = c[0];
  const lat = c[1];
  if (!isInColombia(p, lon, lat)) return null;
  return {
    label: formatLabel(p),
    sublabel: formatSublabel(p),
    lon,
    lat,
    ciudad: p.city || p.county || p.locality || undefined,
    departamento: p.state || undefined,
  };
}

export interface SearchOpts {
  lat?: number;
  lon?: number;
  bbox?: Bbox | null;
  departamento?: string | null;
  signal?: AbortSignal;
}

async function fetchPhoton(query: string, opts: SearchOpts, useBbox: boolean): Promise<AddressSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    lang: "es",
    limit: "10",
  });
  if (useBbox && opts.bbox) {
    params.set("bbox", opts.bbox.join(","));
  }
  if (typeof opts.lat === "number" && typeof opts.lon === "number") {
    params.set("lat", String(opts.lat));
    params.set("lon", String(opts.lon));
    params.set("location_bias_scale", "0.6");
  }
  const res = await fetch(`${PHOTON_BASE}/api/?${params.toString()}`, { signal: opts.signal });
  if (!res.ok) return [];
  const data = await res.json();
  const features: any[] = Array.isArray(data?.features) ? data.features : [];
  return features
    .map(toSuggestion)
    .filter((s): s is AddressSuggestion => s !== null);
}

export async function searchAddresses(
  query: string,
  opts: SearchOpts = {},
): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const key = cacheKey(q, opts.lat, opts.lon, opts.departamento);
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    // Primer intento: con bbox del departamento (si existe)
    let results = await fetchPhoton(q, opts, true);

    // Si hay departamento, priorizar coincidencias y completar con resto
    if (opts.departamento) {
      const dn = normalize(opts.departamento);
      const inDept = results.filter((r) => r.departamento && normalize(r.departamento) === dn);
      const others = results.filter((r) => !r.departamento || normalize(r.departamento) !== dn);
      results = [...inDept, ...others];
    }

    // Fallback: si bbox dejó la lista vacía, reintentar sin bbox (Colombia entera)
    if (results.length === 0 && opts.bbox) {
      results = await fetchPhoton(q, { ...opts, bbox: null }, false);
    }

    const out = results.slice(0, 10);
    setCache(key, out);
    return out;
  } catch {
    return [];
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<AddressSuggestion | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    lang: "es",
  });
  try {
    const res = await fetch(`${PHOTON_BASE}/reverse?${params.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    const f = data?.features?.[0];
    return f ? toSuggestion(f) : null;
  } catch {
    return null;
  }
}
