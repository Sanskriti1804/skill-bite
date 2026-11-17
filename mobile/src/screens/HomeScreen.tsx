import { useCallback, useEffect, useMemo, useState } from "react";
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
import { AppLogo } from "../components/AppLogo";
import { BitePreviewCard } from "../components/BitePreviewCard";
import { StreakTracker } from "../components/StreakTracker";
import { loadInterestIds } from "../interestsStore";
import { interestKeysToApiSlugs } from "../learning/onboardingInterests";
import { useSession } from "../session";
import { colors, font, radii, space } from "../theme";
import type { ContentDetail, ContentItem, ProgressItem } from "../types";
import { Banner, EmptyState, LoadingState } from "../ui";
import type { MainTabParamList, RootStackParamList } from "../navigation";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Home">,
  NativeStackScreenProps<RootStackParamList>
>;

type ContinueCourse = {
  contentId: string;
  title: string;
  creator: string;
  thumbnailUrl: string | null;
  completed: number;
  total: number;
  seeded?: boolean;
};

const GAP = 8;
const CARD_W = (Dimensions.get("window").width - space.lg * 2 - GAP) / 2;
const CARD_H = CARD_W * 1.35;
const TAB_CLEARANCE = 24;

const SEED_COURSES: ContinueCourse[] = [
  {
    contentId: "seed-finance",
    title: "Basic Financial Literacy",
    creator: "SkillBite Studio",
    thumbnailUrl: null,
    completed: 4,
    total: 9,
    seeded: true,
  },
  {
    contentId: "seed-comms",
    title: "Everyday Communication",
    creator: "SkillBite Studio",
    thumbnailUrl: null,
    completed: 2,
    total: 6,
    seeded: true,
  },
];

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { session, profile, refreshProfile } = useSession();
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [recommended, setRecommended] = useState<ContentItem[]>([]);
  const [courses, setCourses] = useState<ContinueCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const greetingName = profile?.displayName?.split(" ")[0] || profile?.username || "there";

  const load = useCallback(async () => {
    if (!session?.token) {
      setLoading(false);
      return;
    }
    setError("");
    try {
      await refreshProfile();
      const [progressResult, contentResult, bookmarks] = await Promise.all([
        api<{ items: ProgressItem[] }>("/api/v1/me/progress", { token: session.token }),
        api<{ items: ContentItem[] }>("/api/v1/content?sort=newest"),
        api<{ items: Array<{ contentId: string; contentType?: string; title?: string }> }>(
          "/api/v1/me/bookmarks",
          { token: session.token },
        ),
      ]);
      setProgress(progressResult.items);

      const interestIds = await loadInterestIds(session.userId);
      let bites = contentResult.items.filter((item) => item.contentType === "VIDEO");
      if (interestIds?.length) {
        const apiSlugs = interestKeysToApiSlugs(interestIds);
        const preferred = bites.filter((item) =>
          item.categories?.some((cat) => apiSlugs.includes(cat.slug) || interestIds.includes(cat.slug)),
        );
        if (preferred.length) bites = preferred;
      }
      setRecommended(bites.slice(0, 4));

      const courseBookmarks = bookmarks.items.filter((item) => item.contentType === "COURSE");
      const continueItems: ContinueCourse[] = [];
      for (const row of courseBookmarks.slice(0, 6)) {
        try {
          const detail = await api<ContentDetail>(`/api/v1/content/${row.contentId}`, {
            token: session.token,
          });
          const lessons = detail.modules?.flatMap((module) => module.lessons) ?? [];
          const total = lessons.length;
          const done = lessons.filter((lesson) =>
            progressResult.items.some(
              (item) => item.videoContentId === lesson.videoContentId && item.completedAt,
            ),
          ).length;
          const firstVideo = lessons[0]?.videoContentId;
          const thumb = firstVideo
            ? contentResult.items.find((item) => item.contentId === firstVideo)?.thumbnailUrl ?? null
            : null;
          continueItems.push({
            contentId: row.contentId,
            title: detail.title || row.title || "Course",
            creator: "You",
            thumbnailUrl: thumb,
            completed: done,
            total: Math.max(total, 1),
          });
        } catch {
          /* skip broken bookmark */
        }
      }
      setCourses(continueItems.length ? continueItems : SEED_COURSES);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load home");
      setCourses(SEED_COURSES);
    } finally {
      setLoading(false);
    }
  }, [refreshProfile, session?.token, session?.userId]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    void load();
  }, [load]));

  const avatarLetter = useMemo(
    () => (greetingName || "S").slice(0, 1).toUpperCase(),
    [greetingName],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <AppLogo size={36} />
          <Text style={styles.brand}>SkillBite</Text>
        </View>
        <Pressable style={styles.avatar} onPress={() => navigation.navigate("Profile")}>
          <Text style={styles.avatarLetter}>{avatarLetter}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: TAB_CLEARANCE }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.greeting}>Hey, {greetingName}!</Text>

        {error ? <Banner>{error}</Banner> : null}
        {loading ? <LoadingState /> : null}

        <StreakTracker progress={progress} />

        <Text style={styles.section}>Continue learning</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
          {courses.map((course) => {
            const left = Math.max(0, course.total - course.completed);
            const pct = Math.round((course.completed / Math.max(course.total, 1)) * 100);
            return (
              <Pressable
                key={course.contentId}
                style={styles.courseCard}
                onPress={() => {
                  if (course.seeded) return;
                  navigation.navigate("Watch", { contentId: course.contentId });
                }}
              >
                {course.thumbnailUrl ? (
                  <Image source={{ uri: course.thumbnailUrl }} style={styles.courseThumb} />
                ) : (
                  <View style={[styles.courseThumb, styles.courseThumbFallback]} />
                )}
                <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
                <Text style={styles.courseMeta}>{course.creator}</Text>
                <Text style={styles.courseMeta}>
                  {course.completed} of {course.total} videos completed
                </Text>
                <Text style={styles.courseMeta}>{left} videos left</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${pct}%` }]} />
                </View>
                {course.seeded ? <Text style={styles.seedTag}>Demo</Text> : null}
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.section}>Recommended for You</Text>
        {!loading && !recommended.length ? (
          <EmptyState>No bites to recommend yet.</EmptyState>
        ) : (
          <View style={styles.grid}>
            {recommended.map((item) => (
              <BitePreviewCard
                key={item.contentId}
                item={item}
                width={CARD_W}
                height={CARD_H}
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  brand: { color: colors.ink, fontFamily: font.display, fontSize: 22 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { color: colors.accentInk, fontFamily: font.heavy, fontWeight: "800", fontSize: 16 },
  scroll: { paddingHorizontal: space.lg, gap: space.xl },
  greeting: {
    color: colors.ink,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: font.display,
  },
  section: {
    color: colors.ink,
    fontSize: 18,
    fontFamily: font.bold,
    fontWeight: "700",
    marginBottom: -space.sm,
  },
  hRow: { gap: space.md, paddingRight: space.lg },
  courseCard: {
    width: 220,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: space.md,
    gap: space.xs,
  },
  courseThumb: {
    width: "100%",
    height: 110,
    borderRadius: radii.md,
    marginBottom: space.sm,
    backgroundColor: colors.videoBg,
  },
  courseThumbFallback: { backgroundColor: colors.videoBg },
  courseTitle: { color: colors.ink, fontFamily: font.bold, fontWeight: "700", fontSize: 15 },
  courseMeta: { color: colors.inkMuted, fontFamily: font.medium, fontWeight: "600", fontSize: 12 },
  progressTrack: {
    marginTop: 8,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.accent },
  seedTag: {
    marginTop: 6,
    alignSelf: "flex-start",
    color: colors.accent,
    fontFamily: font.bold,
    fontWeight: "700",
    fontSize: 11,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
});
