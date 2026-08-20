// Aguarda o servidor de teste ficar disponível.
export function waitForServer(server) {
  if (server.listening) {
    return Promise.resolve();
  }

  return new Promise((resolve) => server.once("listening", resolve));
}
