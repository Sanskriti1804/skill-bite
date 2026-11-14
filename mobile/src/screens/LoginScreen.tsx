import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api";
import { AuthShell } from "../components/AuthShell";
import { Icon } from "../icons";
import { useSession } from "../session";
import { colors, radii, space } from "../theme";
import type { Me } from "../types";
import { Banner, Field } from "../ui";
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
      let me = await api<Me>("/api/v1/me", { token: result.accessToken });
      if (me.role === "USER") {
        await api("/api/v1/me/role", { method: "PATCH", token: result.accessToken, body: { role: "CREATOR" } });
        me = await api<Me>("/api/v1/me", { token: result.accessToken });
      }
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
      eyebrow="Welcome back"
      title="Sign in to continue"
      subtitle="Pick up your shorts, playlists, and progress in one place."
      footer={(
        <Pressable style={styles.switchPill} onPress={() => navigation.navigate("Register")}>
          <Text style={styles.switchText}>New here?</Text>
          <Text style={styles.switchAccent}>Create an account</Text>
          <Icon name="continue" size={16} color={colors.accent} />
        </Pressable>
      )}
    >
      <View style={styles.fieldBlock}>
        <View style={styles.fieldIcon}>
          <Icon name="mail" size={18} color={colors.accent} />
        </View>
        <View style={styles.fieldBody}>
          <Field label="Email" value={email} onChangeText={setEmail} />
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <View style={styles.fieldIcon}>
          <Icon name="lock" size={18} color={colors.accent} />
        </View>
        <View style={styles.fieldBody}>
          <Field label="Password" value={password} onChangeText={setPassword} secure />
        </View>
      </View>

      {error ? <Banner>{error}</Banner> : null}

      <Pressable
        accessibilityRole="button"
        disabled={busy}
        style={[styles.cta, busy ? styles.ctaDisabled : null]}
        onPress={() => void submit()}
      >
        <LinearGradient
          colors={[colors.accent, "#1BC4A8"]}
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
  fieldBlock: {
    flexDirection: "row",
    gap: space.md,
    alignItems: "flex-start",
  },
  fieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    marginTop: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: "rgba(46,230,197,0.25)",
  },
  fieldBody: { flex: 1 },
  cta: {
    borderRadius: radii.pill,
    overflow: "hidden",
    marginTop: space.sm,
  },
  ctaDisabled: { opacity: 0.65 },
  ctaFill: {
    minHeight: 56,
    paddingHorizontal: space.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  ctaText: {
    color: colors.accentInk,
    fontSize: 16,
    fontWeight: "800",
  },
  switchPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radii.pill,
    backgroundColor: "rgba(18,26,42,0.72)",
    borderWidth: 1,
    borderColor: colors.line,
  },
  switchText: { color: colors.inkMuted, fontWeight: "600", fontSize: 14 },
  switchAccent: { color: colors.accent, fontWeight: "800", fontSize: 14 },
});
