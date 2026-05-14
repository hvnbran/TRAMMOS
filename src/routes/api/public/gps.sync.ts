import { createFileRoute } from "@tanstack/react-router";
import { runGpswoxSync } from "@/lib/gps/gpswox.functions";

/**
 * Endpoint público invocado por pg_cron cada 30 s.
 * Auth: header `apikey` con la SUPABASE_ANON_KEY del proyecto.
 */
export const Route = createFileRoute("/api/public/gps/sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey") || request.headers.get("x-api-key");
        const expected =
          process.env.SUPABASE_ANON_KEY ||
          process.env.SUPABASE_PUBLISHABLE_KEY ||
          process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        if (!expected || apikey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        try {
          const result = await runGpswoxSync();
          return new Response(JSON.stringify({ ok: true, ...result }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "error";
          return new Response(JSON.stringify({ ok: false, error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
      GET: async () =>
        new Response("Use POST con header apikey", { status: 405 }),
    },
  },
});
