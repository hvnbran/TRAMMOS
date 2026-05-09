import { useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, MapPin } from "lucide-react";
import { searchAddresses, type AddressSuggestion } from "@/lib/geo/photon";
import { cn } from "@/lib/utils";

export interface ExtraSuggestion {
  label: string;
  sublabel?: string;
  group?: string; // ej. "Rutas de Operación"
}

interface Props {
  value: string;
  onChange: (value: string, meta?: { lat?: number; lon?: number }) => void;
  placeholder?: string;
  bias?: { lat: number; lon: number } | null;
  extraSuggestions?: ExtraSuggestion[];
  icon?: ReactNode;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  id?: string;
  autoComplete?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder,
  bias,
  extraSuggestions = [],
  icon,
  required,
  className,
  inputClassName,
  id,
  autoComplete = "off",
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AddressSuggestion[]>([]);
  const [highlight, setHighlight] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Filtrar extras por el texto actual
  const filteredExtras = value.trim().length === 0
    ? extraSuggestions.slice(0, 6)
    : extraSuggestions.filter((s) =>
        s.label.toLowerCase().includes(value.toLowerCase()) ||
        (s.sublabel ?? "").toLowerCase().includes(value.toLowerCase())
      ).slice(0, 6);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (value.trim().length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = window.setTimeout(() => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      searchAddresses(value, { lat: bias?.lat, lon: bias?.lon, signal: ctrl.signal })
        .then((r) => { setResults(r); setLoading(false); })
        .catch(() => setLoading(false));
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [value, bias?.lat, bias?.lon]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Lista plana para navegación por teclado
  const flat: Array<{ kind: "extra" | "geo"; label: string; sublabel?: string; lat?: number; lon?: number; group?: string }> = [
    ...filteredExtras.map((s) => ({ kind: "extra" as const, label: s.label, sublabel: s.sublabel, group: s.group ?? "Rutas de Operación" })),
    ...results.map((s) => ({ kind: "geo" as const, label: s.label, sublabel: s.sublabel, lat: s.lat, lon: s.lon, group: "Sugerencias cercanas" })),
  ];

  function pick(idx: number) {
    const item = flat[idx];
    if (!item) return;
    onChange(item.label, item.lat !== undefined ? { lat: item.lat, lon: item.lon } : undefined);
    setOpen(false);
    setHighlight(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(h + 1, flat.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter" && highlight >= 0) { e.preventDefault(); pick(highlight); }
    else if (e.key === "Escape") { setOpen(false); setHighlight(-1); }
  }

  // Agrupar para render
  let lastGroup = "";
  const showDropdown = open && (loading || flat.length > 0 || value.trim().length >= 3);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
            {icon}
          </span>
        )}
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); setHighlight(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className={cn(
            "w-full h-12 rounded-xl border-2 border-input bg-background px-4 text-base focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all",
            icon && "pl-10",
            inputClassName,
          )}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover shadow-lg overflow-hidden max-h-80 overflow-y-auto">
          {flat.length === 0 && !loading && (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              {value.trim().length < 3 ? "Escribe al menos 3 letras…" : "Sin resultados."}
            </div>
          )}
          {flat.map((item, idx) => {
            const showHeader = item.group !== lastGroup;
            lastGroup = item.group ?? "";
            return (
              <div key={`${item.kind}-${idx}`}>
                {showHeader && (
                  <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground bg-muted/30">
                    {item.group}
                  </div>
                )}
                <button
                  type="button"
                  onMouseEnter={() => setHighlight(idx)}
                  onMouseDown={(e) => { e.preventDefault(); pick(idx); }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm flex items-start gap-2 transition-colors",
                    highlight === idx ? "bg-accent text-accent-foreground" : "hover:bg-muted/50",
                  )}
                >
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium truncate">{item.label}</span>
                    {item.sublabel && (
                      <span className="block text-xs text-muted-foreground truncate">{item.sublabel}</span>
                    )}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
