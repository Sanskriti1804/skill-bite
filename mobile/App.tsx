import { useEffect, useState } from "react";
import { StatusBar } from "react-native";
import * as SplashScreenNative from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppNavigation } from "./src/navigation";
import { loadOnboardingDone } from "./src/onboardingStore";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { SplashScreen } from "./src/screens/SplashScreen";
import { SessionProvider } from "./src/session";
import { colors } from "./src/theme";

void SplashScreenNative.preventAutoHideAsync().catch(() => undefined);

export default function App() {
  const [booting, setBooting] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    let active = true;
    async function boot() {
      const [done] = await Promise.all([
        loadOnboardingDone(),
        new Promise((resolve) => setTimeout(resolve, 1600)),
        SplashScreenNative.hideAsync().catch(() => undefined),
      ]);
      if (!active) return;
      setOnboardingDone(done);
      setBooting(false);
    }
    void boot();
    return () => {
      active = false;
    };
  }, []);

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
        {booting ? (
          <SplashScreen onFinished={() => undefined} />
        ) : !onboardingDone ? (
          <OnboardingScreen onDone={() => setOnboardingDone(true)} />
        ) : (
          <AppNavigation />
        )}
      </SessionProvider>
    </SafeAreaProvider>
  );
}
