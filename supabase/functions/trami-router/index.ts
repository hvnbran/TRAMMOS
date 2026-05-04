// TRAMI Router — Asistente conversacional accesible para TRAMMOS
// Modos:
//   - intent   -> clasifica intención (legacy)
//   - simplify -> Lectura Fácil
//   - answer   -> respuesta libre con contexto
//   - chat     -> conversación con memoria + tool calling sobre datos del usuario

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";
const FALLBACK_MODEL = "google/gemini-2.5-flash-lite";

type Mode = "intent" | "simplify" | "answer" | "chat";

interface Body {
  mode: Mode;
  text?: string;
  context?: string;
  conversationId?: string;
  pageContext?: Record<string, unknown>;
}

const INTENT_TOOL = {
  type: "function",
  function: {
    name: "classify_intent",
    description: "Clasifica la intención del usuario en TRAMMOS (transporte accesible).",
    parameters: {
      type: "object",
      properties: {
        intent: {
          type: "string",
          enum: [
            "consultar_eta", "ver_servicios", "registrar_pasajero",
            "reportar_problema", "boton_panico", "ayuda_general", "saludo", "otro",
          ],
        },
        respuesta_corta: { type: "string" },
        accion_sugerida: { type: "string" },
      },
      required: ["intent", "respuesta_corta"],
      additionalProperties: false,
    },
  },
};

// Herramientas de lectura segura para el modo chat
const CHAT_TOOLS = [
  {
    type: "function",
    function: {
      name: "consultar_mi_viaje_activo",
      description:
        "Consulta el viaje activo del pasajero autenticado (estado, conductor asignado, vehículo, hora). " +
        "Úsala cuando el usuario pregunte por su carro, ETA, conductor o estado de su solicitud.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "consultar_mis_servicios_recientes",
      description:
        "Lista los últimos viajes del pasajero (máx. 5). Úsala si pregunta por su historial.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
];

async function callAI(body: Record<string, unknown>, model = MODEL) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY no configurada");

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, ...body }),
  });

  if (res.status === 429) return { error: "rate_limited", message: "Demasiadas solicitudes. Intenta en un momento.", status: 429 };
  if (res.status === 402) return { error: "payment_required", message: "Se agotaron los créditos de IA.", status: 402 };
  if (!res.ok) {
    const t = await res.text();
    console.error("AI gateway error:", res.status, t);
    return { error: "ai_error", message: "Error en el asistente de IA.", status: 500 };
  }
  return { ok: true as const, data: await res.json() };
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---------- Tool implementations ----------
async function execTool(
  name: string,
  userId: string,
  authHeader: string,
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  if (name === "consultar_mi_viaje_activo") {
    const { data, error } = await supabase
      .from("solicitudes_pasajero")
      .select("id,estado,origen,destino,hora_recogida,conductor_nombre,vehiculo_placa,aceptada_at,iniciado_at")
      .eq("created_by_pasajero", userId)
      .in("estado", ["solicitada", "aceptada", "en_camino", "a_bordo"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data ?? { sin_viaje_activo: true } };
  }

  if (name === "consultar_mis_servicios_recientes") {
    const { data, error } = await supabase
      .from("solicitudes_pasajero")
      .select("id,estado,origen,destino,hora_recogida,conductor_nombre,created_at")
      .eq("created_by_pasajero", userId)
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data ?? [] };
  }

  return { ok: false, error: "tool_no_existe" };
}

