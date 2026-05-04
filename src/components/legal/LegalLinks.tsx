import { Link } from "@tanstack/react-router";

interface Props {
  className?: string;
  /** Color del texto base. Por defecto usa muted-foreground. */
  tone?: "default" | "inverted";
}

export function LegalLinks({ className = "", tone = "default" }: Props) {
  const base =
    tone === "inverted"
      ? "text-white/80 hover:text-white"
      : "text-muted-foreground hover:text-foreground";
  return (
    <span className={`text-xs ${base} ${className}`}>
      <Link to="/legal/terminos" className="underline underline-offset-2">
        Términos
      </Link>
      <span className="mx-1">·</span>
      <Link to="/legal/privacidad" className="underline underline-offset-2">
        Política de privacidad
      </Link>
    </span>
  );
}
