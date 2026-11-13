import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useFocusEffect, type CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { loadStudioDrafts, type StudioDraft } from "../../creator/drafts";
import { Icon } from "../../icons";
import { useSession } from "../../session";
import { colors, radii, space } from "../../theme";
import { Banner, EmptyState, LoadingState, Screen, Title } from "../../ui";
import type { CreatorStackParamList, CreatorTabParamList } from "../../navigation";

type Props = CompositeScreenProps<
  BottomTabScreenProps<CreatorTabParamList, "Studio">,
  NativeStackScreenProps<CreatorStackParamList>
>;

export function StudioLibraryScreen({ navigation }: Props) {
  const { session } = useSession();
  const [drafts, setDrafts] = useState<StudioDraft[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let active = true;
    async function load() {
      if (!session?.userId) {
        if (active) {
          setDrafts([]);
          setLoading(false);
        }
        return;
      }
      const rows = await loadStudioDrafts(session.userId);
      if (active) {
        setDrafts(rows);
        setLoading(false);
      }
    }
    setLoading(true);
    void load();
    return () => {
      active = false;
    };
  }, [session?.userId]));

  return (
    <Screen>
      <Title>Creator Studio</Title>
      <Text style={styles.sub}>
        Upload short tutorials, then organize series into chapters and topics. Publish has no approval queue.
      </Text>

      <View style={styles.actions}>
        <Pressable style={styles.primaryCard} onPress={() => navigation.navigate("ShortEditor", {})}>
          <Icon name="video" size={24} color={colors.accentInk} />
          <Text style={styles.primaryTitle}>New short tutorial</Text>
          <Text style={styles.primaryMeta}>One micro lesson learners can swipe and watch</Text>
        </Pressable>
        <Pressable style={styles.secondaryCard} onPress={() => navigation.navigate("CourseStudio", {})}>
          <Icon name="course" size={22} color={colors.accent} />
          <Text style={styles.secondaryTitle}>New series</Text>
          <Text style={styles.secondaryMeta}>Chapters and topics with ordered short videos</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>Your drafts on this device</Text>
      <Banner tone="info">The API has no owner content list yet. Studio keeps drafts for this account on this phone and reloads them from the server when opened.</Banner>
      {loading ? <LoadingState /> : null}
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 32 }}>
        {!loading && !drafts.length ? <EmptyState>No studio drafts yet. Create a short tutorial to start.</EmptyState> : null}
        {drafts.map((item) => (
          <Pressable
            key={item.contentId}
            style={styles.row}
            onPress={() => {
              if (item.kind === "COURSE") navigation.navigate("CourseStudio", { contentId: item.contentId });
              else navigation.navigate("ShortEditor", { contentId: item.contentId });
            }}
          >
            <View style={styles.iconWrap}>
              <Icon name={item.kind === "COURSE" ? "course" : "video"} size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowMeta}>{item.kind === "COURSE" ? "Series" : "Short"} · {item.status}</Text>
            </View>
            <Icon name="continue" size={18} color={colors.inkMuted} />
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { color: colors.inkMuted, fontSize: 14, lineHeight: 20, marginTop: -8 },
  actions: { gap: 12 },
  primaryCard: {
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    padding: space.xl,
    gap: 8,
  },
  primaryTitle: { color: colors.accentInk, fontSize: 18, fontWeight: "800" },
  primaryMeta: { color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 18 },
  secondaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.xl,
    gap: 6,
  },
  secondaryTitle: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  secondaryMeta: { color: colors.inkMuted, fontSize: 13, lineHeight: 18 },
  section: { fontSize: 16, fontWeight: "700", color: colors.ink },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { color: colors.ink, fontWeight: "700", fontSize: 15 },
  rowMeta: { color: colors.inkMuted, fontSize: 12, fontWeight: "600" },
});
