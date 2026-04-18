import * as XLSX from "xlsx";
import { fileName, formatDate, daysUntil, monthKey } from "./utils";
import type { ReportesData, Servicio, Vehiculo, Conductor } from "./data";

function downloadWorkbook(wb: XLSX.WorkBook, name: string) {
  XLSX.writeFile(wb, name);
}

function autoWidth(rows: Record<string, unknown>[]): { wch: number }[] {
  if (!rows.length) return [];
  const keys = Object.keys(rows[0]);
  return keys.map((k) => {
    const max = Math.max(
      k.length,
      ...rows.map((r) => String(r[k] ?? "").length)
    );
    return { wch: Math.min(Math.max(max + 2, 10), 40) };
  });
}

function sheetFromRows(rows: Record<string, unknown>[]): XLSX.WorkSheet {
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = autoWidth(rows);
  return ws;
}

// ---------- Individual reports ----------

export function buildServiciosRows(servicios: Servicio[]) {
  return servicios.map((s) => ({
    "N° Orden": s.numero_orden ?? "",
    Fecha: formatDate(s.fecha),
    Hora: s.hora ?? "",
    Origen: s.origen ?? "",
    Destino: s.destino ?? "",
    Pasajero: s.pasajero ?? "",
    Conductor: s.conductor ?? "",
    Vehículo: s.vehiculo ?? "",
    "Centro Costo": s.centro_costo ?? "",
    Cliente: s.cliente,
    Estado: s.estado,
  }));
}

export function downloadServiciosExcel(servicios: Servicio[], cliente: string | null) {
  const rows = buildServiciosRows(servicios);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheetFromRows(rows), "Servicios");
  downloadWorkbook(wb, fileName("servicios_periodo", cliente, "xlsx"));
}

export function buildUsoVehiculosRows(vehiculos: Vehiculo[], servicios: Servicio[]) {
  // Count services per vehicle in current month
  const ym = new Date().toISOString().slice(0, 7);
  const countByVeh = new Map<string, number>();
  for (const s of servicios) {
    if (!s.vehiculo) continue;
    if (monthKey(s.fecha) !== ym) continue;
    countByVeh.set(s.vehiculo, (countByVeh.get(s.vehiculo) ?? 0) + 1);
  }
  return vehiculos.map((v) => ({
    Placa: v.placa,
    Marca: v.marca ?? "",
    Línea: v.linea ?? "",
    Modelo: v.modelo ?? "",
    "N° Interno": v.num_interno ?? "",
    "Servicios mes actual": countByVeh.get(v.placa) ?? 0,
    Estado: v.estado,
    "Vence SOAT": formatDate(v.vence_soat),
    "Vence RTM": formatDate(v.vence_rtm),
    Cliente: v.cliente,
  }));
}

export function downloadUsoVehiculosExcel(
  vehiculos: Vehiculo[],
  servicios: Servicio[],
  cliente: string | null
) {
  const rows = buildUsoVehiculosRows(vehiculos, servicios);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheetFromRows(rows), "Uso vehículos");
  downloadWorkbook(wb, fileName("uso_vehiculos", cliente, "xlsx"));
}

export function buildRendimientoConductoresRows(conductores: Conductor[], servicios: Servicio[]) {
  const countByCond = new Map<string, number>();
  for (const s of servicios) {
    if (!s.conductor) continue;
    countByCond.set(s.conductor, (countByCond.get(s.conductor) ?? 0) + 1);
  }
  return conductores.map((c) => {
    const dl = daysUntil(c.vence_licencia);
    const estadoLic =
      dl === null ? "Sin fecha" : dl < 0 ? "Vencida" : dl <= 30 ? "Por vencer" : "Vigente";
    return {
      Nombre: c.nombre,
      Cédula: c.cedula ?? "",
      Teléfono: c.telefono ?? "",
      Licencia: c.licencia ?? "",
      Categoría: c.categoria_lic ?? "",
      "Vence licencia": formatDate(c.vence_licencia),
      "Estado licencia": estadoLic,
      "Servicios período": countByCond.get(c.nombre) ?? 0,
      "Cumplimiento (%)": c.cumplimiento ?? 100,
      Estado: c.estado,
      Cliente: c.cliente,
    };
  });
}

export function downloadRendimientoConductoresExcel(
  conductores: Conductor[],
  servicios: Servicio[],
  cliente: string | null
) {
  const rows = buildRendimientoConductoresRows(conductores, servicios);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheetFromRows(rows), "Conductores");
  downloadWorkbook(wb, fileName("rendimiento_conductores", cliente, "xlsx"));
}

