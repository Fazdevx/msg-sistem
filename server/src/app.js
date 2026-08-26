import express from "express";
import cors from "cors";
import compression from "compression";
import { authRouter } from "./routes/auth.js";
import { mensajesRouter } from "./routes/mensajes.js";
import { adminRouter } from "./routes/admin.js";
import { documentosRouter } from "./routes/documentos.js";

export const app = express();

app.use(compression());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10mb" }));

app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    res.status(503).json({ error: "Tiempo de espera agotado" });
  });
  res.setTimeout(30000);
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`[SLOW] ${req.method} ${req.url} ${duration}ms`);
    }
  });
  next();
});

app.use("/api/auth", authRouter);
app.use("/api/mensajes", mensajesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/documentos", documentosRouter);

app.get("/api/health", (_, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

app.use((err, req, res, _next) => {
  console.error(`[ERROR] ${req.method} ${req.url}:`, err.message);
  res.status(err.status || 500).json({
    error: err.message || "Error interno del servidor",
  });
});
