import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api";
import { AuthShell } from "../components/AuthShell";
import { Icon } from "../icons";
import { useSession } from "../session";
import { colors, font, radii, space } from "../theme";
import type { Me } from "../types";
import { Banner, Field } from "../ui";
import type { AuthStackParamList } from "../navigation";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const { setSession } = useSession();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError("");
    setMessage("");
    const normalizedUsername = username.trim().toLowerCase();
    const emailTrimmed = email.trim();
    if (!/^[a-z0-9_]{3,24}$/.test(normalizedUsername)) {
      setError("Username must be 3–24 characters: letters, numbers, and underscores only");
      return;
    }
    if (password.length < 8) {
      setError("Password is too weak");
      return;
    }
    setBusy(true);
    try {
      await api("/api/v1/auth/register", {
        method: "POST",
        body: {
          email: emailTrimmed,
          password,
          displayName: displayName.trim(),
          username: normalizedUsername,
          role: "CREATOR",
        },
      });

      // Sign in immediately so interest onboarding can lead into the feed.
      const result = await api<{ accessToken: string; refreshToken: string }>("/api/v1/auth/login", {
        method: "POST",
        body: { emailOrUsername: emailTrimmed || normalizedUsername, password },
      });
      let me = await api<Me>("/api/v1/me", { token: result.accessToken });
      if (me.role === "USER") {
        await api("/api/v1/me/role", {
          method: "PATCH",
          token: result.accessToken,
          body: { role: "CREATOR" },
        });
        me = { ...me, role: "CREATOR" };
      }
      await setSession({
        token: result.accessToken,
        refreshToken: result.refreshToken,
        role: me.role,
        userId: me.userId,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="Explore shorts and publish your own tutorials from day one."
      footer={(
        <Pressable style={styles.switchRow} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.switchText}>Already learning?</Text>
          <Text style={styles.switchAccent}>Sign in</Text>
        </Pressable>
      )}
    >
      <Field label="Display name" value={displayName} onChangeText={setDisplayName} />
      <Field
        label="Username"
        value={username}
        onChangeText={setUsername}
        hint="3–24 characters: letters, numbers, underscore."
      />
      <Field label="Email" value={email} onChangeText={setEmail} />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secure
        hint="At least 8 characters."
      />

      {error ? <Banner>{error}</Banner> : null}
      {message ? <Banner tone="info">{message}</Banner> : null}

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
          <Text style={styles.ctaText}>{busy ? "Creating…" : "Create account"}</Text>
          {!busy ? <Icon name="check" size={18} color={colors.accentInk} /> : null}
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
