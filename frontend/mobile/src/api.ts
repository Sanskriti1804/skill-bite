export const apiBase = "http://127.0.0.1:3000";
export const androidApiBase = "http://10.0.2.2:3000";

export async function api<T>(base: string, path: string, options: { method?: string; token?: string; body?: unknown } = {}): Promise<T> {
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
