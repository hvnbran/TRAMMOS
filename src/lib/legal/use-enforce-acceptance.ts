import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CURRENT_POLICY_VERSION } from "./version";

/**
 * Hook que verifica si el usuario actual ya aceptó la versión vigente de la
 * Política de Privacidad. Devuelve `needsReaccept = true` cuando hay sesión
 * activa pero la última aceptación es de una versión anterior (o no existe).
 *
 * `markAccepted()` se llama desde el modal tras aceptar, para ocultar la UI
 * inmediatamente sin esperar otro round-trip.
 */
export function useEnforcePolicyAcceptance(userId: string | null | undefined) {
  const [needsReaccept, setNeedsReaccept] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!userId) {
        setNeedsReaccept(false);
        setChecked(true);
        return;
      }
      const { data, error } = await supabase
        .from("policy_acceptances")
        .select("policy_version")
        .eq("user_id", userId)
        .eq("policy_type", "privacidad")
        .order("accepted_at", { ascending: false })
        .limit(1);

      if (cancelled) return;
      if (error) {
        // Si la consulta falla no bloqueamos al usuario.
        setNeedsReaccept(false);
      } else {
        const latest = data?.[0]?.policy_version ?? null;
        setNeedsReaccept(latest !== CURRENT_POLICY_VERSION);
      }
      setChecked(true);
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return {
    needsReaccept: checked && needsReaccept,
    markAccepted: () => setNeedsReaccept(false),
  };
}
