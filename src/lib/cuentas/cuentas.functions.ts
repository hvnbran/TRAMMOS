import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Lanza si el usuario que llama no es admin. */
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

const empresaSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  rol: z.enum(["corona", "sodimac", "admin"]),
  displayName: z.string().trim().min(1).max(255),
});

/** Crea una cuenta de empresa/admin para monitoreo. */
export const crearCuentaEmpresa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => empresaSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { display_name: data.displayName },
    });
    if (error || !created.user) throw new Error(error?.message ?? "No se pudo crear el usuario");

    const userId = created.user.id;

    // Insertar rol (única (user_id, role) en user_roles).
    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: data.rol });
    if (rErr) throw new Error(`Usuario creado pero falló asignar rol: ${rErr.message}`);

    // Profile
    await supabaseAdmin
      .from("profiles")
      .upsert({ user_id: userId, email: data.email, display_name: data.displayName }, { onConflict: "user_id" });

    return { ok: true, userId, email: data.email, password: data.password };
  });

const pasajeroSchema = z.object({
  pasajeroId: z.string().uuid().nullable().optional(),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  // Si pasajeroId es null, creamos el registro nuevo:
  nuevo: z
    .object({
      nombre: z.string().trim().min(1).max(255),
      cedula: z.string().trim().max(50).nullable().optional(),
      telefono: z.string().trim().max(50).nullable().optional(),
      cliente: z.enum(["corona", "sodimac", "admin"]),
      tipo_discapacidad: z.string().max(50).default("ninguna"),
      nivel_asistencia: z.number().int().min(0).max(5).default(0),
    })
    .optional(),
});

/** Crea la cuenta de pasajero (auth + perfil + rol). Password-based, sin OTP. */
export const crearCuentaPasajero = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => pasajeroSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    // 1. Crear usuario auth
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error || !created.user) throw new Error(error?.message ?? "No se pudo crear el usuario");
    const userId = created.user.id;

    // 2. Crear o vincular pasajeros_pcd
    let pasajeroId = data.pasajeroId ?? null;
    if (!pasajeroId) {
      if (!data.nuevo) throw new Error("Faltan datos del pasajero");
      const { data: pNew, error: pErr } = await supabaseAdmin
        .from("pasajeros_pcd")
        .insert([{
          nombre: data.nuevo.nombre,
          cedula: data.nuevo.cedula ?? null,
          telefono: data.nuevo.telefono ?? null,
          email: data.email,
          cliente: data.nuevo.cliente,
          tipo_discapacidad: data.nuevo.tipo_discapacidad,
          nivel_asistencia: data.nuevo.nivel_asistencia,
          autorizado: true,
          auth_user_id: userId,
        })
        .select("id")
        .single();
      if (pErr) throw new Error(`Cuenta creada pero falló registrar pasajero: ${pErr.message}`);
      pasajeroId = pNew.id;
    } else {
      const { error: uErr } = await supabaseAdmin
        .from("pasajeros_pcd")
        .update({ auth_user_id: userId, email: data.email, autorizado: true })
        .eq("id", pasajeroId);
      if (uErr) throw new Error(`Cuenta creada pero falló vincular pasajero: ${uErr.message}`);
    }

    // 3. Rol pasajero
    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "pasajero" });
    if (rErr) throw new Error(`Pasajero creado pero falló asignar rol: ${rErr.message}`);

    return { ok: true, userId, pasajeroId, email: data.email, password: data.password };
  });

const resetSchema = z.object({
  userId: z.string().uuid(),
  newPassword: z.string().min(8).max(128),
});

/** Restablece la contraseña de cualquier cuenta. */
export const resetPasswordCuenta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => resetSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.newPassword,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Listar cuentas de empresa (corona, sodimac, admin). */
export const listarCuentasEmpresa = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data: roles, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role, created_at")
      .in("role", ["admin", "corona", "sodimac"])
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const userIds = Array.from(new Set((roles ?? []).map((r) => r.user_id)));
    if (userIds.length === 0) return { cuentas: [] };

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email, display_name")
      .in("user_id", userIds);
    const profMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    return {
      cuentas: (roles ?? []).map((r) => ({
        userId: r.user_id,
        role: r.role,
        email: profMap.get(r.user_id)?.email ?? null,
        displayName: profMap.get(r.user_id)?.display_name ?? null,
        createdAt: r.created_at,
      })),
    };
  });

/** Eliminar cuenta de empresa (auth + roles). */
const delSchema = z.object({ userId: z.string().uuid() });
export const eliminarCuentaEmpresa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => delSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.userId === context.userId) throw new Error("No puedes eliminar tu propia cuenta");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
