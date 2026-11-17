import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { upsertStudioDraft, updateStudioDraftStatus } from "../../creator/drafts";
import { pickShortVideo } from "../../creator/media";
import { api } from "../../api";
import { Icon } from "../../icons";
import { contentApi, type OwnedContent } from "../../services/content";
import { useSession } from "../../session";
import { colors, font, radii, space } from "../../theme";
import type { ContentItem } from "../../types";
import { ActionSheet, Banner, Button, Field, LoadingState, Screen, Title } from "../../ui";
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
  const [status, setStatus] = useState("DRAFT");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [catalog, setCatalog] = useState<Array<{ contentId: string; label: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!!existingId);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    void ensurePublisher().catch((caught) => {
      setError(caught instanceof Error ? caught.message : "Could not open course editor");
      setLoading(false);
    });
  }, [ensurePublisher]);

  useEffect(() => {
    if (!session?.token || !existingId) return;
    contentApi.detail(existingId, session.token)
      .then(async (detail) => {
        setSeriesTitle(String(detail.title ?? ""));
        setContentId(existingId);
        setStatus(String(detail.status ?? "DRAFT"));
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
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load course"))
      .finally(() => setLoading(false));
  }, [existingId, session?.token, session?.userId]);

  useEffect(() => {
    if (!existingId) setLoading(false);
  }, [existingId]);

  useEffect(() => {
    if (!session?.token) return;
    void (async () => {
      try {
        const used = new Set(chapters.flatMap((chapter) => chapter.topics.map((topic) => topic.videoContentId)));
        const [mine, published] = await Promise.all([
          contentApi.mine(session.token),
          api<{ items: ContentItem[] }>("/api/v1/content?sort=newest", { token: session.token }),
        ]);
        const map = new Map<string, string>();
        for (const item of mine.items as OwnedContent[]) {
          if (item.contentType !== "VIDEO" || item.status === "REMOVED" || !item.hasMedia) continue;
          if (used.has(item.contentId)) continue;
          map.set(item.contentId, item.description || item.title || "Untitled short");
        }
        for (const item of published.items) {
          if (item.contentType !== "VIDEO" || used.has(item.contentId)) continue;
          map.set(item.contentId, item.description || item.title || "Untitled short");
        }
        setCatalog([...map.entries()].map(([contentId, label]) => ({ contentId, label })));
      } catch {
        setCatalog([]);
      }
    })();
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

  async function ensureDefaultSection(playlistId: string): Promise<string> {
    if (selectedModuleId) return selectedModuleId;
    if (chapters[0]) {
      setSelectedModuleId(chapters[0].moduleId);
      return chapters[0].moduleId;
    }
    const created = await contentApi.addModule(session!.token, playlistId, "Videos", 1);
    const next: Chapter = { moduleId: created.moduleId, title: "Videos", position: 1, topics: [] };
    setChapters([next]);
    setSelectedModuleId(created.moduleId);
    return created.moduleId;
  }

  function confirmDeletePlaylist() {
    if (!contentId) return;
    setDeleteOpen(true);
  }

  if (!session) {
    return (
      <Screen>
        <Banner>Sign in to manage courses.</Banner>
        <Button onPress={() => navigation.goBack()}>Back</Button>
      </Screen>
    );
  }

  if (loading) return <Screen><LoadingState /></Screen>;

  const selectedChapter = chapters.find((item) => item.moduleId === selectedModuleId);
  const isPublic = status === "PUBLISHED";

  return (
    <Screen>
      <View style={styles.headerBar}>
        <Title>{contentId ? "Manage course" : "New course"}</Title>
        <Pressable style={styles.back} onPress={() => navigation.goBack()}>
          <Icon name="back" size={20} color={colors.ink} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>
      <Text style={styles.sub}>
        Name your course, add or remove any shorts, then make it public or keep it private.
      </Text>

      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 48 }}>
        <Field label="Course name" value={seriesTitle} onChangeText={setSeriesTitle} />
        <Button
          primary
          disabled={busy || !seriesTitle.trim()}
          onPress={() => void run(async () => {
            if (contentId) {
              await contentApi.updateCourse(session.token, contentId, { title: seriesTitle.trim() });
              await upsertStudioDraft(session.userId, {
                contentId,
                title: seriesTitle.trim(),
                status,
                kind: "COURSE",
                updatedAt: new Date().toISOString(),
              });
              setMessage("Course name saved.");
              return;
            }
            const created = await contentApi.createCourse(session.token, seriesTitle.trim());
            setContentId(created.contentId);
            setStatus("DRAFT");
            await upsertStudioDraft(session.userId, {
              contentId: created.contentId,
              title: seriesTitle.trim(),
              status: "DRAFT",
              kind: "COURSE",
              updatedAt: new Date().toISOString(),
            });
            setMessage("Course created. Add videos next.");
          })}
        >
          {contentId ? "Save name" : "Create course"}
        </Button>

        {contentId ? (
          <View style={styles.visibilityCard}>
            <Text style={styles.section}>Visibility</Text>
            <Text style={styles.meta}>
              {isPublic ? "Public — anyone can find this course." : "Private — only you can manage it."}
            </Text>
            <View style={styles.row}>
              <Pressable
                style={[styles.visBtn, isPublic ? styles.visBtnOn : null]}
                disabled={busy}
                onPress={() => void run(async () => {
                  const result = await contentApi.setCourseVisibility(session.token, contentId, "public");
                  setStatus(result.status);
                  await updateStudioDraftStatus(session.userId, contentId, result.status);
                  setMessage("Course is public.");
                })}
              >
                <Text style={[styles.visText, isPublic ? styles.visTextOn : null]}>Public</Text>
              </Pressable>
              <Pressable
                style={[styles.visBtn, !isPublic ? styles.visBtnOn : null]}
                disabled={busy}
                onPress={() => void run(async () => {
                  const result = await contentApi.setCourseVisibility(session.token, contentId, "private");
                  setStatus(result.status);
                  await updateStudioDraftStatus(session.userId, contentId, result.status);
                  setMessage("Course is private.");
                })}
              >
                <Text style={[styles.visText, !isPublic ? styles.visTextOn : null]}>Private</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <Text style={styles.section}>Videos in course</Text>
        {!contentId ? <Banner tone="info">Create the course first.</Banner> : null}

        {contentId ? (
          <>
            <Pressable
              style={styles.upload}
              disabled={busy}
              onPress={() => void run(async () => {
                const picked = await pickShortVideo();
                if (!picked) return;
                const video = await contentApi.createVideo(session.token, {
                  description: `${seriesTitle.trim() || "Course"} short`,
                  sources: "Original creator material",
                  keywords: "course, short-form",
                  durationSeconds: picked.durationSeconds,
                });
                await contentApi.saveMedia(session.token, video.contentId, {
                  mimeType: picked.mimeType,
                  dataBase64: picked.dataBase64,
                  durationSeconds: picked.durationSeconds,
                });
                await contentApi.publishVideo(session.token, video.contentId);
                const added = await contentApi.addVideoToCourse(session.token, contentId, video.contentId);
                const moduleId = await ensureDefaultSection(contentId);
                setChapters((current) => {
                  const exists = current.find((chapter) => chapter.moduleId === moduleId);
                  if (!exists) {
                    return [{
                      moduleId,
                      title: "Videos",
                      position: 1,
                      topics: [{
                        lessonId: added.lessonId,
                        title: `${seriesTitle.trim() || "Course"} short`,
                        position: added.position,
                        videoContentId: video.contentId,
                      }],
                    }];
                  }
                  return current.map((chapter) => (
                    chapter.moduleId === moduleId
                      ? {
                          ...chapter,
                          topics: [
                            ...chapter.topics,
                            {
                              lessonId: added.lessonId,
                              title: `${seriesTitle.trim() || "Course"} short`,
                              position: added.position,
                              videoContentId: video.contentId,
                            },
                          ],
                        }
                      : chapter
                  ));
                });
                setMessage("New short uploaded and added.");
              })}
            >
              <Icon name="video" size={22} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.uploadTitle}>Upload & add short</Text>
                <Text style={styles.uploadMeta}>Create a new short and attach it here.</Text>
              </View>
            </Pressable>

            {catalog.length ? (
              <View style={styles.addExisting}>
                <Text style={styles.label}>Add any short</Text>
                {catalog.slice(0, 12).map((video) => (
                  <Pressable
                    key={video.contentId}
                    style={styles.existingRow}
                    disabled={busy}
                    onPress={() => void run(async () => {
                      const added = await contentApi.addVideoToCourse(session.token, contentId, video.contentId);
                      const moduleId = added.moduleId;
                      setSelectedModuleId(moduleId);
                      setChapters((current) => {
                        const exists = current.find((chapter) => chapter.moduleId === moduleId);
                        if (!exists) {
                          return [{
                            moduleId,
                            title: "Videos",
                            position: 1,
                            topics: [{
                              lessonId: added.lessonId,
                              title: video.label.slice(0, 80),
                              position: added.position,
                              videoContentId: video.contentId,
                            }],
                          }];
                        }
                        return current.map((chapter) => (
                          chapter.moduleId === moduleId
                            ? {
                                ...chapter,
                                topics: [
                                  ...chapter.topics,
                                  {
                                    lessonId: added.lessonId,
                                    title: video.label.slice(0, 80),
                                    position: added.position,
                                    videoContentId: video.contentId,
                                  },
                                ],
                              }
                            : chapter
                        ));
                      });
                      setMessage("Short added to course.");
                    })}
                  >
                    <Text style={styles.existingText} numberOfLines={2}>{video.label}</Text>
                    <Text style={styles.addLink}>Add</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Banner tone="info">No more shorts available to add right now.</Banner>
            )}

            {(selectedChapter?.topics ?? chapters.flatMap((chapter) => chapter.topics)).map((topic) => (
              <View key={`${topic.videoContentId}-${topic.lessonId ?? topic.position}`} style={styles.topicRow}>
                <Icon name="learn" size={18} color={colors.accent} />
                <Text style={styles.topicText} numberOfLines={2}>{topic.title}</Text>
                {topic.lessonId ? (
                  <Pressable
                    disabled={busy}
                    onPress={() => void run(async () => {
                      const moduleId = chapters.find((chapter) =>
                        chapter.topics.some((row) => row.lessonId === topic.lessonId),
                      )?.moduleId ?? selectedModuleId;
                      if (!moduleId) return;
                      await contentApi.removeLesson(session.token, moduleId, topic.lessonId!);
                      setChapters((current) => current.map((chapter) => (
                        chapter.moduleId === moduleId
                          ? {
                              ...chapter,
                              topics: chapter.topics
                                .filter((row) => row.lessonId !== topic.lessonId)
                                .map((row, index) => ({ ...row, position: index + 1 })),
                            }
                          : chapter
                      )));
                      setMessage("Short removed from course.");
                    })}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </>
        ) : null}

        {contentId ? (
          <Pressable style={styles.deleteRow} disabled={busy} onPress={confirmDeletePlaylist}>
            <Icon name="logout" size={18} color={colors.danger} />
            <Text style={styles.deleteText}>Delete whole course</Text>
          </Pressable>
        ) : null}

        {message ? <Banner tone="info">{message}</Banner> : null}
        {error ? <Banner>{error}</Banner> : null}
      </ScrollView>

      <ActionSheet
        visible={deleteOpen}
        title="Delete course?"
        message="This permanently deletes the course. Videos stay in the library."
        actions={[
          {
            label: "Delete",
            tone: "danger",
            onPress: () =>
              void run(async () => {
                await contentApi.deleteCourse(session!.token, contentId);
                navigation.goBack();
              }),
          },
        ]}
        onClose={() => setDeleteOpen(false)}
      />
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
  meta: { color: colors.inkMuted, fontSize: 13, fontFamily: font.medium, fontWeight: "600" },
  visibilityCard: {
    gap: 10,
    padding: space.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  row: { flexDirection: "row", gap: 8 },
  visBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  visBtnOn: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  visText: { color: colors.inkMuted, fontFamily: font.bold, fontWeight: "700" },
  visTextOn: { color: colors.accent },
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
