import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
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
import { loadCategoryCovers } from "../learning/categoryCovers";
import { colors, font, radii, space } from "../theme";
import type { Category, ContentItem } from "../types";
import { Banner, EmptyState, LoadingState } from "../ui";
import type { MainTabParamList, RootStackParamList } from "../navigation";

type TrendingCourse = {
  contentId: string;
  title: string;
  creator: string;
  learners: number;
  thumbnailUrl: string | null;
  seeded?: boolean;
};

const SEED_TRENDING: TrendingCourse[] = [
  {
    contentId: "seed-trend-finance",
    title: "Basic Financial Literacy",
    creator: "SkillBite Studio",
    learners: 1250,
    thumbnailUrl: null,
    seeded: true,
  },
  {
    contentId: "seed-trend-career",
    title: "Career Confidence Basics",
    creator: "SkillBite Studio",
    learners: 980,
    thumbnailUrl: null,
    seeded: true,
  },
];

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Explore">,
  NativeStackScreenProps<RootStackParamList>
>;

const GAP = 0;
const COLS = 3;
const TILE_W = Dimensions.get("window").width / COLS;
const TILE_H = TILE_W * 1.45;

function formatViews(contentId: string): string {
  let hash = 0;
  for (let i = 0; i < contentId.length; i += 1) hash = (hash * 31 + contentId.charCodeAt(i)) >>> 0;
  const value = 800 + (hash % 12_000_000);
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function ExploreTile({
  item,
  onPress,
}: {
  item: ContentItem;
  onPress: () => void;
}) {
  const [thumbFailed, setThumbFailed] = useState(false);
  const previewUri = item.thumbnailUrl?.trim() || "";
  const showPreview = Boolean(previewUri) && !thumbFailed;

  return (
    <Pressable
      style={styles.tile}
      onPress={onPress}
      android_ripple={{ color: "rgba(255,255,255,0.12)" }}
    >
      {showPreview ? (
        <Image
          source={{ uri: previewUri }}
          style={styles.preview}
          resizeMode="cover"
          onError={() => setThumbFailed(true)}
        />
      ) : null}
      <View style={styles.scrim} pointerEvents="none" />
      <View style={styles.playMark} pointerEvents="none">
        <Icon name="play" size={18} color={colors.feedText} />
      </View>
      {item.title ? (
        <Text style={styles.tileTitle} numberOfLines={2}>{item.title}</Text>
      ) : null}
      <View style={styles.views} pointerEvents="none">
        <Icon name="eye" size={12} color={colors.feedText} />
        <Text style={styles.viewsText}>{formatViews(item.contentId)}</Text>
      </View>
    </Pressable>
  );
}

export function ExploreScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [draftQuery, setDraftQuery] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [covers, setCovers] = useState<Record<string, string | null>>({});
  const [trending, setTrending] = useState<TrendingCourse[]>(SEED_TRENDING);
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
      const videos = content.items.filter((item) => item.contentType === "VIDEO");
      setItems(videos);
      const nextCats = cats.items.filter((item) => item.slug !== "trending");
      setCategories(nextCats);
      const coverMap = await loadCategoryCovers(nextCats.map((item) => item.slug));
      setCovers(coverMap);

      const courseRows = content.items.filter((item) => item.contentType === "COURSE");
      if (courseRows.length) {
        setTrending(
          courseRows.slice(0, 4).map((item, index) => ({
            contentId: item.contentId,
            title: item.title,
            creator: item.categories?.[0]?.name || "Creator",
            learners: 800 + ((item.contentId.charCodeAt(0) || 1) * (index + 3) * 17) % 4000,
            thumbnailUrl: item.thumbnailUrl ?? null,
          })),
        );
      } else {
        setTrending(
          SEED_TRENDING.map((seed, index) => ({
            ...seed,
            thumbnailUrl: videos[index]?.thumbnailUrl ?? null,
          })),
        );
      }
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

  const listHeader = (
    <View>
      <View style={styles.header}>
        <View style={styles.search}>
          <Icon name="search" size={18} color={colors.inkMuted} />
          <TextInput
            value={draftQuery}
            onChangeText={setDraftQuery}
            placeholder="Search bites"
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
          contentContainerStyle={styles.catRow}
          renderItem={({ item }) => {
            const selected = category === item.slug;
            const cover = item.slug ? covers[item.slug] : null;
            return (
              <Pressable
                style={[styles.catItem, selected ? styles.catItemOn : null]}
                onPress={() => setCategory(item.slug)}
              >
                <View style={[styles.catImageWrap, selected ? styles.catImageOn : null]}>
                  {cover ? (
                    <Image source={{ uri: cover }} style={styles.catImage} />
                  ) : (
                    <View style={[styles.catImage, styles.catImageFallback]}>
                      <Icon name={item.slug ? "explore" : "grid"} size={18} color={colors.accent} />
                    </View>
                  )}
                </View>
                <Text style={[styles.catLabel, selected ? styles.catLabelOn : null]} numberOfLines={1}>
                  {item.name}
                </Text>
              </Pressable>
            );
          }}
        />

        <Text style={styles.trendTitle}>Trending Today</Text>
        <FlatList
          horizontal
          data={trending}
          keyExtractor={(item) => item.contentId}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trendRow}
          renderItem={({ item }) => (
            <Pressable
              style={styles.trendCard}
              onPress={() => {
                if (item.seeded) return;
                navigation.navigate("Watch", { contentId: item.contentId });
              }}
            >
              {item.thumbnailUrl ? (
                <Image source={{ uri: item.thumbnailUrl }} style={styles.trendThumb} />
              ) : (
                <View style={[styles.trendThumb, styles.catImageFallback]} />
              )}
              <Text style={styles.trendBadge}>Trending</Text>
              <Text style={styles.trendName} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.trendMeta}>{item.creator}</Text>
              <Text style={styles.trendMeta}>{item.learners.toLocaleString()} learners</Text>
            </Pressable>
          )}
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
          <EmptyState>{query || category ? "No bites match." : "No published bites yet."}</EmptyState>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.contentId}
        numColumns={COLS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        initialNumToRender={12}
        windowSize={7}
        removeClippedSubviews
        renderItem={({ item }) => (
          <ExploreTile
            item={item}
            onPress={() => navigation.navigate("Watch", { contentId: item.contentId })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { gap: space.lg, paddingHorizontal: space.lg, paddingBottom: space.lg, backgroundColor: colors.bg },
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
  catRow: { gap: 12, paddingVertical: 4 },
  catItem: { width: 72, alignItems: "center", gap: 6 },
  catItemOn: {},
  catImageWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.line,
    overflow: "hidden",
  },
  catImageOn: { borderColor: colors.accent },
  catImage: { width: "100%", height: "100%" },
  catImageFallback: {
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  catLabel: {
    color: colors.inkMuted,
    fontFamily: font.bold,
    fontWeight: "700",
    fontSize: 11,
    textAlign: "center",
  },
  catLabelOn: { color: colors.accent },
  trendTitle: {
    color: colors.ink,
    fontFamily: font.bold,
    fontWeight: "700",
    fontSize: 18,
    marginTop: 4,
  },
  trendRow: { gap: space.md, paddingVertical: space.xs },
  trendCard: {
    width: 180,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: space.sm,
    gap: space.xs,
  },
  trendThumb: {
    width: "100%",
    height: 96,
    borderRadius: radii.sm,
    backgroundColor: colors.videoBg,
    marginBottom: space.xs,
  },
  trendBadge: {
    alignSelf: "flex-start",
    color: colors.accent,
    fontFamily: font.heavy,
    fontWeight: "800",
    fontSize: 11,
  },
  trendName: { color: colors.ink, fontFamily: font.bold, fontWeight: "700", fontSize: 14 },
  trendMeta: { color: colors.inkMuted, fontFamily: font.medium, fontWeight: "600", fontSize: 12 },
  bannerWrap: { paddingHorizontal: space.lg },
  grid: { paddingBottom: 24, backgroundColor: colors.videoBg },
  row: { gap: GAP, marginBottom: GAP },
  tile: {
    width: TILE_W,
    height: TILE_H,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 8,
    backgroundColor: colors.videoBg,
    borderWidth: 0,
  },
  preview: {
    position: "absolute",
    top: 0,
    left: 0,
    width: TILE_W + 1,
    height: TILE_H + 1,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.22)",
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
    zIndex: 1,
  },
  views: {
    position: "absolute",
    left: 6,
    bottom: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    zIndex: 1,
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
