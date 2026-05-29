import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X, DollarSign, TrendingUp, Award, PackageCheck, Trophy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/crm/ventas")({
  component: VentasPage,
  head: () => ({ meta: [{ title: "Ventas y comisiones — CRM TRAMMOS" }] }),
});

type Venta = {
  id: string;
  numero: string | null;
  oportunidad_id: string | null;
  cliente_id: string;
  asesor_id: string | null;
  concesionario_id: string | null;
  vehiculo_catalogo_id: string | null;
  vehiculo_descripcion: string;
  placa: string | null;
  fecha_venta: string;
  fecha_entrega: string | null;
  estado: "Confirmada" | "Entregada" | "Cancelada";
  precio_cliente: number;
  costo: number;
  margen: number;
  comision_asesor: number;
  comision_asesor_pct: number | null;
  comision_trammos: number;
  comision_trammos_pct: number | null;
  forma_pago: string | null;
  notas: string | null;
};

type Lite = { id: string; nombre: string };
type VehLite = { id: string; marca: string; linea: string; modelo: string | null; precio_referencia: number; costo_referencia: number };

const INPUT = "w-full h-9 px-3 rounded-md border border-input bg-background text-sm";
const TEXTAREA = "w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[60px]";

const EMPTY = {
  numero: "",
  oportunidad_id: "",
  cliente_id: "",
  asesor_id: "",
  concesionario_id: "",
  vehiculo_catalogo_id: "",
  vehiculo_descripcion: "",
  placa: "",
  fecha_venta: new Date().toISOString().slice(0, 10),
  fecha_entrega: "",
  estado: "Confirmada" as Venta["estado"],
  precio_cliente: 0,
  costo: 0,
  comision_asesor: 0,
  comision_asesor_pct: 3,
  comision_trammos: 0,
  comision_trammos_pct: 2,
  forma_pago: "",
  notas: "",
};

const FORMAS_PAGO = ["Contado", "Crédito", "Leasing", "Mixto"];

const cop = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);

