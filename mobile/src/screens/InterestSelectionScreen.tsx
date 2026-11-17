import { useMemo, useState } from "react";
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
import { AppLogo } from "../components/AppLogo";
import { Icon } from "../icons";
import { saveInterestIds } from "../interestsStore";
import {
  ONBOARDING_INTERESTS,
  type OnboardingInterest,
} from "../learning/onboardingInterests";
import { colors, font, radii, space } from "../theme";
import { Banner } from "../ui";

type Props = {
  userKey: string;
  onDone: () => void;
};

const GAP = space.md;
const COL_W = (Dimensions.get("window").width - space.lg * 2 - GAP) / 2;
const CARD_H = COL_W * 1.15;

export function InterestSelectionScreen({ userKey, onDone }: Props) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const left = useMemo(
    () => ONBOARDING_INTERESTS.filter((_, index) => index % 2 === 0),
    [],
  );
  const right = useMemo(
    () => ONBOARDING_INTERESTS.filter((_, index) => index % 2 === 1),
    [],
  );

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function continueNext() {
    if (!selected.size) {
      setError("Pick at least one interest to personalize your feed.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const keys = [...selected];
      const apiSlugs = ONBOARDING_INTERESTS
        .filter((item) => selected.has(item.slug) && item.apiSlug)
        .map((item) => item.apiSlug!);
      await saveInterestIds(userKey, [...new Set([...keys, ...apiSlugs])]);
      onDone();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save interests");
    } finally {
      setSaving(false);
    }
  }

  function renderCard(item: OnboardingInterest) {
    const on = selected.has(item.slug);
    return (
      <Pressable
        key={item.slug}
        style={[styles.card, on ? styles.cardOn : null]}
        onPress={() => toggle(item.slug)}
      >
        <Image source={item.image} style={styles.image} resizeMode="cover" />
        <View style={styles.cardScrim} pointerEvents="none" />
        {on ? (
          <View style={styles.check}>
            <Icon name="check" size={16} color={colors.accentInk} />
          </View>
        ) : null}
        <Text style={styles.cardName}>{item.name}</Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <AppLogo size={36} />
        <Text style={styles.brand}>SkillBite</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 108 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.copyBlock}>
          <Text style={styles.title}>What would you like to learn?</Text>
          <Text style={styles.subtitle}>
            Choose interests so we can personalize bites, courses, and recommendations.
          </Text>
        </View>

        {error ? <Banner>{error}</Banner> : null}

        <View style={styles.columns}>
          <View style={styles.column}>
            {left.map((item) => renderCard(item))}
          </View>
          <View style={[styles.column, { paddingTop: space.xl }]}>
            {right.map((item) => renderCard(item))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable
          style={[styles.cta, (!selected.size || saving) ? styles.ctaDisabled : null]}
          disabled={!selected.size || saving}
          onPress={() => void continueNext()}
        >
          <Text style={styles.ctaText}>
            {saving ? "Saving…" : `Continue${selected.size ? ` · ${selected.size}` : ""}`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  brand: { color: colors.ink, fontFamily: font.display, fontSize: 20 },
  scroll: { paddingHorizontal: space.lg, gap: space.lg },
  copyBlock: { gap: space.sm },
  title: {
    color: colors.ink,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: font.display,
  },
  subtitle: {
    color: colors.inkMuted,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: font.body,
  },
  columns: { flexDirection: "row", gap: GAP },
  column: { flex: 1, gap: GAP },
  card: {
    width: "100%",
    height: CARD_H,
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.line,
    justifyContent: "flex-end",
    backgroundColor: colors.surfaceElevated,
  },
  cardOn: { borderColor: colors.accent },
  image: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
  },
  cardScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(21,34,56,0.28)",
  },
  check: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  cardName: {
    zIndex: 1,
    color: colors.feedText,
    fontFamily: font.bold,
    fontWeight: "700",
    fontSize: 14,
    padding: space.md,
    textShadowColor: "rgba(21,34,56,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  cta: {
    minHeight: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaDisabled: { opacity: 0.55 },
  ctaText: {
    color: colors.accentInk,
    fontFamily: font.heavy,
    fontWeight: "800",
    fontSize: 15,
  },
});
