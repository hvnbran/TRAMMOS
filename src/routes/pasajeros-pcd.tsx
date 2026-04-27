import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Pictograma, type PictogramaName } from "@/components/Pictograma";
import { SpeakButton } from "@/components/SpeakButton";
import { AccesoPasajeroPanel } from "@/components/pasajero/AccesoPasajeroPanel";
import {
  Plus, Search, Trash2, Pencil, Heart, Phone, Save, X,
  CheckCircle2, AlertCircle, Accessibility, ShieldCheck,
} from "lucide-react";
import { CardGridSkeleton } from "@/components/ui/loading-skeletons";
import {
  TIPOS_DISC, AYUDAS, COMUNICACIONES, NIVELES_ASIST, generarBrief,
  type PasajeroPCD, type TipoDisc, type Comunicacion,
} from "@/lib/pcd-helpers";

export const Route = createFileRoute("/pasajeros-pcd")({
  component: PasajerosPCD,
  head: () => ({
    meta: [
      { title: "Pasajeros con Discapacidad - TRAMMOS Accesible+" },
      { name: "description", content: "Perfil de accesibilidad por pasajero, brief automático para conductores y cumplimiento Ley 1618 de 2013." },
    ],
  }),
});

type ClienteTipo = "corona" | "sodimac";

const EMPTY: Omit<PasajeroPCD, "id" | "created_at" | "updated_at"> = {
  cliente: "corona",
  nombre: "",
  cedula: "",
  telefono: "",
  email: "",
  tipo_discapacidad: "ninguna",
  ayudas_tecnicas: [],
  silla_ruedas_medidas: "",
  comunicacion_preferida: "voz",
  nivel_asistencia: 0,
  contacto_emergencia_nombre: "",
  contacto_emergencia_telefono: "",
  contacto_emergencia_relacion: "",
  condiciones_medicas: "",
  alergias: "",
  medicamentos: "",
  notas_conductor: "",
  requiere_vehiculo_adaptado: false,
  permite_acompanante: true,
  consentimiento_datos: false,
};

