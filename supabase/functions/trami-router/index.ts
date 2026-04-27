// TRAMI Router — Asistente conversacional accesible para TRAMMOS
// Tareas:
//   - mode: "intent"      -> clasifica la intención del usuario y retorna acción sugerida
//   - mode: "simplify"    -> simplifica un texto a "Lectura Fácil" (oraciones cortas, claras)
//   - mode: "answer"      -> responde una pregunta usando contexto opcional (ej. "¿a qué hora llega mi carro?")
//
// Usa Lovable AI Gateway (LOVABLE_API_KEY auto-provisto). Sin costos de configuración para el usuario.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

type Mode = "intent" | "simplify" | "answer";

interface Body {
  mode: Mode;
  text: string;
  context?: string;
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
            "consultar_eta",
            "ver_servicios",
            "registrar_pasajero",
            "reportar_problema",
            "boton_panico",
            "ayuda_general",
            "saludo",
            "otro",
          ],
        },
        respuesta_corta: {
          type: "string",
          description: "Respuesta breve (máx. 2 oraciones) en español, lenguaje simple.",
        },
        accion_sugerida: {
          type: "string",
          description: "Ruta o acción sugerida en la app (ej. /servicios, /pasajeros-pcd).",
        },
      },
      required: ["intent", "respuesta_corta"],
      additionalProperties: false,
    },
  },
};

async function callAI(body: Record<string, unknown>) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY no configurada");

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, ...body }),
  });

  if (res.status === 429) {
    return { error: "rate_limited", message: "Demasiadas solicitudes. Intenta en un momento.", status: 429 };
  }
  if (res.status === 402) {
    return { error: "payment_required", message: "Se agotaron los créditos de IA.", status: 402 };
  }
  if (!res.ok) {
    const t = await res.text();
    console.error("AI gateway error:", res.status, t);
    return { error: "ai_error", message: "Error en el asistente de IA.", status: 500 };
  }
  return { ok: true, data: await res.json() };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    if (!body?.mode || !body?.text || typeof body.text !== "string") {
      return new Response(JSON.stringify({ error: "mode y text son requeridos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.text.length > 4000) {
      return new Response(JSON.stringify({ error: "text demasiado largo (máx 4000)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.mode === "simplify") {
      const result = await callAI({
        messages: [
          {
            role: "system",
            content:
              "Eres un experto en lenguaje claro y Lectura Fácil para personas con discapacidad cognitiva. " +
              "Reescribe el texto del usuario en español usando: oraciones cortas (máx 15 palabras), una idea por oración, " +
              "palabras comunes, sin tecnicismos, sin metáforas. Mantén toda la información esencial. " +
              "Devuelve únicamente el texto simplificado, sin comentarios ni encabezados.",
          },
          { role: "user", content: body.text },
        ],
      });
      if ("error" in result) {
        return new Response(JSON.stringify(result), {
          status: result.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const texto = result.data.choices?.[0]?.message?.content?.trim() ?? "";
      return new Response(JSON.stringify({ texto }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.mode === "intent") {
      const result = await callAI({
        messages: [
          {
            role: "system",
            content:
              "Eres TRAMI, asistente accesible de TRAMMOS (transporte empresarial). " +
              "Clasifica la intención del usuario y propone una acción dentro de la app. " +
              "Responde siempre en español, con frases muy cortas y claras.",
          },
          { role: "user", content: body.text },
        ],
        tools: [INTENT_TOOL],
        tool_choice: { type: "function", function: { name: "classify_intent" } },
      });
      if ("error" in result) {
        return new Response(JSON.stringify(result), {
          status: result.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const call = result.data.choices?.[0]?.message?.tool_calls?.[0];
      let parsed: Record<string, unknown> = {};
      try {
        parsed = call?.function?.arguments ? JSON.parse(call.function.arguments) : {};
      } catch {
        parsed = {};
      }
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.mode === "answer") {
      const result = await callAI({
        messages: [
          {
            role: "system",
            content:
              "Eres TRAMI, asistente accesible de TRAMMOS. Responde en español, en máximo 3 oraciones cortas, " +
              "con lenguaje simple. Si no tienes información suficiente, dilo con claridad. " +
              (body.context ? `Contexto disponible: ${body.context}` : ""),
          },
          { role: "user", content: body.text },
        ],
      });
      if ("error" in result) {
        return new Response(JSON.stringify(result), {
          status: result.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const texto = result.data.choices?.[0]?.message?.content?.trim() ?? "";
      return new Response(JSON.stringify({ texto }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "mode inválido" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("trami-router error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
