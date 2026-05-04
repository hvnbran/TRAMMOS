/**
 * Sello "Vigilado SuperTransporte" — versión propia construida en SVG.
 * No reproduce el escudo nacional literal (uso restringido); usa una marca
 * geométrica neutra + tipografía oficial y la franja tricolor colombiana.
 */
export function VigiladoSuperTransporte({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 ${className}`}
      role="img"
      aria-label="Vigilado por la Superintendencia de Transporte de Colombia"
      title="Vigilado SuperTransporte"
    >
      <svg
        viewBox="0 0 40 48"
        className="h-9 w-auto shrink-0"
        aria-hidden="true"
      >
        <path
          d="M20 2 L36 8 V24 C36 34 28 42 20 46 C12 42 4 34 4 24 V8 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-foreground"
        />
        <path
          d="M12 22 L18 28 L28 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        />
        <rect x="4" y="40" width="32" height="2" fill="#FCD116" />
        <rect x="4" y="42" width="32" height="2" fill="#003893" />
        <rect x="4" y="44" width="32" height="2" fill="#CE1126" />
      </svg>
      <div className="flex flex-col leading-tight">
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
          Vigilado
        </span>
        <span className="text-xs font-bold text-foreground">
          SuperTransporte
        </span>
      </div>
    </div>
  );
}
