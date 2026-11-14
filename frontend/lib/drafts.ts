export type CreatorDraft = {
  contentId: string;
  status: string;
  title: string;
  kind: "VIDEO" | "COURSE";
};

function keyFor(userId: string): string {
  return `skillbite.creatorDrafts.${userId || "anonymous"}`;
}

export function loadDrafts(userId: string): CreatorDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(keyFor(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CreatorDraft[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDrafts(userId: string, drafts: CreatorDraft[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(keyFor(userId), JSON.stringify(drafts));
}

export function upsertDraft(userId: string, draft: CreatorDraft): CreatorDraft[] {
  const next = [draft, ...loadDrafts(userId).filter((item) => item.contentId !== draft.contentId)];
  saveDrafts(userId, next);
  return next;
}

export function updateDraftStatus(userId: string, contentId: string, status: string): CreatorDraft[] {
  const next = loadDrafts(userId).map((item) => (item.contentId === contentId ? { ...item, status } : item));
  saveDrafts(userId, next);
  return next;
}
