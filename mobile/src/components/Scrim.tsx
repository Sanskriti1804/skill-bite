import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme";

export function LinearishScrim() {
  return (
    <>
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(21,34,56,0.45)", "transparent"]}
        style={styles.top}
      />
      <LinearGradient
        pointerEvents="none"
        colors={["transparent", "rgba(21,34,56,0.28)", "rgba(21,34,56,0.88)"]}
        locations={[0, 0.35, 1]}
        style={styles.bottom}
      />
      <View pointerEvents="none" style={styles.edge} />
    </>
  );
}

const styles = StyleSheet.create({
  top: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 140,
  },
  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 320,
  },
  edge: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: colors.accentAlt,
  },
});
