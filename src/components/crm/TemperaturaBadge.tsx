import { Snowflake, Thermometer, Flame } from "lucide-react";

export type Temperatura = "frio" | "tibio" | "caliente";

const STYLES: Record<Temperatura, { label: string; cls: string; Icon: typeof Snowflake }> = {
  frio: {
    label: "Frío",
    cls: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    Icon: Snowflake,
  },
  tibio: {
    label: "Tibio",
    cls: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    Icon: Thermometer,
  },
  caliente: {
    label: "Caliente",
    cls: "bg-red-500/15 text-red-600 border-red-500/30",
    Icon: Flame,
  },
};

export function TemperaturaBadge({ value, size = "sm" }: { value: Temperatura; size?: "sm" | "md" }) {
  const s = STYLES[value];
  const pad = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${pad} ${s.cls}`}
    >
      <s.Icon className="h-3 w-3" aria-hidden="true" />
      {s.label}
    </span>
  );
}

export const TEMPERATURAS: Temperatura[] = ["frio", "tibio", "caliente"];
