import { Router } from "express";
import multer from "multer";
import { sb } from "../supabase.js";
import { authMiddleware } from "../middleware/auth.js";
import { uploadFile } from "../storage.js";

export const mensajesRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

mensajesRouter.use(authMiddleware);

function getPagination(req) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function setCache(res, seconds = 10) {
  res.set("Cache-Control", `private, max-age=${seconds}`);
}

mensajesRouter.get("/recibidos", async (req, res) => {
  const { page, limit, offset } = getPagination(req);

  const { data: destIds } = await sb
    .from("destinatarios")
    .select("mensaje_id")
    .eq("usuario_id", req.user.id);

  const ids = (destIds || []).map((d) => d.mensaje_id);
  if (ids.length === 0) {
    setCache(res);
    return res.json({ data: [], total: 0, page, limit });
  }

  const [{ data, error }, { count }] = await Promise.all([
    sb
      .from("mensajes")
      .select("*, destinatarios(id, usuario_id, area_id, leido, leido_en, archivado), remitente:usuarios!remitente_id(nombre, apellido, areas(nombre))")
      .in("id", ids)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1),
    sb
      .from("mensajes")
      .select("id", { count: "exact", head: true })
      .in("id", ids),
  ]);

  if (error) return res.status(500).json({ error: error.message });
  setCache(res);
  res.json({ data: data || [], total: count || 0, page, limit });
});

mensajesRouter.get("/enviados", async (req, res) => {
  const { page, limit, offset } = getPagination(req);

  const [{ data, error }, { count }] = await Promise.all([
    sb
      .from("mensajes")
      .select("*, destinatarios(id, usuario_id, area_id, leido, leido_en, archivado, usuario:usuarios!usuario_id(nombre, apellido))")
      .eq("remitente_id", req.user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1),
    sb
      .from("mensajes")
      .select("id", { count: "exact", head: true })
      .eq("remitente_id", req.user.id),
  ]);

  if (error) return res.status(500).json({ error: error.message });
  setCache(res);
  res.json({ data: data || [], total: count || 0, page, limit });
});

mensajesRouter.get("/data/crear", async (req, res) => {
  const [tiposRes, areasRes, usuariosRes] = await Promise.all([
    sb.from("tipos_mensaje_personalizados").select("id, nombre, slug, tipo_base, requiere_aprobacion, requiere_documento"),
    sb.from("areas").select("id, nombre, correo_institucional").order("nombre"),
    sb.from("usuarios").select("id, nombre, apellido, rol, area_id, areas(nombre)").order("nombre"),
  ]);

  setCache(res, 60);
  res.json({
    tipos: tiposRes.data || [],
    areas: areasRes.data || [],
    usuarios: usuariosRes.data || [],
  });
});

mensajesRouter.get("/data/no-leidos", async (req, res) => {
  const { data } = await sb.rpc("mensajes_no_leidos", { p_usuario_id: req.user.id });
  setCache(res, 15);
  res.json({ total: data?.[0]?.total ?? 0 });
});

mensajesRouter.get("/:id", async (req, res) => {
  const { data: mensaje } = await sb
    .from("mensajes")
    .select("*, documentos(*), aprobaciones(*, aprobador:usuarios!aprobador_id(nombre, apellido))")
    .eq("id", req.params.id)
    .single();

  if (!mensaje) return res.status(404).json({ error: "No encontrado" });

  const { data: remitente } = await sb
    .from("usuarios")
    .select("nombre, apellido, areas(nombre)")
    .eq("id", mensaje.remitente_id)
    .single();

  const { data: destUser } = await sb
    .from("destinatarios")
    .select("id")
    .eq("mensaje_id", req.params.id)
    .eq("usuario_id", req.user.id)
    .eq("leido", false)
    .maybeSingle();

  if (destUser) {
    await sb.rpc("marcar_leido", { p_destinatario_id: destUser.id });
  }

  res.json({ ...mensaje, remitente });
});

mensajesRouter.post("/", upload.array("archivos", 5), async (req, res) => {
  const { tipo_personalizado_id, asunto, cuerpo, destino_tipo, destino_id } = req.body;
  const files = req.files || [];

  const { data: usuario } = await sb
    .from("usuarios")
    .select("area_id")
    .eq("id", req.user.id)
    .single();

  if (!usuario) return res.status(400).json({ error: "Usuario no encontrado" });

  let tipo_base = "comunicado";
  let requiere_aprobacion = false;
  if (tipo_personalizado_id) {
    const { data: tipo } = await sb
      .from("tipos_mensaje_personalizados")
      .select("tipo_base, requiere_aprobacion")
      .eq("id", tipo_personalizado_id)
      .single();
    if (tipo) {
      tipo_base = tipo.tipo_base;
      requiere_aprobacion = tipo.requiere_aprobacion;
    }
  }

  const { data: mensaje, error } = await sb
    .from("mensajes")
    .insert({
      remitente_id: req.user.id,
      area_remitente_id: usuario.area_id,
      tipo_base,
      tipo_personalizado_id: tipo_personalizado_id || null,
      asunto,
      cuerpo,
      estado: requiere_aprobacion ? "pendiente" : "enviado",
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  if (destino_tipo === "area" && destino_id) {
    const { data: usuarios } = await sb
      .from("usuarios")
      .select("id")
      .eq("area_id", destino_id);

    if (usuarios?.length) {
      await sb.from("destinatarios").insert(
        usuarios.map((u) => ({
          mensaje_id: mensaje.id,
          usuario_id: u.id,
          area_id: destino_id,
        }))
      );
    }
  } else if (destino_tipo === "usuario" && destino_id) {
    await sb.from("destinatarios").insert({
      mensaje_id: mensaje.id,
      usuario_id: destino_id,
    });
  }

  const documentos = [];
  for (const file of files) {
    try {
      const doc = await uploadFile(file, mensaje.id);
      documentos.push(doc);
    } catch (err) {
      console.error("Error subiendo archivo:", err.message);
    }
  }

  res.json({ ...mensaje, documentos });
});

mensajesRouter.post("/:id/aprobar", async (req, res) => {
  const { estado, comentario } = req.body;

  const { data: msg } = await sb
    .from("mensajes")
    .select("estado, remitente_id")
    .eq("id", req.params.id)
    .single();

  if (!msg) return res.status(404).json({ error: "No encontrado" });
  if (msg.estado !== "pendiente") return res.status(400).json({ error: "Ya no está pendiente" });
  if (msg.remitente_id === req.user.id) return res.status(400).json({ error: "No podés aprobar tu propio mensaje" });

  await sb.from("aprobaciones").upsert({
    mensaje_id: req.params.id,
    aprobador_id: req.user.id,
    estado,
    comentario: comentario || null,
  }, { onConflict: "mensaje_id,aprobador_id" });

  await sb.from("mensajes").update({ estado }).eq("id", req.params.id);

  res.json({ success: true });
});
