import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { PageContext } from "@/lib/trami-client";

const ROUTE_LABELS: Record<string, string> = {
  "/": "Inicio",
  "/pasajero": "Panel del pasajero",
  "/operacion": "Operación",
  "/servicios": "Servicios",
  "/conductor": "Panel del conductor",
  "/conductor/login": "Login conductor",
  "/login": "Inicio de sesión",
  "/pasajeros-pcd": "Pasajeros PcD",
  "/feedback": "Feedback",
  "/alertas": "Alertas",
};

/**
 * Detecta contexto que TRAMI necesita: ruta, rol y nombre del usuario.
 */
export function useTramiContext(): PageContext {
  const location = useLocation();
  const [rol, setRol] = useState<string | undefined>();
  const [nombre, setNombre] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user || cancelled) return;
      setNombre(
        (user.user_metadata?.display_name as string | undefined) ??
          user.email?.split("@")[0],
      );
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (cancelled) return;
      const r = roles?.[0]?.role;
      if (r) setRol(r);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const ruta = location.pathname;
  return {
    ruta,
    seccion: ROUTE_LABELS[ruta] ?? ruta,
    rol,
    nombre,
    hora_local: new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" }),
  };
}
