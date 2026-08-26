import { Router } from "express";
import { sb, sbAnon, checkSupabase } from "../supabase.js";

export const authRouter = Router();

const withTimeout = (promise, ms = 10000) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Tiempo de espera agotado en auth")), ms)),
  ]);

authRouter.post("/login", async (req, res) => {
  try {
    checkSupabase();
    const { email, password } = req.body;
    const result = await withTimeout(sbAnon.auth.signInWithPassword({ email, password }), 10000);
    const { data, error } = result;
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

authRouter.get("/me", async (req, res) => {
  try {
    checkSupabase();
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Token requerido" });

    const { data: { user } } = await sb.auth.getUser(token);
    if (!user) return res.status(401).json({ error: "No autorizado" });

    const { data: usuario } = await sb
      .from("usuarios")
      .select("*, areas(nombre)")
      .eq("id", user.id)
      .single();

    res.json({ user, usuario });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
