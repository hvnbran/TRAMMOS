import { Link } from "@tanstack/react-router";

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  /** Texto previo al "Términos y Política". Por defecto "He leído y acepto". */
  prefix?: string;
  id?: string;
}

/**
 * Checkbox reutilizable de aceptación de Términos y Política de Privacidad.
 * Estilo TRAMMOS: borde sutil, accesible, links subrayados.
 */
export function PolicyAcceptanceCheckbox({
  checked,
  onChange,
  disabled,
  prefix = "He leído y acepto",
  id = "policy-accept",
}: Props) {
  return (
    <label
      htmlFor={id}
      className="flex items-start gap-2 text-xs text-foreground/90 select-none cursor-pointer"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-0.5 h-4 w-4 rounded border-input accent-primary focus:ring-2 focus:ring-ring"
        required
        aria-required="true"
      />
      <span className="leading-snug">
        {prefix}{" "}
        <Link
          to="/legal/terminos"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:text-primary/80"
        >
          los Términos
        </Link>{" "}
        y la{" "}
        <Link
          to="/legal/privacidad"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:text-primary/80"
        >
          Política de Privacidad
        </Link>
        . Autorizo el tratamiento de mis datos personales conforme a la Ley
        1581 de 2012.
      </span>
    </label>
  );
}
