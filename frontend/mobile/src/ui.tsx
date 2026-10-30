import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export function Button({ children, onPress, primary }: { children: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable style={[styles.button, primary ? styles.primary : null]} onPress={onPress}>
      <Text style={primary ? styles.primaryText : styles.buttonText}>{children}</Text>
    </Pressable>
  );
}

export function Field({ label, value, onChangeText, secure }: { label: string; value: string; onChangeText: (value: string) => void; secure?: boolean }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChangeText} secureTextEntry={secure} autoCapitalize="none" />
    </View>
  );
}

export function Banner({ children }: { children: ReactNode }) {
  return <Text style={styles.banner}>{children}</Text>;
}

const styles = StyleSheet.create({
  button: { minHeight: 44, justifyContent: "center", paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: "#e4e0d8", backgroundColor: "#ffffff" },
  primary: { backgroundColor: "#0f6e56", borderColor: "#0f6e56" },
  buttonText: { color: "#1c1b19", fontSize: 14, fontWeight: "600" },
  primaryText: { color: "#ffffff", fontSize: 14, fontWeight: "600" },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: "600", color: "#1c1b19" },
  input: { minHeight: 44, borderWidth: 1, borderColor: "#e4e0d8", borderRadius: 8, paddingHorizontal: 12, backgroundColor: "#ffffff", color: "#1c1b19" },
  banner: { color: "#9f2d2d" },
});
