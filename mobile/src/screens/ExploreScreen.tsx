import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api";
import { Icon } from "../icons";
import { colors, font, radii, space } from "../theme";
import type { Category, ContentItem } from "../types";
import { Banner, EmptyState, LoadingState } from "../ui";
import type { MainTabParamList, RootStackParamList } from "../navigation";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Explore">,
  NativeStackScreenProps<RootStackParamList>
>;

const GAP = 1;
const COLS = 3;
const TILE_W = (Dimensions.get("window").width - GAP * (COLS - 1)) / COLS;
const TILE_H = TILE_W * 1.45;

function formatViews(contentId: string): string {
  let hash = 0;
  for (let i = 0; i < contentId.length; i += 1) hash = (hash * 31 + contentId.charCodeAt(i)) >>> 0;
  const value = 800 + (hash % 12_000_000);
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function tileTint(contentId: string): string {
  const tones = ["#C43670", "#A12E5C", "#8B2450", "#D45A88", "#6E1C40"];
  let hash = 0;
  for (let i = 0; i < contentId.length; i += 1) hash = (hash + contentId.charCodeAt(i)) % tones.length;
  return tones[hash];
}

export function ExploreScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [draftQuery, setDraftQuery] = useState("");
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
      setItems(content.items.filter((item) => item.contentType === "VIDEO"));
      setCategories(cats.items.filter((item) => item.slug !== "trending"));
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

  const chips = useMemo(
    () => [{ slug: "", name: "All" }, ...categories],
    [categories],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.search}>
          <Icon name="search" size={18} color={colors.inkMuted} />
          <TextInput
            value={draftQuery}
            onChangeText={setDraftQuery}
            placeholder="Search shorts"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={() => setQuery(draftQuery.trim())}
          />
        </View>

        <FlatList
          horizontal
          data={chips}
          keyExtractor={(item) => item.slug || "all"}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          renderItem={({ item }) => {
            const selected = category === item.slug;
            return (
              <Pressable
                style={[styles.chip, selected ? styles.chipOn : null]}
                onPress={() => setCategory(item.slug)}
              >
                <Text style={[styles.chipText, selected ? styles.chipTextOn : null]}>{item.name}</Text>
              </Pressable>
            );
          }}
        />
      </View>

      {error ? (
        <View style={styles.bannerWrap}>
          <Banner>{error}</Banner>
        </View>
      ) : null}
      {loading ? <LoadingState /> : null}

      {!loading && !items.length ? (
        <View style={styles.empty}>
          <EmptyState>{query || category ? "No shorts match." : "No published shorts yet."}</EmptyState>
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.contentId}
        numColumns={COLS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.tile, { backgroundColor: tileTint(item.contentId) }]}
            onPress={() => navigation.navigate("Watch", { contentId: item.contentId })}
          >
            <View style={styles.playMark}>
              <Icon name="play" size={18} color={colors.feedText} />
            </View>
            <Text style={styles.tileTitle} numberOfLines={2}>{item.title}</Text>
            <View style={styles.views}>
              <Icon name="eye" size={12} color={colors.feedText} />
              <Text style={styles.viewsText}>{formatViews(item.contentId)}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { gap: space.sm, paddingHorizontal: space.lg, paddingBottom: space.sm },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
  },
  input: { flex: 1, color: colors.ink, fontSize: 15, fontFamily: font.body, paddingVertical: 10 },
  chips: { gap: 8, paddingVertical: 4 },
  chip: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    justifyContent: "center",
  },
  chipOn: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  chipText: { color: colors.inkMuted, fontFamily: font.bold, fontWeight: "700", fontSize: 13 },
  chipTextOn: { color: colors.accent },
  bannerWrap: { paddingHorizontal: space.lg },
  grid: { paddingBottom: 24 },
  row: { gap: GAP, marginBottom: GAP },
  tile: {
    width: TILE_W,
    height: TILE_H,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 8,
  },
  playMark: {
    position: "absolute",
    top: "40%",
    alignSelf: "center",
    left: "50%",
    marginLeft: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  tileTitle: {
    color: colors.feedText,
    fontSize: 12,
    lineHeight: 15,
    fontFamily: font.bold,
    fontWeight: "700",
    marginBottom: 18,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  views: {
    position: "absolute",
    left: 6,
    bottom: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewsText: {
    color: colors.feedText,
    fontSize: 11,
    fontFamily: font.bold,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  empty: { paddingVertical: space.xxl, paddingHorizontal: space.lg },
});
