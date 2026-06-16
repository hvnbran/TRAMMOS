import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { AdminOnly } from "../components/layout/AdminOnly";
import { AlertTriangle, CheckCircle, Info, Clock, Filter, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/alertas")({
  component: () => (
    <AdminOnly>
      <Alertas />
    </AdminOnly>
  ),
  head: () => ({
    meta: [
      { title: "Alertas - TRAMMOS" },
      { name: "description", content: "Sistema de alertas y notificaciones" },
    ],
  }),
});

interface Alerta {
  id: string;
  tipo: "warning" | "error" | "info" | "success";
  categoria: "Documento" | "Conductor" | "Vehículo" | "Operativa" | "Servicio";
  mensaje: string;
  detalle: string;
  fecha: string;
  critica: boolean;
  to: string;
}

function getAlertIcon(tipo: string) {
  switch (tipo) {
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-accent" />;
    case "error":
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case "success":
      return <CheckCircle className="h-4 w-4 text-success" />;
    default:
      return <Info className="h-4 w-4 text-primary" />;
  }
}

function getAlertBorder(tipo: string) {
  switch (tipo) {
    case "warning":
      return "border-l-accent";
    case "error":
      return "border-l-destructive";
    case "success":
      return "border-l-success";
    default:
      return "border-l-primary";
  }
}

function diasHasta(fechaISO: string | null): number | null {
  if (!fechaISO) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const f = new Date(fechaISO);
  f.setHours(0, 0, 0, 0);
  return Math.ceil((f.getTime() - hoy.getTime()) / 86_400_000);
}

