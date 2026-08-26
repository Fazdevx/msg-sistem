import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", "server", ".env") });

import { app } from "../server/src/app.js";
import serverless from "serverless-http";

export default serverless(app);
