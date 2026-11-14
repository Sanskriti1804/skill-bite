import { api, type Session } from "../api";

export type Me = { userId: string; email: string; displayName: string; role: string; accountStatus: string };

export const auth = {
  register: (email: string, password: string, displayName?: string, role?: string) => api<{ userId: string }>("/api/v1/auth/register", { method: "POST", body: { email, password, displayName, role } }),
  verify: (token: string) => api<{ verified: boolean }>("/api/v1/auth/verify-email", { method: "POST", body: { token } }),
  login: (email: string, password: string) => api<Session>("/api/v1/auth/login", { method: "POST", body: { email, password } }),
  startReset: (email: string) => api<{ status: string }>("/api/v1/auth/password-reset", { method: "POST", body: { email } }),
  confirmReset: (token: string, password: string) => api<{ status: string }>("/api/v1/auth/password-reset/confirm", { method: "POST", body: { token, password } }),
  refresh: (refreshToken: string) => api<Session>("/api/v1/auth/refresh", { method: "POST", body: { refreshToken } }),
  logout: (accessToken: string) => api<{ status: string }>("/api/v1/auth/logout", { method: "POST", token: accessToken }),
  google: (identityToken: string) => api<Session>("/api/v1/auth/google", { method: "POST", body: { identityToken } }),
  me: (token: string) => api<Me>("/api/v1/me", { token }),
  switchRole: (token: string, role: "USER" | "CREATOR") => api<{ role: string }>("/api/v1/me/role", { method: "PATCH", token, body: { role } }),
};
