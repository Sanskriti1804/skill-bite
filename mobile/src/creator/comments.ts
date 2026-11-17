import { api } from "../api";

export type CommentItem = {
  commentId: string;
  contentId: string;
  parentCommentId?: string | null;
  body: string;
  createdAt: string;
  userId: string;
  username: string;
  displayName: string;
  replies?: CommentItem[];
};

type CacheEntry = {
  items: CommentItem[];
  total: number;
  at: number;
};

const TTL_MS = 45_000;
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<CacheEntry>>();

export function countComments(items: CommentItem[]): number {
  return items.reduce((sum, item) => sum + 1 + (item.replies?.length ?? 0), 0);
}

export function peekComments(contentId: string): CacheEntry | null {
  const hit = cache.get(contentId);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    cache.delete(contentId);
    return null;
  }
  return hit;
}

export function writeComments(contentId: string, items: CommentItem[], total?: number) {
  cache.set(contentId, { items, total: total ?? countComments(items), at: Date.now() });
}

export function invalidateComments(contentId: string) {
  cache.delete(contentId);
  inflight.delete(contentId);
}

export async function fetchComments(contentId: string, token: string, force = false): Promise<CacheEntry> {
  if (!force) {
    const hit = peekComments(contentId);
    if (hit) return hit;
    const pending = inflight.get(contentId);
    if (pending) return pending;
  }

  const request = api<{ items: CommentItem[]; total?: number }>(
    `/api/v1/content/${contentId}/comments`,
    { token },
  ).then((result) => {
    const entry: CacheEntry = {
      items: result.items,
      total: result.total ?? countComments(result.items),
      at: Date.now(),
    };
    cache.set(contentId, entry);
    inflight.delete(contentId);
    return entry;
  }).catch((error) => {
    inflight.delete(contentId);
    throw error;
  });

  inflight.set(contentId, request);
  return request;
}

/** Warm cache for the active reel so opening comments feels instant. */
export function prefetchComments(contentId: string, token: string) {
  if (!contentId || !token) return;
  if (peekComments(contentId) || inflight.has(contentId)) return;
  void fetchComments(contentId, token).catch(() => undefined);
}
