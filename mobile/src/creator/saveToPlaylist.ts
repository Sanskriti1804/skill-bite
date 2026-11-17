import { openSaveSheet } from "./saveSheetController";
import type { OwnedContent } from "../services/content";

/** After creating/publishing a short: offer course picker sheet. */
export async function promptAddToPlaylist(options: {
  token: string;
  videoContentId: string;
  onAdded?: (playlist: OwnedContent) => void | Promise<void>;
  onMessage?: (message: string) => void;
  onError?: (message: string) => void;
}): Promise<void> {
  openSaveSheet({
    token: options.token,
    contentId: options.videoContentId,
    mode: "playlist-only",
    onAdded: options.onAdded,
    onMessage: options.onMessage,
    onError: options.onError,
  });
}

/** Save button: branded sheet for watching list and/or course. */
export async function promptSaveToPlaylist(options: {
  token: string;
  videoContentId: string;
  contentType?: string;
  onBookmarked?: () => void | Promise<void>;
  onAdded?: (playlist: OwnedContent) => void | Promise<void>;
  onMessage?: (message: string) => void;
  onError?: (message: string) => void;
}): Promise<void> {
  openSaveSheet({
    token: options.token,
    contentId: options.videoContentId,
    contentType: options.contentType,
    mode: "save",
    onBookmarked: options.onBookmarked,
    onAdded: options.onAdded,
    onMessage: options.onMessage,
    onError: options.onError,
  });
}
