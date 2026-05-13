import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchGpswoxDevices, normalizeDevice } from "./gpswox.server";

function normalizePlaca(s: string | null | undefined): string {
  return (s ?? "").toString().toUpperCase().replace(/[\s-]/g, "").trim();
}

/** Importa dispositivos desde GPSWOX y los upserta en vehiculos_gps. Solo admin. */
export const gpswoxImportDevices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw new Error("Solo administradores pueden importar GPS");

    const devices = await fetchGpswoxDevices();
    const normalized = devices.map(normalizeDevice);

    // Cargar vehículos para auto-emparejar por placa (nombre_dispositivo == placa)
    const { data: vehiculos } = await supabaseAdmin
      .from("vehiculos")
      .select("id, placa");
    const placaIndex = new Map<string, string>();
    for (const v of vehiculos ?? []) {
      placaIndex.set(normalizePlaca(v.placa), v.id);
    }

    let importados = 0;
    let emparejados = 0;
    let sinEmparejar = 0;

    for (const n of normalized) {
      const matchKey = normalizePlaca(n.nombre_dispositivo);
      const vehiculo_id = placaIndex.get(matchKey) ?? null;
      if (vehiculo_id) emparejados++;
      else sinEmparejar++;

      const { error } = await supabaseAdmin
        .from("vehiculos_gps")
        .upsert(
          {
            ...n,
            vehiculo_id,
            last_synced_at: new Date().toISOString(),
          },
          { onConflict: "gpswox_device_id" },
        );
      if (!error) importados++;

      if (vehiculo_id) {
        await supabaseAdmin
          .from("vehiculos")
          .update({ gps_device_id: n.gpswox_device_id })
          .eq("id", vehiculo_id);
      }
    }

    return { importados, emparejados, sinEmparejar, total: normalized.length };
  });

/** Sincroniza solo posiciones (rápido, idempotente). Solo admin. */
export const gpswoxSyncPositions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw new Error("Solo administradores pueden sincronizar GPS");

    const devices = await fetchGpswoxDevices();
    const now = new Date().toISOString();
    let actualizados = 0;
    for (const d of devices) {
      const n = normalizeDevice(d);
      const { error } = await supabaseAdmin
        .from("vehiculos_gps")
        .update({
          last_lat: n.last_lat,
          last_lon: n.last_lon,
          last_speed_kmh: n.last_speed_kmh,
          last_course: n.last_course,
          last_fix_at: n.last_fix_at,
          online: n.online,
          bateria: n.bateria,
          ignicion: n.ignicion,
          last_synced_at: now,
        })
        .eq("gpswox_device_id", n.gpswox_device_id);
      if (!error) actualizados++;
    }
    return { actualizados, total: devices.length };
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
