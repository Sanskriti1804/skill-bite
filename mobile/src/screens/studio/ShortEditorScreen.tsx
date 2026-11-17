import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useIsFocused } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { upsertStudioDraft } from "../../creator/drafts";
import {
  encodeVideoBase64,
  pickShortVideoFromGallery,
  type PickedVideoMeta,
} from "../../creator/media";
import { promptAddToPlaylist } from "../../creator/saveToPlaylist";
import { Icon } from "../../icons";
import { mediaUrl } from "../../api";
import { contentApi } from "../../services/content";
import { useSession } from "../../session";
import { colors, font, radii, space } from "../../theme";
import type { Category } from "../../types";
import { Banner, Button, Field, LoadingState, Screen, Title } from "../../ui";
import type { RootStackParamList } from "../../navigation";

type Props = NativeStackScreenProps<RootStackParamList, "ShortEditor">;

export function ShortEditorScreen({ navigation, route }: Props) {
  const { session, ensurePublisher } = useSession();
  const isFocused = useIsFocused();
  const existingId = route.params.contentId;
  const autoPickStarted = useRef(false);

  const [contentId, setContentId] = useState(existingId ?? "");
  const [description, setDescription] = useState("");
  const [sources, setSources] = useState("Original creator material");
  const [keywords, setKeywords] = useState("tutorial, short-form");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [status, setStatus] = useState("DRAFT");
  const [picked, setPicked] = useState<PickedVideoMeta | null>(null);
  const [dataBase64, setDataBase64] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [hasRemoteMedia, setHasRemoteMedia] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!!existingId);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const previewUri = picked?.uri ?? (hasRemoteMedia && contentId ? mediaUrl(contentId) : "");
  const hasLocalVideo = Boolean(picked && dataBase64);
  const showDetails = Boolean(existingId) || hasLocalVideo || (hasRemoteMedia && !preparing);
  const canEdit = status !== "REMOVED";
  const previewPlayer = useVideoPlayer(previewUri || null, (instance) => {
    instance.loop = true;
  });

  async function persistVideo(as: "DRAFT" | "PUBLISHED") {
    if (!session?.token || !session.userId) return;
    if (!categoryIds.length) throw new Error("Pick at least one category before continuing.");
    if (!hasLocalVideo && !hasRemoteMedia) throw new Error("Choose a video before continuing.");
    if (!description.trim()) throw new Error("Add a description before continuing.");

    const label = description.trim().slice(0, 80);
    let id = contentId;
    if (!id) {
      const created = await contentApi.createVideo(session.token, {
        description: description.trim(),
        sources,
        keywords,
        durationSeconds: picked?.durationSeconds ?? 60,
        categoryIds,
      });
      id = created.contentId;
      setContentId(id);
    } else {
      await contentApi.updateVideo(session.token, id, {
        description: description.trim(),
        sources,
        keywords,
        categoryIds,
        status: as === "DRAFT" ? "DRAFT" : undefined,
      });
    }

    if (hasLocalVideo && picked && dataBase64) {
      await contentApi.saveMedia(session.token, id, {
        mimeType: picked.mimeType,
        dataBase64,
        durationSeconds: picked.durationSeconds,
      });
      setHasRemoteMedia(true);
    }

    if (as === "PUBLISHED") {
      const result = await contentApi.publishVideo(session.token, id);
      setStatus(result.status);
      await upsertStudioDraft(session.userId, {
        contentId: id,
        title: label,
        status: result.status,
        kind: "VIDEO",
        updatedAt: new Date().toISOString(),
      });
      setMessage("Published. Choose a course to keep it organized, or skip.");
      return id;
    }

    setStatus("DRAFT");
    await upsertStudioDraft(session.userId, {
      contentId: id,
      title: label,
      status: "DRAFT",
      kind: "VIDEO",
      updatedAt: new Date().toISOString(),
    });
    setMessage("Saved as draft. You can also add it to a course.");
    return id;
  }

  async function offerPlaylist(videoId: string) {
    if (!session?.token) return;
    await promptAddToPlaylist({
      token: session.token,
      videoContentId: videoId,
      onMessage: setMessage,
      onError: setError,
    });
  }

  useEffect(() => {
    if (!previewUri || preparing || !isFocused) {
      previewPlayer.pause();
      return;
    }
    previewPlayer.play();
  }, [isFocused, preparing, previewPlayer, previewUri]);

  useEffect(() => {
    void ensurePublisher().catch((caught) => {
      setError(caught instanceof Error ? caught.message : "Could not open editor");
      setLoading(false);
    });
  }, [ensurePublisher]);

  useEffect(() => {
    if (!session?.token) return;
    let active = true;

    void contentApi.categories()
      .then((categoryResult) => {
        if (!active) return;
        const selectable = categoryResult.items.filter((item) => item.categoryId && item.slug !== "trending");
        setCategories(selectable);
      })
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : "Categories could not be loaded");
      });

    return () => {
      active = false;
    };
  }, [session?.token, existingId]);

  useEffect(() => {
    if (!session?.token || !existingId) return;
    contentApi.detail(existingId, session.token)
      .then(async (detail) => {
        setDescription(String(detail.description ?? detail.title ?? ""));
        if (typeof detail.keywords === "string" && detail.keywords) setKeywords(detail.keywords);
        if (typeof detail.sources === "string" && detail.sources) setSources(detail.sources);
        setStatus(String(detail.status ?? "DRAFT"));
        setContentId(existingId);
        setHasRemoteMedia(detail.hasMedia === true);
        const detailCategories = Array.isArray(detail.categories) ? detail.categories as Array<{ categoryId?: string }> : [];
        setCategoryIds(
          detailCategories
            .map((item) => item.categoryId)
            .filter((id): id is string => typeof id === "string"),
        );
        await upsertStudioDraft(session.userId, {
          contentId: existingId,
          title: String(detail.title ?? existingId),
          status: String(detail.status ?? "DRAFT"),
          kind: "VIDEO",
          updatedAt: new Date().toISOString(),
        });
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load draft"))
      .finally(() => setLoading(false));
  }, [existingId, session?.token, session?.userId]);

  useEffect(() => {
    if (!existingId) setLoading(false);
  }, [existingId]);

  const preparePickedVideo = useCallback(async (meta: PickedVideoMeta) => {
    setError("");
    setMessage("");
    setPicked(meta);
    setDataBase64("");
    setPreparing(true);
    try {
      const encoded = await encodeVideoBase64(meta.uri);
      setDataBase64(encoded);
    } catch (caught) {
      setPicked(null);
      setDataBase64("");
      setError(caught instanceof Error ? caught.message : "Could not prepare that video");
    } finally {
      setPreparing(false);
    }
  }, []);

  const chooseVideo = useCallback(async () => {
    if (!canEdit || busy || preparing) return;
    setError("");
    try {
      const meta = await pickShortVideoFromGallery();
      if (!meta) return;
      await preparePickedVideo(meta);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not open gallery");
    }
  }, [busy, canEdit, preparePickedVideo, preparing]);

  useEffect(() => {
    if (existingId || loading || !session || autoPickStarted.current) return;
    autoPickStarted.current = true;
    void chooseVideo();
  }, [chooseVideo, existingId, loading, session]);

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
        <Banner>Sign in to upload shorts.</Banner>
        <Button onPress={() => navigation.goBack()}>Back</Button>
      </Screen>
    );
  }

  if (loading) return <Screen><LoadingState /></Screen>;

  return (
    <Screen>
      <View style={styles.headerBar}>
        <Title>{contentId ? "Edit short" : "New short"}</Title>
        <Pressable style={styles.back} onPress={() => navigation.goBack()}>
          <Icon name="back" size={20} color={colors.ink} />
          <Text style={styles.backText}>Create</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {!showDetails && !preparing && !picked ? (
          <Pressable style={styles.pickCard} onPress={() => void chooseVideo()} disabled={!canEdit}>
            <Icon name="video" size={36} color={colors.accent} />
            <Text style={styles.pickTitle}>Choose a short from gallery</Text>
            <Text style={styles.pickMeta}>Pick a vertical clip first. We’ll show a preview, then ask for the details.</Text>
          </Pressable>
        ) : null}

        {picked || hasRemoteMedia || preparing ? (
          <View style={styles.previewWrap}>
            {previewUri ? (
              <VideoView
                style={styles.preview}
                player={previewPlayer}
                contentFit="cover"
                nativeControls
              />
            ) : (
              <View style={[styles.preview, styles.previewPlaceholder]}>
                <Icon name="video" size={28} color={colors.accentInk} />
              </View>
            )}
            {preparing ? (
              <View style={styles.previewOverlay}>
                <ActivityIndicator color={colors.accentInk} size="large" />
                <Text style={styles.previewOverlayText}>Preparing preview…</Text>
              </View>
            ) : null}
            <View style={styles.previewMeta}>
              <Text style={styles.previewName} numberOfLines={1}>
                {picked?.fileName ?? "Uploaded short"}
              </Text>
              <Text style={styles.previewDuration}>
                {picked ? `${picked.durationSeconds}s` : hasRemoteMedia ? "On file" : ""}
              </Text>
            </View>
            {canEdit ? (
              <Pressable style={styles.changeBtn} onPress={() => void chooseVideo()} disabled={busy || preparing}>
                <Icon name="video" size={16} color={colors.accent} />
                <Text style={styles.changeText}>{picked || hasRemoteMedia ? "Replace video" : "Choose video"}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {showDetails ? (
          <>
            <Text style={styles.sub}>
              Status: {status}. Save draft keeps it private. Publish puts it on Explore and Profile.
            </Text>
            <Text style={styles.hint}>Video files are stored under the category folder in Cloudinary.</Text>

            <Field
              label="Description"
              value={description}
              onChangeText={setDescription}
              hint="Required. What the learner will practice in this bite."
            />
            <Field label="Sources" value={sources} onChangeText={setSources} />
            <Field label="Keywords" value={keywords} onChangeText={setKeywords} hint="Comma-separated topics for search." />

            <Text style={styles.label}>Categories (required)</Text>
            {categories.length === 0 ? (
              <Text style={styles.emptyRow}>Categories are still loading. Go back and open this screen again.</Text>
            ) : (
              <View style={styles.dropdownWrap}>
                <Pressable
                  style={[styles.dropdown, !canEdit ? styles.chipDisabled : null]}
                  disabled={!canEdit}
                  onPress={() => setCategoriesOpen((open) => !open)}
                >
                  <Text style={[styles.dropdownText, categoryIds.length ? styles.dropdownTextOn : null]} numberOfLines={1}>
                    {categoryIds.length
                      ? categories
                          .filter((item) => item.categoryId && categoryIds.includes(item.categoryId))
                          .map((item) => item.name)
                          .join(", ")
                      : "Select one or more categories"}
                  </Text>
                  <Icon name="chevronDown" size={18} color={colors.inkMuted} />
                </Pressable>

                {categoriesOpen ? (
                  <View style={styles.dropdownMenu}>
                    {categories.map((category) => {
                      if (!category.categoryId) return null;
                      const selected = categoryIds.includes(category.categoryId);
                      return (
                        <Pressable
                          key={category.slug}
                          style={styles.dropdownItem}
                          onPress={() => {
                            const id = category.categoryId as string;
                            setCategoryIds((current) => (
                              current.includes(id)
                                ? current.filter((value) => value !== id)
                                : [...current, id]
                            ));
                          }}
                        >
                          <View style={[styles.check, selected ? styles.checkOn : null]}>
                            {selected ? <Icon name="check" size={14} color={colors.accentInk} /> : null}
                          </View>
                          <Text style={[styles.dropdownItemText, selected ? styles.chipTextOn : null]}>{category.name}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}

                {categoryIds.length ? (
                  <View style={styles.selectedRow}>
                    {categories
                      .filter((item) => item.categoryId && categoryIds.includes(item.categoryId))
                      .map((category) => (
                        <Pressable
                          key={category.slug}
                          style={styles.selectedChip}
                          disabled={!canEdit}
                          onPress={() => {
                            if (!category.categoryId) return;
                            setCategoryIds((current) => current.filter((id) => id !== category.categoryId));
                          }}
                        >
                          <Text style={styles.selectedChipText}>{category.name}</Text>
                          <Icon name="close" size={14} color={colors.accent} />
                        </Pressable>
                      ))}
                  </View>
                ) : null}
              </View>
            )}

            <View style={styles.row}>
              <Button
                primary
                disabled={busy || preparing || !canEdit || !description.trim() || (!hasLocalVideo && !hasRemoteMedia)}
                onPress={() => void run(async () => {
                  const id = await persistVideo("DRAFT");
                  if (id) await offerPlaylist(id);
                })}
              >
                Save draft
              </Button>
            </View>

            <Button
              primary
              disabled={busy || preparing || !canEdit || !description.trim() || (!hasLocalVideo && !hasRemoteMedia)}
              onPress={() => void run(async () => {
                const id = await persistVideo("PUBLISHED");
                if (id) await offerPlaylist(id);
              })}
            >
              Publish short
            </Button>
          </>
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
  scroll: { gap: 16, paddingBottom: 40 },
  sub: { color: colors.inkMuted, fontSize: 13, fontFamily: font.body },
  hint: { color: colors.inkMuted, fontSize: 12, fontFamily: font.body, marginTop: -8 },
  label: { fontSize: 14, fontFamily: font.medium, fontWeight: "600", color: colors.ink },
  emptyRow: { color: colors.inkMuted, fontSize: 13, fontFamily: font.body },
  chipDisabled: { opacity: 0.5 },
  chipTextOn: { color: colors.accent },
  dropdownWrap: { gap: 8 },
  dropdown: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dropdownText: { flex: 1, color: colors.inkMuted, fontFamily: font.body, fontSize: 15 },
  dropdownTextOn: { color: colors.ink, fontFamily: font.medium, fontWeight: "600" },
  dropdownMenu: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  dropdownItem: {
    minHeight: 44,
    paddingHorizontal: space.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  dropdownItemText: { color: colors.ink, fontFamily: font.medium, fontWeight: "600", fontSize: 14 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  checkOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  selectedRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  selectedChipText: { color: colors.accent, fontFamily: font.bold, fontWeight: "700", fontSize: 13 },
  pickCard: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 220,
    padding: space.xl,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  pickTitle: { color: colors.ink, fontSize: 20, fontFamily: font.display, textAlign: "center" },
  pickMeta: { color: colors.inkMuted, fontSize: 13, lineHeight: 18, fontFamily: font.body, textAlign: "center" },
  previewWrap: {
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.videoBg,
  },
  preview: { width: "100%", height: 320, backgroundColor: colors.videoBg },
  previewPlaceholder: { alignItems: "center", justifyContent: "center" },
  previewOverlay: {
    ...StyleSheet.absoluteFill,
    height: 320,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(26,15,20,0.55)",
  },
  previewOverlayText: { color: colors.accentInk, fontFamily: font.bold, fontWeight: "700" },
  previewMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: space.md,
    paddingTop: space.md,
  },
  previewName: { flex: 1, color: colors.accentInk, fontFamily: font.bold, fontWeight: "700" },
  previewDuration: { color: colors.feedMuted, fontFamily: font.medium, fontWeight: "600" },
  changeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    margin: space.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.accentInk,
  },
  changeText: { color: colors.accent, fontFamily: font.bold, fontWeight: "700", fontSize: 13 },
  row: { gap: 8 },
});
