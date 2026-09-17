import { pathToFileURL } from "node:url";

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { errorHandler } from "./src/middleware/error-handler.js";
import { apiRateLimit } from "./src/middleware/rate-limit.js";
import routes from "./src/routes/index.js";

export const app = express();
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    // Libera apenas origens configuradas para a API.
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origem não permitida"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(apiRateLimit);

routes(app);
app.use((_request, response) => {
  response
    .status(404)
    .json({ code: "NOT_FOUND", message: "Rota não encontrada" });
});
app.use(errorHandler);

// Inicia o servidor HTTP na porta configurada.
export function startServer(port = Number(process.env.PORT) || 6868) {
  const server = app.listen(port);

  server.once("listening", () => {
    const address = server.address();
    const activePort = typeof address === "object" ? address.port : port;
    console.log(`Servidor disponível em http://localhost:${activePort}`);
  });

  return server;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  startServer();
}
