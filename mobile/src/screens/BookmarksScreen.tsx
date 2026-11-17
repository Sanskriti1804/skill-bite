import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api";
import { Icon } from "../icons";
import { useSession } from "../session";
import { colors, font, radii, space } from "../theme";
import { Banner, EmptyState, LoadingState, Screen, Title } from "../ui";
import type { RootStackParamList } from "../navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Bookmarks">;

type Row = {
  contentId: string;
  title: string;
  description?: string | null;
  contentType?: string;
  status?: string;
};

export function BookmarksScreen({ navigation }: Props) {
  const { session } = useSession();
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!session?.token) {
      setItems([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setError("");
    try {
      const result = await api<{ items: Row[] }>("/api/v1/me/bookmarks", { token: session.token });
      setItems(result.items);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load watching list");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.token]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  async function remove(contentId: string) {
    if (!session?.token) return;
    await api(`/api/v1/bookmarks/${contentId}`, { method: "DELETE", token: session.token });
    setItems((current) => current.filter((item) => item.contentId !== contentId));
  }

  const videos = items.filter((item) => item.contentType !== "COURSE");
  const playlists = items.filter((item) => item.contentType === "COURSE");

  function renderRow(item: Row) {
    return (
      <Pressable
        key={item.contentId}
        style={styles.row}
        onPress={() => navigation.navigate("Watch", { contentId: item.contentId })}
      >
        <View style={styles.iconWrap}>
          <Icon name={item.contentType === "COURSE" ? "course" : "video"} size={20} color={colors.accent} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.title} numberOfLines={2}>
            {item.description || item.title}
          </Text>
          <Text style={styles.meta}>
            {item.contentType === "COURSE" ? "Course" : "Short"}
          </Text>
        </View>
        <Pressable onPress={() => void remove(item.contentId)} hitSlop={12}>
          <Icon name="bookmarkActive" size={22} color={colors.accent} />
        </Pressable>
      </Pressable>
    );
  }

  return (
    <Screen>
      <View style={styles.headerBar}>
        <Title>Watching list</Title>
        <Pressable style={styles.back} onPress={() => navigation.goBack()}>
          <Icon name="back" size={20} color={colors.ink} />
          <Text style={styles.backText}>Profile</Text>
        </Pressable>
      </View>
      <Text style={styles.sub}>Save shorts and courses to watch later.</Text>
      {!session ? <Banner tone="info">Sign in to see your watching list.</Banner> : null}
      {error ? <Banner>{error}</Banner> : null}
      {loading ? <LoadingState /> : null}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
      >
        {!loading && session && !items.length ? <EmptyState>Nothing saved yet. Add shorts or courses from Home.</EmptyState> : null}

        {playlists.length ? <Text style={styles.section}>Courses</Text> : null}
        {playlists.map(renderRow)}

        {videos.length ? <Text style={styles.section}>Shorts</Text> : null}
        {videos.map(renderRow)}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerBar: { minHeight: 44, justifyContent: "center" },
  back: { position: "absolute", left: 0, top: 0, bottom: 0, flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { color: colors.ink, fontFamily: font.bold, fontWeight: "700" },
  sub: { color: colors.inkMuted, fontSize: 13, marginTop: -6, marginBottom: 8, fontFamily: font.body },
  section: { fontSize: 15, fontFamily: font.bold, fontWeight: "700", color: colors.ink, marginTop: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: space.lg,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
  },
  title: { color: colors.ink, fontFamily: font.bold, fontWeight: "700", fontSize: 15 },
  meta: { color: colors.inkMuted, fontSize: 12, fontFamily: font.medium, fontWeight: "600" },
});
