import { app } from "../server/src/app.js";
import serverless from "serverless-http";

export default serverless(app);
