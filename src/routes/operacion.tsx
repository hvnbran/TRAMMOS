import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { AdminOnly } from "../components/layout/AdminOnly";
import { Plus, MapPin, Building2, DollarSign, Inbox, Trash2, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";


export const Route = createFileRoute("/operacion")({
  component: () => (
    <AdminOnly>
      <Operacion />
    </AdminOnly>
  ),
  head: () => ({
    meta: [
      { title: "Operación - TRAMMOS" },
      { name: "description", content: "Centros de costo y rutas operativas" },
    ],
  }),
});

interface CentroCosto {
  id: string;
  cliente: "corona" | "sodimac";
  codigo: string;
  origen: string;
  destino: string;
  departamento: string | null;
  tipo: string;
  tarifa: number;
  descripcion: string | null;
  activo: boolean;
}

const TIPOS = ["Empresarial", "VIP", "Especial", "Otro"];

function getTipoBadge(tipo: string) {
  switch (tipo) {
    case "Empresarial":
      return "bg-primary/15 text-primary";
    case "VIP":
      return "bg-accent/15 text-accent";
    case "Especial":
      return "bg-success/15 text-success";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

function Operacion() {
  const { cliente } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CentroCosto[]>([]);
  const [serviciosMesByCC, setServiciosMesByCC] = useState<Map<string, number>>(new Map());
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    codigo: "",
    origen: "",
    destino: "",
    departamento: "",
    tipo: "Empresarial",
    tarifa: "",
    descripcion: "",
    cliente: (cliente ?? "corona") as "corona" | "sodimac",
  });

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente]);

  async function load() {
    setLoading(true);
    try {
      let q = supabase.from("centros_costo").select("*").order("codigo");
      if (cliente) q = q.eq("cliente", cliente);
      const { data } = await q;
      setRows((data as CentroCosto[]) ?? []);

      // Servicios este mes para columna srv/mes (por origen+destino match)
      const monthStart = new Date();
      monthStart.setDate(1);
      let sq = supabase
        .from("servicios")
        .select("origen,destino")
        .gte("fecha", monthStart.toISOString().slice(0, 10));
      if (cliente) sq = sq.eq("cliente", cliente);
      const { data: srv } = await sq;
      const map = new Map<string, number>();
      srv?.forEach((s: { origen: string | null; destino: string | null }) => {
        const k = `${(s.origen ?? "").trim().toLowerCase()}|${(s.destino ?? "").trim().toLowerCase()}`;
        map.set(k, (map.get(k) ?? 0) + 1);
      });
      setServiciosMesByCC(map);
    } finally {
      setLoading(false);
    }
  }

  function srvMesFor(cc: CentroCosto): number {
    const k = `${cc.origen.trim().toLowerCase()}|${cc.destino.trim().toLowerCase()}`;
    return serviciosMesByCC.get(k) ?? 0;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.codigo || !form.origen || !form.destino) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("centros_costo").insert({
        cliente: form.cliente,
        codigo: form.codigo.trim(),
        origen: form.origen.trim(),
        destino: form.destino.trim(),
        departamento: form.departamento.trim() || null,
        tipo: form.tipo,
        tarifa: parseFloat(form.tarifa || "0"),
        descripcion: form.descripcion.trim() || null,
      });
      if (error) {
        alert("Error: " + error.message);
        return;
      }
      setShowForm(false);
      setForm({
        codigo: "",
        origen: "",
        destino: "",
        departamento: "",
        tipo: "Empresarial",
        tarifa: "",
        descripcion: "",
        cliente: (cliente ?? "corona") as "corona" | "sodimac",
      });
      void load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta ruta?")) return;
    const { error } = await supabase.from("centros_costo").delete().eq("id", id);
    if (error) {
      alert("Error: " + error.message);
      return;
    }
    void load();
  }

  const clientesActivos = new Set(rows.map((r) => r.cliente)).size;
  const totalSrvMes = rows.reduce((acc, r) => acc + srvMesFor(r), 0);

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Operación</h1>
            <p className="text-sm text-muted-foreground">Centros de costo, rutas y tarifas</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nueva Ruta
          </button>
        </div>

        {/* Solicitudes entrantes (realtime) */}
        <SolicitudesEntrantes />

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-primary/15 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="text-2xl font-bold">{loading ? "—" : clientesActivos}</span>
              <p className="text-xs text-muted-foreground">Cliente{clientesActivos === 1 ? "" : "s"} activo{clientesActivos === 1 ? "" : "s"}</p>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-accent/15 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-accent" />
            </div>
            <div>
              <span className="text-2xl font-bold">{loading ? "—" : rows.length}</span>
              <p className="text-xs text-muted-foreground">Rutas activas</p>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-success/15 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <div>
              <span className="text-2xl font-bold">{loading ? "—" : totalSrvMes}</span>
              <p className="text-xs text-muted-foreground">Servicios/mes</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="p-10 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center text-muted-foreground px-4">
              <Inbox className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm text-foreground font-medium">Aún no hay rutas registradas</p>
              <p className="text-xs mt-1">Crea la primera ruta con el botón "Nueva Ruta"</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Código</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ruta</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Departamento</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Tarifa</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Srv/Mes</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((cc) => (
                    <tr key={cc.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{cc.codigo}</td>
                      <td className="px-4 py-3 capitalize">{cc.cliente}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1">
                          {cc.origen} <span className="text-muted-foreground">→</span> {cc.destino}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{cc.departamento ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTipoBadge(cc.tipo)}`}>{cc.tipo}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatCOP(cc.tarifa)}</td>
                      <td className="px-4 py-3 text-right">{srvMesFor(cc)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(cc.id)}
                          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Nueva ruta */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !saving && setShowForm(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSave}
            className="w-full max-w-lg rounded-lg border border-border bg-card shadow-xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-lg font-semibold">Nueva Ruta</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Código *</label>
                  <input
                    type="text"
                    required
                    value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="CC001"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Cliente *</label>
                  <select
                    value={form.cliente}
                    disabled={!!cliente}
                    onChange={(e) => setForm({ ...form, cliente: e.target.value as "corona" | "sodimac" })}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm capitalize"
                  >
                    <option value="corona">Corona</option>
                    <option value="sodimac">Sodimac</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Origen *</label>
                  <input
                    type="text"
                    required
                    value={form.origen}
                    onChange={(e) => setForm({ ...form, origen: e.target.value })}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Destino *</label>
                  <input
                    type="text"
                    required
                    value={form.destino}
                    onChange={(e) => setForm({ ...form, destino: e.target.value })}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Departamento</label>
                  <input
                    type="text"
                    value={form.departamento}
                    onChange={(e) => setForm({ ...form, departamento: e.target.value })}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Antioquia"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    {TIPOS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tarifa (COP)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={form.tarifa}
                  onChange={(e) => setForm({ ...form, tarifa: e.target.value })}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="185000"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Descripción</label>
                <textarea
                  rows={2}
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-secondary/30">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-md hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </AppLayout>
  );
}