export function buildFacturacionRows(servicios: Servicio[]) {
  const grupos = new Map<
    string,
    { servicios: number; conductores: Set<string>; vehiculos: Set<string>; cliente: string }
  >();
  for (const s of servicios) {
    const cc = s.centro_costo ?? "(Sin centro de costo)";
    const key = `${s.cliente}__${cc}`;
    if (!grupos.has(key)) {
      grupos.set(key, {
        servicios: 0,
        conductores: new Set(),
        vehiculos: new Set(),
        cliente: s.cliente,
      });
    }
    const g = grupos.get(key)!;
    g.servicios += 1;
    if (s.conductor) g.conductores.add(s.conductor);
    if (s.vehiculo) g.vehiculos.add(s.vehiculo);
  }
  return Array.from(grupos.entries()).map(([key, g]) => {
    const cc = key.split("__").slice(1).join("__");
    return {
      Cliente: g.cliente,
      "Centro de costo": cc,
      "Servicios": g.servicios,
      "Conductores únicos": g.conductores.size,
      "Vehículos únicos": g.vehiculos.size,
    };
  });
}

export function downloadFacturacionExcel(servicios: Servicio[], cliente: string | null) {
  const rows = buildFacturacionRows(servicios);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheetFromRows(rows), "Facturación");
  downloadWorkbook(wb, fileName("facturacion_centro_costo", cliente, "xlsx"));
}

export function buildDocumentosPorVencerRows(vehiculos: Vehiculo[], conductores: Conductor[]) {
  const out: Record<string, unknown>[] = [];
  const LIMITE = 60;
  for (const v of vehiculos) {
    const dSoat = daysUntil(v.vence_soat);
    if (dSoat !== null && dSoat <= LIMITE) {
      out.push({
        Tipo: "SOAT",
        Documento: "Vehículo",
        Identificación: v.placa,
        Nombre: `${v.marca ?? ""} ${v.linea ?? ""}`.trim(),
        "Fecha vencimiento": formatDate(v.vence_soat),
        "Días restantes": dSoat,
        Estado: dSoat < 0 ? "Vencido" : "Por vencer",
        Cliente: v.cliente,
      });
    }
    const dRtm = daysUntil(v.vence_rtm);
    if (dRtm !== null && dRtm <= LIMITE) {
      out.push({
        Tipo: "RTM",
        Documento: "Vehículo",
        Identificación: v.placa,
        Nombre: `${v.marca ?? ""} ${v.linea ?? ""}`.trim(),
        "Fecha vencimiento": formatDate(v.vence_rtm),
        "Días restantes": dRtm,
        Estado: dRtm < 0 ? "Vencido" : "Por vencer",
        Cliente: v.cliente,
      });
    }
  }
  for (const c of conductores) {
    const dL = daysUntil(c.vence_licencia);
    if (dL !== null && dL <= LIMITE) {
      out.push({
        Tipo: "Licencia",
        Documento: "Conductor",
        Identificación: c.cedula ?? "",
        Nombre: c.nombre,
        "Fecha vencimiento": formatDate(c.vence_licencia),
        "Días restantes": dL,
        Estado: dL < 0 ? "Vencida" : "Por vencer",
        Cliente: c.cliente,
      });
    }
  }
  out.sort((a, b) => Number(a["Días restantes"]) - Number(b["Días restantes"]));
  return out;
}

export function downloadDocumentosPorVencerExcel(
  vehiculos: Vehiculo[],
  conductores: Conductor[],
  cliente: string | null
) {
  const rows = buildDocumentosPorVencerRows(vehiculos, conductores);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheetFromRows(rows), "Documentos por vencer");
  downloadWorkbook(wb, fileName("documentos_por_vencer", cliente, "xlsx"));
}

// ---------- Consolidated workbook ----------

export function downloadConsolidadoExcel(data: ReportesData, cliente: string | null) {
  const wb = XLSX.utils.book_new();

  const meta = [
    { Campo: "Reporte", Valor: "Consolidado TRAMMOS" },
    { Campo: "Cliente", Valor: cliente ?? "Todos" },
    { Campo: "Generado", Valor: new Date().toLocaleString("es-CO") },
    { Campo: "Servicios", Valor: data.servicios.length },
    { Campo: "Vehículos", Valor: data.vehiculos.length },
    { Campo: "Conductores", Valor: data.conductores.length },
  ];
  XLSX.utils.book_append_sheet(wb, sheetFromRows(meta), "Resumen");
  XLSX.utils.book_append_sheet(wb, sheetFromRows(buildServiciosRows(data.servicios)), "Servicios");
  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(buildUsoVehiculosRows(data.vehiculos, data.servicios)),
    "Uso vehículos"
  );
  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(buildRendimientoConductoresRows(data.conductores, data.servicios)),
    "Conductores"
  );
  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(buildFacturacionRows(data.servicios)),
    "Facturación"
  );
  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(buildDocumentosPorVencerRows(data.vehiculos, data.conductores)),
    "Docs por vencer"
  );

  downloadWorkbook(wb, fileName("reporte_consolidado", cliente, "xlsx"));
}
