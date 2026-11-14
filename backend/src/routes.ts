import { Router, type NextFunction, type Request, type Response } from "express";
import type { AppConfig } from "./config.js";
import { LIST_LIMIT, THRESHOLD_KEY, type ApiDeps, type MailMessage, type MailPort } from "./deps.js";
import { createAccess } from "./services/access.js";
import { createAdminService } from "./services/adminService.js";
import { createAuthService } from "./services/authService.js";
import { createContentService } from "./services/contentService.js";
import { createLearningService } from "./services/learningService.js";

export { LIST_LIMIT, THRESHOLD_KEY };
export type { ApiDeps, MailMessage, MailPort };

function asyncHandler(fn: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };
}

function body(req: Request): Record<string, unknown> {
  return req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {};
}

export function createApiRouter(config: AppConfig, deps: ApiDeps): Router {
  const access = createAccess(config, deps);
  const auth = createAuthService(access);
  const content = createContentService(access);
  const learning = createLearningService(access);
  const admin = createAdminService(access);
  const router = Router();
  const { requireAuth, requireRole } = access;

  router.post("/auth/register", asyncHandler(async (req, res) => {
    res.status(201).json(await auth.register(body(req)));
  }));
  router.post("/auth/verify-email", asyncHandler(async (req, res) => {
    const token = typeof body(req).token === "string" ? body(req).token as string : "";
    res.status(200).json(await auth.verifyEmail(token));
  }));
  router.post("/auth/login", asyncHandler(async (req, res) => {
    res.status(200).json(await auth.login(body(req).email, body(req).password));
  }));
  router.post("/auth/password-reset", asyncHandler(async (req, res) => {
    res.status(200).json(await auth.startReset(body(req).email));
  }));
  router.post("/auth/password-reset/confirm", asyncHandler(async (req, res) => {
    const token = typeof body(req).token === "string" ? body(req).token as string : "";
    res.status(200).json(await auth.confirmReset(token, body(req).password));
  }));
  router.post("/auth/refresh", asyncHandler(async (req, res) => {
    const token = typeof body(req).refreshToken === "string" ? body(req).refreshToken as string : "";
    res.status(200).json(await auth.refresh(token));
  }));
  router.post("/auth/logout", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    res.status(200).json(await auth.logout(session.sessionId));
  }));
  router.post("/auth/google", asyncHandler(async (req, res) => {
    const token = typeof body(req).identityToken === "string" ? body(req).identityToken as string : "";
    res.status(200).json(await auth.google(token));
  }));

  router.get("/me", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    res.status(200).json(await admin.me(session.userId));
  }));
  router.get("/me/content", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    res.status(200).json(await content.myContent(session.userId));
  }));
  router.patch("/me/role", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    requireRole(session, ["USER", "CREATOR"]);
    res.status(200).json(await admin.switchRole(session.userId, body(req).role, access.roleId));
  }));

  router.post("/videos", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    requireRole(session, ["CREATOR", "ADMIN"]);
    res.status(201).json(await content.createVideo(session.userId, body(req)));
  }));
  router.patch("/videos/:contentId", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    requireRole(session, ["CREATOR", "ADMIN"]);
    res.status(200).json(await content.updateVideo(session, req.params.contentId, body(req)));
  }));
  router.put("/videos/:contentId/media", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    requireRole(session, ["CREATOR", "ADMIN"]);
    res.status(200).json(await content.saveMedia(session, req.params.contentId, body(req)));
  }));
  router.get("/videos/:contentId/media", asyncHandler(async (req, res) => {
    const bytes = await content.readMedia(req.params.contentId, () => requireAuth(req));
    res.status(200).type("video/mp4").send(bytes);
  }));
  router.post("/videos/:contentId/publish", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    requireRole(session, ["CREATOR", "ADMIN"]);
    res.status(200).json(await content.publishVideo(session, req.params.contentId));
  }));
  router.post("/videos/:contentId/takedown", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    requireRole(session, ["CREATOR", "ADMIN"]);
    res.status(200).json(await content.takedown(session, req.params.contentId));
  }));
  router.post("/videos/:contentId/captions", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    requireRole(session, ["CREATOR", "ADMIN"]);
    res.status(201).json(await content.addCaption(session, req.params.contentId, body(req)));
  }));
  router.post("/videos/:contentId/attachments", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    requireRole(session, ["CREATOR", "ADMIN"]);
    res.status(201).json(await content.addAttachment(session, req.params.contentId, body(req)));
  }));
  router.delete("/videos/:contentId/attachments/:attachmentId", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    requireRole(session, ["CREATOR", "ADMIN"]);
    res.status(200).json(await content.removeAttachment(session, req.params.contentId, req.params.attachmentId));
  }));

  router.post("/courses", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    requireRole(session, ["CREATOR", "ADMIN"]);
    res.status(201).json(await content.createCourse(session.userId, body(req)));
  }));
  router.patch("/courses/:contentId", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    requireRole(session, ["CREATOR", "ADMIN"]);
    res.status(200).json(await content.updateCourse(session, req.params.contentId, body(req).title));
  }));
  router.post("/courses/:contentId/modules", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    requireRole(session, ["CREATOR", "ADMIN"]);
    res.status(201).json(await content.addModule(session, req.params.contentId, body(req)));
  }));
  router.post("/modules/:moduleId/lessons", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    requireRole(session, ["CREATOR", "ADMIN"]);
    res.status(201).json(await content.addLesson(session, req.params.moduleId, body(req)));
  }));
  router.post("/courses/:contentId/publish", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    requireRole(session, ["CREATOR", "ADMIN"]);
    res.status(200).json(await content.publishCourse(session, req.params.contentId));
  }));

  router.get("/categories", asyncHandler(async (_req, res) => {
    res.status(200).json(await content.categories());
  }));
  router.get("/tags", asyncHandler(async (req, res) => {
    await requireAuth(req);
    res.status(200).json(await content.tags());
  }));
  router.get("/content", asyncHandler(async (req, res) => {
    res.status(200).json(await content.search(req.query));
  }));
  router.get("/content/:contentId", asyncHandler(async (req, res) => {
    res.status(200).json(await content.contentDetail(req.params.contentId, () => requireAuth(req)));
  }));

  router.post("/bookmarks", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    const contentId = typeof body(req).contentId === "string" ? body(req).contentId as string : "";
    res.status(201).json(await learning.bookmark(session.userId, contentId));
  }));
  router.delete("/bookmarks/:contentId", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    res.status(200).json(await learning.removeBookmark(session.userId, req.params.contentId));
  }));
  router.get("/me/bookmarks", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    res.status(200).json(await learning.bookmarks(session.userId));
  }));
  router.put("/videos/:contentId/progress", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    res.status(200).json(await learning.saveProgress(session.userId, req.params.contentId, body(req).lastPositionSeconds));
  }));
  router.get("/me/progress", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    res.status(200).json(await learning.progress(session.userId));
  }));
  router.get("/courses/:contentId/progress", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    res.status(200).json(await learning.courseProgress(session.userId, req.params.contentId));
  }));
  router.get("/notifications", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    res.status(200).json(await learning.notifications(session.userId));
  }));
  router.post("/notifications/:notificationId/read", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    res.status(200).json(await learning.markRead(session.userId, req.params.notificationId));
  }));
  router.get("/notification-preferences", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    res.status(200).json(await learning.preferences(session.userId));
  }));
  router.put("/notification-preferences/:type", asyncHandler(async (req, res) => {
    await requireAuth(req);
    learning.preferenceUpdate(req.params.type);
    res.status(200).json({ status: "ok" });
  }));
  router.post("/devices", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    res.status(201).json(await learning.registerDevice(session.userId, body(req)));
  }));
  router.delete("/devices/:deviceId", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    res.status(200).json(await learning.revokeDevice(session.userId, req.params.deviceId));
  }));

  router.get("/admin/users", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    requireRole(session, ["ADMIN"]);
    res.status(200).json(await admin.users());
  }));
  router.patch("/admin/users/:userId/status", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    requireRole(session, ["ADMIN"]);
    res.status(200).json(await admin.setStatus(session.userId, req.params.userId, body(req).accountStatus));
  }));
  router.get("/admin/settings/completion-threshold", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    requireRole(session, ["ADMIN"]);
    res.status(200).json(await admin.threshold());
  }));
  router.put("/admin/settings/completion-threshold", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    requireRole(session, ["ADMIN"]);
    res.status(200).json(await admin.setThreshold(session.userId, body(req).value));
  }));
  router.get("/admin/categories", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    requireRole(session, ["ADMIN"]);
    res.status(200).json(await admin.categories());
  }));
  router.post("/admin/categories", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    requireRole(session, ["ADMIN"]);
    res.status(201).json(await admin.createCategory(session.userId, body(req)));
  }));
  router.patch("/admin/categories/:categoryId", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    requireRole(session, ["ADMIN"]);
    res.status(200).json(await admin.updateCategory(session.userId, req.params.categoryId, body(req).name));
  }));
  router.post("/admin/tags", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    requireRole(session, ["ADMIN"]);
    res.status(201).json(await admin.createTag(session.userId, body(req)));
  }));
  router.patch("/admin/tags/:tagId", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    requireRole(session, ["ADMIN"]);
    res.status(200).json(await admin.updateTag(session.userId, req.params.tagId, body(req).name));
  }));
  router.get("/admin/audit", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    requireRole(session, ["ADMIN"]);
    res.status(200).json(await admin.auditLog());
  }));
  router.post("/admin/content/:contentId/delete", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    requireRole(session, ["ADMIN"]);
    res.status(200).json(await admin.removeContent(session.userId, req.params.contentId));
  }));
  router.post("/admin/content/:contentId/restore", asyncHandler(async (req, res) => {
    const session = await requireAuth(req);
    requireRole(session, ["ADMIN"]);
    res.status(200).json(await admin.restoreContent(session.userId, req.params.contentId));
  }));

  return router;
}
