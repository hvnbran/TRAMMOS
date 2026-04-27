import { useEffect, useMemo, useState } from "react";
import { Pictograma } from "@/components/Pictograma";
import { SpeakButton } from "@/components/SpeakButton";
import { Loader2, MapPin, Send, Clock, Briefcase, Home, Repeat } from "lucide-react";

export interface PasajeroPerfil {
  id: string;
  nombre: string;
  cliente: "corona" | "sodimac";
  direccion_habitual: string | null;
  centros_costo_permitidos: string[] | null;
}

export interface UltimaSolicitud {
  origen: string;
  destino: string;
}

interface Props {
  perfil: PasajeroPerfil;
  ultima?: UltimaSolicitud | null;
  submitting: boolean;
  onSubmit: (data: { origen: string; destino: string; hora_recogida: Date; programado: boolean; notas: string }) => Promise<void> | void;
}

export function PedirServicioForm({ perfil, ultima, submitting, onSubmit }: Props) {
  const [origen, setOrigen] = useState(perfil.direccion_habitual || "");
  const [destino, setDestino] = useState("");
  const [notas, setNotas] = useState("");
  const [modoHora, setModoHora] = useState<"ahora" | "programar">("ahora");
  const [horaProgramada, setHoraProgramada] = useState<string>(() => {
    const d = new Date(Date.now() + 30 * 60_000);
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60_000);
    return local.toISOString().slice(0, 16);
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (perfil.direccion_habitual && !origen) setOrigen(perfil.direccion_habitual);
  }, [perfil.direccion_habitual, origen]);

  const atajos = useMemo(() => {
    const list: { label: string; icon: typeof Home; destino: string }[] = [];
    if (perfil.direccion_habitual) {
      list.push({ label: "A casa", icon: Home, destino: perfil.direccion_habitual });
    }
    (perfil.centros_costo_permitidos || []).slice(0, 3).forEach((c) =>
      list.push({ label: c, icon: Briefcase, destino: c }),
    );
    if (ultima) list.push({ label: "Repetir último", icon: Repeat, destino: ultima.destino });
    return list;
  }, [perfil, ultima]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!origen.trim() || !destino.trim()) {
      setError("Necesitamos saber de dónde sales y a dónde vas.");
      return;
    }
    const hora = modoHora === "ahora" ? new Date() : new Date(horaProgramada);
    if (Number.isNaN(hora.getTime())) {
      setError("Revisa la hora de recogida.");
      return;
    }
    await onSubmit({
      origen: origen.trim(),
      destino: destino.trim(),
      hora_recogida: hora,
      programado: modoHora === "programar",
      notas: notas.trim(),
    });
  };

  const narracion = `Hola ${perfil.nombre}. Cuéntame a dónde vas. Sales desde ${origen || "tu ubicación"} y vas a ${destino || "tu destino"}.`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground leading-tight">¿A dónde vamos hoy?</h2>
          <p className="text-sm text-muted-foreground mt-1">Pide tu carro en menos de un minuto.</p>
        </div>
        <SpeakButton text={narracion} size="md" label="Escuchar instrucciones" />
      </header>

      {/* Atajos rápidos */}
      {atajos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {atajos.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => setDestino(a.destino)}
              className="inline-flex items-center gap-2 px-3 h-10 rounded-full bg-muted/50 border border-border text-sm font-medium text-foreground hover:bg-muted transition-all active:scale-95"
            >
              <a.icon className="h-4 w-4 text-primary" />
              {a.label}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Pictograma name="casa" size="sm" />
            Sales de
          </label>
          <input
            type="text"
            value={origen}
            onChange={(e) => setOrigen(e.target.value)}
            placeholder="Tu ubicación de salida"
            className="w-full h-14 rounded-xl border-2 border-input bg-background px-4 text-base focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
            autoComplete="street-address"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Pictograma name="ubicacion" size="sm" />
            Vas a
          </label>
          <input
            type="text"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            placeholder="Tu destino"
            className="w-full h-14 rounded-xl border-2 border-input bg-background px-4 text-base focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Hora de recogida
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setModoHora("ahora")}
              className={`h-12 rounded-xl border-2 text-sm font-semibold transition-all ${
                modoHora === "ahora"
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/40"
              }`}
              aria-pressed={modoHora === "ahora"}
            >
              Ahora
            </button>
            <button
              type="button"
              onClick={() => setModoHora("programar")}
              className={`h-12 rounded-xl border-2 text-sm font-semibold transition-all ${
                modoHora === "programar"
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/40"
              }`}
              aria-pressed={modoHora === "programar"}
            >
              Programar
            </button>
          </div>
          {modoHora === "programar" && (
            <input
              type="datetime-local"
              value={horaProgramada}
              onChange={(e) => setHoraProgramada(e.target.value)}
              className="w-full h-12 rounded-xl border-2 border-input bg-background px-4 text-base focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
            />
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Nota para el conductor (opcional)</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            placeholder="Por ejemplo: estaré en la portería del edificio."
            className="w-full rounded-xl border-2 border-input bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary resize-none"
            maxLength={400}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 border-2 border-destructive/30 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full h-16 rounded-2xl bg-primary text-primary-foreground text-lg font-bold shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-3 disabled:opacity-70 active:scale-[0.98]"
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> Enviando solicitud...
          </>
        ) : (
          <>
            <Send className="h-5 w-5" /> Pedir mi carro
            <MapPin className="h-5 w-5" />
          </>
        )}
      </button>
    </form>
  );
}
