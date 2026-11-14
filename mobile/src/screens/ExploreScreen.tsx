import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api";
import { Icon } from "../icons";
import { colors, radii, space } from "../theme";
import type { Category, ContentItem } from "../types";
import { Banner, EmptyState, LoadingState, Screen, Title } from "../ui";
import type { MainTabParamList, RootStackParamList } from "../navigation";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Explore">,
  NativeStackScreenProps<RootStackParamList>
>;

export function ExploreScreen({ navigation }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams({ sort: "newest" });
      if (query.trim()) params.set("q", query.trim());
      if (category) params.set("category", category);
      const [content, cats] = await Promise.all([
        api<{ items: ContentItem[] }>(`/api/v1/content?${params.toString()}`),
        api<{ items: Category[] }>("/api/v1/categories"),
      ]);
      setItems(content.items);
      setCategories(cats.items);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load Explore");
    } finally {
      setLoading(false);
    }
  }, [category, query]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  return (
    <Screen>
      <Title>Explore</Title>
      <Text style={styles.sub}>Search shorts and playlists by topic or category.</Text>

      <View style={styles.search}>
        <Icon name="search" size={18} color={colors.inkMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search titles, tags, keywords"
          placeholderTextColor={colors.inkMuted}
          style={styles.input}
          returnKeyType="search"
          onSubmitEditing={() => {
            setLoading(true);
            void load();
          }}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Pressable style={[styles.chip, !category ? styles.chipOn : null]} onPress={() => setCategory("")}>
          <Text style={[styles.chipText, !category ? styles.chipTextOn : null]}>All</Text>
        </Pressable>
        {categories.map((item) => {
          const selected = category === item.slug;
          return (
            <Pressable key={item.slug} style={[styles.chip, selected ? styles.chipOn : null]} onPress={() => setCategory(item.slug)}>
              <Text style={[styles.chipText, selected ? styles.chipTextOn : null]}>{item.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {error ? <Banner>{error}</Banner> : null}
      {loading ? <LoadingState /> : null}

      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 32 }}>
        {!loading && !items.length ? <EmptyState>No published content matches.</EmptyState> : null}
        {items.map((item) => {
          const labels = [...(item.categories ?? []), ...(item.tags ?? [])].slice(0, 3);
          return (
            <Pressable
              key={item.contentId}
              style={styles.row}
              onPress={() => navigation.navigate("Watch", { contentId: item.contentId })}
            >
              <View style={styles.iconWrap}>
                <Icon name={item.contentType === "COURSE" ? "course" : "video"} size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.meta}>{item.contentType === "COURSE" ? "Playlist" : "Short"}</Text>
                {labels.length ? (
                  <View style={styles.labelRow}>
                    {labels.map((label) => (
                      <View key={`${item.contentId}-${label.slug}`} style={styles.labelChip}>
                        <Text style={styles.labelChipText}>{label.name}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
              <Icon name="continue" size={18} color={colors.inkMuted} />
            </Pressable>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { color: colors.inkMuted, fontSize: 14, lineHeight: 20, marginTop: -8 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: space.lg,
    minHeight: 48,
  },
  input: { flex: 1, color: colors.ink, fontSize: 15, paddingVertical: 10 },
  chips: { gap: 8, paddingVertical: 4 },
  chip: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    justifyContent: "center",
  },
  chipOn: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  chipText: { color: colors.inkMuted, fontWeight: "700", fontSize: 13 },
  chipTextOn: { color: colors.accent },
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
  labelRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  labelChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
  },
  labelChipText: { color: colors.accent, fontSize: 11, fontWeight: "700" },
});
