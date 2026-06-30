import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_KEY = "@waterzone/onboarding_complete";

export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_KEY)) === "true";
  } catch {
    return false;
  }
}

export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, "true");
}
