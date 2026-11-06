import { LIST_LIMIT } from "../deps.js";
import { HttpError } from "../errors.js";
import { encryptSecret, sha256 } from "../security.js";
import type { Access } from "./access.js";

export function createLearningService(access: Access) {
  const { prisma, config } = access;
  return {
    async bookmark(userId: string, contentId: string) {
      try {
        await prisma.bookmark.create({ data: { userId, contentId } });
      } catch {
        throw new HttpError(409, "conflict", "Already bookmarked");
      }
      return { contentId };
    },
    async removeBookmark(userId: string, contentId: string) {
      await prisma.bookmark.delete({ where: { userId_contentId: { userId, contentId } } });
      return { status: "ok" as const };
    },
    async bookmarks(userId: string) {
      const items = await prisma.bookmark.findMany({ where: { userId }, take: LIST_LIMIT, orderBy: { createdAt: "desc" } });
      return { limit: LIST_LIMIT, items };
    },
    async saveProgress(userId: string, contentId: string, position: unknown) {
      const video = await prisma.videoDetails.findUnique({ where: { contentId } });
      if (!video) throw new HttpError(404, "not_found", "Not found");
      if (!Number.isInteger(position) || (position as number) < 0 || (position as number) > video.durationSeconds) {
        throw new HttpError(400, "validation", "Invalid position");
      }
      const existing = await prisma.videoProgress.findUnique({
        where: { userId_videoContentId: { userId, videoContentId: video.contentId } },
      });
      const row = existing
        ? await prisma.videoProgress.update({
            where: { progressId: existing.progressId },
            data: { lastPositionSeconds: position as number, lastWatchedAt: new Date() },
          })
        : await prisma.videoProgress.create({
            data: { userId, videoContentId: video.contentId, lastPositionSeconds: position as number, lastWatchedAt: new Date() },
          });
      return { lastPositionSeconds: row.lastPositionSeconds, completedAt: row.completedAt };
    },
    async progress(userId: string) {
      const items = await prisma.videoProgress.findMany({ where: { userId }, orderBy: { lastWatchedAt: "desc" }, take: LIST_LIMIT });
      return { limit: LIST_LIMIT, items };
    },
    async courseProgress(userId: string, contentId: string) {
      const modules = await prisma.courseModule.findMany({
        where: { courseContentId: contentId },
        include: { lessons: { include: { video: true } } },
      });
      const videos = modules.flatMap((module) => module.lessons.map((lesson) => lesson.video));
      const totalDurationSeconds = videos.reduce((sum, video) => sum + video.durationSeconds, 0);
      const progress = await prisma.videoProgress.findMany({
        where: { userId, videoContentId: { in: videos.map((video) => video.contentId) } },
      });
      const completedDurationSeconds = videos.reduce((sum, video) => {
        const row = progress.find((item) => item.videoContentId === video.contentId);
        return sum + (row?.completedAt ? video.durationSeconds : 0);
      }, 0);
      return { totalDurationSeconds, completedDurationSeconds };
    },
    async notifications(userId: string) {
      const items = await prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: LIST_LIMIT });
      return { limit: LIST_LIMIT, items };
    },
    async markRead(userId: string, notificationId: string) {
      const row = await prisma.notification.findUnique({ where: { notificationId } });
      if (!row || row.userId !== userId) throw new HttpError(404, "not_found", "Not found");
      await prisma.notification.update({ where: { notificationId: row.notificationId }, data: { readAt: new Date() } });
      return { status: "ok" as const };
    },
    async preferences(userId: string) {
      const items = await prisma.notificationPreference.findMany({ where: { userId } });
      return { items };
    },
    preferenceUpdate(type: string) {
      const normalized = type.toLowerCase();
      if (normalized === "account" || normalized === "security") {
        throw new HttpError(409, "conflict", "Account and security messages cannot be disabled");
      }
      throw new HttpError(409, "conflict", "Notification types are not defined");
    },
    async registerDevice(userId: string, body: Record<string, unknown>) {
      if (!config.PUSH_TOKEN_KEY) throw new HttpError(500, "internal_error", "Internal error");
      const platform = body.platform;
      const pushToken = typeof body.pushToken === "string" ? body.pushToken : "";
      if ((platform !== "IOS" && platform !== "ANDROID" && platform !== "WEB") || !pushToken) {
        throw new HttpError(400, "validation", "Invalid device");
      }
      const device = await prisma.pushDevice.create({
        data: {
          userId,
          platform,
          encryptedPushToken: encryptSecret(config.PUSH_TOKEN_KEY, pushToken),
          tokenFingerprint: sha256(pushToken),
          lastRegisteredAt: new Date(),
        },
      });
      return { deviceId: device.deviceId };
    },
    async revokeDevice(userId: string, deviceId: string) {
      const device = await prisma.pushDevice.findUnique({ where: { deviceId } });
      if (!device || device.userId !== userId) throw new HttpError(404, "not_found", "Not found");
      await prisma.pushDevice.update({ where: { deviceId: device.deviceId }, data: { revokedAt: new Date() } });
      return { status: "ok" as const };
    },
  };
}
