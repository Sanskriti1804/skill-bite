import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api";
import { Icon } from "../icons";
import { useSession } from "../session";
import { colors, radii, space } from "../theme";
import type { Me } from "../types";
import { Banner, Button, Field, Screen } from "../ui";
import type { AuthStackParamList } from "../navigation";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { setSession } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError("");
    setBusy(true);
    try {
      const result = await api<{ accessToken: string; refreshToken: string }>("/api/v1/auth/login", {
        method: "POST",
        body: { email: email.trim(), password },
      });
      const me = await api<Me>("/api/v1/me", { token: result.accessToken });
      await setSession({
        token: result.accessToken,
        refreshToken: result.refreshToken,
        role: me.role,
        userId: me.userId,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.mark}>
            <Icon name="learnActive" size={28} color={colors.accentInk} />
          </View>
          <Text style={styles.brand}>SkillBite</Text>
          <Text style={styles.tagline}>Short lessons. Real skills. Scroll, watch, save progress.</Text>
        </View>
        <Field label="Email" value={email} onChangeText={setEmail} />
        <Field label="Password" value={password} onChangeText={setPassword} secure />
        {error ? <Banner>{error}</Banner> : null}
        <Button primary disabled={busy} onPress={() => void submit()}>{busy ? "Signing in…" : "Sign in"}</Button>
        <Pressable onPress={() => navigation.navigate("Register")}>
          <Text style={styles.link}>New here? Create a learner account</Text>
        </Pressable>
        <Text style={styles.note}>Google sign-in stays deferred until a mobile OAuth client is configured.</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.lg, paddingBottom: space.xxl },
  hero: { gap: space.sm, marginBottom: space.sm },
  mark: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { fontSize: 32, lineHeight: 38, fontWeight: "800", color: colors.ink },
  tagline: { fontSize: 15, lineHeight: 22, color: colors.inkMuted },
  link: { color: colors.accent, fontWeight: "700", fontSize: 14, textAlign: "center" },
  note: { color: colors.inkMuted, fontSize: 12, lineHeight: 18 },
});
