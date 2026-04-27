import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from "@/lib/push-config";

type State = "unsupported" | "iframe" | "default" | "denied" | "subscribed" | "loading";

const SW_PATH = "/sw.js";

function isInIframe(): boolean {
  try { return window.self !== window.top; } catch { return true; }
}

function isPreviewHost(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h.includes("id-preview--") || h.includes("lovableproject.com") || h.includes("lovable.app");
}

export function PushNotificationsToggle({ userId }: { userId: string }) {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Push notifications no funcionan dentro de iframes (preview)
    if (isInIframe()) {
      setState("iframe");
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setState("unsupported");
      return;
    }
    refreshState();
  }, []);

  async function refreshState() {
    try {
      const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
      const sub = await reg?.pushManager.getSubscription();
      if (Notification.permission === "denied") {
        setState("denied");
        return;
      }
      if (sub) {
        setState("subscribed");
        return;
      }
      setState("default");
    } catch {
      setState("default");
    }
  }

  async function subscribe() {
    if (busy) return;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "default");
        return;
      }

      // Registrar SW solo aquí — fuera del preview iframe
      const reg = await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
      await navigator.serviceWorker.ready;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const keyBytes = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        // Copia a un ArrayBuffer "puro" para satisfacer el tipo de PushManager
        const appServerKey = new Uint8Array(keyBytes).buffer;
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey,
        });
      }

      const json = sub.toJSON();
      const endpoint = sub.endpoint;
      const p256dh = json.keys?.p256dh;
      const auth = json.keys?.auth;

      if (!p256dh || !auth) {
        throw new Error("Faltan llaves de la suscripción");
      }

      // Upsert por endpoint (único)
      const { error } = await supabase
        .from("push_subscriptions")
        .upsert(
          {
            user_id: userId,
            endpoint,
            p256dh,
            auth,
            user_agent: navigator.userAgent.slice(0, 200),
            last_used_at: new Date().toISOString(),
          },
          { onConflict: "endpoint" },
        );

      if (error) throw error;
      setState("subscribed");
    } catch (e) {
      console.error("[push] subscribe error:", e);
      setState("default");
    } finally {
      setBusy(false);
    }
  }

  async function unsubscribe() {
    if (busy) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setState("default");
    } catch (e) {
      console.error("[push] unsubscribe error:", e);
    } finally {
      setBusy(false);
    }
  }

  // No renderizar nada en estados no útiles
  if (state === "loading" || state === "unsupported" || state === "iframe") return null;

  if (state === "subscribed") {
    return (
      <section
        aria-label="Notificaciones activadas"
        className="rounded-2xl border-2 border-success/30 bg-success/10 p-3 flex items-center gap-3"
      >
        <Bell className="h-5 w-5 text-success shrink-0" aria-hidden="true" />
        <div className="flex-1 text-xs text-foreground">
          Recibirás avisos cuando te asignen conductor y cuando vaya en camino.
        </div>
        <button
          type="button"
          onClick={unsubscribe}
          disabled={busy}
          className="text-xs text-muted-foreground hover:text-destructive underline-offset-2 hover:underline disabled:opacity-60"
        >
          Desactivar
        </button>
      </section>
    );
  }

  if (state === "denied") {
    return (
      <section
        aria-label="Notificaciones bloqueadas"
        className="rounded-2xl border-2 border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-3"
      >
        <BellOff className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-xs text-foreground leading-snug">
          Las notificaciones están bloqueadas. Actívalas desde los ajustes del navegador para recibir avisos cuando llegue tu carro.
        </div>
      </section>
    );
  }

  // default — pedir permiso
  return (
    <section
      aria-label="Activar notificaciones"
      className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
          <Bell className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-foreground leading-tight">
            Avísame cuando llegue mi carro
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-snug">
            Recibe una notificación cuando te asignen conductor y cuando vaya en camino, aunque tengas la app cerrada.
          </p>
          <button
            type="button"
            onClick={subscribe}
            disabled={busy}
            className="mt-3 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
            {busy ? "Activando…" : "Activar notificaciones"}
          </button>
        </div>
      </div>
    </section>
  );
}
