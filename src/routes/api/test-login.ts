import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Test-only credentials. Allows entering the passenger flow without
// real OTP delivery. Keep in sync with the seeded pasajero row.
const TEST_PAIRS: Record<string, string> = {
  "trammos@admin.com": "123456",
};

export const Route = createFileRoute("/api/test-login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { email?: string; code?: string };
          const email = (body.email ?? "").trim().toLowerCase();
          const code = (body.code ?? "").trim();

          if (!email || !code) {
            return Response.json({ error: "missing_fields" }, { status: 400 });
          }
          if (TEST_PAIRS[email] !== code) {
            return Response.json({ error: "invalid_test_credentials" }, { status: 401 });
          }

          // Ensure the auth user exists (create if missing, with email auto-confirmed).
          const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
          let userId = existing?.users.find((u) => u.email?.toLowerCase() === email)?.id;

          if (!userId) {
            const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
              email,
              email_confirm: true,
              user_metadata: { display_name: "Pasajero Testing" },
            });
            if (createErr || !created.user) {
              return Response.json(
                { error: "create_user_failed", detail: createErr?.message },
                { status: 500 },
              );
            }
            userId = created.user.id;
          }

          // Generate a magic link and extract the verifiable token hash so the
          // client can complete the sign-in via verifyOtp({ type: 'magiclink' }).
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

          return Response.json({
            ok: true,
            email,
            token_hash: tokenHash,
          });
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
