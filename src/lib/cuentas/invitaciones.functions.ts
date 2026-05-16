import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  if (!(data ?? []).some((r) => r.role === "admin")) {
    throw new Error("Solo administradores");
  }
}

function genToken(len = 48) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// ===== Crear invitación (admin) =====

const crearSchema = z.object({
  tipo: z.enum(["empresa", "pasajero"]),
  rol: z.enum(["corona", "sodimac", "admin"]).optional(),
  cliente: z.enum(["corona", "sodimac"]).optional(),
  email_sugerido: z.string().trim().email().max(255).optional().or(z.literal("")),
  display_name_sugerido: z.string().trim().max(255).optional(),
  expires_in_hours: z.number().int().min(1).max(24 * 30).default(72),
});

export const crearInvitacionRegistro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => crearSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    if (data.tipo === "empresa" && !data.rol) {
      throw new Error("Para empresa debes indicar el rol (corona, sodimac o admin)");
    }
    if (data.tipo === "pasajero" && !data.cliente) {
      throw new Error("Para pasajero debes indicar el cliente (corona o sodimac)");
    }

    const token = genToken(32);
    const expiresAt = new Date(Date.now() + data.expires_in_hours * 3_600_000).toISOString();

    const { data: row, error } = await supabaseAdmin
      .from("registro_invitaciones")
      .insert({
        token,
        tipo: data.tipo,
        rol: data.tipo === "empresa" ? data.rol : null,
        cliente: data.tipo === "pasajero" ? data.cliente : (data.rol === "corona" || data.rol === "sodimac" ? data.rol : null),
        email_sugerido: data.email_sugerido || null,
        display_name_sugerido: data.display_name_sugerido || null,
        created_by: context.userId,
        expires_at: expiresAt,
      })
      .select("id, token, expires_at")
      .single();
    if (error) throw new Error(error.message);

    return { id: row.id, token: row.token, expiresAt: row.expires_at };
  });

// ===== Validar invitación (público, sin auth) =====

const validarSchema = z.object({ token: z.string().min(10).max(128) });

export const validarInvitacionRegistro = createServerFn({ method: "POST" })
  .inputValidator((d) => validarSchema.parse(d))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("registro_invitaciones")
      .select("id, tipo, rol, cliente, email_sugerido, display_name_sugerido, used_at, expires_at")
      .eq("token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return { ok: false as const, reason: "no_existe" as const };
    if (row.used_at) return { ok: false as const, reason: "ya_usado" as const };
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return { ok: false as const, reason: "expirado" as const };
    }
    return {
      ok: true as const,
      tipo: row.tipo as "empresa" | "pasajero",
      rol: row.rol as "corona" | "sodimac" | "admin" | null,
      cliente: row.cliente as "corona" | "sodimac" | null,
      email_sugerido: row.email_sugerido,
      display_name_sugerido: row.display_name_sugerido,
      expires_at: row.expires_at,
    };
  });

// ===== Consumir invitación (público, sin auth) =====

const consumirSchema = z.object({
  token: z.string().min(10).max(128),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  display_name: z.string().trim().max(255).optional(),
  // Datos extra para pasajero
  pasajero: z
    .object({
      nombre: z.string().trim().min(1).max(255),
      cedula: z.string().trim().max(50).optional(),
      telefono: z.string().trim().max(50).optional(),
      tipo_discapacidad: z.string().max(50).default("ninguna"),
      nivel_asistencia: z.number().int().min(0).max(5).default(0),
    })
    .optional(),
});

export const consumirInvitacionRegistro = createServerFn({ method: "POST" })
  .inputValidator((d) => consumirSchema.parse(d))
  .handler(async ({ data }) => {
    // 1. Atomicamente marcar la invitación como usada (anti race condition / doble uso)
    const { data: invRows, error: invErr } = await supabaseAdmin
      .from("registro_invitaciones")
      .update({ used_at: new Date().toISOString() })
      .eq("token", data.token)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .select("id, tipo, rol, cliente")
      .limit(1);
    if (invErr) throw new Error(invErr.message);
    if (!invRows || invRows.length === 0) {
      throw new Error("El enlace ya fue usado o expiró.");
    }
    const inv = invRows[0];

    // Helper: revertir used_at si todo falla después
    async function rollbackInvitacion() {
      await supabaseAdmin
        .from("registro_invitaciones")
        .update({ used_at: null, consumed_user_id: null })
        .eq("id", inv.id);
    }

    // 2. Crear usuario auth
    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: data.display_name ? { display_name: data.display_name } : {},
    });
    if (cErr || !created.user) {
      await rollbackInvitacion();
      throw new Error(cErr?.message ?? "No se pudo crear el usuario");
    }
    const userId = created.user.id;

    try {
      if (inv.tipo === "empresa") {
        const rol = inv.rol ?? "corona";
        const { error: rErr } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: userId, role: rol });
        if (rErr) throw new Error(rErr.message);

        await supabaseAdmin
          .from("profiles")
          .upsert(
            { user_id: userId, email: data.email, display_name: data.display_name ?? data.email },
            { onConflict: "user_id" },
          );
      } else {
        // pasajero
        if (!data.pasajero) throw new Error("Faltan datos del pasajero");
        const cliente = inv.cliente ?? "corona";
        const { error: pErr } = await supabaseAdmin
          .from("pasajeros_pcd")
          .insert([{
            nombre: data.pasajero.nombre,
            cedula: data.pasajero.cedula ?? null,
            telefono: data.pasajero.telefono ?? null,
            email: data.email,
            cliente,
            tipo_discapacidad: data.pasajero.tipo_discapacidad,
            nivel_asistencia: data.pasajero.nivel_asistencia,
            autorizado: true,
            auth_user_id: userId,
            consentimiento_datos: true,
          }]);
        if (pErr) throw new Error(pErr.message);

        const { error: rErr } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: userId, role: "pasajero" });
        if (rErr) throw new Error(rErr.message);
      }

      // 3. Marcar consumed_user_id
      await supabaseAdmin
        .from("registro_invitaciones")
        .update({ consumed_user_id: userId })
        .eq("id", inv.id);

      return { ok: true, userId, email: data.email };
    } catch (err) {
      // Limpiar todo: borrar usuario, revertir invitación
      await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {});
      await rollbackInvitacion();
      throw err instanceof Error ? err : new Error("Error desconocido");
    }
  });

// ===== Listar invitaciones (admin) =====

export const listarInvitaciones = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("registro_invitaciones")
      .select("id, token, tipo, rol, cliente, email_sugerido, used_at, expires_at, created_at, consumed_user_id")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { invitaciones: data ?? [] };
  });

// ===== Revocar invitación (admin) =====

const revocarSchema = z.object({ id: z.string().uuid() });
export const revocarInvitacion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => revocarSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("registro_invitaciones")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
