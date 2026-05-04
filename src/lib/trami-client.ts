import { supabase } from "@/integrations/supabase/client";

type Mode = "intent" | "simplify" | "answer" | "chat";

interface IntentResponse {
  intent:
    | "consultar_eta" | "ver_servicios" | "registrar_pasajero"
    | "reportar_problema" | "boton_panico" | "ayuda_general" | "saludo" | "otro";
  respuesta_corta: string;
  accion_sugerida?: string;
}

export interface TramiChatResponse {
  reply: string;
  conversationId: string | null;
  tools_used: string[];
}

export interface PageContext {
  ruta?: string;
  rol?: string;
  nombre?: string;
  hora_local?: string;
  [k: string]: unknown;
}

async function call<T = unknown>(payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("trami-router", { body: payload });
  if (error) throw new Error(error.message || "Error contactando a TRAMI");
  if ((data as { error?: string })?.error) {
    throw new Error((data as { message?: string }).message || "Error de IA");
  }
  return data as T;
}

export async function callTrami<T = unknown>(mode: Mode, text: string, context?: string): Promise<T> {
  return call<T>({ mode, text, context });
}

export async function simplifyText(text: string): Promise<string> {
  const data = await call<{ texto: string }>({ mode: "simplify", text });
  return data.texto || text;
}

export async function classifyIntent(text: string): Promise<IntentResponse> {
  return call<IntentResponse>({ mode: "intent", text });
}

export async function askTrami(question: string, context?: string): Promise<string> {
  const data = await call<{ texto: string }>({ mode: "answer", text: question, context });
  return data.texto || "";
}

/**
 * Modo conversacional con memoria + tool calling.
 * El servidor recuerda historial por usuario y puede consultar sus viajes.
 */
export async function chatWithTrami(
  text: string,
  conversationId: string | null,
  pageContext: PageContext,
): Promise<TramiChatResponse> {
  return call<TramiChatResponse>({
    mode: "chat",
    text,
    conversationId: conversationId ?? undefined,
    pageContext,
  });
}

/** Carga el historial reciente de la conversación más nueva del usuario. */
export async function loadTramiHistory(): Promise<{
  conversationId: string | null;
  messages: Array<{ role: string; content: string; tool_name?: string | null; created_at: string }>;
}> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { conversationId: null, messages: [] };

  const { data: conv } = await supabase
    .from("trami_conversations")
    .select("id")
    .eq("user_id", user.user.id)
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!conv) return { conversationId: null, messages: [] };

  const { data: msgs } = await supabase
    .from("trami_messages")
    .select("role,content,tool_name,created_at")
    .eq("conversation_id", conv.id)
    .order("created_at", { ascending: true })
    .limit(30);

  return { conversationId: conv.id, messages: msgs ?? [] };
}
