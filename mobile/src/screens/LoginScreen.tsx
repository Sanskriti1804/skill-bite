import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api";
import { AuthShell } from "../components/AuthShell";
import { Icon } from "../icons";
import { loadInterestIds, saveInterestIds } from "../interestsStore";
import { useSession } from "../session";
import { colors, font, radii, space } from "../theme";
import type { Me } from "../types";
import { Banner, Field } from "../ui";
import type { AuthStackParamList } from "../navigation";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { setSession } = useSession();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError("");
    setBusy(true);
    try {
      const result = await api<{ accessToken: string; refreshToken: string }>("/api/v1/auth/login", {
        method: "POST",
        body: { emailOrUsername: emailOrUsername.trim(), password },
      });
      let me = await api<Me>("/api/v1/me", { token: result.accessToken });
      if (me.role === "USER") {
        await api("/api/v1/me/role", { method: "PATCH", token: result.accessToken, body: { role: "CREATOR" } });
        me = { ...me, role: "CREATOR" };
      }
      const pending = await loadInterestIds(me.username);
      if (pending?.length) await saveInterestIds(me.userId, pending);
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
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to pick up your shorts, courses, and progress."
      footer={(
        <Pressable style={styles.switchRow} onPress={() => navigation.navigate("Register")}>
          <Text style={styles.switchText}>New here?</Text>
          <Text style={styles.switchAccent}>Create an account</Text>
        </Pressable>
      )}
    >
      <Field label="Email or username" value={emailOrUsername} onChangeText={setEmailOrUsername} />
      <Field label="Password" value={password} onChangeText={setPassword} secure />

      {error ? <Banner>{error}</Banner> : null}

      <Pressable
        accessibilityRole="button"
        disabled={busy}
        style={[styles.cta, busy ? styles.ctaDisabled : null]}
        onPress={() => void submit()}
      >
        <LinearGradient
          colors={[colors.accentAlt, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaFill}
        >
          <Text style={styles.ctaText}>{busy ? "Signing in…" : "Sign in"}</Text>
          {!busy ? <Icon name="continue" size={18} color={colors.accentInk} /> : null}
        </LinearGradient>
      </Pressable>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  cta: {
    borderRadius: radii.pill,
    overflow: "hidden",
    marginTop: space.xs,
  },
  ctaDisabled: { opacity: 0.65 },
  ctaFill: {
    minHeight: 54,
    paddingHorizontal: space.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  ctaText: {
    color: colors.accentInk,
    fontSize: 16,
    fontFamily: font.heavy,
    fontWeight: "800",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: space.sm,
  },
  switchText: { color: colors.inkMuted, fontFamily: font.medium, fontWeight: "600", fontSize: 14 },
  switchAccent: { color: colors.accent, fontFamily: font.heavy, fontWeight: "800", fontSize: 14 },
});
