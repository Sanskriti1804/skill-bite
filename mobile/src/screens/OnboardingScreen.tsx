import { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ListViewToken,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppLogo } from "../components/AppLogo";
import { Icon, type AppIcon } from "../icons";
import { saveOnboardingDone } from "../onboardingStore";
import { colors, font, radii, space } from "../theme";

type Slide = {
  key: string;
  title: string;
  body: string;
  icon: AppIcon;
};

const slides: Slide[] = [
  {
    key: "watch",
    title: "Scroll short lessons",
    body: "Home is a vertical feed of micro tutorials. Watch, swipe, and keep going.",
    icon: "play",
  },
  {
    key: "create",
    title: "Create in one tap",
    body: "Upload your own shorts, add categories and labels, then publish without an approval queue.",
    icon: "createActive",
  },
  {
    key: "grow",
    title: "Save and grow",
    body: "Bookmark what matters, resume history, and organize courses like a creator studio.",
    icon: "bookmarkActive",
  },
];

type Props = {
  onDone: () => void;
};

const width = Dimensions.get("window").width;

export function OnboardingScreen({ onDone }: Props) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ListViewToken[] }) => {
    const first = viewableItems[0];
    if (typeof first?.index === "number") setIndex(first.index);
  }).current;

  async function finish() {
    await saveOnboardingDone();
    onDone();
  }

  function next() {
    if (index >= slides.length - 1) {
      void finish();
      return;
    }
    const nextIndex = index + 1;
    listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    setIndex(nextIndex);
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.top, { paddingTop: insets.top + space.lg }]}>
        <View style={styles.headerSide} />
        <View style={styles.brandRow}>
          <AppLogo size={36} />
          <Text style={styles.brand}>SkillBite</Text>
        </View>
        <Pressable style={styles.headerSide} onPress={() => void finish()} hitSlop={12}>
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        onMomentumScrollEnd={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
          setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
        }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.iconOrb}>
              <View style={styles.iconCore}>
                <Icon name={item.icon} size={34} color={colors.accentInk} />
              </View>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.xl }]}>
        <View style={styles.dots}>
          {slides.map((slide, slideIndex) => {
            const active = slideIndex === index;
            return <View key={slide.key} style={[styles.dot, active ? styles.dotOn : null]} />;
          })}
        </View>
        <Pressable style={styles.cta} onPress={next}>
          <Text style={styles.ctaText}>{index === slides.length - 1 ? "Get started" : "Continue"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: {
    paddingHorizontal: space.xl,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: space.md,
  },
  headerSide: { width: 56, alignItems: "flex-end" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  brand: { color: colors.ink, fontSize: 18, fontFamily: font.display },
  skip: { color: colors.inkMuted, fontFamily: font.bold, fontWeight: "700", fontSize: 14 },
  slide: {
    paddingHorizontal: space.xxl,
    justifyContent: "center",
    alignItems: "center",
    gap: space.lg,
  },
  iconOrb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.sm,
  },
  iconCore: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    lineHeight: 38,
    fontFamily: font.display,
    letterSpacing: -0.4,
    textAlign: "center",
  },
  body: {
    color: colors.inkMuted,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: font.body,
    textAlign: "center",
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: space.xl,
    gap: space.lg,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: space.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.line,
  },
  dotOn: {
    width: 22,
    backgroundColor: colors.accent,
  },
  cta: {
    minHeight: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: colors.accentInk,
    fontSize: 16,
    fontFamily: font.heavy,
    fontWeight: "800",
  },
});
