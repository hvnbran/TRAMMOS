import { supabase } from "@/integrations/supabase/client";

type Mode = "intent" | "simplify" | "answer";

interface IntentResponse {
  intent:
    | "consultar_eta"
    | "ver_servicios"
    | "registrar_pasajero"
    | "reportar_problema"
    | "boton_panico"
    | "ayuda_general"
    | "saludo"
    | "otro";
  respuesta_corta: string;
  accion_sugerida?: string;
}

/**
 * Llama al edge function trami-router. Para uso desde el cliente con cuenta opcional
 * (verify_jwt = false para que invitados también puedan usar la voz).
 */
export async function callTrami<T = unknown>(
  mode: Mode,
  text: string,
  context?: string,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke("trami-router", {
    body: { mode, text, context },
  });
  if (error) {
    throw new Error(error.message || "Error contactando a TRAMI");
  }
  if ((data as { error?: string })?.error) {
    throw new Error((data as { message?: string }).message || "Error de IA");
  }
  return data as T;
}

export async function simplifyText(text: string): Promise<string> {
  const data = await callTrami<{ texto: string }>("simplify", text);
  return data.texto || text;
}

export async function classifyIntent(text: string): Promise<IntentResponse> {
  return callTrami<IntentResponse>("intent", text);
}

export async function askTrami(question: string, context?: string): Promise<string> {
  const data = await callTrami<{ texto: string }>("answer", question, context);
  return data.texto || "";
}
