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

/** Lee una empresa por id (devuelve { id, cliente_legacy } o null). */
async function getEmpresa(empresaId: string) {
  const { data, error } = await supabaseAdmin
    .from("empresas")
    .select("id, nombre, cliente_legacy")
    .eq("id", empresaId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

const empresaSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  empresaId: z.string().uuid(),
  displayName: z.string().trim().min(1).max(255),
});

/** Crea una cuenta de empresa para monitoreo. Rol fijo = "empresa" (ligada vía user_empresas). */
export const crearCuentaEmpresa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => empresaSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const empresa = await getEmpresa(data.empresaId);
    if (!empresa) throw new Error("La empresa indicada no existe.");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { display_name: data.displayName },
    });
    if (error || !created.user) throw new Error(error?.message ?? "No se pudo crear el usuario");

    const userId = created.user.id;

    try {
      // Si la empresa tiene cliente legacy (corona/sodimac), preservar el rol legacy
      // para que las pantallas existentes sigan funcionando hasta la fase 2.
      if (empresa.cliente_legacy) {
        const { error: rErr } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: userId, role: empresa.cliente_legacy });
        if (rErr && rErr.code !== "23505") throw new Error(rErr.message);
      }

      // Membresía en la nueva tabla puente (fuente de verdad de la fase 2).
      const { error: meErr } = await supabaseAdmin
        .from("user_empresas")
        .insert({ user_id: userId, empresa_id: empresa.id, rol_empresa: "admin_empresa" });
      if (meErr && meErr.code !== "23505") throw new Error(meErr.message);

      await supabaseAdmin
        .from("profiles")
        .upsert(
          { user_id: userId, email: data.email, display_name: data.displayName },
          { onConflict: "user_id" },
        );

      return { ok: true, userId, email: data.email, password: data.password };
    } catch (err) {
      await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {});
      throw err instanceof Error ? err : new Error("Error desconocido");
    }
  });

const pasajeroSchema = z.object({
  pasajeroId: z.string().uuid().nullable().optional(),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  empresaId: z.string().uuid(),
  nuevo: z
    .object({
      nombre: z.string().trim().min(1).max(255),
      cedula: z.string().trim().max(50).nullable().optional(),
      telefono: z.string().trim().max(50).nullable().optional(),
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

    const empresa = await getEmpresa(data.empresaId);
    if (!empresa) throw new Error("La empresa indicada no existe.");
    // El cliente legacy es necesario para no romper RLS de pasajeros_pcd (columna NOT NULL).
    if (!empresa.cliente_legacy) {
      throw new Error(
        "Esta empresa todavía no tiene cliente legacy configurado. Por ahora los pasajeros solo se pueden crear en empresas con cliente legacy (Corona/Sodimac).",
      );
    }

    // 1. Crear usuario auth
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error || !created.user) throw new Error(error?.message ?? "No se pudo crear el usuario");
    const userId = created.user.id;

    try {
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
            cliente: empresa.cliente_legacy,
            empresa_id: empresa.id,
            tipo_discapacidad: data.nuevo.tipo_discapacidad,
            nivel_asistencia: data.nuevo.nivel_asistencia,
            autorizado: true,
            auth_user_id: userId,
            consentimiento_datos: true,
          }])
          .select("id")
          .single();
        if (pErr) throw new Error(pErr.message);
        pasajeroId = pNew.id;
      } else {
        const { error: uErr } = await supabaseAdmin
          .from("pasajeros_pcd")
          .update({
            auth_user_id: userId,
            email: data.email,
            autorizado: true,
            empresa_id: empresa.id,
          })
          .eq("id", pasajeroId);
        if (uErr) throw new Error(uErr.message);
      }

      // 3. Rol pasajero
      const { error: rErr } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: "pasajero" });
      if (rErr && rErr.code !== "23505") throw new Error(rErr.message);

      // 4. Membresía empresa (para fase 2)
      await supabaseAdmin
        .from("user_empresas")
        .insert({ user_id: userId, empresa_id: empresa.id, rol_empresa: "pasajero" })
        .then((r) => {
          if (r.error && r.error.code !== "23505") throw new Error(r.error.message);
        });

      return { ok: true, userId, pasajeroId, email: data.email, password: data.password };
    } catch (err) {
      await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {});
      throw err instanceof Error ? err : new Error("Error desconocido");
    }
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
