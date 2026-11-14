import { Platform } from "react-native";

export const apiBase = "http://127.0.0.1:3000";
export const androidApiBase = "http://10.0.2.2:3000";

export function getApiBase(): string {
  return Platform.OS === "android" ? androidApiBase : apiBase;
}

export async function api<T>(path: string, options: { method?: string; token?: string; body?: unknown; base?: string } = {}): Promise<T> {
  const base = options.base ?? getApiBase();
  const response = await fetch(`${base}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) as { error?: { message?: string } } : null;
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "Request failed");
  }
  return payload as T;
}

export function mediaUrl(videoContentId: string): string {
  return `${getApiBase()}/api/v1/videos/${videoContentId}/media`;
}
