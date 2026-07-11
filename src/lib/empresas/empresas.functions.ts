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

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Listar empresas activas (cualquier usuario autenticado). */
export const listarEmpresas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("empresas")
      .select("id, nombre, slug, cliente_legacy, activo, created_at")
      .eq("activo", true)
      .order("nombre", { ascending: true });
    if (error) throw new Error(error.message);
    return { empresas: data ?? [] };
  });

const crearSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
});

/** Crear una empresa nueva. */
export const crearEmpresa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => crearSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const nombre = data.nombre.trim();
    const slug = slugify(nombre);
    if (!slug) throw new Error("Nombre inválido");

    const { data: row, error } = await supabaseAdmin
      .from("empresas")
      .insert({ nombre, slug, activo: true, created_by: context.userId })
      .select("id, nombre, slug, cliente_legacy, activo, created_at")
      .single();
    if (error) {
      if (error.code === "23505") throw new Error("Ya existe una empresa con ese nombre.");
      throw new Error(error.message);
    }
    return { empresa: row };
  });
