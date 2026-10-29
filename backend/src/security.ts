import { createHash, createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from "node:crypto";
import argon2 from "argon2";
import { SignJWT, jwtVerify } from "jose";
import type { AppConfig } from "./config.js";

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function randomToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashesEqual(stored: string, presented: string): boolean {
  const a = Buffer.from(stored);
  const b = Buffer.from(presented);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function hashPassword(password: string, config: AppConfig): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: config.ARGON2_MEMORY_COST,
    timeCost: config.ARGON2_TIME_COST,
    parallelism: config.ARGON2_PARALLELISM,
  });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

const dummyHashes = new Map<string, Promise<string>>();

export async function verifyMissingPassword(password: string, config: AppConfig): Promise<void> {
  const key = `${config.ARGON2_MEMORY_COST}:${config.ARGON2_TIME_COST}:${config.ARGON2_PARALLELISM}`;
  let pending = dummyHashes.get(key);
  if (!pending) {
    pending = hashPassword("not-a-stored-credential", config);
    dummyHashes.set(key, pending);
  }
  await verifyPassword(await pending, password);
}

function signingKey(config: AppConfig): Uint8Array {
  if (!config.TOKEN_SIGNING_SECRET) {
    throw new Error("Invalid environment: TOKEN_SIGNING_SECRET");
  }
  return new TextEncoder().encode(config.TOKEN_SIGNING_SECRET);
}

export async function signAccessToken(config: AppConfig, userId: string, sessionId: string): Promise<string> {
  return new SignJWT({ sid: sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer("skillbite")
    .setAudience("skillbite-api")
    .setIssuedAt()
    .setExpirationTime(`${config.ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(signingKey(config));
}

export async function readAccessToken(config: AppConfig, token: string): Promise<{ userId: string; sessionId: string }> {
  const { payload } = await jwtVerify(token, signingKey(config), {
    issuer: "skillbite",
    audience: "skillbite-api",
  });
  if (typeof payload.sub !== "string" || typeof payload.sid !== "string") {
    throw new Error("invalid token");
  }
  return { userId: payload.sub, sessionId: payload.sid };
}

export function encryptSecret(keyMaterial: string, plaintext: string): string {
  const key = createHash("sha256").update(keyMaterial).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptSecret(keyMaterial: string, stored: string): string {
  const buf = Buffer.from(stored, "base64url");
  const key = createHash("sha256").update(keyMaterial).digest();
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
