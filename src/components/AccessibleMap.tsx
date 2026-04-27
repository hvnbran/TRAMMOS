import { useEffect, useRef, useState } from "react";
import { Car, MapPin, Clock, Bell, Vibrate } from "lucide-react";
import { Pictograma } from "./Pictograma";
import { SpeakButton } from "./SpeakButton";
import { useA11y } from "@/lib/a11y-context";

interface Props {
  /** Origen legible (ej. "Casa") */
  origen: string;
  /** Destino legible (ej. "Sodimac Calle 80") */
  destino: string;
  /** Minutos estimados para la llegada del vehículo */
  etaMinutos: number;
  /** Conductor asignado (opcional, no se muestra si no aporta) */
  conductor?: string;
  /** Color y placa del vehículo */
  vehiculo?: string;
  /** Llamar cuando el vehículo está cerca (ej. ≤3 min) para alertas vibratorias */
  alertarCerca?: boolean;
  className?: string;
}

/**
 * AccessibleMap — Visualización accesible del trayecto.
 * No es un mapa cartográfico real (esto es Fase D con tracking GPS),
 * sino una representación abstracta clara, con narración por voz y
 * vibración cuando el carro está cerca. Pensado para usuarios ciegos,
 * con baja visión, o con discapacidad cognitiva.
 *
 * Cumple Principio Multimodal: visual + audio + táctil (vibración).
 */
export function AccessibleMap({
  origen,
  destino,
  etaMinutos,
  conductor,
  vehiculo,
  alertarCerca = true,
  className = "",
}: Props) {
  const { prefs } = useA11y();
  const [eta, setEta] = useState(etaMinutos);
  const [vibrated, setVibrated] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Decremento simulado del ETA cada 30s (en producción vendría del tracker)
  useEffect(() => {
    setEta(etaMinutos);
    setVibrated(false);
  }, [etaMinutos]);

  useEffect(() => {
    if (eta <= 0) return;
    intervalRef.current = setInterval(() => {
      setEta((e) => Math.max(0, e - 1));
    }, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [eta]);

  // Vibración + voz cuando el vehículo está muy cerca
  useEffect(() => {
    if (!alertarCerca || vibrated) return;
    if (eta > 0 && eta <= 3) {
      setVibrated(true);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate?.([300, 100, 300, 100, 600]);
        } catch {
          /* ignore */
        }
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(
          `Atención. Tu vehículo llega en ${eta} minutos a ${destino}.`,
        );
        u.lang = "es-CO";
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      }
    }
  }, [eta, alertarCerca, destino, vibrated]);

  const progreso = etaMinutos > 0 ? Math.min(100, ((etaMinutos - eta) / etaMinutos) * 100) : 100;
  const cerca = eta <= 3 && eta > 0;
  const llego = eta === 0;

  const narracion =
    llego
      ? `Tu vehículo ya llegó a ${destino}.`
      : `Vas de ${origen} a ${destino}. ` +
        `Tu carro llega en ${eta} ${eta === 1 ? "minuto" : "minutos"}.` +
        (vehiculo ? ` Es un ${vehiculo}.` : "");

  const showText = !prefs.pictoMode || prefs.simpleMode;

  return (
    <div
      className={`rounded-2xl border-2 ${
        cerca ? "border-warning bg-warning/10 animate-pulse" : llego ? "border-success bg-success/10" : "border-border bg-card"
      } p-4 sm:p-5 ${className}`}
      role="region"
      aria-label="Estado del viaje accesible"
    >
      {/* Cabecera con narración */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center">
            <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Mi viaje</div>
            <div className="text-sm font-semibold text-foreground">
              {llego ? "Vehículo en sitio" : cerca ? "¡Cerca!" : "En camino"}
            </div>
          </div>
        </div>
        <SpeakButton text={narracion} size="md" label="Escuchar estado del viaje" />
      </div>

      {/* Pictogramas grandes: origen → carro → destino */}
      <div className="grid grid-cols-3 items-center gap-2 mb-5">
        <div className="flex flex-col items-center gap-2">
          <Pictograma name="casa" size="lg" />
          {showText && (
            <span className="text-[11px] text-center font-medium text-foreground line-clamp-2">
              {origen}
            </span>
          )}
        </div>

        <div className="flex flex-col items-center">
          <div className="relative w-full h-2 rounded-full bg-muted overflow-hidden mb-2">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
              style={{ width: `${progreso}%` }}
            />
          </div>
          <Car className={`h-7 w-7 ${cerca ? "text-warning" : llego ? "text-success" : "text-primary"}`} aria-hidden="true" />
          <span className="text-[10px] text-muted-foreground mt-1">
            {Math.round(progreso)}%
          </span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Pictograma name="ubicacion" size="lg" />
          {showText && (
            <span className="text-[11px] text-center font-medium text-foreground line-clamp-2">
              {destino}
            </span>
          )}
        </div>
      </div>

      {/* ETA grande */}
      <div className="flex items-center justify-center gap-3 py-3 rounded-xl bg-background border border-border mb-3">
        <Clock className="h-6 w-6 text-primary" aria-hidden="true" />
        <div className="text-center">
          <div className="text-3xl font-bold text-foreground tabular-nums">
            {llego ? "0" : eta}
          </div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {llego ? "minutos · llegó" : eta === 1 ? "minuto" : "minutos"}
          </div>
        </div>
      </div>

      {/* Info del vehículo (sin nombre del conductor por accesibilidad) */}
      {vehiculo && (
        <div className="flex items-center gap-2 text-sm text-foreground bg-muted/40 rounded-lg px-3 py-2">
          <Car className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="font-medium">Vehículo:</span>
          <span>{vehiculo}</span>
        </div>
      )}

      {/* Indicador de alertas activas */}
      {alertarCerca && (
        <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Bell className="h-3 w-3" aria-hidden="true" /> Aviso por voz
          </span>
          <span className="inline-flex items-center gap-1">
            <Vibrate className="h-3 w-3" aria-hidden="true" /> Vibración a 3 min
          </span>
        </div>
      )}

      {/* Conductor opcional, sin destacar */}
      {conductor && (
        <p className="sr-only">Conductor asignado: {conductor}</p>
      )}
    </div>
  );
}
