import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * POST /api/public/conductor-login
 * Body: { cedula: string, password: string }
 *
 * 1. Valida cédula + password con verify_conductor_password (pgcrypto bcrypt).
 * 2. Si OK: garantiza un auth.user con email sintético `conductor-<cedula>@trammos.local`.
 * 3. Genera un magiclink token_hash que el cliente usará con verifyOtp.
 *
 * El cliente luego llama link_conductor_to_auth(cedula) para vincular y asignar rol.
 */
export const Route = createFileRoute("/api/public/conductor-login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { cedula?: string; password?: string };
          const cedula = (body.cedula ?? "").trim();
          const password = (body.password ?? "").trim();

          if (!cedula || !password) {
            return Response.json({ error: "missing_fields" }, { status: 400 });
          }

          // 1. Verificar credenciales
          const { data: verify, error: verifyErr } = await supabaseAdmin.rpc(
            "verify_conductor_password",
            { _cedula: cedula, _password: password },
          );
          if (verifyErr) {
            return Response.json(
              { error: "verify_failed", detail: verifyErr.message },
              { status: 500 },
            );
          }
          const v = verify as { ok?: boolean; error?: string; nombre?: string } | null;
          if (!v?.ok) {
            return Response.json({ error: v?.error ?? "credenciales" }, { status: 401 });
          }

          // 2. Email sintético
          const cedulaSafe = cedula.replace(/[^a-zA-Z0-9]/g, "");
          const email = `conductor-${cedulaSafe}@trammos.local`;

          // Buscar/crear auth user
          const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
          let userId = existing?.users.find((u) => u.email?.toLowerCase() === email)?.id;

          if (!userId) {
            const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
              email,
              email_confirm: true,
              user_metadata: { display_name: v.nombre ?? `Conductor ${cedula}`, conductor_cedula: cedula },
            });
            if (createErr || !created.user) {
              return Response.json(
                { error: "create_user_failed", detail: createErr?.message },
                { status: 500 },
              );
            }
            userId = created.user.id;
          }

          // 3. Generar magiclink token_hash
          const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email,
          });
          if (linkErr || !linkData) {
            return Response.json(
              { error: "link_generation_failed", detail: linkErr?.message },
              { status: 500 },
            );
          }
          const tokenHash = linkData.properties?.hashed_token ?? null;
          if (!tokenHash) {
            return Response.json({ error: "no_token_hash" }, { status: 500 });
          }

          return Response.json({ ok: true, email, token_hash: tokenHash, cedula, nombre: v.nombre });
        } catch (e) {
          return Response.json(
            { error: "unexpected", detail: e instanceof Error ? e.message : String(e) },
            { status: 500 },
          );
        }
      },
    },
  },
});
