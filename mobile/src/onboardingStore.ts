import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "skillbite.onboarding.v1";

export async function loadOnboardingDone(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === "1";
  } catch {
    return false;
  }
}

export async function saveOnboardingDone(): Promise<void> {
  await AsyncStorage.setItem(KEY, "1");
}
