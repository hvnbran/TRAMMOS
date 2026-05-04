/**
 * Versión actual de las políticas legales (Términos y Privacidad).
 * Subir este número fuerza a todos los usuarios a re-aceptar la próxima vez
 * que inicien sesión, gracias a `useEnforcePolicyAcceptance`.
 */
export const CURRENT_POLICY_VERSION = "2026-05-04";

export type PolicyType = "terminos" | "privacidad" | "datos_sensibles_pcd";

export type AcceptanceContext =
  | "login_operador"
  | "login_pasajero"
  | "registro_pcd"
  | "reaceptacion";
