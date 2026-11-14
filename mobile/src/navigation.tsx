import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "./session";
import { tabIcon } from "./icons";
import { colors } from "./theme";
import { LoadingState, Screen } from "./ui";
import { BookmarksScreen } from "./screens/BookmarksScreen";
import { BrowseScreen } from "./screens/BrowseScreen";
import { CreateScreen } from "./screens/CreateScreen";
import { ExploreScreen } from "./screens/ExploreScreen";
import { HistoryScreen } from "./screens/HistoryScreen";
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
  Explore: undefined;
  Create: undefined;
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
    text: colors.feedText,
    border: colors.line,
    primary: colors.accent,
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.line,
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={tabIcon(route.name, focused)} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={BrowseScreen} options={{ title: "Home" }} />
      <Tab.Screen name="Explore" component={ExploreScreen} options={{ title: "Explore" }} />
      <Tab.Screen name="Create" component={CreateScreen} options={{ title: "Create" }} />
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
  if (!ready) {
    return <Screen><LoadingState /></Screen>;
  }
  return (
    <NavigationContainer theme={appTheme}>
      {!session ? <AuthRoot /> : <AppRoot />}
    </NavigationContainer>
  );
}
