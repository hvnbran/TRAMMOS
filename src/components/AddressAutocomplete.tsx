import { useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, MapPin } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { searchAddresses, type AddressSuggestion, type Bbox } from "@/lib/geo/photon";
import {
  placesAutocomplete,
  placeDetails,
  type PlaceSuggestion,
} from "@/lib/geo/places.functions";
import { cn } from "@/lib/utils";

export interface ExtraSuggestion {
  label: string;
  sublabel?: string;
  group?: string;
}

interface Props {
  value: string;
  onChange: (value: string, meta?: { lat?: number; lon?: number }) => void;
  placeholder?: string;
  bias?: { lat: number; lon: number } | null;
  bbox?: Bbox | null;
  departamento?: string | null;
  strictDepartamento?: boolean;
  extraSuggestions?: ExtraSuggestion[];
  icon?: ReactNode;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  id?: string;
  autoComplete?: string;
}

type FlatItem = {
  kind: "extra" | "google" | "geo";
  label: string;
  sublabel?: string;
  lat?: number;
  lon?: number;
  group?: string;
  placeId?: string;
};

function newSessionToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder,
  bias,
  bbox,
  departamento,
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
  const [googleResults, setGoogleResults] = useState<PlaceSuggestion[]>([]);
  const [photonResults, setPhotonResults] = useState<AddressSuggestion[]>([]);
  const [highlight, setHighlight] = useState(-1);
  const [resolving, setResolving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionRef = useRef<string>(newSessionToken());
  const autocompleteFn = useServerFn(placesAutocomplete);
  const detailsFn = useServerFn(placeDetails);

  const filteredExtras = value.trim().length === 0
    ? extraSuggestions.slice(0, 6)
    : extraSuggestions.filter((s) =>
        s.label.toLowerCase().includes(value.toLowerCase()) ||
        (s.sublabel ?? "").toLowerCase().includes(value.toLowerCase())
      ).slice(0, 6);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setGoogleResults([]);
      setPhotonResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const g = await autocompleteFn({
          data: {
            input: value,
            lat: bias?.lat,
            lon: bias?.lon,
            sessionToken: sessionRef.current,
          },
        });
        if (ctrl.signal.aborted) return;
        setGoogleResults(g);
        setPhotonResults([]);
        setLoading(false);
      } catch {
        // Fallback to Photon
        try {
          const r = await searchAddresses(value, {
            lat: bias?.lat,
            lon: bias?.lon,
            bbox: bbox ?? null,
            departamento: departamento ?? null,
            signal: ctrl.signal,
          });
          if (ctrl.signal.aborted) return;
          setGoogleResults([]);
          setPhotonResults(r);
        } catch {
          setGoogleResults([]);
          setPhotonResults([]);
        } finally {
          setLoading(false);
        }
      }
    }, 280);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, bias?.lat, bias?.lon]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const flat: FlatItem[] = [
    ...filteredExtras.map((s) => ({
      kind: "extra" as const,
      label: s.label,
      sublabel: s.sublabel,
      group: s.group ?? "Rutas de Operación",
    })),
    ...googleResults.map((s) => ({
      kind: "google" as const,
      label: s.primary,
      sublabel: s.secondary,
      placeId: s.id,
      group: "Sugerencias cercanas",
    })),
    ...photonResults.map((s) => ({
      kind: "geo" as const,
      label: s.label,
      sublabel: s.sublabel,
      lat: s.lat,
      lon: s.lon,
      group: "Sugerencias",
    })),
  ];

  async function pick(idx: number) {
    const item = flat[idx];
    if (!item) return;
    if (item.kind === "google" && item.placeId) {
      setResolving(true);
      try {
        const det = await detailsFn({
          data: { placeId: item.placeId, sessionToken: sessionRef.current },
        });
        onChange(det.label, { lat: det.lat, lon: det.lon });
        sessionRef.current = newSessionToken();
      } catch {
        const full = item.sublabel ? `${item.label}, ${item.sublabel}` : item.label;
        onChange(full);
      } finally {
        setResolving(false);
      }
    } else {
      onChange(item.label, item.lat !== undefined ? { lat: item.lat, lon: item.lon } : undefined);
    }
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
    else if (e.key === "Enter" && highlight >= 0) { e.preventDefault(); void pick(highlight); }
    else if (e.key === "Escape") { setOpen(false); setHighlight(-1); }
  }

  let lastGroup = "";
  const showDropdown = open && (loading || flat.length > 0 || value.trim().length >= 2);

  const emptyMessage = (() => {
    if (value.trim().length < 2) return "Escribe al menos 2 letras…";
    if (!bias) return "Activa la ubicación para ver lugares cercanos.";
    return "Sin resultados. Prueba con el nombre del lugar o barrio.";
  })();

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
        {(loading || resolving) && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover shadow-lg overflow-hidden max-h-80 overflow-y-auto">
          {flat.length === 0 && !loading && (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              {emptyMessage}
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
                  onMouseDown={(e) => { e.preventDefault(); void pick(idx); }}
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
