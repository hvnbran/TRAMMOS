import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function getRoles(userId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.role as string);
}

async function assertAdmin(userId: string) {
  const roles = await getRoles(userId);
  if (!roles.includes("admin")) throw new Error("Solo administradores");
}

/** Verifica si el usuario actual tiene acceso al portal CRM (admin o crm). */
export const verifyCrmAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await getRoles(context.userId);
    const isAdmin = roles.includes("admin");
    const isCrm = roles.includes("crm");
    return { ok: isAdmin || isCrm, isAdmin, isCrm };
  });

/** Lista usuarios con rol 'crm' (solo admin). */
export const listCrmUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data: roles, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .eq("role", "crm");
    if (error) throw new Error(error.message);

    const userIds = (roles ?? []).map((r) => r.user_id);
    if (userIds.length === 0) return { users: [] as Array<{ user_id: string; email: string | null; display_name: string | null }> };

    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email, display_name")
      .in("user_id", userIds);
    if (pErr) throw new Error(pErr.message);

    const map = new Map((profiles ?? []).map((p) => [p.user_id, p]));
    return {
      users: userIds.map((id) => ({
        user_id: id,
        email: map.get(id)?.email ?? null,
        display_name: map.get(id)?.display_name ?? null,
      })),
    };
  });

const inviteSchema = z.object({
  email: z.string().trim().email().max(255),
  displayName: z.string().trim().max(255).optional(),
});

/**
 * Invita o asigna rol 'crm' a un usuario.
 * Si el email ya existe → solo añade el rol.
 * Si no existe → envía invitación y asigna el rol al user_id creado.
 */
export const grantCrmAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => inviteSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const email = data.email.toLowerCase();

    // ¿Ya existe ese email en profiles?
    const { data: existing, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .ilike("email", email)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);

    let userId: string;
    let invited = false;

    if (existing?.user_id) {
      userId = existing.user_id;
    } else {
      // Invitar (crea auth user pendiente y envía email)
      const { data: invite, error: iErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: data.displayName ? { display_name: data.displayName } : undefined,
      });
      if (iErr) throw new Error(iErr.message);
      if (!invite?.user) throw new Error("No se pudo crear la invitación");
      userId = invite.user.id;
      invited = true;
    }

    // Asignar rol 'crm' (ignorar duplicado)
    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "crm" as never }, { onConflict: "user_id,role" });
    if (rErr) throw new Error(rErr.message);

    return { ok: true, invited, userId };
  });

const revokeSchema = z.object({ userId: z.string().uuid() });

/** Revoca el rol 'crm' de un usuario (solo admin). No borra la cuenta. */
export const revokeCrmAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => revokeSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", "crm" as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
