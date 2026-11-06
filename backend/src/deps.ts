import type { PrismaClient } from "@prisma/client";
import type { AppConfig } from "./config.js";
import type { GoogleVerifier } from "./google.js";
import type { MediaStorage } from "./storage.js";

export const LIST_LIMIT = 20;
export const THRESHOLD_KEY = "completion_threshold_percent";

export type MailMessage = { kind: "verify" | "reset"; email: string; token: string };
export interface MailPort {
  deliver(message: MailMessage): Promise<void>;
}

export type ApiDeps = {
  prisma: PrismaClient;
  mail: MailPort;
  google: GoogleVerifier;
  storage: MediaStorage;
};

export type AuthContext = { userId: string; sessionId: string; role: string; status: string };
