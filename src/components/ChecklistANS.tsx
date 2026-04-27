import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, AlertTriangle, Loader2, ShieldCheck, ClipboardCheck } from "lucide-react";
import { TIPOS_VEHICULO } from "./DocumentManager";

interface DocRow {
  tipo: string;
  fecha_vencimiento: string | null;
  verificado: boolean;
  storage_path: string;
}

type EstadoItem = "ok" | "por_vencer" | "vencido" | "faltante" | "opcional_faltante";

interface ItemANS {
  tipo: string;
  label: string;
  obligatorio: boolean;
  estado: EstadoItem;
  detalle: string;
  diasRestantes: number | null;
}

interface Props {
  vehiculoId: string;
}

function diasHasta(fechaISO: string | null): number | null {
  if (!fechaISO) return null;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const f = new Date(fechaISO); f.setHours(0, 0, 0, 0);
  return Math.round((f.getTime() - hoy.getTime()) / 86_400_000);
}

function evaluar(tipo: { value: string; label: string; obligatorio: boolean }, doc?: DocRow): ItemANS {
  if (!doc) {
    return {
      tipo: tipo.value,
      label: tipo.label,
      obligatorio: tipo.obligatorio,
      estado: tipo.obligatorio ? "faltante" : "opcional_faltante",
      detalle: tipo.obligatorio ? "Sin cargar" : "No requerido",
      diasRestantes: null,
    };
  }
  const dias = diasHasta(doc.fecha_vencimiento);
  if (dias === null) {
    return {
      tipo: tipo.value,
      label: tipo.label,
      obligatorio: tipo.obligatorio,
      estado: "ok",
      detalle: "Cargado (sin fecha de vencimiento)",
      diasRestantes: null,
    };
  }
  if (dias < 0) {
    return {
      tipo: tipo.value,
      label: tipo.label,
      obligatorio: tipo.obligatorio,
      estado: "vencido",
      detalle: `Vencido hace ${Math.abs(dias)} día${Math.abs(dias) === 1 ? "" : "s"}`,
      diasRestantes: dias,
    };
  }
  if (dias <= 30) {
    return {
      tipo: tipo.value,
      label: tipo.label,
      obligatorio: tipo.obligatorio,
      estado: "por_vencer",
      detalle: `Vence en ${dias} día${dias === 1 ? "" : "s"}`,
      diasRestantes: dias,
    };
  }
  return {
    tipo: tipo.value,
    label: tipo.label,
    obligatorio: tipo.obligatorio,
    estado: "ok",
    detalle: `Vigente (${dias} días restantes)`,
    diasRestantes: dias,
  };
}

const estiloEstado: Record<EstadoItem, { icon: React.ReactNode; color: string; bg: string; texto: string }> = {
  ok: { icon: <CheckCircle2 className="h-4 w-4" />, color: "text-success", bg: "bg-success/10", texto: "Cumple" },
  por_vencer: { icon: <AlertTriangle className="h-4 w-4" />, color: "text-warning", bg: "bg-warning/10", texto: "Por vencer" },
  vencido: { icon: <XCircle className="h-4 w-4" />, color: "text-destructive", bg: "bg-destructive/10", texto: "Vencido" },
  faltante: { icon: <XCircle className="h-4 w-4" />, color: "text-destructive", bg: "bg-destructive/10", texto: "Faltante" },
  opcional_faltante: { icon: <AlertTriangle className="h-4 w-4" />, color: "text-muted-foreground", bg: "bg-muted/40", texto: "Opcional" },
};

export function ChecklistANS({ vehiculoId }: Props) {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("vehiculo_documentos")
      .select("tipo, fecha_vencimiento, verificado, storage_path")
      .eq("vehiculo_id", vehiculoId);
    setDocs((data ?? []) as DocRow[]);
    setLoading(false);
  }

  useEffect(() => {
    if (vehiculoId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehiculoId]);

  const items: ItemANS[] = TIPOS_VEHICULO.map((t) => {
    // Si hay varios del mismo tipo, tomar el de fecha más lejana
    const docsTipo = docs.filter((d) => d.tipo === t.value);
    const mejor = docsTipo.sort((a, b) => {
      const da = diasHasta(a.fecha_vencimiento) ?? Number.MAX_SAFE_INTEGER;
      const db = diasHasta(b.fecha_vencimiento) ?? Number.MAX_SAFE_INTEGER;
      return db - da;
    })[0];
    return evaluar({ value: t.value, label: t.label, obligatorio: t.obligatorio ?? false }, mejor);
  });

  const obligatorios = items.filter((i) => i.obligatorio);
  const cumpliendoObligatorios = obligatorios.filter((i) => i.estado === "ok" || i.estado === "por_vencer").length;
  const porcentaje = obligatorios.length === 0
    ? 100
    : Math.round((cumpliendoObligatorios / obligatorios.length) * 100);

  const vencidos = items.filter((i) => i.estado === "vencido").length;
  const porVencer = items.filter((i) => i.estado === "por_vencer").length;
  const faltantes = items.filter((i) => i.estado === "faltante").length;

  let nivelANS: { label: string; color: string; bg: string };
  if (vencidos > 0 || faltantes > 0) {
    nivelANS = { label: "No conforme", color: "text-destructive", bg: "bg-destructive/15" };
  } else if (porVencer > 0) {
    nivelANS = { label: "En riesgo", color: "text-warning", bg: "bg-warning/15" };
  } else {
    nivelANS = { label: "Conforme", color: "text-success", bg: "bg-success/15" };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
          <ClipboardCheck className="h-3.5 w-3.5" /> Checklist ANS — cumplimiento documental
        </p>
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${nivelANS.bg} ${nivelANS.color}`}>
          <ShieldCheck className="inline h-3 w-3 mr-1" />
          {nivelANS.label}
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">
            {cumpliendoObligatorios}/{obligatorios.length} requisitos obligatorios cumplidos
          </span>
          <span className={`font-bold ${porcentaje >= 90 ? "text-success" : porcentaje >= 70 ? "text-warning" : "text-destructive"}`}>
            {porcentaje}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full transition-all ${porcentaje >= 90 ? "bg-success" : porcentaje >= 70 ? "bg-warning" : "bg-destructive"}`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>

      {/* Resumen de banderas */}
      {(vencidos > 0 || porVencer > 0 || faltantes > 0) && (
        <div className="flex flex-wrap gap-1.5 text-[10px]">
          {faltantes > 0 && (
            <span className="px-2 py-0.5 rounded bg-destructive/10 text-destructive font-medium">
              {faltantes} faltante{faltantes === 1 ? "" : "s"}
            </span>
          )}
          {vencidos > 0 && (
            <span className="px-2 py-0.5 rounded bg-destructive/10 text-destructive font-medium">
              {vencidos} vencido{vencidos === 1 ? "" : "s"}
            </span>
          )}
          {porVencer > 0 && (
            <span className="px-2 py-0.5 rounded bg-warning/10 text-warning font-medium">
              {porVencer} por vencer (≤30 días)
            </span>
          )}
        </div>
      )}

      {/* Lista de items */}
      <ul className="space-y-1">
        {items.map((item) => {
          const e = estiloEstado[item.estado];
          return (
            <li
              key={item.tipo}
              className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded ${e.bg}`}
            >
              <span className={e.color}>{e.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {item.label}
                  {!item.obligatorio && (
                    <span className="ml-1 text-[10px] text-muted-foreground font-normal">(opcional)</span>
                  )}
                </p>
                <p className="text-[10px] text-muted-foreground">{item.detalle}</p>
              </div>
              <span className={`text-[10px] font-semibold ${e.color}`}>{e.texto}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
