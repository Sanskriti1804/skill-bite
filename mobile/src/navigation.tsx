import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "./session";
import { tabIcon } from "./icons";
import { colors } from "./theme";
import { LoadingState, Screen } from "./ui";
import { AccountScreen } from "./screens/AccountScreen";
import { BookmarksScreen } from "./screens/BookmarksScreen";
import { BrowseScreen } from "./screens/BrowseScreen";
import { HistoryScreen } from "./screens/HistoryScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { NotificationsScreen } from "./screens/NotificationsScreen";
import { RegisterScreen } from "./screens/RegisterScreen";
import { WatchScreen } from "./screens/WatchScreen";
import { StudioLibraryScreen } from "./screens/studio/StudioLibraryScreen";
import { ShortEditorScreen } from "./screens/studio/ShortEditorScreen";
import { CourseStudioScreen } from "./screens/studio/CourseStudioScreen";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Browse: undefined;
  Bookmarks: undefined;
  History: undefined;
  Notifications: undefined;
  Account: undefined;
};

export type CreatorTabParamList = {
  Studio: undefined;
  Account: undefined;
};

export type CreatorStackParamList = {
  CreatorTabs: undefined;
  ShortEditor: { contentId?: string };
  CourseStudio: { contentId?: string };
  Watch: { contentId: string };
};

export type RootStackParamList = {
  Tabs: { screen?: keyof MainTabParamList } | undefined;
  Watch: { contentId: string };
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const CreatorTab = createBottomTabNavigator<CreatorTabParamList>();
const CreatorStack = createNativeStackNavigator<CreatorStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const learnerTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.videoBg,
    card: colors.tabBar,
    text: colors.feedText,
    border: "#1C1B19",
    primary: colors.accent,
  },
};

const creatorTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.ink,
    border: colors.line,
    primary: colors.accent,
  },
};

function LearnerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: "#23211E",
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={tabIcon(route.name, focused)} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Browse" component={BrowseScreen} options={{ title: "Learn" }} />
      <Tab.Screen name="Bookmarks" component={BookmarksScreen} options={{ title: "Saved" }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: "History" }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Alerts" }} />
      <Tab.Screen name="Account" component={AccountScreen} options={{ title: "You" }} />
    </Tab.Navigator>
  );
}

function CreatorTabs() {
  return (
    <CreatorTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={tabIcon(route.name, focused)} size={size} color={color} />
        ),
      })}
    >
      <CreatorTab.Screen name="Studio" component={StudioLibraryScreen} options={{ title: "Studio" }} />
      <CreatorTab.Screen name="Account" component={AccountScreen} options={{ title: "You" }} />
    </CreatorTab.Navigator>
  );
}

function LearnerRoot() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
      <RootStack.Screen name="Tabs" component={LearnerTabs} />
      <RootStack.Screen name="Watch" component={WatchScreen} />
    </RootStack.Navigator>
  );
}

function CreatorRoot() {
  return (
    <CreatorStack.Navigator screenOptions={{ headerShown: false }}>
      <CreatorStack.Screen name="CreatorTabs" component={CreatorTabs} />
      <CreatorStack.Screen name="ShortEditor" component={ShortEditorScreen} />
      <CreatorStack.Screen name="CourseStudio" component={CourseStudioScreen} />
      <CreatorStack.Screen name="Watch" component={WatchScreen} />
    </CreatorStack.Navigator>
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
  if (!ready) {
    return <Screen><LoadingState /></Screen>;
  }
  const isCreator = session?.role === "CREATOR";
  return (
    <NavigationContainer theme={session ? (isCreator ? creatorTheme : learnerTheme) : creatorTheme}>
      {!session ? <AuthRoot /> : isCreator ? <CreatorRoot /> : <LearnerRoot />}
    </NavigationContainer>
  );
}