// ---------- chat mode ----------
async function handleChat(body: Body, authHeader: string) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    return jsonResponse({
      reply: "Para recordar nuestra conversación necesito que inicies sesión. Aun así puedo responderte una pregunta puntual: vuelve a escribirme.",
      conversationId: null,
      tools_used: [],
    });
  }

  // Conversación: usar la última o crear nueva
  let conversationId = body.conversationId;
  if (!conversationId) {
    const { data: existing } = await supabase
      .from("trami_conversations")
      .select("id")
      .eq("user_id", user.id)
      .order("last_message_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) conversationId = existing.id;
    else {
      const { data: created, error } = await supabase
        .from("trami_conversations")
        .insert({ user_id: user.id, title: (body.text ?? "Conversación").slice(0, 60) })
        .select("id")
        .single();
      if (error) return jsonResponse({ error: "conv_error", message: error.message }, 500);
      conversationId = created.id;
    }
  }

  // Cargar historial (últimos 20 mensajes)
  const { data: history } = await supabase
    .from("trami_messages")
    .select("role,content,tool_name,tool_payload")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(20);

  const pageCtx = body.pageContext ?? {};
  const systemPrompt =
    "Eres TRAMI, asistente accesible de TRAMMOS (transporte empresarial colombiano). " +
    "Hablas español de Colombia, frases cortas (máx 2-3 oraciones), lenguaje simple y cálido. " +
    "Si el usuario pregunta por su viaje, conductor, ETA o historial, USA las herramientas disponibles antes de responder. " +
    "Nunca inventes datos. Si una herramienta dice 'sin_viaje_activo', dilo con claridad y ofrece pedir uno. " +
    `Contexto actual del usuario: ${JSON.stringify(pageCtx)}.`;

  const messages: Array<Record<string, unknown>> = [{ role: "system", content: systemPrompt }];
  for (const m of history ?? []) {
    if (m.role === "tool") {
      messages.push({
        role: "tool",
        name: m.tool_name ?? "tool",
        content: typeof m.tool_payload === "string" ? m.tool_payload : JSON.stringify(m.tool_payload ?? {}),
      });
    } else {
      messages.push({ role: m.role, content: m.content });
    }
  }
  if (body.text) messages.push({ role: "user", content: body.text });

  // Guardar mensaje del usuario
  if (body.text) {
    await supabase.from("trami_messages").insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: "user",
      content: body.text,
      context_snapshot: pageCtx,
    });
  }

  const tools_used: string[] = [];

  // Loop de tool calling (máx 3 iteraciones)
  for (let i = 0; i < 3; i++) {
    let result = await callAI({ messages, tools: CHAT_TOOLS, tool_choice: "auto" });
    if ("error" in result && result.status === 429) {
      result = await callAI({ messages, tools: CHAT_TOOLS, tool_choice: "auto" }, FALLBACK_MODEL);
    }
    if ("error" in result) {
      return jsonResponse(result, result.status);
    }
    const choice = result.data.choices?.[0]?.message;
    const toolCalls = choice?.tool_calls;

    if (!toolCalls || toolCalls.length === 0) {
      const reply = (choice?.content ?? "").trim() || "Aquí estoy para ayudarte.";
      // Guardar respuesta del asistente
      await supabase.from("trami_messages").insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: "assistant",
        content: reply,
      });
      await supabase
        .from("trami_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);
      return jsonResponse({ reply, conversationId, tools_used });
    }

    // Ejecutar tools
    messages.push({ role: "assistant", content: choice.content ?? "", tool_calls: toolCalls });
    for (const tc of toolCalls) {
      const fname = tc.function?.name;
      tools_used.push(fname);
      const exec = await execTool(fname, user.id, authHeader);
      const payload = exec.ok ? exec.data : { error: exec.error };
      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        name: fname,
        content: JSON.stringify(payload),
      });
      await supabase.from("trami_messages").insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: "tool",
        content: "",
        tool_name: fname,
        tool_payload: payload,
      });
    }
  }

  return jsonResponse({
    reply: "Estoy procesando demasiadas cosas a la vez. Intenta de nuevo en un momento.",
    conversationId,
    tools_used,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    if (!body?.mode) return jsonResponse({ error: "mode requerido" }, 400);

    if (body.mode === "chat") {
      const authHeader = req.headers.get("Authorization") ?? "";
      return await handleChat(body, authHeader);
    }

    if (!body.text || typeof body.text !== "string") {
      return jsonResponse({ error: "text requerido" }, 400);
    }
    if (body.text.length > 4000) return jsonResponse({ error: "text demasiado largo (máx 4000)" }, 400);

    if (body.mode === "simplify") {
      const result = await callAI({
        messages: [
          { role: "system", content: "Eres experto en Lectura Fácil. Reescribe en español con oraciones cortas (máx 15 palabras), una idea por oración, sin tecnicismos. Devuelve solo el texto." },
          { role: "user", content: body.text },
        ],
      });
      if ("error" in result) return jsonResponse(result, result.status);
      return jsonResponse({ texto: result.data.choices?.[0]?.message?.content?.trim() ?? "" });
    }

    if (body.mode === "intent") {
      const result = await callAI({
        messages: [
          { role: "system", content: "Eres TRAMI. Clasifica la intención y propone acción. Responde en español, frases cortas." },
          { role: "user", content: body.text },
        ],
        tools: [INTENT_TOOL],
        tool_choice: { type: "function", function: { name: "classify_intent" } },
      });
      if ("error" in result) return jsonResponse(result, result.status);
      const call = result.data.choices?.[0]?.message?.tool_calls?.[0];
      let parsed: Record<string, unknown> = {};
      try { parsed = call?.function?.arguments ? JSON.parse(call.function.arguments) : {}; } catch { /* noop */ }
      return jsonResponse(parsed);
    }

    if (body.mode === "answer") {
      const result = await callAI({
        messages: [
          { role: "system", content: "Eres TRAMI. Máx 3 oraciones cortas, lenguaje simple. " + (body.context ? `Contexto: ${body.context}` : "") },
          { role: "user", content: body.text },
        ],
      });
      if ("error" in result) return jsonResponse(result, result.status);
      return jsonResponse({ texto: result.data.choices?.[0]?.message?.content?.trim() ?? "" });
    }

    return jsonResponse({ error: "mode inválido" }, 400);
  } catch (e) {
    console.error("trami-router error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
