import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useServerFn } from "@tanstack/react-start";
import {
  listCrmUsers,
  grantCrmAccess,
  revokeCrmAccess,
} from "@/lib/crm/crm-access.functions";
import { ShieldCheck, UserPlus, Trash2, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/crm/equipo")({
  component: EquipoCrmPage,
});

type Row = { user_id: string; email: string | null; display_name: string | null };

function EquipoCrmPage() {
  const { role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const listFn = useServerFn(listCrmUsers);
  const grantFn = useServerFn(grantCrmAccess);
  const revokeFn = useServerFn(revokeCrmAccess);

  const [users, setUsers] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && role !== "admin") {
      navigate({ to: "/crm" });
    }
  }, [authLoading, role, navigate]);

  async function load() {
    setLoading(true);
    try {
      const res = await listFn();
      setUsers(res.users);
    } catch (e) {
      toast.error("Error cargando equipo: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (role === "admin") load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await grantFn({
        data: {
          email: email.trim(),
          displayName: displayName.trim() || undefined,
          password: password.trim() ? password.trim() : undefined,
        },
      });
      toast.success(
        res.created
          ? "Cuenta CRM creada. El usuario ya puede iniciar sesión."
          : res.invited
            ? "Invitación enviada por correo y acceso CRM otorgado."
            : password.trim()
              ? "Acceso CRM otorgado y contraseña actualizada."
              : "Acceso CRM otorgado.",
      );
      setEmail("");
      setDisplayName("");
      setPassword("");
      load();
    } catch (e) {
      toast.error("No se pudo otorgar acceso: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(userId: string) {
    if (!confirm("¿Revocar acceso CRM a este usuario?")) return;
    try {
      await revokeFn({ data: { userId } });
      toast.success("Acceso revocado");
      load();
    } catch (e) {
      toast.error("No se pudo revocar: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  if (role !== "admin") return null;

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="p-2 rounded-md bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipo CRM</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona quién puede entrar al portal CRM (rol comercial).
          </p>
        </div>
      </header>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" />
          Otorgar acceso CRM
        </h2>
        <form onSubmit={handleGrant} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-1">
            <label className="text-xs text-muted-foreground">Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="persona@empresa.com"
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
            />
          </div>
          <div className="md:col-span-1">
            <label className="text-xs text-muted-foreground">Nombre (opcional)</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nombre del usuario"
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
            />
          </div>
          <div className="md:col-span-1">
            <label className="text-xs text-muted-foreground">Contraseña (opcional)</label>
            <input
              type="password"
              minLength={8}
              maxLength={72}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={busy || !email}
            className="h-9 inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Otorgar acceso
          </button>
        </form>
        <p className="text-[11px] text-muted-foreground mt-2">
          Si <strong>defines una contraseña</strong>, el usuario podrá entrar al CRM al instante con su correo y esa contraseña. Si la dejas en blanco y el correo no existe, se enviará una invitación por email.
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card">
        <header className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-sm">Usuarios con acceso CRM ({users.length})</h2>
        </header>
        {loading ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Cargando…</p>
        ) : users.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            Aún no hay usuarios con rol CRM. Otorga acceso desde el formulario arriba.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {users.map((u) => (
              <li key={u.user_id} className="px-4 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {u.display_name || u.email || u.user_id}
                  </div>
                  {u.email && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {u.email}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleRevoke(u.user_id)}
                  className="inline-flex items-center gap-1 text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded"
                  aria-label={`Revocar acceso a ${u.email ?? u.user_id}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Revocar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
