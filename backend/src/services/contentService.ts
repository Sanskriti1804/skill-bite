import type { Prisma } from "@prisma/client";
import { LIST_LIMIT } from "../deps.js";
import { HttpError } from "../errors.js";
import type { Access } from "./access.js";

export function createContentService(access: Access) {
  const { prisma, deps, ownContent } = access;

  return {
    async createVideo(userId: string, body: Record<string, unknown>) {
      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (!title) throw new HttpError(400, "validation", "Title is required");
      const content = await prisma.content.create({
        data: {
          creatorId: userId,
          contentType: "VIDEO",
          title,
          description: typeof body.description === "string" ? body.description : null,
          keywords: typeof body.keywords === "string" ? body.keywords : null,
          status: "DRAFT",
          video: {
            create: {
              mediaReference: "",
              durationSeconds: Number.isInteger(body.durationSeconds) ? body.durationSeconds as number : 0,
              sources: typeof body.sources === "string" ? body.sources : null,
            },
          },
        },
      });
      if (Array.isArray(body.tagIds)) {
        for (const tagId of body.tagIds) {
          if (typeof tagId === "string") await prisma.contentTag.create({ data: { contentId: content.contentId, tagId } });
        }
      }
      return { contentId: content.contentId, status: "DRAFT" as const };
    },

    async updateVideo(auth: Parameters<typeof ownContent>[0], contentId: string, body: Record<string, unknown>) {
      const content = await ownContent(auth, contentId);
      if (content.contentType !== "VIDEO") throw new HttpError(404, "not_found", "Not found");
      if (content.status === "PUBLISHED") throw new HttpError(409, "conflict", "Published video cannot be edited in place");
      await prisma.content.update({
        where: { contentId: content.contentId },
        data: {
          title: typeof body.title === "string" ? body.title : undefined,
          description: typeof body.description === "string" ? body.description : undefined,
          keywords: typeof body.keywords === "string" ? body.keywords : undefined,
          video: typeof body.sources === "string" ? { update: { sources: body.sources } } : undefined,
        },
      });
      return { contentId: content.contentId };
    },

    async saveMedia(auth: Parameters<typeof ownContent>[0], contentId: string, body: Record<string, unknown>) {
      const content = await ownContent(auth, contentId);
      const mime = typeof body.mimeType === "string" ? body.mimeType : "";
      const data = typeof body.dataBase64 === "string" ? body.dataBase64 : "";
      if (!mime.startsWith("video/")) throw new HttpError(400, "validation", "File must be a video");
      const bytes = Buffer.from(data, "base64");
      if (bytes.length === 0) throw new HttpError(400, "validation", "File is empty");
      const reference = await deps.storage.saveVideo(content.contentId, bytes);
      await prisma.videoDetails.update({
        where: { contentId: content.contentId },
        data: {
          mediaReference: reference,
          durationSeconds: Number.isInteger(body.durationSeconds) ? body.durationSeconds as number : content.video?.durationSeconds ?? 0,
        },
      });
      return { mediaReference: reference };
    },

    async readMedia(contentId: string, getAuth: () => Promise<Parameters<typeof ownContent>[0]>) {
      const content = await prisma.content.findUnique({ where: { contentId }, include: { video: true } });
      if (!content?.video || !content.video.mediaReference) throw new HttpError(404, "not_found", "Not found");
      const published = content.status === "PUBLISHED" && !content.deletedAt;
      if (!published) {
        const auth = await getAuth();
        if (auth.role !== "ADMIN" && auth.userId !== content.creatorId) throw new HttpError(403, "forbidden", "Not allowed");
      }
      return deps.storage.read(content.video.mediaReference);
    },

    async publishVideo(auth: Parameters<typeof ownContent>[0], contentId: string) {
      const content = await ownContent(auth, contentId);
      const video = content.video;
      const tagCount = await prisma.contentTag.count({ where: { contentId: content.contentId } });
      if (!video?.mediaReference || !content.description || !content.keywords || !video.sources || tagCount < 1) {
        throw new HttpError(400, "validation", "Required video fields are missing");
      }
      await prisma.content.update({
        where: { contentId: content.contentId },
        data: { status: "PUBLISHED", publishedAt: content.publishedAt ?? new Date() },
      });
      return { status: "PUBLISHED" as const };
    },

    async takedown(auth: Parameters<typeof ownContent>[0], contentId: string) {
      const content = await ownContent(auth, contentId);
      await prisma.content.update({ where: { contentId: content.contentId }, data: { status: "UNPUBLISHED" } });
      return { status: "UNPUBLISHED" as const };
    },

    async addCaption(auth: Parameters<typeof ownContent>[0], contentId: string, body: Record<string, unknown>) {
      await ownContent(auth, contentId);
      const method = body.method === "UPLOADED" || body.method === "GENERATED" ? body.method : "";
      if (!method) throw new HttpError(400, "validation", "Caption method is required");
      try {
        const caption = await prisma.videoCaption.create({
          data: {
            videoContentId: contentId,
            languageCode: typeof body.languageCode === "string" ? body.languageCode : "en",
            format: typeof body.format === "string" ? body.format : "vtt",
            method,
            captionReference: typeof body.captionReference === "string" ? body.captionReference : "inline",
            reviewedAt: body.reviewed === true ? new Date() : null,
          },
        });
        return { captionId: caption.captionId };
      } catch {
        throw new HttpError(409, "conflict", "Caption already exists");
      }
    },

    async addAttachment(auth: Parameters<typeof ownContent>[0], contentId: string, body: Record<string, unknown>) {
      await ownContent(auth, contentId);
      const kind = body.kind;
      if (kind !== "PDF" && kind !== "TEXT" && kind !== "HYPERLINK") throw new HttpError(400, "validation", "Invalid attachment");
      const reference = typeof body.reference === "string" ? body.reference : "";
      if (!reference) throw new HttpError(400, "validation", "Reference is required");
      const row = await prisma.contentAttachment.create({ data: { contentId, kind, reference } });
      return { attachmentId: row.attachmentId };
    },

    async removeAttachment(auth: Parameters<typeof ownContent>[0], contentId: string, attachmentId: string) {
      await ownContent(auth, contentId);
      const attachment = await prisma.contentAttachment.findUnique({ where: { attachmentId } });
      if (!attachment || attachment.contentId !== contentId) throw new HttpError(404, "not_found", "Not found");
      await prisma.contentAttachment.delete({ where: { attachmentId: attachment.attachmentId } });
      return { status: "ok" as const };
    },

    async createCourse(userId: string, body: Record<string, unknown>) {
      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (!title) throw new HttpError(400, "validation", "Title is required");
      const content = await prisma.content.create({
        data: {
          creatorId: userId,
          contentType: "COURSE",
          title,
          description: typeof body.description === "string" ? body.description : null,
          status: "DRAFT",
          course: { create: {} },
        },
      });
      return { contentId: content.contentId };
    },

    async updateCourse(auth: Parameters<typeof ownContent>[0], contentId: string, title: unknown) {
      const content = await ownContent(auth, contentId);
      if (content.status === "PUBLISHED") throw new HttpError(409, "conflict", "Published course cannot be edited in place");
      await prisma.content.update({
        where: { contentId: content.contentId },
        data: { title: typeof title === "string" ? title : undefined },
      });
      return { contentId: content.contentId };
    },

    async addModule(auth: Parameters<typeof ownContent>[0], contentId: string, body: Record<string, unknown>) {
      await ownContent(auth, contentId);
      const title = typeof body.title === "string" ? body.title.trim() : "";
      const position = body.position;
      if (!title || !Number.isInteger(position) || (position as number) < 1) throw new HttpError(400, "validation", "Module name and position are required");
      try {
        const module = await prisma.courseModule.create({ data: { courseContentId: contentId, title, position: position as number } });
        return { moduleId: module.moduleId };
      } catch {
        throw new HttpError(409, "conflict", "Position is already used");
      }
    },

    async addLesson(auth: Parameters<typeof ownContent>[0], moduleId: string, body: Record<string, unknown>) {
      const module = await prisma.courseModule.findUnique({ where: { moduleId } });
      if (!module) throw new HttpError(404, "not_found", "Not found");
      await ownContent(auth, module.courseContentId);
      const title = typeof body.title === "string" ? body.title.trim() : "";
      const position = body.position;
      const videoContentId = typeof body.videoContentId === "string" ? body.videoContentId : "";
      if (!title || !videoContentId || !Number.isInteger(position) || (position as number) < 1) {
        throw new HttpError(400, "validation", "Lesson name, video, and position are required");
      }
      try {
        const lesson = await prisma.lesson.create({ data: { moduleId: module.moduleId, title, position: position as number, videoContentId } });
        return { lessonId: lesson.lessonId };
      } catch {
        throw new HttpError(409, "conflict", "Lesson conflicts with an existing row");
      }
    },

    async publishCourse(auth: Parameters<typeof ownContent>[0], contentId: string) {
      const content = await ownContent(auth, contentId);
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
          const ready = lesson.title && lesson.video.mediaReference && videoContent.description && videoContent.keywords && lesson.video.sources && videoContent.tags.length > 0;
          if (!ready) throw new HttpError(400, "validation", "Each lesson video is missing required fields");
        }
      }
      await prisma.content.update({
        where: { contentId: content.contentId },
        data: { status: "PUBLISHED", publishedAt: content.publishedAt ?? new Date() },
      });
      return { status: "PUBLISHED" as const };
    },

    async categories() {
      const items = await prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
      return { items };
    },

    async search(query: { q?: unknown; category?: unknown }) {
      const q = typeof query.q === "string" ? query.q.trim() : "";
      const category = typeof query.category === "string" ? query.category : "";
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
      return {
        limit: LIST_LIMIT,
        items: items.map((item) => ({
          contentId: item.contentId,
          contentType: item.contentType,
          title: item.title,
          publishedAt: item.publishedAt,
        })),
      };
    },

    async contentDetail(contentId: string, getAuth: () => Promise<Parameters<typeof ownContent>[0]>) {
      const content = await prisma.content.findUnique({
        where: { contentId },
        include: { video: true, course: { include: { modules: { include: { lessons: true }, orderBy: { position: "asc" } } } }, attachments: true },
      });
      if (!content || content.deletedAt) throw new HttpError(404, "not_found", "Not found");
      if (content.status !== "PUBLISHED") {
        try {
          const auth = await getAuth();
          if (auth.role !== "ADMIN" && auth.userId !== content.creatorId) throw new HttpError(404, "not_found", "Not found");
        } catch {
          throw new HttpError(404, "not_found", "Not found");
        }
      }
      return {
        contentId: content.contentId,
        contentType: content.contentType,
        title: content.title,
        description: content.description,
        status: content.status,
        modules: content.course?.modules.map((module) => ({
          moduleId: module.moduleId,
          title: module.title,
          position: module.position,
          lessons: module.lessons.slice().sort((a, b) => a.position - b.position).map((lesson) => ({
            lessonId: lesson.lessonId,
            title: lesson.title,
            position: lesson.position,
            videoContentId: lesson.videoContentId,
          })),
        })),
        attachments: content.attachments.map((item) => ({ attachmentId: item.attachmentId, kind: item.kind, reference: item.reference })),
      };
    },
  };
}
