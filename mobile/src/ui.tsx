import { useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radii, space } from "./theme";

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
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={[
        styles.button,
        primary ? styles.primary : null,
        danger ? styles.danger : null,
        disabled ? styles.disabled : null,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.buttonText, primary || danger ? styles.onAccent : null]}>{children}</Text>
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
      <View style={styles.row}>
        <TextInput
          style={[styles.input, error ? styles.inputError : null, { flex: 1 }]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure && !show}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {secure ? (
          <Pressable style={styles.show} onPress={() => setShow((current) => !current)}>
            <Text style={styles.label}>{show ? "Hide" : "Show"}</Text>
          </Pressable>
        ) : null}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function Banner({ children, tone = "danger" }: { children: ReactNode; tone?: "danger" | "warning" | "info" }) {
  const color = tone === "warning" ? colors.warning : tone === "info" ? colors.inkMuted : colors.danger;
  return <Text style={[styles.banner, { color }]}>{children}</Text>;
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
  title: { fontSize: 28, lineHeight: 34, fontWeight: "600", color: colors.ink },
  section: { fontSize: 20, lineHeight: 26, fontWeight: "600", color: colors.ink },
  button: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: space.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  primary: { backgroundColor: colors.accent, borderColor: colors.accent },
  danger: { backgroundColor: colors.danger, borderColor: colors.danger },
  disabled: { opacity: 0.5 },
  buttonText: { color: colors.ink, fontSize: 14, fontWeight: "600", textAlign: "center" },
  onAccent: { color: colors.accentInk },
  field: { gap: space.sm },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "600", color: colors.ink },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
    color: colors.ink,
  },
  inputError: { borderColor: colors.danger },
  row: { flexDirection: "row", gap: space.sm, alignItems: "center" },
  show: { minHeight: 44, justifyContent: "center", paddingHorizontal: space.sm },
  hint: { fontSize: 13, lineHeight: 18, color: colors.inkMuted },
  error: { fontSize: 13, lineHeight: 18, color: colors.danger },
  banner: { fontSize: 14, lineHeight: 20, fontWeight: "600" },
  empty: { fontSize: 16, lineHeight: 24, color: colors.inkMuted },
  loading: { gap: space.sm, alignItems: "center", paddingVertical: space.xl },
  chip: {
    minHeight: 44,
    paddingHorizontal: space.lg,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    justifyContent: "center",
  },
  chipSelected: { borderColor: colors.accent },
  chipText: { fontSize: 14, fontWeight: "600", color: colors.ink },
  chipTextSelected: { color: colors.accent },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: space.lg,
    gap: space.sm,
  },
  cardTitle: { fontSize: 16, lineHeight: 24, fontWeight: "600", color: colors.ink },
  dialogBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20,18,16,0.45)",
    justifyContent: "center",
    padding: space.lg,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: space.lg,
    gap: space.lg,
  },
});
