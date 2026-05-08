import { useEffect, useRef, useState } from "react";
import { Loader2, Check, X, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function DepartamentoEditable({
  id,
  value,
  options,
  onSaved,
}: {
  id: string;
  value: string | null;
  options: string[];
  onSaved: (v: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = `depto-list-${id}`;

  useEffect(() => {
    if (editing) {
      setDraft(value ?? "");
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [editing, value]);

  async function commit() {
    const next = draft.trim() || null;
    if ((next ?? "") === (value ?? "")) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    const { error } = await supabase.from("centros_costo").update({ departamento: next }).eq("id", id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onSaved(next);
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="group flex items-center gap-1 text-left hover:bg-secondary/60 rounded px-2 py-0.5 transition-colors"
        title="Click para editar"
      >
        <span className={value ? "" : "text-muted-foreground italic"}>{value ?? "—"}</span>
        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef}
        list={listId}
        value={draft}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-40 rounded border border-primary/40 bg-background px-2 py-0.5 text-sm"
        placeholder="Departamento"
      />
      <datalist id={listId}>
        {options.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
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
