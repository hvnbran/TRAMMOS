import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { upsertUbicacion, setOffline } from "@/lib/gps/ubicacion.functions";
import { MapPin, MapPinOff, Loader2, AlertTriangle } from "lucide-react";
import { BackgroundGeolocation, isNativeApp } from "@/lib/native/native";

type Estado = "offline" | "starting" | "online" | "denied" | "unsupported" | "error";

const MIN_INTERVAL_MS = 5_000; // mínimo 5s entre envíos
const MIN_DISTANCE_M = 8; // o si se movió >8m

function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371e3;
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
  const x = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function ShareLocationToggle() {
  const upsert = useServerFn(upsertUbicacion);
  const offline = useServerFn(setOffline);
  const [estado, setEstado] = useState<Estado>("offline");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const nativeWatcherRef = useRef<string | null>(null);
  const lastPosRef = useRef<{ lat: number; lng: number; at: number } | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const sendingRef = useRef(false);
  const esApp = isNativeApp();

  const enviarPosicion = useCallback(
    async (p: {
      lat: number;
      lng: number;
      accuracy: number | null;
      speed: number | null;
      heading: number | null;
    }) => {
      const now = Date.now();
      const last = lastPosRef.current;
      if (last) {
        const dt = now - last.at;
        const dist = distanceMeters(last, { lat: p.lat, lng: p.lng });
        if (dt < MIN_INTERVAL_MS && dist < MIN_DISTANCE_M) return;
      }
      if (sendingRef.current) return;
      sendingRef.current = true;
      try {
        await upsert({
          data: {
            lat: p.lat,
            lng: p.lng,
            accuracy: p.accuracy,
            speed_kmh: p.speed != null && p.speed >= 0 ? p.speed * 3.6 : null,
            heading:
              p.heading != null && p.heading >= 0 && !Number.isNaN(p.heading) ? p.heading : null,
          },
        });
        lastPosRef.current = { lat: p.lat, lng: p.lng, at: now };
        setLastSentAt(now);
        setEstado("online");
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Error de red");
        setEstado("error");
      } finally {
        sendingRef.current = false;
      }
    },
    [upsert],
  );

  const stop = useCallback(async () => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (nativeWatcherRef.current) {
      try {
        await BackgroundGeolocation.removeWatcher({ id: nativeWatcherRef.current });
      } catch { /* ignore */ }
      nativeWatcherRef.current = null;
    }
    if (wakeLockRef.current) {
      try { await wakeLockRef.current.release(); } catch { /* ignore */ }
      wakeLockRef.current = null;
    }
    try { await offline(); } catch { /* ignore */ }
    setEstado("offline");
    lastPosRef.current = null;
  }, [offline]);

  const start = useCallback(async () => {
    setErrorMsg(null);

    // Dentro del APK: rastreo continuo aunque la pantalla esté apagada.
    if (esApp) {
      setEstado("starting");
      try {
        const id = await BackgroundGeolocation.addWatcher(
          {
            backgroundTitle: "TRAMMOS Conductor en servicio",
            backgroundMessage: "Tu ubicación se comparte con la central mientras estés en línea.",
            requestPermissions: true,
            stale: false,
            distanceFilter: MIN_DISTANCE_M,
          },
          (position, error) => {
            if (error) {
              if (error.code === "NOT_AUTHORIZED") setEstado("denied");
              else {
                setErrorMsg(error.message);
                setEstado("error");
              }
              return;
            }
            if (!position) return;
            void enviarPosicion({
              lat: position.latitude,
              lng: position.longitude,
              accuracy: position.accuracy ?? null,
              speed: position.speed ?? null,
              heading: position.bearing ?? null,
            });
          },
        );
        nativeWatcherRef.current = id;
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "No pudimos iniciar el GPS");
        setEstado("error");
      }
      return;
    }

    if (!("geolocation" in navigator)) {
      setEstado("unsupported");
      return;
    }
    setEstado("starting");

    // Wake Lock para que la pantalla no se duerma (opcional)
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch { /* permiso opcional */ }

    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, accuracy, speed, heading } = pos.coords;
        const now = Date.now();
        const last = lastPosRef.current;

        // Throttle: solo enviamos cada 5s O si nos movimos > 8m
        if (last) {
          const dt = now - last.at;
          const dist = distanceMeters(last, { lat: latitude, lng: longitude });
          if (dt < MIN_INTERVAL_MS && dist < MIN_DISTANCE_M) return;
        }

        if (sendingRef.current) return;
        sendingRef.current = true;
        try {
          await upsert({
            data: {
              lat: latitude,
              lng: longitude,
              accuracy: accuracy ?? null,
              speed_kmh: speed != null && speed >= 0 ? speed * 3.6 : null,
              heading: heading != null && heading >= 0 && !Number.isNaN(heading) ? heading : null,
            },
          });
          lastPosRef.current = { lat: latitude, lng: longitude, at: now };
          setLastSentAt(now);
          setEstado("online");
        } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : "Error de red");
          setEstado("error");
        } finally {
          sendingRef.current = false;
        }
      },
      (err) => {
        setErrorMsg(err.message);
        setEstado(err.code === err.PERMISSION_DENIED ? "denied" : "error");
      },
      { enableHighAccuracy: true, maximumAge: 4_000, timeout: 20_000 },
    );
    watchIdRef.current = id;
  }, [upsert]);

  // Latido: si el conductor está quieto el GPS deja de reportar, así que
  // reenviamos la última posición cada 30s para que no aparezca "offline".
  useEffect(() => {
    if (estado !== "online") return;
    const t = setInterval(() => {
      const last = lastPosRef.current;
      if (!last || sendingRef.current) return;
      sendingRef.current = true;
      upsert({ data: { lat: last.lat, lng: last.lng, accuracy: null, speed_kmh: 0, heading: null } })
        .then(() => setLastSentAt(Date.now()))
        .catch(() => { /* reintenta en el próximo latido */ })
        .finally(() => { sendingRef.current = false; });
    }, 30_000);
    return () => clearInterval(t);
  }, [estado, upsert]);

  // Cleanup al desmontar / cerrar pestaña

  useEffect(() => {
    const handleUnload = () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      // intento best-effort: no podemos await aquí
      void offline().catch(() => {});
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (wakeLockRef.current) { void wakeLockRef.current.release().catch(() => {}); }
    };
  }, [offline]);

  // Re-adquirir wake lock al volver de background
  useEffect(() => {
    const onVis = async () => {
      if (document.visibilityState === "visible" && estado === "online" && !wakeLockRef.current && "wakeLock" in navigator) {
        try { wakeLockRef.current = await navigator.wakeLock.request("screen"); } catch { /* ignore */ }
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [estado]);

  const isOn = estado === "online" || estado === "starting";

  return (
    <section
      className={`rounded-2xl border-2 p-4 transition-colors ${
        isOn
          ? "border-success/50 bg-success/5"
          : estado === "denied" || estado === "unsupported" || estado === "error"
            ? "border-destructive/40 bg-destructive/5"
            : "border-border bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isOn ? (
              <MapPin className="h-4 w-4 text-success" />
            ) : (
              <MapPinOff className="h-4 w-4 text-muted-foreground" />
            )}
            <h2 className="text-sm font-bold">
              {estado === "online" && "Estás en línea"}
              {estado === "starting" && "Conectando…"}
              {estado === "offline" && "Compartir mi ubicación"}
              {estado === "denied" && "Ubicación denegada"}
              {estado === "unsupported" && "GPS no disponible"}
              {estado === "error" && "Error de conexión"}
            </h2>
          </div>
          <p className="text-[12px] text-muted-foreground mt-1">
            {estado === "online" &&
              `Los administradores y tus pasajeros pueden ver tu ubicación en tiempo real. ${
                lastSentAt ? `Última actualización: ${new Date(lastSentAt).toLocaleTimeString("es-CO")}` : ""
              }`}
            {estado === "starting" && "Obteniendo tu primera posición…"}
            {estado === "offline" && "Actívalo para que monitoreo y tus pasajeros puedan ver tu ubicación."}
            {estado === "denied" &&
              "Debes permitir acceso a la ubicación en la configuración del navegador para compartir tu posición."}
            {estado === "unsupported" && "Este dispositivo no soporta geolocalización."}
            {estado === "error" && (errorMsg ?? "Reintenta o desconéctate y vuelve a conectarte.")}
          </p>
          {(estado === "denied" || estado === "error") && errorMsg && estado !== "denied" && (
            <div className="mt-2 flex items-start gap-1 text-[11px] text-destructive">
              <AlertTriangle className="h-3 w-3 mt-0.5" /> {errorMsg}
            </div>
          )}
        </div>

        <button
          onClick={isOn ? stop : start}
          disabled={estado === "starting" || estado === "unsupported"}
          className={`shrink-0 h-10 px-4 rounded-full text-sm font-semibold transition-all ${
            isOn
              ? "bg-destructive text-destructive-foreground hover:opacity-90"
              : "bg-success text-success-foreground hover:opacity-90 disabled:opacity-50"
          }`}
        >
          {estado === "starting" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isOn ? (
            "Desconectarme"
          ) : (
            "Estoy en línea"
          )}
        </button>
      </div>
    </section>
  );
}
