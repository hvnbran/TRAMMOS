import { useState } from "react";
import { AlertOctagon, Loader2, X } from "lucide-react";

const TIPOS = [
  "Conducción peligrosa",
  "Mal trato del conductor",
  "Falta de accesibilidad",
  "Vehículo en mal estado",
  "Ruta incorrecta",
  "Cobro indebido",
  "Otro",
];

interface Props {
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: { tipo: string; queSucedio: string; cuando: string }) => Promise<void> | void;
}

export function ReportarIncidenteModal({ open, saving, onClose, onSubmit }: Props) {
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [queSucedio, setQueSucedio] = useState("");
  const [cuando, setCuando] = useState("");

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queSucedio.trim() || saving) return;
    await onSubmit({
      tipo,
      queSucedio: queSucedio.trim().slice(0, 1000),
      cuando: cuando.trim().slice(0, 200),
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reportar-titulo"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-card border-2 border-destructive/30 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 p-4 bg-destructive/10 border-b border-destructive/20">
          <div className="flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-destructive" aria-hidden="true" />
            <h2 id="reportar-titulo" className="text-base font-bold text-foreground">
              Reportar incidente
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="h-9 w-9 rounded-full hover:bg-muted/60 flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={submit} className="p-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Cuéntanos lo que está pasando <strong>desde tu punto de vista</strong>. Esto se guarda
            por separado para que tu versión quede registrada aunque el conductor diga otra cosa.
          </p>

          <div>
            <label htmlFor="tipo-inc" className="block text-xs font-semibold text-foreground mb-1">
              ¿Qué tipo de incidente?
            </label>
            <select
              id="tipo-inc"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {TIPOS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="que-paso" className="block text-xs font-semibold text-foreground mb-1">
              ¿Qué está pasando? <span className="text-destructive">*</span>
            </label>
            <textarea
              id="que-paso"
              required
              rows={4}
              maxLength={1000}
              value={queSucedio}
              onChange={(e) => setQueSucedio(e.target.value)}
              placeholder="Describe lo que está ocurriendo con el mayor detalle posible…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <div className="mt-1 text-[11px] text-muted-foreground text-right">
              {queSucedio.length}/1000
            </div>
          </div>

          <div>
            <label htmlFor="cuando-inc" className="block text-xs font-semibold text-foreground mb-1">
              ¿Cuándo / dónde? (opcional)
            </label>
            <input
              id="cuando-inc"
              maxLength={200}
              value={cuando}
              onChange={(e) => setCuando(e.target.value)}
              placeholder="Ej: hace 5 min en la calle 80"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-md border-2 border-border text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!queSucedio.trim() || saving}
              className="flex-1 h-11 rounded-md bg-destructive text-destructive-foreground text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertOctagon className="h-4 w-4" />}
              Enviar reporte
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
