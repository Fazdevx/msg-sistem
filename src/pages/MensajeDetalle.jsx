import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useState } from "react";
import {
  ArrowLeft, Paperclip, CheckCircle, XCircle, Building2,
  Calendar, Clock, Loader2, Ban, Reply,
  Send, AlertCircle, Download, Eye
} from "lucide-react";
import { estadoBadge, tipoBadge } from "../lib/utils";
import { toast } from "../components/Toast";

export function MensajeDetallePage() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const queryClient = useQueryClient();
  const [comentario, setComentario] = useState("");
  const [loadingAprobar, setLoadingAprobar] = useState(null);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  const { data: mensaje, isLoading, error } = useQuery({
    queryKey: ["mensaje", id],
    queryFn: () => api.detalle(id),
    retry: 1,
    staleTime: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["no-leidos"] });
    },
  });

  const aprobarMutation = useMutation({
    mutationFn: ({ estado, comentario }) => api.aprobar(id, estado, comentario),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mensaje", id] });
      queryClient.invalidateQueries({ queryKey: ["recibidos"] });
      queryClient.invalidateQueries({ queryKey: ["no-leidos"] });
      toast({ title: "Listo", description: "La aprobación se registró correctamente", variant: "success" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "error" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          </div>
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border bg-muted/20 p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-2 w-24 bg-muted rounded animate-pulse" />
                </div>
              </div>
              <div className="h-5 w-3/4 bg-muted rounded animate-pulse mt-4" />
            </div>
            <div className="p-5 space-y-2">
              <div className="h-3 w-full bg-muted rounded animate-pulse" />
              <div className="h-3 w-full bg-muted rounded animate-pulse" />
              <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !mensaje) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-8 w-8 text-destructive mb-3" />
          <p className="text-sm font-medium">No se pudo cargar el mensaje</p>
          <p className="text-xs text-muted-foreground mt-1">{error?.message || "Mensaje no encontrado"}</p>
          <Link to="/mensajes" className="mt-4 inline-flex items-center gap-2 h-8 px-3 rounded-lg border border-border text-sm hover:bg-accent">
            <ArrowLeft className="h-3.5 w-3.5" /> Volver a la bandeja
          </Link>
        </div>
      </div>
    );
  }

  const m = mensaje;
  const esRemitente = usuario?.id === m.remitente_id;
  const estadoFinal = m.estado === "aprobado" || m.estado === "rechazado";
  const requiereAprobacion = m.tipo_base === "aprobacion" && !estadoFinal;
  const puedeAprobar = requiereAprobacion && !esRemitente;

  const handleAprobar = async (estado) => {
    setLoadingAprobar(estado);
    await aprobarMutation.mutateAsync({ estado, comentario: comentario || null });
    setLoadingAprobar(null);
    setComentario("");
  };

  const handleReply = async () => {
    if (!replyBody.trim()) {
      toast({ title: "Escribí un mensaje", description: "El cuerpo no puede estar vacío", variant: "warning" });
      return;
    }
    setReplyLoading(true);
    try {
      await api.crear({
        tipo_personalizado_id: "",
        asunto: `Re: ${m.asunto}`,
        cuerpo: replyBody,
        destino_tipo: "usuario",
        destino_id: m.remitente_id,
      });
      toast({ title: "Respuesta enviada", description: `Enviada a ${m.remitente?.nombre} ${m.remitente?.apellido}`, variant: "success" });
      setReplyOpen(false);
      setReplyBody("");
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "error" });
    }
    setReplyLoading(false);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-4 max-w-4xl mx-auto animate-fadeIn">
        <div className="flex items-center gap-3">
          <Link to="/mensajes"
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs text-muted-foreground">Volver a la bandeja</span>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border bg-muted/20 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary shrink-0">
                    {m.remitente?.nombre?.[0]}{m.remitente?.apellido?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m.remitente?.nombre} {m.remitente?.apellido || "Usuario"}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Building2 className="h-3 w-3" /> {m.remitente?.areas?.nombre || "Área desconocida"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(m.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(m.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] px-2 py-1 rounded border text-muted-foreground border-border">
                  {tipoBadge(m.tipo_base)}
                </span>
                <span className={`text-[10px] px-2 py-1 rounded ${
                  m.estado === "pendiente" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                  m.estado === "aprobado" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                  m.estado === "rechazado" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" : "bg-muted text-muted-foreground"
                }`}>
                  {estadoBadge(m.estado)}
                </span>
              </div>
            </div>
            <h1 className="text-lg font-semibold mt-4">{m.asunto}</h1>
          </div>

          <div className="p-5 space-y-6">
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {m.cuerpo || <span className="text-muted-foreground italic">Sin contenido</span>}
            </div>

            {m.documentos?.length > 0 && (
              <div className="rounded-lg bg-muted/20 p-4 space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Documentos adjuntos ({m.documentos.length})
                </h3>
                <div className="space-y-2">
                  {m.documentos.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:bg-accent/50 transition-colors group"
                    >
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Paperclip className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.nombre_original}</p>
                        <p className="text-xs text-muted-foreground">{(doc.tamano_bytes / 1024).toFixed(1)} KB</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent">
                          <Eye className="h-4 w-4" />
                        </span>
                        <span className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent">
                          <Download className="h-4 w-4" />
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {m.tipo_base === "aprobacion" && (
              <div className="border-t border-border pt-6 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Flujo de aprobación
                </h3>

                {estadoFinal ? (
                  <div className="space-y-3">
                    {(m.aprobaciones || []).map((ap) => (
                      <div
                        key={ap.id}
                        className={`p-4 rounded-lg border ${
                          ap.estado === "aprobado"
                            ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20"
                            : "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {ap.estado === "aprobado" ? (
                            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {ap.estado === "aprobado" ? "Aprobado" : "Rechazado"}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                ap.estado === "aprobado"
                                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                              }`}>
                                {estadoBadge(ap.estado)}
                              </span>
                            </div>
                            {ap.comentario && (
                              <p className="text-xs text-muted-foreground mt-0.5">{ap.comentario}</p>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {new Date(ap.created_at).toLocaleDateString("es-AR", {
                                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : esRemitente ? (
                  <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-muted/20">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <Ban className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Esperando aprobación</p>
                      <p className="text-xs text-muted-foreground">No podés aprobar tu propio mensaje. Un destinatario lo hará.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <textarea
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      placeholder="Agregar comentario (opcional)..."
                      className="w-full min-h-[80px] p-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                    {aprobarMutation.isError && (
                      <p className="text-xs text-destructive">{aprobarMutation.error.message}</p>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAprobar("aprobado")}
                        disabled={loadingAprobar !== null}
                        className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        {loadingAprobar === "aprobado" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleAprobar("rechazado")}
                        disabled={loadingAprobar !== null}
                        className="flex-1 h-9 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        {loadingAprobar === "rechazado" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Rechazar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!esRemitente && (
              <div className="border-t border-border pt-6">
                {!replyOpen ? (
                  <button
                    onClick={() => setReplyOpen(true)}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors"
                  >
                    <Reply className="h-4 w-4" />
                    Responder a {m.remitente?.nombre}
                  </button>
                ) : (
                  <div className="space-y-3 bg-muted/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Reply className="h-4 w-4 text-primary" />
                        Responder a {m.remitente?.nombre} {m.remitente?.apellido}
                      </p>
                      <button
                        onClick={() => { setReplyOpen(false); setReplyBody(""); }}
                        className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                    <input
                      value={`Re: ${m.asunto}`}
                      readOnly
                      className="w-full h-8 px-3 rounded-lg border border-border bg-muted/50 text-sm text-muted-foreground"
                    />
                    <textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder="Escribí tu respuesta..."
                      rows={4}
                      autoFocus
                      className="w-full p-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setReplyOpen(false); setReplyBody(""); }}
                        className="h-8 px-3 rounded-lg text-sm hover:bg-accent transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleReply}
                        disabled={replyLoading || !replyBody.trim()}
                        className="inline-flex items-center gap-2 h-8 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        {replyLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        Enviar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
