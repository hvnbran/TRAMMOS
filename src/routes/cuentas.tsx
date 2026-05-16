import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminOnly } from "@/components/layout/AdminOnly";
import {
  crearCuentaEmpresa,
  crearCuentaPasajero,
} from "@/lib/cuentas/cuentas.functions";
import { crearInvitacionRegistro } from "@/lib/cuentas/invitaciones.functions";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Accessibility, Users, Loader2, Copy, Check, KeyRound, Plus, Link2 } from "lucide-react";

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

function genPassword(len = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz";
  let p = "";
  for (let i = 0; i < len; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p;
}

function CuentasPage() {
  const [tab, setTab] = useState<Tab>("empresa");

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Creación de cuentas</h1>
          <p className="text-sm text-muted-foreground">
            Crea y administra las credenciales para empresas (monitoreo), pasajeros PcD y conductores.
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

function InvitacionGenerator({ tipo }: { tipo: "empresa" | "pasajero" }) {
  const crearInv = useServerFn(crearInvitacionRegistro);
  const [rol, setRol] = useState<"corona" | "sodimac" | "admin">("corona");
  const [cliente, setCliente] = useState<"corona" | "sodimac">("corona");
  const [emailSug, setEmailSug] = useState("");
  const [horas, setHoras] = useState(72);
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [expira, setExpira] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generar() {
    setLoading(true);
    setError(null);
    try {
      const r = await crearInv({
        data: {
          tipo,
          rol: tipo === "empresa" ? rol : undefined,
          cliente: tipo === "pasajero" ? cliente : undefined,
          email_sugerido: emailSug || undefined,
          expires_in_hours: horas,
        },
      });
      const url = `${window.location.origin}/registro/${r.token}`;
      setLink(url);
      setExpira(r.expiresAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Generar enlace de registro (un solo uso)</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Crea un enlace secreto para que {tipo === "empresa" ? "el usuario de la empresa" : "el pasajero"} complete sus propios datos. El enlace deja de funcionar al usarse o al expirar.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {tipo === "empresa" ? (
          <Field label="Rol">
            <select className="input" value={rol} onChange={(e) => setRol(e.target.value as typeof rol)}>
              <option value="corona">Corona</option>
              <option value="sodimac">Sodimac</option>
              <option value="admin">Admin TRAMMOS</option>
            </select>
          </Field>
        ) : (
          <Field label="Cliente">
            <select className="input" value={cliente} onChange={(e) => setCliente(e.target.value as typeof cliente)}>
              <option value="corona">Corona</option>
              <option value="sodimac">Sodimac</option>
            </select>
          </Field>
        )}
        <Field label="Email sugerido (opcional)">
          <input className="input" type="email" value={emailSug} onChange={(e) => setEmailSug(e.target.value)} placeholder="usuario@ejemplo.com" />
        </Field>
        <Field label="Expira en (horas)">
          <input className="input" type="number" min={1} max={720} value={horas} onChange={(e) => setHoras(Number(e.target.value))} />
        </Field>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button onClick={generar} disabled={loading} className="btn-primary">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
        Generar enlace
      </button>

      {link && (
        <div className="space-y-2 mt-2">
          <pre className="text-xs font-mono bg-background p-3 rounded border border-border whitespace-pre-wrap break-all">{link}</pre>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(link);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="text-xs inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-primary-foreground"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado" : "Copiar enlace"}
            </button>
            {expira && (
              <span className="text-[11px] text-muted-foreground">
                Expira: {new Date(expira).toLocaleString("es-CO")}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Cómpartelo por un canal seguro. Solo se puede abrir y completar una vez.
          </p>
        </div>
      )}
    </div>
  );
}

function EmpresaTab() {
  const crear = useServerFn(crearCuentaEmpresa);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [rol, setRol] = useState<"corona" | "sodimac" | "admin">("corona");
  const [password, setPassword] = useState(genPassword());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ email: string; password: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await crear({ data: { email, password, rol, displayName } });
      setResult({ email: r.email, password: r.password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <Card title="Cuenta de empresa creada">
        <ResultadoCredenciales
          email={result.email}
          password={result.password}
          onReset={() => {
            setResult(null);
            setEmail("");
            setDisplayName("");
            setPassword(genPassword());
          }}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <InvitacionGenerator tipo="empresa" />
      <Card title="Nueva cuenta de empresa (monitoreo)">
      <form onSubmit={submit} className="space-y-3 max-w-xl">
        <Field label="Cliente / Rol">
          <select value={rol} onChange={(e) => setRol(e.target.value as typeof rol)} className="input">
            <option value="corona">Corona</option>
            <option value="sodimac">Sodimac</option>
            <option value="admin">Admin general (TRAMMOS)</option>
          </select>
        </Field>
        <Field label="Nombre visible">
          <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required placeholder="Ej: Equipo Logística Corona" />
        </Field>
        <Field label="Email">
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="usuario@empresa.com" />
        </Field>
        <Field label="Contraseña">
          <div className="flex gap-2">
            <input className="input flex-1 font-mono" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            <button type="button" onClick={() => setPassword(genPassword())} className="text-xs px-3 rounded border border-border hover:bg-secondary">
              Aleatoria
            </button>
          </div>
        </Field>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Crear cuenta
        </button>
      </form>
    </Card>
    </div>
  );
}

function PasajeroTab() {
  const crear = useServerFn(crearCuentaPasajero);
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [cliente, setCliente] = useState<"corona" | "sodimac">("corona");
  const [tipoDisc, setTipoDisc] = useState("ninguna");
  const [nivelAsist, setNivelAsist] = useState(0);
  const [password, setPassword] = useState(genPassword());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ email: string; password: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await crear({
        data: {
          email,
          password,
          nuevo: {
            nombre,
            cedula: cedula || null,
            telefono: telefono || null,
            cliente,
            tipo_discapacidad: tipoDisc,
            nivel_asistencia: nivelAsist,
          },
        },
      });
      setResult({ email: r.email, password: r.password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <Card title="Cuenta de pasajero creada">
        <ResultadoCredenciales
          email={result.email}
          password={result.password}
          onReset={() => {
            setResult(null);
            setNombre("");
            setCedula("");
            setTelefono("");
            setEmail("");
            setPassword(genPassword());
          }}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <InvitacionGenerator tipo="pasajero" />
      <Card title="Nueva cuenta de pasajero PcD">
      <form onSubmit={submit} className="space-y-3 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nombre completo">
            <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </Field>
          <Field label="Cliente">
            <select value={cliente} onChange={(e) => setCliente(e.target.value as typeof cliente)} className="input">
              <option value="corona">Corona</option>
              <option value="sodimac">Sodimac</option>
            </select>
          </Field>
          <Field label="Cédula">
            <input className="input" value={cedula} onChange={(e) => setCedula(e.target.value)} />
          </Field>
          <Field label="Teléfono">
            <input className="input" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </Field>
          <Field label="Email (login)">
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Contraseña">
            <div className="flex gap-2">
              <input className="input flex-1 font-mono" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              <button type="button" onClick={() => setPassword(genPassword())} className="text-xs px-3 rounded border border-border hover:bg-secondary">
                Aleatoria
              </button>
            </div>
          </Field>
          <Field label="Tipo discapacidad">
            <select value={tipoDisc} onChange={(e) => setTipoDisc(e.target.value)} className="input">
              <option value="ninguna">Ninguna</option>
              <option value="visual">Visual</option>
              <option value="auditiva">Auditiva</option>
              <option value="motriz">Motriz</option>
              <option value="cognitiva">Cognitiva</option>
              <option value="multiple">Múltiple</option>
            </select>
          </Field>
          <Field label="Nivel de asistencia (0-3)">
            <input className="input" type="number" min={0} max={3} value={nivelAsist} onChange={(e) => setNivelAsist(Number(e.target.value))} />
          </Field>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Crear cuenta
        </button>
      </form>
    </Card>
    </div>
  );
}

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
