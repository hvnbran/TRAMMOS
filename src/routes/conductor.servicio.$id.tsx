import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ConductorLayout } from "@/components/conductor/ConductorLayout";
import { PersonaAvatar } from "@/components/PersonaAvatar";
import {
  Loader2,
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  Navigation,
  Play,
  CheckCircle2,
  XCircle,
  Phone,
  Heart,
  Accessibility,
} from "lucide-react";

export const Route = createFileRoute("/conductor/servicio/$id")({
  component: ServicioDetalle,
  head: () => ({
    meta: [
      { title: "Servicio — Conductor TRAMMOS" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

interface Servicio {
  id: string;
  fecha: string;
  hora: string | null;
  origen: string | null;
  destino: string | null;
  pasajero: string | null;
  centro_costo: string | null;
  estado: string;
  numero_orden: string | null;
  vehiculo: string | null;
  pasajero_pcd_id: string | null;
}

interface PasajeroBrief {
  nombre?: string;
  foto_url?: string | null;
  telefono?: string;
  tipo_discapacidad?: string;
  ayudas_tecnicas?: string[];
  comunicacion_preferida?: string;
  nivel_asistencia?: number;
  contacto_emergencia_nombre?: string;
  contacto_emergencia_telefono?: string;
  contacto_emergencia_relacion?: string;
  notas_conductor?: string;
  alergias?: string;
  medicamentos?: string;
  condiciones_medicas?: string;
  requiere_vehiculo_adaptado?: boolean;
  silla_ruedas_medidas?: string;
}

function badgeEstado(estado: string) {
  const map: Record<string, string> = {
    Programado: "bg-blue-500/15 text-blue-700 border-blue-500/30",
    "En curso": "bg-warning/15 text-warning border-warning/30",
    Finalizado: "bg-success/15 text-success border-success/30",
    Cancelado: "bg-destructive/15 text-destructive border-destructive/30",
  };
  return map[estado] || "bg-secondary text-foreground border-border";
}

function mapsUrl(direccion: string | null) {
  if (!direccion) return "#";
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(direccion)}`;
}

function ServicioDetalle() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [servicio, setServicio] = useState<Servicio | null>(null);
  const [brief, setBrief] = useState<PasajeroBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data: serv, error: sErr } = await supabase
      .from("servicios")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (sErr || !serv) {
      setError("No se pudo cargar el servicio.");
      setLoading(false);
      return;
    }
    setServicio(serv as Servicio);

    if ((serv as Servicio).pasajero_pcd_id) {
      const { data: b } = await supabase.rpc("get_pasajero_brief_for_conductor", {
        _servicio_id: id,
      });
      setBrief((b as PasajeroBrief) ?? null);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function cambiarEstado(nuevoEstado: "En curso" | "Finalizado" | "Cancelado") {
    let motivo: string | null = null;
    if (nuevoEstado === "Cancelado") {
      motivo = prompt("Motivo de cancelación (opcional):") ?? null;
    } else {
      const confirmTxt =
        nuevoEstado === "En curso"
          ? "¿Iniciar el servicio ahora?"
          : "¿Marcar el servicio como finalizado?";
      if (!confirm(confirmTxt)) return;
    }
    setActionLoading(nuevoEstado);
    const { data, error: rpcErr } = await supabase.rpc("conductor_set_estado_servicio", {
      _servicio_id: id,
      _nuevo_estado: nuevoEstado,
      _motivo: motivo ?? undefined,
    });
    setActionLoading(null);
    const r = data as { ok?: boolean; error?: string } | null;
    if (rpcErr || !r?.ok) {
      alert("No se pudo cambiar el estado: " + (rpcErr?.message || r?.error || "error"));
      return;
    }
    load();
  }

  if (loading) {
    return (
      <ConductorLayout title="Cargando…">
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </ConductorLayout>
    );
  }
  if (error || !servicio) {
    return (
      <ConductorLayout title="Servicio">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center">
          <AlertCircle className="h-5 w-5 text-destructive mx-auto mb-2" />
          <p className="text-sm">{error || "Servicio no disponible."}</p>
          <button
            onClick={() => navigate({ to: "/conductor" })}
            className="mt-3 text-sm text-primary hover:underline"
          >
            Volver
          </button>
        </div>
      </ConductorLayout>
    );
  }

  const puedeIniciar = servicio.estado === "Programado";
  const puedeFinalizar = servicio.estado === "En curso";
  const puedeCancelar = servicio.estado === "Programado" || servicio.estado === "En curso";

  return (
    <ConductorLayout title={`Servicio${servicio.numero_orden ? ` #${servicio.numero_orden}` : ""}`}>
      <div className="space-y-4">
        {/* Estado + datos básicos */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${badgeEstado(servicio.estado)}`}>
              {servicio.estado}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {servicio.fecha}
              {servicio.hora && (
                <>
                  <Clock className="h-3 w-3 ml-1" /> {servicio.hora}
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <PersonaAvatar nombre={brief?.nombre ?? servicio.pasajero} fotoUrl={brief?.foto_url ?? null} size="md" />
            <div className="text-base font-semibold flex-1 min-w-0 truncate">
              {servicio.pasajero || "Pasajero sin asignar"}
            </div>
          </div>

          {servicio.centro_costo && (
            <p className="text-xs text-muted-foreground">Centro de costo: {servicio.centro_costo}</p>
          )}
          {servicio.vehiculo && (
            <p className="text-xs text-muted-foreground">Vehículo asignado: <strong>{servicio.vehiculo}</strong></p>
          )}
        </div>

        {/* Recogida y destino con navegación */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Ruta</h3>
          {servicio.origen && (
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-full bg-success/15 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground">Recoger en</p>
                <p className="text-sm font-medium">{servicio.origen}</p>
                <a
                  href={mapsUrl(servicio.origen)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                >
                  <Navigation className="h-3 w-3" /> Ir al origen
                </a>
              </div>
            </div>
          )}
          {servicio.destino && (
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground">Llevar a</p>
                <p className="text-sm font-medium">{servicio.destino}</p>
                <a
                  href={mapsUrl(servicio.destino)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                >
                  <Navigation className="h-3 w-3" /> Ir al destino
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Brief PCD */}
        {brief && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Accessibility className="h-3.5 w-3.5" /> Información del pasajero
            </h3>
            {brief.tipo_discapacidad && brief.tipo_discapacidad !== "ninguna" && (
              <p className="text-sm"><strong>Discapacidad:</strong> {brief.tipo_discapacidad}</p>
            )}
            {brief.nivel_asistencia !== undefined && brief.nivel_asistencia > 0 && (
              <p className="text-sm"><strong>Nivel asistencia:</strong> {brief.nivel_asistencia}/3</p>
            )}
            {brief.ayudas_tecnicas && brief.ayudas_tecnicas.length > 0 && (
              <p className="text-sm"><strong>Ayudas técnicas:</strong> {brief.ayudas_tecnicas.join(", ")}</p>
            )}
            {brief.comunicacion_preferida && (
              <p className="text-sm"><strong>Comunicación:</strong> {brief.comunicacion_preferida}</p>
            )}
            {brief.requiere_vehiculo_adaptado && (
              <p className="text-sm text-warning font-semibold">⚠ Requiere vehículo adaptado</p>
            )}
            {brief.silla_ruedas_medidas && (
              <p className="text-sm"><strong>Silla:</strong> {brief.silla_ruedas_medidas}</p>
            )}
            {brief.notas_conductor && (
              <div className="rounded bg-warning/10 border border-warning/30 p-2 text-sm">
                <strong>Notas:</strong> {brief.notas_conductor}
              </div>
            )}
            {brief.telefono && (
              <a
                href={`tel:${brief.telefono}`}
                className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline"
              >
                <Phone className="h-3.5 w-3.5" /> Llamar al pasajero ({brief.telefono})
              </a>
            )}
            {(brief.contacto_emergencia_nombre || brief.contacto_emergencia_telefono) && (
              <div className="rounded bg-destructive/5 border border-destructive/20 p-2 mt-2">
                <p className="text-[11px] font-semibold text-destructive flex items-center gap-1">
                  <Heart className="h-3 w-3" /> Contacto de emergencia
                </p>
                <p className="text-sm">
                  {brief.contacto_emergencia_nombre}
                  {brief.contacto_emergencia_relacion && ` (${brief.contacto_emergencia_relacion})`}
                </p>
                {brief.contacto_emergencia_telefono && (
                  <a
                    href={`tel:${brief.contacto_emergencia_telefono}`}
                    className="text-sm text-primary font-semibold hover:underline"
                  >
                    📞 {brief.contacto_emergencia_telefono}
                  </a>
                )}
              </div>
            )}
            {(brief.alergias || brief.medicamentos || brief.condiciones_medicas) && (
              <details className="text-xs mt-2">
                <summary className="cursor-pointer text-muted-foreground">Información médica</summary>
                {brief.condiciones_medicas && <p className="mt-1"><strong>Condiciones:</strong> {brief.condiciones_medicas}</p>}
                {brief.alergias && <p><strong>Alergias:</strong> {brief.alergias}</p>}
                {brief.medicamentos && <p><strong>Medicamentos:</strong> {brief.medicamentos}</p>}
              </details>
            )}
          </div>
        )}

        {/* Acciones */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Acciones</h3>
          {puedeIniciar && (
            <button
              onClick={() => cambiarEstado("En curso")}
              disabled={actionLoading !== null}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-warning text-warning-foreground py-3 font-semibold disabled:opacity-50"
            >
              {actionLoading === "En curso" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Iniciar servicio
            </button>
          )}
          {puedeFinalizar && (
            <button
              onClick={() => cambiarEstado("Finalizado")}
              disabled={actionLoading !== null}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-success text-success-foreground py-3 font-semibold disabled:opacity-50"
            >
              {actionLoading === "Finalizado" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Finalizar servicio
            </button>
          )}
          {puedeCancelar && (
            <button
              onClick={() => cambiarEstado("Cancelado")}
              disabled={actionLoading !== null}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-destructive text-destructive py-2.5 font-semibold disabled:opacity-50 hover:bg-destructive/5"
            >
              {actionLoading === "Cancelado" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Cancelar servicio
            </button>
          )}
          {!puedeIniciar && !puedeFinalizar && !puedeCancelar && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Servicio {servicio.estado.toLowerCase()}. No hay acciones disponibles.
            </p>
          )}
        </div>
      </div>
    </ConductorLayout>
  );
}
