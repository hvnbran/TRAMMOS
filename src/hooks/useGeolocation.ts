import { useEffect, useState } from "react";
import { reverseGeocode, colombiaBboxFor, type Bbox } from "@/lib/geo/photon";

export type GeoStatus = "idle" | "requesting" | "granted" | "denied" | "unsupported" | "error";

export interface GeoState {
  status: GeoStatus;
  lat: number | null;
  lon: number | null;
  accuracy: number | null;
  departamento: string | null;
  ciudad: string | null;
  bbox: Bbox | null;
  error?: string;
}

const STORAGE_KEY = "trammos.geo.lastPermission";
const DEPT_KEY = "trammos.geo.lastDepartamento";
const CITY_KEY = "trammos.geo.lastCiudad";

export function useGeolocation(autoRequest = true): GeoState & { request: () => void } {
  const [state, setState] = useState<GeoState>(() => {
    let dept: string | null = null;
    let city: string | null = null;
    try {
      dept = localStorage.getItem(DEPT_KEY);
      city = localStorage.getItem(CITY_KEY);
    } catch { /* noop */ }
    return {
      status: "idle",
      lat: null,
      lon: null,
      accuracy: null,
      departamento: dept,
      ciudad: city,
      bbox: dept ? colombiaBboxFor(dept) : null,
    };
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
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setState((s) => ({
          ...s,
          status: "granted",
          lat,
          lon,
          accuracy: pos.coords.accuracy,
        }));
        // Reverse geocode para detectar departamento
        reverseGeocode(lat, lon).then((r) => {
          if (!r) return;
          const dept = r.departamento ?? null;
          const city = r.ciudad ?? null;
          try {
            if (dept) localStorage.setItem(DEPT_KEY, dept);
            if (city) localStorage.setItem(CITY_KEY, city);
          } catch { /* noop */ }
          setState((s) => ({
            ...s,
            departamento: dept,
            ciudad: city,
            bbox: colombiaBboxFor(dept),
          }));
        }).catch(() => { /* noop */ });
      },
      (err) => {
        const denied = err.code === err.PERMISSION_DENIED;
        try { localStorage.setItem(STORAGE_KEY, denied ? "denied" : "error"); } catch { /* noop */ }
        setState((s) => ({
          ...s,
          status: denied ? "denied" : "error",
          error: err.message,
        }));
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
