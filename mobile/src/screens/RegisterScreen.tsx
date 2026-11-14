import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api";
import { AuthShell } from "../components/AuthShell";
import { Icon } from "../icons";
import { colors, radii, space } from "../theme";
import { Banner, Field } from "../ui";
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
          role: "CREATOR",
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
    <AuthShell
      eyebrow="Get started"
      title="Create your account"
      subtitle="Explore shorts and publish your own tutorials from day one."
      footer={(
        <Pressable style={styles.switchPill} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.switchText}>Already learning?</Text>
          <Text style={styles.switchAccent}>Sign in</Text>
          <Icon name="continue" size={16} color={colors.accent} />
        </Pressable>
      )}
    >
      <View style={styles.fieldBlock}>
        <View style={styles.fieldIcon}>
          <Icon name="accountActive" size={18} color={colors.accent} />
        </View>
        <View style={styles.fieldBody}>
          <Field label="Display name" value={displayName} onChangeText={setDisplayName} />
        </View>
      </View>

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
          <Field label="Password" value={password} onChangeText={setPassword} secure hint="At least 8 characters." />
        </View>
      </View>

      {error ? <Banner>{error}</Banner> : null}
      {message ? <Banner tone="info">{message}</Banner> : null}

      <Pressable
        accessibilityRole="button"
        disabled={busy}
        style={[styles.cta, busy ? styles.ctaDisabled : null]}
        onPress={() => void submit()}
      >
        <LinearGradient
          colors={[colors.accentAlt, "#3D74F0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaFill}
        >
          <Text style={styles.ctaText}>{busy ? "Creating…" : "Create account"}</Text>
          {!busy ? <Icon name="check" size={18} color="#F4F7FF" /> : null}
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
    color: "#F4F7FF",
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
