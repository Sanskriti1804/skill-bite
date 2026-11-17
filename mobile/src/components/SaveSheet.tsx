import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../api";
import { openSaveSheet, registerSaveSheet, type SaveSheetRequest } from "../creator/saveSheetController";
import { Icon } from "../icons";
import { contentApi, type OwnedContent } from "../services/content";
import { colors, font, radii, space } from "../theme";

type Step = "actions" | "playlists";

export function SaveSheetHost() {
  const insets = useSafeAreaInsets();
  const [request, setRequest] = useState<SaveSheetRequest | null>(null);
  const [step, setStep] = useState<Step>("actions");
  const [playlists, setPlaylists] = useState<OwnedContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    registerSaveSheet((next) => {
      setRequest(next);
      setStep(next.mode === "playlist-only" ? "playlists" : "actions");
      setError("");
      setPlaylists([]);
      if (next.mode === "playlist-only") {
        void loadPlaylists(next.token);
      }
    });
    return () => registerSaveSheet(null);
  }, []);

  async function loadPlaylists(token: string) {
    setLoading(true);
    setError("");
    try {
      const mine = await contentApi.mine(token);
      setPlaylists(mine.items.filter((item) => item.contentType === "COURSE" && item.status !== "REMOVED"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load courses");
    } finally {
      setLoading(false);
    }
  }

  function close() {
    if (busy) return;
    setRequest(null);
    setStep("actions");
    setError("");
  }

  async function addToWatchingList() {
    if (!request) return;
    setBusy(true);
    setError("");
    try {
      if (request.onBookmarked) await request.onBookmarked();
      else {
        await api("/api/v1/bookmarks", {
          method: "POST",
          token: request.token,
          body: { contentId: request.contentId },
        });
      }
      request.onMessage?.("Added to watching list.");
      close();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not save";
      setError(message);
      request.onError?.(message);
    } finally {
      setBusy(false);
    }
  }

  async function addToPlaylist(playlist: OwnedContent) {
    if (!request) return;
    setBusy(true);
    setError("");
    try {
      await contentApi.addVideoToCourse(request.token, playlist.contentId, request.contentId);
      await request.onAdded?.(playlist);
      request.onMessage?.(`Added to ${playlist.title || "course"}.`);
      close();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not add to course";
      setError(message);
      request.onError?.(message);
    } finally {
      setBusy(false);
    }
  }

  const visible = Boolean(request);
  const isPlaylistContent = request?.contentType === "COURSE";
  const title = step === "playlists"
    ? "Choose course"
    : isPlaylistContent
      ? "Save course"
      : "Save short";
  const subtitle = step === "playlists"
    ? "Pick where this short should live."
    : isPlaylistContent
      ? "Keep it in your watching list for later."
      : "Add it to your watching list or one of your courses.";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={close} hitSlop={10}>
              <Icon name="close" size={18} color={colors.ink} />
            </Pressable>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {step === "actions" ? (
            <View style={styles.actions}>
              <Pressable
                style={[styles.option, busy ? styles.optionDisabled : null]}
                disabled={busy}
                onPress={() => void addToWatchingList()}
              >
                <View style={styles.optionIcon}>
                  <Icon name="bookmarkActive" size={22} color={colors.accent} />
                </View>
                <View style={styles.optionCopy}>
                  <Text style={styles.optionTitle}>Watching list</Text>
                  <Text style={styles.optionMeta}>Save for later in Profile → Watching</Text>
                </View>
                <Icon name="continue" size={18} color={colors.accent} />
              </Pressable>

              {!isPlaylistContent ? (
                <Pressable
                  style={[styles.option, busy ? styles.optionDisabled : null]}
                  disabled={busy}
                  onPress={() => {
                    setStep("playlists");
                    if (request) void loadPlaylists(request.token);
                  }}
                >
                  <View style={styles.optionIcon}>
                    <Icon name="course" size={22} color={colors.accent} />
                  </View>
                  <View style={styles.optionCopy}>
                    <Text style={styles.optionTitle}>My course</Text>
                    <Text style={styles.optionMeta}>Add this short into a named course</Text>
                  </View>
                  <Icon name="continue" size={18} color={colors.accent} />
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View style={styles.playlistWrap}>
              <Pressable
                style={styles.backRow}
                disabled={busy || request?.mode === "playlist-only"}
                onPress={() => {
                  if (request?.mode === "playlist-only") {
                    close();
                    return;
                  }
                  setStep("actions");
                  setError("");
                }}
              >
                <Icon name="back" size={18} color={colors.ink} />
                <Text style={styles.backText}>
                  {request?.mode === "playlist-only" ? "Close" : "Back"}
                </Text>
              </Pressable>

              {loading ? (
                <View style={styles.loading}>
                  <ActivityIndicator color={colors.accent} />
                  <Text style={styles.loadingText}>Loading courses…</Text>
                </View>
              ) : null}

              {!loading && !playlists.length ? (
                <View style={styles.empty}>
                  <Icon name="course" size={28} color={colors.accent} />
                  <Text style={styles.emptyTitle}>No courses yet</Text>
                  <Text style={styles.emptyMeta}>Create one from the Create tab, then come back here.</Text>
                </View>
              ) : null}

              <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: 10 }}>
                {playlists.map((playlist) => (
                  <Pressable
                    key={playlist.contentId}
                    style={[styles.playlistRow, busy ? styles.optionDisabled : null]}
                    disabled={busy}
                    onPress={() => void addToPlaylist(playlist)}
                  >
                    <View style={styles.optionIcon}>
                      <Icon name="course" size={20} color={colors.accent} />
                    </View>
                    <View style={styles.optionCopy}>
                      <Text style={styles.optionTitle} numberOfLines={1}>
                        {playlist.title || "Untitled course"}
                      </Text>
                      <Text style={styles.optionMeta}>
                        {playlist.status === "PUBLISHED" ? "Public" : "Private"}
                      </Text>
                    </View>
                    <Text style={styles.addLabel}>Add</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {busy ? (
            <View style={styles.busyRow}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.loadingText}>Saving…</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

/** Kept for callers that still import the imperative helpers. */
export { openSaveSheet };

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(40, 16, 28, 0.45)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    gap: space.md,
    borderTopWidth: 1,
    borderColor: colors.line,
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.accentAlt,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.md,
  },
  title: {
    color: colors.ink,
    fontSize: 22,
    fontFamily: font.display,
  },
  subtitle: {
    marginTop: 4,
    color: colors.inkMuted,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: font.body,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
  },
  actions: { gap: 10 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: space.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  optionDisabled: { opacity: 0.6 },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
  },
  optionCopy: { flex: 1, gap: 2 },
  optionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontFamily: font.bold,
    fontWeight: "700",
  },
  optionMeta: {
    color: colors.inkMuted,
    fontSize: 12,
    fontFamily: font.medium,
    fontWeight: "600",
  },
  playlistWrap: { gap: 12 },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  backText: {
    color: colors.ink,
    fontFamily: font.bold,
    fontWeight: "700",
    fontSize: 14,
  },
  playlistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: space.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  addLabel: {
    color: colors.accent,
    fontFamily: font.heavy,
    fontWeight: "800",
    fontSize: 13,
  },
  loading: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 28,
  },
  loadingText: {
    color: colors.inkMuted,
    fontFamily: font.medium,
    fontWeight: "600",
    fontSize: 13,
  },
  empty: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 28,
    paddingHorizontal: space.lg,
  },
  emptyTitle: {
    color: colors.ink,
    fontFamily: font.bold,
    fontWeight: "700",
    fontSize: 16,
  },
  emptyMeta: {
    color: colors.inkMuted,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: font.body,
  },
  errorBox: {
    borderRadius: radii.md,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  errorText: {
    color: colors.danger,
    fontFamily: font.medium,
    fontWeight: "600",
    fontSize: 13,
  },
  busyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 4,
  },
});
