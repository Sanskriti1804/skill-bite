import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type AppStateStatus,
} from "react-native";
import { useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import * as Clipboard from "expo-clipboard";
import { useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api, mediaUrl } from "../api";
import { IconButton } from "../components/IconButton";
import { openCommentSheet } from "../creator/commentSheetController";
import { promptSaveToPlaylist } from "../creator/saveToPlaylist";
import { Icon } from "../icons";
import { useSession } from "../session";
import { colors, font, radii, space } from "../theme";
import type { ContentDetail, ProgressItem } from "../types";
import { Banner, EmptyState, LoadingState } from "../ui";
import type { RootStackParamList } from "../navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Watch">;

export function WatchScreen({ route, navigation }: Props) {
  const { contentId } = route.params;
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const isFocused = useIsFocused();
  const [appActive, setAppActive] = useState(AppState.currentState === "active");
  const lastSavedRef = useRef(-1);
  const resumeApplied = useRef(false);
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [activeVideoId, setActiveVideoId] = useState("");
  const [resumeSeconds, setResumeSeconds] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [courseProgress, setCourseProgress] = useState("");
  const [paused, setPaused] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const player = useVideoPlayer(activeVideoId ? mediaUrl(activeVideoId, "full") : null, (instance) => {
    instance.timeUpdateEventInterval = 2;
  });
  const canPlay = isFocused && appActive && !paused;

  useEffect(() => {
    const onChange = (next: AppStateStatus) => setAppActive(next === "active");
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    setLoading(true);
    api<ContentDetail>(`/api/v1/content/${contentId}`, { token: session?.token })
      .then((detail) => {
        setContent(detail);
        if (detail.contentType === "VIDEO") setActiveVideoId(contentId);
        else {
          setActiveVideoId(detail.modules?.flatMap((module) => module.lessons)[0]?.videoContentId ?? "");
          setOutlineOpen(true);
        }
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unavailable"))
      .finally(() => setLoading(false));
  }, [contentId, session?.token]);

  useEffect(() => {
    if (!session?.token || !activeVideoId) return;
    api<{ items: ProgressItem[] }>("/api/v1/me/progress", { token: session.token })
      .then((result) => {
        const row = result.items.find((item) => item.videoContentId === activeVideoId);
        setResumeSeconds(row?.lastPositionSeconds ?? 0);
        lastSavedRef.current = row?.lastPositionSeconds ?? -1;
      })
      .catch(() => undefined);
  }, [activeVideoId, session?.token]);

  useEffect(() => {
    if (!session?.token) {
      setBookmarked(false);
      return;
    }
    api<{ items: { contentId: string }[] }>("/api/v1/me/bookmarks", { token: session.token })
      .then((result) => setBookmarked(result.items.some((item) => item.contentId === contentId)))
      .catch(() => setBookmarked(false));
  }, [contentId, session?.token]);

  useEffect(() => {
    if (!session?.token || !content || content.contentType !== "COURSE") return;
    api<{ totalDurationSeconds: number; completedDurationSeconds: number }>(`/api/v1/courses/${contentId}/progress`, {
      token: session.token,
    })
      .then((result) => setCourseProgress(`${result.completedDurationSeconds} of ${result.totalDurationSeconds}s completed`))
      .catch(() => setCourseProgress(""));
  }, [content, contentId, session?.token]);

  const saveProgress = useCallback(async (seconds: number, force = false) => {
    if (!session?.token || !activeVideoId) return;
    const position = Math.max(0, Math.floor(seconds));
    if (!force && Math.abs(position - lastSavedRef.current) < 5) return;
    try {
      const result = await api<{ lastPositionSeconds: number }>(`/api/v1/videos/${activeVideoId}/progress`, {
        method: "PUT",
        token: session.token,
        body: { lastPositionSeconds: position },
      });
      lastSavedRef.current = result.lastPositionSeconds;
      setResumeSeconds(result.lastPositionSeconds);
      setSaveError("");
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "Progress could not be saved");
    }
  }, [activeVideoId, session?.token]);

  useEffect(() => {
    player.loop = content?.contentType === "VIDEO";
    if (canPlay) player.play();
    else player.pause();
  }, [canPlay, content?.contentType, player]);

  useEffect(() => {
    resumeApplied.current = false;
  }, [activeVideoId]);

  useEffect(() => {
    if (!activeVideoId || resumeApplied.current || resumeSeconds <= 0) return;
    player.currentTime = resumeSeconds;
    resumeApplied.current = true;
  }, [activeVideoId, player, resumeSeconds]);

  useEventListener(player, "timeUpdate", ({ currentTime }) => {
    void saveProgress(currentTime);
  });

  useEventListener(player, "playToEnd", () => {
    void saveProgress(player.duration || resumeSeconds, true);
  });

  async function toggleBookmark() {
    if (!session?.token) return;
    try {
      if (bookmarked) {
        await api(`/api/v1/bookmarks/${contentId}`, { method: "DELETE", token: session.token });
        setBookmarked(false);
        setMessage("Removed from watching list.");
        return;
      }
      await promptSaveToPlaylist({
        token: session.token,
        videoContentId: contentId,
        contentType: content?.contentType,
        onBookmarked: async () => {
          await api("/api/v1/bookmarks", { method: "POST", token: session.token, body: { contentId } });
          setBookmarked(true);
        },
        onMessage: setMessage,
        onError: setMessage,
      });
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Bookmark failed");
    }
  }

  if (loading) {
    return <View style={styles.root}><LoadingState /></View>;
  }
  if (error || !content) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top }]}>
        <Banner>{error || "Unavailable"}</Banner>
        <Pressable style={styles.backChip} onPress={() => navigation.goBack()}>
          <Icon name="back" size={20} color={colors.feedText} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {activeVideoId ? (
        <VideoView
          style={StyleSheet.absoluteFill}
          player={player}
          contentFit="cover"
          nativeControls={false}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.centered]}>
          <EmptyState>This content is unavailable.</EmptyState>
        </View>
      )}

      <Pressable style={StyleSheet.absoluteFill} onPress={() => setPaused((value) => !value)} />

      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backChip} onPress={() => navigation.goBack()}>
          <Icon name="back" size={20} color={colors.feedText} />
        </Pressable>
        <Text style={styles.topMeta}>Resume {resumeSeconds}s · not completion</Text>
      </View>

      {paused ? (
        <View style={styles.pauseBadge} pointerEvents="none">
          <Icon name="play" size={40} color={colors.feedText} />
        </View>
      ) : null}

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.copy}>
          <Text style={styles.title}>{content.title}</Text>
          {content.description ? <Text style={styles.desc} numberOfLines={3}>{content.description}</Text> : null}
          {courseProgress ? <Text style={styles.desc}>{courseProgress}</Text> : null}
          {saveError ? <Banner tone="warning">Progress save failed: {saveError}</Banner> : null}
          {message ? <Text style={styles.desc}>{message}</Text> : null}
          {content.contentType === "COURSE" ? (
            <Pressable style={styles.outlineBtn} onPress={() => setOutlineOpen((value) => !value)}>
              <Icon name="course" size={16} color={colors.accentInk} />
              <Text style={styles.outlineBtnText}>{outlineOpen ? "Hide outline" : "Lesson outline"}</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.rail}>
          <IconButton
            icon="comment"
            label="Comment"
            tone="light"
            onPress={() => {
              if (!session?.token) {
                setMessage("Sign in to comment.");
                return;
              }
              openCommentSheet({
                token: session.token,
                contentId,
                currentUserId: session.userId,
                onError: setMessage,
              });
            }}
          />
          <IconButton
            icon={bookmarked ? "bookmarkActive" : "bookmark"}
            label="Save"
            tone="light"
            active={bookmarked}
            onPress={() => void toggleBookmark()}
          />
          <IconButton
            icon="share"
            label="Share"
            tone="light"
            onPress={() => void Clipboard.setStringAsync(`skillbite://watch/${contentId}`).then(() => setMessage("Link copied."))}
          />
        </View>
      </View>

      {outlineOpen && content.modules ? (
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.sheetTitle}>Lessons</Text>
          <ScrollView style={{ maxHeight: 260 }} contentContainerStyle={{ gap: 8 }}>
            {content.modules.map((module) => (
              <View key={module.title} style={{ gap: 8 }}>
                <Text style={styles.module}>{module.title}</Text>
                {module.lessons.map((lesson) => (
                  <Pressable
                    key={lesson.videoContentId}
                    style={[styles.lesson, lesson.videoContentId === activeVideoId ? styles.lessonOn : null]}
                    onPress={() => {
                      void (async () => {
                        await saveProgress(player.currentTime, true);
                        setActiveVideoId(lesson.videoContentId);
                        setPaused(false);
                      })();
                    }}
                  >
                    <Text style={styles.lessonText}>{lesson.position}. {lesson.title}</Text>
                  </Pressable>
                ))}
              </View>
            ))}
            {content.attachments?.map((item) => (
              <Pressable
                key={item.reference}
                style={styles.lesson}
                onPress={() => {
                  if (item.kind === "HYPERLINK") void Linking.openURL(item.reference);
                }}
              >
                <Icon name="attachment" size={16} color={colors.ink} />
                <Text style={styles.lessonText}>{item.kind}: {item.reference}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.videoBg },
  centered: { alignItems: "center", justifyContent: "center", gap: 16, padding: 24 },
  top: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  backText: { color: colors.feedText, fontFamily: font.bold, fontWeight: "700" },
  topMeta: { color: colors.feedMuted, fontSize: 12, fontFamily: font.medium, fontWeight: "600" },
  pauseBadge: {
    position: "absolute",
    alignSelf: "center",
    top: "42%",
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: space.lg,
    gap: space.md,
  },
  copy: { flex: 1, gap: 8 },
  badge: {
    alignSelf: "flex-start",
    color: colors.accentInk,
    backgroundColor: colors.accent,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    fontSize: 12,
    fontFamily: font.bold, fontWeight: "700",
  },
  title: { color: colors.feedText, fontSize: 24, lineHeight: 32, fontFamily: font.display },
  desc: { color: colors.feedMuted, fontSize: 13, lineHeight: 18, fontFamily: font.body },
  outlineBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.pill,
    marginTop: 4,
  },
  outlineBtnText: { color: colors.accentInk, fontFamily: font.bold, fontWeight: "700", fontSize: 13 },
  rail: { gap: 16, paddingBottom: 4 },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    gap: space.md,
    maxHeight: "48%",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  sheetTitle: { fontSize: 20, fontFamily: font.display, color: colors.ink },
  module: { fontSize: 14, fontFamily: font.bold, fontWeight: "700", color: colors.inkMuted },
  lesson: {
    minHeight: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  lessonOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  lessonText: { color: colors.ink, fontFamily: font.medium, fontWeight: "600", flex: 1 },
});
