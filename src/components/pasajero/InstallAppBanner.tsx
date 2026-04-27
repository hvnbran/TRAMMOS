import { useEffect, useState } from "react";
import { Download, Smartphone, X, CheckCircle2 } from "lucide-react";
import { InstallPWAGuide } from "@/components/InstallPWAGuide";

const DISMISS_KEY = "trammos_install_banner_dismissed_at";
const REAPPEAR_DAYS = 7;

// Tipo del evento estándar (no expuesto en libdom)
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

export function InstallAppBanner() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      setInstalled(true);
      return;
    }

    // Respetar dismiss reciente
    try {
      const ts = localStorage.getItem(DISMISS_KEY);
      if (ts) {
        const days = (Date.now() - parseInt(ts, 10)) / (1000 * 60 * 60 * 24);
        if (days < REAPPEAR_DAYS) return;
      }
    } catch { /* ignore */ }

    setVisible(true);

    // Capturar evento nativo de instalación (Chrome/Edge/Android)
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ }
    setVisible(false);
  };

  const handleInstallClick = async () => {
    // Si el navegador soporta instalación nativa, dispararla directamente
    if (deferred) {
      setInstalling(true);
      try {
        await deferred.prompt();
        const choice = await deferred.userChoice;
        if (choice.outcome === "accepted") {
          setInstalled(true);
          setVisible(false);
        }
      } catch { /* ignore */ }
      setDeferred(null);
      setInstalling(false);
      return;
    }
    // Fallback: abrir guía por plataforma
    setOpen(true);
  };

  if (installed) {
    return (
      <section
        aria-label="App instalada"
        className="rounded-2xl border-2 border-success/30 bg-success/10 p-3 flex items-center gap-3"
      >
        <CheckCircle2 className="h-5 w-5 text-success shrink-0" aria-hidden="true" />
        <div className="text-xs text-foreground">
          Estás usando TRAMMOS como app instalada. ¡Listo!
        </div>
      </section>
    );
  }

  if (!visible) return null;

  const ctaLabel = deferred ? "Instalar ahora" : "Cómo instalar";

  return (
    <>
      <section
        aria-label="Instalar TRAMMOS como aplicación"
        className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-4 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Smartphone className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground leading-tight">
              Instala TRAMMOS en tu celular
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-snug">
              {deferred
                ? "Toca instalar y tendrás TRAMMOS como una app más en tu pantalla de inicio."
                : "Acceso directo desde tu pantalla de inicio, sin abrir el navegador."}
            </p>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={installing}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                <Download className="h-3.5 w-3.5" />
                {installing ? "Instalando…" : ctaLabel}
              </button>
              {!deferred && (
                <button
                  type="button"
                  onClick={dismiss}
                  className="h-9 px-3 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  Más tarde
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Ocultar invitación a instalar"
            className="h-7 w-7 rounded-full hover:bg-muted/60 flex items-center justify-center text-muted-foreground -mt-1 -mr-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </section>

      <InstallPWAGuide open={open} onClose={() => setOpen(false)} />
    </>
  );
}
