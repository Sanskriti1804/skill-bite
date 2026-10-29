import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test from "node:test";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { createLogger } from "../src/logger.js";

const config = loadConfig({
  NODE_ENV: "test",
  PORT: "3000",
  LOG_LEVEL: "error",
});
const logger = createLogger(config);

async function withServer(run: (base: string) => Promise<void>) {
  const server = createServer(createApp(config, logger));
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("expected a TCP address");
  }
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.close();
    await once(server, "close");
  }
}

test("health returns ok", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok" });
  });
});

test("unknown path returns a generic not-found body", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/v1/missing`);
    assert.equal(response.status, 404);
    const body = await response.json();
    assert.equal(body.error.code, "not_found");
    assert.equal(JSON.stringify(body).includes("stack"), false);
  });
});

test("invalid JSON does not leak a stack trace", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/health`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });
    assert.equal(response.status, 500);
    const body = await response.json();
    assert.equal(body.error.code, "internal_error");
    assert.equal(body.error.message, "Internal error");
    assert.equal(JSON.stringify(body).includes("stack"), false);
  });
});

test("config rejects a missing port", () => {
  assert.throws(() => loadConfig({ NODE_ENV: "development" }), /Invalid environment: PORT/);
});
