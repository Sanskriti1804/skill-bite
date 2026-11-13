import AsyncStorage from "@react-native-async-storage/async-storage";

export type StudioDraft = {
  contentId: string;
  status: string;
  title: string;
  kind: "VIDEO" | "COURSE";
  updatedAt: string;
};

function keyFor(userId: string): string {
  return `skillbite.studioDrafts.${userId || "anonymous"}`;
}

export async function loadStudioDrafts(userId: string): Promise<StudioDraft[]> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StudioDraft[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveStudioDrafts(userId: string, drafts: StudioDraft[]): Promise<void> {
  await AsyncStorage.setItem(keyFor(userId), JSON.stringify(drafts));
}

export async function upsertStudioDraft(userId: string, draft: StudioDraft): Promise<StudioDraft[]> {
  const current = await loadStudioDrafts(userId);
  const next = [draft, ...current.filter((item) => item.contentId !== draft.contentId)];
  await saveStudioDrafts(userId, next);
  return next;
}

export async function updateStudioDraftStatus(userId: string, contentId: string, status: string): Promise<StudioDraft[]> {
  const next = (await loadStudioDrafts(userId)).map((item) => (
    item.contentId === contentId ? { ...item, status, updatedAt: new Date().toISOString() } : item
  ));
  await saveStudioDrafts(userId, next);
  return next;
}
