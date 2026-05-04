import { supabase } from "@/integrations/supabase/client";
import {
  CURRENT_POLICY_VERSION,
  type PolicyType,
  type AcceptanceContext,
} from "@/lib/legal/version";

export interface RecordOptions {
  types: PolicyType[];
  contexto: AcceptanceContext;
  pasajeroId?: string | null;
  email?: string | null;
}

/**
 * Clave en localStorage para recordar localmente que el usuario ya aceptó la
 * versión vigente. Esto evita que el modal de re-aceptación reaparezca aunque
 * el insert en DB falle por red intermitente o RLS.
 */
function localKey(userId: string) {
  return `trammos.policy_accepted.${userId}.${CURRENT_POLICY_VERSION}`;
}

export function markLocallyAccepted(userId: string) {
  try {
    localStorage.setItem(localKey(userId), new Date().toISOString());
  } catch {
    // ignore storage errors
  }
}

export function isLocallyAccepted(userId: string): boolean {
  try {
    return !!localStorage.getItem(localKey(userId));
  } catch {
    return false;
  }
}

/**
 * Hook helper para registrar la aceptación de una o más políticas.
 * Inserta directamente vía Supabase SDK (RLS: user_insert_own_acceptance).
 * Marca también localStorage como respaldo, para que la UX no insista.
 */
export function useRecordAcceptance() {
  return async function record(opts: RecordOptions) {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : null;

    // Obtener el usuario autenticado actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn("[legal] No hay sesión activa al intentar registrar aceptación.");
      return;
    }

    // Marcar localmente de inmediato — la UX no debe depender del round-trip
    markLocallyAccepted(user.id);

    // Insertar una fila por cada tipo de política
    const rows = opts.types.map((t) => ({
      user_id: user.id,
      pasajero_id: opts.pasajeroId ?? null,
      email: opts.email ?? user.email ?? null,
      policy_type: t,
      policy_version: CURRENT_POLICY_VERSION,
      user_agent: ua,
      metadata: { contexto: opts.contexto },
    }));

    const { error } = await supabase.from("policy_acceptances").insert(rows);
    if (error) {
      // No bloqueamos al usuario — ya quedó marcado localmente
      console.warn("[legal] No se pudo registrar aceptación en DB:", error.message);
    }
  };
}
