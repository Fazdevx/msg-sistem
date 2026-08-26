import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function estadoBadge(estado) {
  const map = { pendiente: "Pendiente", aprobado: "Aprobado", rechazado: "Rechazado", enviado: "Enviado", leido: "Leído", archivado: "Archivado" };
  return map[estado] ?? estado;
}

export function tipoBadge(tipo) {
  const map = { aprobacion: "Aprobación", comunicado: "Comunicado", documento: "Documento", notificacion: "Notificación" };
  return map[tipo] ?? tipo;
}

export function timeAgo(dateStr) {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins}m`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days < 7) return `Hace ${days}d`;
  return new Date(dateStr).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}