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
  empresaId: z.string().uuid(),
  email_sugerido: z.string().trim().email().max(255).optional().or(z.literal("")),
  display_name_sugerido: z.string().trim().max(255).optional(),
  expires_in_hours: z.number().int().min(1).max(24 * 30).default(72),
});

export const crearInvitacionRegistro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => crearSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    // Validar empresa y obtener cliente legacy (necesario para inserción en pasajeros_pcd).
    const { data: empresa, error: eErr } = await supabaseAdmin
      .from("empresas")
      .select("id, nombre, cliente_legacy")
      .eq("id", data.empresaId)
      .maybeSingle();
    if (eErr) throw new Error(eErr.message);
    if (!empresa) throw new Error("La empresa indicada no existe.");

    if (data.tipo === "pasajero" && !empresa.cliente_legacy) {
      throw new Error(
        "Esta empresa todavía no tiene cliente legacy configurado. Por ahora los pasajeros solo pueden registrarse en empresas con cliente legacy (Corona/Sodimac).",
      );
    }

    const token = genToken(32);
    const expiresAt = new Date(Date.now() + data.expires_in_hours * 3_600_000).toISOString();

    const { data: row, error } = await supabaseAdmin
      .from("registro_invitaciones")
      .insert({
        token,
        tipo: data.tipo,
        // Mantener compatibilidad: si la empresa tiene cliente legacy, lo seteamos también.
        rol: data.tipo === "empresa" ? (empresa.cliente_legacy ?? null) : null,
        cliente: empresa.cliente_legacy ?? null,
        empresa_id: empresa.id,
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
      .select(
        "id, tipo, rol, cliente, empresa_id, email_sugerido, display_name_sugerido, used_at, expires_at",
      )
      .eq("token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return { ok: false as const, reason: "no_existe" as const };
    if (row.used_at) return { ok: false as const, reason: "ya_usado" as const };
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return { ok: false as const, reason: "expirado" as const };
    }

    let empresaNombre: string | null = null;
    if (row.empresa_id) {
      const { data: emp } = await supabaseAdmin
        .from("empresas")
        .select("nombre")
        .eq("id", row.empresa_id)
        .maybeSingle();
      empresaNombre = emp?.nombre ?? null;
    }

    return {
      ok: true as const,
      tipo: row.tipo as "empresa" | "pasajero",
      rol: row.rol as "corona" | "sodimac" | "admin" | null,
      cliente: row.cliente as "corona" | "sodimac" | null,
      empresa_id: row.empresa_id as string | null,
      empresa_nombre: empresaNombre,
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
    // 1. Marcar atómicamente la invitación como usada
    const { data: invRows, error: invErr } = await supabaseAdmin
      .from("registro_invitaciones")
      .update({ used_at: new Date().toISOString() })
      .eq("token", data.token)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .select("id, tipo, rol, cliente, empresa_id")
      .limit(1);
    if (invErr) throw new Error(invErr.message);
    if (!invRows || invRows.length === 0) {
      throw new Error("El enlace ya fue usado o expiró.");
    }
    const inv = invRows[0];

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
        // Rol legacy (corona/sodimac/admin) cuando aplique.
        const rol = inv.rol;
        if (rol) {
          const { error: rErr } = await supabaseAdmin
            .from("user_roles")
            .insert({ user_id: userId, role: rol });
          if (rErr && rErr.code !== "23505") throw new Error(rErr.message);
        }

        // Membresía empresa
        if (inv.empresa_id) {
          await supabaseAdmin
            .from("user_empresas")
            .insert({ user_id: userId, empresa_id: inv.empresa_id, rol_empresa: "admin_empresa" })
            .then((r) => {
              if (r.error && r.error.code !== "23505") throw new Error(r.error.message);
            });
        }

        await supabaseAdmin
          .from("profiles")
          .upsert(
            { user_id: userId, email: data.email, display_name: data.display_name ?? data.email },
            { onConflict: "user_id" },
          );
      } else {
        // pasajero
        if (!data.pasajero) throw new Error("Faltan datos del pasajero");
        const cliente = inv.cliente;
        if (!cliente) throw new Error("Esta invitación no tiene cliente válido.");

        const { error: pErr } = await supabaseAdmin
          .from("pasajeros_pcd")
          .insert([{
            nombre: data.pasajero.nombre,
            cedula: data.pasajero.cedula ?? null,
            telefono: data.pasajero.telefono ?? null,
            email: data.email,
            cliente,
            empresa_id: inv.empresa_id,
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
        if (rErr && rErr.code !== "23505") throw new Error(rErr.message);

        if (inv.empresa_id) {
          await supabaseAdmin
            .from("user_empresas")
            .insert({ user_id: userId, empresa_id: inv.empresa_id, rol_empresa: "pasajero" })
            .then((r) => {
              if (r.error && r.error.code !== "23505") throw new Error(r.error.message);
            });
        }
      }

      // 3. Marcar consumed_user_id
      await supabaseAdmin
        .from("registro_invitaciones")
        .update({ consumed_user_id: userId })
        .eq("id", inv.id);

      return { ok: true, userId, email: data.email };
    } catch (err) {
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
      .select(
        "id, token, tipo, rol, cliente, empresa_id, email_sugerido, used_at, expires_at, created_at, consumed_user_id",
      )
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
