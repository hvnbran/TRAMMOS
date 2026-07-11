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

function genShortToken(len = 12) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

// ===== Crear invitación (admin) =====

const crearSchema = z.object({
  tipo: z.enum(["empresa", "pasajero"]),
  empresaId: z.string().uuid().optional(),
  email_sugerido: z.string().trim().email().max(255).optional().or(z.literal("")),
  display_name_sugerido: z.string().trim().max(255).optional(),
  expires_in_hours: z.number().int().min(1).max(24 * 30).default(168),
});

export const crearInvitacionRegistro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => crearSchema.parse(d))
  .handler(async ({ data, context }) => {
    // Roles del caller
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const roleSet = new Set((roles ?? []).map((r) => r.role as string));
    const isAdmin = roleSet.has("admin");
    // Un rol cliente (corona/sodimac/hospital_sur) puede crear invitaciones
    // de tipo "pasajero" únicamente para su propia empresa.
    const clienteRol = (["corona", "sodimac", "hospital_sur"] as const).find((r) => roleSet.has(r)) ?? null;

    if (!isAdmin) {
      if (!clienteRol) throw new Error("Solo administradores");
      if (data.tipo !== "pasajero") {
        throw new Error("Solo puedes generar invitaciones de pasajeros.");
      }
    }

    let empresaId: string | null = null;
    let clienteLegacy: string | null = null;

    // Si el caller no es admin, forzar empresaId a la empresa del cliente_legacy correspondiente.
    if (!isAdmin && clienteRol) {
      const { data: emp } = await supabaseAdmin
        .from("empresas")
        .select("id, cliente_legacy")
        .eq("cliente_legacy", clienteRol)
        .eq("activo", true)
        .maybeSingle();
      if (!emp) throw new Error("No se encontró tu empresa.");
      empresaId = emp.id;
      clienteLegacy = emp.cliente_legacy ?? null;
    } else if (data.empresaId) {
      const { data: empresa, error: eErr } = await supabaseAdmin
        .from("empresas")
        .select("id, nombre, cliente_legacy")
        .eq("id", data.empresaId)
        .maybeSingle();
      if (eErr) throw new Error(eErr.message);
      if (!empresa) throw new Error("La empresa indicada no existe.");
      empresaId = empresa.id;
      clienteLegacy = empresa.cliente_legacy ?? null;

      if (data.tipo === "pasajero" && !empresa.cliente_legacy) {
        throw new Error(
          "Esta empresa todavía no tiene cliente legacy configurado.",
        );
      }
    }
    // Sin empresa pre-asignada: permitido tanto para "empresa" como "pasajero".
    // En el caso pasajero, el propio usuario elige su empresa al registrarse.

    const token = genShortToken(12);
    const expiresAt = new Date(Date.now() + data.expires_in_hours * 3_600_000).toISOString();

    const { data: row, error } = await supabaseAdmin
      .from("registro_invitaciones")
      .insert({
        token,
        tipo: data.tipo,
        rol: (data.tipo === "empresa" ? clienteLegacy : null) as never,
        cliente: clienteLegacy as never,
        empresa_id: empresaId,
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

const validarSchema = z.object({ token: z.string().min(8).max(128) });

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
      rol: row.rol as "corona" | "sodimac" | "hospital_sur" | "admin" | null,
      cliente: row.cliente as "corona" | "sodimac" | "hospital_sur" | null,
      empresa_id: row.empresa_id as string | null,
      empresa_nombre: empresaNombre,
      email_sugerido: row.email_sugerido,
      display_name_sugerido: row.display_name_sugerido,
      expires_at: row.expires_at,
    };
  });

// ===== Consumir invitación (público, sin auth) =====

const consumirSchema = z.object({
  token: z.string().min(8).max(128),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  display_name: z.string().trim().max(255).optional(),
  empresa_nombre: z.string().trim().min(2).max(120).optional(),
  empresa_id_elegida: z.string().uuid().optional(),
  pasajero: z
    .object({
      nombre: z.string().trim().min(1).max(255),
      cedula: z.string().trim().max(50).optional(),
      telefono: z.string().trim().max(50).optional(),
      direccion_habitual: z.string().trim().max(255).optional(),
      es_pcd: z.boolean().default(false),
      tipo_discapacidad: z.string().max(50).default("ninguna"),
      nivel_asistencia: z.number().int().min(0).max(3).default(0),
      comunicacion_preferida: z.string().max(50).default("voz"),
      ayudas_tecnicas: z.array(z.string().max(50)).max(20).default([]),
      silla_ruedas_medidas: z.string().trim().max(120).optional(),
      condiciones_medicas: z.string().trim().max(1000).optional(),
      alergias: z.string().trim().max(500).optional(),
      medicamentos: z.string().trim().max(500).optional(),
      contacto_emergencia_nombre: z.string().trim().max(120).optional(),
      contacto_emergencia_telefono: z.string().trim().max(50).optional(),
      contacto_emergencia_relacion: z.string().trim().max(50).optional(),
      notas_conductor: z.string().trim().max(1000).optional(),
      permite_acompanante: z.boolean().default(true),
      requiere_vehiculo_adaptado: z.boolean().default(false),
      consentimiento_datos: z.boolean().default(true),
    })
    .optional(),
});

function slugify(s: string) {
  const base = s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || `empresa-${Date.now()}`;
}

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

    if (inv.tipo === "empresa" && !inv.empresa_id && !data.empresa_nombre) {
      await rollbackInvitacion();
      throw new Error("Debes indicar el nombre de la empresa.");
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
        let empresaId = inv.empresa_id as string | null;

        if (!empresaId && data.empresa_nombre) {
          const baseSlug = slugify(data.empresa_nombre);
          let slug = baseSlug;
          for (let attempt = 0; attempt < 5; attempt++) {
            const { data: empNew, error: empErr } = await supabaseAdmin
              .from("empresas")
              .insert({ nombre: data.empresa_nombre, slug, created_by: userId })
              .select("id")
              .single();
            if (!empErr && empNew) {
              empresaId = empNew.id;
              break;
            }
            if (empErr && empErr.code === "23505") {
              slug = `${baseSlug}-${Math.floor(Math.random() * 9999)}`;
              continue;
            }
            throw new Error(empErr?.message ?? "No se pudo crear la empresa");
          }
          if (!empresaId) throw new Error("No se pudo generar slug único para la empresa");
        }

        const rol = inv.rol;
        if (rol) {
          const { error: rErr } = await supabaseAdmin
            .from("user_roles")
            .insert({ user_id: userId, role: rol });
          if (rErr && rErr.code !== "23505") throw new Error(rErr.message);
        }

        if (empresaId) {
          await supabaseAdmin
            .from("user_empresas")
            .insert({ user_id: userId, empresa_id: empresaId, rol_empresa: "admin_empresa" })
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

        // Resolver empresa: la de la invitación o la elegida por el pasajero
        let empresaIdPas = inv.empresa_id as string | null;
        let cliente = inv.cliente as "corona" | "sodimac" | "hospital_sur" | null;

        if (!empresaIdPas && data.empresa_id_elegida) {
          const { data: empSel, error: empSelErr } = await supabaseAdmin
            .from("empresas")
            .select("id, cliente_legacy")
            .eq("id", data.empresa_id_elegida)
            .maybeSingle();
          if (empSelErr) throw new Error(empSelErr.message);
          if (!empSel) throw new Error("La empresa seleccionada no existe.");
          empresaIdPas = empSel.id;
          cliente = (empSel.cliente_legacy as "corona" | "sodimac" | "hospital_sur" | null) ?? cliente;
        }

        if (!empresaIdPas) throw new Error("Debes seleccionar tu empresa.");
        if (!cliente) {
          throw new Error("La empresa seleccionada aún no está habilitada para registrar pasajeros.");
        }

        const p = data.pasajero;
        const esPcd = p.es_pcd === true;

        const { error: pErr } = await supabaseAdmin
          .from("pasajeros_pcd")
          .insert([{
            nombre: p.nombre,
            cedula: p.cedula ?? null,
            telefono: p.telefono ?? null,
            email: data.email,
            cliente,
            empresa_id: empresaIdPas,
            direccion_habitual: p.direccion_habitual ?? null,
            tipo_discapacidad: esPcd ? p.tipo_discapacidad : "ninguna",
            nivel_asistencia: esPcd ? p.nivel_asistencia : 0,
            comunicacion_preferida: esPcd ? p.comunicacion_preferida : "voz",
            ayudas_tecnicas: esPcd ? p.ayudas_tecnicas : [],
            silla_ruedas_medidas: esPcd ? (p.silla_ruedas_medidas ?? null) : null,
            condiciones_medicas: esPcd ? (p.condiciones_medicas ?? null) : null,
            alergias: esPcd ? (p.alergias ?? null) : null,
            medicamentos: esPcd ? (p.medicamentos ?? null) : null,
            contacto_emergencia_nombre: p.contacto_emergencia_nombre ?? null,
            contacto_emergencia_telefono: p.contacto_emergencia_telefono ?? null,
            contacto_emergencia_relacion: p.contacto_emergencia_relacion ?? null,
            notas_conductor: p.notas_conductor ?? null,
            permite_acompanante: p.permite_acompanante,
            requiere_vehiculo_adaptado: esPcd ? p.requiere_vehiculo_adaptado : false,
            autorizado: true,
            auth_user_id: userId,
            consentimiento_datos: true,
          }]);
        if (pErr) throw new Error(pErr.message);

        const { error: rErr } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: userId, role: "pasajero" });
        if (rErr && rErr.code !== "23505") throw new Error(rErr.message);

        await supabaseAdmin
          .from("user_empresas")
          .insert({ user_id: userId, empresa_id: empresaIdPas, rol_empresa: "pasajero" })
          .then((r) => {
            if (r.error && r.error.code !== "23505") throw new Error(r.error.message);
          });

        await supabaseAdmin
          .from("profiles")
          .upsert(
            { user_id: userId, email: data.email, display_name: data.display_name ?? p.nombre },
            { onConflict: "user_id" },
          );
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

// ===== Listar empresas elegibles (público, para auto-registro pasajero) =====

export const listarEmpresasParaRegistro = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("empresas")
      .select("id, nombre, cliente_legacy")
      .eq("activo", true)
      .not("cliente_legacy", "is", null)
      .order("nombre", { ascending: true });
    if (error) throw new Error(error.message);
    return { empresas: (data ?? []) as Array<{ id: string; nombre: string; cliente_legacy: string | null }> };
  });
