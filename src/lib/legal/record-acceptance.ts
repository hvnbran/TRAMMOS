import { useServerFn } from "@tanstack/react-start";
import { recordPolicyAcceptance } from "@/server/legal.functions";
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
 * Hook helper para registrar la aceptación de una o más políticas.
 * Devuelve una función estable que se puede llamar desde un evento.
 */
export function useRecordAcceptance() {
  const fn = useServerFn(recordPolicyAcceptance);

  return async function record(opts: RecordOptions) {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : null;
    const results = await Promise.allSettled(
      opts.types.map((t) =>
        fn({
          data: {
            policy_type: t,
            policy_version: CURRENT_POLICY_VERSION,
            pasajero_id: opts.pasajeroId ?? null,
            email: opts.email ?? null,
            contexto: opts.contexto,
            user_agent: ua,
          },
        }),
      ),
    );

    // Loguear sin bloquear el flujo de UX
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        // eslint-disable-next-line no-console
        console.warn(
          `[legal] No se pudo registrar aceptación de ${opts.types[i]}:`,
          r.reason,
        );
      }
    });
  };
}
