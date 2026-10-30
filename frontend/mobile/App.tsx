import { useEffect, useState } from "react";
import { Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { androidApiBase, api, apiBase } from "./src/api";
import { Banner, Button, Field } from "./src/ui";

type Screen = "browse" | "login" | "register" | "bookmarks" | "history" | "notifications" | "account" | "creator" | "admin";
type Item = { contentId: string; title: string; contentType: string };

const base = Platform.OS === "android" ? androidApiBase : apiBase;

export default function App() {
  const [screen, setScreen] = useState<Screen>("browse");
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [rows, setRows] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (screen !== "browse") return;
    api<{ items: Item[] }>(base, "/api/v1/content?sort=newest")
      .then((result) => { setItems(result.items); setMessage(""); })
      .catch(() => setMessage("Content could not be loaded."));
  }, [screen]);

  useEffect(() => {
    if (!token || (screen !== "bookmarks" && screen !== "history" && screen !== "notifications")) return;
    const path = screen === "bookmarks" ? "/api/v1/me/bookmarks" : screen === "history" ? "/api/v1/me/progress" : "/api/v1/notifications";
    api<{ items: { contentId?: string; videoContentId?: string; notificationId?: string; lastPositionSeconds?: number }[] }>(base, path, { token })
      .then((result) => setRows(result.items.map((item) => item.contentId ?? item.videoContentId ?? item.notificationId ?? "item")))
      .catch((caught) => setMessage(caught instanceof Error ? caught.message : "Could not load"));
  }, [screen, token]);

  async function signIn() {
    try {
      const session = await api<{ accessToken: string }>(base, "/api/v1/auth/login", { method: "POST", body: { email, password } });
      const me = await api<{ role: string }>(base, "/api/v1/me", { token: session.accessToken });
      setToken(session.accessToken);
      setRole(me.role);
      setMessage("");
      setScreen(me.role === "ADMIN" ? "admin" : me.role === "CREATOR" ? "creator" : "browse");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Sign in failed");
    }
  }

  async function register() {
    try {
      await api(base, "/api/v1/auth/register", { method: "POST", body: { email, password, displayName, role: "USER" } });
      setMessage("Account created. Verify the email token, then sign in.");
      setScreen("login");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Registration failed");
    }
  }

  async function switchRole(next: "USER" | "CREATOR") {
    await api(base, "/api/v1/me/role", { method: "PATCH", token, body: { role: next } });
    setRole(next);
    setScreen(next === "CREATOR" ? "creator" : "browse");
  }

  const links: [Screen, string][] = role === "ADMIN"
    ? [["admin", "Admin"]]
    : role === "CREATOR"
      ? [["creator", "Content"], ["account", "Account"]]
      : [["browse", "Browse"], ["bookmarks", "Bookmarks"], ["history", "History"], ["notifications", "Notifications"], ["account", "Account"]];

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.nav}>
        {links.map(([name, label]) => (
          <Pressable key={name} onPress={() => setScreen(name)}>
            <Text style={screen === name ? styles.current : styles.link}>{label}</Text>
          </Pressable>
        ))}
        {token ? null : <Pressable onPress={() => setScreen("login")}><Text style={styles.link}>Sign in</Text></Pressable>}
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {message ? <Banner>{message}</Banner> : null}
        {screen === "browse" ? (
          <View style={styles.stack}>
            <Text style={styles.title}>Browse</Text>
            {items.map((item) => <Text key={item.contentId}>{item.title}</Text>)}
            {!items.length ? <Text>Nothing in this category.</Text> : null}
          </View>
        ) : null}
        {screen === "login" || screen === "register" ? (
          <View style={styles.stack}>
            <Text style={styles.title}>{screen === "login" ? "Sign in" : "Register"}</Text>
            {screen === "register" ? <Field label="Display name" value={displayName} onChangeText={setDisplayName} /> : null}
            <Field label="Email" value={email} onChangeText={setEmail} />
            <Field label="Password" value={password} onChangeText={setPassword} secure />
            <Button primary onPress={() => void (screen === "login" ? signIn() : register())}>{screen === "login" ? "Sign in" : "Create account"}</Button>
            <Button onPress={() => setScreen(screen === "login" ? "register" : "login")}>{screen === "login" ? "Register" : "Sign in"}</Button>
          </View>
        ) : null}
        {screen === "account" ? (
          <View style={styles.stack}>
            <Text style={styles.title}>Account</Text>
            <Text>Active role: {role}</Text>
            <Button onPress={() => void switchRole("USER")}>Use as User</Button>
            <Button onPress={() => void switchRole("CREATOR")}>Use as Creator</Button>
            <Button onPress={() => { setToken(""); setRole(""); setScreen("browse"); }}>Sign out</Button>
          </View>
        ) : null}
        {screen === "creator" ? (
          <View style={styles.stack}>
            <Text style={styles.title}>Content</Text>
            <Text>Create a draft from the signed-in Creator role. Publish still requires the server fields.</Text>
          </View>
        ) : null}
        {screen === "admin" ? (
          <View style={styles.stack}>
            <Text style={styles.title}>Admin</Text>
            <Text>Metrics are not defined yet.</Text>
          </View>
        ) : null}
        {screen === "bookmarks" || screen === "history" || screen === "notifications" ? (
          <View style={styles.stack}>
            <Text style={styles.title}>{screen[0].toUpperCase() + screen.slice(1)}</Text>
            {!token ? <Text>Sign in to see this list.</Text> : null}
            {token && !rows.length ? <Text>This list is empty.</Text> : null}
            {rows.map((row) => <Text key={row}>{row}</Text>)}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f6f5f2" },
  nav: { flexDirection: "row", flexWrap: "wrap", gap: 16, padding: 16, backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#e4e0d8" },
  link: { color: "#0f6e56", fontSize: 14, fontWeight: "600" },
  current: { color: "#1c1b19", fontSize: 14, fontWeight: "700" },
  body: { padding: 24, gap: 16 },
  stack: { gap: 16, maxWidth: 1120 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: "600", color: "#1c1b19" },
});
