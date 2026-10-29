import "dotenv/config";
import { createServer } from "node:http";
import { PrismaClient } from "@prisma/client";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { googleJwksVerifier } from "./google.js";
import { createLogger } from "./logger.js";
import type { ApiDeps } from "./routes.js";
import { seedReferenceData } from "./db/seed.js";
import { localMediaStorage } from "./storage.js";

const config = loadConfig();
const logger = createLogger(config);
let deps: ApiDeps | undefined;
if (config.DATABASE_URL && config.TOKEN_SIGNING_SECRET) {
  deps = {
    prisma: new PrismaClient({ datasources: { db: { url: config.DATABASE_URL } } }),
    mail: {
      async deliver(message) {
        logger.info("mail_queued", { kind: message.kind });
      },
    },
    google: config.GOOGLE_CLIENT_ID
      ? googleJwksVerifier(config.GOOGLE_CLIENT_ID)
      : { async verify() { throw new Error("google is not configured"); } },
    storage: localMediaStorage(config.MEDIA_ROOT),
  };
  await seedReferenceData(deps.prisma);
}
const app = createApp(config, logger, deps);
const server = createServer(app);

server.listen(config.PORT, () => {
  logger.info("listening", { port: config.PORT });
});

function shutdown(signal: string) {
  logger.info("shutdown", { signal });
  server.close((error) => {
    if (error) {
      logger.error("shutdown_failed", { name: error.name });
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
