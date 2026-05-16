// Cliente server-only para la API de GPSWOX (serverusa.digital).
// No importar desde código cliente.

export interface GpswoxSensor {
  tag_name?: string;
  name?: string;
  value?: unknown;
  val?: unknown;
  type?: string;
}

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
  time?: string;
  icon_color?: string;
  address?: string;
  distance_unit_hour?: string;
  sensors?: GpswoxSensor[];
  // Algunas instalaciones devuelven estos en root
  battery?: string | number;
  signal?: string | number;
  satellites?: string | number;
  protocol?: string;
}

function base(): string {
  return process.env.GPSWOX_API_BASE || "https://serverusa.digital/api";
}

function hash(): string {
  const h = process.env.GPSWOX_USER_API_HASH;
  if (!h) throw new Error("GPSWOX_USER_API_HASH no está configurado");
  return h;
}

/**
 * GET /api/get_devices — devuelve dispositivos.
 *
 * GPSWOX puede responder en varias formas según versión:
 *   1. Array<{ title, items: Device[] }>     (agrupado por carpeta)
 *   2. { status:1, items: Device[] }         (plano)
 *   3. { status:0, message:"..." }           (error 200 con cuerpo de error)
 *   4. Device[]                              (plano, sin grupos)
 */
export async function fetchGpswoxDevices(): Promise<GpswoxDevice[]> {
  const url = `${base()}/get_devices?lang=es&user_api_hash=${encodeURIComponent(hash())}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`GPSWOX get_devices falló: ${res.status} ${res.statusText}`);
  }
  const raw = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      `GPSWOX devolvió HTML/no-JSON (probable login redirect). Verifica GPSWOX_USER_API_HASH. Primeros 200 chars: ${raw.slice(0, 200)}`,
    );
  }

  // status:0 — error reportado por la API con HTTP 200
  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    "status" in data &&
    (data as { status: number }).status === 0
  ) {
    const msg = (data as { message?: string }).message ?? "API rechazó la petición";
    throw new Error(`GPSWOX error: ${msg}`);
  }

  const out: GpswoxDevice[] = [];

  // Forma 1: array de grupos
  if (Array.isArray(data)) {
    for (const g of data as Array<{ title?: string; items?: GpswoxDevice[] } & GpswoxDevice>) {
      if (Array.isArray(g.items)) {
        for (const it of g.items) out.push({ ...it, group: g.title });
      } else if (typeof (g as GpswoxDevice).id === "number") {
        out.push(g as GpswoxDevice);
      }
    }
    return out;
  }

  // Forma 2/4: items planos
  if (data && typeof data === "object") {
    const items = (data as { items?: GpswoxDevice[] }).items;
    if (Array.isArray(items)) return items;
  }

  return out;
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
  direccion: string | null;
  bateria_gps: number | null;
  bateria_vehiculo: number | null;
  sim_signal: number | null;
  satelites: number | null;
  kilometraje: number | null;
  bloqueo: boolean | null;
  novedad: string | null;
  raw: unknown;
}

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^\d.+-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function findSensor(d: GpswoxDevice, tags: string[]): GpswoxSensor | undefined {
  if (!Array.isArray(d.sensors)) return undefined;
  const lc = tags.map((t) => t.toLowerCase());
  return d.sensors.find((s) => {
    const t = (s.tag_name || s.name || s.type || "").toString().toLowerCase();
    return lc.some((tag) => t.includes(tag));
  });
}

export function normalizeDevice(d: GpswoxDevice): NormalizedDevice {
  const ignSensor = findSensor(d, ["ignition", "ignicion"]);
  const batGpsSensor = findSensor(d, ["battery_level", "bateria_gps", "batt_int", "internal_battery"]);
  const batVehSensor = findSensor(d, ["power", "external_power", "voltage", "battery_vehicle", "main_power"]);
  const odoSensor = findSensor(d, ["odometer", "mileage", "kilometraje"]);
  const sigSensor = findSensor(d, ["gsm", "signal", "sim"]);
  const satSensor = findSensor(d, ["satellite"]);
  const blkSensor = findSensor(d, ["block", "bloqueo", "engine_block", "immobilizer"]);
  const novSensor = findSensor(d, ["alarm", "novedad", "event"]);

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
    bateria: batGpsSensor ? String(batGpsSensor.value ?? batGpsSensor.val ?? "") : null,
    ignicion: ignSensor ? Boolean(ignSensor.val ?? ignSensor.value) : null,
    icon_color: d.icon_color ?? null,
    direccion: d.address ?? null,
    bateria_gps: batGpsSensor ? num(batGpsSensor.value ?? batGpsSensor.val) : num(d.battery),
    bateria_vehiculo: batVehSensor ? num(batVehSensor.value ?? batVehSensor.val) : null,
    sim_signal: sigSensor ? num(sigSensor.value ?? sigSensor.val) : num(d.signal),
    satelites: satSensor ? num(satSensor.value ?? satSensor.val) : num(d.satellites),
    kilometraje: odoSensor ? num(odoSensor.value ?? odoSensor.val) : null,
    bloqueo: blkSensor ? Boolean(blkSensor.val ?? blkSensor.value) : null,
    novedad: novSensor ? String(novSensor.value ?? novSensor.val ?? "") : null,
    raw: d,
  };
}
