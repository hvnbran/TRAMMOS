import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminOnly } from "@/components/layout/AdminOnly";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Loader2, Trash2, Repeat, Calendar, X } from "lucide-react";

export const Route = createFileRoute("/servicios-fijos")({
  component: () => (
    <AdminOnly>
      <ServiciosFijosPage />
    </AdminOnly>
  ),
  head: () => ({
    meta: [
      { title: "Servicios fijos — TRAMMOS" },
      { name: "description", content: "Servicios recurrentes por conductor" },
    ],
  }),
});

interface Fijo {
  id: string;
  conductor: string;
  vehiculo: string | null;
  pasajero: string | null;
  origen: string | null;
  destino: string | null;
  centro_costo: string | null;
  tipo: string | null;
  cliente: string | null;
  dias_semana: number[];
  hora_inicio_prog: string | null;
  hora_fin_prog: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  activo: boolean;
  notas: string | null;
}

interface Ejec {
  id: string;
  fecha: string;
  iniciado_at: string | null;
  finalizado_at: string | null;
  estado: string;
  notas_conductor: string | null;
}

const DIAS = [
  { v: 1, l: "L" },
  { v: 2, l: "M" },
  { v: 3, l: "M" },
  { v: 4, l: "J" },
  { v: 5, l: "V" },
  { v: 6, l: "S" },
  { v: 0, l: "D" },
];

const EMPTY: Omit<Fijo, "id"> = {
  conductor: "",
  vehiculo: "",
  pasajero: "",
  origen: "",
  destino: "",
  centro_costo: "",
  tipo: "Empresarial",
  cliente: "",
  dias_semana: [1, 2, 3, 4, 5],
  hora_inicio_prog: "07:00",
  hora_fin_prog: "17:00",
  fecha_inicio: new Date().toISOString().slice(0, 10),
  fecha_fin: null,
  activo: true,
  notas: "",
};

const HOSPITAL_SUR = "Hospital del Sur Itagüí";

