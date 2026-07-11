import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  X, Loader2, User, Phone, IdCard, Calendar, Car, FileText, Camera, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { DocumentManager, TIPOS_CONDUCTOR } from "@/components/DocumentManager";

interface ConductorFull {
  id: string;
  nombre: string;
  cedula: string | null;
  telefono: string | null;
  licencia: string | null;
  categoria_lic: string | null;
  estado: string;
  vence_licencia: string | null;
  cliente: "corona" | "sodimac" | "hospital_sur" | null;
  clientes: ("corona" | "sodimac" | "hospital_sur")[] | null;
  foto_url: string | null;
}

interface VehiculoLite {
  id: string;
  placa: string;
  marca: string | null;
  linea: string | null;
  foto_url: string | null;
  es_principal: boolean;
}

interface Props {
  conductorId: string;
  onClose: () => void;
}

function isVencido(fechaISO: string | null): boolean {
  if (!fechaISO) return false;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const f = new Date(fechaISO); f.setHours(0, 0, 0, 0);
  return f.getTime() < hoy.getTime();
}

export function ConductorProfileModal({ conductorId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [conductor, setConductor] = useState<ConductorFull | null>(null);
  const [vehiculos, setVehiculos] = useState<VehiculoLite[]>([]);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  async function load() {
    setLoading(true);
    const { data: c } = await supabase
      .from("conductores")
      .select("id,nombre,cedula,telefono,licencia,categoria_lic,estado,vence_licencia,cliente,clientes,foto_url")
      .eq("id", conductorId)
      .single();
    if (c) setConductor(c as ConductorFull);

    // Vehículos asignados al conductor
    const { data: asign } = await (supabase.from("vehiculo_conductores") as any)
      .select("vehiculo_id, es_principal")
      .eq("conductor_id", conductorId);
    const vIds = (asign ?? []).map((a: { vehiculo_id: string }) => a.vehiculo_id);
    if (vIds.length > 0) {
      const { data: vs } = await supabase
        .from("vehiculos")
        .select("id,placa,marca,linea,foto_url")
        .in("id", vIds);
      const principalMap = new Map<string, boolean>(
        (asign ?? []).map((a: { vehiculo_id: string; es_principal: boolean }) => [a.vehiculo_id, a.es_principal]),
      );
      setVehiculos(((vs ?? []) as Omit<VehiculoLite, "es_principal">[]).map((v) => ({
        ...v,
        es_principal: principalMap.get(v.id) ?? false,
      })));
    } else {
      setVehiculos([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conductorId]);

  // Cerrar con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleFotoUpload(file: File) {
    if (!conductor) return;
    if (!file.type.startsWith("image/")) { alert("Selecciona una imagen"); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Máximo 5 MB"); return; }
    setUploadingFoto(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const cli = (conductor.clientes?.[0] ?? conductor.cliente ?? "general");
    const path = `${cli}/conductor-foto-${conductor.id}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("vehiculos-fotos")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) { alert(upErr.message); setUploadingFoto(false); return; }
    const { data: pub } = supabase.storage.from("vehiculos-fotos").getPublicUrl(path);
    await supabase.from("conductores").update({ foto_url: pub.publicUrl } as any).eq("id", conductor.id);
    setUploadingFoto(false);
    load();
  }

  const cliente = (conductor?.clientes?.[0] ?? conductor?.cliente ?? "corona") as "corona" | "sodimac" | "hospital_sur";
  const licVencida = isVencido(conductor?.vence_licencia ?? null);

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start sm:items-center justify-center overflow-y-auto p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Perfil de conductor"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl w-full max-w-3xl my-4 shadow-xl animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Perfil del conductor
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading || !conductor ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="p-4 sm:p-5 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Datos principales */}
            <section className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Foto */}
              <div className="relative shrink-0">
                <div className="h-28 w-28 rounded-full overflow-hidden bg-secondary/40 border-4 border-background ring-2 ring-border">
                  {conductor.foto_url ? (
                    <img src={conductor.foto_url} alt={conductor.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                      <User className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <label
                  htmlFor={`foto-cond-${conductor.id}`}
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-md hover:scale-105 transition-transform"
                  title={conductor.foto_url ? "Cambiar foto" : "Subir foto"}
                >
                  {uploadingFoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </label>
                <input
                  id={`foto-cond-${conductor.id}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFotoUpload(f);
                    e.target.value = "";
                  }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold">{conductor.nombre}</h3>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {((conductor.clientes && conductor.clientes.length > 0) ? conductor.clientes : (conductor.cliente ? [conductor.cliente] : [])).length === 0 ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/30">Sin cliente asignado</span>
                  ) : (
                    ((conductor.clientes && conductor.clientes.length > 0) ? conductor.clientes : [conductor.cliente!]).map((cl) => (
                      <span key={cl} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30 capitalize">{cl}</span>
                    ))
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    licVencida ? "bg-destructive/15 text-destructive" :
                    conductor.estado === "Activo" ? "bg-success/15 text-success" :
                    "bg-warning/15 text-warning"
                  }`}>
                    {licVencida ? "Licencia vencida" : conductor.estado}
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-start gap-2">
                    <IdCard className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                    <div><dt className="text-muted-foreground">Cédula</dt><dd className="font-medium">{conductor.cedula || "—"}</dd></div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                    <div>
                      <dt className="text-muted-foreground">Teléfono</dt>
                      <dd className="font-medium">
                        {conductor.telefono ? (
                          <a href={`tel:${conductor.telefono}`} className="text-primary hover:underline">{conductor.telefono}</a>
                        ) : "—"}
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                    <div><dt className="text-muted-foreground">Licencia</dt><dd className="font-medium">{conductor.licencia || "—"} {conductor.categoria_lic ? `· ${conductor.categoria_lic}` : ""}</dd></div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                    <div>
                      <dt className="text-muted-foreground">Vence licencia</dt>
                      <dd className={`font-medium ${licVencida ? "text-destructive" : ""}`}>{conductor.vence_licencia || "—"}</dd>
                    </div>
                  </div>
                </dl>

                {licVencida && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-destructive">
                    <AlertTriangle className="h-3 w-3" /> Actualice la fecha de vencimiento para reactivar al conductor.
                  </div>
                )}
              </div>
            </section>

            {/* Vehículos asignados */}
            <section>
              <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                <Car className="h-4 w-4 text-primary" /> Vehículos que maneja
                <span className="text-xs font-normal text-muted-foreground">({vehiculos.length})</span>
              </h4>
              {vehiculos.length === 0 ? (
                <div className="text-xs text-muted-foreground rounded-md border border-dashed border-border px-3 py-3 text-center">
                  Este conductor no tiene vehículos asignados aún.
                </div>
              ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {vehiculos.map((v) => (
                    <li key={v.id} className="flex items-center gap-2 rounded-md border border-border bg-secondary/30 p-2">
                      <div className="h-12 w-16 rounded bg-background overflow-hidden shrink-0 flex items-center justify-center">
                        {v.foto_url ? (
                          <img src={v.foto_url} alt={v.placa} className="w-full h-full object-cover" />
                        ) : (
                          <Car className="h-5 w-5 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm flex items-center gap-1.5">
                          {v.placa}
                          {v.es_principal && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-warning/15 text-warning font-medium">Principal</span>
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {[v.marca, v.linea].filter(Boolean).join(" ") || "Sin detalles"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Documentos del conductor */}
            <section>
              <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                <FileText className="h-4 w-4 text-primary" /> Documentos
                <CheckCircle2 className="h-3 w-3 text-success ml-auto" aria-hidden="true" />
              </h4>
              <DocumentManager
                kind="conductor"
                entityId={conductor.id}
                cliente={cliente}
                tipos={TIPOS_CONDUCTOR}
              />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
