import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PasajeroHeader } from "@/components/pasajero/PasajeroHeader";
import { PedirServicioForm, type PasajeroPerfil } from "@/components/pasajero/PedirServicioForm";
import { ViajeEnCurso, type EstadoSolicitud } from "@/components/pasajero/ViajeEnCurso";
import { CalificarServicio } from "@/components/pasajero/CalificarServicio";
import { ReportarIncidenteModal } from "@/components/pasajero/ReportarIncidenteModal";
import { AccessibilityPanel } from "@/components/layout/AccessibilityPanel";
import { TramiAssistant } from "@/components/TramiAssistant";
import { InstallAppBanner } from "@/components/pasajero/InstallAppBanner";
import { PushNotificationsToggle } from "@/components/pasajero/PushNotificationsToggle";
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

interface SolicitudPendienteCalif {
  id: string;
  origen: string;
  destino: string;
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
  const [conductorTelefono, setConductorTelefono] = useState<string | null>(null);
  const [pendienteCalif, setPendienteCalif] = useState<SolicitudPendienteCalif | null>(null);
  const [savingCalif, setSavingCalif] = useState(false);
  const [showIncidente, setShowIncidente] = useState(false);
  const [savingIncidente, setSavingIncidente] = useState(false);

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

  // Verifica si hay una solicitud finalizada sin calificar
  const checkPendienteCalif = useCallback(async (uid: string) => {
    const { data: finalizadas } = await supabase
      .from("solicitudes_pasajero")
      .select("id,origen,destino,conductor_nombre,vehiculo_placa")
      .eq("created_by_pasajero", uid)
      .eq("estado", "finalizada")
      .order("updated_at", { ascending: false })
      .limit(1);

    const last = finalizadas?.[0];
    if (!last) {
      setPendienteCalif(null);
      return;
    }

    const { data: calif } = await supabase
      .from("calificaciones")
      .select("id")
      .eq("solicitud_id", last.id)
      .maybeSingle();

    if (!calif) {
      setPendienteCalif({
        id: last.id,
        origen: last.origen,
        destino: last.destino,
        conductor_nombre: last.conductor_nombre,
        vehiculo_placa: last.vehiculo_placa,
      });
    } else {
      setPendienteCalif(null);
    }
  }, []);

  // Cargar perfil + última solicitud + activa + pendiente de calificar
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

      await checkPendienteCalif(user.id);

