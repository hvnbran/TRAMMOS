/**
 * Mapeo a pictogramas ARASAAC (CC-BY-NC-SA, Gobierno de Aragón).
 * Usamos la API pública de imágenes:
 *   https://api.arasaac.org/api/pictograms/{id}?download=false
 *
 * Cada ID corresponde a un pictograma oficial de la base ARASAAC.
 * Validados visualmente el 2026-04 — si alguno cambia, ajustar aquí.
 */
export const ARASAAC: Record<string, { id: number; alt: string }> = {
  // Tipos de discapacidad
  visual: { id: 6478, alt: "Persona ciega con bastón" },
  auditiva: { id: 6479, alt: "Persona sorda" },
  motriz: { id: 7297, alt: "Persona en silla de ruedas" },
  cognitiva: { id: 31480, alt: "Cabeza con engranajes" },
  multiple: { id: 33301, alt: "Discapacidad múltiple" },
  ninguna: { id: 2627, alt: "Persona" },

  // Ayudas técnicas
  silla_ruedas: { id: 7297, alt: "Silla de ruedas" },
  baston: { id: 11346, alt: "Bastón" },
  perro_guia: { id: 6481, alt: "Perro guía" },
  audifono: { id: 11342, alt: "Audífono" },
  interprete_lsc: { id: 6480, alt: "Intérprete de lengua de señas" },
  muletas: { id: 11345, alt: "Muletas" },
  andador: { id: 11344, alt: "Andador" },

  // Comunicación
  voz: { id: 2511, alt: "Hablar" },
  texto_grande: { id: 6585, alt: "Leer texto" },
  pictogramas: { id: 28442, alt: "Pictogramas" },
  lengua_senas: { id: 6480, alt: "Lengua de señas" },
  escrita_simple: { id: 5436, alt: "Escribir" },

  // Conceptos del servicio
  carro: { id: 2462, alt: "Carro" },
  bus: { id: 6952, alt: "Bus" },
  reloj: { id: 2872, alt: "Reloj" },
  ubicacion: { id: 7065, alt: "Ubicación" },
  casa: { id: 2349, alt: "Casa" },
  empresa: { id: 6486, alt: "Empresa" },
  documento: { id: 5436, alt: "Documento" },
  telefono: { id: 2723, alt: "Teléfono" },
  email: { id: 2693, alt: "Correo" },
  cedula: { id: 6595, alt: "Cédula" },
  medicamento: { id: 2596, alt: "Medicamento" },
  alerta: { id: 2541, alt: "Alerta" },
  emergencia: { id: 2542, alt: "Emergencia" },
};

export function arasaacUrl(id: number) {
  return `https://api.arasaac.org/api/pictograms/${id}?download=false`;
}
