/**
 * Envío de notificaciones a la app instalada (Android) vía FCM HTTP v1.
 * La credencial es la cuenta de servicio de Firebase, guardada como secreto
 * FIREBASE_SERVICE_ACCOUNT (el JSON completo que descarga Firebase).
 */

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

function b64url(bytes: Uint8Array | string): string {
  const str =
    typeof bytes === "string"
      ? bytes
      : Array.from(bytes, (b) => String.fromCharCode(b)).join("");
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToPkcs8(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const raw = atob(body);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer;
}

function readServiceAccount(): ServiceAccount | null {
  const raw = process.env["FIREBASE_SERVICE_ACCOUNT"];
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ServiceAccount;
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null;
    return { ...parsed, private_key: parsed.private_key.replace(/\\n/g, "\n") };
  } catch {
    return null;
  }
}

let cachedToken: { value: string; exp: number } | null = null;

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.value;

  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claims}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  const jwt = `${unsigned}.${b64url(new Uint8Array(sig))}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`fcm_oauth_failed [${res.status}]: ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, exp: now + json.expires_in };
  return json.access_token;
}

export interface FcmMessage {
  title: string;
  body: string;
  url?: string | null;
  data?: Record<string, unknown> | null;
}

export interface FcmResult {
  configured: boolean;
  sent: number;
  invalidTokens: string[];
  lastError: string | null;
}

export async function sendFcmToTokens(tokens: string[], msg: FcmMessage): Promise<FcmResult> {
  const sa = readServiceAccount();
  if (!sa) return { configured: false, sent: 0, invalidTokens: [], lastError: null };
  if (tokens.length === 0) return { configured: true, sent: 0, invalidTokens: [], lastError: null };

  const accessToken = await getAccessToken(sa);
  const endpoint = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;

  let sent = 0;
  const invalidTokens: string[] = [];
  let lastError: string | null = null;

  const payloadData: Record<string, string> = { url: msg.url ?? "/conductor" };
  if (msg.data) {
    for (const [k, v] of Object.entries(msg.data)) payloadData[k] = String(v);
  }

  for (const token of tokens) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title: msg.title, body: msg.body },
            data: payloadData,
            android: {
              priority: "HIGH",
              notification: {
                sound: "default",
                default_vibrate_timings: true,
              },
            },
          },
        }),
      });
      if (res.ok) {
        sent++;
        continue;
      }
      const text = await res.text();
      lastError = `fcm [${res.status}]: ${text}`;
      if (res.status === 404 || (res.status === 400 && text.includes("INVALID_ARGUMENT"))) {
        invalidTokens.push(token);
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : "fcm_unknown_error";
    }
  }

  return { configured: true, sent, invalidTokens, lastError };
}
