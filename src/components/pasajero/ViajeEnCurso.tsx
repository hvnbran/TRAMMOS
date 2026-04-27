import { AccessibleMap } from "@/components/AccessibleMap";
import { SpeakButton } from "@/components/SpeakButton";
import { Phone, AlertOctagon, X, Loader2, CheckCircle2 } from "lucide-react";
import { Pictograma } from "@/components/Pictograma";

export type EstadoSolicitud = "solicitada" | "aceptada" | "en_camino" | "a_bordo" | "finalizada" | "cancelada";

interface Props {
  estado: EstadoSolicitud;
  origen: string;
  destino: string;
  conductor?: string | null;
  vehiculo?: string | null;
  etaMinutos: number;
  cancelando: boolean;
  onCancel: () => void;
  onPanic: () => void;
}

const LABELS: Record<EstadoSolicitud, { titulo: string; sub: string }> = {
  solicitada: { titulo: "Buscando carro", sub: "Estamos asignando un vehículo a tu viaje." },
  aceptada: { titulo: "¡Carro asignado!", sub: "Tu conductor ya tiene tu solicitud." },
  en_camino: { titulo: "En camino", sub: "Tu carro va hacia ti." },
  a_bordo: { titulo: "Viaje en curso", sub: "Disfruta tu viaje. Llegamos pronto." },
  finalizada: { titulo: "Viaje finalizado", sub: "¡Gracias por viajar con TRAMMOS!" },
  cancelada: { titulo: "Viaje cancelado", sub: "" },
};

export function ViajeEnCurso({
  estado,
  origen,
  destino,
  conductor,
  vehiculo,
  etaMinutos,
  cancelando,
  onCancel,
  onPanic,
}: Props) {
  const info = LABELS[estado];
  const narracion = `${info.titulo}. ${info.sub}`;
  const puedeCancelar = estado === "solicitada" || estado === "aceptada" || estado === "en_camino";

  return (
    <div className="space-y-5">
      <header className="rounded-2xl bg-primary/10 border-2 border-primary/30 p-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {estado === "solicitada" ? (
            <Loader2 className="h-7 w-7 text-primary animate-spin" />
          ) : estado === "finalizada" ? (
            <CheckCircle2 className="h-7 w-7 text-success" />
          ) : (
            <Pictograma name="carro" size="md" />
          )}
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Estado</div>
            <div className="text-lg font-bold text-foreground leading-tight">{info.titulo}</div>
            {info.sub && <div className="text-sm text-foreground/80 mt-0.5">{info.sub}</div>}
          </div>
        </div>
        <SpeakButton text={narracion} size="md" label="Escuchar estado" />
      </header>

      {(estado === "aceptada" || estado === "en_camino" || estado === "a_bordo") && (
        <AccessibleMap
          origen={origen}
          destino={destino}
          etaMinutos={Math.max(0, etaMinutos)}
          conductor={conductor || undefined}
          vehiculo={vehiculo || undefined}
        />
      )}

      {(estado === "aceptada" || estado === "en_camino") && conductor && (
        <a
          href="tel:+573000000000"
          className="w-full h-14 rounded-2xl bg-card border-2 border-border text-foreground text-base font-semibold flex items-center justify-center gap-3 hover:bg-muted/40 transition-all active:scale-[0.98]"
        >
          <Phone className="h-5 w-5 text-primary" /> Llamar al conductor
        </a>
      )}

      <button
        type="button"
        onClick={onPanic}
        className="w-full h-14 rounded-2xl bg-destructive/10 border-2 border-destructive text-destructive text-base font-bold flex items-center justify-center gap-3 hover:bg-destructive/20 transition-all active:scale-[0.98]"
      >
        <AlertOctagon className="h-5 w-5" /> Botón de pánico
      </button>

      {puedeCancelar && (
        <button
          type="button"
          onClick={onCancel}
          disabled={cancelando}
          className="w-full h-12 rounded-xl border-2 border-border bg-card text-muted-foreground text-sm font-medium hover:text-destructive hover:border-destructive transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {cancelando ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          Cancelar viaje
        </button>
      )}
    </div>
  );
}
