import { useCallback, useEffect, useState } from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import { useFonts, Quicksand_600SemiBold } from "@expo-google-fonts/quicksand";
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from "@expo-google-fonts/nunito";
import * as SplashScreenNative from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CommentSheetHost } from "./src/components/CommentSheet";
import { SaveSheetHost } from "./src/components/SaveSheet";
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
  const [appReady, setAppReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    Quicksand_600SemiBold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  const fontsReady = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    let active = true;
    async function prepare() {
      const done = await loadOnboardingDone();
      if (!active) return;
      setOnboardingDone(done);
      if (fontsReady) setAppReady(true);
    }
    void prepare();
    return () => {
      active = false;
    };
  }, [fontsReady]);

  useEffect(() => {
    if (fontsReady) setAppReady(true);
  }, [fontsReady]);

  // Safety: never stick on a blank frame if fonts hang.
  useEffect(() => {
    const timer = setTimeout(() => setAppReady(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  const onRootLayout = useCallback(() => {
    void SplashScreenNative.hideAsync().catch(() => undefined);
  }, []);

  const finishBoot = useCallback(() => {
    setBooting(false);
  }, []);

  if (!appReady) {
    // Keep the native splash up; cream fill avoids a black flash if it already hid.
    return <View style={styles.root} />;
  }

  return (
    <SafeAreaProvider style={styles.root}>
      <View style={styles.root} onLayout={onRootLayout}>
        <SessionProvider>
          <StatusBar barStyle="dark-content" />
          {booting ? (
            <SplashScreen onFinished={finishBoot} />
          ) : !onboardingDone ? (
            <OnboardingScreen onDone={() => setOnboardingDone(true)} />
          ) : (
            <AppNavigation />
          )}
          <SaveSheetHost />
          <CommentSheetHost />
        </SessionProvider>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