function PasajerosPCD() {
  const { cliente: clienteSesion, role } = useAuth();
  const [list, setList] = useState<PasajeroPCD[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<TipoDisc | "todos">("todos");
  const [editing, setEditing] = useState<PasajeroPCD | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error: e } = await supabase
      .from("pasajeros_pcd")
      .select("*")
      .order("nombre");
    if (!e && data) setList(data as PasajeroPCD[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // Métricas (KPIs de inclusión)
  const stats = useMemo(() => {
    const total = list.length;
    const conDiscapacidad = list.filter((p) => p.tipo_discapacidad !== "ninguna").length;
    const requierenAdaptado = list.filter((p) => p.requiere_vehiculo_adaptado).length;
    const altaAsistencia = list.filter((p) => p.nivel_asistencia >= 2).length;
    return { total, conDiscapacidad, requierenAdaptado, altaAsistencia };
  }, [list]);

  const filtrados = useMemo(() => {
    return list.filter((p) => {
      if (filtroTipo !== "todos" && p.tipo_discapacidad !== filtroTipo) return false;
      if (!filtro.trim()) return true;
      const q = filtro.toLowerCase();
      return (
        p.nombre.toLowerCase().includes(q) ||
        (p.cedula ?? "").toLowerCase().includes(q) ||
        (p.telefono ?? "").includes(q)
      );
    });
  }, [list, filtro, filtroTipo]);

  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY, cliente: clienteSesion ?? "corona" });
    setShowForm(true);
    setError(null);
  }

  function openEdit(p: PasajeroPCD) {
    setEditing(p);
    setForm({
      cliente: p.cliente,
      nombre: p.nombre,
      cedula: p.cedula ?? "",
      telefono: p.telefono ?? "",
      email: p.email ?? "",
      tipo_discapacidad: p.tipo_discapacidad,
      ayudas_tecnicas: p.ayudas_tecnicas ?? [],
      silla_ruedas_medidas: p.silla_ruedas_medidas ?? "",
      comunicacion_preferida: p.comunicacion_preferida,
      nivel_asistencia: p.nivel_asistencia,
      contacto_emergencia_nombre: p.contacto_emergencia_nombre ?? "",
      contacto_emergencia_telefono: p.contacto_emergencia_telefono ?? "",
      contacto_emergencia_relacion: p.contacto_emergencia_relacion ?? "",
      condiciones_medicas: p.condiciones_medicas ?? "",
      alergias: p.alergias ?? "",
      medicamentos: p.medicamentos ?? "",
      notas_conductor: p.notas_conductor ?? "",
      requiere_vehiculo_adaptado: p.requiere_vehiculo_adaptado,
      permite_acompanante: p.permite_acompanante,
      consentimiento_datos: p.consentimiento_datos,
    });
    setShowForm(true);
    setError(null);
  }

  async function save() {
    setError(null);
    if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return; }
    if (!form.consentimiento_datos) { setError("Debes confirmar el consentimiento de datos sensibles."); return; }
    setSaving(true);
    const payload = {
      ...form,
      cedula: form.cedula || null,
      telefono: form.telefono || null,
      email: form.email || null,
      silla_ruedas_medidas: form.silla_ruedas_medidas || null,
      contacto_emergencia_nombre: form.contacto_emergencia_nombre || null,
      contacto_emergencia_telefono: form.contacto_emergencia_telefono || null,
      contacto_emergencia_relacion: form.contacto_emergencia_relacion || null,
      condiciones_medicas: form.condiciones_medicas || null,
      alergias: form.alergias || null,
      medicamentos: form.medicamentos || null,
      notas_conductor: form.notas_conductor || null,
    };
    if (editing) {
      const { error: e } = await supabase.from("pasajeros_pcd").update(payload).eq("id", editing.id);
      if (e) { setError(e.message); setSaving(false); return; }
      setSuccess("Perfil actualizado.");
    } else {
      const { error: e } = await supabase.from("pasajeros_pcd").insert([payload]);
      if (e) { setError(e.message); setSaving(false); return; }
      setSuccess("Pasajero registrado.");
    }
    setSaving(false);
    setShowForm(false);
    setTimeout(() => setSuccess(null), 3000);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este perfil PCD? Esta acción es irreversible.")) return;
    const { error: e } = await supabase.from("pasajeros_pcd").delete().eq("id", id);
    if (e) { setError(e.message); return; }
    await load();
  }

  function toggleAyuda(value: string) {
    setForm((f) => ({
      ...f,
      ayudas_tecnicas: f.ayudas_tecnicas.includes(value)
        ? f.ayudas_tecnicas.filter((a) => a !== value)
        : [...f.ayudas_tecnicas, value],
    }));
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Hero */}
        <header className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                <Accessibility className="h-7 w-7" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  TRAMMOS Accesible+
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                    Diferencial único
                  </span>
                </h1>
                <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                  Registra el perfil de accesibilidad de cada pasajero. El sistema entrega
                  automáticamente un brief al conductor antes de cada servicio para garantizar
                  ajustes razonables y cumplimiento de la Ley 1618 de 2013.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openNew}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Registrar pasajero PCD
            </button>
          </div>
        </header>

        {/* KPIs de inclusión */}
        <section aria-label="Indicadores de inclusión" className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Total perfiles" value={stats.total} pictoName="ninguna" />
          <KpiCard label="Con discapacidad" value={stats.conDiscapacidad} pictoName="multiple" />
          <KpiCard label="Vehículo adaptado" value={stats.requierenAdaptado} pictoName="silla_ruedas" />
          <KpiCard label="Asistencia ≥ media" value={stats.altaAsistencia} pictoName="emergencia" />
        </section>

        {/* Mensajes */}
        {success && (
          <div role="status" className="rounded-md bg-success/10 border border-success/30 px-3 py-2 text-sm text-success flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {success}
          </div>
        )}
        {error && (
          <div role="alert" className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4" aria-hidden="true" /> {error}
          </div>
        )}

        {/* Filtros */}
        <section className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar por nombre, cédula o teléfono"
              aria-label="Buscar pasajero PCD"
              className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <div className="flex items-center gap-1 flex-wrap" role="tablist" aria-label="Filtrar por tipo de discapacidad">
            <FilterChip active={filtroTipo === "todos"} onClick={() => setFiltroTipo("todos")}>Todos</FilterChip>
            {TIPOS_DISC.map((t) => (
              <FilterChip
                key={t.value}
                active={filtroTipo === t.value}
                onClick={() => setFiltroTipo(t.value)}
              >
                <Pictograma name={t.picto} size="sm" />
                <span className="ml-1">{t.label}</span>
              </FilterChip>
            ))}
          </div>
        </section>

        {/* Lista */}
        {loading ? (
          <CardGridSkeleton count={3} />
        ) : filtrados.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <Accessibility className="h-10 w-10 mx-auto text-muted-foreground mb-3" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              {list.length === 0
                ? "Aún no hay pasajeros PCD registrados. Crea el primero para activar el brief automático del conductor."
                : "No hay resultados para los filtros aplicados."}
            </p>
          </div>
        ) : (
          <ul className="grid gap-3" role="list">
            {filtrados.map((p) => (
              <PasajeroCard key={p.id} p={p} onEdit={() => openEdit(p)} onDelete={() => remove(p.id)} />
            ))}
          </ul>
        )}

        {/* Footer normativo */}
        <footer className="text-[11px] text-muted-foreground text-center pt-4 border-t border-border">
          TRAMMOS cumple Ley 1618 de 2013 · Decreto 1660 de 2003 · NTC 5854 · WCAG 2.1 AA
        </footer>
      </div>

      {/* Modal formulario */}
      {showForm && (
        <FormularioModal
          form={form}
          setForm={setForm}
          onClose={() => setShowForm(false)}
          onSave={save}
          saving={saving}
          editing={!!editing}
          error={error}
          isAdmin={role === "admin"}
          toggleAyuda={toggleAyuda}
        />
      )}
    </AppLayout>
  );
}

