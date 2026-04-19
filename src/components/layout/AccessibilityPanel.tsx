import { useState } from "react";
import { Accessibility, X, RotateCcw, Type, Contrast, Eye, Zap, Underline, Maximize2, Layers, MousePointer2 } from "lucide-react";
import { useA11y } from "@/lib/a11y-context";

export function AccessibilityPanel() {
  const [open, setOpen] = useState(false);
  const { prefs, setPref, reset } = useA11y();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir panel de accesibilidad"
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 transition-transform"
        title="Accesibilidad"
      >
        <Accessibility className="h-7 w-7" aria-hidden="true" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="a11y-panel-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full sm:w-[380px] sm:mr-5 sm:mb-0 mb-0 max-h-[90vh] overflow-y-auto bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card">
              <div className="flex items-center gap-2">
                <Accessibility className="h-5 w-5 text-primary" aria-hidden="true" />
                <h2 id="a11y-panel-title" className="text-base font-semibold text-foreground">
                  Accesibilidad
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar panel de accesibilidad"
                className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="p-4 space-y-5">
              {/* Tamaño de texto */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Type className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span className="text-sm font-medium">Tamaño de texto</span>
                </div>
                <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tamaño de texto">
                  {(["normal", "large", "xlarge"] as const).map((size) => (
                    <button
                      key={size}
                      role="radio"
                      aria-checked={prefs.textSize === size}
                      onClick={() => setPref("textSize", size)}
                      className={`px-2 py-2 rounded-md border text-sm transition-colors ${
                        prefs.textSize === size
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:bg-muted"
                      }`}
                    >
                      {size === "normal" ? "A" : size === "large" ? "A+" : "A++"}
                      <span className="sr-only">
                        {size === "normal" ? "Normal" : size === "large" ? "Grande" : "Muy grande"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Daltonismo */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span className="text-sm font-medium">Filtro daltonismo</span>
                </div>
                <select
                  aria-label="Tipo de daltonismo"
                  value={prefs.colorBlind}
                  onChange={(e) => setPref("colorBlind", e.target.value as A11yColorBlind)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="off">Desactivado</option>
                  <option value="protanopia">Protanopia (rojo)</option>
                  <option value="deuteranopia">Deuteranopia (verde)</option>
                  <option value="tritanopia">Tritanopia (azul)</option>
                </select>
              </div>

              {/* Toggles */}
              <ToggleRow
                icon={<Contrast className="h-4 w-4 text-primary" aria-hidden="true" />}
                label="Alto contraste"
                description="Tema blanco y negro con bordes gruesos"
                checked={prefs.highContrast}
                onChange={(v) => setPref("highContrast", v)}
              />
              <ToggleRow
                icon={<Zap className="h-4 w-4 text-primary" aria-hidden="true" />}
                label="Reducir movimiento"
                description="Desactiva animaciones y transiciones"
                checked={prefs.reducedMotion}
                onChange={(v) => setPref("reducedMotion", v)}
              />
              <ToggleRow
                icon={<Underline className="h-4 w-4 text-primary" aria-hidden="true" />}
                label="Subrayar enlaces"
                checked={prefs.underlineLinks}
                onChange={(v) => setPref("underlineLinks", v)}
              />
              <ToggleRow
                icon={<Maximize2 className="h-4 w-4 text-primary" aria-hidden="true" />}
                label="Espaciado amplio"
                description="Más aire entre líneas y elementos"
                checked={prefs.wideSpacing}
                onChange={(v) => setPref("wideSpacing", v)}
              />
              <ToggleRow
                icon={<Layers className="h-4 w-4 text-primary" aria-hidden="true" />}
                label="Modo simple"
                description="Botones más grandes, ideal tercera edad"
                checked={prefs.simpleMode}
                onChange={(v) => setPref("simpleMode", v)}
              />
              <ToggleRow
                icon={<MousePointer2 className="h-4 w-4 text-primary" aria-hidden="true" />}
                label="Cursor grande"
                checked={prefs.bigCursor}
                onChange={(v) => setPref("bigCursor", v)}
              />

              <button
                onClick={reset}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 h-10 rounded-md border border-border bg-background hover:bg-muted text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Restablecer
              </button>

              <p className="text-[11px] text-muted-foreground text-center pt-2">
                TRAMMOS cumple Ley 1618 de 2013 · NTC 5854 · WCAG 2.1 AA
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

type A11yColorBlind = "off" | "protanopia" | "deuteranopia" | "tritanopia";

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-3 cursor-pointer">
      <div className="flex items-start gap-2 flex-1">
        <div className="mt-0.5">{icon}</div>
        <div>
          <div className="text-sm font-medium text-foreground">{label}</div>
          {description && <div className="text-xs text-muted-foreground">{description}</div>}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0 ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}