function ServiciosFijosPage() {
  const [rows, setRows] = useState<Fijo[]>([]);
  const [loading, setLoading] = useState(true);
  const [conductores, setConductores] = useState<{ nombre: string }[]>([]);
  const [vehiculos, setVehiculos] = useState<{ placa: string }[]>([]);
  const [placaPorConductor, setPlacaPorConductor] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Fijo | null>(null);
  const [form, setForm] = useState<Omit<Fijo, "id">>(EMPTY);
  const [horarioLibre, setHorarioLibre] = useState(false);
  const [esHospitalSur, setEsHospitalSur] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detalle, setDetalle] = useState<Fijo | null>(null);
  const [ejecs, setEjecs] = useState<Ejec[]>([]);

  async function load() {
    setLoading(true);
    const [{ data: f }, { data: c }, { data: v }, { data: vc }] = await Promise.all([
      supabase.from("servicios_fijos").select("*").order("created_at", { ascending: false }),
      supabase.from("conductores").select("nombre").order("nombre"),
      supabase.from("vehiculos").select("placa").order("placa"),
      supabase
        .from("vehiculo_conductores")
        .select("asignado_hasta, conductores!inner(nombre), vehiculos!inner(placa)")
        .or("asignado_hasta.is.null,asignado_hasta.gte." + new Date().toISOString().slice(0, 10)),
    ]);
    setRows((f as Fijo[]) ?? []);
    setConductores(c ?? []);
    setVehiculos(v ?? []);
    const map: Record<string, string> = {};
    for (const row of (vc ?? []) as any[]) {
      const nombre = row.conductores?.nombre;
      const placa = row.vehiculos?.placa;
      if (nombre && placa && !map[nombre]) map[nombre] = placa;
    }
    setPlacaPorConductor(map);
    setLoading(false);
  }


  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setHorarioLibre(false);
    setEsHospitalSur(false);
    setShowForm(true);
  }
  function openEdit(f: Fijo) {
    setEditing(f);
    const { id: _id, ...rest } = f;
    setForm({ ...rest, notas: rest.notas ?? "" });
    setHorarioLibre(!rest.hora_inicio_prog && !rest.hora_fin_prog);
    setEsHospitalSur(rest.origen === HOSPITAL_SUR && rest.destino === HOSPITAL_SUR);
    setShowForm(true);
  }
  function onChangeConductor(nombre: string) {
    setForm((s) => {
      const placa = placaPorConductor[nombre];
      // Solo autocompleta si el vehículo actual está vacío o venía del conductor previo
      const prevPlaca = placaPorConductor[s.conductor];
      const nuevoVehiculo = !s.vehiculo || s.vehiculo === prevPlaca ? placa ?? s.vehiculo : s.vehiculo;
      return { ...s, conductor: nombre, vehiculo: nuevoVehiculo ?? "" };
    });
  }
  function toggleDia(d: number) {
    setForm((s) => ({
      ...s,
      dias_semana: s.dias_semana.includes(d)
        ? s.dias_semana.filter((x) => x !== d)
        : [...s.dias_semana, d].sort(),
    }));
  }

  async function save() {
    if (!form.conductor) {
      alert("Selecciona un conductor");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      vehiculo: form.vehiculo || null,
      pasajero: form.pasajero || null,
      origen: esHospitalSur ? HOSPITAL_SUR : form.origen || null,
      destino: esHospitalSur ? HOSPITAL_SUR : form.destino || null,
      centro_costo: form.centro_costo || null,
      tipo: form.tipo || null,
      cliente: esHospitalSur ? "hospital-sur" : form.cliente || null,
      fecha_fin: form.fecha_fin || null,
      notas: form.notas || null,
      hora_inicio_prog: horarioLibre ? null : form.hora_inicio_prog || null,
      hora_fin_prog: horarioLibre ? null : form.hora_fin_prog || null,
    };
    const { error } = editing
      ? await supabase.from("servicios_fijos").update(payload).eq("id", editing.id)
      : await supabase.from("servicios_fijos").insert(payload);
    setSaving(false);

    if (error) {
      alert("Error: " + error.message);
      return;
    }
    setShowForm(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este servicio fijo? Se borrarán también sus ejecuciones.")) return;
    await supabase.from("servicios_fijos").delete().eq("id", id);
    load();
  }

  async function verDetalle(f: Fijo) {
    setDetalle(f);
    setEjecs([]);
    const { data } = await supabase
      .from("servicio_fijo_ejecuciones")
      .select("*")
      .eq("servicio_fijo_id", f.id)
      .order("fecha", { ascending: false })
      .limit(60);
    setEjecs((data as Ejec[]) ?? []);
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Repeat className="h-6 w-6 text-primary" /> Servicios fijos
            </h1>
            <p className="text-sm text-muted-foreground">
              Contratos recurrentes que un conductor abre y cierra desde su app.
            </p>
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" /> Nuevo fijo
          </button>
        </header>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Aún no hay servicios fijos. Crea el primero con "Nuevo fijo".
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left p-2">Conductor</th>
                  <th className="text-left p-2">Vehículo</th>
                  <th className="text-left p-2">Ruta</th>
                  <th className="text-left p-2">Días</th>
                  <th className="text-left p-2">Horario</th>
                  <th className="text-left p-2">Estado</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => (
                  <tr key={f.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-2 font-medium">{f.conductor}</td>
                    <td className="p-2">{f.vehiculo ?? "—"}</td>
                    <td className="p-2 text-xs">
                      {f.origen ?? "—"} → {f.destino ?? "—"}
                    </td>
                    <td className="p-2 text-xs">
                      {DIAS.map((d) => (
                        <span
                          key={d.v}
                          className={`inline-block w-5 text-center ${
                            f.dias_semana.includes(d.v) ? "font-bold text-primary" : "text-muted-foreground/40"
                          }`}
                        >
                          {d.l}
                        </span>
                      ))}
                    </td>
                    <td className="p-2 text-xs">
                      {f.hora_inicio_prog?.slice(0, 5) ?? "--"}–{f.hora_fin_prog?.slice(0, 5) ?? "--"}
                    </td>
                    <td className="p-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          f.activo
                            ? "bg-success/15 text-success border-success/30"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {f.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="p-2 text-right">
                      <button onClick={() => verDetalle(f)} className="text-xs text-primary hover:underline mr-2">
                        Ejecuciones
                      </button>
                      <button onClick={() => openEdit(f)} className="text-xs text-primary hover:underline mr-2">
                        Editar
                      </button>
                      <button onClick={() => remove(f.id)} className="text-xs text-destructive hover:underline">
                        <Trash2 className="h-3.5 w-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal creación/edición */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div
            className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">{editing ? "Editar servicio fijo" : "Nuevo servicio fijo"}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Conductor *</label>
                <select
                  value={form.conductor}
                  onChange={(e) => setForm({ ...form, conductor: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecciona…</option>
                  {conductores.map((c) => (
                    <option key={c.nombre} value={c.nombre}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Vehículo (placa)</label>
                <select
                  value={form.vehiculo ?? ""}
                  onChange={(e) => setForm({ ...form, vehiculo: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">—</option>
                  {vehiculos.map((v) => (
                    <option key={v.placa} value={v.placa}>
                      {v.placa}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Pasajero</label>
                <input
                  value={form.pasajero ?? ""}
                  onChange={(e) => setForm({ ...form, pasajero: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Centro de costo</label>
                <input
                  value={form.centro_costo ?? ""}
                  onChange={(e) => setForm({ ...form, centro_costo: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground">Origen</label>
                <input
                  value={form.origen ?? ""}
                  onChange={(e) => setForm({ ...form, origen: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground">Destino</label>
                <input
                  value={form.destino ?? ""}
                  onChange={(e) => setForm({ ...form, destino: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">Días de la semana</label>
                <div className="flex gap-1">
                  {DIAS.map((d, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDia(d.v)}
                      className={`h-9 w-9 rounded-md text-sm font-semibold border ${
                        form.dias_semana.includes(d.v)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-input text-muted-foreground"
                      }`}
                    >
                      {d.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Hora inicio</label>
                <input
                  type="time"
                  value={form.hora_inicio_prog ?? ""}
                  onChange={(e) => setForm({ ...form, hora_inicio_prog: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Hora fin</label>
                <input
                  type="time"
                  value={form.hora_fin_prog ?? ""}
                  onChange={(e) => setForm({ ...form, hora_fin_prog: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Fecha inicio</label>
                <input
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Fecha fin (opcional)</label>
                <input
                  type="date"
                  value={form.fecha_fin ?? ""}
                  onChange={(e) => setForm({ ...form, fecha_fin: e.target.value || null })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground">Notas</label>
                <textarea
                  value={form.notas ?? ""}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <label className="md:col-span-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                />
                Activo
              </label>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <button onClick={() => setShowForm(false)} className="text-sm px-3 py-2">
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold disabled:opacity-50 inline-flex items-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle ejecuciones */}
      {detalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetalle(null)}>
          <div
            className="bg-card border border-border rounded-lg w-full max-w-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" /> Ejecuciones — {detalle.conductor}
              </h2>
              <button onClick={() => setDetalle(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              {ejecs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Aún no hay ejecuciones registradas.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      <th className="text-left p-1">Fecha</th>
                      <th className="text-left p-1">Inicio</th>
                      <th className="text-left p-1">Fin</th>
                      <th className="text-left p-1">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ejecs.map((e) => (
                      <tr key={e.id} className="border-t border-border">
                        <td className="p-1">{e.fecha}</td>
                        <td className="p-1">
                          {e.iniciado_at ? new Date(e.iniciado_at).toLocaleTimeString() : "—"}
                        </td>
                        <td className="p-1">
                          {e.finalizado_at ? new Date(e.finalizado_at).toLocaleTimeString() : "—"}
                        </td>
                        <td className="p-1">{e.estado}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
