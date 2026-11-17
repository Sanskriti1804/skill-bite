import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useFocusEffect, type CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api";
import { Icon } from "../icons";
import { contentApi, type OwnedContent } from "../services/content";
import { useSession } from "../session";
import { colors, font, radii, space } from "../theme";
import { Banner, EmptyState, Field, LoadingState, Screen, Title } from "../ui";
import type { MainTabParamList, RootStackParamList } from "../navigation";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Profile">,
  NativeStackScreenProps<RootStackParamList>
>;

export function ProfileScreen({ navigation }: Props) {
  const { session, profile, refreshProfile, ensurePublisher, signOut } = useSession();
  const [items, setItems] = useState<OwnedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [usernameDraft, setUsernameDraft] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setUsernameDraft(profile?.username ?? "");
  }, [profile?.username]);

  const load = useCallback(async () => {
    if (!session?.token) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await ensurePublisher();
      const [, result] = await Promise.all([
        refreshProfile(),
        contentApi.mine(session.token),
      ]);
      setItems(result.items.filter((item) => item.status !== "REMOVED"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load profile");
    } finally {
      setLoading(false);
    }
  }, [ensurePublisher, refreshProfile, session?.token]);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  async function removeItem(item: OwnedContent) {
    if (!session?.token) return;
    setBusyId(item.contentId);
    setError("");
    try {
      await ensurePublisher();
      if (item.contentType === "COURSE") {
        await contentApi.deleteCourse(session.token, item.contentId);
        setItems((current) => current.filter((row) => row.contentId !== item.contentId));
        setMessage("Playlist deleted.");
        return;
      }
      await contentApi.deleteVideo(session.token, item.contentId);
      setItems((current) => current.filter((row) => row.contentId !== item.contentId));
      setMessage("Short deleted.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete content");
    } finally {
      setBusyId("");
    }
  }

  function confirmDelete(item: OwnedContent) {
    Alert.alert(
      item.contentType === "COURSE" ? "Delete playlist?" : "Delete short?",
      item.contentType === "COURSE"
        ? "This permanently deletes the playlist. Shorts stay in your library."
        : `"${item.description || item.title || "Untitled short"}" will be deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => void removeItem(item) },
      ],
    );
  }

  async function saveUsername() {
    if (!session?.token) return;
    const next = usernameDraft.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(next)) {
      setError("Username must be 3–24 characters: letters, numbers, and underscores only");
      return;
    }
    if (next === profile?.username) {
      setMessage("Username is already up to date.");
      return;
    }
    setSavingUsername(true);
    setError("");
    setMessage("");
    try {
      await api("/api/v1/me/username", {
        method: "PATCH",
        token: session.token,
        body: { username: next },
      });
      await refreshProfile();
      setMessage("Username updated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update username");
    } finally {
      setSavingUsername(false);
    }
  }

  if (!session) {
    return (
      <Screen>
        <Title>Profile</Title>
        <Banner tone="info">Sign in to see your profile.</Banner>
      </Screen>
    );
  }

  const publishedShorts = items.filter((item) => item.contentType === "VIDEO" && item.status === "PUBLISHED");
  const draftShorts = items.filter((item) => item.contentType === "VIDEO" && item.status !== "PUBLISHED");
  const playlists = items.filter((item) => item.contentType === "COURSE");

  function renderShort(item: OwnedContent) {
    return (
      <View key={item.contentId} style={styles.item}>
        <Pressable
          style={{ flex: 1, gap: 4 }}
          onPress={() => navigation.navigate("ShortEditor", { contentId: item.contentId })}
        >
          <Text style={styles.itemTitle}>{item.description || item.title || "Untitled short"}</Text>
          <Text style={styles.itemMeta}>{item.status}</Text>
        </Pressable>
        <View style={styles.actions}>
          <Pressable onPress={() => navigation.navigate("ShortEditor", { contentId: item.contentId })}>
            <Text style={styles.action}>Edit</Text>
          </Pressable>
          <Pressable disabled={busyId === item.contentId} onPress={() => confirmDelete(item)}>
            <Text style={styles.actionDanger}>Delete</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
        <Title>Profile</Title>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Icon name="accountActive" size={36} color={colors.accentInk} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{profile?.displayName ?? "You"}</Text>
            <Text style={styles.meta}>@{profile?.username || "username"}</Text>
            <Text style={styles.meta}>{publishedShorts.length} published</Text>
            <Text style={styles.meta}>{draftShorts.length} drafts</Text>
          </View>
        </View>

        <Text style={styles.section}>Username</Text>
        <View style={styles.usernameCard}>
          <Field
            label="Unique username"
            value={usernameDraft}
            onChangeText={setUsernameDraft}
            hint="Used to sign in. Letters, numbers, underscore."
          />
          <Pressable
            accessibilityRole="button"
            disabled={savingUsername}
            style={[styles.usernameSave, savingUsername ? styles.usernameSaveDisabled : null]}
            onPress={() => void saveUsername()}
          >
            <Text style={styles.usernameSaveText}>{savingUsername ? "Saving…" : "Save username"}</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>Library</Text>
        <View style={styles.rowLinks}>
          <Pressable style={styles.link} onPress={() => navigation.navigate("Bookmarks")}>
            <Icon name="bookmark" size={18} color={colors.accent} />
            <Text style={styles.linkText}>Saved</Text>
          </Pressable>
          <Pressable style={styles.link} onPress={() => navigation.navigate("History")}>
            <Icon name="history" size={18} color={colors.accent} />
            <Text style={styles.linkText}>History</Text>
          </Pressable>
          <Pressable style={styles.link} onPress={() => navigation.navigate("Notifications")}>
            <Icon name="alerts" size={18} color={colors.accent} />
            <Text style={styles.linkText}>Alerts</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>Published shorts</Text>
        {loading ? <LoadingState /> : null}
        {!loading && !publishedShorts.length ? <EmptyState>No published shorts yet. Publish from Create.</EmptyState> : null}
        {publishedShorts.length ? <View style={styles.group}>{publishedShorts.map(renderShort)}</View> : null}

        <Text style={styles.section}>Draft shorts</Text>
        {!loading && !draftShorts.length ? <EmptyState>No drafts here. Save one from Create.</EmptyState> : null}
        {draftShorts.length ? <View style={styles.group}>{draftShorts.map(renderShort)}</View> : null}

        <Text style={styles.section}>My playlists</Text>
        {!loading && !playlists.length ? <EmptyState>No playlists yet. Create one to group shorts.</EmptyState> : null}
        {playlists.length ? (
          <View style={styles.group}>
            {playlists.map((item) => (
              <View key={item.contentId} style={styles.item}>
                <Pressable
                  style={{ flex: 1, gap: 4 }}
                  onPress={() => navigation.navigate("CourseStudio", { contentId: item.contentId })}
                >
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemMeta}>{item.status}</Text>
                </Pressable>
                <View style={styles.actions}>
                  <Pressable onPress={() => navigation.navigate("CourseStudio", { contentId: item.contentId })}>
                    <Text style={styles.action}>Edit</Text>
                  </Pressable>
                  <Pressable disabled={busyId === item.contentId} onPress={() => confirmDelete(item)}>
                    <Text style={styles.actionDanger}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <Pressable style={styles.actionRow} onPress={() => void signOut()}>
          <Icon name="logout" size={20} color={colors.danger} />
          <Text style={[styles.actionRowText, { color: colors.danger }]}>Sign out</Text>
        </Pressable>

        {message ? <Banner tone="info">{message}</Banner> : null}
        {error ? <Banner>{error}</Banner> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  avatar: {
    width: "40%",
    aspectRatio: 1,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    gap: space.xs,
  },
  name: { fontSize: 22, fontFamily: font.heavy, fontWeight: "800", color: colors.ink },
  meta: { color: colors.inkMuted, fontSize: 13, fontFamily: font.medium, fontWeight: "600" },
  section: { fontSize: 16, fontFamily: font.bold, fontWeight: "700", color: colors.ink },
  usernameCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: space.lg,
    gap: space.md,
  },
  usernameSave: {
    minHeight: 48,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  usernameSaveDisabled: { opacity: 0.65 },
  usernameSaveText: {
    color: colors.accentInk,
    fontFamily: font.heavy,
    fontWeight: "800",
    fontSize: 15,
  },
  rowLinks: { flexDirection: "row", gap: 8 },
  link: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
  },
  linkText: { color: colors.ink, fontFamily: font.bold, fontWeight: "700", fontSize: 12 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: space.lg,
  },
  itemTitle: { color: colors.ink, fontFamily: font.bold, fontWeight: "700", fontSize: 15 },
  itemMeta: { color: colors.inkMuted, fontSize: 12, fontFamily: font.medium, fontWeight: "600" },
  actions: { flexDirection: "row", alignItems: "center", gap: 12 },
  action: { color: colors.accent, fontFamily: font.heavy, fontWeight: "800", fontSize: 13 },
  actionDanger: { color: colors.danger, fontFamily: font.heavy, fontWeight: "800", fontSize: 13 },
  actionRow: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionRowText: { color: colors.ink, fontFamily: font.bold, fontWeight: "700", fontSize: 15 },
});
