import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().int().min(1).max(65535),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  DATABASE_URL: z.string().min(1).optional(),
  TOKEN_SIGNING_SECRET: z.string().min(16).optional(),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(1_209_600),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(1_209_600),
  AUTH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  ARGON2_MEMORY_COST: z.coerce.number().int().positive().default(19456),
  ARGON2_TIME_COST: z.coerce.number().int().positive().default(2),
  ARGON2_PARALLELISM: z.coerce.number().int().positive().default(1),
  GOOGLE_CLIENT_ID: z.string().optional(),
  MEDIA_ROOT: z.string().default("./var/media"),
  PUSH_TOKEN_KEY: z.string().min(16).optional(),
});

export type AppConfig = z.infer<typeof schema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join(".") || "env").join(", ");
    throw new Error(`Invalid environment: ${fields}`);
  }
  return parsed.data;
}

export function requireDatabaseUrl(config: AppConfig): string {
  if (!config.DATABASE_URL) {
    throw new Error("Invalid environment: DATABASE_URL");
  }
  return config.DATABASE_URL;
}
