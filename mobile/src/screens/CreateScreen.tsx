import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Icon } from "../icons";
import { contentApi, type OwnedContent } from "../services/content";
import { useSession } from "../session";
import { colors, font, radii, space } from "../theme";
import { ActionSheet, Banner, EmptyState, LoadingState, Screen, Title } from "../ui";
import type { RootStackParamList } from "../navigation";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export function CreateScreen({ navigation }: Props) {
  const { session, ensurePublisher } = useSession();
  const [ready, setReady] = useState(false);
  const [drafts, setDrafts] = useState<OwnedContent[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<OwnedContent | null>(null);

  const load = useCallback(async () => {
    setError("");
    setLoadingDrafts(true);
    try {
      await ensurePublisher();
      setReady(true);
      if (!session?.token) {
        setDrafts([]);
        return;
      }
      const result = await contentApi.mine(session.token);
      setDrafts(
        result.items.filter(
          (item) => item.contentType === "VIDEO" && item.status !== "PUBLISHED" && item.status !== "REMOVED",
        ),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not open Create");
    } finally {
      setLoadingDrafts(false);
    }
  }, [ensurePublisher, session?.token]);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  async function removeDraft(item: OwnedContent) {
    if (!session?.token) return;
    setBusyId(item.contentId);
    try {
      await contentApi.deleteVideo(session.token, item.contentId);
      setDrafts((current) => current.filter((row) => row.contentId !== item.contentId));
      setMessage("Draft deleted.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete draft");
    } finally {
      setBusyId("");
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Title>Create</Title>
        <Text style={styles.sub}>
          Save as draft to keep editing, or publish to show it on Explore and your Profile.
        </Text>
        {error ? <Banner>{error}</Banner> : null}
        {message ? <Banner tone="info">{message}</Banner> : null}
        {!ready && !error ? <LoadingState /> : null}

        {ready ? (
          <View style={styles.actions}>
            <Pressable style={styles.primaryCard} onPress={() => navigation.navigate("ShortEditor", {})}>
              <Icon name="video" size={24} color={colors.accentInk} />
              <Text style={styles.primaryTitle}>Upload short</Text>
              <Text style={styles.primaryMeta}>Pick a clip, then Save draft or Publish</Text>
            </Pressable>
            <Pressable style={styles.secondaryCard} onPress={() => navigation.navigate("CourseStudio", {})}>
              <Icon name="course" size={22} color={colors.accent} />
              <Text style={styles.secondaryTitle}>New course</Text>
              <Text style={styles.secondaryMeta}>Name it, add shorts, then make it public or private</Text>
            </Pressable>
          </View>
        ) : null}

        {ready ? (
          <View style={styles.drafts}>
            <Text style={styles.section}>Draft shorts</Text>
            {loadingDrafts ? <LoadingState /> : null}
            {!loadingDrafts && !drafts.length ? (
              <EmptyState>No drafts yet. Upload a short and tap Save draft.</EmptyState>
            ) : null}
            {drafts.map((item) => (
              <View key={item.contentId} style={styles.draftRow}>
                <Pressable
                  style={styles.draftMain}
                  onPress={() => navigation.navigate("ShortEditor", { contentId: item.contentId })}
                >
                  <View style={styles.draftIcon}>
                    <Icon name="video" size={20} color={colors.accent} />
                  </View>
                  <View style={styles.draftCopy}>
                    <Text style={styles.draftTitle} numberOfLines={1}>{item.description || item.title || "Untitled short"}</Text>
                    <Text style={styles.draftMeta}>{item.status}</Text>
                  </View>
                </Pressable>
                <Pressable onPress={() => navigation.navigate("ShortEditor", { contentId: item.contentId })}>
                  <Text style={styles.draftAction}>Edit</Text>
                </Pressable>
                <Pressable disabled={busyId === item.contentId} onPress={() => setDeleteTarget(item)}>
                  <Text style={styles.draftDanger}>Delete</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <ActionSheet
        visible={Boolean(deleteTarget)}
        title="Delete draft?"
        message={
          deleteTarget
            ? `"${deleteTarget.description || deleteTarget.title || "Untitled short"}" will be removed permanently.`
            : undefined
        }
        actions={[
          {
            label: "Delete",
            tone: "danger",
            onPress: () => {
              if (deleteTarget) void removeDraft(deleteTarget);
            },
          },
        ]}
        onClose={() => setDeleteTarget(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: 16, paddingBottom: 40 },
  sub: { color: colors.inkMuted, fontSize: 14, lineHeight: 20, fontFamily: font.body, marginTop: -8 },
  actions: { gap: 12 },
  primaryCard: {
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    padding: space.xl,
    gap: 8,
  },
  primaryTitle: { color: colors.accentInk, fontSize: 22, fontFamily: font.display },
  primaryMeta: { color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 18, fontFamily: font.body },
  secondaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.xl,
    gap: 6,
  },
  secondaryTitle: { color: colors.ink, fontSize: 22, fontFamily: font.display },
  secondaryMeta: { color: colors.inkMuted, fontSize: 13, lineHeight: 18, fontFamily: font.body },
  drafts: { gap: 10, marginTop: 8 },
  section: { color: colors.ink, fontSize: 16, fontFamily: font.bold, fontWeight: "700" },
  draftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
  },
  draftMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  draftIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  draftCopy: { flex: 1, gap: 2 },
  draftTitle: { color: colors.ink, fontSize: 15, fontFamily: font.bold, fontWeight: "700" },
  draftMeta: { color: colors.inkMuted, fontSize: 12, fontFamily: font.medium, fontWeight: "600" },
  draftAction: { color: colors.accent, fontFamily: font.bold, fontWeight: "700", fontSize: 13 },
  draftDanger: { color: colors.danger, fontFamily: font.bold, fontWeight: "700", fontSize: 13 },
});