      setPerfilLoading(false);
    })();
    return () => { mounted = false; };
  }, [user, role, checkPendienteCalif]);

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
              setPendienteCalif({
                id: row.id,
                origen: row.origen,
                destino: row.destino,
                conductor_nombre: row.conductor_nombre,
                vehiculo_placa: row.vehiculo_placa,
              });
            }
          }
          // Disparar el procesamiento de la cola de push (fire-and-forget)
          fetch("/api/public/push/process", { method: "POST" }).catch(() => { /* ignore */ });
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
      // Usamos un RPC con SECURITY DEFINER porque el rol "pasajero"
      // no tiene acceso directo a la tabla vehiculos vía RLS.
      const { data, error } = await supabase
        .rpc("get_vehiculo_publico_por_placa", { _placa: placa });
      if (error) {
        console.warn("[pasajero] No se pudo cargar info del vehículo:", error.message);
      }
      const row = Array.isArray(data) ? data[0] : data;
      if (mounted) {
        setVehiculoInfo(
          row
            ? { foto_url: row.foto_url, marca: row.marca, linea: row.linea, color: row.color }
            : { foto_url: null, marca: null, linea: null, color: null },
        );
      }
    })();
    return () => { mounted = false; };
  }, [solicitud?.vehiculo_placa, perfil]);

  // Cargar teléfono del conductor asignado vía RPC seguro
  useEffect(() => {
    const nombre = solicitud?.conductor_nombre?.trim();
    if (!nombre) {
      setConductorTelefono(null);
      return;
    }
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .rpc("get_conductor_publico_por_nombre", { _nombre: nombre });
      if (error) {
        console.warn("[pasajero] No se pudo cargar teléfono del conductor:", error.message);
      }
      const row = Array.isArray(data) ? data[0] : data;
      if (mounted) setConductorTelefono(row?.telefono ?? null);
    })();
    return () => { mounted = false; };
  }, [solicitud?.conductor_nombre]);

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
    if (pendienteCalif) {
      alert("Antes de pedir un nuevo viaje, califica el último servicio.");
      return;
    }
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

  const handleEnviarCalificacion = async (estrellas: number, resena: string) => {
    if (!user || !perfil || !pendienteCalif) return;
    setSavingCalif(true);
    const { error } = await supabase.from("calificaciones").insert({
      cliente: perfil.cliente,
      tipo: "conductor",
      nombre: pendienteCalif.conductor_nombre || "Conductor",
      conductor: pendienteCalif.conductor_nombre,
      vehiculo: pendienteCalif.vehiculo_placa,
      servicio: pendienteCalif.id,
      solicitud_id: pendienteCalif.id,
      pasajero_id: perfil.id,
      estrellas,
      resena: resena || null,
      mejoras: resena || null,
      created_by: user.id,
    });
    setSavingCalif(false);
    if (error) {
      alert("No se pudo guardar la calificación: " + error.message);
      return;
    }
    setPendienteCalif(null);
    fetch("/api/public/push/process", { method: "POST" }).catch(() => { /* ignore */ });
  };

  const handleEnviarIncidente = async ({ tipo, queSucedio, cuando }: { tipo: string; queSucedio: string; cuando: string }) => {
    if (!user || !perfil || !solicitud) return;
    setSavingIncidente(true);
    const { error } = await supabase.from("incidentes").insert({
      cliente: perfil.cliente,
      fecha: new Date().toISOString().slice(0, 10),
      tipo_incidente: tipo,
      conductor: solicitud.conductor_nombre,
      vehiculo: solicitud.vehiculo_placa,
      que_paso: queSucedio,
      cuando: cuando || null,
      estado: "Abierto",
      reportado_por: "pasajero",
      solicitud_id: solicitud.id,
      pasajero_id: perfil.id,
      created_by: user.id,
    });
    setSavingIncidente(false);
    if (error) {
      alert("No se pudo enviar el reporte: " + error.message);
      return;
    }
    setShowIncidente(false);
    fetch("/api/public/push/process", { method: "POST" }).catch(() => { /* ignore */ });
    alert("✅ Reporte enviado. El equipo TRAMMOS lo revisará de inmediato.");
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
            conductorTelefono={conductorTelefono}
            vehiculo={solicitud.vehiculo_placa}
            vehiculoFoto={vehiculoInfo?.foto_url ?? null}
            vehiculoMarca={vehiculoInfo?.marca ?? null}
            vehiculoLinea={vehiculoInfo?.linea ?? null}
            vehiculoColor={vehiculoInfo?.color ?? null}
            etaMinutos={etaMinutos}
            cancelando={cancelando}
            onCancel={handleCancel}
            onPanic={handlePanic}
            onReportarIncidente={() => setShowIncidente(true)}
          />
        ) : pendienteCalif ? (
          <CalificarServicio
            conductor={pendienteCalif.conductor_nombre}
            vehiculoPlaca={pendienteCalif.vehiculo_placa}
            origen={pendienteCalif.origen}
            destino={pendienteCalif.destino}
            saving={savingCalif}
            onSubmit={handleEnviarCalificacion}
          />
        ) : (
          <PedirServicioForm
            perfil={perfil}
            ultima={ultima}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        )}

        <div className="mt-6 space-y-3">
          {user && <PushNotificationsToggle userId={user.id} />}
          <InstallAppBanner />
        </div>
      </main>
      <AccessibilityPanel />
      <TramiAssistant />

      <ReportarIncidenteModal
        open={showIncidente}
        saving={savingIncidente}
        onClose={() => setShowIncidente(false)}
        onSubmit={handleEnviarIncidente}
      />
    </div>
  );
}
