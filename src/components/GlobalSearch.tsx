import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Loader2, Users, Car, Route as RouteIcon, FileText, FolderOpen, MapPin, AlertTriangle, X } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

type ResultKind =
  | "conductor"
  | "vehiculo"
  | "servicio"
  | "factura"
  | "formato"
  | "centro_costo"
  | "incidente";

interface SearchResult {
  kind: ResultKind;
  id: string;
  title: string;
  subtitle: string;
  to: string;
}

const KIND_META: Record<ResultKind, { label: string; icon: typeof Users; color: string }> = {
  conductor: { label: "Conductor", icon: Users, color: "text-primary" },
  vehiculo: { label: "Vehículo", icon: Car, color: "text-accent" },
  servicio: { label: "Servicio", icon: RouteIcon, color: "text-warning" },
  factura: { label: "Factura", icon: FileText, color: "text-success" },
  formato: { label: "Formato", icon: FolderOpen, color: "text-primary" },
  centro_costo: { label: "Centro de costo", icon: MapPin, color: "text-accent" },
  incidente: { label: "Incidente", icon: AlertTriangle, color: "text-destructive" },
};

export function GlobalSearch() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Cmd/Ctrl + K to focus
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Debounced search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(() => {
      runSearch(q);
    }, 250);
    return () => clearTimeout(handle);
  }, [query, isAdmin]);

  async function runSearch(q: string) {
    const like = `%${q}%`;
    try {
      const queries: Promise<SearchResult[]>[] = [
        // Conductores
        Promise.resolve(
          supabase
            .from("conductores")
            .select("id, nombre, cedula, telefono, estado")
            .or(`nombre.ilike.${like},cedula.ilike.${like},telefono.ilike.${like}`)
            .limit(5)
        ).then(({ data }) =>
          (data ?? []).map<SearchResult>((c) => ({
            kind: "conductor",
            id: c.id,
            title: c.nombre,
            subtitle: [c.cedula, c.estado].filter(Boolean).join(" • "),
            to: "/conductores",
          }))
        ),
        // Vehículos
        Promise.resolve(
          supabase
            .from("vehiculos")
            .select("id, placa, marca, linea, modelo, conductor")
            .or(`placa.ilike.${like},marca.ilike.${like},linea.ilike.${like},conductor.ilike.${like}`)
            .limit(5)
        ).then(({ data }) =>
          (data ?? []).map<SearchResult>((v) => ({
            kind: "vehiculo",
            id: v.id,
            title: v.placa,
            subtitle: [v.marca, v.linea, v.modelo].filter(Boolean).join(" "),
            to: `/vehiculos?open=${v.id}`,
          }))
        ),
        // Servicios
        Promise.resolve(
          supabase
            .from("servicios")
            .select("id, numero_orden, pasajero, origen, destino, fecha")
            .or(
              `numero_orden.ilike.${like},pasajero.ilike.${like},origen.ilike.${like},destino.ilike.${like}`
            )
            .limit(5)
        ).then(({ data }) =>
          (data ?? []).map<SearchResult>((s) => ({
            kind: "servicio",
            id: s.id,
            title: s.numero_orden || s.pasajero || "Servicio",
            subtitle:
              [s.origen, s.destino].filter(Boolean).join(" → ") + (s.fecha ? ` • ${s.fecha}` : ""),
            to: "/servicios",
          }))
        ),
        // Feedback (calificaciones)
        Promise.resolve(
          supabase
            .from("calificaciones")
            .select("id, nombre, servicio, tipo, estrellas")
            .or(`nombre.ilike.${like},servicio.ilike.${like}`)
            .limit(5)
        ).then(({ data }) =>
          (data ?? []).map<SearchResult>((f) => ({
            kind: "servicio",
            id: f.id,
            title: f.nombre,
            subtitle: `${"★".repeat(f.estrellas)} • ${f.tipo}${f.servicio ? ` • ${f.servicio}` : ""}`,
            to: "/feedback",
          }))
        ),
      ];

      // Admin-only sources
      if (isAdmin) {
        queries.push(
          Promise.resolve(
            supabase
              .from("facturas")
              .select("id, numero, periodo, estado, monto")
              .or(`numero.ilike.${like},periodo.ilike.${like},estado.ilike.${like}`)
              .limit(5)
          ).then(({ data }) =>
            (data ?? []).map<SearchResult>((f) => ({
              kind: "factura",
              id: f.id,
              title: f.numero,
              subtitle: `${f.periodo} • ${f.estado} • $${Number(f.monto).toLocaleString()}`,
              to: "/facturacion",
            }))
          ),
          Promise.resolve(
            supabase
              .from("formatos_auditoria")
              .select("id, codigo, nombre, entidad, tipo, estado")
              .or(`codigo.ilike.${like},nombre.ilike.${like},entidad.ilike.${like}`)
              .limit(5)
          ).then(({ data }) =>
            (data ?? []).map<SearchResult>((f) => ({
              kind: "formato",
              id: f.id,
              title: `${f.codigo} — ${f.nombre}`,
              subtitle: `${f.entidad} • ${f.tipo} • ${f.estado}`,
              to: "/formatos",
            }))
          ),
          Promise.resolve(
            supabase
              .from("centros_costo")
              .select("id, codigo, origen, destino, departamento")
              .or(
                `codigo.ilike.${like},origen.ilike.${like},destino.ilike.${like},departamento.ilike.${like}`
              )
              .limit(5)
          ).then(({ data }) =>
            (data ?? []).map<SearchResult>((c) => ({
              kind: "centro_costo",
              id: c.id,
              title: `${c.codigo} • ${c.origen} → ${c.destino}`,
              subtitle: c.departamento ?? "",
              to: "/operacion",
            }))
          ),
          Promise.resolve(
            supabase
              .from("incidentes")
              .select("id, tipo_incidente, conductor, vehiculo, estado, fecha")
              .or(
                `tipo_incidente.ilike.${like},conductor.ilike.${like},vehiculo.ilike.${like},estado.ilike.${like}`
              )
              .limit(5)
          ).then(({ data }) =>
            (data ?? []).map<SearchResult>((i) => ({
              kind: "incidente",
              id: i.id,
              title: i.tipo_incidente,
              subtitle: [i.conductor, i.vehiculo, i.estado, i.fecha].filter(Boolean).join(" • "),
              to: "/cumplimiento",
            }))
          )
        );
      }

      const all = (await Promise.all(queries)).flat();
      setResults(all);
      setActiveIdx(0);
    } catch (err) {
      console.error("Search error", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  const grouped = useMemo(() => {
    const map = new Map<ResultKind, SearchResult[]>();
    for (const r of results) {
      if (!map.has(r.kind)) map.set(r.kind, []);
      map.get(r.kind)!.push(r);
    }
    return Array.from(map.entries());
  }, [results]);

  function handleSelect(r: SearchResult) {
    setOpen(false);
    setQuery("");
    navigate({ to: r.to });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIdx]) {
      e.preventDefault();
      handleSelect(results[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  let flatIdx = -1;

  return (
    <div ref={containerRef} className="relative max-w-md flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Buscar conductores, vehículos, servicios, facturas..."
        className="h-9 w-full rounded-md bg-secondary pl-9 pr-16 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        {query && !loading && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              inputRef.current?.focus();
            }}
            className="p-0.5 rounded hover:bg-muted"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
        {!query && !loading && (
          <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-background border border-border rounded">
            ⌘K
          </kbd>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-[480px] overflow-y-auto rounded-md border border-border bg-popover shadow-lg z-50">
          {loading && results.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">Sin resultados para "{query}"</div>
          ) : (
            grouped.map(([kind, items]) => {
              const meta = KIND_META[kind];
              const Icon = meta.icon;
              return (
                <div key={kind} className="py-1">
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {meta.label}
                  </div>
                  {items.map((r) => {
                    flatIdx++;
                    const isActive = flatIdx === activeIdx;
                    return (
                      <button
                        key={r.id}
                        onMouseEnter={() => setActiveIdx(results.indexOf(r))}
                        onClick={() => handleSelect(r)}
                        className={`w-full flex items-start gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                          isActive ? "bg-accent" : "hover:bg-accent/50"
                        }`}
                      >
                        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${meta.color}`} />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{r.title}</div>
                          {r.subtitle && (
                            <div className="text-xs text-muted-foreground truncate">{r.subtitle}</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
