import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { upsertStudioDraft, updateStudioDraftStatus } from "../../creator/drafts";
import { pickShortVideo } from "../../creator/media";
import { Icon } from "../../icons";
import { contentApi, type Tag } from "../../services/content";
import { useSession } from "../../session";
import { colors, radii, space } from "../../theme";
import { Banner, Button, Field, LoadingState, Screen, Title } from "../../ui";
import type { RootStackParamList } from "../../navigation";

type Props = NativeStackScreenProps<RootStackParamList, "CourseStudio">;

type Chapter = {
  moduleId: string;
  title: string;
  position: number;
  topics: { title: string; videoContentId: string; position: number }[];
};

export function CourseStudioScreen({ navigation, route }: Props) {
  const { session, ensurePublisher } = useSession();
  const existingId = route.params.contentId;
  const [contentId, setContentId] = useState(existingId ?? "");
  const [seriesTitle, setSeriesTitle] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [topicTitle, setTopicTitle] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagId, setTagId] = useState("");
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
    if (!session?.token) return;
    contentApi.tags(session.token)
      .then((result) => {
        setTags(result.items);
        if (!tagId && result.items[0]) setTagId(result.items[0].tagId);
      })
      .catch(() => undefined);
  }, [session?.token]);

  useEffect(() => {
    if (!session?.token || !existingId) return;
    contentApi.detail(existingId, session.token)
      .then(async (detail) => {
        setSeriesTitle(String(detail.title ?? ""));
        setContentId(existingId);
        const modules = (detail.modules as { moduleId: string; title: string; position: number; lessons: { title: string; position: number; videoContentId: string }[] }[] | undefined) ?? [];
        setChapters(modules.map((module) => ({
          moduleId: module.moduleId,
          title: module.title,
          position: module.position,
          topics: module.lessons.map((lesson) => ({
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
      <Pressable style={styles.back} onPress={() => navigation.goBack()}>
        <Icon name="back" size={20} color={colors.ink} />
        <Text style={styles.backText}>Create</Text>
      </Pressable>
      <Title>{contentId ? "Manage playlist" : "New playlist"}</Title>
      <Text style={styles.sub}>
        Sections group topics. Each topic is one short. Viewers may watch topics in any order.
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

        <Text style={styles.section}>Topics in this section</Text>
        {!selectedChapter ? <Banner tone="info">Add or select a section first.</Banner> : null}
        {selectedChapter ? (
          <>
            <Field label="Topic name" value={topicTitle} onChangeText={setTopicTitle} hint="One short tutorial inside the chapter" />
            <Text style={styles.label}>Topic tag for the short video</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {tags.map((tag) => {
                const selected = tag.tagId === tagId;
                return (
                  <Pressable key={tag.tagId} style={[styles.chip, selected ? styles.chipOn : null]} onPress={() => setTagId(tag.tagId)}>
                    <Text style={[styles.chipText, selected ? styles.chipTextOn : null]}>{tag.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable
              style={styles.upload}
              disabled={busy || !topicTitle.trim()}
              onPress={() => void run(async () => {
                const picked = await pickShortVideo();
                if (!picked) return;
                const video = await contentApi.createVideo(session.token, {
                  title: topicTitle.trim(),
                  description: `${seriesTitle} · ${selectedChapter.title} · ${topicTitle.trim()}`,
                  sources: "Original creator material",
                  keywords: `${seriesTitle}, ${selectedChapter.title}, ${topicTitle}`,
                  durationSeconds: picked.durationSeconds,
                  tagIds: tagId ? [tagId] : [],
                });
                await contentApi.saveMedia(session.token, video.contentId, {
                  mimeType: picked.mimeType,
                  dataBase64: picked.dataBase64,
                  durationSeconds: picked.durationSeconds,
                });
                const position = selectedChapter.topics.length + 1;
                await contentApi.addLesson(session.token, selectedChapter.moduleId, {
                  title: topicTitle.trim(),
                  position,
                  videoContentId: video.contentId,
                });
                setChapters((current) => current.map((chapter) => (
                  chapter.moduleId === selectedChapter.moduleId
                    ? {
                        ...chapter,
                        topics: [...chapter.topics, { title: topicTitle.trim(), position, videoContentId: video.contentId }],
                      }
                    : chapter
                )));
                await upsertStudioDraft(session.userId, {
                  contentId: video.contentId,
                  title: topicTitle.trim(),
                  status: "DRAFT",
                  kind: "VIDEO",
                  updatedAt: new Date().toISOString(),
                });
                setTopicTitle("");
                setMessage("Topic short uploaded and linked to this section.");
              })}
            >
              <Icon name="video" size={22} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.uploadTitle}>Upload topic short</Text>
                <Text style={styles.uploadMeta}>Creates the short and attaches it as this section topic.</Text>
              </View>
            </Pressable>

            {selectedChapter.topics.map((topic) => (
              <View key={topic.videoContentId} style={styles.topicRow}>
                <Icon name="learn" size={18} color={colors.accent} />
                <Text style={styles.topicText}>{topic.position}. {topic.title}</Text>
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
            setMessage("Playlist published. Topic shorts are live on Home.");
          })}
        >
          Publish playlist
        </Button>

        {message ? <Banner tone="info">{message}</Banner> : null}
        {error ? <Banner>{error}</Banner> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { color: colors.ink, fontWeight: "700" },
  sub: { color: colors.inkMuted, fontSize: 13, lineHeight: 18, marginTop: -8 },
  section: { fontSize: 16, fontWeight: "700", color: colors.ink },
  label: { fontSize: 14, fontWeight: "600", color: colors.ink },
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
  uploadTitle: { color: colors.ink, fontWeight: "700" },
  uploadMeta: { color: colors.inkMuted, fontSize: 12, marginTop: 2 },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: radii.sm,
    backgroundColor: colors.accentSoft,
  },
  topicText: { color: colors.ink, fontWeight: "600", flex: 1 },
});
