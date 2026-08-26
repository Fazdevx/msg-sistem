import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useState } from "react";
import {
  Users, Building2, MessageSquare, Search, Mail, Loader2,
  Plus, Shield, UserCog, Activity, AlertCircle, CheckCircle2,
  X, XCircle, RefreshCw
} from "lucide-react";
import { toast } from "../components/Toast";

const rolColors = {
  admin: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  directivo: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  personal: "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400",
};

function DialogForm({ title, fields, action, form, setForm, error, loading, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(action, form); }} className="p-5 space-y-4">
          {fields.map((f) => (
            f.type === "select" ? (
              <div key={f.key} className="space-y-1.5">
                <label className="text-xs font-medium">{f.label}</label>
                <select
                  value={form[f.key] || ""}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">{f.placeholder || "Seleccionar..."}</option>
                  {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ) : (
              <div key={f.key} className="space-y-1.5">
                <label className="text-xs font-medium">{f.label}</label>
                <input
                  type={f.type || "text"}
                  value={form[f.key] || ""}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  required={f.required}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )
          ))}
          {error && <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{error}</p>}
          <div className="flex gap-3 pt-2 border-t border-border">
            <button type="button" onClick={onClose}
              className="flex-1 h-9 rounded-lg border border-border text-sm hover:bg-accent transition-colors">Cancelar</button>
            <button type="submit" disabled={loading}
              className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[1,2,3].map((i) => (
          <div key={i} className="rounded-xl bg-card shadow-sm p-4">
            <div className="h-8 w-8 rounded-lg bg-muted animate-pulse mb-2" />
            <div className="h-7 w-12 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
      {[1,2,3].map((i) => (
        <div key={i} className="rounded-xl bg-card shadow-sm p-4 space-y-3">
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          {[1,2,3].map((j) => (
            <div key={j} className="flex items-center gap-4 py-2">
              <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
                <div className="h-2 w-1/2 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function AdminPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch, isError } = useQuery({
    queryKey: ["admin-data"],
    queryFn: () => api.adminData(),
    staleTime: 120000,
    retry: 2,
  });

  const [openDialog, setOpenDialog] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const u = data?.usuarios || [];
  const a = data?.areas || [];
  const t = data?.tipos || [];

  const handleCreate = async (action, body) => {
    setLoading(true);
    setError("");
    try {
      if (action === "usuario") await api.crearUsuario(body);
      else if (action === "area") await api.crearArea(body);
      else if (action === "tipo") await api.crearTipo(body);
      setOpenDialog(null);
      setForm({});
      refetch();
      toast({ title: "Creado", description: "Se ha creado correctamente", variant: "success" });
    } catch (err) {
      setError(err.message);
      toast({ title: "Error", description: err.message, variant: "error" });
    }
    setLoading(false);
  };

  if (isError) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-8 w-8 text-destructive mb-3" />
          <p className="text-sm font-medium">Error al cargar datos</p>
          <button onClick={() => refetch()} className="mt-4 inline-flex items-center gap-2 h-8 px-3 rounded-lg border border-border text-sm hover:bg-accent">
            <RefreshCw className="h-3.5 w-3.5" /> Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Administración</h1>
            <p className="text-xs text-muted-foreground">Gestión de usuarios, áreas y tipos de mensaje</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setOpenDialog("tipo"); setForm({}); setError(""); }}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-sm hover:bg-accent transition-colors">
            <MessageSquare className="h-4 w-4" /> Tipo
          </button>
          <button onClick={() => { setOpenDialog("area"); setForm({}); setError(""); }}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-sm hover:bg-accent transition-colors">
            <Building2 className="h-4 w-4" /> Área
          </button>
          <button onClick={() => { setOpenDialog("usuario"); setForm({}); setError(""); }}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-sm">
            <Plus className="h-4 w-4" /> Usuario
          </button>
        </div>
      </div>

      {openDialog === "usuario" && (
        <DialogForm title="Crear usuario" action="usuario" fields={[
          { key: "nombre", label: "Nombre", required: true },
          { key: "apellido", label: "Apellido", required: true },
          { key: "email", label: "Email", type: "email", required: true },
          { key: "password", label: "Contraseña temporal", type: "password", required: true },
          { key: "rol", label: "Rol", type: "select", options: [
            { value: "admin", label: "Administrador" },
            { value: "directivo", label: "Directivo" },
            { value: "personal", label: "Personal" },
          ]},
          { key: "area_id", label: "Área", type: "select", options: a.map((ar) => ({ value: ar.id, label: ar.nombre })) },
        ]} />
      )}
      {openDialog === "area" && (
        <DialogForm title="Crear área" action="area" fields={[
          { key: "nombre", label: "Nombre del área", required: true, placeholder: "Ej: Biblioteca" },
          { key: "descripcion", label: "Descripción", placeholder: "Breve descripción" },
          { key: "correo_institucional", label: "Correo institucional", type: "email", placeholder: "area@colegio.edu.ar" },
        ]} />
      )}
      {openDialog === "tipo" && (
        <DialogForm title="Crear tipo de mensaje" action="tipo" fields={[
          { key: "nombre", label: "Nombre", required: true, placeholder: "Ej: Solicitud de viáticos" },
          { key: "tipo_base", label: "Tipo base", type: "select", options: [
            { value: "aprobacion", label: "Aprobación" },
            { value: "comunicado", label: "Comunicado" },
            { value: "documento", label: "Documento" },
            { value: "notificacion", label: "Notificación" },
          ]},
          { key: "requiere_aprobacion", label: "Requiere aprobación", type: "select", options: [{ value: "true", label: "Sí" }, { value: "false", label: "No" }] },
          { key: "requiere_documento", label: "Requiere documento", type: "select", options: [{ value: "true", label: "Sí" }, { value: "false", label: "No" }] },
          { key: "roles_emisor", label: "Roles emisores", type: "select", options: [
            { value: "admin", label: "Solo Admin" },
            { value: "directivo", label: "Solo Directivo" },
            { value: "personal", label: "Solo Personal" },
            { value: "admin,directivo,personal", label: "Todos" },
          ]},
          { key: "roles_receptor", label: "Roles receptores", type: "select", options: [
            { value: "admin", label: "Solo Admin" },
            { value: "directivo", label: "Solo Directivo" },
            { value: "personal", label: "Solo Personal" },
            { value: "admin,directivo,personal", label: "Todos" },
          ]},
        ]} />
      )}

      {isLoading ? (
        <AdminSkeleton />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Usuarios", value: u.length, icon: Users, color: "border-l-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400" },
              { label: "Áreas", value: a.length, icon: Building2, color: "border-l-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400" },
              { label: "Tipos", value: t.length, icon: MessageSquare, color: "border-l-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl bg-card shadow-sm border-l-4 ${s.color} p-4`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${s.bg}`}>
                    <s.icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border bg-muted/20 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-medium">Áreas de gestión</h3>
              </div>
              <span className="text-xs text-muted-foreground">{a.length} áreas</span>
            </div>
            <div className="divide-y divide-border">
              {a.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No hay áreas creadas</div>
              ) : (
                a.map((area) => (
                  <div key={area.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-accent/30 transition-colors">
                    <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{area.nombre}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {area.correo_institucional && (
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3 inline" /> {area.correo_institucional}</span>
                        )}
                        {area.descripcion && <span> · {area.descripcion}</span>}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {u.filter((us) => us.area_id === area.id).length} usuarios
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border bg-muted/20 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-medium">Usuarios</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    placeholder="Buscar..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-44 h-8 pl-8 pr-3 rounded-md border border-border bg-card text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <span className="text-xs text-muted-foreground">{u.length} usuarios</span>
              </div>
            </div>
            <div className="divide-y divide-border">
              {(search
                ? u.filter((us) => `${us.nombre} ${us.apellido} ${us.email}`.toLowerCase().includes(search.toLowerCase()))
                : u
              ).length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {search ? "Sin resultados" : "No hay usuarios creados"}
                </div>
              ) : (
                (search
                  ? u.filter((us) => `${us.nombre} ${us.apellido} ${us.email}`.toLowerCase().includes(search.toLowerCase()))
                  : u
                ).map((usuario) => (
                  <div key={usuario.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-accent/30 transition-colors">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                      {usuario.nombre?.[0]}{usuario.apellido?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{usuario.nombre} {usuario.apellido}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${rolColors[usuario.rol] || "bg-muted text-muted-foreground"}`}>
                          {usuario.rol === "admin" ? "Admin" : usuario.rol === "directivo" ? "Directivo" : "Personal"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{usuario.email} · {usuario.areas?.nombre || "Sin área"}</p>
                    </div>
                    <span className={`text-xs flex items-center gap-1 ${usuario.activo !== false ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {usuario.activo !== false ? (
                        <><CheckCircle2 className="h-3 w-3" /> Activo</>
                      ) : (
                        <><XCircle className="h-3 w-3" /> Inactivo</>
                      )}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border bg-muted/20 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-medium">Tipos de mensaje</h3>
              </div>
              <span className="text-xs text-muted-foreground">{t.length} tipos</span>
            </div>
            <div className="divide-y divide-border">
              {t.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No hay tipos de mensaje creados</div>
              ) : (
                t.map((tipo) => (
                  <div key={tipo.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-accent/30 transition-colors">
                    <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{tipo.nombre}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Base: {tipo.tipo_base} · {tipo.requiere_aprobacion ? "Requiere aprobación" : "Directo"}
                        {tipo.roles_emisor && ` · Emisor: ${tipo.roles_emisor}`}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
