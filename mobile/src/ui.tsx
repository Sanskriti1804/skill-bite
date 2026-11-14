import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "./icons";
import { colors, motion, radii, space } from "./theme";

export function Button({
  children,
  onPress,
  primary,
  danger,
  disabled,
}: {
  children: string;
  onPress: () => void;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 0 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 6 }).start()}
      style={disabled ? styles.disabled : null}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.button,
          primary ? styles.primary : null,
          danger ? styles.danger : null,
          { transform: [{ scale }] },
        ]}
      >
        <Text style={[styles.buttonText, primary || danger ? styles.onAccent : null]}>{children}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  secure,
  hint,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secure?: boolean;
  hint?: string;
  error?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, error ? styles.inputError : null]}>
        <TextInput
          style={[styles.input, secure ? styles.inputWithEye : null]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure && !show}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={colors.inkMuted}
        />
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={show ? "Hide password" : "Show password"}
            hitSlop={8}
            style={styles.eyeBtn}
            onPress={() => setShow((current) => !current)}
          >
            <Icon name={show ? "eyeOff" : "eye"} size={20} color={colors.inkMuted} />
          </Pressable>
        ) : null}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function Banner({ children, tone = "danger" }: { children: ReactNode; tone?: "danger" | "warning" | "info" }) {
  const color = tone === "warning" ? colors.warning : tone === "info" ? colors.accent : colors.danger;
  return (
    <View style={[styles.bannerWrap, { borderColor: `${color}55`, backgroundColor: `${color}18` }]}>
      <Text style={[styles.banner, { color }]}>{children}</Text>
    </View>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <Text style={styles.empty}>{children}</Text>;
}

export function LoadingState() {
  const pulse = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: motion.slow, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: motion.slow, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View style={[styles.loading, { opacity: pulse }]}>
      <ActivityIndicator color={colors.accent} />
      <Text style={styles.hint}>Loading</Text>
    </Animated.View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={[styles.chip, selected ? styles.chipSelected : null]}
    >
      <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>{label}</Text>
    </Pressable>
  );
}

export function ContentCard({
  title,
  meta,
  onPress,
}: {
  title: string;
  meta?: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
      {meta ? <Text style={styles.hint}>{meta}</Text> : null}
    </Pressable>
  );
}

export function Screen({ children }: { children: ReactNode }) {
  return <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>{children}</SafeAreaView>;
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <View style={styles.dialogBackdrop}>
      <View style={styles.dialog} accessibilityRole="summary">
        <Text style={styles.section}>{title}</Text>
        {children}
        <Button onPress={onClose}>Close</Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: space.lg, gap: space.lg },
  title: { fontSize: 30, lineHeight: 36, fontWeight: "800", color: colors.ink, letterSpacing: -0.4 },
  section: { fontSize: 20, lineHeight: 26, fontWeight: "700", color: colors.ink },
  button: {
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: space.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceElevated,
  },
  primary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  danger: { backgroundColor: colors.danger, borderColor: colors.danger },
  disabled: { opacity: 0.5 },
  buttonText: { color: colors.ink, fontSize: 15, fontWeight: "700", textAlign: "center" },
  onAccent: { color: colors.accentInk },
  field: { gap: space.sm },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "700", color: colors.inkMuted },
  inputWrap: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    justifyContent: "center",
  },
  input: {
    minHeight: 48,
    paddingHorizontal: space.md,
    color: colors.ink,
  },
  inputWithEye: {
    paddingRight: 48,
  },
  inputError: { borderColor: colors.danger },
  eyeBtn: {
    position: "absolute",
    right: 4,
    top: 0,
    bottom: 0,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", gap: space.sm, alignItems: "center" },
  hint: { fontSize: 13, lineHeight: 18, color: colors.inkMuted },
  error: { fontSize: 13, lineHeight: 18, color: colors.danger },
  bannerWrap: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  banner: { fontSize: 14, lineHeight: 20, fontWeight: "700" },
  empty: { fontSize: 16, lineHeight: 24, color: colors.inkMuted },
  loading: { gap: space.sm, alignItems: "center", paddingVertical: space.xl },
  chip: {
    minHeight: 40,
    paddingHorizontal: space.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    justifyContent: "center",
  },
  chipSelected: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  chipText: { fontSize: 14, fontWeight: "700", color: colors.inkMuted },
  chipTextSelected: { color: colors.accent },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    padding: space.lg,
    gap: space.sm,
  },
  cardTitle: { fontSize: 16, lineHeight: 24, fontWeight: "700", color: colors.ink },
  dialogBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,15,0.72)",
    justifyContent: "center",
    padding: space.lg,
  },
  dialog: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    gap: space.lg,
  },
});
