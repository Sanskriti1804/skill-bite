import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon, type AppIcon } from "../icons";
import { colors, font, radii } from "../theme";

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
      : tone === "light" ? (active ? colors.accentAlt : "#FFFFFF")
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
  wrap: { alignItems: "center", gap: 2, width: 52 },
  circle: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  circleLight: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderColor: "rgba(255,255,255,0.35)",
  },
  circleActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  label: { fontSize: 11, fontFamily: font.medium, fontWeight: "600", color: colors.inkMuted },
  labelLight: {
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
