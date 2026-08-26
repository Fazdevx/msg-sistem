import { Router } from "express";
import { sb } from "../supabase.js";
import { authMiddleware } from "../middleware/auth.js";

export const documentosRouter = Router();
documentosRouter.use(authMiddleware);

documentosRouter.get("/", async (req, res) => {
  // Get IDs of messages that have documents
  const { data: docsData } = await sb
    .from("documentos")
    .select("mensaje_id");

  const ids = [...new Set((docsData || []).map((d) => d.mensaje_id))];
  if (ids.length === 0) return res.json([]);

  const { data } = await sb
    .from("mensajes")
    .select("*, documentos(*), remitente:usuarios!remitente_id(nombre, apellido)")
    .in("id", ids)
    .order("created_at", { ascending: false });

  res.json(data || []);
});

documentosRouter.get("/stats", async (req, res) => {
  const { data } = await sb
    .from("documentos")
    .select("tamano_bytes, mensaje_id");

  let totalArchivos = 0;
  let totalBytes = 0;
  const mensajeIds = new Set();
  (data || []).forEach((doc) => {
    totalArchivos++;
    totalBytes += doc.tamano_bytes || 0;
    mensajeIds.add(doc.mensaje_id);
  });

  res.json({
    totalArchivos,
    totalBytes,
    totalMensajes: mensajeIds.size,
  });
});