import { useEffect, useRef, useState } from "react";
import { Bell, AlertTriangle, FileWarning, ShieldAlert, CheckCircle2, UserPlus, CalendarClock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

type Notif = {
  id: string;
  tipo: "licencia" | "soat" | "rtm" | "servicio_sin_conductor" | "servicio_programado";
  titulo: string;
  detalle: string;
  diasRestantes: number;
  to: string;
  urgente?: boolean;
};

function diasHasta(fechaISO: string | null): number | null {
  if (!fechaISO) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const f = new Date(fechaISO);
  f.setHours(0, 0, 0, 0);
  return Math.ceil((f.getTime() - hoy.getTime()) / 86_400_000);
}

export function NotificationsBell() {
  const { user, cliente } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!user) return;
    void load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, cliente]);

  async function load() {
    setLoading(true);
    try {
      let condQ = supabase
        .from("conductores")
        .select("id,nombre,vence_licencia,cliente")
        .not("vence_licencia", "is", null);
      let vehQ = supabase
        .from("vehiculos")
        .select("id,placa,vence_soat,vence_rtm,cliente");
      // Servicios desde hoy en adelante con estado Programado
      const hoyISO = new Date().toISOString().slice(0, 10);
      let servQ = supabase
        .from("servicios")
        .select("id,numero_orden,fecha,hora,origen,destino,conductor,cliente,estado")
        .eq("estado", "Programado")
        .gte("fecha", hoyISO);

      if (cliente) {
        condQ = condQ.eq("cliente", cliente);
        vehQ = vehQ.eq("cliente", cliente);
        servQ = servQ.eq("cliente", cliente);
      }

      const [{ data: conductores }, { data: vehiculos }, { data: servicios }] = await Promise.all([condQ, vehQ, servQ]);

      const list: Notif[] = [];

      conductores?.forEach((c) => {
        const dias = diasHasta(c.vence_licencia);
        if (dias !== null && dias <= 30) {
          list.push({
            id: `lic-${c.id}`,
            tipo: "licencia",
            titulo: `Licencia de ${c.nombre}`,
            detalle: dias < 0 ? `Vencida hace ${Math.abs(dias)} días` : dias === 0 ? "Vence hoy" : `Vence en ${dias} días`,
            diasRestantes: dias,
            to: "/conductores",
          });
        }
      });

      vehiculos?.forEach((v) => {
        const dSoat = diasHasta(v.vence_soat);
        if (dSoat !== null && dSoat <= 30) {
          list.push({
            id: `soat-${v.id}`,
            tipo: "soat",
            titulo: `SOAT vehículo ${v.placa}`,
            detalle: dSoat < 0 ? `Vencido hace ${Math.abs(dSoat)} días` : dSoat === 0 ? "Vence hoy" : `Vence en ${dSoat} días`,
            diasRestantes: dSoat,
            to: "/vehiculos",
          });
        }
        const dRtm = diasHasta(v.vence_rtm);
        if (dRtm !== null && dRtm <= 30) {
          list.push({
            id: `rtm-${v.id}`,
            tipo: "rtm",
            titulo: `Técnico mecánica ${v.placa}`,
            detalle: dRtm < 0 ? `Vencida hace ${Math.abs(dRtm)} días` : dRtm === 0 ? "Vence hoy" : `Vence en ${dRtm} días`,
            diasRestantes: dRtm,
            to: "/vehiculos",
          });
        }
      });

      servicios?.forEach((s) => {
        const dias = diasHasta(s.fecha);
        if (dias === null || dias > 7) return; // solo próximos 7 días
        const sinConductor = !s.conductor || s.conductor.trim() === "";
        const orden = s.numero_orden ? `OS ${s.numero_orden}` : `Servicio ${s.id.slice(0, 6)}`;
        const cuando = dias < 0
          ? `Atrasado ${Math.abs(dias)} d`
          : dias === 0
            ? `Hoy${s.hora ? ` ${s.hora}` : ""}`
            : dias === 1
              ? `Mañana${s.hora ? ` ${s.hora}` : ""}`
              : `En ${dias} días`;
        const ruta = [s.origen, s.destino].filter(Boolean).join(" → ");
        if (sinConductor) {
          list.push({
            id: `serv-sc-${s.id}`,
            tipo: "servicio_sin_conductor",
            titulo: `URGENTE: ${orden} sin conductor`,
            detalle: `${cuando}${ruta ? ` · ${ruta}` : ""} — Asignar conductor`,
            // Forzar prioridad alta: tratamos como vencido (-1) si es hoy/mañana, o usar dias reales
            diasRestantes: dias <= 1 ? -1 : dias,
            to: "/servicios",
            urgente: true,
          });
        } else {
          list.push({
            id: `serv-${s.id}`,
            tipo: "servicio_programado",
            titulo: `${orden} programado`,
            detalle: `${cuando}${ruta ? ` · ${ruta}` : ""} · ${s.conductor}`,
            diasRestantes: dias,
            to: "/servicios",
          });
        }
      });

      list.sort((a, b) => {
        // Urgentes (sin conductor) primero
        if (a.urgente && !b.urgente) return -1;
        if (!a.urgente && b.urgente) return 1;
        return a.diasRestantes - b.diasRestantes;
      });
      setNotifs(list);
    } finally {
      setLoading(false);
    }
  }

  const count = notifs.length;
  const urgentes = notifs.filter((n) => n.urgente).length;
  const criticas = notifs.filter((n) => n.diasRestantes < 0 || n.urgente).length;

  function iconFor(n: Notif) {
    if (n.tipo === "servicio_sin_conductor") return <UserPlus className="h-4 w-4 text-destructive" />;
    if (n.tipo === "servicio_programado") return <CalendarClock className="h-4 w-4 text-primary" />;
    if (n.diasRestantes < 0) return <ShieldAlert className="h-4 w-4 text-destructive" />;
    if (n.diasRestantes <= 7) return <AlertTriangle className="h-4 w-4 text-destructive" />;
    return <FileWarning className="h-4 w-4 text-warning" />;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative text-muted-foreground hover:text-foreground transition-colors"
        aria-label={`Notificaciones${urgentes > 0 ? ` — ${urgentes} urgentes` : ""}`}
      >
        <Bell className={`h-5 w-5 ${urgentes > 0 ? "animate-pulse" : ""}`} />
        {count > 0 && (
          <span
            className={`absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[10px] font-bold text-destructive-foreground ${
              criticas > 0 ? "bg-destructive" : "bg-warning"
            }`}
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-9 w-80 max-h-[420px] overflow-hidden rounded-lg border border-border bg-card shadow-lg z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <h4 className="text-sm font-semibold">Notificaciones</h4>
              <p className="text-[11px] text-muted-foreground">
                {count === 0
                  ? "Sin alertas"
                  : urgentes > 0
                    ? `${urgentes} urgente${urgentes > 1 ? "s" : ""} · ${count} en total`
                    : `${count} alerta${count > 1 ? "s" : ""}`}
              </p>
            </div>
            <button
              onClick={load}
              className="text-[11px] text-primary hover:underline"
              disabled={loading}
            >
              {loading ? "..." : "Actualizar"}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {count === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <CheckCircle2 className="h-8 w-8 text-success mb-2" />
                <p className="text-sm text-foreground">Todo en orden</p>
                <p className="text-xs text-muted-foreground mt-1">
                  No hay vencimientos ni servicios pendientes próximamente.
                </p>
              </div>
            ) : (
              notifs.map((n) => (
                <Link
                  key={n.id}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors ${
                    n.urgente ? "bg-destructive/5 border-l-2 border-l-destructive" : ""
                  }`}
                >
                  <div className="mt-0.5">{iconFor(n)}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${n.urgente ? "text-destructive" : ""}`}>
                      {n.titulo}
                    </p>
                    <p
                      className={`text-xs ${
                        n.urgente || n.diasRestantes < 0
                          ? "text-destructive"
                          : n.diasRestantes <= 7
                            ? "text-destructive/80"
                            : "text-muted-foreground"
                      }`}
                    >
                      {n.detalle}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>

          {count > 0 && (
            <Link
              to="/alertas"
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-primary hover:underline py-2 border-t border-border"
            >
              Ver todas las alertas
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
