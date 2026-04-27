import { createContext, useContext, useEffect, useState, useCallback } from "react";

type TextSize = "normal" | "large" | "xlarge";
type ColorBlindMode = "off" | "protanopia" | "deuteranopia" | "tritanopia";

export interface A11yPrefs {
  textSize: TextSize;
  highContrast: boolean;
  colorBlind: ColorBlindMode;
  reducedMotion: boolean;
  underlineLinks: boolean;
  wideSpacing: boolean;
  simpleMode: boolean;
  bigCursor: boolean;
  easyRead: boolean;
  pictoMode: boolean;
}

const DEFAULTS: A11yPrefs = {
  textSize: "normal",
  highContrast: false,
  colorBlind: "off",
  reducedMotion: false,
  underlineLinks: false,
  wideSpacing: false,
  simpleMode: false,
  bigCursor: false,
  easyRead: false,
  pictoMode: false,
};

interface A11yContextValue {
  prefs: A11yPrefs;
  setPref: <K extends keyof A11yPrefs>(key: K, value: A11yPrefs[K]) => void;
  reset: () => void;
}

const A11yContext = createContext<A11yContextValue | null>(null);

const STORAGE_KEY = "trammos_a11y_prefs_v1";

function applyToHtml(prefs: A11yPrefs) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  // Text size
  html.classList.remove("a11y-text-large", "a11y-text-xlarge");
  if (prefs.textSize === "large") html.classList.add("a11y-text-large");
  if (prefs.textSize === "xlarge") html.classList.add("a11y-text-xlarge");
  // Toggles
  html.classList.toggle("a11y-high-contrast", prefs.highContrast);
  html.classList.toggle("a11y-reduced-motion", prefs.reducedMotion);
  html.classList.toggle("a11y-underline-links", prefs.underlineLinks);
  html.classList.toggle("a11y-wide-spacing", prefs.wideSpacing);
  html.classList.toggle("a11y-simple-mode", prefs.simpleMode);
  html.classList.toggle("a11y-big-cursor", prefs.bigCursor);
  html.classList.toggle("a11y-easy-read", prefs.easyRead);
  html.classList.toggle("a11y-picto-mode", prefs.pictoMode);
  // Color blind
  html.classList.remove("a11y-cb-protanopia", "a11y-cb-deuteranopia", "a11y-cb-tritanopia");
  if (prefs.colorBlind !== "off") html.classList.add(`a11y-cb-${prefs.colorBlind}`);
}

export function A11yProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<A11yPrefs>(DEFAULTS);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = { ...DEFAULTS, ...JSON.parse(raw) } as A11yPrefs;
        setPrefs(parsed);
        applyToHtml(parsed);
      } else {
        // Respect OS preference for reduced motion
        const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        if (reduce) {
          const next = { ...DEFAULTS, reducedMotion: true };
          setPrefs(next);
          applyToHtml(next);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Apply on change
  useEffect(() => {
    applyToHtml(prefs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore
    }
  }, [prefs]);

  const setPref = useCallback(<K extends keyof A11yPrefs>(key: K, value: A11yPrefs[K]) => {
    setPrefs((p) => ({ ...p, [key]: value }));
  }, []);

  const reset = useCallback(() => setPrefs(DEFAULTS), []);

  return <A11yContext.Provider value={{ prefs, setPref, reset }}>{children}</A11yContext.Provider>;
}

export function useA11y() {
  const ctx = useContext(A11yContext);
  if (!ctx) throw new Error("useA11y must be used within A11yProvider");
  return ctx;
}
