import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon, type AppIcon } from "../icons";
import { colors, radii } from "../theme";

type Props = {
  icon: AppIcon;
  label?: string;
  onPress: () => void;
  active?: boolean;
  tone?: "light" | "dark" | "accent";
  size?: number;
};

export function IconButton({ icon, label, onPress, active, tone = "dark", size = 26 }: Props) {
  const color =
    tone === "accent" ? colors.accent
      : tone === "light" ? colors.feedText
        : active ? colors.accent : colors.ink;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.wrap}>
      <View style={[styles.circle, tone === "light" ? styles.circleLight : null, active ? styles.circleActive : null]}>
        <Icon name={icon} size={size} color={color} />
      </View>
      {label ? <Text style={[styles.label, tone === "light" ? styles.labelLight : null]}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 4, minWidth: 56 },
  circle: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  circleLight: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderColor: "transparent",
  },
  circleActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  label: { fontSize: 12, fontWeight: "600", color: colors.inkMuted },
  labelLight: { color: colors.feedMuted },
});
