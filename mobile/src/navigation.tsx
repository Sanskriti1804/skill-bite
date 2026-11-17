import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSession } from "./session";
import { tabIcon } from "./icons";
import { hasCompletedInterests } from "./interestsStore";
import { colors, font } from "./theme";
import { LoadingState, Screen } from "./ui";
import { BookmarksScreen } from "./screens/BookmarksScreen";
import { BrowseScreen } from "./screens/BrowseScreen";
import { ExploreScreen } from "./screens/ExploreScreen";
import { HistoryScreen } from "./screens/HistoryScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { InterestSelectionScreen } from "./screens/InterestSelectionScreen";
import { LearningScreen } from "./screens/LearningScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { NotificationsScreen } from "./screens/NotificationsScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { RegisterScreen } from "./screens/RegisterScreen";
import { WatchScreen } from "./screens/WatchScreen";
import { ShortEditorScreen } from "./screens/studio/ShortEditorScreen";
import { CourseStudioScreen } from "./screens/studio/CourseStudioScreen";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Bites: undefined;
  Explore: undefined;
  Learning: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Tabs: { screen?: keyof MainTabParamList } | undefined;
  Watch: { contentId: string };
  ShortEditor: { contentId?: string };
  CourseStudio: { contentId?: string };
  Bookmarks: undefined;
  History: undefined;
  Notifications: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const appTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.tabBar,
    text: colors.ink,
    border: colors.line,
    primary: colors.accent,
  },
};

function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          position: "relative",
          height: 56 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 6,
          backgroundColor: colors.tabBar,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.line,
          borderWidth: 0,
          borderRadius: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: { fontSize: 10, fontFamily: font.bold, fontWeight: "700", marginTop: 2 },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={tabIcon(route.name, focused)} size={size - 2} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
      <Tab.Screen name="Bites" component={BrowseScreen} options={{ title: "Bites" }} />
      <Tab.Screen name="Explore" component={ExploreScreen} options={{ title: "Explore" }} />
      <Tab.Screen name="Learning" component={LearningScreen} options={{ title: "Learning" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}

function AppRoot() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
      <RootStack.Screen name="Tabs" component={MainTabs} />
      <RootStack.Screen name="Watch" component={WatchScreen} />
      <RootStack.Screen name="ShortEditor" component={ShortEditorScreen} />
      <RootStack.Screen name="CourseStudio" component={CourseStudioScreen} />
      <RootStack.Screen name="Bookmarks" component={BookmarksScreen} />
      <RootStack.Screen name="History" component={HistoryScreen} />
      <RootStack.Screen name="Notifications" component={NotificationsScreen} />
    </RootStack.Navigator>
  );
}

function AuthRoot() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

export function AppNavigation() {
  const { ready, session } = useSession();
  const [interestsReady, setInterestsReady] = useState(false);
  const [needsInterests, setNeedsInterests] = useState(false);

  const refreshInterests = useCallback(async () => {
    if (!session?.userId) {
      setNeedsInterests(false);
      setInterestsReady(true);
      return;
    }
    const done = await hasCompletedInterests(session.userId);
    setNeedsInterests(!done);
    setInterestsReady(true);
  }, [session?.userId]);

  useEffect(() => {
    setInterestsReady(false);
    void refreshInterests();
  }, [refreshInterests]);

  if (!ready || (session && !interestsReady)) {
    return <Screen><LoadingState /></Screen>;
  }

  return (
    <NavigationContainer theme={appTheme}>
      {!session ? (
        <AuthRoot />
      ) : needsInterests ? (
        <View style={styles.fill}>
          <InterestSelectionScreen
            userKey={session.userId}
            onDone={() => {
              setNeedsInterests(false);
            }}
          />
        </View>
      ) : (
        <AppRoot />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
