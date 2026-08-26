import { Router } from "express";
import { sb, checkSupabase } from "../supabase.js";
import { authMiddleware } from "../middleware/auth.js";

export const adminRouter = Router();
adminRouter.use(authMiddleware);
adminRouter.use((req, res, next) => {
  try {
    checkSupabase();
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener datos de administración
adminRouter.get("/data", async (req, res) => {
  const [uRes, aRes, tRes] = await Promise.all([
    sb.from("usuarios").select("*, areas(nombre)").order("created_at", { ascending: false }),
    sb.from("areas").select("*").order("created_at", { ascending: false }),
    sb.from("tipos_mensaje_personalizados").select("*").order("created_at", { ascending: false }),
  ]);

  res.json({
    usuarios: uRes.data || [],
    areas: aRes.data || [],
    tipos: tRes.data || [],
  });
});

// Crear usuario
adminRouter.post("/usuarios", async (req, res) => {
  const { email, password, nombre, apellido, rol, area_id } = req.body;

  const { data: authData, error: authError } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) return res.status(400).json({ error: authError.message });

  const { error: userError } = await sb.from("usuarios").insert({
    id: authData.user.id,
    email,
    nombre,
    apellido,
    rol,
    area_id,
  });

  if (userError) return res.status(500).json({ error: userError.message });
  res.json({ success: true, id: authData.user.id });
});

// Crear área
adminRouter.post("/areas", async (req, res) => {
  const { nombre, descripcion, correo_institucional } = req.body;
  const { error } = await sb.from("areas").insert({ nombre, descripcion: descripcion || null, correo_institucional: correo_institucional || null });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Crear tipo de mensaje
adminRouter.post("/tipos", async (req, res) => {
  const { nombre, slug, tipo_base, requiere_aprobacion, requiere_documento, roles_emisor, roles_receptor } = req.body;
  const { error } = await sb.from("tipos_mensaje_personalizados").insert({
    nombre,
    slug: slug || nombre.toLowerCase().replace(/\s+/g, "-"),
    tipo_base,
    requiere_aprobacion: requiere_aprobacion === "true" || requiere_aprobacion === true,
    requiere_documento: requiere_documento === "true" || requiere_documento === true,
    roles_emisor: [roles_emisor].flat(),
    roles_receptor: [roles_receptor].flat(),
  });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});