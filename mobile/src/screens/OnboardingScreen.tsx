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
  type ViewToken,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, type AppIcon } from "../icons";
import { saveOnboardingDone } from "../onboardingStore";
import { colors, radii, space } from "../theme";

type Slide = {
  key: string;
  title: string;
  body: string;
  icon: AppIcon;
  accent: string;
};

const slides: Slide[] = [
  {
    key: "watch",
    title: "Scroll short lessons",
    body: "Home is a vertical feed of micro tutorials. Watch, swipe, and keep going.",
    icon: "play",
    accent: colors.accent,
  },
  {
    key: "create",
    title: "Create in one tap",
    body: "Upload your own shorts, add categories and labels, then publish without an approval queue.",
    icon: "createActive",
    accent: colors.accentAlt,
  },
  {
    key: "grow",
    title: "Save and grow",
    body: "Bookmark what matters, resume history, and organize playlists like a creator studio.",
    icon: "bookmarkActive",
    accent: colors.warning,
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
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
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
      <View style={[styles.top, { paddingTop: insets.top + space.md }]}>
        <Text style={styles.brand}>SkillBite</Text>
        <Pressable onPress={() => void finish()} hitSlop={12}>
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
            <View style={[styles.iconOrb, { backgroundColor: `${item.accent}22`, borderColor: `${item.accent}55` }]}>
              <View style={[styles.iconCore, { backgroundColor: item.accent }]}>
                <Icon name={item.icon} size={34} color={item.accent === colors.warning ? "#1A1400" : colors.accentInk} />
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
          <LinearGradient
            colors={[colors.accent, "#1BC4A8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaFill}
          >
            <Text style={styles.ctaText}>{index === slides.length - 1 ? "Get started" : "Continue"}</Text>
          </LinearGradient>
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
  },
  brand: { color: colors.ink, fontSize: 18, fontWeight: "800" },
  skip: { color: colors.inkMuted, fontWeight: "700", fontSize: 14 },
  slide: {
    paddingHorizontal: space.xxl,
    justifyContent: "center",
    gap: space.lg,
  },
  iconOrb: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: space.md,
  },
  iconCore: {
    width: 78,
    height: 78,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.ink,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  body: {
    color: colors.inkMuted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: space.xl,
    gap: space.lg,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
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
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  ctaFill: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: colors.accentInk,
    fontSize: 16,
    fontWeight: "800",
  },
});
