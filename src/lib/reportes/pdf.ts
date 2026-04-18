import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { fileName, formatDate, daysUntil } from "./utils";
import type { ReportesData } from "./data";

// TRAMMOS brand colors
const CYAN: [number, number, number] = [0, 175, 200];
const LIME: [number, number, number] = [170, 200, 30];
const DARK: [number, number, number] = [60, 60, 65];

function header(doc: jsPDF, title: string, cliente: string | null, desde?: string, hasta?: string) {
  doc.setFillColor(...CYAN);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("TRAMMOS", 10, 12);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(title, doc.internal.pageSize.getWidth() - 10, 12, { align: "right" });

  doc.setFillColor(...LIME);
  doc.rect(0, 18, doc.internal.pageSize.getWidth(), 1.2, "F");

  doc.setTextColor(...DARK);
  doc.setFontSize(9);
  const meta = [
    `Cliente: ${cliente ?? "Todos"}`,
    desde && hasta ? `Período: ${formatDate(desde)} - ${formatDate(hasta)}` : "",
    `Generado: ${new Date().toLocaleString("es-CO")}`,
  ]
    .filter(Boolean)
    .join("    |    ");
  doc.text(meta, 10, 26);
}

export function downloadCumplimientoANSPdf(
  data: ReportesData,
  cliente: string | null,
  desde?: string,
  hasta?: string
) {
  const doc = new jsPDF();
  header(doc, "Cumplimiento ANS Detallado", cliente, desde, hasta);

  // ---- Calculations ----
  const serv = data.servicios;
  const totalServ = serv.length;
  const finalizados = serv.filter((s) => s.estado === "Finalizado").length;
  const pctOper = totalServ === 0 ? 0 : (finalizados / totalServ) * 100;

  const vehDocOk = data.vehiculos.filter((v) => {
    const ds = daysUntil(v.vence_soat);
    const dr = daysUntil(v.vence_rtm);
    return (ds === null || ds >= 0) && (dr === null || dr >= 0);
  }).length;
  const pctVeh = data.vehiculos.length === 0 ? 100 : (vehDocOk / data.vehiculos.length) * 100;

  const condOk = data.conductores.filter((c) => {
    const d = daysUntil(c.vence_licencia);
    return d === null || d >= 0;
  }).length;
  const pctCond = data.conductores.length === 0 ? 100 : (condOk / data.conductores.length) * 100;

  const conCC = serv.filter((s) => s.centro_costo).length;
  const pctFact = totalServ === 0 ? 0 : (conCC / totalServ) * 100;

  const calProm =
    data.calificaciones.length === 0
      ? 0
      : (data.calificaciones.reduce((a, c) => a + c.estrellas, 0) / data.calificaciones.length) * 20;

  const categorias = [
    ["Operativas", `${finalizados} / ${totalServ}`, `${pctOper.toFixed(1)}%`],
    ["Vehículo (docs vigentes)", `${vehDocOk} / ${data.vehiculos.length}`, `${pctVeh.toFixed(1)}%`],
    ["Conductor (lic. vigentes)", `${condOk} / ${data.conductores.length}`, `${pctCond.toFixed(1)}%`],
    ["Facturación (con CC)", `${conCC} / ${totalServ}`, `${pctFact.toFixed(1)}%`],
    ["Atención (calificaciones)", `${data.calificaciones.length}`, `${calProm.toFixed(1)}%`],
  ];

  const promedio =
    (pctOper + pctVeh + pctCond + pctFact + (data.calificaciones.length ? calProm : 100)) / 5;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(`Cumplimiento global: ${promedio.toFixed(1)}%`, 10, 36);

  autoTable(doc, {
    startY: 42,
    head: [["Categoría", "Cumplidos / Total", "Cumplimiento"]],
    body: categorias,
    headStyles: { fillColor: CYAN, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 250, 252] },
    styles: { fontSize: 10, cellPadding: 3 },
  });

  // Incidentes activos
  const incActivos = data.incidentes.filter((i) => i.estado !== "Cerrado");
  if (incActivos.length > 0) {
    autoTable(doc, {
      startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8,
      head: [["Fecha", "Tipo", "Conductor", "Vehículo", "Estado"]],
      body: incActivos
        .slice(0, 15)
        .map((i) => [
          formatDate(i.fecha),
          i.tipo_incidente,
          i.conductor ?? "",
          i.vehiculo ?? "",
          i.estado,
        ]),
      headStyles: { fillColor: LIME, textColor: 40, fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 2.5 },
      didDrawPage: () => {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...DARK);
      },
    });
  }

  doc.save(fileName("cumplimiento_ans", cliente, "pdf"));
}
