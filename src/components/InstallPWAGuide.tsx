import { useEffect, useMemo, useState } from "react";
import { X, Share, Plus, MoreVertical, Download, Smartphone, Apple, Monitor, Globe } from "lucide-react";

type Platform = "ios-safari" | "ios-chrome" | "android-chrome" | "android-samsung" | "android-firefox" | "desktop" | "unknown";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);

  if (isIOS) {
    // iOS Chrome contains "CriOS"
    if (/CriOS/.test(ua)) return "ios-chrome";
    return "ios-safari";
  }
  if (isAndroid) {
    if (/SamsungBrowser/i.test(ua)) return "android-samsung";
    if (/Firefox/i.test(ua)) return "android-firefox";
    return "android-chrome";
  }
  return "desktop";
}

interface Step {
  text: string;
  icon?: React.ReactNode;
}

const GUIDES: Record<Platform, { title: string; subtitle: string; icon: React.ReactNode; steps: Step[]; warning?: string }> = {
  "ios-safari": {
    title: "Instalar en iPhone (Safari)",
    subtitle: "Sigue estos pasos para añadir TRAMMOS a tu pantalla de inicio",
    icon: <Apple className="h-6 w-6" />,
    steps: [
      { text: "Toca el botón Compartir en la barra inferior de Safari", icon: <Share className="h-5 w-5 text-primary" /> },
      { text: 'Desliza hacia abajo y toca "Añadir a pantalla de inicio"', icon: <Plus className="h-5 w-5 text-primary" /> },
      { text: 'Toca "Añadir" en la esquina superior derecha', icon: <Download className="h-5 w-5 text-primary" /> },
      { text: "Listo: el icono de TRAMMOS aparece en tu pantalla de inicio" },
    ],
  },
  "ios-chrome": {
    title: "Instalar en iPhone (Chrome)",
    subtitle: "Chrome en iOS tiene soporte limitado. Recomendamos usar Safari.",
    icon: <Apple className="h-6 w-6" />,
    warning: "Para la mejor experiencia, abre esta página en Safari y vuelve a esta guía.",
    steps: [
      { text: "Copia esta dirección: tramos.online", icon: <Globe className="h-5 w-5 text-primary" /> },
      { text: "Abre Safari y pega la dirección", icon: <Apple className="h-5 w-5 text-primary" /> },
      { text: "Toca el botón Compartir en Safari", icon: <Share className="h-5 w-5 text-primary" /> },
      { text: 'Selecciona "Añadir a pantalla de inicio"', icon: <Plus className="h-5 w-5 text-primary" /> },
    ],
  },
  "android-chrome": {
    title: "Instalar en Android (Chrome)",
    subtitle: "Sigue estos pasos para instalar TRAMMOS como app",
    icon: <Chrome className="h-6 w-6" />,
    steps: [
      { text: "Toca el menú ⋮ en la esquina superior derecha de Chrome", icon: <MoreVertical className="h-5 w-5 text-primary" /> },
      { text: 'Toca "Instalar app" o "Añadir a pantalla principal"', icon: <Download className="h-5 w-5 text-primary" /> },
      { text: 'Confirma tocando "Instalar"', icon: <Plus className="h-5 w-5 text-primary" /> },
      { text: "Listo: TRAMMOS se instala como una app más en tu celular" },
    ],
  },
  "android-samsung": {
    title: "Instalar en Samsung Internet",
    subtitle: "Sigue estos pasos para instalar TRAMMOS como app",
    icon: <Smartphone className="h-6 w-6" />,
    steps: [
      { text: "Toca el menú ☰ en la barra inferior de Samsung Internet", icon: <MoreVertical className="h-5 w-5 text-primary" /> },
      { text: 'Toca "Añadir página a" y luego "Pantalla de inicio"', icon: <Plus className="h-5 w-5 text-primary" /> },
      { text: 'Confirma tocando "Añadir"', icon: <Download className="h-5 w-5 text-primary" /> },
      { text: "Listo: el icono de TRAMMOS aparece en tu pantalla de inicio" },
    ],
  },
  "android-firefox": {
    title: "Instalar en Android (Firefox)",
    subtitle: "Sigue estos pasos para instalar TRAMMOS como app",
    icon: <Smartphone className="h-6 w-6" />,
    steps: [
      { text: "Toca el menú ⋮ en la esquina inferior derecha", icon: <MoreVertical className="h-5 w-5 text-primary" /> },
      { text: 'Toca "Instalar" o "Añadir a pantalla de inicio"', icon: <Plus className="h-5 w-5 text-primary" /> },
      { text: "Confirma la instalación", icon: <Download className="h-5 w-5 text-primary" /> },
      { text: "Listo: TRAMMOS está disponible desde tu pantalla de inicio" },
    ],
  },
  "desktop": {
    title: "Instalar en computadora",
    subtitle: "Disponible en Chrome, Edge y otros navegadores compatibles",
    icon: <Chrome className="h-6 w-6" />,
    steps: [
      { text: 'Busca el icono de "Instalar" ⊕ en la barra de direcciones', icon: <Download className="h-5 w-5 text-primary" /> },
      { text: 'O abre el menú ⋮ y selecciona "Instalar TRAMMOS…"', icon: <MoreVertical className="h-5 w-5 text-primary" /> },
      { text: 'Confirma tocando "Instalar"', icon: <Plus className="h-5 w-5 text-primary" /> },
      { text: "TRAMMOS se abre como una app independiente en tu escritorio" },
    ],
  },
  "unknown": {
    title: "Instalar TRAMMOS",
    subtitle: "Selecciona tu sistema arriba para ver instrucciones",
    icon: <Globe className="h-6 w-6" />,
    steps: [],
  },
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function InstallPWAGuide({ open, onClose }: Props) {
  const detected = useMemo(() => detectPlatform(), []);
  const [selected, setSelected] = useState<Platform>(detected);

  // ESC para cerrar
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Sync selection if detected changes
  useEffect(() => { setSelected(detected); }, [detected]);

  if (!open) return null;

  const guide = GUIDES[selected];
  const isStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-guide-title"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-lg bg-card text-foreground rounded-t-2xl md:rounded-2xl shadow-2xl border border-border max-h-[92vh] overflow-y-auto animate-slide-in-right md:animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border px-5 py-4 flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <Download className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 id="install-guide-title" className="text-base font-semibold leading-tight">
              Instalar TRAMMOS en tu dispositivo
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Acceso rápido, sin abrir el navegador
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Already installed banner */}
        {isStandalone && (
          <div className="mx-5 mt-4 rounded-lg bg-accent/15 border border-accent/30 px-3 py-2 text-xs text-foreground">
            ✓ Ya estás usando TRAMMOS como app instalada.
          </div>
        )}

        {/* Platform tabs */}
        <div className="px-5 pt-4">
          <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-muted/40 border border-border">
            <PlatformTab active={selected.startsWith("ios")} onClick={() => setSelected("ios-safari")} icon={<Apple className="h-4 w-4" />} label="iPhone" />
            <PlatformTab active={selected.startsWith("android")} onClick={() => setSelected("android-chrome")} icon={<Smartphone className="h-4 w-4" />} label="Android" />
            <PlatformTab active={selected === "desktop"} onClick={() => setSelected("desktop")} icon={<Chrome className="h-4 w-4" />} label="PC" />
          </div>

          {/* Sub-browser selector for iOS / Android */}
          {selected.startsWith("ios") && (
            <div className="mt-3 flex gap-2 text-xs">
              <SubChip active={selected === "ios-safari"} onClick={() => setSelected("ios-safari")}>Safari</SubChip>
              <SubChip active={selected === "ios-chrome"} onClick={() => setSelected("ios-chrome")}>Chrome</SubChip>
            </div>
          )}
          {selected.startsWith("android") && (
            <div className="mt-3 flex gap-2 text-xs flex-wrap">
              <SubChip active={selected === "android-chrome"} onClick={() => setSelected("android-chrome")}>Chrome</SubChip>
              <SubChip active={selected === "android-samsung"} onClick={() => setSelected("android-samsung")}>Samsung</SubChip>
              <SubChip active={selected === "android-firefox"} onClick={() => setSelected("android-firefox")}>Firefox</SubChip>
            </div>
          )}
        </div>

        {/* Guide content */}
        <div className="px-5 pt-5 pb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-foreground">
              {guide.icon}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold leading-tight">{guide.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{guide.subtitle}</p>
            </div>
          </div>

          {guide.warning && (
            <div className="mt-3 rounded-md bg-yellow-500/10 border border-yellow-500/30 px-3 py-2 text-xs text-foreground">
              ⚠️ {guide.warning}
            </div>
          )}

          <ol className="mt-4 space-y-3">
            {guide.steps.map((step, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg border border-border bg-background/60 px-3 py-3"
              >
                <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 text-sm leading-relaxed pt-0.5">{step.text}</div>
                {step.icon && <div className="shrink-0 pt-0.5">{step.icon}</div>}
              </li>
            ))}
          </ol>

          {detected !== selected && detected !== "unknown" && (
            <p className="mt-4 text-[11px] text-muted-foreground">
              Detectamos que estás en{" "}
              <button
                onClick={() => setSelected(detected)}
                className="underline underline-offset-2 hover:text-foreground"
              >
                {GUIDES[detected].title}
              </button>
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PlatformTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 h-10 rounded-lg text-sm font-medium transition-all ${
        active ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
      }`}
      aria-pressed={active}
    >
      {icon}
      {label}
    </button>
  );
}

function SubChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 h-7 rounded-full border transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-muted-foreground border-border hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
