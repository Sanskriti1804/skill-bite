"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { useSession } from "../../components/session";
import { content as contentApi } from "../../lib/services/content";
import { learning } from "../../lib/services/learning";

type BookmarkRow = { contentId: string; title: string };

export default function BookmarksPage() {
  const session = useSession();
  const [items, setItems] = useState<BookmarkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    if (!session.token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await learning.bookmarks(session.token);
      const rows = await Promise.all(result.items.map(async (item) => {
        try {
          const detail = await contentApi.detail(item.contentId, session.token) as { title?: string };
          return { contentId: item.contentId, title: detail.title ?? item.contentId };
        } catch {
          return { contentId: item.contentId, title: item.contentId };
        }
      }));
      setItems(rows);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load bookmarks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!session.ready) return;
    void load();
  }, [session.ready, session.token]);

  async function remove(contentId: string) {
    if (!session.token) return;
    setMessage("");
    try {
      await learning.removeBookmark(session.token, contentId);
      setItems((current) => current.filter((item) => item.contentId !== contentId));
      setMessage("Bookmark removed.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not remove bookmark");
    }
  }

  if (!session.ready) return <LoadingState />;
  if (!session.token) return <p>Sign in to see bookmarks.</p>;
  if (loading) return <LoadingState />;
  if (error) return <ErrorState>{error}</ErrorState>;
  if (!items.length) return <EmptyState>No bookmarks.</EmptyState>;
  return (
    <div className="stack">
      <h1>Bookmarks</h1>
      {message ? <p>{message}</p> : null}
      {items.map((item) => (
        <article className="card row" key={item.contentId}>
          <Link href={`/watch/${item.contentId}`}>{item.title}</Link>
          <Button danger onClick={() => void remove(item.contentId)}>Remove</Button>
        </article>
      ))}
    </div>
  );
}
