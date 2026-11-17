import { useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "./icons";
import { colors, font, radii, space } from "./theme";

export type ActionSheetAction = {
  label: string;
  onPress: () => void;
  tone?: "default" | "danger";
};

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
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.accent} />
      <Text style={styles.hint}>Loading</Text>
    </View>
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
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.sheetRoot}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View
        style={[styles.sheetPanel, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}
        accessibilityRole="summary"
      >
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>{title}</Text>
        {children}
        <Button onPress={onClose}>Close</Button>
      </View>
    </View>
  );
}

/** Calm navy bottom sheet for menus and confirms — replaces native Alert.alert. */
export function ActionSheet({
  visible,
  title,
  message,
  actions,
  onClose,
  cancelLabel = "Cancel",
}: {
  visible: boolean;
  title: string;
  message?: string;
  actions: ActionSheetAction[];
  onClose: () => void;
  cancelLabel?: string;
}) {
  const insets = useSafeAreaInsets();

  function runAction(action: ActionSheetAction) {
    onClose();
    setTimeout(() => action.onPress(), 40);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetRoot}>
        <Pressable style={styles.sheetBackdrop} onPress={onClose} />
        <View style={[styles.sheetPanel, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{title}</Text>
          {message ? <Text style={styles.sheetMessage}>{message}</Text> : null}
          <View style={styles.sheetActions}>
            {actions.map((action) => (
              <Pressable
                key={action.label}
                style={({ pressed }) => [styles.sheetAction, pressed ? styles.sheetActionPressed : null]}
                onPress={() => runAction(action)}
              >
                <Text
                  style={[
                    styles.sheetActionText,
                    action.tone === "danger" ? styles.sheetActionDanger : null,
                  ]}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={({ pressed }) => [styles.sheetCancel, pressed ? styles.sheetActionPressed : null]}
            onPress={onClose}
          >
            <Text style={styles.sheetCancelText}>{cancelLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: space.lg, gap: space.lg },
  title: { fontSize: 30, lineHeight: 38, fontFamily: font.display, color: colors.ink, textAlign: "center" },
  section: { fontSize: 20, lineHeight: 26, fontFamily: font.display, color: colors.ink },
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
  buttonText: { color: colors.ink, fontSize: 15, fontFamily: font.bold, fontWeight: "700", textAlign: "center" },
  onAccent: { color: colors.accentInk },
  field: { gap: space.sm },
  label: { fontSize: 13, lineHeight: 18, fontFamily: font.bold, fontWeight: "700", color: colors.inkMuted },
  inputWrap: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    justifyContent: "center",
  },
  input: {
    minHeight: 50,
    paddingHorizontal: space.lg,
    color: colors.ink,
    fontFamily: font.body,
    fontSize: 15,
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
  hint: { fontSize: 13, lineHeight: 18, fontFamily: font.body, color: colors.inkMuted },
  error: { fontSize: 13, lineHeight: 18, fontFamily: font.body, color: colors.danger },
  bannerWrap: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  banner: { fontSize: 14, lineHeight: 20, fontFamily: font.bold, fontWeight: "700" },
  empty: { fontSize: 16, lineHeight: 24, fontFamily: font.body, color: colors.inkMuted },
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
  chipText: { fontSize: 14, fontFamily: font.bold, fontWeight: "700", color: colors.inkMuted },
  chipTextSelected: { color: colors.accent },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    padding: space.lg,
    gap: space.sm,
  },
  cardTitle: { fontSize: 16, lineHeight: 24, fontFamily: font.bold, fontWeight: "700", color: colors.ink },
  sheetRoot: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(21, 34, 56, 0.45)",
  },
  sheetBackdrop: { ...StyleSheet.absoluteFill },
  sheetPanel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    gap: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(27,42,74,0.18)",
    marginBottom: 4,
  },
  sheetTitle: {
    color: colors.ink,
    fontSize: 20,
    fontFamily: font.display,
    textAlign: "left",
  },
  sheetMessage: {
    color: colors.inkMuted,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: font.body,
    marginTop: -4,
  },
  sheetActions: {
    gap: space.sm,
  },
  sheetAction: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    paddingHorizontal: space.lg,
    justifyContent: "center",
  },
  sheetActionPressed: {
    backgroundColor: colors.accentSoft,
  },
  sheetActionText: {
    color: colors.ink,
    fontSize: 16,
    fontFamily: font.bold,
    fontWeight: "700",
    textAlign: "left",
  },
  sheetActionDanger: {
    color: colors.danger,
  },
  sheetCancel: {
    minHeight: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: space.xs,
  },
  sheetCancelText: {
    color: colors.inkMuted,
    fontSize: 15,
    fontFamily: font.bold,
    fontWeight: "700",
  },
});
