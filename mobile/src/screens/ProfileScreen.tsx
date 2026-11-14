import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useFocusEffect, type CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Icon } from "../icons";
import { contentApi, type OwnedContent } from "../services/content";
import { useSession } from "../session";
import { colors, radii, space } from "../theme";
import { Banner, EmptyState, LoadingState, Screen, Title } from "../ui";
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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
      await refreshProfile();
      const result = await contentApi.mine(session.token);
      setItems(result.items);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load profile");
    } finally {
      setLoading(false);
    }
  }, [ensurePublisher, refreshProfile, session?.token]);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  async function manage(item: OwnedContent, action: "publish" | "takedown") {
    if (!session?.token) return;
    setBusyId(item.contentId);
    setError("");
    try {
      await ensurePublisher();
      if (item.contentType === "COURSE") {
        const result = action === "publish"
          ? await contentApi.publishCourse(session.token, item.contentId)
          : await contentApi.takedown(session.token, item.contentId);
        setItems((current) => current.map((row) => (
          row.contentId === item.contentId ? { ...row, status: result.status } : row
        )));
        setMessage(action === "publish" ? "Playlist published." : "Playlist taken down.");
        return;
      }
      const result = action === "publish"
        ? await contentApi.publishVideo(session.token, item.contentId)
        : await contentApi.takedown(session.token, item.contentId);
      setItems((current) => current.map((row) => (
        row.contentId === item.contentId ? { ...row, status: result.status } : row
      )));
      setMessage(action === "publish" ? "Short published to Explore." : "Short taken down.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update content");
    } finally {
      setBusyId("");
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

  const shorts = items.filter((item) => item.contentType === "VIDEO");
  const playlists = items.filter((item) => item.contentType === "COURSE");

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
        <Title>Profile</Title>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Icon name="accountActive" size={28} color={colors.accentInk} />
          </View>
          <Text style={styles.name}>{profile?.displayName ?? "You"}</Text>
          <Text style={styles.meta}>{profile?.email}</Text>
          <Text style={styles.meta}>{shorts.length} shorts · {playlists.length} playlists</Text>
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

        <Text style={styles.section}>My shorts</Text>
        {loading ? <LoadingState /> : null}
        {!loading && !shorts.length ? <EmptyState>No shorts yet. Open Create to upload one.</EmptyState> : null}
        {shorts.map((item) => (
          <View key={item.contentId} style={styles.item}>
            <Pressable
              style={{ flex: 1, gap: 4 }}
              onPress={() => navigation.navigate("ShortEditor", { contentId: item.contentId })}
            >
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemMeta}>{item.status}</Text>
            </Pressable>
            {item.status !== "PUBLISHED" ? (
              <Pressable disabled={busyId === item.contentId} onPress={() => void manage(item, "publish")}>
                <Text style={styles.action}>Publish</Text>
              </Pressable>
            ) : (
              <Pressable disabled={busyId === item.contentId} onPress={() => void manage(item, "takedown")}>
                <Text style={styles.actionDanger}>Take down</Text>
              </Pressable>
            )}
          </View>
        ))}

        <Text style={styles.section}>My playlists</Text>
        {!loading && !playlists.length ? <EmptyState>No playlists yet. Create one to group shorts.</EmptyState> : null}
        {playlists.map((item) => (
          <View key={item.contentId} style={styles.item}>
            <Pressable
              style={{ flex: 1, gap: 4 }}
              onPress={() => navigation.navigate("CourseStudio", { contentId: item.contentId })}
            >
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemMeta}>{item.status}</Text>
            </Pressable>
            {item.status !== "PUBLISHED" ? (
              <Pressable disabled={busyId === item.contentId} onPress={() => void manage(item, "publish")}>
                <Text style={styles.action}>Publish</Text>
              </Pressable>
            ) : (
              <Pressable disabled={busyId === item.contentId} onPress={() => void manage(item, "takedown")}>
                <Text style={styles.actionDanger}>Take down</Text>
              </Pressable>
            )}
          </View>
        ))}

        {session.role === "ADMIN" ? (
          <Banner tone="info">Admin tools stay on the web portal.</Banner>
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
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.xl,
    gap: 6,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  name: { fontSize: 22, fontWeight: "800", color: colors.ink },
  meta: { color: colors.inkMuted, fontSize: 13, fontWeight: "600" },
  section: { fontSize: 16, fontWeight: "700", color: colors.ink },
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
  linkText: { color: colors.ink, fontWeight: "700", fontSize: 12 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
  },
  itemTitle: { color: colors.ink, fontWeight: "700", fontSize: 15 },
  itemMeta: { color: colors.inkMuted, fontSize: 12, fontWeight: "600" },
  action: { color: colors.accent, fontWeight: "800", fontSize: 13 },
  actionDanger: { color: colors.danger, fontWeight: "800", fontSize: 13 },
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
  actionRowText: { color: colors.ink, fontWeight: "700", fontSize: 15 },
});
