import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PosicionSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(100000).nullable().optional(),
  speed_kmh: z.number().min(0).max(500).nullable().optional(),
  heading: z.number().min(0).max(360).nullable().optional(),
});

async function getConductorId(
  supabase: Awaited<ReturnType<typeof requireSupabaseAuth.client>>["context"]["supabase"],
  userId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("conductores")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No estás vinculado como conductor.");
  return data.id;
}

/** Conductor envía su posición actual. Se hace upsert (1 fila por conductor). */
export const upsertUbicacion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => PosicionSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const conductorId = await getConductorId(supabase, userId);

    const { error } = await supabase
      .from("conductor_ubicaciones")
      .upsert(
        {
          conductor_id: conductorId,
          lat: data.lat,
          lng: data.lng,
          accuracy: data.accuracy ?? null,
          speed_kmh: data.speed_kmh ?? null,
          heading: data.heading ?? null,
          online: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "conductor_id" },
      );

    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Conductor se desconecta (online=false). */
export const setOffline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const conductorId = await getConductorId(supabase, userId);

    const { error } = await supabase
      .from("conductor_ubicaciones")
      .update({ online: false, updated_at: new Date().toISOString() })
      .eq("conductor_id", conductorId);

    // No es error si no existía aún
    if (error && !error.message.includes("0 rows")) {
      throw new Error(error.message);
    }
    return { ok: true };
  });
