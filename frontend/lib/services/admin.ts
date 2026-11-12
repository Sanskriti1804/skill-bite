import { api } from "../api";

export const admin = {
  users: (token: string) => api<{ items: { userId: string; email: string; accountStatus: string }[] }>("/api/v1/admin/users", { token }),
  setStatus: (token: string, userId: string, accountStatus: string) => api(`/api/v1/admin/users/${userId}/status`, { method: "PATCH", token, body: { accountStatus } }),
  threshold: (token: string) => api<{ value: number }>("/api/v1/admin/settings/completion-threshold", { token }),
  setThreshold: (token: string, value: number) => api("/api/v1/admin/settings/completion-threshold", { method: "PUT", token, body: { value } }),
  categories: (token: string) => api<{ items: { categoryId: string; name: string; slug: string }[] }>("/api/v1/admin/categories", { token }),
  createCategory: (token: string, name: string, slug: string) => api("/api/v1/admin/categories", { method: "POST", token, body: { name, slug } }),
  createTag: (token: string, name: string, slug: string) => api("/api/v1/admin/tags", { method: "POST", token, body: { name, slug } }),
  audit: (token: string) => api<{ items: { action: string; createdAt: string }[] }>("/api/v1/admin/audit", { token }),
  removeContent: (token: string, contentId: string) => api<{ status: string }>(`/api/v1/admin/content/${contentId}/delete`, { method: "POST", token }),
  restoreContent: (token: string, contentId: string) => api<{ status: string }>(`/api/v1/admin/content/${contentId}/restore`, { method: "POST", token }),
};
