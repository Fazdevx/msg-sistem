import { sb, checkSupabase } from "./supabase.js";

const BUCKET = "documentos";

export async function uploadFile(file, mensajeId) {
  checkSupabase();
  const ext = file.originalname.split(".").pop();
  const path = `${mensajeId}/${Date.now()}.${ext}`;

  const { error } = await sb.storage.from(BUCKET).upload(path, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(path);

  const { data, error: dbError } = await sb.from("documentos").insert({
    mensaje_id: mensajeId,
    nombre_original: file.originalname,
    url: urlData.publicUrl,
    tipo_mime: file.mimetype,
    tamano_bytes: file.size,
  }).select().single();

  if (dbError) throw new Error(dbError.message);
  return data;
}
