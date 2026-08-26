import { useState, useEffect, useCallback, useRef } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../lib/theme";
import {
  LayoutDashboard, Send, FileText, Settings, Bell, Menu, LogOut,
  Inbox, CheckCircle2, Moon, Sun, Search, ChevronDown, X,
  GraduationCap, ChevronLeft, ChevronRight, HelpCircle
} from "lucide-react";

const navItems = [
  { href: "/", label: "Inicio", icon: LayoutDashboard, prefetch: "recibidos-inicio" },
  { href: "/mensajes", label: "Bandeja", icon: Inbox, prefetch: "recibidos" },
  { href: "/mensajes/nuevo", label: "Nuevo mensaje", icon: Send },
  { href: "/documentos", label: "Documentos", icon: FileText, prefetch: "documentos" },
  { href: "/admin", label: "Administración", icon: Settings, prefetch: "admin-data" },
];

export function DashboardLayout() {
  const { usuario, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const searchRef = useRef(null);
  const [search, setSearch] = useState("");

  const { data: noLeidosData } = useQuery({
    queryKey: ["no-leidos"],
    queryFn: () => api.noLeidos(),
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });
  const noLeidos = noLeidosData?.total ?? 0;

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["no-leidos"] });
  }, [location.pathname, queryClient]);

  const handleLogout = () => { logout(); navigate("/login"); };

  const isActive = (href) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  const prefetchData = useCallback((prefetchKey) => {
    if (!prefetchKey) return;
    if (prefetchKey === "recibidos-inicio") {
      queryClient.prefetchQuery({
        queryKey: ["recibidos-inicio"],
        queryFn: () => api.recibidos(1, 5),
      });
    } else if (prefetchKey === "recibidos") {
      queryClient.prefetchInfiniteQuery({
        queryKey: ["recibidos", "paginated"],
        queryFn: () => api.recibidos(1, 20),
        initialPageParam: 1,
      });
    } else if (prefetchKey === "documentos") {
      queryClient.prefetchQuery({
        queryKey: ["documentos"],
        queryFn: () => api.documentos(),
      });
    } else if (prefetchKey === "admin-data") {
      queryClient.prefetchQuery({
        queryKey: ["admin-data"],
        queryFn: () => api.adminData(),
      });
    }
  }, [queryClient]);

  return (
    <div className="flex h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-sidebar transition-all duration-300
        ${sidebarCollapsed ? "w-16" : "w-60"}
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>

        <div className={`h-14 flex items-center border-b border-border shrink-0 ${sidebarCollapsed ? "justify-center px-0" : "gap-2.5 px-4"}`}>
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <GraduationCap className="h-4 w-4 text-primary-foreground" />
          </div>
          {!sidebarCollapsed && (
            <div className="leading-tight min-w-0">
              <p className="text-sm font-semibold truncate">Gestión Escolar</p>
              <p className="text-[10px] text-muted-foreground truncate">Sistema interno</p>
            </div>
          )}
        </div>

        {!sidebarCollapsed && (
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input ref={searchRef} placeholder="Buscar..." className="w-full h-8 pl-8 pr-2 rounded-md border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                onMouseEnter={() => prefetchData(item.prefetch)}
                onTouchStart={() => prefetchData(item.prefetch)}
                className={`flex items-center gap-3 rounded-md text-sm transition-all ${
                  sidebarCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2"
                } ${
                  active
                    ? "bg-sidebar-active text-primary font-medium"
                    : "text-muted-foreground hover:bg-sidebar-hover hover:text-foreground"
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {item.href === "/mensajes" && noLeidos > 0 && (
                      <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {noLeidos}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
          {sidebarCollapsed && noLeidos > 0 && (
            <div className="flex justify-center">
              <span className="bg-primary text-primary-foreground text-[9px] font-bold px-1 py-0.5 rounded-full">
                {noLeidos}
              </span>
            </div>
          )}
        </nav>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex items-center justify-center h-8 mx-2 rounded-md text-muted-foreground hover:bg-sidebar-hover hover:text-foreground transition-colors"
        >
          <ChevronLeft className={`h-3.5 w-3.5 transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`} />
        </button>

        <div className={`border-t border-border p-3 space-y-2 ${sidebarCollapsed ? "text-center" : ""}`}>
          <div className={`${sidebarCollapsed ? "px-0" : "px-2"} py-1.5`}>
            <div className={`h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary ${sidebarCollapsed ? "mx-auto" : ""}`}>
              {usuario?.nombre?.[0]}{usuario?.apellido?.[0]}
            </div>
            {!sidebarCollapsed && (
              <>
                <p className="text-sm font-medium truncate mt-1">{usuario?.nombre} {usuario?.apellido}</p>
                <p className="text-[10px] text-muted-foreground truncate capitalize">{usuario?.areas?.nombre || "Sin área"}</p>
              </>
            )}
          </div>
          <button onClick={handleLogout}
            className={`w-full flex items-center gap-2 rounded-md text-sm text-muted-foreground hover:bg-sidebar-hover hover:text-foreground transition-colors ${
              sidebarCollapsed ? "justify-center px-2 py-2" : "px-3 py-2"
            }`}
            title={sidebarCollapsed ? "Cerrar sesión" : undefined}
          >
            <LogOut className="h-3.5 w-3.5" />
            {!sidebarCollapsed && "Cerrar sesión"}
          </button>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? "lg:pl-16" : "lg:pl-60"}`}>
        <header className="h-14 border-b border-border bg-card flex items-center gap-2 px-3 lg:px-4 shrink-0 sticky top-0 z-30">
          <button className="lg:hidden h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-4 w-4" />
          </button>

          <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground ml-1">
            <span className="text-foreground font-medium">
              {location.pathname === "/" && "Inicio"}
              {location.pathname.startsWith("/mensajes") && location.pathname === "/mensajes" && "Bandeja"}
              {location.pathname.startsWith("/mensajes/nuevo") && "Nuevo mensaje"}
              {location.pathname.match(/\/mensajes\/[^/]+$/) && !location.pathname.includes("nuevo") && "Mensaje"}
              {location.pathname.startsWith("/documentos") && "Documentos"}
              {location.pathname.startsWith("/admin") && "Administración"}
            </span>
          </div>

          <div className="flex-1" />

          <button onClick={toggle} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title={theme === "dark" ? "Modo claro" : "Modo oscuro"}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="relative">
            <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent relative" onClick={() => setNotifOpen(!notifOpen)}>
              <Bell className="h-4 w-4" />
              {noLeidos > 0 && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive" />}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-80 bg-card rounded-lg shadow-lg z-50 overflow-hidden animate-fadeIn">
                  <div className="p-3 border-b border-border bg-muted/30">
                    <p className="text-sm font-semibold">Notificaciones</p>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {noLeidos === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                        <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        </div>
                        <p className="text-sm font-medium">No hay notificaciones</p>
                        <p className="text-xs text-muted-foreground">Todo está al día</p>
                      </div>
                    ) : (
                      <Link to="/mensajes" onClick={() => setNotifOpen(false)}
                        className="flex items-center gap-3 p-3 hover:bg-accent/30 transition-colors border-b border-border">
                        <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                          <Inbox className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">Mensajes sin leer</p>
                          <p className="text-xs text-muted-foreground">Tenés {noLeidos} mensajes sin leer</p>
                        </div>
                        <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">{noLeidos}</span>
                      </Link>
                    )}
                  </div>
                  <div className="p-2 border-t border-border bg-muted/20">
                    <Link to="/mensajes" onClick={() => setNotifOpen(false)}
                      className="block text-center text-xs text-primary font-medium py-1">Ver todos los mensajes</Link>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="h-5 w-px bg-border" />

          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
            {usuario?.nombre?.[0]}{usuario?.apellido?.[0]}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
