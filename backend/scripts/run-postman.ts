import { execSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { once } from "node:events";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import EmbeddedPostgres from "embedded-postgres";
import newman from "newman";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { createLogger } from "../src/logger.js";
import type { MailMessage } from "../src/routes.js";
import { hashPassword } from "../src/security.js";
import { seedReferenceData } from "../src/db/seed.js";
import { localMediaStorage } from "../src/storage.js";

const databaseDir = mkdtempSync(path.join(tmpdir(), "skillbite-postman-"));
const mediaRoot = mkdtempSync(path.join(tmpdir(), "skillbite-postman-media-"));
const port = 55433;
const databaseUrl = `postgresql://postgres:postgres@127.0.0.1:${port}/skillbite`;
const adminPassword = randomBytes(18).toString("base64url");
const mailbox: MailMessage[] = [];

const config = loadConfig({
  NODE_ENV: "test",
  PORT: "3000",
  LOG_LEVEL: "error",
  DATABASE_URL: databaseUrl,
  TOKEN_SIGNING_SECRET: "test-signing-secret-value",
  PUSH_TOKEN_KEY: "test-push-token-key-value",
  MEDIA_ROOT: mediaRoot,
});
const logger = createLogger(config);
const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
const app = createApp(config, logger, {
  prisma,
  mail: { async deliver(message) { mailbox.push(message); } },
  google: { async verify() { throw new Error("google is not configured"); } },
  storage: localMediaStorage(mediaRoot),
});

function latest(kind: MailMessage["kind"]): string {
  const message = [...mailbox].reverse().find((item) => item.kind === kind);
  if (!message) throw new Error(`no ${kind} mail`);
  return message.token;
}

function replaceBody(request: { body?: { raw?: string; update?: (value: string) => void } }, value: string): void {
  if (!request.body) return;
  request.body.raw = value;
  request.body.update?.(value);
}

const pg = new EmbeddedPostgres({ databaseDir, port, user: "postgres", password: "postgres", persistent: false });
await pg.initialise();
await pg.start();
await pg.createDatabase("skillbite");
execSync("npx prisma migrate deploy", {
  cwd: path.resolve("."),
  env: { ...process.env, DATABASE_URL: databaseUrl },
  stdio: "inherit",
});
await seedReferenceData(prisma);
const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: "ADMIN" } });
await prisma.appUser.create({
  data: {
    roleId: adminRole.roleId,
    emailNormalized: "admin@example.com",
    displayName: "Admin",
    accountStatus: "ACTIVE",
    passwordHash: await hashPassword(adminPassword, config),
    emailVerifiedAt: new Date(),
  },
});

const server = createServer(app);
server.listen(0, "127.0.0.1");
await once(server, "listening");
const address = server.address();
if (address === null || typeof address === "string") throw new Error("no port");
const baseUrl = `http://127.0.0.1:${address.port}`;

const environment = JSON.parse(readFileSync(path.resolve("../documentation/postman/SkillBite.postman_environment.json"), "utf8"));
for (const entry of environment.values) {
  if (entry.key === "baseUrl") entry.value = baseUrl;
  if (entry.key === "adminPassword") entry.value = adminPassword;
}
const environmentPath = path.join(tmpdir(), `skillbite-postman-env-${process.pid}.json`);
writeFileSync(environmentPath, JSON.stringify(environment));

const failures = await new Promise<number>((resolve, reject) => {
  newman.run({
    collection: path.resolve("../documentation/postman/SkillBite.postman_collection.json"),
    environment: environmentPath,
    reporters: ["cli"],
    timeoutRequest: 120000,
  }).on("beforeRequest", (_error: Error | null, args: { request: { url: { toString(): string }; body?: { raw?: string; update?: (value: string) => void } } }) => {
    const url = args.request.url.toString();
    if (url.endsWith("/api/v1/auth/verify-email")) {
      replaceBody(args.request, JSON.stringify({ token: latest("verify") }));
    }
    if (url.endsWith("/api/v1/auth/password-reset/confirm")) {
      replaceBody(args.request, JSON.stringify({ token: latest("reset"), password: "password1" }));
    }
  }).on("done", (error: Error | null, summary: { run: { failures: unknown[] } }) => {
    if (error) reject(error);
    else resolve(summary.run.failures.length);
  });
});

server.close();
await once(server, "close");
await prisma.$disconnect();
await pg.stop();
rmSync(environmentPath, { force: true });
rmSync(databaseDir, { recursive: true, force: true });
rmSync(mediaRoot, { recursive: true, force: true });
if (failures > 0) process.exit(1);
