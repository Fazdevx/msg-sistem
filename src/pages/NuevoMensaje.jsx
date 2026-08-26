import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import {
  ArrowLeft, Send, Loader2, Paperclip, Info, Search,
  Building2, User, X, AlertCircle, Upload, FileText, Image, File
} from "lucide-react";
import { toast } from "../components/Toast";

function FilePreview({ file, onRemove }) {
  const icon = file.type.startsWith("image/") ? Image : FileText;
  const Icon = icon;
  const sizeKB = (file.size / 1024).toFixed(1);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">{sizeKB} KB</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function NuevoMensajePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [tipos, setTipos] = useState([]);
  const [areas, setAreas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [searchDest, setSearchDest] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [archivos, setArchivos] = useState([]);

  const [form, setForm] = useState({
    tipo_personalizado_id: "",
    asunto: "",
    cuerpo: "",
    destino_tipo: "area",
    destino_id: "",
  });

  useEffect(() => {
    let cancelled = false;
    api.dataCrear().then((data) => {
      if (cancelled) return;
      setTipos(data.tipos || []);
      setAreas(data.areas || []);
      setUsuarios(data.usuarios || []);
      setLoadingData(false);
    }).catch((err) => {
      if (cancelled) return;
      setError("Error al cargar datos: " + err.message);
      setLoadingData(false);
    });
    return () => { cancelled = true; };
  }, []);

  const tipo = tipos.find((t) => t.id === form.tipo_personalizado_id);
  const areaSeleccionada = areas.find((a) => a.id === form.destino_id);
  const usuariosEnArea = areaSeleccionada
    ? usuarios.filter((u) => u.area_id === form.destino_id)
    : [];

  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList).filter((f) => f.size <= 10 * 1024 * 1024);
    if (newFiles.length < fileList.length) {
      toast({ title: "Archivo muy grande", description: "Algunos archivos superan los 10MB y se omitieron", variant: "warning" });
    }
    setArchivos((prev) => [...prev, ...newFiles].slice(0, 5));
  };

  const removeFile = (index) => {
    setArchivos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.destino_id) {
      toast({ title: "Campo requerido", description: "Seleccioná un destinatario", variant: "warning" });
      return;
    }
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("tipo_personalizado_id", form.tipo_personalizado_id);
    formData.append("asunto", form.asunto);
    formData.append("cuerpo", form.cuerpo);
    formData.append("destino_tipo", form.destino_tipo);
    formData.append("destino_id", form.destino_id);
    archivos.forEach((file) => formData.append("archivos", file));

    try {
      await api.crear(formData);
      toast({ title: "Mensaje enviado", description: "Se ha enviado correctamente", variant: "success" });
      navigate("/mensajes");
    } catch (err) {
      const msg = err.message === "Failed to fetch"
        ? "Error de conexión con el servidor"
        : err.message;
      setError(msg);
      toast({ title: "Error al enviar", description: msg, variant: "error" });
    }
    setLoading(false);
  };

  if (loadingData) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
            <div className="space-y-1"><div className="h-5 w-40 bg-muted rounded animate-pulse" /><div className="h-3 w-24 bg-muted rounded animate-pulse" /></div>
          </div>
          <div className="rounded-xl bg-card shadow-sm p-6 space-y-5">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                <div className="h-9 w-full bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !loadingData) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-8 w-8 text-destructive mb-3" />
          <p className="text-sm font-medium">{error}</p>
          <button onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center gap-2 h-8 px-3 rounded-lg border border-border text-sm hover:bg-accent">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6 max-w-3xl mx-auto animate-fadeIn">
        <div className="flex items-center gap-4">
          <Link to="/mensajes" className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Nuevo mensaje</h1>
            <p className="text-xs text-muted-foreground">Comunicación interna del colegio</p>
          </div>
        </div>

        <div className="rounded-xl bg-card shadow-sm">
          <div className="border-b border-border bg-muted/20 px-5 py-3">
            <h2 className="text-sm font-medium">Redactar mensaje</h2>
          </div>
          <div className="p-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-medium">Tipo de mensaje</label>
                <select
                  value={form.tipo_personalizado_id}
                  onChange={(e) => setForm({ ...form, tipo_personalizado_id: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Seleccionar tipo...</option>
                  {tipos.map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre}{t.requiere_aprobacion ? " (Requiere aprobación)" : ""}</option>
                  ))}
                </select>
                {tipo && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                    <Info className="h-3 w-3 shrink-0" />
                    {tipo.requiere_aprobacion ? "Este tipo de mensaje requiere aprobación antes de finalizar." : "Se enviará directamente a los destinatarios."}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">Asunto</label>
                <input
                  value={form.asunto}
                  onChange={(e) => setForm({ ...form, asunto: e.target.value })}
                  placeholder="Ingresá el asunto del mensaje..."
                  required
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">Mensaje</label>
                <textarea
                  value={form.cuerpo}
                  onChange={(e) => setForm({ ...form, cuerpo: e.target.value })}
                  placeholder="Escribí el contenido del mensaje..."
                  rows={8}
                  className="w-full p-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y min-h-[150px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">Archivos adjuntos (opcional)</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    dragOver ? "border-primary bg-primary/5" : "border-border hover:bg-accent/30"
                  }`}
                >
                  <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {dragOver ? "Soltá los archivos aquí" : "Arrastrá archivos o hacé clic para adjuntar"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, imágenes — Máx. 10MB por archivo</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt,.zip"
                    onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
                    className="hidden"
                  />
                </div>
                {archivos.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {archivos.map((file, i) => (
                      <FilePreview key={i} file={file} onRemove={() => removeFile(i)} />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-xs font-medium">Destinatarios</label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, destino_tipo: "area", destino_id: "" })}
                    className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-colors ${
                      form.destino_tipo === "area"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "border border-border hover:bg-accent"
                    }`}
                  >
                    <Building2 className="h-3.5 w-3.5" /> Área
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, destino_tipo: "usuario", destino_id: "" })}
                    className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-colors ${
                      form.destino_tipo === "usuario"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "border border-border hover:bg-accent"
                    }`}
                  >
                    <User className="h-3.5 w-3.5" /> Usuario
                  </button>
                </div>

                {form.destino_tipo === "area" ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        placeholder="Buscar área..."
                        value={searchDest}
                        onChange={(e) => setSearchDest(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2 rounded-lg p-2">
                      {(searchDest
                        ? areas.filter((a) => a.nombre.toLowerCase().includes(searchDest.toLowerCase()))
                        : areas
                      ).map((area) => {
                        const count = usuarios.filter((u) => u.area_id === area.id).length;
                        const selected = form.destino_id === area.id;
                        return (
                          <button
                            type="button"
                            key={area.id}
                            onClick={() => setForm({ ...form, destino_id: area.id })}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border border-border text-left transition-colors ${
                              selected
                                ? "border-primary bg-primary/5 ring-1 ring-ring"
                                : "hover:bg-accent/50"
                            }`}
                          >
                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                              selected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                            }`}>
                              <Building2 className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{area.nombre}</p>
                              <p className="text-xs text-muted-foreground">{count} {count === 1 ? "usuario" : "usuarios"}</p>
                            </div>
                            {selected && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary text-primary-foreground shrink-0">
                                Seleccionado
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {form.destino_id && (
                      <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
                        Se enviará a <strong>{areaSeleccionada?.nombre}</strong> ({usuariosEnArea.length} {usuariosEnArea.length === 1 ? "usuario" : "usuarios"})
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        placeholder="Buscar usuario..."
                        value={searchDest}
                        onChange={(e) => setSearchDest(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2 rounded-lg p-2">
                      {(searchDest
                        ? usuarios.filter((u) => `${u.nombre} ${u.apellido} ${u.areas?.nombre || ""}`.toLowerCase().includes(searchDest.toLowerCase()))
                        : usuarios
                      ).map((u) => {
                        const selected = form.destino_id === u.id;
                        return (
                          <button
                            type="button"
                            key={u.id}
                            onClick={() => setForm({ ...form, destino_id: u.id })}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border border-border text-left transition-colors ${
                              selected
                                ? "border-primary bg-primary/5 ring-1 ring-ring"
                                : "hover:bg-accent/50"
                            }`}
                          >
                            <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                              selected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                            }`}>
                              {u.nombre?.[0]}{u.apellido?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{u.nombre} {u.apellido}</p>
                              <p className="text-xs text-muted-foreground">{u.areas?.nombre || "Sin área"} · {u.rol}</p>
                            </div>
                            {selected && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary text-primary-foreground shrink-0">
                                Seleccionado
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-xs text-destructive">{error}</p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <button
                  type="submit"
                  disabled={loading || !form.destino_id}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Enviar mensaje
                </button>
                <Link to="/mensajes"
                  className="inline-flex items-center h-9 px-4 rounded-lg text-sm hover:bg-accent transition-colors">
                  Cancelar
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
