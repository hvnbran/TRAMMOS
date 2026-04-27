// Edge function: extrae fecha de vencimiento de un documento usando Lovable AI (Gemini)
// Acepta { signedUrl, mimeType, tipo } y devuelve { fecha_vencimiento, fecha_emision, numero_documento }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { signedUrl, mimeType, tipo } = await req.json();
    if (!signedUrl) {
      return new Response(
        JSON.stringify({ error: "signedUrl es requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY no configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Descargar el archivo y convertirlo a base64 data URL
    const fileResp = await fetch(signedUrl);
    if (!fileResp.ok) {
      return new Response(
        JSON.stringify({ error: "No se pudo descargar el archivo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const buf = new Uint8Array(await fileResp.arrayBuffer());
    // Convertir a base64 en chunks (evita stack overflow para archivos grandes)
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < buf.length; i += chunkSize) {
      binary += String.fromCharCode.apply(
        null,
        buf.subarray(i, i + chunkSize) as unknown as number[],
      );
    }
    const b64 = btoa(binary);
    const mt = mimeType || fileResp.headers.get("content-type") || "image/jpeg";
    const dataUrl = `data:${mt};base64,${b64}`;

    // Solo soportamos imágenes en visión directa. PDFs se intentan igual (Gemini soporta PDFs vía data URL en algunos casos)
    const supportsVision = mt.startsWith("image/") || mt === "application/pdf";
    if (!supportsVision) {
      return new Response(
        JSON.stringify({
          fecha_vencimiento: null,
          fecha_emision: null,
          numero_documento: null,
          mensaje: "Tipo de archivo no soportado para OCR automático",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const tipoTxt = tipo ? `Este documento es de tipo: ${tipo}.` : "";
    const prompt = `Eres un asistente experto en documentos colombianos de transporte (SOAT, RTM, licencia de conducción, tarjeta de propiedad, tarjeta de operación, seguros, etc).
${tipoTxt}
Analiza la imagen/PDF y extrae:
1. fecha_vencimiento (la fecha hasta la cual el documento es vigente)
2. fecha_emision (cuándo fue expedido), si aparece
3. numero_documento (número de placa, número de licencia, número de póliza, etc), si aparece

Responde llamando a la función extract_dates con los datos encontrados. Si no encuentras alguno, deja el campo en null. Las fechas deben estar en formato YYYY-MM-DD estricto.`;

    const aiBody = {
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_dates",
            description: "Devuelve las fechas y datos extraídos del documento",
            parameters: {
              type: "object",
              properties: {
                fecha_vencimiento: {
                  type: ["string", "null"],
                  description: "Fecha de vencimiento en formato YYYY-MM-DD",
                },
                fecha_emision: {
                  type: ["string", "null"],
                  description: "Fecha de emisión en formato YYYY-MM-DD",
                },
                numero_documento: {
                  type: ["string", "null"],
                  description: "Número o identificador del documento",
                },
              },
              required: ["fecha_vencimiento", "fecha_emision", "numero_documento"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_dates" } },
    };

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(aiBody),
    });

    if (aiResp.status === 429) {
      return new Response(
        JSON.stringify({ error: "Demasiadas solicitudes. Intenta más tarde." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (aiResp.status === 402) {
      return new Response(
        JSON.stringify({ error: "Sin créditos en el workspace de Lovable AI." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("Lovable AI error:", aiResp.status, t);
      return new Response(
        JSON.stringify({ error: "Error procesando documento con IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const json = await aiResp.json();
    const toolCall = json?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(
        JSON.stringify({
          fecha_vencimiento: null,
          fecha_emision: null,
          numero_documento: null,
          mensaje: "El modelo no extrajo datos",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let parsed: any = {};
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      parsed = {};
    }

    return new Response(
      JSON.stringify({
        fecha_vencimiento: parsed.fecha_vencimiento ?? null,
        fecha_emision: parsed.fecha_emision ?? null,
        numero_documento: parsed.numero_documento ?? null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("extract-doc-date error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
