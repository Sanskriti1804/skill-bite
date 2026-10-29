"use client";

import { useEffect, useState } from "react";
import { EmptyState, LoadingState } from "../../components/ui";
import { useSession } from "../../components/session";
import { api } from "../../lib/api";

export default function BookmarksPage() {
  const session = useSession();
  const [items, setItems] = useState<{ contentId: string }[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!session.token) { setLoading(false); return; }
    api<{ items: { contentId: string }[] }>("/api/v1/me/bookmarks", { token: session.token })
      .then((result) => setItems(result.items))
      .finally(() => setLoading(false));
  }, [session.token]);
  if (loading) return <LoadingState />;
  if (!items.length) return <EmptyState>No bookmarks.</EmptyState>;
  return <ul>{items.map((item) => <li key={item.contentId}>{item.contentId}</li>)}</ul>;
}