function Alertas() {
  const { cliente } = useAuth();
  const [loading, setLoading] = useState(true);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [filtro, setFiltro] = useState<"Todas" | "Críticas" | "Warning" | "Error">("Todas");

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente]);

  async function load() {
    setLoading(true);
    try {
      const filterCliente = <T extends { eq: (col: string, v: string) => T }>(q: T) =>
        cliente ? q.eq("cliente", cliente) : q;

      const [{ data: conductores }, { data: vehiculos }, { data: incidentes }, { data: condDocs }, { data: vehDocs }] = await Promise.all([
        filterCliente(
          supabase.from("conductores").select("id,nombre,vence_licencia").not("vence_licencia", "is", null),
        ),
        filterCliente(supabase.from("vehiculos").select("id,placa,vence_soat,vence_rtm")),
        filterCliente(
          supabase
            .from("incidentes")
            .select("id,fecha,tipo_incidente,que_paso,conductor,vehiculo,estado,created_at")
            .eq("estado", "Abierto")
            .order("fecha", { ascending: false }),
        ),
        filterCliente(
          (supabase.from("conductor_documentos") as any)
            .select("id,tipo,requiere_actualizacion_at,conductor_id,conductores(nombre)")
            .eq("requiere_actualizacion", true),
        ),
        filterCliente(
          (supabase.from("vehiculo_documentos") as any)
            .select("id,tipo,requiere_actualizacion_at,vehiculo_id,vehiculos(placa)")
            .eq("requiere_actualizacion", true),
        ),
      ]);


      const list: Alerta[] = [];

      conductores?.forEach((c: { id: string; nombre: string; vence_licencia: string | null }) => {
        const dias = diasHasta(c.vence_licencia);
        if (dias === null || dias > 30) return;
        const vencida = dias < 0;
        list.push({
          id: `lic-${c.id}`,
          tipo: vencida ? "error" : "warning",
          categoria: "Conductor",
          mensaje: vencida
            ? `Licencia vencida - ${c.nombre}`
            : `Licencia de ${c.nombre} vence en ${dias} día${dias === 1 ? "" : "s"}`,
          detalle: `Fecha vencimiento: ${c.vence_licencia}`,
          fecha: c.vence_licencia ?? "",
          critica: vencida || dias <= 7,
          to: "/conductores",
        });
      });

      vehiculos?.forEach((v: { id: string; placa: string; vence_soat: string | null; vence_rtm: string | null }) => {
        const dSoat = diasHasta(v.vence_soat);
        if (dSoat !== null && dSoat <= 30) {
          const vencido = dSoat < 0;
          list.push({
            id: `soat-${v.id}`,
            tipo: vencido ? "error" : "warning",
            categoria: "Documento",
            mensaje: vencido
              ? `SOAT vehículo ${v.placa} vencido`
              : `SOAT ${v.placa} vence en ${dSoat} día${dSoat === 1 ? "" : "s"}`,
            detalle: `Fecha vencimiento: ${v.vence_soat}`,
            fecha: v.vence_soat ?? "",
            critica: vencido || dSoat <= 7,
            to: "/vehiculos",
          });
        }
        const dRtm = diasHasta(v.vence_rtm);
        if (dRtm !== null && dRtm <= 30) {
          const vencida = dRtm < 0;
          list.push({
            id: `rtm-${v.id}`,
            tipo: vencida ? "error" : "warning",
            categoria: "Vehículo",
            mensaje: vencida
              ? `RTM vehículo ${v.placa} vencida`
              : `RTM ${v.placa} vence en ${dRtm} día${dRtm === 1 ? "" : "s"}`,
            detalle: `Fecha vencimiento: ${v.vence_rtm}`,
            fecha: v.vence_rtm ?? "",
            critica: vencida || dRtm <= 7,
            to: "/vehiculos",
          });
        }
      });

      incidentes?.forEach(
        (i: {
          id: string;
          fecha: string;
          tipo_incidente: string;
          que_paso: string | null;
          conductor: string | null;
          vehiculo: string | null;
        }) => {
          list.push({
            id: `inc-${i.id}`,
            tipo: "error",
            categoria: "Operativa",
            mensaje: `Incidente abierto: ${i.tipo_incidente}`,
            detalle: [i.que_paso, i.conductor, i.vehiculo].filter(Boolean).join(" · ") || "Sin detalle",
            fecha: i.fecha,
            critica: true,
            to: "/feedback",
          });
        },
      );

      // Sort: críticas primero, luego por fecha desc
      list.sort((a, b) => {
        if (a.critica !== b.critica) return a.critica ? -1 : 1;
        return (b.fecha || "").localeCompare(a.fecha || "");
      });

      setAlertas(list);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    if (filtro === "Todas") return alertas;
    if (filtro === "Críticas") return alertas.filter((a) => a.critica);
    if (filtro === "Warning") return alertas.filter((a) => a.tipo === "warning");
    if (filtro === "Error") return alertas.filter((a) => a.tipo === "error");
    return alertas;
  }, [filtro, alertas]);

  const criticasCount = alertas.filter((a) => a.critica).length;

  return (
    <AppLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Alertas</h1>
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Cargando..."
              : criticasCount === 0
                ? alertas.length === 0
                  ? "Sin alertas activas"
                  : `${alertas.length} alerta${alertas.length === 1 ? "" : "s"} activa${alertas.length === 1 ? "" : "s"}`
                : `${criticasCount} crítica${criticasCount === 1 ? "" : "s"} de ${alertas.length} activas`}
          </p>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground mr-1" />
          {(["Todas", "Críticas", "Warning", "Error"] as const).map((e) => (
            <button
              key={e}
              onClick={() => setFiltro(e)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filtro === e ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-border bg-card py-16 flex flex-col items-center text-center">
            <CheckCircle className="h-10 w-10 text-success mb-3" />
            <p className="text-base font-semibold">
              {alertas.length === 0 ? "Todo en orden" : "Sin alertas en este filtro"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {alertas.length === 0
                ? "No hay licencias, SOAT, RTM próximos a vencer ni incidentes abiertos."
                : "Cambia el filtro para ver otras alertas."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((a) => (
              <Link
                key={a.id}
                to={a.to}
                className={`block rounded-lg border border-border border-l-4 ${getAlertBorder(a.tipo)} bg-card p-4 hover:bg-secondary/30 transition-colors`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getAlertIcon(a.tipo)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{a.mensaje}</span>
                      {a.critica && <span className="h-2 w-2 rounded-full bg-destructive shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.detalle}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="px-1.5 py-0.5 bg-secondary rounded">{a.categoria}</span>
                      {a.fecha && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {a.fecha}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
