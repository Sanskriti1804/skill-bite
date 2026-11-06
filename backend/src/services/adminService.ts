import { LIST_LIMIT, THRESHOLD_KEY } from "../deps.js";
import { HttpError } from "../errors.js";
import type { Access } from "./access.js";

export function createAdminService(access: Access) {
  const { prisma, audit } = access;
  return {
    async users() {
      const items = await prisma.appUser.findMany({ take: LIST_LIMIT, orderBy: { createdAt: "desc" }, include: { role: true } });
      return {
        limit: LIST_LIMIT,
        items: items.map((user) => ({
          userId: user.userId,
          email: user.emailNormalized,
          displayName: user.displayName,
          role: user.role.code,
          accountStatus: user.accountStatus,
        })),
      };
    },
    async setStatus(actorUserId: string, userId: string, accountStatus: unknown) {
      if (accountStatus !== "ACTIVE" && accountStatus !== "SUSPENDED" && accountStatus !== "DEACTIVATED") {
        throw new HttpError(400, "validation", "Invalid account status");
      }
      await prisma.$transaction(async (tx) => {
        await tx.appUser.update({ where: { userId }, data: { accountStatus } });
        await tx.auditLog.create({
          data: { actorUserId, action: "account_status", targetType: "app_user", targetId: userId, details: "account_status" },
        });
      });
      return { accountStatus };
    },
    async threshold() {
      const row = await prisma.systemSetting.findUnique({ where: { settingKey: THRESHOLD_KEY } });
      return { value: row ? Number(row.settingValue) : 90 };
    },
    async setThreshold(actorUserId: string, value: unknown) {
      if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > 100) throw new HttpError(400, "validation", "Invalid threshold");
      await prisma.$transaction(async (tx) => {
        await tx.systemSetting.upsert({
          where: { settingKey: THRESHOLD_KEY },
          update: { settingValue: String(value), updatedBy: actorUserId },
          create: { settingKey: THRESHOLD_KEY, settingValue: String(value), updatedBy: actorUserId },
        });
        await tx.auditLog.create({
          data: { actorUserId, action: "completion_threshold", targetType: "system_setting", targetId: THRESHOLD_KEY, details: "completion_threshold" },
        });
      });
      return { value };
    },
    async categories() {
      return { items: await prisma.category.findMany({ orderBy: { name: "asc" } }) };
    },
    async createCategory(actorUserId: string, body: Record<string, unknown>) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const slug = typeof body.slug === "string" ? body.slug.trim() : "";
      if (!name || !slug) throw new HttpError(400, "validation", "Name and slug are required");
      const category = await prisma.category.create({ data: { name, slug, isActive: true } });
      await audit(actorUserId, "category_create", "category", category.categoryId);
      return { categoryId: category.categoryId };
    },
    async updateCategory(actorUserId: string, categoryId: string, name: unknown) {
      const category = await prisma.category.update({
        where: { categoryId },
        data: { name: typeof name === "string" ? name : undefined },
      });
      await audit(actorUserId, "category_update", "category", category.categoryId);
      return { categoryId: category.categoryId };
    },
    async createTag(actorUserId: string, body: Record<string, unknown>) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const slug = typeof body.slug === "string" ? body.slug.trim() : "";
      if (!name || !slug) throw new HttpError(400, "validation", "Name and slug are required");
      const tag = await prisma.tag.create({ data: { name, slug } });
      await audit(actorUserId, "tag_create", "tag", tag.tagId);
      return { tagId: tag.tagId };
    },
    async updateTag(actorUserId: string, tagId: string, name: unknown) {
      const tag = await prisma.tag.update({ where: { tagId }, data: { name: typeof name === "string" ? name : undefined } });
      await audit(actorUserId, "tag_update", "tag", tag.tagId);
      return { tagId: tag.tagId };
    },
    async auditLog() {
      const items = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: LIST_LIMIT });
      return { limit: LIST_LIMIT, items };
    },
    async removeContent(actorUserId: string, contentId: string) {
      await prisma.$transaction(async (tx) => {
        await tx.content.update({ where: { contentId }, data: { deletedAt: new Date(), status: "REMOVED" } });
        await tx.auditLog.create({
          data: { actorUserId, action: "content_delete", targetType: "content", targetId: contentId, details: "content_delete" },
        });
      });
      return { status: "REMOVED" as const };
    },
    async restoreContent(actorUserId: string, contentId: string) {
      await prisma.$transaction(async (tx) => {
        await tx.content.update({ where: { contentId }, data: { deletedAt: null, status: "PUBLISHED" } });
        await tx.auditLog.create({
          data: { actorUserId, action: "content_restore", targetType: "content", targetId: contentId, details: "content_restore" },
        });
      });
      return { status: "PUBLISHED" as const };
    },
    async me(userId: string) {
      const user = await prisma.appUser.findUnique({ where: { userId }, include: { role: true } });
      if (!user) throw new HttpError(401, "unauthorized", "Authentication required");
      return { userId: user.userId, email: user.emailNormalized, displayName: user.displayName, role: user.role.code, accountStatus: user.accountStatus };
    },
    async switchRole(userId: string, role: unknown, roleId: (code: string) => Promise<string>) {
      const next = role === "USER" || role === "CREATOR" ? role : "";
      if (!next) throw new HttpError(400, "validation", "Role must be USER or CREATOR");
      await prisma.appUser.update({ where: { userId }, data: { roleId: await roleId(next) } });
      return { role: next };
    },
  };
}
