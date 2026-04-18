import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Servicio = Tables<"servicios">;
export type Vehiculo = Tables<"vehiculos">;
export type Conductor = Tables<"conductores">;
export type Calificacion = Tables<"calificaciones">;
export type Incidente = Tables<"incidentes">;

export interface ReportesData {
  servicios: Servicio[];
  vehiculos: Vehiculo[];
  conductores: Conductor[];
  calificaciones: Calificacion[];
  incidentes: Incidente[];
}

/** Fetch all report data. RLS automatically filters by cliente. */
export async function fetchReportesData(opts?: {
  desde?: string;
  hasta?: string;
}): Promise<ReportesData> {
  const desde = opts?.desde;
  const hasta = opts?.hasta;

  let serviciosQ = supabase.from("servicios").select("*").order("fecha", { ascending: false });
  if (desde) serviciosQ = serviciosQ.gte("fecha", desde);
  if (hasta) serviciosQ = serviciosQ.lte("fecha", hasta);

  const [s, v, c, cal, inc] = await Promise.all([
    serviciosQ,
    supabase.from("vehiculos").select("*").order("placa"),
    supabase.from("conductores").select("*").order("nombre"),
    supabase.from("calificaciones").select("*").order("fecha", { ascending: false }),
    supabase.from("incidentes").select("*").order("fecha", { ascending: false }),
  ]);

  return {
    servicios: s.data ?? [],
    vehiculos: v.data ?? [],
    conductores: c.data ?? [],
    calificaciones: cal.data ?? [],
    incidentes: inc.data ?? [],
  };
}

/** Servicios fetched without date filter, used for trends/charts. */
export async function fetchServiciosAll(): Promise<Servicio[]> {
  const { data } = await supabase.from("servicios").select("*").order("fecha", { ascending: false });
  return data ?? [];
}
