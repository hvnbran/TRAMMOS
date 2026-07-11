import { useEffect, useState } from "react";
import { Pictograma } from "@/components/Pictograma";
import { SpeakButton } from "@/components/SpeakButton";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Loader2, MapPin, Send, Clock, Star, Plus, X, Navigation } from "lucide-react";

export interface PasajeroPerfil {
  id: string;
  nombre: string;
  cliente: "corona" | "sodimac" | "hospital_sur";
  direccion_habitual: string | null;
  centros_costo_permitidos: string[] | null;
  foto_url?: string | null;
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

type Favorito = { id: string; nombre: string; direccion: string };

const FAVS_KEY = "pasajero_favoritos_v1";

function loadFavoritos(): Favorito[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FAVS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((f) => f && typeof f.nombre === "string" && typeof f.direccion === "string");
  } catch {
    return [];
  }
}

function saveFavoritos(list: Favorito[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FAVS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function PedirServicioForm({ perfil, ultima: _ultima, submitting, onSubmit }: Props) {
  // El origen SIEMPRE inicia vacío (el pasajero decide desde dónde sale).
  const [origen, setOrigen] = useState("");
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
  const geo = useGeolocation(true);

  // Favoritos del pasajero (guardados localmente en este dispositivo)
  const [favoritos, setFavoritos] = useState<Favorito[]>(() => loadFavoritos());
  const [showAddFav, setShowAddFav] = useState(false);
  const [favNombre, setFavNombre] = useState("");
  const [favDireccion, setFavDireccion] = useState("");

  useEffect(() => {
    saveFavoritos(favoritos);
  }, [favoritos]);

  const handleAddFavorito = () => {
    const nombre = favNombre.trim();
    const direccion = favDireccion.trim();
    if (!nombre || !direccion) return;
    setFavoritos((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2, 10), nombre, direccion },
    ]);
    setFavNombre("");
    setFavDireccion("");
    setShowAddFav(false);
  };

  const handleRemoveFavorito = (id: string) => {
    setFavoritos((prev) => prev.filter((f) => f.id !== id));
  };

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

      {/* Destinos favoritos del pasajero */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Mis destinos favoritos
          </span>
          <button
            type="button"
            onClick={() => setShowAddFav((v) => !v)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <Plus className="h-3.5 w-3.5" />
            {showAddFav ? "Cancelar" : "Nuevo"}
          </button>
        </div>

        {favoritos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {favoritos.map((f) => (
              <div
                key={f.id}
                className="group inline-flex items-center gap-1 pl-3 pr-1 h-10 rounded-full bg-muted/50 border border-border text-sm font-medium text-foreground"
              >
                <button
                  type="button"
                  onClick={() => setDestino(f.direccion)}
                  className="inline-flex items-center gap-2 hover:text-primary transition-colors"
                  title={f.direccion}
                >
                  <Star className="h-4 w-4 text-primary" />
                  {f.nombre}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveFavorito(f.id)}
                  className="ml-1 h-7 w-7 inline-flex items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Eliminar favorito ${f.nombre}`}
                  title="Eliminar"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {favoritos.length === 0 && !showAddFav && (
          <p className="text-xs text-muted-foreground">
            Aún no tienes destinos guardados. Toca <strong>Nuevo</strong> para agregar uno.
          </p>
        )}

        {showAddFav && (
          <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-3 space-y-2">
            <input
              type="text"
              value={favNombre}
              onChange={(e) => setFavNombre(e.target.value)}
              placeholder="Nombre (ej: Casa, Oficina, Mamá)"
              className="w-full h-11 rounded-lg border-2 border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
              maxLength={40}
            />
            <input
              type="text"
              value={favDireccion}
              onChange={(e) => setFavDireccion(e.target.value)}
              placeholder="Dirección completa"
              className="w-full h-11 rounded-lg border-2 border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
              maxLength={200}
            />
            <button
              type="button"
              onClick={handleAddFavorito}
              disabled={!favNombre.trim() || !favDireccion.trim()}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
            >
              Guardar favorito
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Pictograma name="casa" size="sm" />
            Sales de
            {geo.status === "granted" && (
              <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                <Navigation className="h-3 w-3" /> Usando tu ubicación{geo.departamento ? ` · ${geo.departamento}` : ""}
              </span>
            )}
            {geo.status === "denied" && (
              <button
                type="button"
                onClick={geo.request}
                className="ml-auto text-[11px] font-medium text-primary underline"
              >
                Activar ubicación
              </button>
            )}
          </label>
          <AddressAutocomplete
            value={origen}
            onChange={(v) => setOrigen(v)}
            placeholder="Tu ubicación de salida"
            bias={geo.lat != null && geo.lon != null ? { lat: geo.lat, lon: geo.lon } : null}
            bbox={geo.bbox}
            departamento={geo.departamento}
            strictDepartamento
            required
            inputClassName="h-14"
            autoComplete="street-address"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Pictograma name="ubicacion" size="sm" />
            Vas a
          </label>
          <AddressAutocomplete
            value={destino}
            onChange={(v) => setDestino(v)}
            placeholder="Tu destino"
            bias={geo.lat != null && geo.lon != null ? { lat: geo.lat, lon: geo.lon } : null}
            bbox={geo.bbox}
            departamento={geo.departamento}
            strictDepartamento
            required
            inputClassName="h-14"
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
