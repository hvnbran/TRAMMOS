import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BellRing, BellOff } from "lucide-react";
import { registrarPushToken } from "@/lib/push/tokens.functions";
import { isNativeApp, nativePlatform } from "@/lib/native/native";

type Estado = "inactivo" | "ok" | "denegado" | "error";

/**
 * Solo actúa dentro del APK instalado: pide permiso de notificaciones,
 * registra el celular y abre el servicio cuando el conductor toca el aviso.
 */
export function NativePushRegistrar() {
  const guardarToken = useServerFn(registrarPushToken);
  const [estado, setEstado] = useState<Estado>("inactivo");

  useEffect(() => {
    if (!isNativeApp()) return;
    let cancelled = false;

    (async () => {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");
        const { Device } = await import("@capacitor/device");

        let perm = await PushNotifications.checkPermissions();
        if (perm.receive !== "granted") perm = await PushNotifications.requestPermissions();
        if (perm.receive !== "granted") {
          if (!cancelled) setEstado("denegado");
          return;
        }

        const info = await Device.getInfo().catch(() => null);

        await PushNotifications.addListener("registration", (token) => {
          guardarToken({
            data: {
              token: token.value,
              plataforma: nativePlatform(),
              deviceModel: info ? `${info.manufacturer ?? ""} ${info.model ?? ""}`.trim() : null,
            },
          })
            .then(() => !cancelled && setEstado("ok"))
            .catch(() => !cancelled && setEstado("error"));
        });

        await PushNotifications.addListener("registrationError", () => {
          if (!cancelled) setEstado("error");
        });

        await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
          const url = (action.notification.data as { url?: string } | undefined)?.url;
          if (url && typeof url === "string") window.location.assign(url);
        });

        await PushNotifications.register();
      } catch {
        if (!cancelled) setEstado("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [guardarToken]);

  if (!isNativeApp() || estado === "inactivo") return null;

  if (estado === "ok") {
    return (
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <BellRing className="h-3.5 w-3.5 text-primary" />
        Avisos de servicios activados en este celular
      </p>
    );
  }

  return (
    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
      <BellOff className="h-3.5 w-3.5" />
      {estado === "denegado"
        ? "Activa las notificaciones de TRAMMOS en los ajustes del celular para recibir tus servicios."
        : "No pudimos activar los avisos en este celular. Cierra y vuelve a abrir la app."}
    </p>
  );
}
