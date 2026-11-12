import { api } from "../api";

export const content = {
  categories: () => api<{ items: { slug: string; name: string }[] }>("/api/v1/categories"),
  search: (query: URLSearchParams) => api<{ limit: number; items: { contentId: string; title: string; contentType: string }[] }>(`/api/v1/content?${query.toString()}`),
  detail: (contentId: string, token?: string) => api<Record<string, unknown>>(`/api/v1/content/${contentId}`, { token }),
  createVideo: (token: string, body: Record<string, unknown>) => api<{ contentId: string; status: string }>("/api/v1/videos", { method: "POST", token, body }),
  updateVideo: (token: string, contentId: string, body: Record<string, unknown>) => api(`/api/v1/videos/${contentId}`, { method: "PATCH", token, body }),
  saveMedia: (token: string, contentId: string, body: { mimeType: string; dataBase64: string; durationSeconds: number }) => api(`/api/v1/videos/${contentId}/media`, { method: "PUT", token, body }),
  publishVideo: (token: string, contentId: string) => api<{ status: string }>(`/api/v1/videos/${contentId}/publish`, { method: "POST", token }),
  takedown: (token: string, contentId: string) => api<{ status: string }>(`/api/v1/videos/${contentId}/takedown`, { method: "POST", token }),
  addCaption: (token: string, contentId: string, body: Record<string, unknown>) => api(`/api/v1/videos/${contentId}/captions`, { method: "POST", token, body }),
  addAttachment: (token: string, contentId: string, body: { kind: string; reference: string }) => api(`/api/v1/videos/${contentId}/attachments`, { method: "POST", token, body }),
  createCourse: (token: string, title: string) => api<{ contentId: string }>("/api/v1/courses", { method: "POST", token, body: { title } }),
  addModule: (token: string, contentId: string, title: string, position: number) => api<{ moduleId: string }>(`/api/v1/courses/${contentId}/modules`, { method: "POST", token, body: { title, position } }),
  addLesson: (token: string, moduleId: string, body: { title: string; position: number; videoContentId: string }) => api(`/api/v1/modules/${moduleId}/lessons`, { method: "POST", token, body }),
  publishCourse: (token: string, contentId: string) => api(`/api/v1/courses/${contentId}/publish`, { method: "POST", token }),
};
