import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  FlatList,
  StyleSheet,
  Text,
  View,
  type AppStateStatus,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ListViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useIsFocused, type CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api";
import { AppLogo } from "../components/AppLogo";
import { ShortFeedCard, feedPageHeight } from "../components/ShortFeedCard";
import { openCommentSheet } from "../creator/commentSheetController";
import { promptSaveToPlaylist } from "../creator/saveToPlaylist";
import { Icon } from "../icons";
import { useSession } from "../session";
import { colors, font, radii, space } from "../theme";
import type { ContentItem } from "../types";
import { Banner, EmptyState, LoadingState } from "../ui";
import type { MainTabParamList, RootStackParamList } from "../navigation";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Bites">,
  NativeStackScreenProps<RootStackParamList>
>;

export function BrowseScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const isFocused = useIsFocused();
  const [appActive, setAppActive] = useState(AppState.currentState === "active");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [pageHeight, setPageHeight] = useState(() => feedPageHeight(70));
  const lastSaved = useRef<Record<string, number>>({});
  const feedLive = isFocused && appActive;

  useEffect(() => {
    const onChange = (next: AppStateStatus) => setAppActive(next === "active");
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, []);

  const load = useCallback(async () => {
    setError("");
    try {
      const [content, saved] = await Promise.all([
        api<{ items: ContentItem[] }>("/api/v1/content?sort=random"),
        session?.token
          ? api<{ items: { contentId: string }[] }>("/api/v1/me/bookmarks", { token: session.token })
          : Promise.resolve({ items: [] as { contentId: string }[] }),
      ]);
      setItems(content.items.filter((item) => item.contentType === "VIDEO"));
      setBookmarks(new Set(saved.items.map((item) => item.contentId)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Content could not be loaded");
    } finally {
      setLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ListViewToken[] }) => {
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
        return;
      }
      await promptSaveToPlaylist({
        token: session.token,
        videoContentId: contentId,
        onBookmarked: async () => {
          await api("/api/v1/bookmarks", { method: "POST", token: session.token, body: { contentId } });
          setBookmarks((current) => new Set(current).add(contentId));
        },
        onMessage: setToast,
        onError: setToast,
      });
    } catch (caught) {
      setToast(caught instanceof Error ? caught.message : "Could not update bookmark");
    }
  }

  async function share(contentId: string) {
    await Clipboard.setStringAsync(`skillbite://watch/${contentId}`);
    setToast("Lesson link copied.");
  }

  function openComments(contentId: string) {
    if (!session?.token) {
      setToast("Sign in to comment.");
      return;
    }
    openCommentSheet({
      token: session.token,
      contentId,
      currentUserId: session.userId,
      onCountChange: (count) => {
        setItems((current) =>
          current.map((item) =>
            item.contentId === contentId ? { ...item, commentCount: count } : item,
          ),
        );
      },
      onError: setToast,
    });
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
      // Quiet failure on feed.
    }
  }

  return (
    <View
      style={styles.root}
      onLayout={(event) => {
        const next = Math.round(event.nativeEvent.layout.height);
        if (next > 0 && next !== pageHeight) setPageHeight(next);
      }}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + space.sm }]} pointerEvents="box-none">
        <View style={styles.brandRow}>
          <AppLogo size={40} />
          <Text style={styles.brand}>SkillBite</Text>
        </View>
      </View>

      {toast ? (
        <View style={[styles.toast, { top: insets.top + 64 }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
      {error ? (
        <View style={[styles.errorWrap, { top: insets.top + 72 }]}>
          <Banner>{error}</Banner>
        </View>
      ) : null}
      {loading ? <LoadingState /> : null}

      {!loading && !items.length ? (
        <View style={styles.emptyWrap}>
          <Icon name="empty" size={40} color={colors.feedMuted} />
          <EmptyState>No bites yet. Upload from Profile → Create.</EmptyState>
        </View>
      ) : null}

      <FlatList
        data={items}
        key={`feed-${pageHeight}`}
        keyExtractor={(item) => item.contentId}
        style={styles.list}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={pageHeight}
        snapToAlignment="start"
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
            active={feedLive && index === activeIndex}
            bookmarked={bookmarks.has(item.contentId)}
            commentCount={item.commentCount ?? 0}
            onOpen={() => navigation.navigate("Watch", { contentId: item.contentId })}
            onToggleBookmark={() => void toggleBookmark(item.contentId)}
            onShare={() => void share(item.contentId)}
            onComment={() => openComments(item.contentId)}
            onProgress={(seconds) => void saveProgress(item.contentId, seconds)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.videoBg },
  list: { flex: 1 },
  topBar: {
    position: "absolute",
    zIndex: 2,
    left: 0,
    right: 0,
    paddingHorizontal: space.lg,
    alignItems: "center",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  brand: { color: colors.feedText, fontSize: 22, fontFamily: font.display },
  toast: {
    position: "absolute",
    zIndex: 3,
    alignSelf: "center",
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  toastText: {
    color: colors.accentInk,
    fontFamily: font.bold,
    fontWeight: "700",
    fontSize: 13,
  },
  errorWrap: { position: "absolute", zIndex: 3, left: 16, right: 16 },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
});
