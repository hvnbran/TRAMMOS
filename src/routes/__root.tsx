import { Outlet, Link, createRootRoute, HeadContent, Scripts, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import appCss from "../styles.css?url";
import { AppLayout } from "../components/layout/AppLayout";
import { AuthProvider, useAuth } from "../lib/auth-context";
import { A11yProvider } from "../lib/a11y-context";
import { ColorBlindFilters } from "../components/layout/ColorBlindFilters";

function NotFoundComponent() {
  return (
    <AppLayout>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-7xl font-bold text-foreground">404</h1>
          <h2 className="mt-4 text-xl font-semibold text-foreground">Página no encontrada</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            La página que buscas no existe o ha sido movida.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Ir al inicio
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TRAMMOS" },
      { name: "description", content: "Sistema integral de gestión y monitoreo para empresas de transporte especial" },
      { property: "og:title", content: "TRAMMOS" },
      { name: "twitter:title", content: "TRAMMOS" },
      { property: "og:description", content: "Sistema integral de gestión y monitoreo para empresas de transporte especial" },
      { name: "twitter:description", content: "Sistema integral de gestión y monitoreo para empresas de transporte especial" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/src/assets/banner-trammos.png" },
      { name: "twitter:image", content: "/src/assets/banner-trammos.png" },
      // PWA meta
      { name: "theme-color", content: "#C6FF00" },
      { name: "application-name", content: "TRAMMOS" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "TRAMMOS" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "format-detection", content: "telephone=no" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AuthGate() {
  const { user, loading, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isLoginRoute = location.pathname === "/login";
  // Solo /pasajero o /pasajero/* (NO /pasajeros-pcd, que es del staff/admin)
  const isPasajeroRoute =
    location.pathname === "/pasajero" || location.pathname.startsWith("/pasajero/");

  useEffect(() => {
    if (loading) return;
    if (!user && !isLoginRoute) {
      navigate({ to: "/login", replace: true });
      return;
    }
    if (user && role === "pasajero" && !isPasajeroRoute && !isLoginRoute) {
      navigate({ to: "/pasajero", replace: true });
      return;
    }
    if (user && role && role !== "pasajero" && isPasajeroRoute) {
      navigate({ to: "/", replace: true });
    }
  }, [user, loading, role, isLoginRoute, isPasajeroRoute, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user && !isLoginRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return <Outlet />;
}

function RootComponent() {
  return (
    <A11yProvider>
      <AuthProvider>
        <ColorBlindFilters />
        <AuthGate />
      </AuthProvider>
    </A11yProvider>
  );
}
