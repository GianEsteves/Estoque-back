import { pathToFileURL } from "node:url";

import cors from "cors";
import express from "express";

import { errorHandler } from "./src/middleware/error-handler.js";
import routes from "./src/routes/index.js";

export const app = express();

app.use(cors());
app.use(express.json());

routes(app);
app.use(errorHandler);

export function startServer(port = Number(process.env.PORT) || 6868) {
  const server = app.listen(port);

  server.once("listening", () => {
    const address = server.address();
    const activePort = typeof address === "object" ? address.port : port;
    console.log(`Servidor disponível em http://localhost:${activePort}`);
  });

  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer();
}