function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Lite[]>([]);
  const [asesores, setAsesores] = useState<Lite[]>([]);
  const [concesionarios, setConcesionarios] = useState<Lite[]>([]);
  const [vehiculos, setVehiculos] = useState<VehLite[]>([]);
  const [loading, setLoading] = useState(true);

  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [filterAsesor, setFilterAsesor] = useState<string>("");
  const [filterEstado, setFilterEstado] = useState<string>("");

  async function load() {
    setLoading(true);
    const [v, c, a, co, veh] = await Promise.all([
      supabase.from("crm_ventas").select("*").order("fecha_venta", { ascending: false }),
      supabase.from("crm_clientes").select("id,nombre").order("nombre"),
      supabase.from("crm_asesores").select("id,nombre").order("nombre"),
      supabase.from("crm_concesionarios").select("id,nombre").order("nombre"),
      supabase.from("crm_vehiculos_catalogo").select("id,marca,linea,modelo,precio_referencia,costo_referencia").eq("activo", true).order("marca"),
    ]);
    if (v.error) toast.error(v.error.message);
    setVentas((v.data as Venta[]) || []);
    setClientes((c.data as Lite[]) || []);
    setAsesores((a.data as Lite[]) || []);
    setConcesionarios((co.data as Lite[]) || []);
    setVehiculos((veh.data as VehLite[]) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return ventas.filter((v) => {
      if (filterAsesor && v.asesor_id !== filterAsesor) return false;
      if (filterEstado && v.estado !== filterEstado) return false;
      return true;
    });
  }, [ventas, filterAsesor, filterEstado]);

  // Métricas (sobre filtradas, excluyendo canceladas)
  const stats = useMemo(() => {
    const activas = filtered.filter((v) => v.estado !== "Cancelada");
    const ingresos = activas.reduce((s, v) => s + (v.precio_cliente || 0), 0);
    const margen = activas.reduce((s, v) => s + (v.margen || 0), 0);
    const comAsesor = activas.reduce((s, v) => s + (v.comision_asesor || 0), 0);
    const comTram = activas.reduce((s, v) => s + (v.comision_trammos || 0), 0);
    const ticket = activas.length > 0 ? ingresos / activas.length : 0;

    // Ranking asesores
    const byAsesor = new Map<string, { count: number; ingresos: number; margen: number; comision: number }>();
    for (const v of activas) {
      const k = v.asesor_id || "sin";
      const cur = byAsesor.get(k) || { count: 0, ingresos: 0, margen: 0, comision: 0 };
      cur.count += 1;
      cur.ingresos += v.precio_cliente || 0;
      cur.margen += v.margen || 0;
      cur.comision += v.comision_asesor || 0;
      byAsesor.set(k, cur);
    }
    const ranking = Array.from(byAsesor.entries())
      .map(([id, s]) => ({ id, nombre: asesores.find((a) => a.id === id)?.nombre || "Sin asesor", ...s }))
      .sort((a, b) => b.ingresos - a.ingresos);

    // Top vehículo
    const byVeh = new Map<string, number>();
    for (const v of activas) {
      byVeh.set(v.vehiculo_descripcion, (byVeh.get(v.vehiculo_descripcion) || 0) + 1);
    }
    const topVeh = Array.from(byVeh.entries()).sort((a, b) => b[1] - a[1])[0];

    return {
      total: activas.length, ingresos, margen, comAsesor, comTram, ticket, ranking,
      topVehiculo: topVeh ? { nombre: topVeh[0], count: topVeh[1] } : null,
    };
  }, [filtered, asesores]);

  function openNew() {
    setEditingId(null);
    setForm(EMPTY);
    setOpenForm(true);
  }
  function openEdit(v: Venta) {
    setEditingId(v.id);
    setForm({
      numero: v.numero ?? "",
      oportunidad_id: v.oportunidad_id ?? "",
      cliente_id: v.cliente_id,
      asesor_id: v.asesor_id ?? "",
      concesionario_id: v.concesionario_id ?? "",
      vehiculo_catalogo_id: v.vehiculo_catalogo_id ?? "",
      vehiculo_descripcion: v.vehiculo_descripcion,
      placa: v.placa ?? "",
      fecha_venta: v.fecha_venta,
      fecha_entrega: v.fecha_entrega ?? "",
      estado: v.estado,
      precio_cliente: v.precio_cliente,
      costo: v.costo,
      comision_asesor: v.comision_asesor,
      comision_asesor_pct: v.comision_asesor_pct ?? 0,
      comision_trammos: v.comision_trammos,
      comision_trammos_pct: v.comision_trammos_pct ?? 0,
      forma_pago: v.forma_pago ?? "",
      notas: v.notas ?? "",
    });
    setOpenForm(true);
  }

  function pickVehiculo(id: string) {
    const veh = vehiculos.find((x) => x.id === id);
    if (!veh) { setForm({ ...form, vehiculo_catalogo_id: id }); return; }
    const desc = [veh.marca, veh.linea, veh.modelo].filter(Boolean).join(" ");
    setForm({
      ...form,
      vehiculo_catalogo_id: id,
      vehiculo_descripcion: desc,
      precio_cliente: form.precio_cliente || veh.precio_referencia || 0,
      costo: form.costo || veh.costo_referencia || 0,
    });
  }

  // Auto-cálculo comisiones desde % cuando cambian precio_cliente o pct
  function syncComisionAsesorFromPct(pct: number) {
    setForm((f) => ({ ...f, comision_asesor_pct: pct, comision_asesor: Math.round(((f.precio_cliente || 0) * pct) / 100) }));
  }
  function syncComisionTrammosFromPct(pct: number) {
    setForm((f) => ({ ...f, comision_trammos_pct: pct, comision_trammos: Math.round(((f.precio_cliente || 0) * pct) / 100) }));
  }

  async function save() {
    if (!form.cliente_id) { toast.error("Selecciona el cliente"); return; }
    if (!form.vehiculo_descripcion.trim()) { toast.error("Indica el vehículo vendido"); return; }
    if (!form.precio_cliente || form.precio_cliente <= 0) { toast.error("Precio al cliente requerido"); return; }

    const payload = {
      numero: form.numero || null,
      oportunidad_id: form.oportunidad_id || null,
      cliente_id: form.cliente_id,
      asesor_id: form.asesor_id || null,
      concesionario_id: form.concesionario_id || null,
      vehiculo_catalogo_id: form.vehiculo_catalogo_id || null,
      vehiculo_descripcion: form.vehiculo_descripcion,
      placa: form.placa || null,
      fecha_venta: form.fecha_venta,
      fecha_entrega: form.fecha_entrega || null,
      estado: form.estado,
      precio_cliente: form.precio_cliente,
      costo: form.costo,
      comision_asesor: form.comision_asesor,
      comision_asesor_pct: form.comision_asesor_pct || null,
      comision_trammos: form.comision_trammos,
      comision_trammos_pct: form.comision_trammos_pct || null,
      forma_pago: form.forma_pago || null,
      notas: form.notas || null,
    };
    const op = editingId
      ? supabase.from("crm_ventas").update(payload).eq("id", editingId)
      : supabase.from("crm_ventas").insert([payload]);
    const { error } = await op;
    if (error) { toast.error(error.message); return; }
    toast.success(editingId ? "Venta actualizada" : "Venta registrada");
    setOpenForm(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar esta venta?")) return;
    const { error } = await supabase.from("crm_ventas").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Eliminada");
    load();
  }

  const KPIs: { label: string; value: string; icon: typeof DollarSign; color: string }[] = [
    { label: "Ventas", value: String(stats.total), icon: PackageCheck, color: "oklch(0.72 0.14 215)" },
    { label: "Ingresos", value: cop(stats.ingresos), icon: DollarSign, color: "oklch(0.78 0.18 145)" },
    { label: "Margen", value: cop(stats.margen), icon: TrendingUp, color: "oklch(0.75 0.15 90)" },
    { label: "Ticket promedio", value: cop(stats.ticket), icon: Award, color: "oklch(0.70 0.13 250)" },
    { label: "Com. asesores", value: cop(stats.comAsesor), icon: DollarSign, color: "oklch(0.72 0.16 40)" },
    { label: "Com. TRAMMOS", value: cop(stats.comTram), icon: Trophy, color: "oklch(0.85 0.18 125)" },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" /> Ventas y comisiones
          </h2>
          <p className="text-sm text-muted-foreground">Registro de ventas confirmadas con margen y comisiones por asesor.</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Nueva venta
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {KPIs.map((k) => (
          <div key={k.label} className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <k.icon className="h-3.5 w-3.5" style={{ color: k.color }} />
              {k.label}
            </div>
            <div className="text-lg font-bold mt-1 truncate" title={k.value}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filtros + análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs uppercase text-muted-foreground mb-2">Filtros</div>
          <div className="space-y-2">
            <select className={INPUT} value={filterAsesor} onChange={(e) => setFilterAsesor(e.target.value)}>
              <option value="">Todos los asesores</option>
              {asesores.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
            <select className={INPUT} value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
              <option value="">Todos los estados</option>
              <option value="Confirmada">Confirmada</option>
              <option value="Entregada">Entregada</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 lg:col-span-2">
          <div className="text-xs uppercase text-muted-foreground mb-2 flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5" /> Ranking de asesores
          </div>
          {stats.ranking.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay ventas en el periodo filtrado.</p>
          ) : (
            <div className="space-y-2">
              {stats.ranking.slice(0, 5).map((r, idx) => {
                const max = stats.ranking[0].ingresos || 1;
                const pct = Math.round((r.ingresos / max) * 100);
                return (
                  <div key={r.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate">#{idx + 1} {r.nombre}</span>
                      <span className="text-muted-foreground text-xs">{r.count} venta{r.count !== 1 ? "s" : ""} · {cop(r.ingresos)}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                      <div className="h-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, oklch(0.72 0.14 215), oklch(0.85 0.18 125))" }} />
                    </div>
                  </div>
                );
              })}
              {stats.topVehiculo && (
                <p className="text-xs text-muted-foreground pt-2 border-t border-border mt-3">
                  🚐 Vehículo más vendido: <strong className="text-foreground">{stats.topVehiculo.nombre}</strong> ({stats.topVehiculo.count})
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-10 text-center text-muted-foreground">
          No hay ventas con estos filtros. Registra la primera.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2">Fecha</th>
                <th className="text-left px-3 py-2">Cliente</th>
                <th className="text-left px-3 py-2">Vehículo</th>
                <th className="text-left px-3 py-2">Asesor</th>
                <th className="text-right px-3 py-2">Precio</th>
                <th className="text-right px-3 py-2">Margen</th>
                <th className="text-right px-3 py-2">Com. asesor</th>
                <th className="text-left px-3 py-2">Estado</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => {
                const cli = clientes.find((c) => c.id === v.cliente_id);
                const ase = asesores.find((a) => a.id === v.asesor_id);
                const estadoColor =
                  v.estado === "Entregada" ? "oklch(0.78 0.18 145)" :
                  v.estado === "Cancelada" ? "oklch(0.65 0.05 25)" :
                  "oklch(0.72 0.14 215)";
                return (
                  <tr key={v.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-3 py-2 whitespace-nowrap">{v.fecha_venta}</td>
                    <td className="px-3 py-2">{cli?.nombre || "—"}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{v.vehiculo_descripcion}</div>
                      {v.placa && <div className="text-xs text-muted-foreground">{v.placa}</div>}
                    </td>
                    <td className="px-3 py-2">{ase?.nombre || "—"}</td>
                    <td className="px-3 py-2 text-right font-medium">{cop(v.precio_cliente)}</td>
                    <td className="px-3 py-2 text-right" style={{ color: (v.margen || 0) >= 0 ? "oklch(0.6 0.15 145)" : "oklch(0.55 0.2 25)" }}>
                      {cop(v.margen || 0)}
                    </td>
                    <td className="px-3 py-2 text-right">{cop(v.comision_asesor)}</td>
                    <td className="px-3 py-2">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs" style={{ background: `color-mix(in oklch, ${estadoColor} 18%, transparent)`, color: estadoColor }}>
                        {v.estado}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => openEdit(v)} className="p-1.5 rounded hover:bg-muted" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => remove(v.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive" title="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Form modal */}
      {openForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-3xl max-h-[92vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
              <h3 className="font-semibold">{editingId ? "Editar venta" : "Nueva venta"}</h3>
              <button onClick={() => setOpenForm(false)} className="p-1 hover:bg-muted rounded"><X className="h-4 w-4" /></button>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground">N° Factura / Pedido</label>
                <input className={INPUT} value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground">Fecha venta *</label>
                <input type="date" className={INPUT} value={form.fecha_venta} onChange={(e) => setForm({ ...form, fecha_venta: e.target.value })} /></div>

              <div><label className="text-xs text-muted-foreground">Cliente *</label>
                <select className={INPUT} value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}>
                  <option value="">Selecciona…</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select></div>
              <div><label className="text-xs text-muted-foreground">Asesor</label>
                <select className={INPUT} value={form.asesor_id} onChange={(e) => setForm({ ...form, asesor_id: e.target.value })}>
                  <option value="">—</option>
                  {asesores.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select></div>

              <div><label className="text-xs text-muted-foreground">Concesionario</label>
                <select className={INPUT} value={form.concesionario_id} onChange={(e) => setForm({ ...form, concesionario_id: e.target.value })}>
                  <option value="">—</option>
                  {concesionarios.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select></div>
              <div><label className="text-xs text-muted-foreground">Vehículo del catálogo</label>
                <select className={INPUT} value={form.vehiculo_catalogo_id} onChange={(e) => pickVehiculo(e.target.value)}>
                  <option value="">Manual / otro</option>
                  {vehiculos.map((v) => <option key={v.id} value={v.id}>{v.marca} {v.linea} {v.modelo ?? ""}</option>)}
                </select></div>

              <div className="sm:col-span-2"><label className="text-xs text-muted-foreground">Descripción vehículo *</label>
                <input className={INPUT} value={form.vehiculo_descripcion} onChange={(e) => setForm({ ...form, vehiculo_descripcion: e.target.value })} placeholder="Marca Línea Modelo" /></div>

              <div><label className="text-xs text-muted-foreground">Placa</label>
                <input className={INPUT} value={form.placa} onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })} /></div>
              <div><label className="text-xs text-muted-foreground">Fecha entrega</label>
                <input type="date" className={INPUT} value={form.fecha_entrega} onChange={(e) => setForm({ ...form, fecha_entrega: e.target.value })} /></div>

              <div><label className="text-xs text-muted-foreground">Estado</label>
                <select className={INPUT} value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value as Venta["estado"] })}>
                  <option value="Confirmada">Confirmada</option>
                  <option value="Entregada">Entregada</option>
                  <option value="Cancelada">Cancelada</option>
                </select></div>
              <div><label className="text-xs text-muted-foreground">Forma de pago</label>
                <select className={INPUT} value={form.forma_pago} onChange={(e) => setForm({ ...form, forma_pago: e.target.value })}>
                  <option value="">—</option>
                  {FORMAS_PAGO.map((f) => <option key={f} value={f}>{f}</option>)}
                </select></div>

              <div><label className="text-xs text-muted-foreground">Precio al cliente (COP) *</label>
                <input type="number" className={INPUT} value={form.precio_cliente} onChange={(e) => setForm({ ...form, precio_cliente: Number(e.target.value) })} /></div>
              <div><label className="text-xs text-muted-foreground">Costo (COP)</label>
                <input type="number" className={INPUT} value={form.costo} onChange={(e) => setForm({ ...form, costo: Number(e.target.value) })} /></div>

              <div className="sm:col-span-2 grid grid-cols-2 gap-3 p-3 rounded-md bg-muted/30 border border-border">
                <div><label className="text-xs text-muted-foreground">% Comisión asesor</label>
                  <input type="number" step="0.1" className={INPUT} value={form.comision_asesor_pct} onChange={(e) => syncComisionAsesorFromPct(Number(e.target.value))} /></div>
                <div><label className="text-xs text-muted-foreground">Comisión asesor (COP)</label>
                  <input type="number" className={INPUT} value={form.comision_asesor} onChange={(e) => setForm({ ...form, comision_asesor: Number(e.target.value) })} /></div>
                <div><label className="text-xs text-muted-foreground">% Comisión TRAMMOS</label>
                  <input type="number" step="0.1" className={INPUT} value={form.comision_trammos_pct} onChange={(e) => syncComisionTrammosFromPct(Number(e.target.value))} /></div>
                <div><label className="text-xs text-muted-foreground">Comisión TRAMMOS (COP)</label>
                  <input type="number" className={INPUT} value={form.comision_trammos} onChange={(e) => setForm({ ...form, comision_trammos: Number(e.target.value) })} /></div>
              </div>

              <div className="sm:col-span-2 text-sm bg-muted/20 rounded-md p-3 border border-border">
                <strong>Margen estimado:</strong>{" "}
                <span style={{ color: (form.precio_cliente - form.costo) >= 0 ? "oklch(0.6 0.15 145)" : "oklch(0.55 0.2 25)" }}>
                  {cop(form.precio_cliente - form.costo)}
                </span>
                {" · "}
                <strong>Utilidad neta TRAMMOS:</strong>{" "}
                {cop((form.precio_cliente - form.costo) - form.comision_asesor)}
              </div>

              <div className="sm:col-span-2"><label className="text-xs text-muted-foreground">Notas</label>
                <textarea className={TEXTAREA} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} /></div>
            </div>

            <div className="p-4 border-t border-border flex justify-end gap-2 sticky bottom-0 bg-card">
              <button onClick={() => setOpenForm(false)} className="h-9 px-4 rounded-md border border-input text-sm">Cancelar</button>
              <button onClick={save} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
