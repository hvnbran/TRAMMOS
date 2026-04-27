import { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { InstallPWAGuide } from "@/components/InstallPWAGuide";

const DISMISS_KEY = "trammos_install_banner_dismissed_at";
const REAPPEAR_DAYS = 7;

export function InstallAppBanner() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // No mostrar si ya está instalada
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    // Respetar dismiss reciente
    try {
      const ts = localStorage.getItem(DISMISS_KEY);
      if (ts) {
        const days = (Date.now() - parseInt(ts, 10)) / (1000 * 60 * 60 * 24);
        if (days < REAPPEAR_DAYS) return;
      }
    } catch { /* ignore */ }

    setVisible(true);
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ }
    setVisible(false);
  };

  if (!visible) return null;

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
              Acceso directo desde tu pantalla de inicio, sin abrir el navegador.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                <Download className="h-3.5 w-3.5" />
                Cómo instalar
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="h-9 px-3 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                Más tarde
              </button>
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
