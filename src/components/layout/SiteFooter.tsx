import { Link } from "@tanstack/react-router";
import { Mail, Globe, MapPin } from "lucide-react";
import logo from "@/assets/logo-trammos.png";
import { EMPRESA } from "@/lib/legal/empresa";
import { VigiladoSuperTransporte } from "./seals/VigiladoSuperTransporte";
import { MintransporteSeal } from "./seals/MintransporteSeal";

interface Props {
  variant?: "full" | "compact";
  className?: string;
}

/**
 * Footer corporativo TRAMMOS. Se inspira en el footer de trammos.co.
 * - `full`: 4 columnas + sellos institucionales + barra inferior.
 * - `compact`: una franja con logo + sellos + © + links legales.
 */
export function SiteFooter({ variant = "full", className = "" }: Props) {
  const year = new Date().getFullYear();

  if (variant === "compact") {
    return (
      <footer
        className={`mt-10 border-t border-border bg-card/60 ${className}`}
        role="contentinfo"
      >
        <div
          aria-hidden="true"
          className="h-0.5 w-full bg-gradient-to-r from-[oklch(0.78_0.18_220)] via-transparent to-[oklch(0.88_0.22_125)]"
        />
        <div className="mx-auto max-w-3xl px-4 py-5 flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-3">
            <img src={logo} alt="TRAMMOS" className="h-8 w-auto" />
            <div className="text-left leading-tight">
              <p className="text-xs font-semibold text-foreground">
                {EMPRESA.nombreComercial}
              </p>
              <p className="text-[10px] text-muted-foreground">
                ¡Contigo en cada tramo!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <VigiladoSuperTransporte />
            <MintransporteSeal />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
            <span>© {year} {EMPRESA.razonSocial}</span>
            <span aria-hidden="true">·</span>
            <span>NIT {EMPRESA.nit}</span>
            <span aria-hidden="true">·</span>
            <Link
              to="/legal/terminos"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Términos
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              to="/legal/privacidad"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Privacidad
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className={`mt-12 border-t border-border bg-card ${className}`}
      role="contentinfo"
    >
      <div
        aria-hidden="true"
        className="h-1 w-full bg-gradient-to-r from-[oklch(0.78_0.18_220)] via-[oklch(0.92_0.18_180)] to-[oklch(0.88_0.22_125)]"
      />

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          {/* Marca */}
          <div className="md:col-span-4 space-y-3">
            <img src={logo} alt="TRAMMOS" className="h-12 w-auto" />
            <p className="text-sm font-semibold text-foreground">
              {EMPRESA.nombreComercial}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              Transportes Especiales S.A.S. <br />
              <span className="italic">¡Contigo en cada tramo!</span>
            </p>
          </div>

          {/* Empresa */}
          <div className="md:col-span-3">
            <h3 className="text-[11px] uppercase tracking-widest font-semibold text-foreground mb-3">
              Plataforma
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Panel principal
                </Link>
              </li>
              <li>
                <Link
                  to="/servicios"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Servicios
                </Link>
              </li>
              <li>
                <Link
                  to="/operacion"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Operación
                </Link>
              </li>
              <li>
                <Link
                  to="/monitoreo"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Monitoreo
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="md:col-span-2">
            <h3 className="text-[11px] uppercase tracking-widest font-semibold text-foreground mb-3">
              Legal
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/legal/terminos"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Términos
                </Link>
              </li>
              <li>
                <Link
                  to="/legal/privacidad"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Privacidad
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div className="md:col-span-3">
            <h3 className="text-[11px] uppercase tracking-widest font-semibold text-foreground mb-3">
              Contacto
            </h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <Mail className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                <a
                  href={`mailto:${EMPRESA.correoSoporte}`}
                  className="hover:text-foreground break-all"
                >
                  {EMPRESA.correoSoporte}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Globe className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                <a
                  href={EMPRESA.sitioWeb}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground"
                >
                  trammos.online
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                <span>{EMPRESA.pais}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Sellos institucionales */}
        <div className="mt-10 pt-8 border-t border-border">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4 text-center md:text-left">
            Vigilancia y control
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <VigiladoSuperTransporte />
            <MintransporteSeal />
          </div>
        </div>
      </div>

      {/* Barra inferior */}
      <div className="border-t border-border bg-background/50">
        <div className="mx-auto max-w-6xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <p>
            © {year} {EMPRESA.razonSocial} · NIT {EMPRESA.nit}
          </p>
          <p className="flex items-center gap-1">
            Hecho con cuidado en Colombia
            <span aria-hidden="true" className="inline-flex h-2 w-3 overflow-hidden rounded-sm align-middle">
              <span className="w-1/3 bg-[#FCD116]" />
              <span className="w-1/3 bg-[#003893]" />
              <span className="w-1/3 bg-[#CE1126]" />
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
