import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../api";
import { Icon } from "../icons";
import { useSession } from "../session";
import { colors, radii, space } from "../theme";
import { Banner, Button, Dialog, LoadingState, Screen, Title } from "../ui";

export function AccountScreen() {
  const { session, profile, refreshProfile, setSession, signOut } = useSession();
  const [pending, setPending] = useState<"USER" | "CREATOR" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    refreshProfile()
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load account"))
      .finally(() => setLoading(false));
  }, [session, refreshProfile]);

  async function switchRole() {
    if (!pending || !session) return;
    setError("");
    try {
      await api("/api/v1/me/role", { method: "PATCH", token: session.token, body: { role: pending } });
      await setSession({ ...session, role: pending });
      await refreshProfile();
      setMessage(`Active role is ${pending}. Existing progress and content stay.`);
      setPending(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not switch");
    }
  }

  if (loading) return <Screen><LoadingState /></Screen>;

  if (!session) {
    return (
      <Screen>
        <Title>You</Title>
        <Banner tone="info">Sign in to manage your learner profile.</Banner>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 32 }}>
        <Title>You</Title>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Icon name="accountActive" size={28} color={colors.accentInk} />
          </View>
          <Text style={styles.name}>{profile?.displayName ?? "Learner"}</Text>
          <Text style={styles.meta}>{profile?.email}</Text>
          <Text style={styles.meta}>Role · {session.role}</Text>
          <Text style={styles.meta}>Status · {profile?.accountStatus ?? "Unknown"}</Text>
        </View>

        {session.role === "ADMIN" ? (
          <Banner tone="info">Admin tools stay on the web portal.</Banner>
        ) : (
          <>
            {session.role === "CREATOR" ? (
              <Banner tone="info">Creator Studio is open. Switch to User anytime to return to the Learn feed.</Banner>
            ) : (
              <Banner tone="info">Switch to Creator to open Studio and publish short tutorials.</Banner>
            )}
            <Pressable style={styles.action} onPress={() => setPending("USER")}>
              <Icon name="learn" size={20} color={colors.accent} />
              <Text style={styles.actionText}>Use as User</Text>
            </Pressable>
            <Pressable style={styles.action} onPress={() => setPending("CREATOR")}>
              <Icon name="studio" size={20} color={colors.accent} />
              <Text style={styles.actionText}>Use as Creator</Text>
            </Pressable>
          </>
        )}

        <Pressable style={styles.action} onPress={() => void signOut()}>
          <Icon name="logout" size={20} color={colors.danger} />
          <Text style={[styles.actionText, { color: colors.danger }]}>Sign out</Text>
        </Pressable>

        {message ? <Banner tone="info">{message}</Banner> : null}
        {error ? <Banner>{error}</Banner> : null}
      </ScrollView>

      {pending ? (
        <Dialog title={`Switch to ${pending}?`} onClose={() => setPending(null)}>
          <Text style={{ color: colors.ink }}>The other role’s screens hide. Progress and content remain.</Text>
          <Button primary onPress={() => void switchRole()}>Confirm switch</Button>
        </Dialog>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.xl,
    gap: 6,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  name: { fontSize: 22, fontWeight: "800", color: colors.ink },
  meta: { color: colors.inkMuted, fontSize: 13, fontWeight: "600" },
  action: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionText: { color: colors.ink, fontWeight: "700", fontSize: 15 },
});
