import { api } from "../api";
import type { ContentItem } from "../types";

const coverCache = new Map<string, string | null>();

/** Prefer a real Cloudinary thumbnail from published content in that category. */
export async function categoryCoverUrl(slug: string): Promise<string | null> {
  if (coverCache.has(slug)) return coverCache.get(slug) ?? null;
  try {
    const result = await api<{ items: ContentItem[] }>(
      `/api/v1/content?category=${encodeURIComponent(slug)}&sort=newest`,
    );
    const cover =
      result.items.find((item) => item.contentType === "VIDEO" && item.thumbnailUrl)?.thumbnailUrl?.trim()
      || null;
    coverCache.set(slug, cover);
    return cover;
  } catch {
    coverCache.set(slug, null);
    return null;
  }
}

export async function loadCategoryCovers(slugs: string[]): Promise<Record<string, string | null>> {
  const entries = await Promise.all(
    slugs.map(async (slug) => [slug, await categoryCoverUrl(slug)] as const),
  );
  return Object.fromEntries(entries);
}
