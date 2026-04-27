import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PasajeroHeader } from "@/components/pasajero/PasajeroHeader";
import { PedirServicioForm, type PasajeroPerfil } from "@/components/pasajero/PedirServicioForm";
import { ViajeEnCurso, type EstadoSolicitud } from "@/components/pasajero/ViajeEnCurso";
import { AccessibilityPanel } from "@/components/layout/AccessibilityPanel";
import { TramiAssistant } from "@/components/TramiAssistant";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/pasajero")({
  component: PasajeroPage,
  head: () => ({
    meta: [
      { title: "Pide tu carro - TRAMMOS" },
      { name: "description", content: "Pide y rastrea tu viaje TRAMMOS de forma simple y accesible." },
      { name: "theme-color", content: "#0EA5E9" },
    ],
  }),
});

interface SolicitudActiva {
  id: string;
  estado: EstadoSolicitud;
  origen: string;
  destino: string;
  hora_recogida: string;
  conductor_nombre: string | null;
  vehiculo_placa: string | null;
}

interface VehiculoInfo {
  foto_url: string | null;
  marca: string | null;
  linea: string | null;
  color: string | null;
}

function PasajeroPage() {
  const { user, role, loading, signOut, displayName } = useAuth();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<PasajeroPerfil | null>(null);
  const [perfilLoading, setPerfilLoading] = useState(true);
  const [solicitud, setSolicitud] = useState<SolicitudActiva | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [ultima, setUltima] = useState<{ origen: string; destino: string } | null>(null);
  const [vehiculoInfo, setVehiculoInfo] = useState<VehiculoInfo | null>(null);

  // Guard: solo pasajeros
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (role && role !== "pasajero") {
      navigate({ to: "/" });
    }
  }, [user, role, loading, navigate]);

  // Cargar perfil + última solicitud + activa
  useEffect(() => {
    if (!user || role !== "pasajero") return;
    let mounted = true;
    (async () => {
      setPerfilLoading(true);
      const { data: p } = await supabase
        .from("pasajeros_pcd")
        .select("id,nombre,cliente,direccion_habitual,centros_costo_permitidos")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!mounted) return;
      if (p) {
        setPerfil({
          id: p.id,
          nombre: p.nombre,
          cliente: p.cliente as "corona" | "sodimac",
          direccion_habitual: p.direccion_habitual,
          centros_costo_permitidos: p.centros_costo_permitidos,
        });
      }

      const { data: activas } = await supabase
        .from("solicitudes_pasajero")
        .select("id,estado,origen,destino,hora_recogida,conductor_nombre,vehiculo_placa")
        .eq("created_by_pasajero", user.id)
        .in("estado", ["solicitada", "aceptada", "en_camino", "a_bordo"])
        .order("created_at", { ascending: false })
        .limit(1);
      if (mounted && activas && activas[0]) {
        setSolicitud(activas[0] as SolicitudActiva);
      }

      const { data: hist } = await supabase
        .from("solicitudes_pasajero")
        .select("origen,destino")
        .eq("created_by_pasajero", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (mounted && hist && hist[0]) setUltima({ origen: hist[0].origen, destino: hist[0].destino });

      setPerfilLoading(false);
    })();
    return () => { mounted = false; };
  }, [user, role]);

  // Realtime sobre la solicitud activa
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("solicitudes-pasajero-self")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "solicitudes_pasajero", filter: `created_by_pasajero=eq.${user.id}` },
        (payload) => {
          const row = payload.new as SolicitudActiva | undefined;
          if (!row) return;
          if (["solicitada", "aceptada", "en_camino", "a_bordo"].includes(row.estado)) {
            setSolicitud(row);
          } else {
            setSolicitud(null);
            if (row.estado === "finalizada") {
              setUltima({ origen: row.origen, destino: row.destino });
            }
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  // Cargar info del vehículo (foto, marca, etc.) cuando llega la placa asignada
  useEffect(() => {
    const placa = solicitud?.vehiculo_placa?.trim();
    if (!placa || !perfil) {
      setVehiculoInfo(null);
      return;
    }
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("vehiculos")
        .select("foto_url,marca,linea,color")
        .eq("cliente", perfil.cliente)
        .ilike("placa", placa)
        .maybeSingle();
      if (mounted) {
        setVehiculoInfo(
          data
            ? { foto_url: data.foto_url, marca: data.marca, linea: data.linea, color: data.color }
            : { foto_url: null, marca: null, linea: null, color: null },
        );
      }
    })();
    return () => { mounted = false; };
  }, [solicitud?.vehiculo_placa, perfil]);

  const etaMinutos = useMemo(() => {
    if (!solicitud) return 0;
    if (solicitud.estado === "solicitada") return 8;
    if (solicitud.estado === "aceptada") return 6;
    if (solicitud.estado === "en_camino") {
      const t = new Date(solicitud.hora_recogida).getTime() - Date.now();
      return Math.max(1, Math.round(t / 60000));
    }
    return 0;
  }, [solicitud]);

  const handleSubmit = async ({ origen, destino, hora_recogida, programado, notas }: {
    origen: string; destino: string; hora_recogida: Date; programado: boolean; notas: string;
  }) => {
    if (!user || !perfil) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from("solicitudes_pasajero")
      .insert({
        pasajero_pcd_id: perfil.id,
        cliente: perfil.cliente,
        created_by_pasajero: user.id,
        origen, destino,
        hora_recogida: hora_recogida.toISOString(),
        programado,
        notas: notas || null,
        estado: "solicitada",
      })
      .select("id,estado,origen,destino,hora_recogida,conductor_nombre,vehiculo_placa")
      .single();
    setSubmitting(false);
    if (!error && data) setSolicitud(data as SolicitudActiva);
  };

  const handleCancel = async () => {
    if (!solicitud) return;
    setCancelando(true);
    await supabase
      .from("solicitudes_pasajero")
      .update({ estado: "cancelada", cancelado_motivo: "Cancelada por el pasajero" })
      .eq("id", solicitud.id);
    setCancelando(false);
    setSolicitud(null);
  };

  const handlePanic = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate?.([500, 200, 500, 200, 800]); } catch { /* ignore */ }
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance("Alerta de pánico activada. Notificando al equipo TRAMMOS.");
      u.lang = "es-CO";
      window.speechSynthesis.speak(u);
    }
    alert("🆘 Alerta enviada al equipo TRAMMOS. Te contactaremos de inmediato.");
  };

  if (loading || perfilLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6 text-center">
        <div className="max-w-sm">
          <h1 className="text-xl font-bold text-foreground">Tu cuenta no está vinculada</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Contacta al equipo TRAMMOS para activar tu acceso como pasajero.
          </p>
          <button
            onClick={() => signOut()}
            className="mt-4 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <a href="#pasajero-main" className="skip-link">Saltar al contenido</a>
      <PasajeroHeader nombre={displayName || perfil.nombre} onSignOut={() => signOut()} />
      <main id="pasajero-main" className="mx-auto max-w-md px-4 py-5 pb-28">
        {solicitud ? (
          <ViajeEnCurso
            estado={solicitud.estado}
            origen={solicitud.origen}
            destino={solicitud.destino}
            conductor={solicitud.conductor_nombre}
            vehiculo={solicitud.vehiculo_placa}
            vehiculoFoto={vehiculoInfo?.foto_url ?? null}
            vehiculoMarca={vehiculoInfo?.marca ?? null}
            vehiculoLinea={vehiculoInfo?.linea ?? null}
            vehiculoColor={vehiculoInfo?.color ?? null}
            etaMinutos={etaMinutos}
            cancelando={cancelando}
            onCancel={handleCancel}
            onPanic={handlePanic}
          />
        ) : (
          <PedirServicioForm
            perfil={perfil}
            ultima={ultima}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        )}
      </main>
      <AccessibilityPanel />
      <TramiAssistant />
    </div>
  );
}
