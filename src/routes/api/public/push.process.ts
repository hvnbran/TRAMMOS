import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import webpush from "web-push";
import { sendFcmToTokens } from "@/lib/push/fcm.server";

const VAPID_PUBLIC_KEY =
  "BPHM1WJuxn1upkUUEfbd56vqpJ-UnCisfB7E5EbMP8qus0ffFyhQI1HMS3ejYmekqtqcA-YLl8Tmnh8fExIcg_Q";

let configured = false;
let webPushReady = false;

/**
 * Configura Web Push. Nunca lanza: si falta o está mal la credencial VAPID,
 * seguimos adelante para que los avisos nativos (APK Android) sí se envíen.
 */
function configureVapid() {
  if (configured) return webPushReady;
  configured = true;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!privateKey) return false;
  const raw = process.env.VAPID_SUBJECT?.trim() || "";
  const valid = /^(mailto:|https?:\/\/)/i.test(raw);
  const subject = valid ? raw : "mailto:soporte@trammos.online";
  try {
    webpush.setVapidDetails(subject, VAPID_PUBLIC_KEY, privateKey);
    webPushReady = true;
  } catch {
    webPushReady = false;
  }
  return webPushReady;
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

    const { data: subs } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth")
      .eq("user_id", item.user_id);

    const { data: nativeTokens } = await supabaseAdmin
      .from("conductor_push_tokens")
      .select("token")
      .eq("user_id", item.user_id);

    const tokens = (nativeTokens ?? []).map((t: { token: string }) => t.token);

    if ((!subs || subs.length === 0) && tokens.length === 0) {
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

    for (const sub of (subs ?? []) as SubscriptionRow[]) {
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

    // App instalada (APK Android) — notificación nativa vía FCM
    let fcmStatus: string | null = null;
    if (tokens.length > 0) {
      try {
        const fcm = await sendFcmToTokens(tokens, {
          title: item.title,
          body: item.body,
          url: item.url,
          data: item.data,
        });
        if (!fcm.configured) {
          fcmStatus = "no_configurado";
        } else {
          fcmStatus = fcm.sent > 0 ? `enviado:${fcm.sent}` : "fallido";
          if (fcm.sent > 0) anySent = true;
          if (fcm.lastError) lastError = fcm.lastError;
          if (fcm.invalidTokens.length > 0) {
            await supabaseAdmin
              .from("conductor_push_tokens")
              .delete()
              .in("token", fcm.invalidTokens);
          }
        }
      } catch (e) {
        fcmStatus = "error";
        lastError = e instanceof Error ? e.message : "fcm_error";
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
        fcm_status: fcmStatus,
        fcm_sent_at: fcmStatus?.startsWith("enviado") ? new Date().toISOString() : null,
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
      POST: async ({ request }) => {
        // Auth: pg_cron / scheduler must include the project apikey header.
        const apikey = request.headers.get("apikey") || request.headers.get("x-api-key");
        const expected =
          process.env.SUPABASE_ANON_KEY ||
          process.env.SUPABASE_PUBLISHABLE_KEY ||
          process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        if (!expected || apikey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
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
