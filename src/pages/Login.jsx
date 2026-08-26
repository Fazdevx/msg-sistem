import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { GraduationCap, Eye, EyeOff, Loader2, Moon, Sun } from "lucide-react";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      if (err.message === "Failed to fetch" || err.message?.includes("NetworkError")) {
        setError("Error de conexión con el servidor. Verificá que el servidor esté corriendo.");
      } else {
        setError(err.message === "Invalid login credentials" ? "Email o contraseña incorrectos" : err.message);
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1 flex items-center justify-center px-6 lg:px-16">
        <div className="w-full max-w-sm space-y-8 animate-fadeIn">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                  <GraduationCap className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold tracking-tight">Gestión Escolar</span>
              </div>
              <button onClick={toggle} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Bienvenido de nuevo</h1>
              <p className="text-sm text-muted-foreground mt-1">Ingresá con tus credenciales institucionales</p>
            </div>
          </div>
          <div className="rounded-xl bg-card shadow-sm p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium">Email institucional</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@colegio.edu.ar" required
                  className="w-full h-9 px-3 rounded-lg border border-border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)} required
                    className="w-full h-9 px-3 pr-9 rounded-lg border border-border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              <button type="submit" disabled={loading}
                className="w-full h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ingresar"}
              </button>
            </form>
          </div>
          <p className="text-xs text-center text-muted-foreground">Sistema de Gestión Escolar © {new Date().getFullYear()}</p>
        </div>
      </div>
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/10 via-primary/5 to-background items-center justify-center p-16">
        <div className="max-w-md space-y-8">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Comunicación institucional simplificada</h2>
          <p className="text-muted-foreground leading-relaxed">Gestioná comunicados, aprobaciones, documentos y notificaciones entre áreas del colegio de forma centralizada y eficiente.</p>
          <div className="grid gap-4">
            {[
              { title: "Mensajería interna", desc: "Comunicate con todas las áreas del colegio" },
              { title: "Aprobaciones", desc: "Gestioná flujos de aprobación digitales" },
              { title: "Documentos", desc: "Compartí y almacená archivos importantes" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}