// ============================================================
// Subcomponentes
// ============================================================

function KpiCard({ label, value, pictoName }: { label: string; value: number; pictoName: PictogramaName }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
      <Pictograma name={pictoName} size="md" />
      <div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex items-center h-9 px-3 rounded-full text-xs font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function PasajeroCard({ p, onEdit, onDelete }: { p: PasajeroPCD; onEdit: () => void; onDelete: () => void }) {
  const tipoInfo = TIPOS_DISC.find((t) => t.value === p.tipo_discapacidad)!;
  const comInfo = COMUNICACIONES.find((c) => c.value === p.comunicacion_preferida)!;
  const nivelInfo = NIVELES_ASIST.find((n) => n.value === p.nivel_asistencia)!;
  const briefVoz = generarBrief(p);

  return (
    <li className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 flex-wrap">
        <Pictograma name={tipoInfo.picto} size="lg" />
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-foreground">{p.nombre}</h3>
            <span className="text-xs text-muted-foreground">
              {p.cliente === "corona" ? "Corona" : "Sodimac"}
            </span>
            {p.cedula && <span className="text-xs text-muted-foreground">CC {p.cedula}</span>}
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
              {tipoInfo.label}
            </span>
            <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${nivelInfo.color}`}>
              Nivel {p.nivel_asistencia} · {nivelInfo.label}
            </span>
            {p.requiere_vehiculo_adaptado && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/30">
                <Pictograma name="silla_ruedas" size="sm" />
                Vehículo adaptado
              </span>
            )}
          </div>

          {/* Ayudas técnicas como pictogramas */}
          {p.ayudas_tecnicas.length > 0 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap" aria-label="Ayudas técnicas que utiliza">
              {p.ayudas_tecnicas.map((a) => {
                const info = AYUDAS.find((x) => x.value === a);
                if (!info) return null;
                return <Pictograma key={a} name={info.picto} size="sm" label={info.label} />;
              })}
            </div>
          )}

          {/* Comunicación preferida + brief */}
          <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-md bg-muted/40 p-2 flex items-center gap-2">
              <Pictograma name={comInfo.picto} size="sm" />
              <div>
                <div className="text-[11px] text-muted-foreground">Comunicación preferida</div>
                <div className="font-medium">{comInfo.label}</div>
              </div>
            </div>
            {p.contacto_emergencia_telefono && (
              <a
                href={`tel:${p.contacto_emergencia_telefono}`}
                className="rounded-md bg-destructive/10 border border-destructive/30 p-2 flex items-center gap-2 hover:bg-destructive/15"
                aria-label={`Llamar a contacto de emergencia ${p.contacto_emergencia_nombre ?? ""}`}
              >
                <Heart className="h-4 w-4 text-destructive" aria-hidden="true" />
                <div>
                  <div className="text-[11px] text-muted-foreground">Emergencia</div>
                  <div className="font-medium text-destructive">
                    {p.contacto_emergencia_nombre ?? "Contacto"} · {p.contacto_emergencia_telefono}
                  </div>
                </div>
              </a>
            )}
          </div>

          {/* Brief para conductor */}
          <div className="mt-3 rounded-lg bg-primary/5 border border-primary/20 p-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Brief automático para el conductor
              </div>
              <SpeakButton text={briefVoz} label="Escuchar brief del conductor" />
            </div>
            <p className="text-sm text-foreground leading-relaxed">{briefVoz}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          {p.telefono && (
            <a
              href={`tel:${p.telefono}`}
              className="h-9 w-9 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40"
              aria-label={`Llamar a ${p.nombre}`}
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Editar perfil de ${p.nombre}`}
            className="h-9 w-9 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Eliminar perfil de ${p.nombre}`}
            className="h-9 w-9 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/40"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  );
}

