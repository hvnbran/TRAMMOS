import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Fragment, useEffect, useMemo, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { AdminOnly } from "../components/layout/AdminOnly";
import {
  Plus,
  MapPin,
  Building2,
  DollarSign,
  Inbox,
  Trash2,
  Loader2,
  X,
  Upload,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { TarifaEditable } from "@/components/operacion/TarifaEditable";
import { TipoEditable } from "@/components/operacion/TipoEditable";
import { DepartamentoEditable } from "@/components/operacion/DepartamentoEditable";
import { ImportarExcelModal } from "@/components/operacion/ImportarExcelModal";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  cliente: fallback(z.enum(["all", "corona", "sodimac"]), "all").default("all"),
  depto: fallback(z.string(), "all").default("all"),
  tipo: fallback(z.string(), "all").default("all"),
  page: fallback(z.number().int().min(1), 1).default(1),
  pageSize: fallback(z.enum(["10", "25", "50", "100"]), "10").default("10"),
  agrupar: fallback(z.boolean(), true).default(true),
});

export const Route = createFileRoute("/operacion")({
  validateSearch: zodValidator(searchSchema),
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

const TIPOS = ["Empresarial", "Turismo", "Salud", "Escolar", "Otro"];

function Operacion() {
  const { cliente } = useAuth();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/operacion" });
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CentroCosto[]>([]);
  const [serviciosMesByCC, setServiciosMesByCC] = useState<Map<string, number>>(new Map());
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
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

  // Departamentos únicos
  const departamentosUnicos = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.departamento && r.departamento.trim()) set.add(r.departamento.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [rows]);

  // Filtrado
  const rowsFiltradas = useMemo(() => {
    const q = search.q.trim().toLowerCase();
    return rows.filter((r) => {
      if (search.cliente !== "all" && r.cliente !== search.cliente) return false;
      if (search.depto !== "all") {
        const d = (r.departamento ?? "").trim();
        if (search.depto === "__none__" ? d !== "" : d !== search.depto) return false;
      }
      if (search.tipo !== "all" && r.tipo !== search.tipo) return false;
      if (q) {
        const hay = `${r.codigo} ${r.origen} ${r.destino}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search.q, search.cliente, search.depto, search.tipo]);

  // Ordenado: si agrupar, por depto+codigo; si no, por codigo
  const rowsOrdenadas = useMemo(() => {
    const arr = [...rowsFiltradas];
    if (search.agrupar) {
      arr.sort((a, b) => {
        const da = (a.departamento ?? "ZZZZ").localeCompare(b.departamento ?? "ZZZZ", "es");
        if (da !== 0) return da;
        return a.codigo.localeCompare(b.codigo, "es");
      });
    }
    return arr;
  }, [rowsFiltradas, search.agrupar]);

  const pageSize = parseInt(search.pageSize, 10);
  const totalPages = Math.max(1, Math.ceil(rowsOrdenadas.length / pageSize));
  const currentPage = Math.min(search.page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const rowsPaginadas = rowsOrdenadas.slice(startIdx, startIdx + pageSize);

  // Para agrupar: armar bloques
  const bloques = useMemo(() => {
    if (!search.agrupar) return null;
    const groups: Array<{ depto: string; rows: CentroCosto[] }> = [];
    rowsPaginadas.forEach((r) => {
      const d = r.departamento?.trim() || "Sin departamento";
      const last = groups[groups.length - 1];
      if (last && last.depto === d) last.rows.push(r);
      else groups.push({ depto: d, rows: [r] });
    });
    return groups;
  }, [rowsPaginadas, search.agrupar]);

  function updateSearch(patch: Partial<z.infer<typeof searchSchema>>, resetPage = true) {
    void navigate({
      search: (prev: z.infer<typeof searchSchema>) => ({ ...prev, ...patch, ...(resetPage ? { page: 1 } : {}) }),
    });
  }

  const hasFilters =
    search.q !== "" || search.cliente !== "all" || search.depto !== "all" || search.tipo !== "all";

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

  const totalSrvMes = rows.reduce((acc, r) => acc + srvMesFor(r), 0);

  // Paginación: rango compacto
  const pageNumbers = useMemo(() => {
    const out: (number | "…")[] = [];
    const add = (n: number) => out.push(n);
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) add(i);
    } else {
      add(1);
      if (currentPage > 3) out.push("…");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) add(i);
      if (currentPage < totalPages - 2) out.push("…");
      add(totalPages);
    }
    return out;
  }, [currentPage, totalPages]);

  const COLSPAN = 8;

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Operación</h1>
            <p className="text-sm text-muted-foreground">Centros de costo, rutas y tarifas</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
            >
              <Upload className="h-4 w-4" />
              Importar Excel
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nueva Ruta
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-primary/15 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="text-2xl font-bold">{loading ? "—" : departamentosUnicos.length}</span>
              <p className="text-xs text-muted-foreground">
                Departamento{departamentosUnicos.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-accent/15 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-accent" />
            </div>
            <div>
              <span className="text-2xl font-bold">
                {loading
                  ? "—"
                  : hasFilters
                    ? `${rowsFiltradas.length} / ${rows.length}`
                    : rows.length}
              </span>
              <p className="text-xs text-muted-foreground">Rutas {hasFilters ? "filtradas" : "activas"}</p>
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

        {/* Filtros */}
        <div className="rounded-lg border border-border bg-card p-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search.q}
              onChange={(e) => updateSearch({ q: e.target.value })}
              placeholder="Buscar por código, origen o destino…"
              className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-border bg-background"
            />
          </div>

          {!cliente && (
            <select
              value={search.cliente}
              onChange={(e) =>
                updateSearch({ cliente: e.target.value as "all" | "corona" | "sodimac" })
              }
              className="text-sm rounded-md border border-border bg-background px-3 py-2 capitalize"
            >
              <option value="all">Todos los clientes</option>
              <option value="corona">Corona</option>
              <option value="sodimac">Sodimac</option>
            </select>
          )}

          <select
            value={search.depto}
            onChange={(e) => updateSearch({ depto: e.target.value })}
            className="text-sm rounded-md border border-border bg-background px-3 py-2 max-w-[200px]"
          >
            <option value="all">Todos los departamentos</option>
            <option value="__none__">Sin departamento</option>
            {departamentosUnicos.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={search.tipo}
            onChange={(e) => updateSearch({ tipo: e.target.value })}
            className="text-sm rounded-md border border-border bg-background px-3 py-2"
          >
            <option value="all">Todos los tipos</option>
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-muted-foreground px-2 cursor-pointer">
            <input
              type="checkbox"
              checked={search.agrupar}
              onChange={(e) => updateSearch({ agrupar: e.target.checked }, false)}
            />
            Agrupar por departamento
          </label>

          {hasFilters && (
            <button
              onClick={() =>
                updateSearch({ q: "", cliente: "all", depto: "all", tipo: "all" })
              }
              className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-md hover:bg-secondary text-muted-foreground"
            >
              <Filter className="h-3 w-3" />
              Limpiar
            </button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="p-10 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : rowsOrdenadas.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center text-muted-foreground px-4">
              <Inbox className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm text-foreground font-medium">
                {hasFilters ? "Sin resultados con los filtros aplicados" : "Aún no hay rutas registradas"}
              </p>
              <p className="text-xs mt-1">
                {hasFilters ? "Intenta ajustar los filtros" : 'Crea la primera ruta con el botón "Nueva Ruta"'}
              </p>
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
                  {bloques
                    ? bloques.map((g) => (
                        <Fragment key={g.depto}>
                          <tr className="bg-secondary/40 border-b border-border">
                            <td colSpan={COLSPAN} className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {g.depto} <span className="text-muted-foreground/70 normal-case font-normal">· {g.rows.length} ruta{g.rows.length === 1 ? "" : "s"}</span>
                            </td>
                          </tr>
                          {g.rows.map((cc) => renderRow(cc))}
                        </Fragment>
                      ))
                    : rowsPaginadas.map((cc) => renderRow(cc))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paginación */}
        {!loading && rowsOrdenadas.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="text-muted-foreground">
              Mostrando {startIdx + 1}–{Math.min(startIdx + pageSize, rowsOrdenadas.length)} de{" "}
              {rowsOrdenadas.length}
            </div>
            <div className="flex items-center gap-1">
              <select
                value={search.pageSize}
                onChange={(e) =>
                  updateSearch({ pageSize: e.target.value as "10" | "25" | "50" | "100" })
                }
                className="text-xs rounded border border-border bg-background px-2 py-1 mr-2"
              >
                <option value="10">10 / pág</option>
                <option value="25">25 / pág</option>
                <option value="50">50 / pág</option>
                <option value="100">100 / pág</option>
              </select>
              <button
                disabled={currentPage === 1}
                onClick={() => updateSearch({ page: currentPage - 1 }, false)}
                className="p-1.5 rounded border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {pageNumbers.map((n, i) =>
                n === "…" ? (
                  <span key={`e${i}`} className="px-2 text-muted-foreground">
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    onClick={() => updateSearch({ page: n }, false)}
                    className={`min-w-[2rem] px-2 py-1 rounded border text-xs ${
                      n === currentPage
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-secondary"
                    }`}
                  >
                    {n}
                  </button>
                ),
              )}
              <button
                disabled={currentPage === totalPages}
                onClick={() => updateSearch({ page: currentPage + 1 }, false)}
                className="p-1.5 rounded border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
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
                    list="form-deptos"
                    value={form.departamento}
                    onChange={(e) => setForm({ ...form, departamento: e.target.value })}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Antioquia"
                  />
                  <datalist id="form-deptos">
                    {departamentosUnicos.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
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

      {showImport && (
        <ImportarExcelModal
          defaultCliente={cliente ?? null}
          onClose={() => setShowImport(false)}
          onDone={() => void load()}
        />
      )}
    </AppLayout>
  );

  function renderRow(cc: CentroCosto) {
    return (
      <tr key={cc.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
        <td className="px-4 py-3 font-medium">{cc.codigo}</td>
        <td className="px-4 py-3 capitalize">{cc.cliente}</td>
        <td className="px-4 py-3">
          <span className="flex items-center gap-1">
            {cc.origen} <span className="text-muted-foreground">→</span> {cc.destino}
          </span>
        </td>
        <td className="px-4 py-3">
          <DepartamentoEditable
            id={cc.id}
            value={cc.departamento}
            options={departamentosUnicos}
            onSaved={(v) => setRows((rs) => rs.map((r) => (r.id === cc.id ? { ...r, departamento: v } : r)))}
          />
        </td>
        <td className="px-4 py-3">
          <TipoEditable
            id={cc.id}
            value={cc.tipo}
            onSaved={(v) => setRows((rs) => rs.map((r) => (r.id === cc.id ? { ...r, tipo: v } : r)))}
          />
        </td>
        <td className="px-4 py-3 text-right">
          <TarifaEditable
            id={cc.id}
            value={cc.tarifa}
            onSaved={(v) => setRows((rs) => rs.map((r) => (r.id === cc.id ? { ...r, tarifa: v } : r)))}
          />
        </td>
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
    );
  }
}
