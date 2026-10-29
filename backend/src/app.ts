import express, { type ErrorRequestHandler, type NextFunction, type Request, type Response } from "express";
import type { AppConfig } from "./config.js";
import { HttpError } from "./errors.js";
import type { Logger } from "./logger.js";
import { createApiRouter, type ApiDeps } from "./routes.js";

export { HttpError } from "./errors.js";

export function createApp(config: AppConfig, logger: Logger, deps?: ApiDeps) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));

  app.use((req, res, next) => {
    const started = Date.now();
    res.on("finish", () => {
      logger.info("request", {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        ms: Date.now() - started,
      });
    });
    next();
  });

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  if (deps) {
    app.use("/api/v1", createApiRouter(config, deps));
  }

  app.use((_req, res) => {
    res.status(404).json({ error: { code: "not_found", message: "Not found" } });
  });

  const errorHandler: ErrorRequestHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: { code: err.code, message: err.message } });
      return;
    }
    logger.error("unhandled_error", { name: err instanceof Error ? err.name : "unknown" });
    const message = config.NODE_ENV === "production" ? "Internal error" : "Internal error";
    res.status(500).json({ error: { code: "internal_error", message } });
  };
  app.use(errorHandler);

  return app;
}
