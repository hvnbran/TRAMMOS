import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "corona" | "sodimac" | "pasajero" | "conductor";
export type ClienteTipo = "corona" | "sodimac";

interface AuthState {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  /** null when admin (can see all). For corona/sodimac, their own cliente. */
  cliente: ClienteTipo | null;
  loading: boolean;
  displayName: string;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listener first
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (!s?.user) {
        setRole(null);
        setDisplayName("");
      } else {
        // defer DB call
        setTimeout(() => loadUserMeta(s.user.id), 0);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadUserMeta(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadUserMeta(userId: string) {
    const [{ data: roles }, { data: profile }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("profiles").select("display_name,email").eq("user_id", userId).maybeSingle(),
    ]);

    let r = (roles?.[0]?.role ?? null) as AppRole | null;

    // If user has no role yet, try to link as pasajero (auto-bootstrap on first login via OTP)
    if (!r) {
      const { data: linkResp } = await supabase.rpc("link_pasajero_to_auth");
      const ok = (linkResp as { ok?: boolean } | null)?.ok;
      if (ok) {
        r = "pasajero";
      }
    }

    setRole(r);

    // For pasajeros, prefer the name from pasajeros_pcd
    if (r === "pasajero") {
      const { data: p } = await supabase
        .from("pasajeros_pcd")
        .select("nombre")
        .eq("auth_user_id", userId)
        .maybeSingle();
      setDisplayName(p?.nombre || profile?.display_name || profile?.email || "");
    } else if (r === "conductor") {
      const { data: c } = await (supabase.from("conductores") as any)
        .select("nombre")
        .eq("auth_user_id", userId)
        .maybeSingle();
      setDisplayName(c?.nombre || profile?.display_name || "Conductor");
    } else {
      setDisplayName(profile?.display_name || profile?.email || "");
    }
  }

  const cliente: ClienteTipo | null =
    role === "corona" ? "corona" : role === "sodimac" ? "sodimac" : null;

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ session, user, role, cliente, loading, displayName, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Returns a filter the user can see. null = no filter (admin). */
export function useClienteFilter(): ClienteTipo | null {
  const { cliente } = useAuth();
  return cliente;
}
