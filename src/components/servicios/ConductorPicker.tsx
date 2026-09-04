import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { PersonaAvatar } from "@/components/PersonaAvatar";

export interface ConductorPickerItem {
  id: string;
  nombre: string;
  foto_url?: string | null;
  placa?: string | null;
}

interface Props {
  value: string;
  onChange: (nombre: string) => void;
  items: ConductorPickerItem[];
  disabled?: boolean;
  placeholder?: string;
}

/** Desplegable de conductores con foto de perfil y placa asignada. */
export function ConductorPicker({ value, onChange, items, disabled, placeholder = "Selecciona un conductor" }: Props) {
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

  const sel = items.find((c) => c.nombre === value);
  const filtered = q.trim()
    ? items.filter((c) => c.nombre.toLowerCase().includes(q.trim().toLowerCase()) || (c.placa ?? "").toLowerCase().includes(q.trim().toLowerCase()))
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
        {value ? (
          <>
            <PersonaAvatar nombre={sel?.nombre ?? value} fotoUrl={sel?.foto_url} size="sm" />
            <span className="flex-1 min-w-0">
              <span className="block truncate font-medium">{value}</span>
              {sel?.placa && <span className="block text-xs text-muted-foreground">Placa {sel.placa}</span>}
            </span>
            <span
              role="button"
              tabIndex={-1}
              aria-label="Quitar conductor"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </span>
          </>
        ) : (
          <>
            <PersonaAvatar size="sm" />
            <span className="flex-1 text-muted-foreground">{disabled ? "Sin conductores disponibles" : placeholder}</span>
          </>
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
              placeholder="Buscar conductor o placa…"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <div className="max-h-72 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">Sin resultados</p>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onChange(c.nombre); setOpen(false); setQ(""); }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent ${c.nombre === value ? "bg-primary/5" : ""}`}
              >
                <PersonaAvatar nombre={c.nombre} fotoUrl={c.foto_url} size="sm" />
                <span className="flex-1 min-w-0">
                  <span className="block truncate text-sm font-medium">{c.nombre}</span>
                  <span className="block text-xs text-muted-foreground">{c.placa ? `Placa ${c.placa}` : "Sin vehículo asignado"}</span>
                </span>
                {c.nombre === value && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
