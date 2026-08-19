import assert from "node:assert/strict";
import test from "node:test";

import { startServer } from "../../app.js";
import { waitForServer } from "./helpers/server.js";

test("GET /health retorna o status da aplicacao", async () => {
  const server = startServer(0);

  await waitForServer(server);
  const { port } = server.address();

  try {
    const response = await fetch(`http://localhost:${port}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, { status: "ok" });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
