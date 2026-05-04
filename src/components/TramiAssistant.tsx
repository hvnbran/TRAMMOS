import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Mic, MicOff, X, Send, Loader2, Volume2 } from "lucide-react";
import { TramiAvatar } from "@/components/trami/TramiAvatar";
import { classifyIntent, askTrami } from "@/lib/trami-client";

type Msg = { from: "user" | "trami"; text: string; intent?: string };

const INTENT_ROUTES: Record<string, string> = {
  consultar_eta: "/operacion",
  ver_servicios: "/servicios",
  registrar_pasajero: "/pasajeros-pcd",
  reportar_problema: "/alertas",
  boton_panico: "/alertas",
  ayuda_general: "/",
};

// Web Speech API types (browser-only, mantenemos any para compatibilidad)
type SpeechRec = typeof window extends { SpeechRecognition: infer T } ? T : unknown;

declare global {
  interface Window {
    SpeechRecognition?: new () => unknown;
    webkitSpeechRecognition?: new () => unknown;
  }
}

function getRecognitionCtor(): (new () => unknown) | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "es-CO";
  u.rate = 1;
  synth.speak(u);
}

/**
 * TRAMI — Asistente accesible flotante con voz y texto.
 * Usa Web Speech API para escuchar y leer en voz alta.
 * Clasifica intención con IA y sugiere navegar a la sección correcta.
 */
export function TramiAssistant() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      from: "trami",
      text:
        "Hola, soy TRAMI. Puedo ayudarte a moverte por TRAMMOS. " +
        "Pulsa el micrófono y di lo que necesitas, o escríbeme.",
    },
  ]);
  const recognitionRef = useRef<unknown>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function startListening() {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setMessages((m) => [
        ...m,
        { from: "trami", text: "Tu navegador no soporta entrada por voz. Por favor escríbeme." },
      ]);
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rec: any = new (Ctor as any)();
      rec.lang = "es-CO";
      rec.continuous = false;
      rec.interimResults = false;
      rec.onstart = () => setListening(true);
      rec.onerror = () => setListening(false);
      rec.onend = () => setListening(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = (e: any) => {
        const transcript = e.results?.[0]?.[0]?.transcript ?? "";
        if (transcript) {
          handleSend(transcript);
        }
      };
      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error("speech recognition", err);
      setListening(false);
    }
  }

  function stopListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = recognitionRef.current as any;
    if (rec?.stop) rec.stop();
    setListening(false);
  }

  async function handleSend(textRaw?: string) {
    const text = (textRaw ?? input).trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { from: "user", text }]);
    setLoading(true);
    try {
      // 1. Clasifica intención
      const intent = await classifyIntent(text);
      const reply = intent.respuesta_corta || "Aquí estoy para ayudarte.";
      setMessages((m) => [...m, { from: "trami", text: reply, intent: intent.intent }]);
      speak(reply);

      // 2. Si hay ruta sugerida, ofrécela
      const route = intent.accion_sugerida || INTENT_ROUTES[intent.intent];
      if (route && route !== window.location.pathname) {
        setTimeout(() => {
          // navegamos automáticamente excepto en pánico (más adelante en Fase D)
          if (intent.intent !== "boton_panico") {
            try {
              navigate({ to: route });
            } catch {
              // ignore si la ruta no existe
            }
          }
        }, 1200);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Hubo un error con el asistente.";
      setMessages((m) => [...m, { from: "trami", text: msg }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir a TRAMI, tu ayudante"
        className="group fixed bottom-5 right-24 z-50 h-16 w-16 rounded-full bg-white border-2 border-primary/30 shadow-xl flex items-center justify-center overflow-hidden hover:scale-110 hover:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 transition-all"
        title="Hola, soy TRAMI"
      >
        <TramiAvatar
          state="wave"
          size="sm"
          bobbing
          className="h-14 w-14 group-hover:scale-110 transition-transform"
          alt=""
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="trami-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full sm:w-[420px] sm:mr-5 max-h-[85vh] flex flex-col bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 via-transparent to-secondary/10">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-white border-2 border-primary/40 flex items-center justify-center overflow-hidden shrink-0">
                  <TramiAvatar
                    state={loading ? "thinking" : "wave"}
                    size="sm"
                    className="h-11 w-11"
                    alt=""
                  />
                </div>
                <div>
                  <h2 id="trami-title" className="text-sm font-semibold text-foreground">
                    TRAMI
                  </h2>
                  <p className="text-[11px] text-muted-foreground">Tu ayudante TRAMMOS · Accesible</p>
                </div>
              </div>
              <button
                onClick={() => {
                  stopListening();
                  setOpen(false);
                }}
                aria-label="Cerrar TRAMI"
                className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      m.from === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    }`}
                  >
                    {m.text}
                    {m.from === "trami" && (
                      <button
                        type="button"
                        onClick={() => speak(m.text)}
                        aria-label="Leer en voz alta"
                        className="ml-2 inline-flex items-center text-muted-foreground hover:text-primary"
                      >
                        <Volume2 className="h-3 w-3" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                  TRAMI está pensando…
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 border-t border-border flex items-center gap-2"
            >
              <button
                type="button"
                onClick={listening ? stopListening : startListening}
                aria-label={listening ? "Detener escucha" : "Hablar a TRAMI"}
                aria-pressed={listening}
                className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors ${
                  listening
                    ? "bg-destructive text-destructive-foreground animate-pulse"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={listening ? "Escuchando…" : "Escribe o usa la voz…"}
                aria-label="Mensaje para TRAMI"
                className="flex-1 h-11 rounded-full border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Enviar"
                className="h-11 w-11 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0 disabled:opacity-50 hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
