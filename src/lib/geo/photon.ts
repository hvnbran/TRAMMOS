// Cliente liviano para Photon (OpenStreetMap geocoder), filtrado a Colombia.
// Sin API key. Rate limit moderado: usar con debounce y cache.

export interface AddressSuggestion {
  label: string;       // Texto principal a mostrar / guardar
  sublabel?: string;   // Ciudad, departamento, país
  lat: number;
  lon: number;
  ciudad?: string;
  departamento?: string;
}

const PHOTON_BASE = "https://photon.komoot.io";

const cache = new Map<string, AddressSuggestion[]>();
const MAX_CACHE = 100;

function cacheKey(q: string, lat?: number, lon?: number) {
  return `${q.toLowerCase()}|${lat?.toFixed(2) ?? ""}|${lon?.toFixed(2) ?? ""}`;
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
  // Si name == street, evitar duplicar
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

function toSuggestion(feature: any): AddressSuggestion | null {
  const p = feature?.properties;
  const c = feature?.geometry?.coordinates;
  if (!p || !Array.isArray(c) || c.length < 2) return null;
  if (p.countrycode && String(p.countrycode).toUpperCase() !== "CO") return null;
  return {
    label: formatLabel(p),
    sublabel: formatSublabel(p),
    lon: c[0],
    lat: c[1],
    ciudad: p.city || p.county || p.locality || undefined,
    departamento: p.state || undefined,
  };
}

export async function searchAddresses(
  query: string,
  opts: { lat?: number; lon?: number; signal?: AbortSignal } = {},
): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const key = cacheKey(q, opts.lat, opts.lon);
  const cached = cache.get(key);
  if (cached) return cached;

  const params = new URLSearchParams({
    q,
    lang: "es",
    limit: "8",
  });
  if (typeof opts.lat === "number" && typeof opts.lon === "number") {
    params.set("lat", String(opts.lat));
    params.set("lon", String(opts.lon));
    params.set("location_bias_scale", "0.4");
  }

  try {
    const res = await fetch(`${PHOTON_BASE}/api/?${params.toString()}`, { signal: opts.signal });
    if (!res.ok) return [];
    const data = await res.json();
    const features: any[] = Array.isArray(data?.features) ? data.features : [];
    const out = features
      .map(toSuggestion)
      .filter((s): s is AddressSuggestion => s !== null)
      .slice(0, 8);
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
