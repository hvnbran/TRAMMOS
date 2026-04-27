import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import webpush from "web-push";

const VAPID_PUBLIC_KEY =
  "BPHM1WJuxn1upkUUEfbd56vqpJ-UnCisfB7E5EbMP8qus0ffFyhQI1HMS3ejYmekqtqcA-YLl8Tmnh8fExIcg_Q";

let configured = false;
function configureVapid() {
  if (configured) return;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:soporte@tramos.online";
  if (!privateKey) throw new Error("VAPID_PRIVATE_KEY no configurada");
  webpush.setVapidDetails(subject, VAPID_PUBLIC_KEY, privateKey);
  configured = true;
}

interface PushPayload {
  title: string;
  body: string;
  url?: string | null;
  tag?: string | null;
  data?: Record<string, unknown> | null;
}

interface QueueRow {
  id: string;
  user_id: string;
  title: string;
  body: string;
  url: string | null;
  tag: string | null;
  data: Record<string, unknown> | null;
  attempts: number;
}

interface SubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

async function processQueue(maxItems = 20) {
  configureVapid();

  // Tomar pendientes recientes (últimos 10 min) — evita reenviar viejos si la cola creció
  const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data: items, error } = await supabaseAdmin
    .from("push_notifications_queue")
    .select("id,user_id,title,body,url,tag,data,attempts")
    .eq("status", "pending")
    .gte("created_at", cutoff)
    .lt("attempts", 3)
    .order("created_at", { ascending: true })
    .limit(maxItems);

  if (error) throw new Error(`queue_select_failed: ${error.message}`);
  if (!items || items.length === 0) return { processed: 0, sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  for (const item of items as QueueRow[]) {
    // Marcar como "processing" optimísticamente para evitar dobles envíos concurrentes
    const { data: claim } = await supabaseAdmin
      .from("push_notifications_queue")
      .update({ status: "processing", attempts: item.attempts + 1 })
      .eq("id", item.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (!claim) continue;

    const { data: subs, error: subsErr } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth")
      .eq("user_id", item.user_id);

    if (subsErr || !subs || subs.length === 0) {
      await supabaseAdmin
        .from("push_notifications_queue")
        .update({ status: "no_subscription", sent_at: new Date().toISOString() })
        .eq("id", item.id);
      continue;
    }

    const payload: PushPayload = {
      title: item.title,
      body: item.body,
      url: item.url,
      tag: item.tag,
      data: item.data,
    };
    const payloadStr = JSON.stringify(payload);

    let anySent = false;
    const expiredEndpoints: string[] = [];
    let lastError: string | null = null;

    for (const sub of subs as SubscriptionRow[]) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payloadStr,
          { TTL: 600, urgency: "high" },
        );
        anySent = true;
      } catch (e: unknown) {
        const err = e as { statusCode?: number; message?: string };
        lastError = `${err.statusCode ?? "?"}: ${err.message ?? "unknown"}`;
        // 404/410 = suscripción expirada, eliminarla
        if (err.statusCode === 404 || err.statusCode === 410) {
          expiredEndpoints.push(sub.endpoint);
        }
      }
    }

    if (expiredEndpoints.length > 0) {
      await supabaseAdmin
        .from("push_subscriptions")
        .delete()
        .in("endpoint", expiredEndpoints);
    }

    await supabaseAdmin
      .from("push_notifications_queue")
      .update({
        status: anySent ? "sent" : "failed",
        sent_at: anySent ? new Date().toISOString() : null,
        last_error: anySent ? null : lastError,
      })
      .eq("id", item.id);

    if (anySent) sent++;
    else failed++;
  }

  return { processed: items.length, sent, failed };
}

export const Route = createFileRoute("/api/public/push/process")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const result = await processQueue();
          return Response.json({ ok: true, ...result });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "unknown";
          return Response.json({ ok: false, error: msg }, { status: 500 });
        }
      },
      GET: async () => {
        // Permitir trigger por GET para facilitar pruebas y cron simples
        try {
          const result = await processQueue();
          return Response.json({ ok: true, ...result });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "unknown";
          return Response.json({ ok: false, error: msg }, { status: 500 });
        }
      },
    },
  },
});
