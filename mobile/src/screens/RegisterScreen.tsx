import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api";
import { Icon } from "../icons";
import { colors, radii, space } from "../theme";
import { Banner, Button, Field, Screen } from "../ui";
import type { AuthStackParamList } from "../navigation";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError("");
    setMessage("");
    if (password.length < 8) {
      setError("Password is too weak");
      return;
    }
    setBusy(true);
    try {
      await api("/api/v1/auth/register", {
        method: "POST",
        body: {
          email: email.trim(),
          password,
          displayName: displayName.trim(),
          role: "USER",
        },
      });
      setMessage("Account created. Verify the email token from your mail, then sign in.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.mark}>
            <Icon name="learn" size={28} color={colors.accentInk} />
          </View>
          <Text style={styles.brand}>Join SkillBite</Text>
          <Text style={styles.tagline}>Create a learner account and start short educational videos.</Text>
        </View>
        <Field label="Display name" value={displayName} onChangeText={setDisplayName} />
        <Field label="Email" value={email} onChangeText={setEmail} />
        <Field label="Password" value={password} onChangeText={setPassword} secure hint="At least 8 characters." />
        {error ? <Banner>{error}</Banner> : null}
        {message ? <Banner tone="info">{message}</Banner> : null}
        <Button primary disabled={busy} onPress={() => void submit()}>{busy ? "Working…" : "Create account"}</Button>
        <Pressable onPress={() => navigation.navigate("Login")}>
          <Text style={styles.link}>Already learning? Sign in</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.lg, paddingBottom: space.xxl },
  hero: { gap: space.sm },
  mark: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { fontSize: 28, lineHeight: 34, fontWeight: "800", color: colors.ink },
  tagline: { fontSize: 15, lineHeight: 22, color: colors.inkMuted },
  link: { color: colors.accent, fontWeight: "700", fontSize: 14, textAlign: "center" },
});
