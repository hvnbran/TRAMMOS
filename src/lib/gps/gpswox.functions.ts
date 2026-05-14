import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchGpswoxDevices, normalizeDevice } from "./gpswox.server";

function normalizePlaca(s: string | null | undefined): string {
  return (s ?? "").toString().toUpperCase().replace(/[\s-]/g, "").trim();
}

/**
 * Sincroniza dispositivos GPSWOX: hace upsert (descubre nuevos automáticamente)
 * y refresca posiciones. Sin necesidad de "importar" manualmente.
 * Reutilizable desde server (cron) y desde admin UI.
 */
export async function runGpswoxSync(): Promise<{
  total: number;
  upserted: number;
  emparejados: number;
}> {
  const devices = await fetchGpswoxDevices();
  const now = new Date().toISOString();

  const { data: vehiculos } = await supabaseAdmin
    .from("vehiculos")
    .select("id, placa");
  const placaIndex = new Map<string, string>();
  for (const v of vehiculos ?? []) {
    placaIndex.set(normalizePlaca(v.placa), v.id);
  }

  let upserted = 0;
  let emparejados = 0;

  for (const d of devices) {
    const n = normalizeDevice(d);
    const matchKey = normalizePlaca(n.nombre_dispositivo);
    const vehiculo_id = placaIndex.get(matchKey) ?? null;
    if (vehiculo_id) emparejados++;

    // No pisar el vínculo manual: si ya existe fila, no tocar vehiculo_id
    const { data: existing } = await supabaseAdmin
      .from("vehiculos_gps")
      .select("id, vehiculo_id")
      .eq("gpswox_device_id", n.gpswox_device_id)
      .maybeSingle();

    const row = {
      ...n,
      raw: n.raw as never,
      vehiculo_id: existing?.vehiculo_id ?? vehiculo_id,
      last_synced_at: now,
    };
    const { error } = await supabaseAdmin
      .from("vehiculos_gps")
      .upsert(row, { onConflict: "gpswox_device_id" });
    if (!error) upserted++;

    if (!existing && vehiculo_id) {
      await supabaseAdmin
        .from("vehiculos")
        .update({ gps_device_id: n.gpswox_device_id })
        .eq("id", vehiculo_id);
    }
  }

  return { total: devices.length, upserted, emparejados };
}

/** Sync manual desde admin UI. */
export const gpswoxSyncPositions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw new Error("Solo administradores");
    return runGpswoxSync();
  });

/** Vincular manualmente un GPS a un vehículo. Solo admin. */
export const gpswoxLinkVehiculo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { gpsId: string; vehiculoId: string | null }) => d)
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw new Error("Solo administradores");

    const { data: gps, error: gErr } = await supabaseAdmin
      .from("vehiculos_gps")
      .update({ vehiculo_id: data.vehiculoId })
      .eq("id", data.gpsId)
      .select("gpswox_device_id")
      .single();
    if (gErr) throw new Error(gErr.message);

    if (data.vehiculoId) {
      await supabaseAdmin
        .from("vehiculos")
        .update({ gps_device_id: gps.gpswox_device_id })
        .eq("id", data.vehiculoId);
    }
    return { ok: true };
  });
