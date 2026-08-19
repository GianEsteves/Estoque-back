import os from "node:os";
import { pathToFileURL } from "node:url";

import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import { errorHandler } from "./src/middleware/error-handler.js";
import routes from "./src/routes/index.js";

dotenv.config({ quiet: true });

export const app = express();

app.use(cors());
app.use(express.json());

routes(app);
app.use(errorHandler);

/**
 * Retorna o primeiro endereco IPv4 externo disponivel na maquina.
 */
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();

  for (const interfaceName in interfaces) {
    const iface = interfaces[interfaceName];

    if (!iface) {
      continue;
    }

    for (const alias of iface) {
      if (alias.family === "IPv4" && !alias.internal) {
        return alias.address;
      }
    }
  }

  return "localhost";
}

/**
 * Exibe no terminal os enderecos do servidor depois que a porta e aberta.
 */
function logServerAddress(server, localIp, fallbackPort) {
  const address = server.address();
  const activePort = typeof address === "object" ? address.port : fallbackPort;

  console.log(`Server is running on port ${activePort}`);
  console.log(`Backend URL: http://${localIp}:${activePort}`);
}

/**
 * Inicia o servidor HTTP na porta informada ou na porta configurada no ambiente.
 */
export function startServer(port = Number(process.env.PORT) || 6868) {
  const localIp = getLocalIpAddress();
  const server = app.listen(port);

  server.once(
    "listening",
    logServerAddress.bind(null, server, localIp, port),
  );

  return server;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer();
}
