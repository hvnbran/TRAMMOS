import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const TIPOS = ["Empresarial", "Turismo", "Salud", "Escolar", "Otro"];

function badgeClass(tipo: string) {
  switch (tipo) {
    case "Empresarial":
      return "bg-primary/15 text-primary";
    case "Turismo":
      return "bg-accent/15 text-accent";
    case "Salud":
      return "bg-success/15 text-success";
    case "Escolar":
      return "bg-warning/15 text-warning";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function TipoEditable({
  id,
  value,
  onSaved,
}: {
  id: string;
  value: string;
  onSaved: (v: string) => void;
}) {
  const [saving, setSaving] = useState(false);

  async function change(next: string) {
    if (next === value) return;
    setSaving(true);
    const { error } = await supabase.from("centros_costo").update({ tipo: next }).eq("id", id);
    setSaving(false);
    if (error) {
      alert("Error: " + error.message);
      return;
    }
    onSaved(next);
  }

  return (
    <div className="inline-flex items-center gap-1">
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeClass(value)}`}>{value}</span>
      <select
        value={value}
        disabled={saving}
        onChange={(e) => change(e.target.value)}
        className="text-xs bg-transparent border border-border rounded px-1 py-0.5 hover:bg-secondary cursor-pointer"
        title="Cambiar tipo"
      >
        {TIPOS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      {saving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
    </div>
  );
}
