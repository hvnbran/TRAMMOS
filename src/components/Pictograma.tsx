import {
  Eye, Ear, PersonStanding, Brain, Layers, Accessibility,
  Phone, Mail, IdCard, Pill, AlertCircle, Heart,
  Car, Clock, MapPin, Home, Building2, FileText,
  Hand, Dog, Headphones, Languages, Footprints, Bus,
} from "lucide-react";

/**
 * Pictograma — Iconografía estandarizada y legible para usuarios con
 * discapacidad cognitiva, baja alfabetización o adultos mayores.
 *
 * Inspirado en sets pictográficos universales (ARASAAC), pero usando
 * Lucide para garantizar consistencia y carga ligera.
 */
const MAP = {
  // Tipos de discapacidad
  visual: Eye,
  auditiva: Ear,
  motriz: PersonStanding,
  cognitiva: Brain,
  multiple: Layers,
  ninguna: Accessibility,
  // Ayudas técnicas
  silla_ruedas: Accessibility,
  baston: Footprints,
  perro_guia: Dog,
  audifono: Headphones,
  interprete_lsc: Languages,
  muletas: Footprints,
  andador: PersonStanding,
  // Comunicación
  voz: Phone,
  texto_grande: FileText,
  pictogramas: Layers,
  lengua_senas: Hand,
  escrita_simple: FileText,
  // Conceptos del servicio
  carro: Car,
  bus: Bus,
  reloj: Clock,
  ubicacion: MapPin,
  casa: Home,
  empresa: Building2,
  documento: FileText,
  telefono: Phone,
  email: Mail,
  cedula: IdCard,
  medicamento: Pill,
  alerta: AlertCircle,
  emergencia: Heart,
} as const;

export type PictogramaName = keyof typeof MAP;

const LABELS: Record<PictogramaName, string> = {
  visual: "Discapacidad visual",
  auditiva: "Discapacidad auditiva",
  motriz: "Discapacidad motriz",
  cognitiva: "Discapacidad cognitiva",
  multiple: "Discapacidad múltiple",
  ninguna: "Sin discapacidad",
  silla_ruedas: "Silla de ruedas",
  baston: "Bastón",
  perro_guia: "Perro guía",
  audifono: "Audífono",
  interprete_lsc: "Intérprete de Lengua de Señas",
  muletas: "Muletas",
  andador: "Andador",
  voz: "Comunicación por voz",
  texto_grande: "Texto grande",
  pictogramas: "Pictogramas",
  lengua_senas: "Lengua de Señas Colombiana",
  escrita_simple: "Escritura simple",
  carro: "Carro",
  bus: "Bus",
  reloj: "Hora",
  ubicacion: "Ubicación",
  casa: "Casa",
  empresa: "Empresa",
  documento: "Documento",
  telefono: "Teléfono",
  email: "Correo",
  cedula: "Cédula",
  medicamento: "Medicamento",
  alerta: "Alerta",
  emergencia: "Emergencia",
};

interface Props {
  name: PictogramaName;
  /** Tamaño en px o tailwind size, ej "md" | "lg" | "xl" */
  size?: "sm" | "md" | "lg" | "xl";
  /** Mostrar etiqueta debajo del pictograma */
  showLabel?: boolean;
  /** Override de etiqueta */
  label?: string;
  className?: string;
}

const SIZE_MAP = {
  sm: { box: "h-8 w-8", icon: "h-4 w-4", text: "text-[10px]" },
  md: { box: "h-12 w-12", icon: "h-6 w-6", text: "text-xs" },
  lg: { box: "h-16 w-16", icon: "h-8 w-8", text: "text-sm" },
  xl: { box: "h-24 w-24", icon: "h-12 w-12", text: "text-base" },
};

export function Pictograma({ name, size = "md", showLabel = false, label, className = "" }: Props) {
  const Icon = MAP[name] ?? Accessibility;
  const sz = SIZE_MAP[size];
  const accessibleLabel = label ?? LABELS[name];

  return (
    <span className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <span
        role="img"
        aria-label={accessibleLabel}
        title={accessibleLabel}
        className={`${sz.box} rounded-xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary shrink-0`}
      >
        <Icon className={sz.icon} aria-hidden="true" />
      </span>
      {showLabel && (
        <span className={`${sz.text} font-medium text-center text-foreground max-w-[6rem] leading-tight`}>
          {accessibleLabel}
        </span>
      )}
    </span>
  );
}
