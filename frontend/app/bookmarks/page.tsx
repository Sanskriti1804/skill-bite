"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { useSession } from "../../components/session";
import { api } from "../../lib/api";

export default function BookmarksPage() {
  const session = useSession();
  const [items, setItems] = useState<{ contentId: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!session.token) { setLoading(false); return; }
    api<{ items: { contentId: string }[] }>("/api/v1/me/bookmarks", { token: session.token })
      .then((result) => setItems(result.items))
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load bookmarks"))
      .finally(() => setLoading(false));
  }, [session.token]);
  if (!session.token) return <p>Sign in to see bookmarks.</p>;
  if (loading) return <LoadingState />;
  if (error) return <ErrorState>{error}</ErrorState>;
  if (!items.length) return <EmptyState>No bookmarks.</EmptyState>;
  return (
    <div className="stack">
      <h1>Bookmarks</h1>
      {items.map((item) => <Link key={item.contentId} href={`/watch/${item.contentId}`}>{item.contentId}</Link>)}
    </div>
  );
}
