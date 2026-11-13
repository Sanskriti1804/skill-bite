import { StyleSheet, View } from "react-native";

/** Lightweight top/bottom scrims without adding a gradient dependency. */
export function LinearishScrim() {
  return (
    <>
      <View pointerEvents="none" style={styles.top} />
      <View pointerEvents="none" style={styles.bottom} />
    </>
  );
}

const styles = StyleSheet.create({
  top: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 120,
    backgroundColor: "rgba(14,13,12,0.35)",
  },
  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 280,
    backgroundColor: "rgba(14,13,12,0.62)",
  },
});
