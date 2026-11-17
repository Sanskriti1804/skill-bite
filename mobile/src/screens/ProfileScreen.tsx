import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useFocusEffect, type CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api";
import { Icon } from "../icons";
import { contentApi, type OwnedContent } from "../services/content";
import { useSession } from "../session";
import { colors, font, radii, space } from "../theme";
import { ActionSheet, type ActionSheetAction, Banner, EmptyState, LoadingState } from "../ui";
import type { MainTabParamList, RootStackParamList } from "../navigation";

type SheetState = {
  title: string;
  message?: string;
  actions: ActionSheetAction[];
} | null;

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Profile">,
  NativeStackScreenProps<RootStackParamList>
>;

type TabKey = "posts" | "courses" | "drafts";

const COLS = 3;
const TILE = Math.floor(Dimensions.get("window").width / COLS);

function ProfileTile({
  item,
  badge,
  onPress,
  onLongPress,
}: {
  item: OwnedContent;
  badge?: string;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const uri = item.thumbnailUrl?.trim() || "";
  const showImage = Boolean(uri) && !failed;

  return (
    <Pressable style={styles.tile} onPress={onPress} onLongPress={onLongPress}>
      {showImage ? (
        <Image
          source={{ uri }}
          style={styles.tileImage}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={styles.tileFallback}>
          <Icon
            name={item.contentType === "COURSE" ? "course" : "video"}
            size={28}
            color={colors.feedMuted}
          />
        </View>
      )}
      {badge ? (
        <View style={styles.tileBadge}>
          <Text style={styles.tileBadgeText}>{badge}</Text>
        </View>
      ) : null}
      {item.contentType === "VIDEO" ? (
        <View style={styles.tilePlay}>
          <Icon name="play" size={12} color="#fff" />
        </View>
      ) : null}
    </Pressable>
  );
}

export function ProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { session, profile, refreshProfile, ensurePublisher, signOut } = useSession();
  const [items, setItems] = useState<OwnedContent[]>([]);
  const [watchingCount, setWatchingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [tab, setTab] = useState<TabKey>("posts");
  const [editOpen, setEditOpen] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState<SheetState>(null);

  useEffect(() => {
    setUsernameDraft(profile?.username ?? "");
  }, [profile?.username]);

  const load = useCallback(async () => {
    if (!session?.token) {
      setItems([]);
      setWatchingCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await ensurePublisher();
      const [, result, bookmarks] = await Promise.all([
        refreshProfile(),
        contentApi.mine(session.token),
        api<{ items: { contentId: string }[] }>("/api/v1/me/bookmarks", { token: session.token }),
      ]);
      setItems(result.items.filter((item) => item.status !== "REMOVED"));
      setWatchingCount(bookmarks.items.length);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load profile");
    } finally {
      setLoading(false);
    }
  }, [ensurePublisher, refreshProfile, session?.token]);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  const publishedShorts = useMemo(
    () => items.filter((item) => item.contentType === "VIDEO" && item.status === "PUBLISHED"),
    [items],
  );
  const draftShorts = useMemo(
    () => items.filter((item) => item.contentType === "VIDEO" && item.status !== "PUBLISHED"),
    [items],
  );
  const playlists = useMemo(
    () => items.filter((item) => item.contentType === "COURSE"),
    [items],
  );

  async function removeItem(item: OwnedContent) {
    if (!session?.token) return;
    setBusyId(item.contentId);
    setError("");
    try {
      await ensurePublisher();
      if (item.contentType === "COURSE") {
        await contentApi.deleteCourse(session.token, item.contentId);
        setMessage("Course deleted.");
      } else {
        await contentApi.deleteVideo(session.token, item.contentId);
        setMessage("Short deleted.");
      }
      setItems((current) => current.filter((row) => row.contentId !== item.contentId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete content");
    } finally {
      setBusyId("");
    }
  }

  function confirmDelete(item: OwnedContent) {
    const isCourse = item.contentType === "COURSE";
    setSheet({
      title: isCourse ? "Delete course?" : "Delete short?",
      message: isCourse
        ? "This permanently deletes the course. Shorts stay in your library."
        : `"${item.description || item.title || "Untitled short"}" will be deleted.`,
      actions: [
        {
          label: "Delete",
          tone: "danger",
          onPress: () => void removeItem(item),
        },
      ],
    });
  }

  function openItemMenu(item: OwnedContent) {
    const isCourse = item.contentType === "COURSE";
    setSheet({
      title: isCourse ? item.title || "Course" : "Short",
      actions: [
        {
          label: "Edit",
          onPress: () =>
            navigation.navigate(isCourse ? "CourseStudio" : "ShortEditor", {
              contentId: item.contentId,
            }),
        },
        {
          label: "Delete",
          tone: "danger",
          onPress: () => confirmDelete(item),
        },
      ],
    });
  }

  async function saveUsername() {
    if (!session?.token) return;
    const next = usernameDraft.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(next)) {
      setError("Username must be 3–24 characters: letters, numbers, and underscores only");
      return;
    }
    if (next === profile?.username) {
      setEditOpen(false);
      return;
    }
    setSavingUsername(true);
    setError("");
    setMessage("");
    try {
      await api("/api/v1/me/username", {
        method: "PATCH",
        token: session.token,
        body: { username: next },
      });
      await refreshProfile();
      setMessage("Username updated.");
      setEditOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update username");
    } finally {
      setSavingUsername(false);
    }
  }

  function openMenu() {
    setSheet({
      title: "Account",
      actions: [
        {
          label: "Edit profile",
          onPress: () => {
            setUsernameDraft(profile?.username ?? "");
            setEditOpen(true);
          },
        },
        {
          label: "Watching list",
          onPress: () => navigation.navigate("Bookmarks"),
        },
        {
          label: "History",
          onPress: () => navigation.navigate("History"),
        },
        {
          label: "Notifications",
          onPress: () => navigation.navigate("Notifications"),
        },
        {
          label: "Sign out",
          tone: "danger",
          onPress: () => void signOut(),
        },
      ],
    });
  }

  if (!session) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Text style={styles.topUsername}>Profile</Text>
        <Banner tone="info">Sign in to see your profile.</Banner>
      </View>
    );
  }

  const gridItems =
    tab === "posts" ? publishedShorts : tab === "courses" ? playlists : draftShorts;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Text style={styles.topUsername} numberOfLines={1}>
          {profile?.username || "username"}
        </Text>
        <View style={styles.topActions}>
          <Pressable
            hitSlop={10}
            style={styles.iconBtn}
            onPress={() => navigation.navigate("ShortEditor", {})}
          >
            <Icon name="create" size={24} color={colors.ink} />
          </Pressable>
          <Pressable hitSlop={10} style={styles.iconBtn} onPress={openMenu}>
            <Icon name="menu" size={26} color={colors.ink} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>
                {(profile?.displayName || profile?.username || "S").slice(0, 1).toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{publishedShorts.length}</Text>
              <Text style={styles.statLabel}>shorts</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{playlists.length}</Text>
              <Text style={styles.statLabel}>courses</Text>
            </View>
            <Pressable style={styles.stat} onPress={() => navigation.navigate("Bookmarks")}>
              <Text style={styles.statValue}>{watchingCount}</Text>
              <Text style={styles.statLabel}>watching</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.bioBlock}>
          <Text style={styles.displayName}>{profile?.displayName || "You"}</Text>
          <Text style={styles.bioMeta}>@{profile?.username || "username"}</Text>
          {draftShorts.length ? (
            <Text style={styles.bioMeta}>{draftShorts.length} draft{draftShorts.length === 1 ? "" : "s"}</Text>
          ) : null}
        </View>

        <View style={styles.editRow}>
          <Pressable
            style={styles.editBtn}
            onPress={() => {
              setUsernameDraft(profile?.username ?? "");
              setEditOpen(true);
            }}
          >
            <Text style={styles.editBtnText}>Edit profile</Text>
          </Pressable>
          <Pressable style={styles.editBtn} onPress={() => navigation.navigate("CourseStudio", {})}>
            <Text style={styles.editBtnText}>New course</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.highlights}
        >
          <Pressable style={styles.highlight} onPress={() => navigation.navigate("Bookmarks")}>
            <View style={styles.highlightCircle}>
              <Icon name="bookmark" size={22} color={colors.accent} />
            </View>
            <Text style={styles.highlightLabel} numberOfLines={1}>Watching</Text>
          </Pressable>
          <Pressable style={styles.highlight} onPress={() => navigation.navigate("History")}>
            <View style={styles.highlightCircle}>
              <Icon name="history" size={22} color={colors.accent} />
            </View>
            <Text style={styles.highlightLabel} numberOfLines={1}>History</Text>
          </Pressable>
          <Pressable style={styles.highlight} onPress={() => navigation.navigate("Notifications")}>
            <View style={styles.highlightCircle}>
              <Icon name="alerts" size={22} color={colors.accent} />
            </View>
            <Text style={styles.highlightLabel} numberOfLines={1}>Alerts</Text>
          </Pressable>
          <Pressable
            style={styles.highlight}
            onPress={() => navigation.navigate("ShortEditor", {})}
          >
            <View style={[styles.highlightCircle, styles.highlightAdd]}>
              <Icon name="add" size={26} color={colors.accent} />
            </View>
            <Text style={styles.highlightLabel} numberOfLines={1}>New</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.tabs}>
          <Pressable style={styles.tab} onPress={() => setTab("posts")}>
            <Icon name={tab === "posts" ? "gridActive" : "grid"} size={22} color={tab === "posts" ? colors.ink : colors.inkMuted} />
            {tab === "posts" ? <View style={styles.tabUnderline} /> : null}
          </Pressable>
          <Pressable style={styles.tab} onPress={() => setTab("courses")}>
            <Icon name="course" size={22} color={tab === "courses" ? colors.ink : colors.inkMuted} />
            {tab === "courses" ? <View style={styles.tabUnderline} /> : null}
          </Pressable>
          <Pressable style={styles.tab} onPress={() => setTab("drafts")}>
            <Icon name="video" size={22} color={tab === "drafts" ? colors.ink : colors.inkMuted} />
            {tab === "drafts" ? <View style={styles.tabUnderline} /> : null}
          </Pressable>
        </View>

        {message ? (
          <View style={styles.bannerPad}>
            <Banner tone="info">{message}</Banner>
          </View>
        ) : null}
        {error ? (
          <View style={styles.bannerPad}>
            <Banner>{error}</Banner>
          </View>
        ) : null}

        {loading ? <LoadingState /> : null}

        {!loading && !gridItems.length ? (
          <View style={styles.empty}>
            <EmptyState>
              {tab === "posts"
                ? "No published shorts yet."
                : tab === "courses"
                  ? "No courses yet."
                  : "No drafts yet."}
            </EmptyState>
          </View>
        ) : null}

        <View style={styles.grid}>
          {gridItems.map((item) => (
            <ProfileTile
              key={item.contentId}
              item={item}
              badge={
                tab === "drafts"
                  ? "Draft"
                  : item.contentType === "COURSE"
                    ? item.status === "PUBLISHED"
                      ? "Public"
                      : "Private"
                    : undefined
              }
              onPress={() => {
                if (item.contentType === "COURSE") {
                  navigation.navigate("CourseStudio", { contentId: item.contentId });
                  return;
                }
                if (item.status === "PUBLISHED") {
                  navigation.navigate("Watch", { contentId: item.contentId });
                  return;
                }
                navigation.navigate("ShortEditor", { contentId: item.contentId });
              }}
              onLongPress={() => {
                if (busyId) return;
                openItemMenu(item);
              }}
            />
          ))}
        </View>
      </ScrollView>

      <Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setEditOpen(false)} />
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Edit profile</Text>
            <Text style={styles.modalHint}>Change your unique username used to sign in.</Text>
            <TextInput
              value={usernameDraft}
              onChangeText={setUsernameDraft}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="username"
              placeholderTextColor={colors.inkMuted}
              style={styles.modalInput}
            />
            <Pressable
              style={[styles.modalSave, savingUsername ? styles.modalSaveDisabled : null]}
              disabled={savingUsername}
              onPress={() => void saveUsername()}
            >
              <Text style={styles.modalSaveText}>{savingUsername ? "Saving…" : "Save"}</Text>
            </Pressable>
            <Pressable style={styles.modalCancel} onPress={() => setEditOpen(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ActionSheet
        visible={Boolean(sheet)}
        title={sheet?.title ?? ""}
        message={sheet?.message}
        actions={sheet?.actions ?? []}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    minHeight: 48,
  },
  topUsername: {
    flex: 1,
    color: colors.ink,
    fontSize: 22,
    fontFamily: font.heavy,
    fontWeight: "800",
  },
  topActions: { flexDirection: "row", alignItems: "center", gap: space.xs },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { paddingBottom: 24 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.lg,
    gap: space.md,
    marginTop: space.md,
  },
  avatarRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    padding: 3,
    borderWidth: 2,
    borderColor: colors.accentAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    color: colors.accentInk,
    fontSize: 34,
    fontFamily: font.heavy,
    fontWeight: "800",
  },
  statsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  stat: { alignItems: "center", minWidth: 64 },
  statValue: {
    color: colors.ink,
    fontSize: 18,
    fontFamily: font.heavy,
    fontWeight: "800",
  },
  statLabel: {
    color: colors.inkMuted,
    fontSize: 12,
    fontFamily: font.medium,
    fontWeight: "600",
    marginTop: 2,
  },
  bioBlock: {
    paddingHorizontal: space.lg,
    marginTop: space.md,
    gap: 2,
  },
  displayName: {
    color: colors.ink,
    fontSize: 15,
    fontFamily: font.bold,
    fontWeight: "700",
  },
  bioMeta: {
    color: colors.inkMuted,
    fontSize: 13,
    fontFamily: font.medium,
    fontWeight: "600",
  },
  editRow: {
    flexDirection: "row",
    gap: space.sm,
    paddingHorizontal: space.lg,
    marginTop: space.md,
  },
  editBtn: {
    flex: 1,
    minHeight: 34,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  editBtnText: {
    color: colors.ink,
    fontSize: 13,
    fontFamily: font.bold,
    fontWeight: "700",
  },
  highlights: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.sm,
    gap: space.md,
  },
  highlight: { width: 72, alignItems: "center", gap: space.sm },
  highlightCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  highlightAdd: { borderStyle: "dashed" },
  highlightLabel: {
    color: colors.ink,
    fontSize: 11,
    fontFamily: font.medium,
    fontWeight: "600",
    textAlign: "center",
  },
  tabs: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    marginTop: space.sm,
  },
  tab: {
    flex: 1,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  tabUnderline: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1.5,
    backgroundColor: colors.ink,
  },
  bannerPad: { paddingHorizontal: space.lg, paddingTop: space.sm },
  empty: { paddingVertical: space.xxl, paddingHorizontal: space.lg },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tile: {
    width: TILE,
    height: Math.round(TILE * (4 / 3)),
    backgroundColor: colors.videoBg,
    overflow: "hidden",
  },
  tileImage: {
    width: "100%",
    height: "100%",
  },
  tileFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.videoBg,
  },
  tileBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tileBadgeText: {
    color: colors.feedText,
    fontSize: 10,
    fontFamily: font.bold,
    fontWeight: "700",
  },
  tilePlay: {
    position: "absolute",
    top: 6,
    right: 6,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(21, 34, 56, 0.45)",
  },
  modalBackdrop: { ...StyleSheet.absoluteFill },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    gap: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  modalHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(27,42,74,0.18)",
    marginBottom: 4,
  },
  modalTitle: {
    color: colors.ink,
    fontSize: 20,
    fontFamily: font.display,
  },
  modalHint: {
    color: colors.inkMuted,
    fontSize: 13,
    fontFamily: font.body,
    marginTop: -4,
  },
  modalInput: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    color: colors.ink,
    fontFamily: font.body,
    fontSize: 16,
  },
  modalSave: {
    minHeight: 48,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveDisabled: { opacity: 0.65 },
  modalSaveText: {
    color: colors.accentInk,
    fontFamily: font.heavy,
    fontWeight: "800",
    fontSize: 15,
  },
  modalCancel: {
    alignItems: "center",
    paddingVertical: 8,
  },
  modalCancelText: {
    color: colors.inkMuted,
    fontFamily: font.bold,
    fontWeight: "700",
    fontSize: 14,
  },
});
