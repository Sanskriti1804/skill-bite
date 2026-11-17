import { useEffect, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { IconButton } from "./IconButton";
import { Icon } from "../icons";
import { playbackSource } from "../api";
import { colors, font, space } from "../theme";
import type { ContentItem } from "../types";

type Props = {
  item: ContentItem;
  height: number;
  active: boolean;
  bookmarked: boolean;
  onOpen: () => void;
  onToggleBookmark: () => void;
  onShare: () => void;
  onComment?: () => void;
  onProgress?: (seconds: number) => void;
};

export function ShortFeedCard({
  item,
  height,
  active,
  bookmarked,
  onOpen,
  onToggleBookmark,
  onShare,
  onComment,
  onProgress,
}: Props) {
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const isVideo = item.contentType === "VIDEO";
  const source = isVideo ? playbackSource(item, "feed") : null;
  const caption = (item.description?.trim() || item.title || "").trim();
  const captionLong = caption.length > 70;

  const player = useVideoPlayer(source, (instance) => {
    instance.loop = true;
    instance.timeUpdateEventInterval = 2;
  });

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  useEffect(() => {
    if (!isVideo) return;
    if (active && !paused) player.play();
    else player.pause();
  }, [active, isVideo, paused, player]);

  useEffect(() => {
    if (!active) setCaptionExpanded(false);
  }, [active]);

  useEventListener(player, "timeUpdate", ({ currentTime }) => {
    if (active) onProgress?.(currentTime);
  });

  return (
    <View style={[styles.card, { height }]}>
      {isVideo ? (
        <VideoView
          style={StyleSheet.absoluteFill}
          player={player}
          contentFit="cover"
          nativeControls={false}
        />
      ) : (
        <Pressable style={[StyleSheet.absoluteFill, styles.courseSurface]} onPress={onOpen}>
          <Icon name="course" size={64} color={colors.feedMuted} />
          <Text style={styles.courseHint}>Playlist · tap to open</Text>
        </Pressable>
      )}

      <Pressable
        style={styles.tapZone}
        onPress={() => {
          if (captionExpanded) {
            setCaptionExpanded(false);
            return;
          }
          if (isVideo) setPaused((value) => !value);
          else onOpen();
        }}
      />

      {paused && isVideo ? (
        <View style={styles.pauseBadge} pointerEvents="none">
          <Icon name="play" size={40} color={colors.feedText} />
        </View>
      ) : null}

      <Pressable
        style={styles.copy}
        onPress={() => {
          if (captionLong) setCaptionExpanded((value) => !value);
          else if (!isVideo) onOpen();
        }}
      >
        {caption ? (
          <>
            <Text style={styles.caption} numberOfLines={captionExpanded ? undefined : 2}>
              {caption}
            </Text>
            {captionLong ? (
              <Text style={styles.more}>
                {captionExpanded ? "Show less" : "more"}
              </Text>
            ) : null}
          </>
        ) : null}
      </Pressable>

      <View style={styles.rail} pointerEvents="box-none">
        <IconButton
          icon={liked ? "likeActive" : "like"}
          label={likeCount > 0 ? String(likeCount) : "Like"}
          tone="light"
          size={24}
          onPress={() => {
            setLiked((value) => {
              setLikeCount((count) => Math.max(0, count + (value ? -1 : 1)));
              return !value;
            });
          }}
          active={liked}
        />
        <IconButton
          icon="comment"
          label="Comment"
          tone="light"
          size={24}
          onPress={() => onComment?.()}
        />
        <IconButton
          icon={muted ? "mute" : "unmute"}
          label={muted ? "Muted" : "Sound"}
          tone="light"
          size={24}
          onPress={() => setMuted((value) => !value)}
        />
        <IconButton
          icon={bookmarked ? "bookmarkActive" : "bookmark"}
          label={bookmarked ? "Saved" : "Save"}
          tone="light"
          size={24}
          active={bookmarked}
          onPress={onToggleBookmark}
        />
        <IconButton icon="share" label="Share" tone="light" size={24} onPress={onShare} />
      </View>
    </View>
  );
}

/** Fallback before onLayout measures the real Home viewport above the tab bar. */
export function feedPageHeight(tabBarHeight = 70): number {
  return Math.max(1, Math.round(Dimensions.get("window").height - tabBarHeight));
}

const styles = StyleSheet.create({
  card: {
    width: Dimensions.get("window").width,
    backgroundColor: colors.videoBg,
    overflow: "hidden",
  },
  courseSurface: {
    alignItems: "center",
    justifyContent: "center",
    gap: space.md,
    backgroundColor: colors.videoBg,
  },
  courseHint: { color: colors.feedMuted, fontSize: 14, fontFamily: font.medium, fontWeight: "600" },
  tapZone: { ...StyleSheet.absoluteFill },
  pauseBadge: {
    position: "absolute",
    alignSelf: "center",
    top: "42%",
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    position: "absolute",
    left: space.md,
    right: 72,
    bottom: space.xl,
    zIndex: 2,
  },
  caption: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: font.medium,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  more: {
    marginTop: 4,
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    fontFamily: font.bold,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  rail: {
    position: "absolute",
    right: 4,
    bottom: space.xl,
    zIndex: 3,
    alignItems: "center",
    gap: 10,
  },
});
