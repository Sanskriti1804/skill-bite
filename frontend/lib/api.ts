export const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3000";

export type Session = { accessToken: string; refreshToken: string; expiresIn: number };

export async function api<T>(path: string, options: { method?: string; token?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = payload?.error?.message ?? "Request failed";
    throw Object.assign(new Error(message), { status: response.status });
  }
  return payload as T;
}
