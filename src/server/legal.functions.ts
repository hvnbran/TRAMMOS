import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  policy_type: z.enum(["terminos", "privacidad", "datos_sensibles_pcd"]),
  policy_version: z.string().min(1).max(40),
  pasajero_id: z.string().uuid().optional().nullable(),
  email: z.string().email().optional().nullable(),
  contexto: z
    .enum(["login_operador", "login_pasajero", "registro_pcd", "reaceptacion"])
    .default("login_operador"),
  user_agent: z.string().max(500).optional().nullable(),
});

/**
 * Server function que registra de forma auditable la aceptación de una
 * política legal. La IP se lee de los headers del request (no del cliente)
 * para que sea confiable. Si el usuario ya aceptó la versión vigente para
 * ese tipo, no se inserta una nueva fila.
 */
export const recordPolicyAcceptance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Evitar duplicados de la misma versión por el mismo usuario y tipo
    const { data: existing } = await supabase
      .from("policy_acceptances")
      .select("id")
      .eq("user_id", userId)
      .eq("policy_type", data.policy_type)
      .eq("policy_version", data.policy_version)
      .limit(1);

    if (existing && existing.length > 0) {
      return { ok: true, skipped: true };
    }

    const fwd = getRequestHeader("x-forwarded-for") || "";
    const cf = getRequestHeader("cf-connecting-ip") || "";
    const ip = (cf || fwd.split(",")[0] || "").trim() || null;

    const { error } = await supabase.from("policy_acceptances").insert({
      user_id: userId,
      pasajero_id: data.pasajero_id ?? null,
      email: data.email ?? null,
      policy_type: data.policy_type,
      policy_version: data.policy_version,
      ip,
      user_agent: data.user_agent ?? getRequestHeader("user-agent") ?? null,
      metadata: { contexto: data.contexto },
    });

    if (error) {
      console.error("recordPolicyAcceptance error:", error.message);
      return { ok: false, error: error.message };
    }

    return { ok: true, skipped: false };
  });
