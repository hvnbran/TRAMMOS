/**
 * Badge "Ministerio de Transporte — República de Colombia".
 * Construido como SVG/HTML neutro (sin escudo nacional literal).
 */
export function MintransporteSeal({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 ${className}`}
      role="img"
      aria-label="Ministerio de Transporte — República de Colombia"
      title="Ministerio de Transporte"
    >
      <svg
        viewBox="0 0 48 48"
        className="h-9 w-auto shrink-0"
        aria-hidden="true"
      >
        <circle cx="24" cy="22" r="14" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground" />
        {/* Camino estilizado */}
        <path
          d="M16 28 Q24 14 32 28"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-primary"
        />
        <circle cx="24" cy="22" r="2" fill="currentColor" className="text-foreground" />
        <rect x="6" y="40" width="36" height="2" fill="#FCD116" />
        <rect x="6" y="42" width="36" height="2" fill="#003893" />
        <rect x="6" y="44" width="36" height="2" fill="#CE1126" />
      </svg>
      <div className="flex flex-col leading-tight">
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
          Ministerio de
        </span>
        <span className="text-xs font-bold text-foreground">Transporte</span>
        <span className="text-[8px] uppercase tracking-wider text-muted-foreground">
          República de Colombia
        </span>
      </div>
    </div>
  );
}
