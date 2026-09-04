import { useEffect, useRef, useState } from "react";
import { Car, Check, ChevronDown, Search, X } from "lucide-react";

export interface VehiculoPickerItem {
  id: string;
  placa: string;
  marca?: string | null;
  linea?: string | null;
  foto_url?: string | null;
}

interface Props {
  value: string;
  onChange: (placa: string) => void;
  items: VehiculoPickerItem[];
  disabled?: boolean;
  placeholder?: string;
}

function Miniatura({ foto, placa }: { foto?: string | null; placa?: string }) {
  if (foto) {
    return (
      <div className="h-9 w-12 rounded-md overflow-hidden border border-border shrink-0 bg-secondary">
        <img src={foto} alt={placa ? `Vehículo ${placa}` : "Vehículo"} className="h-full w-full object-cover" loading="lazy" />
      </div>
    );
  }
  return (
    <div className="h-9 w-12 rounded-md border border-border shrink-0 bg-secondary flex items-center justify-center" aria-hidden="true">
      <Car className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

/** Desplegable de vehículos con foto, placa, marca y línea. */
export function VehiculoPicker({ value, onChange, items, disabled, placeholder = "Selecciona un vehículo" }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const sel = items.find((v) => v.placa === value);
  const filtered = q.trim()
    ? items.filter((v) => `${v.placa} ${v.marca ?? ""} ${v.linea ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()))
    : items;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center gap-3 rounded-lg border border-input bg-background px-3 py-2 text-left text-sm hover:border-primary/50 disabled:opacity-60"
      >
        <Miniatura foto={sel?.foto_url} placa={sel?.placa} />
        {value ? (
          <>
            <span className="flex-1 min-w-0">
              <span className="block truncate font-medium">{value}</span>
              <span className="block text-xs text-muted-foreground">{[sel?.marca, sel?.linea].filter(Boolean).join(" ") || "—"}</span>
            </span>
            <span
              role="button"
              tabIndex={-1}
              aria-label="Quitar vehículo"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </span>
          </>
        ) : (
          <span className="flex-1 text-muted-foreground">{disabled ? "Sin vehículos disponibles" : placeholder}</span>
        )}
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar placa, marca o línea…"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <div className="max-h-72 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">Sin resultados</p>
            )}
            {filtered.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => { onChange(v.placa); setOpen(false); setQ(""); }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent ${v.placa === value ? "bg-primary/5" : ""}`}
              >
                <Miniatura foto={v.foto_url} placa={v.placa} />
                <span className="flex-1 min-w-0">
                  <span className="block truncate text-sm font-medium">{v.placa}</span>
                  <span className="block text-xs text-muted-foreground">{[v.marca, v.linea].filter(Boolean).join(" ") || "—"}</span>
                </span>
                {v.placa === value && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
