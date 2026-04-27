import { SpeakButton } from "@/components/SpeakButton";
import { Phone, AlertOctagon, X, Loader2, CheckCircle2, Car, User, AlertTriangle } from "lucide-react";
import { Pictograma } from "@/components/Pictograma";

export type EstadoSolicitud = "solicitada" | "aceptada" | "en_camino" | "a_bordo" | "finalizada" | "cancelada";

interface Props {
  estado: EstadoSolicitud;
  origen: string;
  destino: string;
  conductor?: string | null;
  conductorTelefono?: string | null;
  vehiculo?: string | null;
  vehiculoFoto?: string | null;
  vehiculoMarca?: string | null;
  vehiculoLinea?: string | null;
  vehiculoColor?: string | null;
  etaMinutos: number;
  cancelando: boolean;
  onCancel: () => void;
  onPanic: () => void;
  onReportarIncidente?: () => void;
}

const LABELS: Record<EstadoSolicitud, { titulo: string; sub: string }> = {
  solicitada: { titulo: "Buscando carro", sub: "Estamos asignando un vehículo a tu viaje." },
  aceptada: { titulo: "¡Carro asignado!", sub: "Tu conductor ya tiene tu solicitud." },
  en_camino: { titulo: "En camino", sub: "Tu carro va hacia ti." },
  a_bordo: { titulo: "Viaje en curso", sub: "Disfruta tu viaje. Llegamos pronto." },
  finalizada: { titulo: "Viaje finalizado", sub: "¡Gracias por viajar con TRAMMOS!" },
  cancelada: { titulo: "Viaje cancelado", sub: "" },
};

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).slice(0, 2);
  return partes.map((p) => p.charAt(0).toUpperCase()).join("") || "?";
}

export function ViajeEnCurso({
  estado,
  origen,
  destino,
  conductor,
  conductorTelefono,
  vehiculo,
  vehiculoFoto,
  vehiculoMarca,
  vehiculoLinea,
  vehiculoColor,
  etaMinutos,
  cancelando,
  onCancel,
  onPanic,
  onReportarIncidente,
}: Props) {
  const info = LABELS[estado];
  const puedeReportar =
    estado === "aceptada" || estado === "en_camino" || estado === "a_bordo";
  const narracion = `${info.titulo}. ${info.sub}${conductor ? ` Tu conductor es ${conductor}.` : ""}${vehiculo ? ` Placa ${vehiculo}.` : ""}`;
  const puedeCancelar = estado === "solicitada" || estado === "aceptada" || estado === "en_camino";
  const mostrarConductor =
    (estado === "aceptada" || estado === "en_camino" || estado === "a_bordo") && (conductor || vehiculo);
  const detalleVehiculo = [vehiculoMarca, vehiculoLinea, vehiculoColor].filter(Boolean).join(" · ");

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
            {etaMinutos > 0 && (estado === "aceptada" || estado === "en_camino") && (
              <div className="text-xs font-semibold text-primary mt-1">
                Llega en aprox. {etaMinutos} min
              </div>
            )}
          </div>
        </div>
        <SpeakButton text={narracion} size="md" label="Escuchar estado" />
      </header>

      {/* Tarjeta del conductor + vehículo asignado */}
      {mostrarConductor && (
        <article
          aria-label="Tu conductor asignado"
          className="rounded-2xl border-2 border-border bg-card overflow-hidden shadow-sm"
        >
          {/* Foto del vehículo (o placeholder) */}
          <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-muted/60 to-muted">
            {vehiculoFoto ? (
              <img
                src={vehiculoFoto}
                alt={`Vehículo ${vehiculo ?? ""} ${detalleVehiculo}`.trim()}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <Car className="h-10 w-10" aria-hidden="true" />
                <span className="text-xs mt-1">Sin foto del vehículo</span>
              </div>
            )}
            {vehiculo && (
              <div className="absolute bottom-2 left-2 px-3 py-1 rounded-md bg-foreground/85 text-background text-base font-extrabold tracking-widest shadow-md">
                {vehiculo}
              </div>
            )}
          </div>

          {/* Info conductor */}
          <div className="p-4 flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-full bg-primary/15 text-primary text-base font-bold flex items-center justify-center shrink-0 border border-primary/30"
              aria-hidden="true"
            >
              {conductor ? iniciales(conductor) : <User className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground leading-none">
                Tu conductor
              </div>
              <div className="text-base font-bold text-foreground truncate">
                {conductor || "Asignando…"}
              </div>
              {detalleVehiculo && (
                <div className="text-xs text-muted-foreground truncate mt-0.5">{detalleVehiculo}</div>
              )}
            </div>
            {conductor && conductorTelefono && (
              <a
                href={`tel:${conductorTelefono.replace(/[^\d+]/g, "")}`}
                aria-label={`Llamar a ${conductor} al ${conductorTelefono}`}
                className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:opacity-90 active:scale-95 transition-all"
              >
                <Phone className="h-5 w-5" />
              </a>
            )}
          </div>
        </article>
      )}

      {/* Origen / destino resumido */}
      <section
        aria-label="Trayecto"
        className="rounded-2xl border border-border bg-card p-4 space-y-2 text-sm"
      >
        <div className="flex items-start gap-2">
          <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" aria-hidden="true" />
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Recogida</div>
            <div className="font-medium text-foreground">{origen}</div>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-1 h-2 w-2 rounded-full bg-accent shrink-0" aria-hidden="true" />
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Destino</div>
            <div className="font-medium text-foreground">{destino}</div>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={onPanic}
        className="w-full h-14 rounded-2xl bg-destructive/10 border-2 border-destructive text-destructive text-base font-bold flex items-center justify-center gap-3 hover:bg-destructive/20 transition-all active:scale-[0.98]"
      >
        <AlertOctagon className="h-5 w-5" /> Botón de pánico
      </button>

      {puedeReportar && onReportarIncidente && (
        <button
          type="button"
          onClick={onReportarIncidente}
          className="w-full h-12 rounded-xl border-2 border-warning/60 bg-warning/10 text-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:bg-warning/20 transition-all active:scale-[0.99]"
        >
          <AlertTriangle className="h-4 w-4 text-warning" /> Reportar incidente
        </button>
      )}

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
