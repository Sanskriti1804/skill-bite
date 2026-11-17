import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "../icons";
import { colors, font } from "../theme";
import type { ContentItem } from "../types";

type Props = {
  item: ContentItem;
  width: number;
  height: number;
  onPress: () => void;
  showCreator?: boolean;
};

export function BitePreviewCard({ item, width, height, onPress, showCreator = true }: Props) {
  const [failed, setFailed] = useState(false);
  const uri = item.thumbnailUrl?.trim() || "";
  const show = Boolean(uri) && !failed;
  const caption = (item.description?.trim() || item.title || "").trim();

  return (
    <Pressable style={[styles.tile, { width, height }]} onPress={onPress}>
      {show ? (
        <Image source={{ uri }} style={styles.image} resizeMode="cover" onError={() => setFailed(true)} />
      ) : (
        <View style={styles.fallback} />
      )}
      <View style={styles.scrim} />
      <View style={styles.play}>
        <Icon name="play" size={14} color={colors.feedText} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={2}>{caption || "Bite"}</Text>
        {showCreator && item.categories?.[0]?.name ? (
          <Text style={styles.meta} numberOfLines={1}>{item.categories[0].name}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.videoBg,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  image: { ...StyleSheet.absoluteFill },
  fallback: { ...StyleSheet.absoluteFill, backgroundColor: colors.videoBg },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.22)" },
  play: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { padding: 8, zIndex: 1 },
  title: {
    color: colors.feedText,
    fontSize: 12,
    lineHeight: 15,
    fontFamily: font.bold,
    fontWeight: "700",
  },
  meta: {
    marginTop: 2,
    color: colors.feedMuted,
    fontSize: 11,
    fontFamily: font.medium,
    fontWeight: "600",
  },
});
