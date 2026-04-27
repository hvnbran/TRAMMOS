import { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useA11y } from "@/lib/a11y-context";
import { simplifyText } from "@/lib/trami-client";
import { SpeakButton } from "./SpeakButton";

interface Props {
  text: string;
  /** Si true, solo se simplifica cuando el usuario activó "Lectura Fácil". */
  auto?: boolean;
  className?: string;
}

const CACHE_KEY = "trammos_easyread_cache_v1";

function loadCache(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveCache(cache: Record<string, string>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
}

/**
 * Renderiza un texto. Si el usuario tiene activo "Lectura Fácil" (a11y),
 * llama a TRAMI para simplificarlo y lo cachea localmente. Incluye botón
 * de lectura en voz alta.
 */
export function SimplifyText({ text, auto = true, className = "" }: Props) {
  const { prefs } = useA11y();
  const enabled = prefs.easyRead && auto;
  const [simplified, setSimplified] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !text || text.length < 30) {
      setSimplified(null);
      return;
    }
    const cache = loadCache();
    const cached = cache[text];
    if (cached) {
      setSimplified(cached);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    simplifyText(text)
      .then((res) => {
        if (cancelled) return;
        setSimplified(res);
        const c = loadCache();
        c[text] = res;
        saveCache(c);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Error simplificando");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [enabled, text]);

  const display = simplified ?? text;

  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <div className="flex-1 leading-relaxed">
        {enabled && loading && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mb-1">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
            Simplificando con TRAMI…
          </span>
        )}
        {enabled && simplified && (
          <span className="inline-flex items-center gap-1 text-[11px] text-primary mb-1">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Lectura Fácil
          </span>
        )}
        <p className={enabled ? "a11y-easy-text" : ""}>{display}</p>
        {error && enabled && (
          <p className="text-xs text-destructive mt-1">No pude simplificar: {error}</p>
        )}
      </div>
      <SpeakButton text={display} />
    </div>
  );
}
