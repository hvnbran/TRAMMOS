import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, X, Send, Loader2, Volume2, Brain, Search, Check } from "lucide-react";
import { TramiAvatar } from "@/components/trami/TramiAvatar";
import { chatWithTrami, loadTramiHistory } from "@/lib/trami-client";
import { useTramiContext } from "@/hooks/useTramiContext";

type Msg = {
  from: "user" | "trami" | "tool";
  text: string;
  toolName?: string;
};

type LoadingStep = "idle" | "thinking" | "consultando_viaje" | "consultando_historial" | "respondiendo";

const STEP_LABELS: Record<Exclude<LoadingStep, "idle">, { label: string; icon: typeof Brain }> = {
  thinking: { label: "TRAMI está pensando…", icon: Brain },
  consultando_viaje: { label: "Consultando tu viaje…", icon: Search },
  consultando_historial: { label: "Revisando tu historial…", icon: Search },
  respondiendo: { label: "Preparando respuesta…", icon: Check },
};

const TOOL_TO_STEP: Record<string, LoadingStep> = {
  consultar_mi_viaje_activo: "consultando_viaje",
  consultar_mis_servicios_recientes: "consultando_historial",
};

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

export function TramiAssistant() {
  const pageContext = useTramiContext();
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [input, setInput] = useState("");
  const [loadingStep, setLoadingStep] = useState<LoadingStep>("idle");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([
    {
      from: "trami",
      text:
        "Hola, soy TRAMI. Recuerdo nuestra conversación y puedo consultar tu viaje. " +
        "Pulsa el micrófono o escríbeme.",
    },
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const historyLoaded = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loadingStep]);

  // Cargar historial cuando se abre por primera vez
  useEffect(() => {
    if (!open || historyLoaded.current) return;
    historyLoaded.current = true;
    (async () => {
      try {
        const { conversationId: cid, messages: hist } = await loadTramiHistory();
        if (cid && hist.length > 0) {
          setConversationId(cid);
          const restored: Msg[] = hist
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((m) => ({
              from: m.role === "user" ? "user" : "trami",
              text: m.content,
            }));
          if (restored.length > 0) {
            setMessages([
              {
                from: "trami",
                text: `Hola otra vez. Aquí está nuestra conversación reciente:`,
              },
              ...restored,
            ]);
          }
        }
      } catch (e) {
        console.warn("trami history", e);
      }
    })();
  }, [open]);

  function startListening() {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setMessages((m) => [...m, { from: "trami", text: "Tu navegador no soporta voz. Escríbeme." }]);
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
        if (transcript) handleSend(transcript);
      };
      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error("speech recognition", err);
      setListening(false);
    }
  }

  function stopListening() {
    recognitionRef.current?.stop?.();
    setListening(false);
  }

  async function handleSend(textRaw?: string) {
    const text = (textRaw ?? input).trim();
    if (!text || loadingStep !== "idle") return;
    setInput("");
    setMessages((m) => [...m, { from: "user", text }]);
    setLoadingStep("thinking");

    // Pequeña heurística para anticipar el paso visible mientras llega la respuesta
    const lower = text.toLowerCase();
    if (/(viaje|carro|conductor|llega|cuando|donde está)/.test(lower)) {
      setTimeout(() => setLoadingStep((s) => (s === "thinking" ? "consultando_viaje" : s)), 600);
    } else if (/(historial|últimos|anteriores|pasados)/.test(lower)) {
      setTimeout(() => setLoadingStep((s) => (s === "thinking" ? "consultando_historial" : s)), 600);
    }

    try {
      const res = await chatWithTrami(text, conversationId, pageContext);

      // Mostrar qué herramientas usó (transparencia)
      if (res.tools_used.length > 0) {
        const last = res.tools_used[res.tools_used.length - 1];
        setLoadingStep(TOOL_TO_STEP[last] ?? "respondiendo");
        await new Promise((r) => setTimeout(r, 350));
        setLoadingStep("respondiendo");
        await new Promise((r) => setTimeout(r, 250));

        for (const t of res.tools_used) {
          setMessages((m) => [
            ...m,
            { from: "tool", toolName: t, text: t === "consultar_mi_viaje_activo" ? "Consulté tu viaje activo" : "Consulté tu historial" },
          ]);
        }
      }

      if (res.conversationId) setConversationId(res.conversationId);
      setMessages((m) => [...m, { from: "trami", text: res.reply }]);
      speak(res.reply);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Hubo un error con el asistente.";
      setMessages((m) => [...m, { from: "trami", text: msg }]);
    } finally {
      setLoadingStep("idle");
    }
  }

  const stepInfo = loadingStep !== "idle" ? STEP_LABELS[loadingStep] : null;
  const StepIcon = stepInfo?.icon;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir a TRAMI, tu ayudante"
        className="group fixed bottom-5 right-24 z-50 h-16 w-16 rounded-full bg-white border-2 border-primary/30 shadow-xl flex items-center justify-center overflow-hidden hover:scale-110 hover:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 transition-all"
        title="Hola, soy TRAMI"
      >
        <TramiAvatar state="wave" size="sm" bobbing className="h-14 w-14 group-hover:scale-110 transition-transform" alt="" />
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
                    state={loadingStep !== "idle" ? "thinking" : "wave"}
                    size="sm"
                    className="h-11 w-11"
                    alt=""
                  />
                </div>
                <div>
                  <h2 id="trami-title" className="text-sm font-semibold text-foreground">TRAMI</h2>
                  <p className="text-[11px] text-muted-foreground">
                    {conversationId ? "Recuerdo tu conversación · " : ""}
                    {pageContext.seccion as string}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { stopListening(); setOpen(false); }}
                aria-label="Cerrar TRAMI"
                className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => {
                if (m.from === "tool") {
                  return (
                    <div key={i} className="flex justify-start">
                      <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-[11px] text-primary">
                        <Search className="h-3 w-3" aria-hidden="true" />
                        {m.text}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
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
                );
              })}

              {stepInfo && StepIcon && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1.5 w-fit animate-pulse">
                  <StepIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{stepInfo.label}</span>
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
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
                placeholder={listening ? "Escuchando…" : "Pregúntame por tu viaje…"}
                aria-label="Mensaje para TRAMI"
                disabled={loadingStep !== "idle"}
                className="flex-1 h-11 rounded-full border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!input.trim() || loadingStep !== "idle"}
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
