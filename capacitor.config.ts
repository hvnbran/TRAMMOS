import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "online.trammos.conductor",
  appName: "TRAMMOS Conductor",
  webDir: "public",
  // El APK es un contenedor que carga la app publicada: los cambios que
  // hagamos en la web llegan solos, sin reinstalar la aplicación.
  server: {
    url: "https://trammos.online/conductor",
    cleartext: false,
    androidScheme: "https",
    allowNavigation: ["trammos.online", "*.trammos.online", "*.supabase.co"],
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
