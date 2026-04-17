import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type SeedUser = {
  email: string;
  password: string;
  display_name: string;
  role: "admin" | "corona" | "sodimac";
};

const USERS: SeedUser[] = [
  { email: "corona@trammos.app", password: "CoronaAdmin123", display_name: "Corona", role: "corona" },
  { email: "sodimac@trammos.app", password: "SodimacAdmin123", display_name: "Sodimac", role: "sodimac" },
  { email: "admin@trammos.app", password: "AdministrativosTrammos123", display_name: "Admin", role: "admin" },
];

export const Route = createFileRoute("/api/seed")({
  server: {
    handlers: {
      POST: async () => {
        const results: Array<{ email: string; status: string; userId?: string }> = [];

        for (const u of USERS) {
          // Check if exists
          const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
          const found = existing?.users.find((x) => x.email === u.email);

          let userId: string;
          if (found) {
            userId = found.id;
            results.push({ email: u.email, status: "exists", userId });
          } else {
            const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
              email: u.email,
              password: u.password,
              email_confirm: true,
              user_metadata: { display_name: u.display_name },
            });
            if (error || !created.user) {
              results.push({ email: u.email, status: `error: ${error?.message ?? "unknown"}` });
              continue;
            }
            userId = created.user.id;
            results.push({ email: u.email, status: "created", userId });
          }

          // Upsert role
          await supabaseAdmin.from("user_roles").upsert(
            { user_id: userId, role: u.role },
            { onConflict: "user_id,role" },
          );
        }

        return new Response(JSON.stringify({ ok: true, results }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
      GET: async () => {
        return new Response(
          JSON.stringify({
            hint: "POST to this endpoint to seed the 3 TRAMMOS users",
            users: USERS.map((u) => ({ email: u.email, role: u.role })),
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
