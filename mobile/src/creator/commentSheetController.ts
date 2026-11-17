export type CommentSheetRequest = {
  token: string;
  contentId: string;
  currentUserId?: string;
  onCountChange?: (count: number) => void;
  onError?: (message: string) => void;
};

type Listener = (request: CommentSheetRequest) => void;

let listener: Listener | null = null;

export function registerCommentSheet(next: Listener | null) {
  listener = next;
}

export function openCommentSheet(request: CommentSheetRequest) {
  if (!listener) {
    request.onError?.("Comments are not ready yet.");
    return;
  }
  listener(request);
}
