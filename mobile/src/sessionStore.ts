import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "skillbite.mobile.session";

export type MobileSession = {
  token: string;
  refreshToken: string;
  role: string;
  userId: string;
};

export async function loadSession(): Promise<MobileSession | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MobileSession;
    if (!parsed.token || !parsed.refreshToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveSession(value: MobileSession | null): Promise<void> {
  if (!value) {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}