// generarBrief vive en @/lib/pcd-helpers para que otras rutas lo importen.


function FormularioModal(props: {
  form: typeof EMPTY;
  setForm: (f: typeof EMPTY) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  editing: boolean;
  error: string | null;
  isAdmin: boolean;
  toggleAyuda: (value: string) => void;
}) {
  const { form, setForm, onClose, onSave, saving, editing, error, isAdmin, toggleAyuda } = props;
  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => setForm({ ...form, [k]: v });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-pcd-title"
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-2xl max-h-[95vh] overflow-y-auto bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <h2 id="form-pcd-title" className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Accessibility className="h-5 w-5 text-primary" aria-hidden="true" />
            {editing ? "Editar pasajero PCD" : "Nuevo pasajero PCD"}
          </h2>
          <button onClick={onClose} aria-label="Cerrar formulario" className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {error && (
            <div role="alert" className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* 1. Datos básicos */}
          <Section title="1. Datos básicos">
            <div className="grid sm:grid-cols-2 gap-3">
              {isAdmin && (
                <Field label="Cliente">
                  <select
                    value={form.cliente}
                    onChange={(e) => set("cliente", e.target.value as ClienteTipo)}
                    className="form-input"
                  >
                    <option value="corona">Corona</option>
                    <option value="sodimac">Sodimac</option>
                  </select>
                </Field>
              )}
              <Field label="Nombre completo *">
                <input className="form-input" value={form.nombre} onChange={(e) => set("nombre", e.target.value)} />
              </Field>
              <Field label="Cédula">
                <input className="form-input" value={form.cedula ?? ""} onChange={(e) => set("cedula", e.target.value)} />
              </Field>
              <Field label="Teléfono">
                <input className="form-input" value={form.telefono ?? ""} onChange={(e) => set("telefono", e.target.value)} />
              </Field>
              <Field label="Correo">
                <input type="email" className="form-input" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
              </Field>
            </div>
          </Section>

          {/* 2. Tipo de discapacidad */}
          <Section title="2. Tipo de discapacidad">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup">
              {TIPOS_DISC.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  role="radio"
                  aria-checked={form.tipo_discapacidad === t.value}
                  onClick={() => set("tipo_discapacidad", t.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                    form.tipo_discapacidad === t.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <Pictograma name={t.picto} size="md" />
                  <span className="text-xs font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* 3. Ayudas técnicas */}
          <Section title="3. Ayudas técnicas que utiliza">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AYUDAS.map((a) => {
                const active = form.ayudas_tecnicas.includes(a.value);
                return (
                  <button
                    key={a.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleAyuda(a.value)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-colors ${
                      active ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
                    }`}
                  >
                    <Pictograma name={a.picto} size="sm" />
                    <span className="text-[11px] text-center">{a.label}</span>
                  </button>
                );
              })}
            </div>
            {form.ayudas_tecnicas.includes("silla_ruedas") && (
              <Field label="Medidas de la silla (ancho x largo cm)" className="mt-3">
                <input
                  className="form-input"
                  placeholder="ej. 65 x 110"
                  value={form.silla_ruedas_medidas ?? ""}
                  onChange={(e) => set("silla_ruedas_medidas", e.target.value)}
                />
              </Field>
            )}
          </Section>

          {/* 4. Comunicación */}
          <Section title="4. ¿Cómo prefiere comunicarse?">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" role="radiogroup">
              {COMUNICACIONES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  role="radio"
                  aria-checked={form.comunicacion_preferida === c.value}
                  onClick={() => set("comunicacion_preferida", c.value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-colors ${
                    form.comunicacion_preferida === c.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <Pictograma name={c.picto} size="sm" />
                  <span className="text-[11px] text-center">{c.label}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* 5. Nivel de asistencia */}
          <Section title="5. Nivel de asistencia requerido">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup">
              {NIVELES_ASIST.map((n) => (
                <button
                  key={n.value}
                  type="button"
                  role="radio"
                  aria-checked={form.nivel_asistencia === n.value}
                  onClick={() => set("nivel_asistencia", n.value)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    form.nivel_asistencia === n.value
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <div className="text-lg font-bold">{n.value}</div>
                  <div className="text-xs">{n.label}</div>
                </button>
              ))}
            </div>
          </Section>

          {/* 6. Vehículo y acompañante */}
          <Section title="6. Preferencias del servicio">
            <label className="flex items-center gap-3 p-2 rounded-md border border-border cursor-pointer hover:bg-muted">
              <input
                type="checkbox"
                checked={form.requiere_vehiculo_adaptado}
                onChange={(e) => set("requiere_vehiculo_adaptado", e.target.checked)}
                className="h-4 w-4"
              />
              <Pictograma name="silla_ruedas" size="sm" />
              <span className="text-sm">Requiere vehículo adaptado (rampa / amplitud)</span>
            </label>
            <label className="flex items-center gap-3 p-2 rounded-md border border-border cursor-pointer hover:bg-muted mt-2">
              <input
                type="checkbox"
                checked={form.permite_acompanante}
                onChange={(e) => set("permite_acompanante", e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm">Permite acompañante en el servicio</span>
            </label>
          </Section>

          {/* 7. Contacto de emergencia */}
          <Section title="7. Contacto de emergencia">
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Nombre">
                <input className="form-input" value={form.contacto_emergencia_nombre ?? ""} onChange={(e) => set("contacto_emergencia_nombre", e.target.value)} />
              </Field>
              <Field label="Teléfono">
                <input className="form-input" value={form.contacto_emergencia_telefono ?? ""} onChange={(e) => set("contacto_emergencia_telefono", e.target.value)} />
              </Field>
              <Field label="Relación">
                <input className="form-input" placeholder="Madre, hijo, etc." value={form.contacto_emergencia_relacion ?? ""} onChange={(e) => set("contacto_emergencia_relacion", e.target.value)} />
              </Field>
            </div>
          </Section>

          {/* 8. Salud (opcional) */}
          <Section title="8. Información médica (opcional, voluntaria)">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Condiciones médicas">
                <textarea rows={2} className="form-input" value={form.condiciones_medicas ?? ""} onChange={(e) => set("condiciones_medicas", e.target.value)} />
              </Field>
              <Field label="Alergias">
                <textarea rows={2} className="form-input" value={form.alergias ?? ""} onChange={(e) => set("alergias", e.target.value)} />
              </Field>
              <Field label="Medicamentos" className="sm:col-span-2">
                <textarea rows={2} className="form-input" value={form.medicamentos ?? ""} onChange={(e) => set("medicamentos", e.target.value)} />
              </Field>
            </div>
          </Section>

          {/* 9. Brief para conductor */}
          <Section title="9. Notas adicionales para el conductor">
            <textarea
              rows={3}
              className="form-input"
              placeholder="Ej. 'Necesita 2 minutos extra para abordar', 'Prefiere ir en el asiento delantero'..."
              value={form.notas_conductor ?? ""}
              onChange={(e) => set("notas_conductor", e.target.value)}
            />
          </Section>

          {/* Consentimiento */}
          <label className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/30 cursor-pointer">
            <input
              type="checkbox"
              checked={form.consentimiento_datos}
              onChange={(e) => set("consentimiento_datos", e.target.checked)}
              className="h-4 w-4 mt-0.5"
            />
            <span className="text-sm text-foreground">
              Confirmo que el pasajero (o su tutor legal) autoriza el tratamiento de estos datos
              sensibles para mejorar el servicio de transporte, en cumplimiento de la
              <strong> Ley 1581 de 2012 </strong> y la <strong>Ley 1618 de 2013</strong>.
            </span>
          </label>
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border p-4 flex items-center justify-end gap-2">
          <button onClick={onClose} className="h-10 px-4 rounded-md border border-border hover:bg-muted text-sm">Cancelar</button>
          <button
            onClick={onSave}
            disabled={saving}
            className="h-10 px-5 rounded-md bg-primary text-primary-foreground hover:opacity-90 inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? "Guardando..." : editing ? "Actualizar" : "Guardar pasajero"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-lg border border-border p-3">
      <legend className="text-xs font-semibold text-muted-foreground px-1">{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-medium text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}
