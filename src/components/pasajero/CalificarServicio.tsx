import { useState } from "react";
import { Star, Loader2, CheckCircle2, Car } from "lucide-react";
import { SpeakButton } from "@/components/SpeakButton";

interface Props {
  conductor: string | null;
  vehiculoPlaca: string | null;
  origen: string;
  destino: string;
  saving: boolean;
  onSubmit: (estrellas: number, resena: string) => Promise<void> | void;
}

export function CalificarServicio({ conductor, vehiculoPlaca, origen, destino, saving, onSubmit }: Props) {
  const [estrellas, setEstrellas] = useState(0);
  const [hover, setHover] = useState(0);
  const [resena, setResena] = useState("");

  const intro =
    `Tu viaje finalizó. Por favor califica a tu conductor${conductor ? ` ${conductor}` : ""} de 1 a 5 estrellas` +
    ` y déjanos una breve reseña antes de pedir un nuevo servicio.`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (estrellas < 1 || saving) return;
    await onSubmit(estrellas, resena.trim().slice(0, 500));
  };

  const labelEstrellas = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"][estrellas] || "Sin calificar";

  return (
    <div className="space-y-5">
      <header className="rounded-2xl bg-success/10 border-2 border-success/30 p-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-7 w-7 text-success shrink-0" aria-hidden="true" />
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Viaje finalizado</div>
            <div className="text-lg font-bold text-foreground leading-tight">¿Cómo estuvo tu viaje?</div>
            <div className="text-sm text-foreground/80 mt-0.5">
              Tu opinión es muy importante. Para pedir un nuevo carro, primero califica este servicio.
            </div>
          </div>
        </div>
        <SpeakButton text={intro} size="md" label="Escuchar instrucción" />
      </header>

      <section
        aria-label="Resumen del viaje"
        className="rounded-2xl border border-border bg-card p-4 space-y-2 text-sm"
      >
        <div className="flex items-center gap-2 text-foreground">
          <Car className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="font-semibold">{conductor || "Conductor"}</span>
          {vehiculoPlaca && (
            <span className="ml-auto text-xs px-2 py-0.5 rounded-md bg-muted font-mono tracking-widest">
              {vehiculoPlaca}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">De:</span> {origen}
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">A:</span> {destino}
        </div>
      </section>

      <form onSubmit={submit} className="rounded-2xl border-2 border-primary/30 bg-card p-5 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Tu calificación <span className="text-destructive">*</span>
          </label>
          <div
            role="radiogroup"
            aria-label="Calificación de 1 a 5 estrellas"
            className="flex items-center gap-1.5"
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={estrellas === i}
                aria-label={`${i} estrella${i > 1 ? "s" : ""}`}
                onClick={() => setEstrellas(i)}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(0)}
                className="p-1.5 rounded-md hover:bg-muted/60 transition-colors active:scale-95"
              >
                <Star
                  className={`h-10 w-10 transition-colors ${
                    i <= (hover || estrellas)
                      ? "fill-warning text-warning"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{labelEstrellas}</div>
        </div>

        <div>
          <label htmlFor="resena" className="block text-sm font-semibold text-foreground mb-2">
            Reseña (opcional)
          </label>
          <textarea
            id="resena"
            rows={4}
            maxLength={500}
            value={resena}
            onChange={(e) => setResena(e.target.value)}
            placeholder="Cuéntanos cómo te trataron, cómo manejó, si la atención fue buena…"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="mt-1 text-[11px] text-muted-foreground text-right">{resena.length}/500</div>
        </div>

        <button
          type="submit"
          disabled={estrellas < 1 || saving}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-base font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-primary/90 active:scale-[0.99] transition-all"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Star className="h-5 w-5" />}
          Enviar calificación
        </button>
        <p className="text-[11px] text-muted-foreground text-center">
          Después de calificar podrás pedir un nuevo viaje.
        </p>
      </form>
    </div>
  );
}
