import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "skillbite.interests.v1.";

export async function loadInterestIds(userKey: string): Promise<string[] | null> {
  try {
    const raw = await AsyncStorage.getItem(`${PREFIX}${userKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : null;
  } catch {
    return null;
  }
}

export async function saveInterestIds(userKey: string, categoryIds: string[]): Promise<void> {
  await AsyncStorage.setItem(`${PREFIX}${userKey}`, JSON.stringify(categoryIds));
}

export async function hasCompletedInterests(userKey: string): Promise<boolean> {
  const ids = await loadInterestIds(userKey);
  return Boolean(ids && ids.length > 0);
}
