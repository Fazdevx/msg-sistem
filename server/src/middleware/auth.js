import { sb, checkSupabase } from "../supabase.js";

export async function authMiddleware(req, res, next) {
  try {
    checkSupabase();
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Token requerido" });

    const { data: { user }, error } = await sb.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: "Token inválido" });

    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
