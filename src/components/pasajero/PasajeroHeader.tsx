import { LogOut } from "lucide-react";
import logo from "@/assets/logo-trammos.png";

interface Props {
  nombre: string;
  onSignOut: () => void;
}

export function PasajeroHeader({ nombre, onSignOut }: Props) {
  const inicial = (nombre || "P").trim().charAt(0).toUpperCase();

  return (
    <header
      role="banner"
      className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border"
    >
      <div className="mx-auto max-w-md flex items-center gap-3 px-4 h-14">
        <img src={logo} alt="TRAMMOS" className="h-8 w-8 rounded-md object-contain bg-white p-0.5" />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground leading-none">TRAMMOS</div>
          <div className="text-sm font-semibold text-foreground truncate leading-tight">
            Hola, {nombre || "viajero"}
          </div>
        </div>

        <div
          className="h-9 w-9 rounded-full bg-muted text-foreground text-sm font-bold flex items-center justify-center border border-border"
          aria-hidden="true"
        >
          {inicial}
        </div>

        <button
          type="button"
          onClick={onSignOut}
          aria-label="Cerrar sesión"
          className="h-10 w-10 rounded-full hover:bg-muted/60 transition-all flex items-center justify-center text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
