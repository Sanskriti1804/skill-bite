import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useFocusEffect, type CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Icon } from "../icons";
import { useSession } from "../session";
import { colors, radii, space } from "../theme";
import { Banner, LoadingState, Screen, Title } from "../ui";
import type { MainTabParamList, RootStackParamList } from "../navigation";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Create">,
  NativeStackScreenProps<RootStackParamList>
>;

export function CreateScreen({ navigation }: Props) {
  const { ensurePublisher } = useSession();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useFocusEffect(useCallback(() => {
    let active = true;
    setReady(false);
    setError("");
    void ensurePublisher()
      .then(() => {
        if (active) setReady(true);
      })
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : "Could not open Create");
      });
    return () => {
      active = false;
    };
  }, [ensurePublisher]));

  return (
    <Screen>
      <Title>Create</Title>
      <Text style={styles.sub}>
        Upload a short for Explore, or group shorts into a playlist. No approval queue.
      </Text>
      {error ? <Banner>{error}</Banner> : null}
      {!ready && !error ? <LoadingState /> : null}
      {ready ? (
        <View style={styles.actions}>
          <Pressable style={styles.primaryCard} onPress={() => navigation.navigate("ShortEditor", {})}>
            <Icon name="video" size={24} color={colors.accentInk} />
            <Text style={styles.primaryTitle}>Upload short</Text>
            <Text style={styles.primaryMeta}>One vertical clip for the Explore feed</Text>
          </Pressable>
          <Pressable style={styles.secondaryCard} onPress={() => navigation.navigate("CourseStudio", {})}>
            <Icon name="course" size={22} color={colors.accent} />
            <Text style={styles.secondaryTitle}>New playlist</Text>
            <Text style={styles.secondaryMeta}>Organize shorts into sections and ordered topics</Text>
          </Pressable>
        </View>
      ) : null}
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
});
