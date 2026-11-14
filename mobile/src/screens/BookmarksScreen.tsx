import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api";
import { Icon } from "../icons";
import { useSession } from "../session";
import { colors, radii, space } from "../theme";
import type { ContentDetail } from "../types";
import { Banner, EmptyState, LoadingState, Screen, Title } from "../ui";
import type { RootStackParamList } from "../navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Bookmarks">;

type Row = { contentId: string; title: string; contentType?: string };

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
      const result = await api<{ items: { contentId: string }[] }>("/api/v1/me/bookmarks", { token: session.token });
      const rows = await Promise.all(result.items.map(async (item) => {
        try {
          const detail = await api<ContentDetail>(`/api/v1/content/${item.contentId}`, { token: session.token });
          return { contentId: item.contentId, title: detail.title, contentType: detail.contentType };
        } catch {
          return { contentId: item.contentId, title: item.contentId };
        }
      }));
      setItems(rows);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load bookmarks");
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

  return (
    <Screen>
      <Pressable style={styles.back} onPress={() => navigation.goBack()}>
        <Icon name="back" size={20} color={colors.ink} />
        <Text style={styles.backText}>Profile</Text>
      </Pressable>
      <Title>Saved</Title>
      <Text style={styles.sub}>Bookmarks for quick return — not a recommendation feed.</Text>
      {!session ? <Banner tone="info">Sign in to see saved lessons.</Banner> : null}
      {error ? <Banner>{error}</Banner> : null}
      {loading ? <LoadingState /> : null}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
      >
        {!loading && session && !items.length ? <EmptyState>No saved lessons yet.</EmptyState> : null}
        {items.map((item) => (
          <Pressable
            key={item.contentId}
            style={styles.row}
            onPress={() => navigation.navigate("Watch", { contentId: item.contentId })}
          >
            <View style={styles.iconWrap}>
              <Icon name={item.contentType === "COURSE" ? "course" : "video"} size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.meta}>{item.contentType ?? "Lesson"}</Text>
            </View>
            <Pressable onPress={() => void remove(item.contentId)} hitSlop={12}>
              <Icon name="bookmarkActive" size={22} color={colors.accent} />
            </Pressable>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { color: colors.ink, fontWeight: "700" },
  sub: { color: colors.inkMuted, fontSize: 13, marginTop: -8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  meta: { color: colors.inkMuted, fontSize: 12, fontWeight: "600" },
});
