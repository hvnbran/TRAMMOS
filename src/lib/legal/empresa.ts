/**
 * Datos del Responsable del Tratamiento (Ley 1581 / Decreto 1377 - Colombia).
 *
 * IMPORTANTE: cuando el cliente entregue la razón social, NIT, dirección y
 * correo oficial, REEMPLAZAR estos placeholders. Las políticas legales y
 * los footers consumen estos valores desde aquí, así que basta con cambiar
 * este archivo y subir la `CURRENT_POLICY_VERSION` en `version.ts`.
 */
export const EMPRESA = {
  nombreComercial: "TRAMMOS",
  razonSocial: "Trammos Transportes Especiales S.A.S.",
  nit: "901784897-1",
  direccion: "Medellín",
  ciudad: "Medellín",
  pais: "Colombia",
  correoPrivacidad: "Trammostransportesespeciales@gmail.com",
  correoSoporte: "Trammostransportesespeciales@gmail.com",
  sitioWeb: "https://trammos.online",
} as const;
