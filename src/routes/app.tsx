import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Download, Loader2, ShieldCheck, Bell, MapPin, Globe } from "lucide-react";
import logo from "@/assets/logo-trammos.png";
import { getApkInfo, type ApkInfo } from "@/lib/app-conductor/apk.functions";

export const Route = createFileRoute("/app")({
  component: DescargarApp,
  head: () => ({
    meta: [
      { title: "Instalar TRAMMOS Conductor en tu celular" },
      {
        name: "description",
        content:
          "Descarga e instala la app TRAMMOS Conductor para Android: recibe tus servicios, avisos y comparte tu ubicación en servicio.",
      },
      { property: "og:title", content: "Instalar TRAMMOS Conductor" },
      {
        property: "og:description",
        content: "App para conductores TRAMMOS: servicios del día, avisos y ubicación en tiempo real.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

function mb(bytes: number | null) {
  if (!bytes) return null;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function DescargarApp() {
  const fetchInfo = useServerFn(getApkInfo);
  const [data, setData] = useState<ApkInfo | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    let vivo = true;
    fetchInfo()
      .then((info) => {
        if (vivo) setData(info);
      })
      .catch(() => {})
      .finally(() => {
        if (vivo) setLoading(false);
      });
    return () => {
      vivo = false;
    };
  }, [fetchInfo]);

  return (
    <main className="min-h-screen bg-background text-foreground px-5 py-10">
      <div className="mx-auto w-full max-w-md space-y-8">
        <header className="text-center space-y-3">
          <img src={logo} alt="TRAMMOS" className="h-14 mx-auto object-contain" />
          <h1 className="text-2xl font-bold leading-tight">TRAMMOS Conductor</h1>
          <p className="text-sm text-muted-foreground">
            Instala la app en tu celular Android para ver tus servicios, recibir avisos y compartir tu
            ubicación mientras estás en servicio.
          </p>
        </header>

        <section className="rounded-2xl border border-border bg-card p-5 text-center space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : data?.disponible && data.url ? (
            <>
              <a
                href={data.url}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-base font-bold text-primary-foreground"
              >
                <Download className="h-5 w-5" /> Descargar la app
              </a>
              <p className="text-[11px] text-muted-foreground">
                {mb(data.tamano) ? `${mb(data.tamano)} · ` : ""}
                {data.actualizado
                  ? `versión del ${new Date(data.actualizado).toLocaleDateString("es-CO")}`
                  : "última versión"}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Todavía no hay archivo para descargar. Mientras tanto puedes usar la versión web.
            </p>
          )}

          <a
            href="/conductor/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-secondary"
          >
            <Globe className="h-4 w-4" /> Entrar desde el navegador
          </a>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Cómo instalarla
          </h2>
          <Paso n={1} icon={<ShieldCheck className="h-4 w-4" />} titulo="Abre el archivo descargado">
            Android te preguntará si confías en el archivo: elige “Instalar de todos modos” o activa el
            permiso que te muestre.
          </Paso>
          <Paso n={2} icon={<Bell className="h-4 w-4" />} titulo="Acepta las notificaciones">
            Así te avisamos al instante cuando te asignen un servicio.
          </Paso>
          <Paso n={3} icon={<MapPin className="h-4 w-4" />} titulo="Permite la ubicación “todo el tiempo”">
            Al activar “Estoy en línea” elige esa opción; si no, el rastreo se detiene cuando bloqueas el
            celular.
          </Paso>
          <Paso n={4} icon={<Download className="h-4 w-4" />} titulo="Entra con tu cédula y contraseña">
            Son los mismos datos que te envió la oficina por WhatsApp.
          </Paso>
        </section>
      </div>
    </main>
  );
}

function Paso({
  n,
  icon,
  titulo,
  children,
}: {
  n: number;
  icon: React.ReactNode;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-semibold">
          {n}. {titulo}
        </p>
        <p className="text-xs text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}
