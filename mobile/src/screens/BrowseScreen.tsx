import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api";
import { ShortFeedCard, feedPageHeight } from "../components/ShortFeedCard";
import { Icon } from "../icons";
import { useSession } from "../session";
import { colors, radii, space } from "../theme";
import type { Category, ContentItem } from "../types";
import { Banner, EmptyState, LoadingState } from "../ui";
import type { MainTabParamList, RootStackParamList } from "../navigation";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Home">,
  NativeStackScreenProps<RootStackParamList>
>;

const TAB_BAR = 68;

export function BrowseScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState("");
  const lastSaved = useRef<Record<string, number>>({});
  const pageHeight = feedPageHeight(TAB_BAR + insets.bottom);

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
      if (session?.token) {
        const saved = await api<{ items: { contentId: string }[] }>("/api/v1/me/bookmarks", { token: session.token });
        setBookmarks(new Set(saved.items.map((item) => item.contentId)));
      } else {
        setBookmarks(new Set());
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Content could not be loaded");
    } finally {
      setLoading(false);
    }
  }, [category, query, session?.token]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) setActiveIndex(first.index);
  }).current;

  async function toggleBookmark(contentId: string) {
    if (!session?.token) {
      setToast("Sign in to save lessons.");
      return;
    }
    try {
      if (bookmarks.has(contentId)) {
        await api(`/api/v1/bookmarks/${contentId}`, { method: "DELETE", token: session.token });
        setBookmarks((current) => {
          const next = new Set(current);
          next.delete(contentId);
          return next;
        });
        setToast("Removed from saved lessons.");
      } else {
        await api("/api/v1/bookmarks", { method: "POST", token: session.token, body: { contentId } });
        setBookmarks((current) => new Set(current).add(contentId));
        setToast("Saved for later.");
      }
    } catch (caught) {
      setToast(caught instanceof Error ? caught.message : "Could not update bookmark");
    }
  }

  async function share(contentId: string) {
    await Clipboard.setStringAsync(`skillbite://watch/${contentId}`);
    setToast("Lesson link copied.");
  }

  async function saveProgress(contentId: string, seconds: number) {
    if (!session?.token) return;
    const position = Math.max(0, Math.floor(seconds));
    const previous = lastSaved.current[contentId] ?? -1;
    if (Math.abs(position - previous) < 8) return;
    try {
      await api(`/api/v1/videos/${contentId}/progress`, {
        method: "PUT",
        token: session.token,
        body: { lastPositionSeconds: position },
      });
      lastSaved.current[contentId] = position;
    } catch {
      // Quiet failure on feed; Watch screen shows persistent warning.
    }
  }

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + space.sm }]}>
        <View>
          <Text style={styles.kicker}>SkillBite</Text>
          <Text style={styles.brand}>SkillBite</Text>
        </View>
        <Pressable style={styles.searchBtn} onPress={() => setSearchOpen((value) => !value)}>
          <Icon name="search" size={22} color={colors.feedText} />
        </Pressable>
      </View>

      <View style={[styles.categoryWrap, { paddingTop: insets.top + 56 }]}>
        <FlatList
          horizontal
          data={[{ slug: "", name: "All" }, ...categories]}
          keyExtractor={(item) => item.slug || "all"}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: space.lg, paddingVertical: 8 }}
          renderItem={({ item }) => {
            const selected = category === item.slug;
            return (
              <Pressable
                onPress={() => setCategory(item.slug)}
                style={[styles.chip, selected ? styles.chipOn : null]}
              >
                <Text style={[styles.chipText, selected ? styles.chipTextOn : null]}>{item.name}</Text>
              </Pressable>
            );
          }}
        />
        {searchOpen ? (
          <View style={styles.searchPanelInline}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search shorts and playlists"
              placeholderTextColor={colors.feedMuted}
              style={styles.searchInput}
              autoCapitalize="none"
            />
          </View>
        ) : null}
      </View>

      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
      {error ? <View style={styles.errorWrap}><Banner>{error}</Banner></View> : null}
      {loading ? <LoadingState /> : null}

      {!loading && !items.length ? (
        <View style={styles.emptyWrap}>
          <Icon name="empty" size={40} color={colors.feedMuted} />
          <EmptyState>{query || category ? "Nothing in this category." : "No shorts yet. Upload from Create."}</EmptyState>
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.contentId}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={pageHeight}
        decelerationRate="fast"
        disableIntervalMomentum
        getItemLayout={(_, index) => ({ length: pageHeight, offset: pageHeight * index, index })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
        onMomentumScrollEnd={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
          const index = Math.round(event.nativeEvent.contentOffset.y / pageHeight);
          setActiveIndex(index);
        }}
        renderItem={({ item, index }) => (
          <ShortFeedCard
            item={item}
            height={pageHeight}
            active={index === activeIndex}
            bookmarked={bookmarks.has(item.contentId)}
            onOpen={() => navigation.navigate("Watch", { contentId: item.contentId })}
            onToggleBookmark={() => void toggleBookmark(item.contentId)}
            onShare={() => void share(item.contentId)}
            onProgress={item.contentType === "VIDEO" ? (seconds) => void saveProgress(item.contentId, seconds) : undefined}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.videoBg },
  topBar: {
    position: "absolute",
    zIndex: 2,
    left: 0,
    right: 0,
    paddingHorizontal: space.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kicker: { color: colors.feedMuted, fontSize: 12, fontWeight: "600" },
  brand: { color: colors.feedText, fontSize: 22, fontWeight: "800" },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  categoryWrap: {
    position: "absolute",
    zIndex: 2,
    left: 0,
    right: 0,
  },
  searchPanelInline: {
    marginHorizontal: space.lg,
    marginBottom: space.sm,
    backgroundColor: "rgba(14,13,12,0.88)",
    borderRadius: radii.md,
    padding: space.md,
  },
  searchInput: {
    minHeight: 44,
    borderRadius: radii.sm,
    paddingHorizontal: space.md,
    color: colors.feedText,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
  },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.feedMuted, fontWeight: "700", fontSize: 13 },
  chipTextOn: { color: colors.accentInk },
  toast: {
    position: "absolute",
    zIndex: 3,
    alignSelf: "center",
    top: 110,
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  toastText: {
    color: colors.accentInk,
    fontWeight: "700",
    fontSize: 13,
  },
  errorWrap: { position: "absolute", zIndex: 3, top: 120, left: 16, right: 16 },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
});
