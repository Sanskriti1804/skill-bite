import { useCallback, useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useFocusEffect, type CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api";
import { BitePreviewCard } from "../components/BitePreviewCard";
import { StreakTracker } from "../components/StreakTracker";
import { useSession } from "../session";
import { colors, font, radii, space } from "../theme";
import type { ContentDetail, ContentItem, ProgressItem } from "../types";
import { Banner, EmptyState, LoadingState } from "../ui";
import type { MainTabParamList, RootStackParamList } from "../navigation";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Learning">,
  NativeStackScreenProps<RootStackParamList>
>;

type HistoryRow = {
  contentId: string;
  title: string;
  kind: "bite" | "course";
  completed: boolean;
  lastPositionSeconds?: number;
};

const GAP = 8;
const TILE_W = (Dimensions.get("window").width - space.lg * 2 - GAP) / 2;
const TILE_H = TILE_W * 1.3;
const TAB_CLEARANCE = 24;

export function LearningScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [savedCourses, setSavedCourses] = useState<Array<{ contentId: string; title: string; thumb: string | null }>>([]);
  const [savedBites, setSavedBites] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!session?.token) {
      setLoading(false);
      return;
    }
    setError("");
    try {
      const [progressResult, bookmarks, catalog] = await Promise.all([
        api<{ items: ProgressItem[] }>("/api/v1/me/progress", { token: session.token }),
        api<{ items: Array<{ contentId: string; contentType?: string; title?: string }> }>(
          "/api/v1/me/bookmarks",
          { token: session.token },
        ),
        api<{ items: ContentItem[] }>("/api/v1/content?sort=newest"),
      ]);
      setProgress(progressResult.items);

      const byId = new Map(catalog.items.map((item) => [item.contentId, item]));
      const historyRows: HistoryRow[] = [];
      for (const item of progressResult.items.slice(0, 20)) {
        const found = byId.get(item.videoContentId);
        let title = found?.title || item.videoContentId;
        if (!found) {
          try {
            const detail = await api<ContentDetail>(`/api/v1/content/${item.videoContentId}`, {
              token: session.token,
            });
            title = detail.title;
          } catch {
            /* keep id fallback */
          }
        }
        historyRows.push({
          contentId: item.videoContentId,
          title,
          kind: "bite",
          completed: Boolean(item.completedAt),
          lastPositionSeconds: item.lastPositionSeconds,
        });
      }
      setHistory(historyRows);

      const courses = bookmarks.items.filter((item) => item.contentType === "COURSE");
      const bites = bookmarks.items.filter((item) => item.contentType !== "COURSE");
      setSavedCourses(
        courses.map((item) => ({
          contentId: item.contentId,
          title: item.title || byId.get(item.contentId)?.title || "Course",
          thumb: byId.get(item.contentId)?.thumbnailUrl ?? null,
        })),
      );
      setSavedBites(
        bites
          .map((item) => byId.get(item.contentId))
          .filter((item): item is ContentItem => Boolean(item)),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load learning library");
    } finally {
      setLoading(false);
    }
  }, [session?.token]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    void load();
  }, [load]));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Text style={styles.heading}>Learning</Text>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: TAB_CLEARANCE }]}
        showsVerticalScrollIndicator={false}
      >
        {error ? <Banner>{error}</Banner> : null}
        {loading ? <LoadingState /> : null}

        <Text style={styles.section}>Learning history</Text>
        {!loading && !history.length ? (
          <EmptyState>No learning history yet. Watch a bite to get started.</EmptyState>
        ) : (
          <View style={styles.list}>
            {history.map((row) => (
              <Pressable
                key={row.contentId}
                style={styles.row}
                onPress={() => navigation.navigate("Watch", { contentId: row.contentId })}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.rowTitle} numberOfLines={2}>{row.title}</Text>
                  <Text style={styles.rowMeta}>
                    {row.completed ? "Completed" : `In progress · ${row.lastPositionSeconds ?? 0}s`}
                  </Text>
                </View>
                <Text style={styles.badge}>{row.kind === "course" ? "Course" : "Bite"}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Text style={styles.section}>Learning activity</Text>
        <StreakTracker progress={progress} />

        <Text style={styles.section}>Saved courses</Text>
        {!loading && !savedCourses.length ? (
          <EmptyState>No saved courses yet.</EmptyState>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
            {savedCourses.map((course) => (
              <Pressable
                key={course.contentId}
                style={styles.courseCard}
                onPress={() => navigation.navigate("Watch", { contentId: course.contentId })}
              >
                {course.thumb ? (
                  <Image source={{ uri: course.thumb }} style={styles.courseThumb} />
                ) : (
                  <View style={[styles.courseThumb, { backgroundColor: colors.videoBg }]} />
                )}
                <Text style={styles.rowTitle} numberOfLines={2}>{course.title}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <Text style={styles.section}>Saved bites</Text>
        {!loading && !savedBites.length ? (
          <EmptyState>No saved bites yet.</EmptyState>
        ) : (
          <View style={styles.grid}>
            {savedBites.map((item) => (
              <BitePreviewCard
                key={item.contentId}
                item={item}
                width={TILE_W}
                height={TILE_H}
                onPress={() => navigation.navigate("Watch", { contentId: item.contentId })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  heading: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    color: colors.ink,
    fontSize: 28,
    fontFamily: font.display,
  },
  scroll: { paddingHorizontal: space.lg, gap: space.xl },
  section: { color: colors.ink, fontSize: 18, fontFamily: font.bold, fontWeight: "700", marginBottom: -space.sm },
  list: { gap: space.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: space.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  rowTitle: { color: colors.ink, fontFamily: font.bold, fontWeight: "700", fontSize: 14 },
  rowMeta: { color: colors.inkMuted, fontFamily: font.medium, fontWeight: "600", fontSize: 12 },
  badge: {
    color: colors.accent,
    fontFamily: font.heavy,
    fontWeight: "800",
    fontSize: 11,
  },
  hRow: { gap: 12 },
  courseCard: {
    width: 160,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: space.sm,
    gap: 6,
  },
  courseThumb: { width: "100%", height: 90, borderRadius: radii.sm, backgroundColor: colors.videoBg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
});
