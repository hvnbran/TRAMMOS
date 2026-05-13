// Cliente server-only para la API de GPSWOX (serverusa.digital).
// No importar desde código cliente.

export interface GpswoxDevice {
  id: number;
  name: string;
  imei?: string;
  group?: string;
  lat?: number;
  lng?: number;
  speed?: number;
  course?: number;
  online?: string; // "online" | "ack" | "offline" | "engine"
  timestamp?: number;
  acktimestamp?: number;
  icon_color?: string;
  sensors?: Array<{ tag_name?: string; value?: string; val?: unknown; type?: string }>;
}

function base(): string {
  return process.env.GPSWOX_API_BASE || "https://serverusa.digital/api";
}

function hash(): string {
  const h = process.env.GPSWOX_USER_API_HASH;
  if (!h) throw new Error("GPSWOX_USER_API_HASH no está configurado");
  return h;
}

/** GET /api/get_devices — devuelve dispositivos agrupados por carpeta. */
export async function fetchGpswoxDevices(): Promise<GpswoxDevice[]> {
  const url = `${base()}/get_devices?lang=es&user_api_hash=${encodeURIComponent(hash())}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GPSWOX get_devices falló: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  const groups: Array<{ items?: GpswoxDevice[] }> = Array.isArray(data) ? data : [];
  const all: GpswoxDevice[] = [];
  for (const g of groups) {
    if (Array.isArray(g.items)) {
      for (const it of g.items) {
        all.push({ ...it, group: (g as { title?: string }).title });
      }
    }
  }
  return all;
}

export interface NormalizedDevice {
  gpswox_device_id: number;
  imei: string | null;
  nombre_dispositivo: string;
  grupo: string | null;
  last_lat: number | null;
  last_lon: number | null;
  last_speed_kmh: number | null;
  last_course: number | null;
  last_fix_at: string | null;
  online: string | null;
  bateria: string | null;
  ignicion: boolean | null;
  icon_color: string | null;
  raw: unknown;
}

export function normalizeDevice(d: GpswoxDevice): NormalizedDevice {
  const sensorByTag = (tag: string) => d.sensors?.find((s) => s.tag_name === tag);
  const ignSensor = sensorByTag("ignition");
  const batSensor = d.sensors?.find((s) => s.type === "battery");
  const ts = d.acktimestamp || d.timestamp;
  return {
    gpswox_device_id: d.id,
    imei: d.imei ?? null,
    nombre_dispositivo: d.name ?? `GPS ${d.id}`,
    grupo: d.group ?? null,
    last_lat: typeof d.lat === "number" ? d.lat : null,
    last_lon: typeof d.lng === "number" ? d.lng : null,
    last_speed_kmh: typeof d.speed === "number" ? d.speed : null,
    last_course: typeof d.course === "number" ? d.course : null,
    last_fix_at: ts ? new Date(ts * 1000).toISOString() : null,
    online: d.online ?? null,
    bateria: batSensor ? String(batSensor.value ?? "") : null,
    ignicion: ignSensor ? Boolean(ignSensor.val) : null,
    icon_color: d.icon_color ?? null,
    raw: d,
  };
}
