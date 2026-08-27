import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { Link } from "react-router-dom";
import {
  Inbox, Send, FileText, ChevronRight, Plus, CheckCircle2,
  Clock, Mail, MailOpen, Users, TrendingUp, BarChart3
} from "lucide-react";
import { estadoBadge, tipoBadge, timeAgo } from "../lib/utils";

export function InicioPage() {
  const { usuario } = useAuth();
  const queryClient = useQueryClient();

  const { data: noLeidos } = useQuery({ queryKey: ["no-leidos"], queryFn: () => api.noLeidos() });
  const { data: mensajesData, isLoading } = useQuery({
    queryKey: ["recibidos-inicio"],
    queryFn: () => api.recibidos(1, 5),
  });
  const totalNoLeidos = noLeidos?.total ?? 0;
  const ultimos = (mensajesData?.data || []).filter(Boolean);

  const stats = [
    { label: "No leídos", value: totalNoLeidos, icon: Mail, color: "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10" },
    { label: "Recibidos", value: mensajesData?.total || 0, icon: Inbox, color: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
    { label: "Pendientes", value: ultimos.filter((m) => m.estado === "pendiente").length || 0, icon: Clock, color: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
  ];

  const prefetchBandeja = () => {
    queryClient.prefetchInfiniteQuery({
      queryKey: ["recibidos", "paginated"],
      queryFn: () => api.recibidos(1, 20),
      initialPageParam: 1,
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Buen{new Date().getHours() < 12 ? "os días" : "as tardes"}, {usuario?.nombre || "Bienvenido"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {usuario?.areas?.nombre || "Sin área"} · {usuario?.rol === "admin" ? "Administrador" : usuario?.rol === "directivo" ? "Directivo" : "Personal"}
          </p>
        </div>
        <Link to="/mensajes/nuevo"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-sm">
          <Plus className="h-4 w-4" /> Redactar
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-card shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
              <div className={`h-8 w-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Bandeja de entrada</h2>
            <Link to="/mensajes" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline" onMouseEnter={prefetchBandeja}>
              Ver todos <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="rounded-xl bg-card shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="divide-y divide-border">
                {[1,2,3].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="h-8 w-8 rounded-full bg-muted animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
                      <div className="h-2 w-1/2 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : ultimos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <MailOpen className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium">Bandeja vacía</h3>
                <p className="text-xs text-muted-foreground mt-1">No hay mensajes aún. ¡Creá el primero!</p>
                <Link to="/mensajes/nuevo"
                  className="mt-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity">
                  <Plus className="h-3.5 w-3.5" /> Nuevo mensaje
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {ultimos.map((msg, i) => {
                  if (!msg) return null;
                  return (
                  <Link key={msg.id || i} to={`/mensajes/${msg.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors group">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                      {msg.remitente?.nombre?.[0]}{msg.remitente?.apellido?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{msg.asunto}</p>
                        {msg.estado === "pendiente" && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 shrink-0">
                            Pendiente
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {msg.remitente?.nombre} {msg.remitente?.apellido}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(msg.created_at)}</span>
                  </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold">Accesos rápidos</h2>
          <div className="rounded-xl bg-card shadow-sm p-4 space-y-1">
            {[
              { to: "/mensajes", icon: Inbox, label: "Ir a la bandeja", color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400", action: prefetchBandeja },
              { to: "/mensajes/nuevo", icon: Send, label: "Redactar mensaje", color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" },
              { to: "/documentos", icon: FileText, label: "Ver documentos", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
            ].map((item) => (
              <Link key={item.to} to={item.to} onMouseEnter={item.action}
                className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-accent/50 transition-colors text-sm">
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${item.color}`}>
                  <item.icon className="h-3.5 w-3.5" />
                </div>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
          <div className="rounded-xl bg-card shadow-sm p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Estado general</p>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Todo al día</p>
                <p className="text-xs text-muted-foreground">Sin pendientes urgentes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
