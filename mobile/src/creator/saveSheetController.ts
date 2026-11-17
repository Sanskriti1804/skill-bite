import type { OwnedContent } from "../services/content";

export type SaveSheetMode = "save" | "playlist-only";

export type SaveSheetRequest = {
  token: string;
  contentId: string;
  contentType?: string;
  mode?: SaveSheetMode;
  onBookmarked?: () => void | Promise<void>;
  onAdded?: (playlist: OwnedContent) => void | Promise<void>;
  onMessage?: (message: string) => void;
  onError?: (message: string) => void;
};

type Listener = (request: SaveSheetRequest) => void;

let listener: Listener | null = null;

export function registerSaveSheet(next: Listener | null) {
  listener = next;
}

export function openSaveSheet(request: SaveSheetRequest) {
  if (!listener) {
    request.onError?.("Save sheet is not ready yet.");
    return;
  }
  listener(request);
}
