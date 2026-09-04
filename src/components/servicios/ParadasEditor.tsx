import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { AddressAutocomplete, type ExtraSuggestion } from "@/components/AddressAutocomplete";

export interface ParadaDraft {
  direccion: string;
  hora_estimada: string;
  nota: string;
}

interface Props {
  paradas: ParadaDraft[];
  onChange: (paradas: ParadaDraft[]) => void;
  sugerencias?: ExtraSuggestion[];
}

export function nuevaParada(): ParadaDraft {
  return { direccion: "", hora_estimada: "", nota: "" };
}

/** Editor de paradas para servicios multidestino. */
export function ParadasEditor({ paradas, onChange, sugerencias = [] }: Props) {
  function set(i: number, patch: Partial<ParadaDraft>) {
    onChange(paradas.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  function mover(i: number, delta: number) {
    const j = i + delta;
    if (j < 0 || j >= paradas.length) return;
    const copia = [...paradas];
    const tmp = copia[i]; copia[i] = copia[j]; copia[j] = tmp;
    onChange(copia);
  }

  return (
    <div className="space-y-2">
      {paradas.map((p, i) => (
        <div key={i} className="rounded-lg border border-border bg-background/60 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-primary">Parada {i + 1}</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Subir parada" className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => mover(i, 1)} disabled={i === paradas.length - 1} aria-label="Bajar parada" className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => onChange(paradas.filter((_, idx) => idx !== i))} aria-label="Quitar parada" className="p-1 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_110px] gap-2">
            <AddressAutocomplete
              value={p.direccion}
              onChange={(v) => set(i, { direccion: v })}
              extraSuggestions={sugerencias}
              placeholder="Dirección de la parada…"
              inputClassName="h-10 text-sm"
            />
            <input
              type="time"
              value={p.hora_estimada}
              onChange={(e) => set(i, { hora_estimada: e.target.value })}
              aria-label={`Hora estimada parada ${i + 1}`}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <input
            value={p.nota}
            onChange={(e) => set(i, { nota: e.target.value })}
            placeholder="Nota (opcional): a quién recoge, indicaciones…"
            className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...paradas, nuevaParada()])}
        className="flex items-center gap-1.5 rounded-md border border-dashed border-primary/40 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/5"
      >
        <Plus className="h-3.5 w-3.5" /> Agregar parada
      </button>
    </div>
  );
}
