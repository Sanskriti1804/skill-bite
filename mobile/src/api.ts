import Constants from "expo-constants";
import { Platform } from "react-native";

export const apiBase = "http://127.0.0.1:3000";
export const androidApiBase = "http://10.0.2.2:3000";

function devHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  const host = hostUri?.split(":")[0];
  return host || null;
}

export function getApiBase(): string {
  if (Platform.OS === "web") return apiBase;
  const host = devHost();
  if (host) return `http://${host}:3000`;
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

export function mediaUrl(videoContentId: string, quality: "feed" | "full" = "feed"): string {
  return `${getApiBase()}/api/v1/videos/${videoContentId}/media?quality=${quality}`;
}

/** Prefer CDN URL from the feed payload; fall back to API redirect/proxy. */
export function playbackSource(item: { contentId: string; mediaUrl?: string | null }, quality: "feed" | "full" = "feed"): string {
  if (item.mediaUrl) return item.mediaUrl;
  return mediaUrl(item.contentId, quality);
}
