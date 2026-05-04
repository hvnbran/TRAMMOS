import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import banner from "@/assets/banner-trammos.png";
import { EMPRESA } from "@/lib/legal/empresa";
import { SiteFooter } from "@/components/layout/SiteFooter";

interface Props {
  titulo: string;
  version: string;
  children: React.ReactNode;
}

/**
 * Layout simple para las páginas legales públicas (sin sidebar, sin auth).
 * Aplica una columna estrecha estilo "prose" con marca TRAMMOS.
 */
export function LegalPageLayout({ titulo, version, children }: Props) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
          <img src={banner} alt="TRAMMOS" className="h-8 w-auto" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            {titulo}
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">
            Versión {version} · {EMPRESA.nombreComercial}
          </p>
        </div>

        <article className="prose prose-sm md:prose-base max-w-none [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:my-3 [&_p]:leading-relaxed [&_p]:text-foreground/90 [&_ul]:my-3 [&_li]:my-1 [&_a]:text-primary [&_a]:underline">
          {children}
        </article>

      </main>
      <SiteFooter variant="full" />
    </div>
  );
}
