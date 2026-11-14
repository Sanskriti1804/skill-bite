import { useEffect, useRef, type ReactNode } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../icons";
import { colors, radii, space } from "../theme";

type Props = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({ eyebrow, title, subtitle, children, footer }: Props) {
  const insets = useSafeAreaInsets();
  const enter = useRef(new Animated.Value(0)).current;
  const orb = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(enter, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(orb, { toValue: 1, duration: 4200, useNativeDriver: true }),
          Animated.timing(orb, { toValue: 0, duration: 4200, useNativeDriver: true }),
        ]),
      ),
    ]).start();
  }, [enter, orb]);

  const drift = orb.interpolate({ inputRange: [0, 1], outputRange: [0, 18] });

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.orbTeal, { transform: [{ translateY: drift }] }]} />
      <Animated.View
        style={[
          styles.orbBlue,
          { transform: [{ translateY: orb.interpolate({ inputRange: [0, 1], outputRange: [10, -14] }) }] },
        ]}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.xxl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: enter,
              transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
            }}
          >
            <View style={styles.hero}>
              <View style={styles.markGlow} />
              <View style={styles.mark}>
                <Icon name="learnActive" size={30} color={colors.accentInk} />
              </View>
              <Text style={styles.brand}>SkillBite</Text>
              <Text style={styles.eyebrow}>{eyebrow}</Text>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            <View style={styles.card}>
              <LinearGradient
                colors={["rgba(26,36,56,0.96)", "rgba(18,26,42,0.98)"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.cardInner}>{children}</View>
            </View>

            <View style={styles.footer}>{footer}</View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: space.lg,
    gap: space.xl,
  },
  orbTeal: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(46,230,197,0.14)",
    top: -40,
    right: -70,
  },
  orbBlue: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(91,140,255,0.14)",
    bottom: "12%",
    left: -80,
  },
  hero: {
    alignItems: "flex-start",
    gap: space.sm,
    marginBottom: space.sm,
  },
  markGlow: {
    position: "absolute",
    top: -6,
    left: -6,
    width: 76,
    height: 76,
    borderRadius: 28,
    backgroundColor: colors.glow,
  },
  mark: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.sm,
  },
  brand: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  eyebrow: {
    marginTop: space.md,
    color: colors.accent,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  subtitle: {
    color: colors.inkMuted,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 320,
  },
  card: {
    borderRadius: radii.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(46,230,197,0.18)",
    backgroundColor: colors.surface,
  },
  cardInner: {
    padding: space.xl,
    gap: space.lg,
  },
  footer: {
    alignItems: "center",
    gap: space.md,
  },
});
