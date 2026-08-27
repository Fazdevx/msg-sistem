import { useInfiniteQuery } from "@tanstack/react-query";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Inbox, Send, Plus, Search, Filter, ChevronDown, X,
  Clock, MailOpen
} from "lucide-react";
import { estadoBadge, tipoBadge, timeAgo } from "../lib/utils";

const filterTabs = [
  { key: "recibidos", label: "Recibidos", icon: Inbox },
  { key: "enviados", label: "Enviados", icon: Send },
  { key: "pendientes", label: "Pendientes", icon: Clock },
];

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function MessageSkeleton() {
  return (
    <div className="divide-y divide-border">
      {[1,2,3,4,5].map((i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="h-9 w-9 rounded-full bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-2 w-1/2 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-3 w-12 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function BandejaPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = searchParams.get("tab") || "recibidos";
  const [searchInput, setSearchInput] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const loaderRef = useRef(null);
  const search = useDebounce(searchInput, 300);

  const queryKey = tab === "enviados" ? "enviados" : "recibidos";

  const {
    data,
    isLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [queryKey, "paginated"],
    queryFn: ({ pageParam = 1 }) => queryKey === "enviados" ? api.enviados(pageParam, 20) : api.recibidos(pageParam, 20),
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined;
      const { page, limit, total } = lastPage;
      if (page * limit >= total) return undefined;
      return page + 1;
    },
    initialPageParam: 1,
  });

  const mensajes = (data?.pages || []).flatMap((p) => (Array.isArray(p?.data) ? p.data : [])).filter(Boolean);

  const filtered = mensajes.filter((msg) => {
    if (tab === "pendientes") return msg.estado === "pendiente";
    return true;
  }).filter((msg) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return msg.asunto?.toLowerCase().includes(q) ||
      msg.remitente?.nombre?.toLowerCase().includes(q) ||
      msg.remitente?.apellido?.toLowerCase().includes(q) ||
      msg.cuerpo?.toLowerCase().includes(q);
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((m) => m?.id).filter(Boolean)));
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bandeja</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {mensajes.length > 0 ? `${data.pages[0]?.total || 0} mensajes` : "Cargando..."}
          </p>
        </div>
        <Link to="/mensajes/nuevo"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-sm">
          <Plus className="h-4 w-4" /> Redactar
        </Link>
      </div>

      <div className="flex items-center gap-1 bg-card rounded-xl shadow-sm p-1">
        {filterTabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => {
                setSearchParams(t.key === "recibidos" ? {} : { tab: t.key });
                setSelectedIds(new Set());
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Buscar en la bandeja..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full h-9 pl-9 pr-8 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {searchInput && (
            <button onClick={() => setSearchInput("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-sm hover:bg-accent transition-colors">
          <Filter className="h-4 w-4" /> Filtros <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      <div className="rounded-xl bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <MessageSkeleton />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
              {tab === "enviados" ? <Send className="h-7 w-7 text-muted-foreground" /> : <MailOpen className="h-7 w-7 text-muted-foreground" />}
            </div>
            <h3 className="font-medium">No hay mensajes {tab === "enviados" ? "enviados" : tab === "pendientes" ? "pendientes" : "recibidos"}</h3>
            <p className="text-sm text-muted-foreground mt-1">Los mensajes aparecerán aquí.</p>
            <Link to="/mensajes/nuevo"
              className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
              <Plus className="h-4 w-4" /> Nuevo mensaje
            </Link>
          </div>
        ) : (
          <>
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 border-b border-border bg-muted/20 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              <div className="flex items-center gap-3 w-8">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filtered.length && filtered.length > 0}
                  onChange={toggleAll}
                  className="rounded border-border"
                />
              </div>
              <span className="flex-1">{tab === "enviados" ? "Para" : "Remitente"}</span>
              <span className="flex-1">Asunto</span>
              <span className="w-20 text-right">Fecha</span>
            </div>
            <div className="divide-y divide-border">
              {filtered.map((msg, i) => {
                if (!msg || msg.id == null) return null;
                const dests = Array.isArray(msg?.destinatarios) ? msg.destinatarios.filter(Boolean) : [];
                const destNombres = dests.map((d) => {
                  if (!d) return "Usuario";
                  if (d.usuario && (d.usuario.nombre || d.usuario.apellido)) {
                    return `${d.usuario.nombre || ""} ${d.usuario.apellido || ""}`.trim();
                  }
                  if (d.area_id) return "Área";
                  return "Usuario";
                }).join(", ");
                const rem = msg?.remitente || {};
                const isUnread = tab !== "enviados" && msg?.leido === false;
                return (
                  <div
                    key={msg.id || i}
                    className={`group flex items-start sm:items-center gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-accent/20 transition-colors cursor-pointer ${
                      isUnread ? "bg-primary/[0.02]" : ""
                    }`}
                    onClick={() => navigate(`/mensajes/${msg.id}`)}
                  >
                    <div className="hidden sm:flex items-center w-8" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(msg.id)}
                        onChange={() => toggleSelect(msg.id)}
                        className="rounded border-border"
                      />
                    </div>
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-medium shrink-0 bg-primary/10 text-primary`}>
                      {tab === "enviados" ? (
                        <Send className="h-3.5 w-3.5" />
                      ) : (
                        rem?.nombre?.[0] + rem?.apellido?.[0] || "??"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm truncate ${isUnread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                          {tab === "enviados" ? (destNombres || "Sin destinatarios") : `${rem?.nombre || "Usuario"} ${rem?.apellido || ""}`}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-auto shrink-0 sm:hidden">{timeAgo(msg.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className={`text-sm truncate ${isUnread ? "font-semibold" : ""}`}>{msg.asunto}</p>
                        {isUnread && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.cuerpo || "Sin contenido"}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground">{timeAgo(msg.created_at)}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded border text-muted-foreground border-border hidden lg:inline">
                          {tipoBadge(msg.tipo_base)}
                        </span>
                        {msg.estado !== "enviado" && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            msg.estado === "pendiente" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                            msg.estado === "aprobado" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                            msg.estado === "rechazado" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" : ""
                          }`}>
                            {estadoBadge(msg.estado)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div ref={loaderRef} className="p-4 flex justify-center">
              {isFetchingNextPage && (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
