import { api } from "../api";
import type { Category } from "../types";

export type Tag = { tagId: string; name: string; slug: string };

export type OwnedContent = {
  contentId: string;
  contentType: string;
  title: string;
  status: string;
  updatedAt: string;
  publishedAt: string | null;
};

export const contentApi = {
  tags: (token: string) => api<{ items: Tag[] }>("/api/v1/tags", { token }),
  categories: () => api<{ items: Category[] }>("/api/v1/categories"),
  mine: (token: string) => api<{ items: OwnedContent[]; limit: number }>("/api/v1/me/content", { token }),
  detail: (contentId: string, token?: string) => api<Record<string, unknown>>(`/api/v1/content/${contentId}`, { token }),
  createVideo: (token: string, body: Record<string, unknown>) =>
    api<{ contentId: string; status: string }>("/api/v1/videos", { method: "POST", token, body }),
  updateVideo: (token: string, contentId: string, body: Record<string, unknown>) =>
    api(`/api/v1/videos/${contentId}`, { method: "PATCH", token, body }),
  saveMedia: (token: string, contentId: string, body: { mimeType: string; dataBase64: string; durationSeconds: number }) =>
    api(`/api/v1/videos/${contentId}/media`, { method: "PUT", token, body }),
  publishVideo: (token: string, contentId: string) =>
    api<{ status: string }>(`/api/v1/videos/${contentId}/publish`, { method: "POST", token }),
  takedown: (token: string, contentId: string) =>
    api<{ status: string }>(`/api/v1/videos/${contentId}/takedown`, { method: "POST", token }),
  createCourse: (token: string, title: string) =>
    api<{ contentId: string }>("/api/v1/courses", { method: "POST", token, body: { title } }),
  updateCourse: (token: string, contentId: string, title: string) =>
    api(`/api/v1/courses/${contentId}`, { method: "PATCH", token, body: { title } }),
  addModule: (token: string, contentId: string, title: string, position: number) =>
    api<{ moduleId: string }>(`/api/v1/courses/${contentId}/modules`, { method: "POST", token, body: { title, position } }),
  addLesson: (token: string, moduleId: string, body: { title: string; position: number; videoContentId: string }) =>
    api(`/api/v1/modules/${moduleId}/lessons`, { method: "POST", token, body }),
  publishCourse: (token: string, contentId: string) =>
    api<{ status: string }>(`/api/v1/courses/${contentId}/publish`, { method: "POST", token }),
};
