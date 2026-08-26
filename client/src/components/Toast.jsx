import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

let toastId = 0;

export function toast({ title, description, variant = "default" }) {
  const event = new CustomEvent("toast", { detail: { id: ++toastId, title, description, variant } });
  window.dispatchEvent(event);
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  default: Info,
};

const colors = {
  success: "border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
  error: "border-l-red-500 bg-red-50 dark:bg-red-950/30",
  warning: "border-l-amber-500 bg-amber-50 dark:bg-amber-950/30",
  info: "border-l-blue-500 bg-blue-50 dark:bg-blue-950/30",
  default: "border-l-primary bg-card",
};

const iconColors = {
  success: "text-emerald-600 dark:text-emerald-400",
  error: "text-red-600 dark:text-red-400",
  warning: "text-amber-600 dark:text-amber-400",
  info: "text-blue-600 dark:text-blue-400",
  default: "text-primary",
};

export function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const t = e.detail;
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 5000);
    };
    window.addEventListener("toast", handler);
    return () => window.removeEventListener("toast", handler);
  }, []);

  const remove = (id) => setToasts((prev) => prev.filter((x) => x.id !== id));

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => {
        const Icon = icons[t.variant] || icons.default;
        return (
          <div
            key={t.id}
            className={`flex items-start gap-3 p-3 rounded-lg border shadow-lg border-l-4 animate-fadeIn ${colors[t.variant] || colors.default}`}
          >
            <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${iconColors[t.variant] || iconColors.default}`} />
            <div className="flex-1 min-w-0">
              {t.title && <p className="text-sm font-medium">{t.title}</p>}
              {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
            </div>
            <button onClick={() => remove(t.id)} className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted shrink-0">
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}