import type { PictogramaName } from "@/components/Pictograma";

export type TipoDisc = "ninguna" | "visual" | "auditiva" | "motriz" | "cognitiva" | "multiple";
export type Comunicacion = "voz" | "texto_grande" | "pictogramas" | "lengua_senas" | "escrita_simple";

export interface PasajeroPCD {
  id: string;
  cliente: "corona" | "sodimac";
  nombre: string;
  cedula: string | null;
  telefono: string | null;
  email: string | null;
  tipo_discapacidad: TipoDisc;
  ayudas_tecnicas: string[];
  silla_ruedas_medidas: string | null;
  comunicacion_preferida: Comunicacion;
  nivel_asistencia: number;
  contacto_emergencia_nombre: string | null;
  contacto_emergencia_telefono: string | null;
  contacto_emergencia_relacion: string | null;
  condiciones_medicas: string | null;
  alergias: string | null;
  medicamentos: string | null;
  notas_conductor: string | null;
  requiere_vehiculo_adaptado: boolean;
  permite_acompanante: boolean;
  consentimiento_datos: boolean;
  autorizado?: boolean;
  primer_login_at?: string | null;
  auth_user_id?: string | null;
  created_at: string;
  updated_at: string;
}

export const TIPOS_DISC: { value: TipoDisc; label: string; picto: PictogramaName }[] = [
  { value: "ninguna", label: "Sin discapacidad", picto: "ninguna" },
  { value: "visual", label: "Visual", picto: "visual" },
  { value: "auditiva", label: "Auditiva", picto: "auditiva" },
  { value: "motriz", label: "Motriz", picto: "motriz" },
  { value: "cognitiva", label: "Cognitiva", picto: "cognitiva" },
  { value: "multiple", label: "Múltiple", picto: "multiple" },
];

export const AYUDAS: { value: string; label: string; picto: PictogramaName }[] = [
  { value: "silla_ruedas", label: "Silla de ruedas", picto: "silla_ruedas" },
  { value: "baston", label: "Bastón", picto: "baston" },
  { value: "perro_guia", label: "Perro guía", picto: "perro_guia" },
  { value: "audifono", label: "Audífono", picto: "audifono" },
  { value: "interprete_lsc", label: "Intérprete LSC", picto: "interprete_lsc" },
  { value: "muletas", label: "Muletas", picto: "muletas" },
  { value: "andador", label: "Andador", picto: "andador" },
];

export const COMUNICACIONES: { value: Comunicacion; label: string; picto: PictogramaName }[] = [
  { value: "voz", label: "Hablar", picto: "voz" },
  { value: "texto_grande", label: "Leer texto grande", picto: "texto_grande" },
  { value: "pictogramas", label: "Pictogramas", picto: "pictogramas" },
  { value: "lengua_senas", label: "Lengua de señas", picto: "lengua_senas" },
  { value: "escrita_simple", label: "Escritura simple", picto: "escrita_simple" },
];

export const NIVELES_ASIST = [
  { value: 0, label: "Autónomo", color: "bg-success/15 text-success border-success/30" },
  { value: 1, label: "Asistencia leve", color: "bg-primary/15 text-primary border-primary/30" },
  { value: 2, label: "Asistencia media", color: "bg-warning/15 text-warning border-warning/30" },
  { value: 3, label: "Requiere acompañante", color: "bg-destructive/15 text-destructive border-destructive/30" },
];

/**
 * Genera un brief en lenguaje natural para que el conductor escuche o lea
 * antes de iniciar el servicio.
 */
export function generarBrief(p: PasajeroPCD): string {
  const partes: string[] = [];
  partes.push(`Pasajero: ${p.nombre}.`);
  const tipo = TIPOS_DISC.find((t) => t.value === p.tipo_discapacidad)?.label;
  if (p.tipo_discapacidad !== "ninguna" && tipo) {
    partes.push(`Discapacidad ${tipo.toLowerCase()}.`);
  }
  if (p.ayudas_tecnicas.length > 0) {
    const labels = p.ayudas_tecnicas
      .map((a) => AYUDAS.find((x) => x.value === a)?.label?.toLowerCase())
      .filter(Boolean);
    partes.push(`Usa: ${labels.join(", ")}.`);
  }
  if (p.silla_ruedas_medidas) {
    partes.push(`Silla ${p.silla_ruedas_medidas}.`);
  }
  const com = COMUNICACIONES.find((c) => c.value === p.comunicacion_preferida)?.label?.toLowerCase();
  if (com) partes.push(`Prefiere comunicarse: ${com}.`);
  const niv = NIVELES_ASIST.find((n) => n.value === p.nivel_asistencia);
  if (niv && p.nivel_asistencia > 0) partes.push(`Nivel de asistencia: ${niv.label.toLowerCase()}.`);
  if (p.requiere_vehiculo_adaptado) partes.push("Requiere vehículo adaptado.");
  if (p.alergias) partes.push(`Alergias: ${p.alergias}.`);
  if (p.notas_conductor) partes.push(p.notas_conductor);
  if (p.contacto_emergencia_telefono) {
    partes.push(`Emergencia: ${p.contacto_emergencia_nombre ?? "contacto"} ${p.contacto_emergencia_telefono}.`);
  }
  partes.push("Por favor, confirma con el pasajero antes de iniciar el viaje.");
  return partes.join(" ");
}
