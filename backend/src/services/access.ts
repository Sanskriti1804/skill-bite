import type { Request } from "express";
import type { AppConfig } from "../config.js";
import type { ApiDeps, AuthContext } from "../deps.js";
import { HttpError } from "../errors.js";
import { randomToken, readAccessToken, sha256, signAccessToken } from "../security.js";

export function createAccess(config: AppConfig, deps: ApiDeps) {
  const { prisma } = deps;

  async function roleId(code: string): Promise<string> {
    const role = await prisma.role.findUnique({ where: { code } });
    if (!role) throw new HttpError(500, "internal_error", "Internal error");
    return role.roleId;
  }

  async function issueSession(userId: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const now = new Date();
    const session = await prisma.userSession.create({
      data: { userId, expiresAt: new Date(now.getTime() + config.SESSION_TTL_SECONDS * 1000) },
    });
    const refreshToken = randomToken();
    await prisma.refreshToken.create({
      data: {
        sessionId: session.sessionId,
        tokenHash: sha256(refreshToken),
        issuedAt: now,
        expiresAt: new Date(now.getTime() + config.REFRESH_TOKEN_TTL_SECONDS * 1000),
      },
    });
    const accessToken = await signAccessToken(config, userId, session.sessionId);
    return { accessToken, refreshToken, expiresIn: config.ACCESS_TOKEN_TTL_SECONDS };
  }

  async function requireAuth(req: Request): Promise<AuthContext> {
    const header = req.header("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) throw new HttpError(401, "unauthorized", "Authentication required");
    let claims: { userId: string; sessionId: string };
    try {
      claims = await readAccessToken(config, token);
    } catch {
      throw new HttpError(401, "unauthorized", "Authentication required");
    }
    const session = await prisma.userSession.findUnique({ where: { sessionId: claims.sessionId } });
    const now = new Date();
    if (!session || session.userId !== claims.userId || session.revokedAt || session.expiresAt <= now) {
      throw new HttpError(401, "unauthorized", "Authentication required");
    }
    const user = await prisma.appUser.findUnique({ where: { userId: claims.userId }, include: { role: true } });
    if (!user || user.accountStatus !== "ACTIVE") throw new HttpError(403, "forbidden", "Account is not active");
    return { userId: user.userId, sessionId: session.sessionId, role: user.role.code, status: user.accountStatus };
  }

  function requireRole(auth: AuthContext, roles: string[]): void {
    if (!roles.includes(auth.role)) throw new HttpError(403, "forbidden", "Not allowed");
  }

  async function audit(actorUserId: string, action: string, targetType: string, targetId: string): Promise<void> {
    await prisma.auditLog.create({ data: { actorUserId, action, targetType, targetId, details: action } });
  }

  async function ownContent(auth: AuthContext, contentId: string) {
    const content = await prisma.content.findUnique({ where: { contentId }, include: { video: true, tags: true } });
    if (!content) throw new HttpError(404, "not_found", "Not found");
    if (auth.role !== "ADMIN" && content.creatorId !== auth.userId) throw new HttpError(403, "forbidden", "Not allowed");
    return content;
  }

  return { prisma, config, deps, roleId, issueSession, requireAuth, requireRole, audit, ownContent };
}

export type Access = ReturnType<typeof createAccess>;
