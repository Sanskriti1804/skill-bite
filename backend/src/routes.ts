import { Router, type Request, type Response, type NextFunction } from "express";
import type { Prisma, PrismaClient } from "@prisma/client";
import type { AppConfig } from "./config.js";
import { HttpError } from "./errors.js";
import type { GoogleVerifier } from "./google.js";
import {
  encryptSecret,
  hashPassword,
  randomToken,
  readAccessToken,
  sha256,
  signAccessToken,
  verifyMissingPassword,
  verifyPassword,
} from "./security.js";
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

type AuthContext = { userId: string; sessionId: string; role: string; status: string };

function asyncHandler(fn: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };
}

function passwordOk(password: unknown): password is string {
  return typeof password === "string" && password.length >= 8;
}

function normalizeEmail(email: unknown): string {
  if (typeof email !== "string" || !email.includes("@")) {
    throw new HttpError(400, "validation", "Invalid email");
  }
  return email.trim().toLowerCase();
}

export function createApiRouter(config: AppConfig, deps: ApiDeps): Router {
  const router = Router();
  const { prisma } = deps;

  async function roleId(code: string): Promise<string> {
    const role = await prisma.role.findUnique({ where: { code } });
    if (!role) throw new HttpError(500, "internal_error", "Internal error");
    return role.roleId;
  }

  async function issueSession(userId: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const now = new Date();
    const session = await prisma.userSession.create({
      data: {
        userId,
        expiresAt: new Date(now.getTime() + config.SESSION_TTL_SECONDS * 1000),
      },
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
    const user = await prisma.appUser.findUnique({
      where: { userId: claims.userId },
      include: { role: true },
    });
    if (!user || user.accountStatus !== "ACTIVE") {
      throw new HttpError(403, "forbidden", "Account is not active");
    }
    return { userId: user.userId, sessionId: session.sessionId, role: user.role.code, status: user.accountStatus };
  }

  function requireRole(auth: AuthContext, roles: string[]): void {
    if (!roles.includes(auth.role)) throw new HttpError(403, "forbidden", "Not allowed");
  }

  async function audit(actorUserId: string, action: string, targetType: string, targetId: string): Promise<void> {
    await prisma.auditLog.create({
      data: { actorUserId, action, targetType, targetId, details: action },
    });
  }

  router.post("/auth/register", asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    if (!passwordOk(req.body?.password)) throw new HttpError(400, "validation", "Password is too weak");
    const displayName = typeof req.body?.displayName === "string" ? req.body.displayName.trim() : "";
    if (!displayName) throw new HttpError(400, "validation", "Display name is required");
    const roleCode = req.body?.role === "CREATOR" ? "CREATOR" : req.body?.role === "USER" ? "USER" : "";
    if (!roleCode) throw new HttpError(400, "validation", "Role must be USER or CREATOR");
    const existing = await prisma.appUser.findUnique({ where: { emailNormalized: email } });
    if (existing) throw new HttpError(409, "conflict", "Email is already registered");
    const user = await prisma.appUser.create({
      data: {
        emailNormalized: email,
        passwordHash: await hashPassword(req.body.password, config),
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
    res.status(201).json({ userId: user.userId });
  }));

  router.post("/auth/verify-email", asyncHandler(async (req, res) => {
    const token = typeof req.body?.token === "string" ? req.body.token : "";
    const row = await prisma.authToken.findUnique({ where: { tokenHash: sha256(token) } });
    const now = new Date();
    if (!row || row.tokenType !== "EMAIL_VERIFICATION" || row.consumedAt || row.revokedAt || row.expiresAt <= now) {
      throw new HttpError(400, "validation", "Verification failed");
    }
    await prisma.$transaction([
      prisma.authToken.update({ where: { tokenId: row.tokenId }, data: { consumedAt: now } }),
      prisma.appUser.update({ where: { userId: row.userId }, data: { emailVerifiedAt: now } }),
    ]);
    res.status(200).json({ verified: true });
  }));

  router.post("/auth/login", asyncHandler(async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const user = email ? await prisma.appUser.findUnique({ where: { emailNormalized: email } }) : null;
    if (!user?.passwordHash) {
      await verifyMissingPassword(password, config);
      throw new HttpError(401, "unauthorized", "Invalid email or password");
    }
    const ok = await verifyPassword(user.passwordHash, password);
    if (!ok) throw new HttpError(401, "unauthorized", "Invalid email or password");
    if (user.accountStatus !== "ACTIVE") throw new HttpError(403, "forbidden", "Account is not active");
    res.status(200).json(await issueSession(user.userId));
  }));

  router.post("/auth/password-reset", asyncHandler(async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
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
    res.status(200).json({ status: "ok" });
  }));

  router.post("/auth/password-reset/confirm", asyncHandler(async (req, res) => {
    const token = typeof req.body?.token === "string" ? req.body.token : "";
    if (!passwordOk(req.body?.password)) throw new HttpError(400, "validation", "Password is too weak");
    const row = await prisma.authToken.findUnique({ where: { tokenHash: sha256(token) }, include: { user: true } });
    const now = new Date();
    if (!row || row.tokenType !== "PASSWORD_RESET" || row.consumedAt || row.revokedAt || row.expiresAt <= now) {
      throw new HttpError(400, "validation", "Recovery failed");
    }
    if (row.user.accountStatus !== "ACTIVE") throw new HttpError(403, "forbidden", "Account is not active");
    await prisma.$transaction([
      prisma.authToken.update({ where: { tokenId: row.tokenId }, data: { consumedAt: now } }),
      prisma.appUser.update({
        where: { userId: row.userId },
        data: { passwordHash: await hashPassword(req.body.password, config) },
      }),
    ]);
    res.status(200).json({ status: "ok" });
  }));

  router.post("/auth/refresh", asyncHandler(async (req, res) => {
    const raw = typeof req.body?.refreshToken === "string" ? req.body.refreshToken : "";
    const row = await prisma.refreshToken.findUnique({
      where: { tokenHash: sha256(raw) },
      include: { session: true },
    });
    const now = new Date();
    if (!row || row.session.revokedAt || row.session.expiresAt <= now || row.expiresAt <= now) {
      throw new HttpError(401, "unauthorized", "Authentication required");
    }
    const account = await prisma.appUser.findUnique({ where: { userId: row.session.userId } });
    if (!account || account.accountStatus !== "ACTIVE") {
      throw new HttpError(403, "forbidden", "Account is not active");
    }
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
      await tx.refreshToken.update({
        where: { refreshTokenId: row.refreshTokenId },
        data: { replacedByTokenId: created.refreshTokenId },
      });
    });
    const accessToken = await signAccessToken(config, row.session.userId, row.sessionId);
    res.status(200).json({ accessToken, refreshToken, expiresIn: config.ACCESS_TOKEN_TTL_SECONDS });
  }));

  router.post("/auth/logout", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    const now = new Date();
    await prisma.userSession.update({ where: { sessionId: auth.sessionId }, data: { revokedAt: now } });
    await prisma.refreshToken.updateMany({
      where: { sessionId: auth.sessionId, revokedAt: null },
      data: { revokedAt: now },
    });
    res.status(200).json({ status: "ok" });
  }));

  router.post("/auth/google", asyncHandler(async (req, res) => {
    const identityToken = typeof req.body?.identityToken === "string" ? req.body.identityToken : "";
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
        await prisma.authIdentity.create({
          data: { userId, provider: "google", providerUserId: identity.subject },
        });
      } else {
        const created = await prisma.appUser.create({
          data: {
            emailNormalized: email,
            displayName: email,
            accountStatus: "ACTIVE",
            emailVerifiedAt: new Date(),
            roleId: await roleId("USER"),
          },
        });
        await prisma.authIdentity.create({
          data: { userId: created.userId, provider: "google", providerUserId: identity.subject },
        });
        userId = created.userId;
      }
    }
    const user = await prisma.appUser.findUnique({ where: { userId } });
    if (!user || user.accountStatus !== "ACTIVE") throw new HttpError(403, "forbidden", "Account is not active");
    res.status(200).json(await issueSession(user.userId));
  }));

  router.get("/me", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    const user = await prisma.appUser.findUnique({ where: { userId: auth.userId }, include: { role: true } });
    if (!user) throw new HttpError(401, "unauthorized", "Authentication required");
    res.status(200).json({
      userId: user.userId,
      email: user.emailNormalized,
      displayName: user.displayName,
      role: user.role.code,
      accountStatus: user.accountStatus,
    });
  }));

  router.patch("/me/role", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    requireRole(auth, ["USER", "CREATOR"]);
    const role = req.body?.role === "USER" || req.body?.role === "CREATOR" ? req.body.role : "";
    if (!role) throw new HttpError(400, "validation", "Role must be USER or CREATOR");
    await prisma.appUser.update({ where: { userId: auth.userId }, data: { roleId: await roleId(role) } });
    res.status(200).json({ role });
  }));

  router.get("/admin/users", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    requireRole(auth, ["ADMIN"]);
    const items = await prisma.appUser.findMany({
      take: LIST_LIMIT,
      orderBy: { createdAt: "desc" },
      include: { role: true },
    });
    res.status(200).json({
      limit: LIST_LIMIT,
      items: items.map((user) => ({
        userId: user.userId,
        email: user.emailNormalized,
        displayName: user.displayName,
        role: user.role.code,
        accountStatus: user.accountStatus,
      })),
    });
  }));

  router.patch("/admin/users/:userId/status", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    requireRole(auth, ["ADMIN"]);
    const accountStatus = req.body?.accountStatus;
    if (!["ACTIVE", "SUSPENDED", "DEACTIVATED"].includes(accountStatus)) {
      throw new HttpError(400, "validation", "Invalid account status");
    }
    await prisma.$transaction(async (tx) => {
      await tx.appUser.update({ where: { userId: req.params.userId }, data: { accountStatus } });
      await tx.auditLog.create({
        data: {
          actorUserId: auth.userId,
          action: "account_status",
          targetType: "app_user",
          targetId: req.params.userId,
          details: "account_status",
        },
      });
    });
    res.status(200).json({ accountStatus });
  }));

  async function ownContent(auth: AuthContext, contentId: string) {
    const content = await prisma.content.findUnique({ where: { contentId }, include: { video: true, tags: true } });
    if (!content) throw new HttpError(404, "not_found", "Not found");
    if (auth.role !== "ADMIN" && content.creatorId !== auth.userId) throw new HttpError(403, "forbidden", "Not allowed");
    return content;
  }

  router.post("/videos", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    requireRole(auth, ["CREATOR", "ADMIN"]);
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    if (!title) throw new HttpError(400, "validation", "Title is required");
    const content = await prisma.content.create({
      data: {
        creatorId: auth.userId,
        contentType: "VIDEO",
        title,
        description: typeof req.body?.description === "string" ? req.body.description : null,
        keywords: typeof req.body?.keywords === "string" ? req.body.keywords : null,
        status: "DRAFT",
        video: {
          create: {
            mediaReference: "",
            durationSeconds: Number.isInteger(req.body?.durationSeconds) ? req.body.durationSeconds : 0,
            sources: typeof req.body?.sources === "string" ? req.body.sources : null,
          },
        },
      },
    });
    if (Array.isArray(req.body?.tagIds)) {
      for (const tagId of req.body.tagIds) {
        if (typeof tagId === "string") {
          await prisma.contentTag.create({ data: { contentId: content.contentId, tagId } });
        }
      }
    }
    res.status(201).json({ contentId: content.contentId, status: "DRAFT" });
  }));

  router.patch("/videos/:contentId", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    requireRole(auth, ["CREATOR", "ADMIN"]);
    const content = await ownContent(auth, req.params.contentId);
    if (content.contentType !== "VIDEO") throw new HttpError(404, "not_found", "Not found");
    if (content.status === "PUBLISHED") throw new HttpError(409, "conflict", "Published video cannot be edited in place");
    await prisma.content.update({
      where: { contentId: content.contentId },
      data: {
        title: typeof req.body?.title === "string" ? req.body.title : undefined,
        description: typeof req.body?.description === "string" ? req.body.description : undefined,
        keywords: typeof req.body?.keywords === "string" ? req.body.keywords : undefined,
        video: typeof req.body?.sources === "string" ? { update: { sources: req.body.sources } } : undefined,
      },
    });
    res.status(200).json({ contentId: content.contentId });
  }));

  router.put("/videos/:contentId/media", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    requireRole(auth, ["CREATOR", "ADMIN"]);
    const content = await ownContent(auth, req.params.contentId);
    const mime = typeof req.body?.mimeType === "string" ? req.body.mimeType : "";
    const data = typeof req.body?.dataBase64 === "string" ? req.body.dataBase64 : "";
    if (!mime.startsWith("video/")) throw new HttpError(400, "validation", "File must be a video");
    const bytes = Buffer.from(data, "base64");
    if (bytes.length === 0) throw new HttpError(400, "validation", "File is empty");
    const reference = await deps.storage.saveVideo(content.contentId, bytes);
    await prisma.videoDetails.update({
      where: { contentId: content.contentId },
      data: {
        mediaReference: reference,
        durationSeconds: Number.isInteger(req.body?.durationSeconds) ? req.body.durationSeconds : content.video?.durationSeconds ?? 0,
      },
    });
    res.status(200).json({ mediaReference: reference });
  }));

  router.get("/videos/:contentId/media", asyncHandler(async (req, res) => {
    const content = await prisma.content.findUnique({ where: { contentId: req.params.contentId }, include: { video: true } });
    if (!content?.video || !content.video.mediaReference) throw new HttpError(404, "not_found", "Not found");
    const published = content.status === "PUBLISHED" && !content.deletedAt;
    if (!published) {
      const auth = await requireAuth(req);
      if (auth.role !== "ADMIN" && auth.userId !== content.creatorId) throw new HttpError(403, "forbidden", "Not allowed");
    }
    const bytes = await deps.storage.read(content.video.mediaReference);
    res.status(200).type("video/mp4").send(bytes);
  }));

  router.post("/videos/:contentId/publish", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    requireRole(auth, ["CREATOR", "ADMIN"]);
    const content = await ownContent(auth, req.params.contentId);
    const video = content.video;
    const tagCount = await prisma.contentTag.count({ where: { contentId: content.contentId } });
    if (!video?.mediaReference || !content.description || !content.keywords || !video.sources || tagCount < 1) {
      throw new HttpError(400, "validation", "Required video fields are missing");
    }
    await prisma.content.update({
      where: { contentId: content.contentId },
      data: { status: "PUBLISHED", publishedAt: content.publishedAt ?? new Date() },
    });
    res.status(200).json({ status: "PUBLISHED" });
  }));

  router.post("/videos/:contentId/takedown", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    requireRole(auth, ["CREATOR", "ADMIN"]);
    const content = await ownContent(auth, req.params.contentId);
    await prisma.content.update({ where: { contentId: content.contentId }, data: { status: "UNPUBLISHED" } });
    res.status(200).json({ status: "UNPUBLISHED" });
  }));

  router.post("/videos/:contentId/captions", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    requireRole(auth, ["CREATOR", "ADMIN"]);
    await ownContent(auth, req.params.contentId);
    const method = req.body?.method === "UPLOADED" || req.body?.method === "GENERATED" ? req.body.method : "";
    if (!method) throw new HttpError(400, "validation", "Caption method is required");
    const languageCode = typeof req.body?.languageCode === "string" ? req.body.languageCode : "en";
    const format = typeof req.body?.format === "string" ? req.body.format : "vtt";
    try {
      const caption = await prisma.videoCaption.create({
        data: {
          videoContentId: req.params.contentId,
          languageCode,
          format,
          method,
          captionReference: typeof req.body?.captionReference === "string" ? req.body.captionReference : "inline",
          reviewedAt: req.body?.reviewed === true ? new Date() : null,
        },
      });
      res.status(201).json({ captionId: caption.captionId });
    } catch {
      throw new HttpError(409, "conflict", "Caption already exists");
    }
  }));

  router.post("/videos/:contentId/attachments", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    requireRole(auth, ["CREATOR", "ADMIN"]);
    await ownContent(auth, req.params.contentId);
    const kind = req.body?.kind;
    if (!["PDF", "TEXT", "HYPERLINK"].includes(kind)) throw new HttpError(400, "validation", "Invalid attachment");
    const reference = typeof req.body?.reference === "string" ? req.body.reference : "";
    if (!reference) throw new HttpError(400, "validation", "Reference is required");
    const row = await prisma.contentAttachment.create({
      data: { contentId: req.params.contentId, kind, reference },
    });
    res.status(201).json({ attachmentId: row.attachmentId });
  }));

  router.delete("/videos/:contentId/attachments/:attachmentId", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    requireRole(auth, ["CREATOR", "ADMIN"]);
    await ownContent(auth, req.params.contentId);
    const attachment = await prisma.contentAttachment.findUnique({ where: { attachmentId: req.params.attachmentId } });
    if (!attachment || attachment.contentId !== req.params.contentId) throw new HttpError(404, "not_found", "Not found");
    await prisma.contentAttachment.delete({ where: { attachmentId: attachment.attachmentId } });
    res.status(200).json({ status: "ok" });
  }));

  router.post("/courses", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    requireRole(auth, ["CREATOR", "ADMIN"]);
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    if (!title) throw new HttpError(400, "validation", "Title is required");
    const content = await prisma.content.create({
      data: {
        creatorId: auth.userId,
        contentType: "COURSE",
        title,
        description: typeof req.body?.description === "string" ? req.body.description : null,
        status: "DRAFT",
        course: { create: {} },
      },
    });
    res.status(201).json({ contentId: content.contentId });
  }));

  router.patch("/courses/:contentId", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    requireRole(auth, ["CREATOR", "ADMIN"]);
    const content = await ownContent(auth, req.params.contentId);
    if (content.status === "PUBLISHED") throw new HttpError(409, "conflict", "Published course cannot be edited in place");
    await prisma.content.update({
      where: { contentId: content.contentId },
      data: { title: typeof req.body?.title === "string" ? req.body.title : undefined },
    });
    res.status(200).json({ contentId: content.contentId });
  }));

  router.post("/courses/:contentId/modules", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    requireRole(auth, ["CREATOR", "ADMIN"]);
    await ownContent(auth, req.params.contentId);
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const position = req.body?.position;
    if (!title || !Number.isInteger(position) || position < 1) throw new HttpError(400, "validation", "Module name and position are required");
    try {
      const module = await prisma.courseModule.create({
        data: { courseContentId: req.params.contentId, title, position },
      });
      res.status(201).json({ moduleId: module.moduleId });
    } catch {
      throw new HttpError(409, "conflict", "Position is already used");
    }
  }));

  router.post("/modules/:moduleId/lessons", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    requireRole(auth, ["CREATOR", "ADMIN"]);
    const module = await prisma.courseModule.findUnique({ where: { moduleId: req.params.moduleId } });
    if (!module) throw new HttpError(404, "not_found", "Not found");
    await ownContent(auth, module.courseContentId);
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const position = req.body?.position;
    const videoContentId = typeof req.body?.videoContentId === "string" ? req.body.videoContentId : "";
    if (!title || !videoContentId || !Number.isInteger(position) || position < 1) {
      throw new HttpError(400, "validation", "Lesson name, video, and position are required");
    }
    try {
      const lesson = await prisma.lesson.create({
        data: { moduleId: module.moduleId, title, position, videoContentId },
      });
      res.status(201).json({ lessonId: lesson.lessonId });
    } catch {
      throw new HttpError(409, "conflict", "Lesson conflicts with an existing row");
    }
  }));

  router.post("/courses/:contentId/publish", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    requireRole(auth, ["CREATOR", "ADMIN"]);
    const content = await ownContent(auth, req.params.contentId);
    const modules = await prisma.courseModule.findMany({
      where: { courseContentId: content.contentId },
      include: { lessons: { include: { video: { include: { content: { include: { tags: true } } } } } } },
    });
    if (modules.length === 0 || modules.some((module) => !module.title || module.lessons.length === 0)) {
      throw new HttpError(400, "validation", "Course is incomplete");
    }
    for (const module of modules) {
      for (const lesson of module.lessons) {
        const videoContent = lesson.video.content;
        const ready = lesson.title
          && lesson.video.mediaReference
          && videoContent.description
          && videoContent.keywords
          && lesson.video.sources
          && videoContent.tags.length > 0;
        if (!ready) throw new HttpError(400, "validation", "Each lesson video is missing required fields");
      }
    }
    await prisma.content.update({
      where: { contentId: content.contentId },
      data: { status: "PUBLISHED", publishedAt: content.publishedAt ?? new Date() },
    });
    res.status(200).json({ status: "PUBLISHED" });
  }));

  router.get("/categories", asyncHandler(async (_req, res) => {
    const items = await prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
    res.status(200).json({ items });
  }));

  router.get("/content", asyncHandler(async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const category = typeof req.query.category === "string" ? req.query.category : "";
    const where: Prisma.ContentWhereInput = { status: "PUBLISHED", deletedAt: null };
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { keywords: { contains: q, mode: "insensitive" } },
        { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
      ];
    }
    if (category) where.categories = { some: { category: { slug: category } } };
    const items = await prisma.content.findMany({
      where,
      take: LIST_LIMIT,
      orderBy: { publishedAt: "desc" },
      include: { video: true },
    });
    res.status(200).json({
      limit: LIST_LIMIT,
      items: items.map((item) => ({
        contentId: item.contentId,
        contentType: item.contentType,
        title: item.title,
        publishedAt: item.publishedAt,
      })),
    });
  }));

  router.get("/content/:contentId", asyncHandler(async (req, res) => {
    const content = await prisma.content.findUnique({
      where: { contentId: req.params.contentId },
      include: { video: true, course: { include: { modules: { include: { lessons: true }, orderBy: { position: "asc" } } } }, attachments: true },
    });
    if (!content || content.deletedAt) throw new HttpError(404, "not_found", "Not found");
    if (content.status !== "PUBLISHED") {
      try {
        const auth = await requireAuth(req);
        if (auth.role !== "ADMIN" && auth.userId !== content.creatorId) throw new HttpError(404, "not_found", "Not found");
      } catch {
        throw new HttpError(404, "not_found", "Not found");
      }
    }
    res.status(200).json({
      contentId: content.contentId,
      contentType: content.contentType,
      title: content.title,
      description: content.description,
      status: content.status,
      modules: content.course?.modules.map((module) => ({
        moduleId: module.moduleId,
        title: module.title,
        position: module.position,
        lessons: module.lessons
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((lesson) => ({ lessonId: lesson.lessonId, title: lesson.title, position: lesson.position, videoContentId: lesson.videoContentId })),
      })),
      attachments: content.attachments.map((item) => ({ attachmentId: item.attachmentId, kind: item.kind, reference: item.reference })),
    });
  }));

  router.post("/bookmarks", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    const contentId = typeof req.body?.contentId === "string" ? req.body.contentId : "";
    try {
      await prisma.bookmark.create({ data: { userId: auth.userId, contentId } });
    } catch {
      throw new HttpError(409, "conflict", "Already bookmarked");
    }
    res.status(201).json({ contentId });
  }));

  router.delete("/bookmarks/:contentId", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    await prisma.bookmark.delete({ where: { userId_contentId: { userId: auth.userId, contentId: req.params.contentId } } });
    res.status(200).json({ status: "ok" });
  }));

  router.get("/me/bookmarks", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    const items = await prisma.bookmark.findMany({
      where: { userId: auth.userId },
      take: LIST_LIMIT,
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ limit: LIST_LIMIT, items });
  }));

  router.put("/videos/:contentId/progress", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    const video = await prisma.videoDetails.findUnique({ where: { contentId: req.params.contentId } });
    if (!video) throw new HttpError(404, "not_found", "Not found");
    const position = req.body?.lastPositionSeconds;
    if (!Number.isInteger(position) || position < 0 || position > video.durationSeconds) {
      throw new HttpError(400, "validation", "Invalid position");
    }
    const existing = await prisma.videoProgress.findUnique({
      where: { userId_videoContentId: { userId: auth.userId, videoContentId: video.contentId } },
    });
    const row = existing
      ? await prisma.videoProgress.update({
          where: { progressId: existing.progressId },
          data: { lastPositionSeconds: position, lastWatchedAt: new Date() },
        })
      : await prisma.videoProgress.create({
          data: {
            userId: auth.userId,
            videoContentId: video.contentId,
            lastPositionSeconds: position,
            lastWatchedAt: new Date(),
          },
        });
    res.status(200).json({
      lastPositionSeconds: row.lastPositionSeconds,
      completedAt: row.completedAt,
    });
  }));

  router.get("/me/progress", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    const items = await prisma.videoProgress.findMany({
      where: { userId: auth.userId },
      orderBy: { lastWatchedAt: "desc" },
      take: LIST_LIMIT,
    });
    res.status(200).json({ limit: LIST_LIMIT, items });
  }));

  router.get("/courses/:contentId/progress", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    const modules = await prisma.courseModule.findMany({
      where: { courseContentId: req.params.contentId },
      include: { lessons: { include: { video: true } } },
    });
    const videos = modules.flatMap((module) => module.lessons.map((lesson) => lesson.video));
    const totalDurationSeconds = videos.reduce((sum, video) => sum + video.durationSeconds, 0);
    const progress = await prisma.videoProgress.findMany({
      where: { userId: auth.userId, videoContentId: { in: videos.map((video) => video.contentId) } },
    });
    const completedDurationSeconds = videos.reduce((sum, video) => {
      const row = progress.find((item) => item.videoContentId === video.contentId);
      return sum + (row?.completedAt ? video.durationSeconds : 0);
    }, 0);
    res.status(200).json({ totalDurationSeconds, completedDurationSeconds });
  }));

  router.get("/notifications", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    const items = await prisma.notification.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: "desc" },
      take: LIST_LIMIT,
    });
    res.status(200).json({ limit: LIST_LIMIT, items });
  }));

  router.post("/notifications/:notificationId/read", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    const row = await prisma.notification.findUnique({ where: { notificationId: req.params.notificationId } });
    if (!row || row.userId !== auth.userId) throw new HttpError(404, "not_found", "Not found");
    await prisma.notification.update({ where: { notificationId: row.notificationId }, data: { readAt: new Date() } });
    res.status(200).json({ status: "ok" });
  }));

  router.get("/notification-preferences", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    const items = await prisma.notificationPreference.findMany({ where: { userId: auth.userId } });
    res.status(200).json({ items });
  }));

  router.put("/notification-preferences/:type", asyncHandler(async (req, res) => {
    await requireAuth(req);
    const type = req.params.type.toLowerCase();
    if (type === "account" || type === "security") {
      throw new HttpError(409, "conflict", "Account and security messages cannot be disabled");
    }
    throw new HttpError(409, "conflict", "Notification types are not defined");
  }));

  router.post("/devices", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    if (!config.PUSH_TOKEN_KEY) throw new HttpError(500, "internal_error", "Internal error");
    const platform = req.body?.platform;
    const pushToken = typeof req.body?.pushToken === "string" ? req.body.pushToken : "";
    if (!["IOS", "ANDROID", "WEB"].includes(platform) || !pushToken) throw new HttpError(400, "validation", "Invalid device");
    const device = await prisma.pushDevice.create({
      data: {
        userId: auth.userId,
        platform,
        encryptedPushToken: encryptSecret(config.PUSH_TOKEN_KEY, pushToken),
        tokenFingerprint: sha256(pushToken),
        lastRegisteredAt: new Date(),
      },
    });
    res.status(201).json({ deviceId: device.deviceId });
  }));

  router.delete("/devices/:deviceId", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    const device = await prisma.pushDevice.findUnique({ where: { deviceId: req.params.deviceId } });
    if (!device || device.userId !== auth.userId) throw new HttpError(404, "not_found", "Not found");
    await prisma.pushDevice.update({ where: { deviceId: device.deviceId }, data: { revokedAt: new Date() } });
    res.status(200).json({ status: "ok" });
  }));

  router.get("/admin/settings/completion-threshold", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    requireRole(auth, ["ADMIN"]);
    const row = await prisma.systemSetting.findUnique({ where: { settingKey: THRESHOLD_KEY } });
    res.status(200).json({ value: row ? Number(row.settingValue) : 90 });
  }));

  router.put("/admin/settings/completion-threshold", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    requireRole(auth, ["ADMIN"]);
    const value = req.body?.value;
    if (!Number.isInteger(value) || value < 1 || value > 100) throw new HttpError(400, "validation", "Invalid threshold");
    await prisma.$transaction(async (tx) => {
      await tx.systemSetting.upsert({
        where: { settingKey: THRESHOLD_KEY },
        update: { settingValue: String(value), updatedBy: auth.userId },
        create: { settingKey: THRESHOLD_KEY, settingValue: String(value), updatedBy: auth.userId },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: auth.userId,
          action: "completion_threshold",
          targetType: "system_setting",
          targetId: THRESHOLD_KEY,
          details: "completion_threshold",
        },
      });
    });
    res.status(200).json({ value });
  }));

  router.get("/admin/categories", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    requireRole(auth, ["ADMIN"]);
    const items = await prisma.category.findMany({ orderBy: { name: "asc" } });
    res.status(200).json({ items });
  }));

  router.post("/admin/categories", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    requireRole(auth, ["ADMIN"]);
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const slug = typeof req.body?.slug === "string" ? req.body.slug.trim() : "";
    if (!name || !slug) throw new HttpError(400, "validation", "Name and slug are required");
    const category = await prisma.category.create({ data: { name, slug, isActive: true } });
    await audit(auth.userId, "category_create", "category", category.categoryId);
    res.status(201).json({ categoryId: category.categoryId });
  }));

  router.patch("/admin/categories/:categoryId", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    requireRole(auth, ["ADMIN"]);
    const category = await prisma.category.update({
      where: { categoryId: req.params.categoryId },
      data: { name: typeof req.body?.name === "string" ? req.body.name : undefined },
    });
    await audit(auth.userId, "category_update", "category", category.categoryId);
    res.status(200).json({ categoryId: category.categoryId });
  }));

  router.post("/admin/tags", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    requireRole(auth, ["ADMIN"]);
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const slug = typeof req.body?.slug === "string" ? req.body.slug.trim() : "";
    if (!name || !slug) throw new HttpError(400, "validation", "Name and slug are required");
    const tag = await prisma.tag.create({ data: { name, slug } });
    await audit(auth.userId, "tag_create", "tag", tag.tagId);
    res.status(201).json({ tagId: tag.tagId });
  }));

  router.patch("/admin/tags/:tagId", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    requireRole(auth, ["ADMIN"]);
    const tag = await prisma.tag.update({
      where: { tagId: req.params.tagId },
      data: { name: typeof req.body?.name === "string" ? req.body.name : undefined },
    });
    await audit(auth.userId, "tag_update", "tag", tag.tagId);
    res.status(200).json({ tagId: tag.tagId });
  }));

  router.get("/admin/audit", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    requireRole(auth, ["ADMIN"]);
    const items = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: LIST_LIMIT });
    res.status(200).json({ limit: LIST_LIMIT, items });
  }));

  router.post("/admin/content/:contentId/delete", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    requireRole(auth, ["ADMIN"]);
    await prisma.$transaction(async (tx) => {
      await tx.content.update({
        where: { contentId: req.params.contentId },
        data: { deletedAt: new Date(), status: "REMOVED" },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: auth.userId,
          action: "content_delete",
          targetType: "content",
          targetId: req.params.contentId,
          details: "content_delete",
        },
      });
    });
    res.status(200).json({ status: "REMOVED" });
  }));

  router.post("/admin/content/:contentId/restore", asyncHandler(async (req, res) => {
    const auth = await requireAuth(req);
    requireRole(auth, ["ADMIN"]);
    await prisma.$transaction(async (tx) => {
      await tx.content.update({
        where: { contentId: req.params.contentId },
        data: { deletedAt: null, status: "PUBLISHED" },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: auth.userId,
          action: "content_restore",
          targetType: "content",
          targetId: req.params.contentId,
          details: "content_restore",
        },
      });
    });
    res.status(200).json({ status: "PUBLISHED" });
  }));

  return router;
}
