import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../api";
import {
  openCommentSheet,
  registerCommentSheet,
  type CommentSheetRequest,
} from "../creator/commentSheetController";
import { Icon } from "../icons";
import { colors, font, radii, space } from "../theme";

export type CommentItem = {
  commentId: string;
  contentId: string;
  parentCommentId?: string | null;
  body: string;
  createdAt: string;
  userId: string;
  username: string;
  displayName: string;
  replies?: CommentItem[];
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return new Date(iso).toLocaleDateString();
}

function countAll(items: CommentItem[]): number {
  return items.reduce((sum, item) => sum + 1 + (item.replies?.length ?? 0), 0);
}

function CommentRow({
  item,
  mine,
  isReply,
  onReply,
  onDelete,
}: {
  item: CommentItem;
  mine: boolean;
  isReply?: boolean;
  onReply: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={[styles.row, isReply ? styles.replyRow : null]}>
      <View style={[styles.avatar, isReply ? styles.avatarSm : null]}>
        <Text style={[styles.avatarLetter, isReply ? styles.avatarLetterSm : null]}>
          {(item.displayName || item.username || "?").slice(0, 1).toUpperCase()}
        </Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowMeta}>
          <Text style={styles.username}>{item.username}</Text>
          {"  "}
          <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
        </Text>
        <Text style={styles.body}>{item.body}</Text>
        <View style={styles.rowActions}>
          <Pressable hitSlop={8} onPress={onReply}>
            <Text style={styles.replyBtn}>Reply</Text>
          </Pressable>
          {mine ? (
            <Pressable hitSlop={8} onPress={onDelete}>
              <Text style={styles.delete}>Delete</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function CommentSheetHost() {
  const insets = useSafeAreaInsets();
  const [request, setRequest] = useState<CommentSheetRequest | null>(null);
  const [items, setItems] = useState<CommentItem[]>([]);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    registerCommentSheet((next) => {
      setRequest(next);
      setDraft("");
      setReplyTo(null);
      setExpanded({});
      setError("");
      setItems([]);
      void loadComments(next);
    });
    return () => registerCommentSheet(null);
  }, []);

  async function loadComments(next: CommentSheetRequest) {
    setLoading(true);
    setError("");
    try {
      const result = await api<{ items: CommentItem[]; total?: number }>(
        `/api/v1/content/${next.contentId}/comments`,
        { token: next.token },
      );
      setItems(result.items);
      next.onCountChange?.(result.total ?? countAll(result.items));
      const open: Record<string, boolean> = {};
      for (const item of result.items) {
        if ((item.replies?.length ?? 0) > 0) open[item.commentId] = true;
      }
      setExpanded(open);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not load comments";
      setError(message);
      next.onError?.(message);
    } finally {
      setLoading(false);
    }
  }

  function close() {
    if (sending) return;
    setRequest(null);
    setDraft("");
    setReplyTo(null);
    setError("");
  }

  function notifyCount(nextItems: CommentItem[]) {
    request?.onCountChange?.(countAll(nextItems));
  }

  async function send() {
    if (!request) return;
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    setError("");
    try {
      const created = await api<CommentItem>(`/api/v1/content/${request.contentId}/comments`, {
        method: "POST",
        token: request.token,
        body: {
          body,
          parentCommentId: replyTo?.commentId ?? undefined,
        },
      });
      setItems((current) => {
        let next: CommentItem[];
        if (created.parentCommentId) {
          next = current.map((item) => {
            if (item.commentId !== created.parentCommentId) return item;
            return {
              ...item,
              replies: [...(item.replies ?? []), { ...created, replies: [] }],
            };
          });
          setExpanded((map) => ({ ...map, [created.parentCommentId!]: true }));
        } else {
          next = [{ ...created, replies: [] }, ...current];
        }
        notifyCount(next);
        return next;
      });
      setDraft("");
      setReplyTo(null);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not post comment";
      setError(message);
      request.onError?.(message);
    } finally {
      setSending(false);
    }
  }

  async function remove(commentId: string) {
    if (!request) return;
    setError("");
    try {
      await api(`/api/v1/comments/${commentId}`, {
        method: "DELETE",
        token: request.token,
      });
      setItems((current) => {
        const next = current
          .filter((item) => item.commentId !== commentId)
          .map((item) => ({
            ...item,
            replies: (item.replies ?? []).filter((reply) => reply.commentId !== commentId),
          }));
        notifyCount(next);
        return next;
      });
      if (replyTo?.commentId === commentId) setReplyTo(null);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not delete comment";
      setError(message);
      request.onError?.(message);
    }
  }

  const visible = Boolean(request);
  const placeholder = replyTo
    ? `Reply to @${replyTo.username}…`
    : "Add a comment…";
  const totalLabel = useMemo(() => countAll(items), [items]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>
              Comments{totalLabel ? ` · ${totalLabel}` : ""}
            </Text>
            <Pressable style={styles.closeBtn} onPress={close} hitSlop={10}>
              <Icon name="close" size={18} color={colors.ink} />
            </Pressable>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => item.commentId}
              style={styles.list}
              contentContainerStyle={items.length ? styles.listContent : styles.emptyContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No comments yet. Be the first.</Text>
              }
              renderItem={({ item }) => {
                const mine = Boolean(request?.currentUserId && item.userId === request.currentUserId);
                const replies = item.replies ?? [];
                const showReplies = expanded[item.commentId] ?? false;
                return (
                  <View style={styles.thread}>
                    <CommentRow
                      item={item}
                      mine={mine}
                      onReply={() => setReplyTo(item)}
                      onDelete={() => void remove(item.commentId)}
                    />
                    {replies.length ? (
                      <Pressable
                        style={styles.viewReplies}
                        onPress={() =>
                          setExpanded((map) => ({
                            ...map,
                            [item.commentId]: !showReplies,
                          }))
                        }
                      >
                        <View style={styles.replyLine} />
                        <Text style={styles.viewRepliesText}>
                          {showReplies
                            ? "Hide replies"
                            : `View ${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
                        </Text>
                      </Pressable>
                    ) : null}
                    {showReplies
                      ? replies.map((reply) => (
                          <CommentRow
                            key={reply.commentId}
                            item={reply}
                            isReply
                            mine={Boolean(
                              request?.currentUserId && reply.userId === request.currentUserId,
                            )}
                            onReply={() => setReplyTo(item)}
                            onDelete={() => void remove(reply.commentId)}
                          />
                        ))
                      : null}
                  </View>
                );
              }}
            />
          )}

          {replyTo ? (
            <View style={styles.replyBanner}>
              <Text style={styles.replyBannerText} numberOfLines={1}>
                Replying to @{replyTo.username}
              </Text>
              <Pressable hitSlop={8} onPress={() => setReplyTo(null)}>
                <Icon name="close" size={16} color={colors.inkMuted} />
              </Pressable>
            </View>
          ) : null}

          <View style={styles.composer}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={placeholder}
              placeholderTextColor={colors.inkMuted}
              style={styles.input}
              maxLength={500}
              multiline
              editable={!sending}
            />
            <Pressable
              style={[styles.send, (!draft.trim() || sending) ? styles.sendDisabled : null]}
              disabled={!draft.trim() || sending}
              onPress={() => void send()}
            >
              <Text style={styles.sendText}>{sending ? "…" : "Post"}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export { openCommentSheet };

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(21, 34, 56, 0.45)",
  },
  backdrop: { ...StyleSheet.absoluteFill },
  sheet: {
    maxHeight: "78%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(27,42,74,0.18)",
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space.sm,
  },
  title: {
    color: colors.ink,
    fontSize: 20,
    fontFamily: font.display,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
  },
  list: { flexGrow: 0, maxHeight: 400 },
  listContent: { paddingBottom: space.sm, gap: 16 },
  emptyContent: { paddingVertical: 40, alignItems: "center" },
  emptyText: {
    color: colors.inkMuted,
    fontFamily: font.medium,
    fontWeight: "600",
    fontSize: 14,
  },
  loading: { paddingVertical: 48, alignItems: "center" },
  thread: { gap: 8 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  replyRow: { marginLeft: 44 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSm: { width: 28, height: 28, borderRadius: 14 },
  avatarLetter: {
    color: colors.accentInk,
    fontFamily: font.heavy,
    fontWeight: "800",
    fontSize: 14,
  },
  avatarLetterSm: { fontSize: 12 },
  rowBody: { flex: 1, gap: 2 },
  rowMeta: { fontSize: 12 },
  username: {
    color: colors.ink,
    fontFamily: font.bold,
    fontWeight: "700",
  },
  time: {
    color: colors.inkMuted,
    fontFamily: font.medium,
    fontWeight: "600",
  },
  body: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: font.body,
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 4,
  },
  replyBtn: {
    color: colors.inkMuted,
    fontFamily: font.bold,
    fontWeight: "700",
    fontSize: 12,
  },
  delete: {
    color: colors.danger,
    fontFamily: font.bold,
    fontWeight: "700",
    fontSize: 12,
  },
  viewReplies: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 44,
    marginTop: 2,
  },
  replyLine: {
    width: 24,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.line,
  },
  viewRepliesText: {
    color: colors.inkMuted,
    fontFamily: font.bold,
    fontWeight: "700",
    fontSize: 12,
  },
  replyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    backgroundColor: colors.accentSoft,
    borderRadius: radii.md,
    paddingHorizontal: space.md,
    paddingVertical: 8,
    marginTop: space.sm,
  },
  replyBannerText: {
    flex: 1,
    color: colors.ink,
    fontFamily: font.medium,
    fontWeight: "600",
    fontSize: 13,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingTop: space.md,
    marginTop: space.sm,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    color: colors.ink,
    fontFamily: font.body,
    fontSize: 15,
  },
  send: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: { opacity: 0.5 },
  sendText: {
    color: colors.accentInk,
    fontFamily: font.heavy,
    fontWeight: "800",
    fontSize: 14,
  },
  errorBox: {
    borderRadius: radii.md,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginBottom: space.sm,
  },
  errorText: {
    color: colors.danger,
    fontFamily: font.medium,
    fontWeight: "600",
    fontSize: 13,
  },
});
