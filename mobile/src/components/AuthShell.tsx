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
import { AppLogo } from "./AppLogo";
import { colors, font, space } from "../theme";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: Props) {
  const insets = useSafeAreaInsets();
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, [enter]);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orbA} />
      <View style={styles.orbB} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + space.xxl,
              paddingBottom: insets.bottom + space.xxl,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
        >
          <Animated.View
            style={[
              styles.stack,
              {
                opacity: enter,
                transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
              },
            ]}
          >
            <View style={styles.brandRow}>
              <AppLogo size={36} />
              <Text style={styles.brand}>SkillBite</Text>
            </View>

            <View style={styles.hero}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            <View style={styles.form}>{children}</View>

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
    flexGrow: 1,
    paddingHorizontal: space.xl,
    justifyContent: "center",
  },
  stack: {
    gap: space.xl,
  },
  orbA: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(59,130,196,0.14)",
    top: -60,
    right: -80,
  },
  orbB: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(27,42,74,0.06)",
    bottom: "10%",
    left: -70,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  brand: {
    color: colors.ink,
    fontSize: 22,
    fontFamily: font.display,
    letterSpacing: -0.3,
  },
  hero: {
    gap: space.sm,
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    lineHeight: 36,
    fontFamily: font.display,
    letterSpacing: -0.6,
  },
  subtitle: {
    color: colors.inkMuted,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: font.body,
    maxWidth: 340,
  },
  form: {
    gap: space.lg,
  },
  footer: {
    alignItems: "center",
    paddingTop: space.sm,
  },
});
