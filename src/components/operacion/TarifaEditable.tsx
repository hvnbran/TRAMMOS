import { useEffect, useRef, useState } from "react";
import { Loader2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

export function TarifaEditable({
  id,
  value,
  onSaved,
}: {
  id: string;
  value: number;
  onSaved: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(String(value));
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [editing, value]);

  async function commit() {
    const n = parseFloat(draft);
    if (isNaN(n) || n < 0) {
      setError("Valor inválido");
      return;
    }
    if (n === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    const { error } = await supabase.from("centros_costo").update({ tarifa: n }).eq("id", id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onSaved(n);
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="font-medium hover:bg-secondary/60 rounded px-2 py-0.5 transition-colors"
        title="Click para editar"
      >
        {formatCOP(value)}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <input
        ref={inputRef}
        type="number"
        min="0"
        step="1000"
        value={draft}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-28 rounded border border-primary/40 bg-background px-2 py-0.5 text-sm text-right"
      />
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <>
          <button onClick={commit} className="p-0.5 text-success hover:bg-success/10 rounded" title="Guardar">
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={() => setEditing(false)}
            className="p-0.5 text-muted-foreground hover:bg-secondary rounded"
            title="Cancelar"
          >
            <X className="h-4 w-4" />
          </button>
        </>
      )}
      {error && <span className="text-xs text-destructive ml-1">{error}</span>}
    </div>
  );
}
