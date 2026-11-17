import type { Access } from "./access.js";
import { HttpError } from "../errors.js";
import { hashPassword, randomToken, sha256, signAccessToken, verifyMissingPassword, verifyPassword } from "../security.js";
import { normalizeUsername, slugFromIdentity } from "../username.js";

function passwordOk(password: unknown): password is string {
  return typeof password === "string" && password.length >= 8;
}

function normalizeEmail(email: unknown): string {
  if (typeof email !== "string" || !email.includes("@")) throw new HttpError(400, "validation", "Invalid email");
  return email.trim().toLowerCase();
}

async function allocateUsername(
  prisma: Access["prisma"],
  preferred: string,
): Promise<string> {
  let candidate = preferred.slice(0, 24);
  for (let i = 0; i < 20; i += 1) {
    const taken = await prisma.appUser.findUnique({ where: { usernameNormalized: candidate } });
    if (!taken) return candidate;
    const suffix = String(i + 2);
    candidate = `${preferred.slice(0, Math.max(3, 24 - suffix.length - 1))}_${suffix}`;
  }
  return `user_${randomToken().slice(0, 12)}`;
}

export function createAuthService(access: Access) {
  const { prisma, config, deps, roleId, issueSession } = access;

  return {
    async register(body: {
      email?: unknown;
      password?: unknown;
      displayName?: unknown;
      username?: unknown;
      role?: unknown;
    }) {
      const email = normalizeEmail(body.email);
      if (!passwordOk(body.password)) throw new HttpError(400, "validation", "Password is too weak");
      const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
      if (!displayName) throw new HttpError(400, "validation", "Display name is required");
      const username = normalizeUsername(body.username);
      const roleCode = body.role === "CREATOR" ? "CREATOR" : body.role === "USER" ? "USER" : "";
      if (!roleCode) throw new HttpError(400, "validation", "Role must be USER or CREATOR");
      const existingEmail = await prisma.appUser.findUnique({ where: { emailNormalized: email } });
      if (existingEmail) throw new HttpError(409, "conflict", "Email is already registered");
      const existingUsername = await prisma.appUser.findUnique({ where: { usernameNormalized: username } });
      if (existingUsername) throw new HttpError(409, "conflict", "Username is already taken");
      const user = await prisma.appUser.create({
        data: {
          emailNormalized: email,
          usernameNormalized: username,
          passwordHash: await hashPassword(body.password, config),
          displayName,
          accountStatus: "ACTIVE",
          roleId: await roleId(roleCode),
        },
      });
      const token = randomToken();
      await prisma.authToken.create({
        data: {
          userId: user.userId,
          tokenType: "EMAIL_VERIFICATION",
          tokenHash: sha256(token),
          expiresAt: new Date(Date.now() + config.AUTH_TOKEN_TTL_SECONDS * 1000),
        },
      });
      await deps.mail.deliver({ kind: "verify", email, token });
      return { userId: user.userId };
    },

    async verifyEmail(token: string) {
      const row = await prisma.authToken.findUnique({ where: { tokenHash: sha256(token) } });
      const now = new Date();
      if (!row || row.tokenType !== "EMAIL_VERIFICATION" || row.consumedAt || row.revokedAt || row.expiresAt <= now) {
        throw new HttpError(400, "validation", "Verification failed");
      }
      await prisma.$transaction([
        prisma.authToken.update({ where: { tokenId: row.tokenId }, data: { consumedAt: now } }),
        prisma.appUser.update({ where: { userId: row.userId }, data: { emailVerifiedAt: now } }),
      ]);
      return { verified: true as const };
    },

    async login(emailOrUsernameRaw: unknown, password: unknown) {
      const identifier = typeof emailOrUsernameRaw === "string" ? emailOrUsernameRaw.trim().toLowerCase() : "";
      const presented = typeof password === "string" ? password : "";
      let user = null;
      if (identifier.includes("@")) {
        user = await prisma.appUser.findUnique({ where: { emailNormalized: identifier } });
      } else if (identifier) {
        user = await prisma.appUser.findUnique({ where: { usernameNormalized: identifier } });
      }
      if (!user?.passwordHash) {
        await verifyMissingPassword(presented, config);
        throw new HttpError(401, "unauthorized", "Invalid email or password");
      }
      const ok = await verifyPassword(user.passwordHash, presented);
      if (!ok) throw new HttpError(401, "unauthorized", "Invalid email or password");
      if (user.accountStatus !== "ACTIVE") throw new HttpError(403, "forbidden", "Account is not active");
      return issueSession(user.userId);
    },

    async startReset(emailRaw: unknown) {
      const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
      const user = email ? await prisma.appUser.findUnique({ where: { emailNormalized: email } }) : null;
      if (user) {
        const token = randomToken();
        await prisma.authToken.create({
          data: {
            userId: user.userId,
            tokenType: "PASSWORD_RESET",
            tokenHash: sha256(token),
            expiresAt: new Date(Date.now() + config.AUTH_TOKEN_TTL_SECONDS * 1000),
          },
        });
        await deps.mail.deliver({ kind: "reset", email, token });
      }
      return { status: "ok" as const };
    },

    async confirmReset(token: string, password: unknown) {
      if (!passwordOk(password)) throw new HttpError(400, "validation", "Password is too weak");
      const row = await prisma.authToken.findUnique({ where: { tokenHash: sha256(token) }, include: { user: true } });
      const now = new Date();
      if (!row || row.tokenType !== "PASSWORD_RESET" || row.consumedAt || row.revokedAt || row.expiresAt <= now) {
        throw new HttpError(400, "validation", "Recovery failed");
      }
      if (row.user.accountStatus !== "ACTIVE") throw new HttpError(403, "forbidden", "Account is not active");
      await prisma.$transaction([
        prisma.authToken.update({ where: { tokenId: row.tokenId }, data: { consumedAt: now } }),
        prisma.appUser.update({ where: { userId: row.userId }, data: { passwordHash: await hashPassword(password, config) } }),
      ]);
      return { status: "ok" as const };
    },

    async refresh(raw: string) {
      const row = await prisma.refreshToken.findUnique({ where: { tokenHash: sha256(raw) }, include: { session: true } });
      const now = new Date();
      if (!row || row.session.revokedAt || row.session.expiresAt <= now || row.expiresAt <= now) {
        throw new HttpError(401, "unauthorized", "Authentication required");
      }
      const account = await prisma.appUser.findUnique({ where: { userId: row.session.userId } });
      if (!account || account.accountStatus !== "ACTIVE") throw new HttpError(403, "forbidden", "Account is not active");
      if (row.usedAt || row.revokedAt) {
        await prisma.userSession.update({ where: { sessionId: row.sessionId }, data: { revokedAt: now } });
        await prisma.refreshToken.updateMany({ where: { sessionId: row.sessionId }, data: { revokedAt: now } });
        throw new HttpError(401, "unauthorized", "Authentication required");
      }
      const refreshToken = randomToken();
      await prisma.$transaction(async (tx) => {
        await tx.refreshToken.update({ where: { refreshTokenId: row.refreshTokenId }, data: { usedAt: now } });
        const created = await tx.refreshToken.create({
          data: {
            sessionId: row.sessionId,
            tokenHash: sha256(refreshToken),
            issuedAt: now,
            expiresAt: new Date(now.getTime() + config.REFRESH_TOKEN_TTL_SECONDS * 1000),
          },
        });
        await tx.refreshToken.update({ where: { refreshTokenId: row.refreshTokenId }, data: { replacedByTokenId: created.refreshTokenId } });
      });
      const accessToken = await signAccessToken(config, row.session.userId, row.sessionId);
      return { accessToken, refreshToken, expiresIn: config.ACCESS_TOKEN_TTL_SECONDS };
    },

    async logout(sessionId: string) {
      const now = new Date();
      await prisma.userSession.update({ where: { sessionId }, data: { revokedAt: now } });
      await prisma.refreshToken.updateMany({ where: { sessionId, revokedAt: null }, data: { revokedAt: now } });
      return { status: "ok" as const };
    },

    async google(identityToken: string) {
      let identity;
      try {
        identity = await deps.google.verify(identityToken);
      } catch {
        throw new HttpError(401, "unauthorized", "Invalid Google token");
      }
      if (!identity.emailVerified) throw new HttpError(401, "unauthorized", "Invalid Google token");
      const email = identity.email.trim().toLowerCase();
      const existingIdentity = await prisma.authIdentity.findUnique({
        where: { provider_providerUserId: { provider: "google", providerUserId: identity.subject } },
      });
      let userId = existingIdentity?.userId;
      if (!userId) {
        const byEmail = await prisma.appUser.findUnique({ where: { emailNormalized: email } });
        if (byEmail) {
          userId = byEmail.userId;
          await prisma.authIdentity.create({ data: { userId, provider: "google", providerUserId: identity.subject } });
        } else {
          const username = await allocateUsername(prisma, slugFromIdentity(email.split("@")[0] ?? "user"));
          const created = await prisma.appUser.create({
            data: {
              emailNormalized: email,
              usernameNormalized: username,
              displayName: email,
              accountStatus: "ACTIVE",
              emailVerifiedAt: new Date(),
              roleId: await roleId("USER"),
            },
          });
          await prisma.authIdentity.create({ data: { userId: created.userId, provider: "google", providerUserId: identity.subject } });
          userId = created.userId;
        }
      }
      const user = await prisma.appUser.findUnique({ where: { userId } });
      if (!user || user.accountStatus !== "ACTIVE") throw new HttpError(403, "forbidden", "Account is not active");
      return issueSession(user.userId);
    },

    async updateUsername(userId: string, usernameRaw: unknown) {
      const username = normalizeUsername(usernameRaw);
      const existing = await prisma.appUser.findUnique({ where: { usernameNormalized: username } });
      if (existing && existing.userId !== userId) {
        throw new HttpError(409, "conflict", "Username is already taken");
      }
      const user = await prisma.appUser.update({
        where: { userId },
        data: { usernameNormalized: username },
      });
      return { username: user.usernameNormalized };
    },
  };
}
