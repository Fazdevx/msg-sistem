import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./lib/auth";
import { ThemeProvider } from "./lib/theme";
import { Toaster } from "./components/Toast";

const LoginPage = lazy(() => import("./pages/Login").then(m => ({ default: m.LoginPage })));
const DashboardLayout = lazy(() => import("./pages/DashboardLayout").then(m => ({ default: m.DashboardLayout })));
const InicioPage = lazy(() => import("./pages/Inicio").then(m => ({ default: m.InicioPage })));
const BandejaPage = lazy(() => import("./pages/Bandeja").then(m => ({ default: m.BandejaPage })));
const MensajeDetallePage = lazy(() => import("./pages/MensajeDetalle").then(m => ({ default: m.MensajeDetallePage })));
const NuevoMensajePage = lazy(() => import("./pages/NuevoMensaje").then(m => ({ default: m.NuevoMensajePage })));
const AdminPage = lazy(() => import("./pages/Admin").then(m => ({ default: m.AdminPage })));
const DocumentosPage = lazy(() => import("./pages/Documentos").then(m => ({ default: m.DocumentosPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      gcTime: 300000,
      retry: 1,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
                  <Route index element={<InicioPage />} />
                  <Route path="mensajes" element={<BandejaPage />} />
                  <Route path="mensajes/nuevo" element={<NuevoMensajePage />} />
                  <Route path="mensajes/:id" element={<MensajeDetallePage />} />
                  <Route path="admin" element={<AdminPage />} />
                  <Route path="documentos" element={<DocumentosPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Suspense>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
