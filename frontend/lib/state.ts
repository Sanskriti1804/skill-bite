export function viewState(loading: boolean, count: number, failed: boolean): "loading" | "error" | "empty" | "ready" {
  if (loading) return "loading";
  if (failed) return "error";
  if (count === 0) return "empty";
  return "ready";
}
