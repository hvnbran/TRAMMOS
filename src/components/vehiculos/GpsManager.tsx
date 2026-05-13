import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { gpswoxImportDevices, gpswoxSyncPositions, gpswoxLinkVehiculo } from "@/lib/gps/gpswox.functions";
import { Loader2, Satellite, RefreshCw, Link2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface GpsRow {
  id: string;
  gpswox_device_id: number;
  nombre_dispositivo: string;
  imei: string | null;
  grupo: string | null;
  vehiculo_id: string | null;
  online: string | null;
  last_lat: number | null;
  last_lon: number | null;
  last_speed_kmh: number | null;
  last_fix_at: string | null;
}

interface VehOpt { id: string; placa: string; }

function estadoLabel(online: string | null) {
  if (online === "online" || online === "ack" || online === "engine") return { txt: "En línea", ok: true };
  return { txt: "Sin reportar", ok: false };
}

function tiempoDesde(iso: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return new Date(iso).toLocaleString("es-CO");
}

export function GpsManager() {
  const [rows, setRows] = useState<GpsRow[]>([]);
  const [vehs, setVehs] = useState<VehOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [open, setOpen] = useState(false);

  const importFn = useServerFn(gpswoxImportDevices);
  const syncFn = useServerFn(gpswoxSyncPositions);
  const linkFn = useServerFn(gpswoxLinkVehiculo);

  async function load() {
    setLoading(true);
    const [{ data: gps }, { data: v }] = await Promise.all([
      supabase.from("vehiculos_gps").select("id, gpswox_device_id, nombre_dispositivo, imei, grupo, vehiculo_id, online, last_lat, last_lon, last_speed_kmh, last_fix_at").order("nombre_dispositivo"),
      supabase.from("vehiculos").select("id, placa").order("placa"),
    ]);
    setRows((gps ?? []) as GpsRow[]);
    setVehs((v ?? []) as VehOpt[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleImport() {
    setImporting(true);
    try {
      const r = await importFn();
      toast.success(`Importados ${r.importados} GPS · ${r.emparejados} con vehículo · ${r.sinEmparejar} sin emparejar`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al importar");
    } finally { setImporting(false); }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const r = await syncFn();
      toast.success(`Posiciones actualizadas: ${r.actualizados}/${r.total}`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al sincronizar");
    } finally { setSyncing(false); }
  }

  async function handleLink(gpsId: string, vehiculoId: string) {
    try {
      await linkFn({ data: { gpsId, vehiculoId: vehiculoId || null } });
      toast.success("Vínculo actualizado");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
            <Satellite className="w-5 h-5 text-cyan-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Dispositivos GPS</h3>
            <p className="text-xs text-gray-500">
              {rows.length === 0
                ? "Importa los GPS desde serverusa.digital"
                : `${rows.length} GPS · ${rows.filter((r) => r.vehiculo_id).length} vinculados`}
            </p>
          </div>
        </div>
        <span className="text-sm text-gray-500">{open ? "Ocultar" : "Mostrar"}</span>
      </button>

      {open && (
        <div className="border-t border-gray-200 p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleImport}
              disabled={importing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Satellite className="w-4 h-4" />}
              Importar dispositivos
            </button>
            <button
              onClick={handleSync}
              disabled={syncing || rows.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Actualizar posiciones
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Cargando…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-500">Aún no hay dispositivos. Pulsa "Importar" para traerlos desde serverusa.digital.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left">Dispositivo</th>
                    <th className="px-3 py-2 text-left">Estado</th>
                    <th className="px-3 py-2 text-left">Último reporte</th>
                    <th className="px-3 py-2 text-left">Vehículo</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const e = estadoLabel(r.online);
                    return (
                      <tr key={r.id} className="border-t border-gray-100">
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-900">{r.nombre_dispositivo}</div>
                          <div className="text-xs text-gray-500">IMEI {r.imei ?? "—"}</div>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${e.ok ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                            {e.ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {e.txt}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-600 text-xs">{tiempoDesde(r.last_fix_at)}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Link2 className="w-3 h-3 text-gray-400" />
                            <select
                              value={r.vehiculo_id ?? ""}
                              onChange={(ev) => handleLink(r.id, ev.target.value)}
                              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                            >
                              <option value="">— Sin vincular —</option>
                              {vehs.map((v) => (
                                <option key={v.id} value={v.id}>{v.placa}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
