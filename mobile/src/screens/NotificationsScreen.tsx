import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api";
import { Icon } from "../icons";
import { useSession } from "../session";
import { colors, radii, space } from "../theme";
import type { NotificationItem } from "../types";
import { Banner, EmptyState, LoadingState, Screen, Title } from "../ui";
import type { RootStackParamList } from "../navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Notifications">;

export function NotificationsScreen({ navigation }: Props) {
  const { session } = useSession();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [pushNote, setPushNote] = useState("");

  const load = useCallback(async () => {
    if (!session?.token) {
      setItems([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setError("");
    try {
      const result = await api<{ items: NotificationItem[] }>("/api/v1/notifications", { token: session.token });
      setItems(result.items);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.token]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  async function markRead(notificationId: string) {
    if (!session?.token) return;
    await api(`/api/v1/notifications/${notificationId}/read`, { method: "POST", token: session.token });
    setItems((current) => current.map((item) => (
      item.notificationId === notificationId ? { ...item, readAt: new Date().toISOString() } : item
    )));
  }

  return (
    <Screen>
      <Pressable style={styles.back} onPress={() => navigation.goBack()}>
        <Icon name="back" size={20} color={colors.ink} />
        <Text style={styles.backText}>Profile</Text>
      </Pressable>
      <Title>Alerts</Title>
      <Text style={styles.sub}>Learning notices stay here. Push delivery is deferred until a provider is chosen.</Text>
      {!session ? <Banner tone="info">Sign in to see alerts.</Banner> : null}
      <Pressable
        style={styles.pushBtn}
        onPress={() => setPushNote("Push permission is requested here. Denial never blocks playback or progress.")}
      >
        <Icon name="alerts" size={18} color={colors.accent} />
        <Text style={styles.pushText}>Request push permission</Text>
      </Pressable>
      {pushNote ? <Banner tone="info">{pushNote}</Banner> : null}
      {error ? <Banner>{error}</Banner> : null}
      {loading ? <LoadingState /> : null}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
      >
        {!loading && session && !items.length ? <EmptyState>No notifications yet.</EmptyState> : null}
        {items.map((item) => (
          <View key={item.notificationId} style={styles.card}>
            <View style={styles.row}>
              <Icon name="alertsActive" size={18} color={colors.accent} />
              <Text style={styles.title}>{item.title ?? item.notificationId}</Text>
            </View>
            {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
            {item.readAt ? (
              <Text style={styles.meta}>Read</Text>
            ) : (
              <Pressable onPress={() => void markRead(item.notificationId)}>
                <Text style={styles.link}>Mark read</Text>
              </Pressable>
            )}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { color: colors.ink, fontWeight: "700" },
  sub: { color: colors.inkMuted, fontSize: 13, marginTop: -8 },
  pushBtn: {
    minHeight: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pushText: { color: colors.ink, fontWeight: "700" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    gap: 8,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { color: colors.ink, fontWeight: "700", fontSize: 15, flex: 1 },
  body: { color: colors.ink, fontSize: 14, lineHeight: 20 },
  meta: { color: colors.inkMuted, fontSize: 12 },
  link: { color: colors.accent, fontWeight: "700" },
});
