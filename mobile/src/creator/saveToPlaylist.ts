import { Alert } from "react-native";
import { contentApi, type OwnedContent } from "../services/content";

async function choosePlaylist(options: {
  token: string;
  videoContentId: string;
  onAdded?: (playlist: OwnedContent) => void | Promise<void>;
  onMessage?: (message: string) => void;
  onError?: (message: string) => void;
}): Promise<void> {
  const { token, videoContentId, onAdded, onMessage, onError } = options;
  try {
    const mine = await contentApi.mine(token);
    const playlists = mine.items.filter((item) => item.contentType === "COURSE" && item.status !== "REMOVED");
    if (!playlists.length) {
      Alert.alert("No playlists yet", "Create a playlist from the Create tab, then try again.");
      return;
    }
    Alert.alert(
      "Choose playlist",
      "Add this short to one of your playlists.",
      [
        ...playlists.slice(0, 6).map((playlist) => ({
          text: playlist.title || "Untitled playlist",
          onPress: () => {
            void (async () => {
              try {
                await contentApi.addVideoToCourse(token, playlist.contentId, videoContentId);
                await onAdded?.(playlist);
                onMessage?.(`Added to ${playlist.title || "playlist"}.`);
              } catch (caught) {
                onError?.(caught instanceof Error ? caught.message : "Could not add to playlist");
              }
            })();
          },
        })),
        { text: "Cancel", style: "cancel" as const },
      ],
    );
  } catch (caught) {
    onError?.(caught instanceof Error ? caught.message : "Could not load playlists");
  }
}

/** After creating/publishing a short: offer playlist only. */
export async function promptAddToPlaylist(options: {
  token: string;
  videoContentId: string;
  onAdded?: (playlist: OwnedContent) => void | Promise<void>;
  onMessage?: (message: string) => void;
  onError?: (message: string) => void;
}): Promise<void> {
  Alert.alert("Save to playlist?", "Keep this short organized in one of your playlists.", [
    {
      text: "Choose playlist",
      onPress: () => {
        void choosePlaylist(options);
      },
    },
    { text: "Not now", style: "cancel" },
  ]);
}

/** Bookmark button: save for later or add to a playlist. */
export async function promptSaveToPlaylist(options: {
  token: string;
  videoContentId: string;
  onBookmarked?: () => void | Promise<void>;
  onAdded?: (playlist: OwnedContent) => void | Promise<void>;
  onMessage?: (message: string) => void;
  onError?: (message: string) => void;
}): Promise<void> {
  const { onBookmarked, onMessage, onError, ...rest } = options;

  Alert.alert("Save", "Choose where to keep this short.", [
    {
      text: "Save for later",
      onPress: () => {
        void (async () => {
          try {
            await onBookmarked?.();
            onMessage?.("Saved for later.");
          } catch (caught) {
            onError?.(caught instanceof Error ? caught.message : "Could not save");
          }
        })();
      },
    },
    {
      text: "Add to playlist",
      onPress: () => {
        void choosePlaylist({ ...rest, onMessage, onError });
      },
    },
    { text: "Cancel", style: "cancel" },
  ]);
}
