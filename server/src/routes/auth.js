import { Router } from "express";
import { sb, sbAnon } from "../supabase.js";

export const authRouter = Router();

// Login
authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await sbAnon.auth.signInWithPassword({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Obtener usuario actual
authRouter.get("/me", async (req, res) => {
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
});