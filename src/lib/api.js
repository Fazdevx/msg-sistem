const API = "/api";
const TIMEOUT_MS = 25000;

async function request(url, options = {}, isFormData = false) {
  const token = localStorage.getItem("token");
  const headers = { ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isFormData) headers["Content-Type"] = "application/json";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${API}${url}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      throw new Error("Sesión expirada");
    }

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Respuesta inválida del servidor (${res.status})`);
    }

    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("La solicitud tardó demasiado. Verificá tu conexión.");
    }
    if (err.message === "Failed to fetch" || err.message.includes("NetworkError")) {
      throw new Error("No se pudo conectar con el servidor. Verificá que esté funcionando.");
    }
    throw err;
  }
}

export const api = {
  login: (email, password) => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => request("/auth/me"),

  recibidos: (page = 1, limit = 20) => request(`/mensajes/recibidos?page=${page}&limit=${limit}`),
  enviados: (page = 1, limit = 20) => request(`/mensajes/enviados?page=${page}&limit=${limit}`),
  detalle: (id) => request(`/mensajes/${id}`),
  crear: (data) => {
    if (data instanceof FormData) {
      return request("/mensajes", { method: "POST", body: data }, true);
    }
    return request("/mensajes", { method: "POST", body: JSON.stringify(data) });
  },
  aprobar: (id, estado, comentario) => request(`/mensajes/${id}/aprobar`, { method: "POST", body: JSON.stringify({ estado, comentario }) }),
  dataCrear: () => request("/mensajes/data/crear"),
  noLeidos: () => request("/mensajes/data/no-leidos"),

  adminData: () => request("/admin/data"),
  crearUsuario: (data) => request("/admin/usuarios", { method: "POST", body: JSON.stringify(data) }),
  crearArea: (data) => request("/admin/areas", { method: "POST", body: JSON.stringify(data) }),
  crearTipo: (data) => request("/admin/tipos", { method: "POST", body: JSON.stringify(data) }),

  documentos: () => request("/documentos"),
  documentosStats: () => request("/documentos/stats"),
};
