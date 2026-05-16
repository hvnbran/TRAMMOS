import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminOnly } from "@/components/layout/AdminOnly";

import { crearInvitacionRegistro } from "@/lib/cuentas/invitaciones.functions";
import { listarEmpresas, crearEmpresa } from "@/lib/empresas/empresas.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2, Accessibility, Users, Loader2, Copy, Check, KeyRound,
  Plus, Link2, Building,
} from "lucide-react";

export const Route = createFileRoute("/cuentas")({
  component: () => (
    <AdminOnly>
      <CuentasPage />
    </AdminOnly>
  ),
  head: () => ({
    meta: [
      { title: "Creación de cuentas - TRAMMOS" },
      { name: "description", content: "Crear cuentas de empresa, pasajeros y conductores" },
    ],
  }),
});

type Tab = "empresa" | "pasajero" | "conductor";

type Empresa = {
  id: string;
  nombre: string;
  slug: string;
  cliente_legacy: string | null;
  activo: boolean;
};

function genPassword(len = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz";
  let p = "";
  for (let i = 0; i < len; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p;
}

// ============== Hook: lista de empresas ==============

function useEmpresas() {
  const listar = useServerFn(listarEmpresas);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const r = await listar();
      setEmpresas((r.empresas ?? []) as Empresa[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { empresas, loading, refresh };
}

// ============== Selector de empresa con botón "Crear" ==============

function EmpresaSelector({
  empresas,
  value,
  onChange,
  onCreate,
  filterOnlyLegacy = false,
}: {
  empresas: Empresa[];
  value: string;
  onChange: (id: string) => void;
  onCreate: () => void;
  filterOnlyLegacy?: boolean;
}) {
  const opts = filterOnlyLegacy ? empresas.filter((e) => !!e.cliente_legacy) : empresas;
  return (
    <div className="flex gap-2">
      <select
        className="input flex-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      >
        <option value="">— Selecciona empresa —</option>
        {opts.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nombre}{e.cliente_legacy ? ` · ${e.cliente_legacy}` : ""}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onCreate}
        className="text-xs px-3 rounded border border-border hover:bg-secondary inline-flex items-center gap-1"
        title="Crear empresa nueva"
      >
        <Plus className="h-3.5 w-3.5" /> Nueva
      </button>
    </div>
  );
}

// ============== Modal: crear empresa ==============

function CrearEmpresaModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (e: Empresa) => void;
}) {
  const crear = useServerFn(crearEmpresa);
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setNombre("");
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await crear({ data: { nombre } });
      onCreated(r.empresa as Empresa);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-card border border-border shadow-lg p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">Crear empresa nueva</h2>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Nombre de la empresa">
            <input
              className="input"
              autoFocus
              required
              minLength={2}
              maxLength={120}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Bavaria SAS"
            />
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="text-sm px-3 py-1.5 rounded border border-border">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Crear empresa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============== Página principal ==============

function CuentasPage() {
  const [tab, setTab] = useState<Tab>("empresa");
  const { refresh } = useEmpresas();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Creación de cuentas</h1>
          <p className="text-sm text-muted-foreground">
            Crea y administra las credenciales para empresas (monitoreo), pasajeros PcD y conductores.
            Cada cuenta queda asociada a una empresa específica.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-muted/40 border border-border max-w-2xl">
          <TabBtn active={tab === "empresa"} onClick={() => setTab("empresa")} icon={<Building2 className="h-4 w-4" />} label="Empresa" />
          <TabBtn active={tab === "pasajero"} onClick={() => setTab("pasajero")} icon={<Accessibility className="h-4 w-4" />} label="Pasajero" />
          <TabBtn active={tab === "conductor"} onClick={() => setTab("conductor")} icon={<Users className="h-4 w-4" />} label="Conductor" />
        </div>

        {tab === "empresa" && <EmpresaTab />}
        {tab === "pasajero" && <PasajeroTab />}
        {tab === "conductor" && <ConductorTab />}
      </div>

      <CrearEmpresaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => refresh()}
      />
    </AppLayout>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium transition-all ${
        active ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ResultadoCredenciales({ email, password, onReset }: { email: string; password: string; onReset: () => void }) {
  const [copied, setCopied] = useState(false);
  const text = `Email: ${email}\nContraseña: ${password}`;
  return (
    <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
      <p className="text-xs text-muted-foreground">Cuenta creada. Comparte estas credenciales al usuario:</p>
      <pre className="text-sm font-mono bg-background p-3 rounded border border-border whitespace-pre-wrap break-all">{text}</pre>
      <div className="flex gap-2">
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="text-sm inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-primary-foreground"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
        <button onClick={onReset} className="text-sm px-3 py-1.5 rounded border border-border">
          <Plus className="h-4 w-4 inline mr-1" /> Crear otra
        </button>
      </div>
    </div>
  );
}

// ============== Generador de invitaciones ==============
// ============== Tab Empresa ==============

function EmpresaTab() {
  const crearInv = useServerFn(crearInvitacionRegistro);
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [expira, setExpira] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generar() {
    setLoading(true);
    setError(null);
    setLink(null);
    try {
      const r = await crearInv({ data: { tipo: "empresa", expires_in_hours: 168 } });
      const url = `${window.location.origin}/r/${r.token}`;
      setLink(url);
      setExpira(r.expiresAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="Enlace de auto-registro de empresa">
      <div className="space-y-4 max-w-2xl">
        <p className="text-sm text-muted-foreground">
          Genera un enlace y envíalo a la empresa. Ellos mismos llenan su nombre,
          correo y contraseña. Al completar el registro, la empresa aparece automáticamente
          en el listado de administración.
        </p>

        <button onClick={generar} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
          Generar enlace de registro
        </button>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {link && (
          <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Comparte este enlace con la empresa. Es de un solo uso.
            </p>
            <pre className="text-sm font-mono bg-background p-3 rounded border border-border whitespace-pre-wrap break-all">{link}</pre>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(link);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="text-sm inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-primary-foreground"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado" : "Copiar enlace"}
              </button>
              <button onClick={generar} className="text-sm px-3 py-1.5 rounded border border-border">
                <Plus className="h-4 w-4 inline mr-1" /> Generar otro
              </button>
              {expira && (
                <span className="text-[11px] text-muted-foreground">
                  Expira: {new Date(expira).toLocaleString("es-CO")}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// ============== Tab Pasajero ==============

function PasajeroTab() {
  const crearInv = useServerFn(crearInvitacionRegistro);
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [expira, setExpira] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generar() {
    setLoading(true);
    setError(null);
    setLink(null);
    try {
      const r = await crearInv({ data: { tipo: "pasajero", expires_in_hours: 168 } });
      const url = `${window.location.origin}/r/${r.token}`;
      setLink(url);
      setExpira(r.expiresAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="Enlace de auto-registro de pasajero">
      <div className="space-y-4 max-w-2xl">
        <p className="text-sm text-muted-foreground">
          Genera un enlace y envíalo al pasajero. Él mismo completa todos sus datos
          (incluyendo discapacidad, ayudas técnicas, contacto de emergencia, etc.) y
          elige a qué empresa pertenece. Al finalizar, queda registrado automáticamente
          en el listado de pasajeros PcD.
        </p>

        <button onClick={generar} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
          Generar enlace de registro
        </button>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {link && (
          <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Comparte este enlace con el pasajero. Es de un solo uso.
            </p>
            <pre className="text-sm font-mono bg-background p-3 rounded border border-border whitespace-pre-wrap break-all">{link}</pre>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(link);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="text-sm inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-primary-foreground"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado" : "Copiar enlace"}
              </button>
              <button onClick={generar} className="text-sm px-3 py-1.5 rounded border border-border">
                <Plus className="h-4 w-4 inline mr-1" /> Generar otro
              </button>
              {expira && (
                <span className="text-[11px] text-muted-foreground">
                  Expira: {new Date(expira).toLocaleString("es-CO")}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// ============== Tab Conductor (sin cambios funcionales en esta fase) ==============

function ConductorTab() {
  const [conductores, setConductores] = useState<Array<{ id: string; nombre: string; cedula: string | null; acceso_habilitado: boolean }>>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<{ id: string; nombre: string; cedula: string | null } | null>(null);
  const [password, setPassword] = useState(genPassword());
  const [error, setError] = useState<string | null>(null);
  const [savedPassword, setSavedPassword] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("conductores")
      .select("id, nombre, cedula, acceso_habilitado")
      .order("nombre");
    setConductores((data ?? []) as typeof conductores);
    setLoading(false);
  }

  async function guardar() {
    if (!selected || password.length < 6) return;
    setError(null);
    const { error: err } = await supabase.rpc("set_conductor_password", {
      _conductor_id: selected.id,
      _password: password,
    });
    if (err) {
      setError(err.message);
      return;
    }
    setSavedPassword(password);
  }

  const filtered = conductores.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.nombre.toLowerCase().includes(q) || (c.cedula ?? "").toLowerCase().includes(q);
  });

  return (
    <Card title="Acceso de conductor">
      <p className="text-sm text-muted-foreground mb-3">
        Selecciona un conductor para asignarle su contraseña. Inicia sesión en{" "}
        <code className="text-xs">/conductor/login</code> con su cédula y la contraseña.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <div className="border border-border rounded-lg overflow-hidden flex flex-col max-h-[500px]">
          <div className="p-2 border-b border-border space-y-2">
            <input
              className="input text-sm"
              placeholder="Buscar por nombre o cédula…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => conductores.length === 0 && load()}
            />
          </div>
          <div className="overflow-y-auto divide-y divide-border">
            {loading && <p className="p-3 text-sm text-muted-foreground">Cargando…</p>}
            {!loading && conductores.length === 0 && (
              <button onClick={load} className="w-full p-3 text-sm text-primary hover:bg-secondary">
                Cargar conductores
              </button>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelected({ id: c.id, nombre: c.nombre, cedula: c.cedula });
                  setSavedPassword(null);
                  setPassword(genPassword());
                  setError(null);
                }}
                className={`w-full text-left p-3 hover:bg-secondary/50 ${
                  selected?.id === c.id ? "bg-secondary/70" : ""
                }`}
              >
                <div className="font-medium text-sm">{c.nombre}</div>
                <div className="text-xs text-muted-foreground">
                  {c.cedula ?? "Sin cédula"} · {c.acceso_habilitado ? "Acceso activo" : "Sin acceso"}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          {!selected ? (
            <div className="border border-dashed border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
              Selecciona un conductor de la lista.
            </div>
          ) : savedPassword ? (
            <ResultadoCredenciales
              email={`Cédula: ${selected.cedula ?? "—"}`}
              password={savedPassword}
              onReset={() => {
                setSavedPassword(null);
                setSelected(null);
              }}
            />
          ) : (
            <div className="space-y-3 max-w-md">
              <div>
                <div className="text-sm font-semibold">{selected.nombre}</div>
                <div className="text-xs text-muted-foreground">Cédula: {selected.cedula ?? "—"}</div>
              </div>
              <Field label="Nueva contraseña">
                <div className="flex gap-2">
                  <input className="input flex-1 font-mono" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} />
                  <button type="button" onClick={() => setPassword(genPassword())} className="text-xs px-3 rounded border border-border hover:bg-secondary">
                    Aleatoria
                  </button>
                </div>
              </Field>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button onClick={guardar} className="btn-primary">
                <KeyRound className="h-4 w-4" /> Guardar contraseña
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-base font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
