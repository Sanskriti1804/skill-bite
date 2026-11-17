import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { upsertStudioDraft, updateStudioDraftStatus } from "../../creator/drafts";
import { pickShortVideo } from "../../creator/media";
import { Icon } from "../../icons";
import { contentApi, type OwnedContent } from "../../services/content";
import { useSession } from "../../session";
import { colors, font, radii, space } from "../../theme";
import { Banner, Button, Field, LoadingState, Screen, Title } from "../../ui";
import type { RootStackParamList } from "../../navigation";

type Props = NativeStackScreenProps<RootStackParamList, "CourseStudio">;

type Topic = {
  lessonId?: string;
  title: string;
  videoContentId: string;
  position: number;
};

type Chapter = {
  moduleId: string;
  title: string;
  position: number;
  topics: Topic[];
};

export function CourseStudioScreen({ navigation, route }: Props) {
  const { session, ensurePublisher } = useSession();
  const existingId = route.params.contentId;
  const [contentId, setContentId] = useState(existingId ?? "");
  const [seriesTitle, setSeriesTitle] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [topicDescription, setTopicDescription] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [ownedVideos, setOwnedVideos] = useState<OwnedContent[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!!existingId);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void ensurePublisher().catch((caught) => {
      setError(caught instanceof Error ? caught.message : "Could not open playlist editor");
      setLoading(false);
    });
  }, [ensurePublisher]);

  useEffect(() => {
    if (!session?.token || !existingId) return;
    contentApi.detail(existingId, session.token)
      .then(async (detail) => {
        setSeriesTitle(String(detail.title ?? ""));
        setContentId(existingId);
        const modules = (detail.modules as {
          moduleId: string;
          title: string;
          position: number;
          lessons: { lessonId?: string; title: string; position: number; videoContentId: string }[];
        }[] | undefined) ?? [];
        setChapters(modules.map((module) => ({
          moduleId: module.moduleId,
          title: module.title,
          position: module.position,
          topics: module.lessons.map((lesson) => ({
            lessonId: lesson.lessonId,
            title: lesson.title,
            position: lesson.position,
            videoContentId: lesson.videoContentId,
          })),
        })));
        if (modules[0]) setSelectedModuleId(modules[0].moduleId);
        await upsertStudioDraft(session.userId, {
          contentId: existingId,
          title: String(detail.title ?? existingId),
          status: String(detail.status ?? "DRAFT"),
          kind: "COURSE",
          updatedAt: new Date().toISOString(),
        });
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load playlist"))
      .finally(() => setLoading(false));
  }, [existingId, session?.token, session?.userId]);

  useEffect(() => {
    if (!existingId) setLoading(false);
  }, [existingId]);

  useEffect(() => {
    if (!session?.token) return;
    void contentApi.mine(session.token)
      .then((result) => {
        const used = new Set(
          chapters.flatMap((chapter) => chapter.topics.map((topic) => topic.videoContentId)),
        );
        setOwnedVideos(
          result.items.filter(
            (item) => item.contentType === "VIDEO" && item.status !== "REMOVED" && item.hasMedia && !used.has(item.contentId),
          ),
        );
      })
      .catch(() => setOwnedVideos([]));
  }, [chapters, session?.token]);

  async function run(work: () => Promise<void>) {
    if (!session?.token || !session.userId) return;
    setBusy(true);
    setError("");
    try {
      await ensurePublisher();
      await work();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  function confirmDeletePlaylist() {
    if (!contentId) return;
    Alert.alert(
      "Delete playlist?",
      "This permanently removes the playlist. Topic shorts stay in your library.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => void run(async () => {
            await contentApi.deleteCourse(session!.token, contentId);
            setMessage("Playlist deleted.");
            navigation.goBack();
          }),
        },
      ],
    );
  }

  if (!session) {
    return (
      <Screen>
        <Banner>Sign in to manage playlists.</Banner>
        <Button onPress={() => navigation.goBack()}>Back</Button>
      </Screen>
    );
  }

  if (loading) return <Screen><LoadingState /></Screen>;

  const selectedChapter = chapters.find((item) => item.moduleId === selectedModuleId);

  return (
    <Screen>
      <View style={styles.headerBar}>
        <Title>{contentId ? "Manage playlist" : "New playlist"}</Title>
        <Pressable style={styles.back} onPress={() => navigation.goBack()}>
          <Icon name="back" size={20} color={colors.ink} />
          <Text style={styles.backText}>Create</Text>
        </Pressable>
      </View>
      <Text style={styles.sub}>
        Add or remove shorts, or delete the whole playlist. Viewers can watch topics in any order.
      </Text>

      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 48 }}>
        <Field label="Playlist title" value={seriesTitle} onChangeText={setSeriesTitle} />
        <Button
          primary
          disabled={busy || !seriesTitle.trim()}
          onPress={() => void run(async () => {
            if (contentId) {
              await contentApi.updateCourse(session.token, contentId, seriesTitle);
              await upsertStudioDraft(session.userId, {
                contentId,
                title: seriesTitle,
                status: "DRAFT",
                kind: "COURSE",
                updatedAt: new Date().toISOString(),
              });
              setMessage("Playlist draft updated.");
              return;
            }
            const created = await contentApi.createCourse(session.token, seriesTitle);
            setContentId(created.contentId);
            await upsertStudioDraft(session.userId, {
              contentId: created.contentId,
              title: seriesTitle,
              status: "DRAFT",
              kind: "COURSE",
              updatedAt: new Date().toISOString(),
            });
            setMessage("Playlist draft created. Add sections next.");
          })}
        >
          {contentId ? "Save playlist title" : "Create playlist draft"}
        </Button>

        <Text style={styles.section}>Sections</Text>
        <Field label="Section name" value={chapterTitle} onChangeText={setChapterTitle} hint="Example: Getting started" />
        <Button
          disabled={busy || !contentId || !chapterTitle.trim()}
          onPress={() => void run(async () => {
            const position = chapters.length + 1;
            const created = await contentApi.addModule(session.token, contentId, chapterTitle.trim(), position);
            const next: Chapter = { moduleId: created.moduleId, title: chapterTitle.trim(), position, topics: [] };
            setChapters((current) => [...current, next]);
            setSelectedModuleId(created.moduleId);
            setChapterTitle("");
            setMessage(`Section ${position} added.`);
          })}
        >
          Add section
        </Button>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {chapters.map((chapter) => {
            const selected = chapter.moduleId === selectedModuleId;
            return (
              <Pressable key={chapter.moduleId} style={[styles.chip, selected ? styles.chipOn : null]} onPress={() => setSelectedModuleId(chapter.moduleId)}>
                <Text style={[styles.chipText, selected ? styles.chipTextOn : null]}>{chapter.position}. {chapter.title}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.section}>Videos in this section</Text>
        {!selectedChapter ? <Banner tone="info">Add or select a section first.</Banner> : null}
        {selectedChapter ? (
          <>
            <Field
              label="New short description"
              value={topicDescription}
              onChangeText={setTopicDescription}
              hint="Required for a new upload in this playlist."
            />
            <Pressable
              style={styles.upload}
              disabled={busy || !topicDescription.trim()}
              onPress={() => void run(async () => {
                const picked = await pickShortVideo();
                if (!picked) return;
                const video = await contentApi.createVideo(session.token, {
                  description: topicDescription.trim(),
                  sources: "Original creator material",
                  keywords: `${seriesTitle}, ${selectedChapter.title}`,
                  durationSeconds: picked.durationSeconds,
                });
                await contentApi.saveMedia(session.token, video.contentId, {
                  mimeType: picked.mimeType,
                  dataBase64: picked.dataBase64,
                  durationSeconds: picked.durationSeconds,
                });
                const position = selectedChapter.topics.length + 1;
                const lesson = await contentApi.addLesson(session.token, selectedChapter.moduleId, {
                  title: topicDescription.trim().slice(0, 80),
                  position,
                  videoContentId: video.contentId,
                });
                setChapters((current) => current.map((chapter) => (
                  chapter.moduleId === selectedChapter.moduleId
                    ? {
                        ...chapter,
                        topics: [
                          ...chapter.topics,
                          {
                            lessonId: lesson.lessonId,
                            title: topicDescription.trim().slice(0, 80),
                            position,
                            videoContentId: video.contentId,
                          },
                        ],
                      }
                    : chapter
                )));
                await upsertStudioDraft(session.userId, {
                  contentId: video.contentId,
                  title: topicDescription.trim().slice(0, 80),
                  status: "DRAFT",
                  kind: "VIDEO",
                  updatedAt: new Date().toISOString(),
                });
                setTopicDescription("");
                setMessage("Short uploaded and added to this section.");
              })}
            >
              <Icon name="video" size={22} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.uploadTitle}>Upload & add short</Text>
                <Text style={styles.uploadMeta}>Creates a new short and attaches it here.</Text>
              </View>
            </Pressable>

            {ownedVideos.length ? (
              <View style={styles.addExisting}>
                <Text style={styles.label}>Add existing short</Text>
                {ownedVideos.slice(0, 8).map((video) => (
                  <Pressable
                    key={video.contentId}
                    style={styles.existingRow}
                    disabled={busy}
                    onPress={() => void run(async () => {
                      const position = selectedChapter.topics.length + 1;
                      const lesson = await contentApi.addLesson(session.token, selectedChapter.moduleId, {
                        title: (video.description || video.title || "Video").slice(0, 80),
                        position,
                        videoContentId: video.contentId,
                      });
                      setChapters((current) => current.map((chapter) => (
                        chapter.moduleId === selectedChapter.moduleId
                          ? {
                              ...chapter,
                              topics: [
                                ...chapter.topics,
                                {
                                  lessonId: lesson.lessonId,
                                  title: (video.description || video.title || "Video").slice(0, 80),
                                  position,
                                  videoContentId: video.contentId,
                                },
                              ],
                            }
                          : chapter
                      )));
                      setMessage("Existing short added to this section.");
                    })}
                  >
                    <Text style={styles.existingText} numberOfLines={2}>
                      {video.description || video.title || "Untitled short"}
                    </Text>
                    <Text style={styles.addLink}>Add</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {selectedChapter.topics.map((topic) => (
              <View key={topic.videoContentId} style={styles.topicRow}>
                <Icon name="learn" size={18} color={colors.accent} />
                <Text style={styles.topicText}>{topic.position}. {topic.title}</Text>
                {topic.lessonId ? (
                  <Pressable
                    disabled={busy}
                    onPress={() => void run(async () => {
                      await contentApi.removeLesson(session.token, selectedChapter.moduleId, topic.lessonId!);
                      setChapters((current) => current.map((chapter) => (
                        chapter.moduleId === selectedChapter.moduleId
                          ? {
                              ...chapter,
                              topics: chapter.topics
                                .filter((row) => row.videoContentId !== topic.videoContentId)
                                .map((row, index) => ({ ...row, position: index + 1 })),
                            }
                          : chapter
                      )));
                      setMessage("Short removed from playlist.");
                    })}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </>
        ) : null}

        <Button
          primary
          disabled={busy || !contentId || !chapters.length}
          onPress={() => void run(async () => {
            for (const chapter of chapters) {
              for (const topic of chapter.topics) {
                await contentApi.publishVideo(session.token, topic.videoContentId);
                await updateStudioDraftStatus(session.userId, topic.videoContentId, "PUBLISHED");
              }
            }
            const result = await contentApi.publishCourse(session.token, contentId);
            await updateStudioDraftStatus(session.userId, contentId, result.status);
            setMessage("Playlist published.");
          })}
        >
          Publish playlist
        </Button>

        {contentId ? (
          <Pressable style={styles.deleteRow} disabled={busy} onPress={confirmDeletePlaylist}>
            <Icon name="logout" size={18} color={colors.danger} />
            <Text style={styles.deleteText}>Delete whole playlist</Text>
          </Pressable>
        ) : null}

        {message ? <Banner tone="info">{message}</Banner> : null}
        {error ? <Banner>{error}</Banner> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerBar: { minHeight: 44, justifyContent: "center" },
  back: { position: "absolute", left: 0, top: 0, bottom: 0, flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { color: colors.ink, fontFamily: font.bold, fontWeight: "700" },
  sub: { color: colors.inkMuted, fontSize: 13, lineHeight: 18, fontFamily: font.body, marginTop: -8 },
  section: { fontSize: 16, fontFamily: font.bold, fontWeight: "700", color: colors.ink },
  label: { fontSize: 14, fontFamily: font.medium, fontWeight: "600", color: colors.ink },
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
  chipText: { color: colors.inkMuted, fontFamily: font.bold, fontWeight: "700", fontSize: 13 },
  chipTextOn: { color: colors.accent },
  upload: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    padding: space.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  uploadTitle: { color: colors.ink, fontFamily: font.bold, fontWeight: "700" },
  uploadMeta: { color: colors.inkMuted, fontSize: 12, marginTop: 2 },
  addExisting: {
    gap: 8,
    padding: space.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  existingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  existingText: { flex: 1, color: colors.ink, fontFamily: font.medium, fontWeight: "600", fontSize: 13 },
  addLink: { color: colors.accent, fontFamily: font.heavy, fontWeight: "800", fontSize: 13 },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: radii.sm,
    backgroundColor: colors.accentSoft,
  },
  topicText: { color: colors.ink, fontFamily: font.medium, fontWeight: "600", flex: 1 },
  removeText: { color: colors.danger, fontFamily: font.heavy, fontWeight: "800", fontSize: 13 },
  deleteRow: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  deleteText: { color: colors.danger, fontFamily: font.bold, fontWeight: "700", fontSize: 15 },
});
