import { api } from "../api";

export const learning = {
  bookmarks: (token: string) => api<{ items: { contentId: string; title: string }[] }>("/api/v1/me/bookmarks", { token }),
  addBookmark: (token: string, contentId: string) => api("/api/v1/bookmarks", { method: "POST", token, body: { contentId } }),
  removeBookmark: (token: string, contentId: string) => api(`/api/v1/bookmarks/${contentId}`, { method: "DELETE", token }),
  progress: (token: string) => api<{ items: { videoContentId: string; lastPositionSeconds: number; completedAt: string | null }[] }>("/api/v1/me/progress", { token }),
  saveProgress: (token: string, contentId: string, lastPositionSeconds: number) => api<{ lastPositionSeconds: number; completedAt: string | null }>(`/api/v1/videos/${contentId}/progress`, { method: "PUT", token, body: { lastPositionSeconds } }),
  courseProgress: (token: string, contentId: string) => api<{ totalDurationSeconds: number; completedDurationSeconds: number }>(`/api/v1/courses/${contentId}/progress`, { token }),
  notifications: (token: string) => api<{ items: { notificationId: string }[] }>("/api/v1/notifications", { token }),
  markRead: (token: string, notificationId: string) => api(`/api/v1/notifications/${notificationId}/read`, { method: "POST", token }),
  registerDevice: (token: string, body: { platform: string; pushToken: string }) => api<{ deviceId: string }>("/api/v1/devices", { method: "POST", token, body }),
};
