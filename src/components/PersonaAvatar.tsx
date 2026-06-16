import { User } from "lucide-react";

interface Props {
  nombre?: string | null;
  fotoUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZES: Record<NonNullable<Props["size"]>, string> = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-base",
  xl: "h-24 w-24 text-xl",
};

function iniciales(nombre?: string | null): string {
  if (!nombre) return "";
  const partes = nombre.trim().split(/\s+/).slice(0, 2);
  return partes.map((p) => p.charAt(0).toUpperCase()).join("");
}

/** Avatar circular reutilizable con fallback a iniciales o ícono. */
export function PersonaAvatar({ nombre, fotoUrl, size = "md", className = "" }: Props) {
  const ini = iniciales(nombre);
  const base = `${SIZES[size]} rounded-full overflow-hidden shrink-0 border border-border bg-primary/15 text-primary font-bold flex items-center justify-center`;
  if (fotoUrl) {
    return (
      <div className={`${base} ${className}`}>
        <img
          src={fotoUrl}
          alt={nombre ? `Foto de ${nombre}` : "Foto de perfil"}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }
  return (
    <div className={`${base} ${className}`} aria-hidden="true">
      {ini || <User className="h-1/2 w-1/2" />}
    </div>
  );
}
