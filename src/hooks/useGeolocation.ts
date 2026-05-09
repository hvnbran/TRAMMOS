import { useEffect, useState } from "react";

export type GeoStatus = "idle" | "requesting" | "granted" | "denied" | "unsupported" | "error";

export interface GeoState {
  status: GeoStatus;
  lat: number | null;
  lon: number | null;
  accuracy: number | null;
  error?: string;
}

const STORAGE_KEY = "trammos.geo.lastPermission";

export function useGeolocation(autoRequest = true): GeoState & { request: () => void } {
  const [state, setState] = useState<GeoState>({
    status: "idle",
    lat: null,
    lon: null,
    accuracy: null,
  });

  function request() {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setState((s) => ({ ...s, status: "unsupported" }));
      return;
    }
    setState((s) => ({ ...s, status: "requesting" }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        try { localStorage.setItem(STORAGE_KEY, "granted"); } catch { /* noop */ }
        setState({
          status: "granted",
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        const denied = err.code === err.PERMISSION_DENIED;
        try { localStorage.setItem(STORAGE_KEY, denied ? "denied" : "error"); } catch { /* noop */ }
        setState({
          status: denied ? "denied" : "error",
          lat: null,
          lon: null,
          accuracy: null,
          error: err.message,
        });
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  useEffect(() => {
    if (!autoRequest) return;
    if (typeof window === "undefined") return;
    let prev: string | null = null;
    try { prev = localStorage.getItem(STORAGE_KEY); } catch { /* noop */ }
    if (prev === "denied") {
      setState((s) => ({ ...s, status: "denied" }));
      return;
    }
    request();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRequest]);

  return { ...state, request };
}
