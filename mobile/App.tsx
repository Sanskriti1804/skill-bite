import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppNavigation } from "./src/navigation";
import { SessionProvider } from "./src/session";
import { colors } from "./src/theme";

export default function App() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar barStyle="light-content" backgroundColor={colors.videoBg} />
        <AppNavigation />
      </SessionProvider>
    </SafeAreaProvider>
  );
}
