import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useState, useMemo } from "react";
import {
  FileText, FolderOpen, Search, Filter, Calendar, ChevronDown,
  Upload, HardDrive, Eye, Download, Plus, Grid3X3, List,
  Image, FileSpreadsheet, FileArchive
} from "lucide-react";
import { timeAgo } from "../lib/utils";

function getFileIcon(mime) {
  if (!mime) return FileText;
  if (mime.startsWith("image/")) return Image;
  if (mime.includes("pdf")) return FileText;
  if (mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("csv")) return FileSpreadsheet;
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("tar")) return FileArchive;
  return FileText;
}

const fileColors = {
  [FileText]: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
  [Image]: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30",
  [FileSpreadsheet]: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30",
  [FileArchive]: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30",
};

function DocSkeleton() {
  return (
    <div className="space-y-3">
      {[1,2,3].map((i) => (
        <div key={i} className="rounded-xl bg-card shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 bg-muted/20">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-2 w-1/2 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="px-5 py-3 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
              <div className="h-2 w-1/3 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DocumentosPage() {
  const [viewMode, setViewMode] = useState("list");
  const [search, setSearch] = useState("");

  const { data: mensajes, isLoading } = useQuery({
    queryKey: ["documentos"],
    queryFn: () => api.documentos(),
  });

  const { data: stats } = useQuery({
    queryKey: ["documentos-stats"],
    queryFn: () => api.documentosStats(),
  });

  const m = mensajes || [];
  const s = stats || { totalArchivos: 0, totalBytes: 0, totalMensajes: 0 };

  const allDocs = useMemo(() =>
    m.flatMap((msg) =>
      (msg.documentos || []).map((doc) => ({ ...doc, mensaje: msg }))
    ),
    [m]
  );

  const filtered = useMemo(() =>
    search
      ? allDocs.filter((doc) =>
          doc.nombre_original?.toLowerCase().includes(search.toLowerCase()) ||
          doc.mensaje?.asunto?.toLowerCase().includes(search.toLowerCase())
        )
      : allDocs,
    [search, allDocs]
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FolderOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Documentos</h1>
            <p className="text-xs text-muted-foreground">
              {s.totalArchivos} archivos · {s.totalBytes > 1048576
                ? `${(s.totalBytes / 1048576).toFixed(1)} MB`
                : s.totalBytes > 1024
                  ? `${(s.totalBytes / 1024).toFixed(1)} KB`
                  : `${s.totalBytes} B`} total
            </p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-sm">
          <Upload className="h-4 w-4" /> Subir documento
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Buscar archivos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-sm hover:bg-accent transition-colors">
          <Filter className="h-4 w-4" /> Filtros <ChevronDown className="h-3 w-3" />
        </button>
        <div className="flex items-center rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode("list")}
            className={`h-8 w-8 flex items-center justify-center transition-colors ${
              viewMode === "list" ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
            }`}
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`h-8 w-8 flex items-center justify-center transition-colors ${
              viewMode === "grid" ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
            }`}
          >
            <Grid3X3 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <DocSkeleton />
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl shadow-sm p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium">No hay documentos</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">Los archivos adjuntos a los mensajes aparecerán listados aquí.</p>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((doc, i) => {
            const Icon = getFileIcon(doc.tipo_mime);
            const colors = fileColors[Icon] || fileColors[FileText];
            return (
              <a
                key={doc.id || i}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl bg-card shadow-sm p-4 hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-center h-24 rounded-lg bg-muted/30 mb-3">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${colors}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{doc.nombre_original}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">{(doc.tamano_bytes / 1024).toFixed(1)} KB</span>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(doc.created_at)}</span>
                </div>
              </a>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {m.map((msg) => {
            const docs = msg.documentos || [];
            if (search && !docs.some((d) => d.nombre_original?.toLowerCase().includes(search.toLowerCase()))) return null;
            return (
              <div key={msg.id} className="rounded-xl bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3 bg-muted/20 border-b border-border">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                    {msg.remitente?.nombre?.[0]}{msg.remitente?.apellido?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/mensajes/${msg.id}`} className="text-sm font-medium hover:text-primary transition-colors">{msg.asunto}</Link>
                    <p className="text-xs text-muted-foreground">{msg.remitente?.nombre} {msg.remitente?.apellido} · {timeAgo(msg.created_at)}</p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground shrink-0">
                    {docs.length} {docs.length === 1 ? "archivo" : "archivos"}
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {docs.map((doc) => {
                    const Icon = getFileIcon(doc.tipo_mime);
                    const colors = fileColors[Icon] || fileColors[FileText];
                    return (
                      <a
                        key={doc.id}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 px-5 py-3 hover:bg-accent/30 transition-colors group"
                      >
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${colors.split(" ").slice(1).join(" ")}`}>
                          <Icon className={`h-5 w-5 ${colors.split(" ")[0]}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{doc.nombre_original}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" />{(doc.tamano_bytes / 1024).toFixed(1)} KB</span>
                            <span>·</span>
                            <span>{doc.tipo_mime?.split("/")[1]?.toUpperCase() || doc.tipo_mime}</span>
                            <span>·</span>
                            <span>{timeAgo(doc.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <span className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent"><Eye className="h-4 w-4" /></span>
                          <span className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent"><Download className="h-4 w-4" /></span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
