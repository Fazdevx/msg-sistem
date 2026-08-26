import { app } from "./app.js";

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

const shutdown = () => {
  console.log("\nApagando servidor...");
  server.close(() => {
    console.log("Servidor detenido.");
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
