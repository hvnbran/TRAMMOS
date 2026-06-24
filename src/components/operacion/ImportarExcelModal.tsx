import { useState } from "react";
import * as XLSX from "xlsx";
import { X, Upload, Loader2, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Cliente = "corona" | "sodimac";
type ParsedRow = {
  cliente: Cliente;
  origen: string;
  destino: string;
  departamento: string | null;
  tipo: string;
  tarifa: number;
  yellow: boolean;
};

const TIPOS_VALIDOS = ["Empresarial", "Turismo", "Salud", "Escolar", "Otro"];
function normalizarTipo(raw: unknown): string {
  if (!raw) return "Empresarial";
  const n = NORM(String(raw));
  for (const t of TIPOS_VALIDOS) {
    if (NORM(t) === n) return t;
  }
  if (n.includes("EMPRES")) return "Empresarial";
  if (n.includes("TURISM")) return "Turismo";
  if (n.includes("SALUD")) return "Salud";
  if (n.includes("ESCOL") || n.includes("COLEGIO")) return "Escolar";
  return "Otro";
}

const NORM = (s: string) =>
  s
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();

function findCol(headers: string[], candidates: string[]): number {
  const norm = headers.map((h) => NORM(h || ""));
  for (const c of candidates) {
    const idx = norm.indexOf(NORM(c));
    if (idx >= 0) return idx;
  }
  return -1;
}

export function ImportarExcelModal({
  defaultCliente,
  onClose,
  onDone,
}: {
  defaultCliente: Cliente | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [onlyYellow, setOnlyYellow] = useState(false);
  const [clienteMode, setClienteMode] = useState<"auto" | "corona" | "sodimac">(
    defaultCliente ?? "auto",
  );
  const [prefijo, setPrefijo] = useState("RUT");
  const [updateExisting, setUpdateExisting] = useState(true);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<{ inserted: number; updated: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(f: File) {
    setFile(f);
    setParsing(true);
    setError(null);
    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellStyles: true });
      const all: ParsedRow[] = [];
      for (const sn of wb.SheetNames) {
        const ws = wb.Sheets[sn];
        const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null }) as unknown[][];
        if (!aoa.length) continue;
        // find header row (first row with mostly strings)
        let headerIdx = 0;
        for (let i = 0; i < Math.min(aoa.length, 5); i++) {
          const r = aoa[i];
          if (r && r.some((c) => typeof c === "string" && /VALOR|ORIGEN|DESTINO/i.test(String(c)))) {
            headerIdx = i;
            break;
          }
        }
        const headers = aoa[headerIdx].map((h) => String(h ?? ""));
        const cOrigen = findCol(headers, ["ORIGEN"]);
        const cDestino = findCol(headers, ["DESTINO"]);
        const cValor = findCol(headers, ["VALOR UNITARIO", "VALOR", "TARIFA", "PRECIO"]);
        const cDepto = findCol(headers, ["CIUDAD", "DEPARTAMENTO", "DEPTO"]);
        const cSodimac = findCol(headers, ["SODIMAC URBANA", "SODIMAC", "CLIENTE SODIMAC"]);
        const cCliente = findCol(headers, ["CLIENTE"]);
        const cTipo = findCol(headers, ["TIPO EMPRESA", "TIPO SERVICIO", "TIPO"]);
        if (cOrigen < 0 || cDestino < 0 || cValor < 0) continue;

        for (let r = headerIdx + 1; r < aoa.length; r++) {
          const row = aoa[r];
          if (!row) continue;
          const origen = row[cOrigen];
          const destino = row[cDestino];
          const valor = row[cValor];
          if (!origen || !destino) continue;
          const tarifa = typeof valor === "number" ? valor : parseFloat(String(valor || "").replace(/[^\d.-]/g, ""));
          if (!tarifa || isNaN(tarifa) || tarifa <= 0) continue;

          // Detect yellow fill on the valor cell
          const cellAddr = XLSX.utils.encode_cell({ r, c: cValor });
          const cell = ws[cellAddr];
          const fg = cell?.s?.fgColor?.rgb || cell?.s?.bgColor?.rgb;
          const yellow = !!(fg && /FFFF00|FFFFFF00|FFFF/i.test(String(fg)));

          let cliente: Cliente = "corona";
          if (clienteMode === "auto") {
            const clienteRaw = cCliente >= 0 ? row[cCliente] : null;
            if (clienteRaw) {
              cliente = NORM(String(clienteRaw)).includes("SODIMAC") ? "sodimac" : "corona";
            } else {
              const sodimacMark = cSodimac >= 0 ? row[cSodimac] : null;
              cliente = sodimacMark ? "sodimac" : "corona";
            }
          } else {
            cliente = clienteMode;
          }

          const tipo = cTipo >= 0 ? normalizarTipo(row[cTipo]) : "Empresarial";

          all.push({
            cliente,
            origen: String(origen).trim(),
            destino: String(destino).trim(),
            departamento: row[cDepto] ? String(row[cDepto]).trim() : null,
            tipo,
            tarifa,
            yellow,
          });
        }
      }
      setRows(all);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError("No se pudo leer el archivo: " + msg);
    } finally {
      setParsing(false);
    }
  }

  // Re-derivar cliente cuando cambia el modo (sin re-parsear)
  const filtered = rows
    .filter((r) => (onlyYellow ? r.yellow : true))
    .map((r) => ({ ...r, cliente: clienteMode === "auto" ? r.cliente : clienteMode }));

  // Dedupe
  const seen = new Set<string>();
  const unique = filtered.filter((r) => {
    const k = `${r.cliente}|${r.origen.toLowerCase()}|${r.destino.toLowerCase()}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  async function importar() {
    if (!unique.length) return;
    setImporting(true);
    setError(null);
    setProgress({ done: 0, total: unique.length });
    let inserted = 0,
      updated = 0,
      skipped = 0;
    try {
      // Pre-cargar existentes por cliente
      const clientesUsados = Array.from(new Set(unique.map((r) => r.cliente)));
      const existing = new Map<string, string>(); // key -> id
      for (const c of clientesUsados) {
        const { data } = await supabase
          .from("centros_costo")
          .select("id,origen,destino")
          .eq("cliente", c);
        (data ?? []).forEach((r) => {
          existing.set(`${c}|${r.origen.toLowerCase()}|${r.destino.toLowerCase()}`, r.id);
        });
      }

      // Próximo número de código
      const { data: codeRows } = await supabase
        .from("centros_costo")
        .select("codigo")
        .like("codigo", `${prefijo}-%`);
      let next = 1;
      (codeRows ?? []).forEach((r) => {
        const m = /-(\d+)/.exec(r.codigo);
        if (m) next = Math.max(next, parseInt(m[1], 10) + 1);
      });

      const toInsert: Array<{
        codigo: string;
        cliente: Cliente;
        origen: string;
        destino: string;
        departamento: string | null;
        tipo: string;
        tarifa: number;
      }> = [];
      const toUpdate: Array<{ id: string; tarifa: number }> = [];

      for (const r of unique) {
        const k = `${r.cliente}|${r.origen.toLowerCase()}|${r.destino.toLowerCase()}`;
        const existId = existing.get(k);
        if (existId) {
          if (updateExisting) toUpdate.push({ id: existId, tarifa: r.tarifa });
          else skipped++;
        } else {
          toInsert.push({
            codigo: `${prefijo}-${String(next++).padStart(3, "0")}`,
            cliente: r.cliente,
            origen: r.origen,
            destino: r.destino,
            departamento: r.departamento,
            tipo: r.tipo,
            tarifa: r.tarifa,
          });
        }
      }

      // Insert en lotes
      for (let i = 0; i < toInsert.length; i += 100) {
        const batch = toInsert.slice(i, i + 100);
        const { error } = await supabase.from("centros_costo").insert(batch);
        if (error) throw error;
        inserted += batch.length;
        setProgress({ done: inserted + updated + skipped, total: unique.length });
      }
      // Updates uno a uno (cantidad pequeña usual)
      for (const u of toUpdate) {
        const { error } = await supabase.from("centros_costo").update({ tarifa: u.tarifa }).eq("id", u.id);
        if (error) throw error;
        updated++;
        setProgress({ done: inserted + updated + skipped, total: unique.length });
      }

      setResult({ inserted, updated, skipped });
      onDone();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError("Error al importar: " + msg);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-lg border border-border bg-card shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar tarifas desde Excel
          </h3>
          <button onClick={onClose} disabled={importing} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {!file && (
            <label className="block cursor-pointer rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-secondary/30 transition-colors p-10 text-center">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Selecciona un archivo .xlsx</p>
              <p className="text-xs text-muted-foreground mt-1">
                Columnas reconocidas: ORIGEN, DESTINO, VALOR, CLIENTE, DEPARTAMENTO, TIPO EMPRESA
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>
          )}

          {parsing && (
            <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Leyendo archivo...
            </div>
          )}

          {file && !parsing && (
            <>
              <div className="flex items-center justify-between rounded-md border border-border bg-secondary/30 px-3 py-2">
                <div className="text-sm">
                  <strong>{file.name}</strong> · {rows.length} filas detectadas ·{" "}
                  <span className="text-primary font-medium">{unique.length} a importar</span>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setRows([]);
                    setResult(null);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                  disabled={importing}
                >
                  Cambiar archivo
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={onlyYellow}
                    onChange={(e) => setOnlyYellow(e.target.checked)}
                    disabled={importing}
                  />
                  Solo amarillas
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    disabled={importing}
                  />
                  Actualizar precios existentes
                </label>
                <div>
                  <label className="text-xs text-muted-foreground">Cliente</label>
                  <select
                    value={clienteMode}
                    disabled={importing}
                    onChange={(e) => setClienteMode(e.target.value as "auto" | Cliente)}
                    className="w-full mt-0.5 rounded-md border border-border bg-background px-2 py-1 text-sm"
                  >
                    <option value="auto">Auto-detectar</option>
                    <option value="corona">Corona</option>
                    <option value="sodimac">Sodimac</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Prefijo código</label>
                  <input
                    type="text"
                    value={prefijo}
                    disabled={importing}
                    onChange={(e) => setPrefijo(e.target.value.toUpperCase().slice(0, 6))}
                    className="w-full mt-0.5 rounded-md border border-border bg-background px-2 py-1 text-sm"
                  />
                </div>
              </div>

              <div className="rounded-md border border-border max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-secondary/50 sticky top-0">
                    <tr>
                      <th className="text-left px-2 py-1">Cliente</th>
                      <th className="text-left px-2 py-1">Origen</th>
                      <th className="text-left px-2 py-1">Destino</th>
                      <th className="text-right px-2 py-1">Tarifa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unique.slice(0, 20).map((r, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-2 py-1 capitalize">{r.cliente}</td>
                        <td className="px-2 py-1">{r.origen}</td>
                        <td className="px-2 py-1">{r.destino}</td>
                        <td className="px-2 py-1 text-right">${r.tarifa.toLocaleString("es-CO")}</td>
                      </tr>
                    ))}
                    {unique.length > 20 && (
                      <tr>
                        <td colSpan={4} className="text-center text-muted-foreground py-2">
                          + {unique.length - 20} filas más
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {importing && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Importando...</span>
                    <span>
                      {progress.done} / {progress.total}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}

              {result && (
                <div className="rounded-md border border-success/30 bg-success/5 px-3 py-2 text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Importadas: {result.inserted} nuevas · {result.updated} actualizadas · {result.skipped} sin cambios
                </div>
              )}
            </>
          )}

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-secondary/30">
          <button
            onClick={onClose}
            disabled={importing}
            className="px-4 py-2 text-sm rounded-md hover:bg-secondary transition-colors"
          >
            {result ? "Cerrar" : "Cancelar"}
          </button>
          {file && !result && (
            <button
              onClick={importar}
              disabled={importing || !unique.length}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {importing && <Loader2 className="h-4 w-4 animate-spin" />}
              Importar {unique.length} rutas
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
