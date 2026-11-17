import { HttpError } from "./errors.js";

const USERNAME_RE = /^[a-z0-9_]{3,24}$/;

const RESERVED = new Set([
  "admin",
  "administrator",
  "api",
  "support",
  "help",
  "root",
  "system",
  "null",
  "undefined",
  "me",
  "login",
  "logout",
  "register",
  "skillbite",
  "official",
]);

/** Normalize and validate a username. Throws HttpError on invalid input. */
export function normalizeUsername(raw: unknown): string {
  if (typeof raw !== "string") throw new HttpError(400, "validation", "Username is required");
  const username = raw.trim().toLowerCase();
  if (!username) throw new HttpError(400, "validation", "Username is required");
  if (!USERNAME_RE.test(username)) {
    throw new HttpError(
      400,
      "validation",
      "Username must be 3–24 characters: letters, numbers, and underscores only",
    );
  }
  if (RESERVED.has(username)) {
    throw new HttpError(400, "validation", "This username is reserved");
  }
  return username;
}

/** Build a valid unique-friendly base from an email local-part or display name. */
export function slugFromIdentity(source: string): string {
  let base = source
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  if (base.length < 3) base = `user_${base}`.replace(/_+/g, "_");
  if (base.length > 18) base = base.slice(0, 18).replace(/_+$/g, "");
  if (base.length < 3) base = "user";
  if (RESERVED.has(base)) base = `${base}_user`;
  return base;
}
