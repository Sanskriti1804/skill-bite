import "dotenv/config";
import { createServer } from "node:http";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createLogger } from "./logger.js";

const config = loadConfig();
const logger = createLogger(config);
const app = createApp(config, logger);
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
