"use client";

import { useEffect, useState } from "react";
import { EmptyState, LoadingState } from "../../components/ui";
import { useSession } from "../../components/session";
import { api } from "../../lib/api";

export default function HistoryPage() {
  const session = useSession();
  const [items, setItems] = useState<{ videoContentId: string; lastPositionSeconds: number }[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!session.token) { setLoading(false); return; }
    api<{ items: { videoContentId: string; lastPositionSeconds: number }[] }>("/api/v1/me/progress", { token: session.token })
      .then((result) => setItems(result.items))
      .finally(() => setLoading(false));
  }, [session.token]);
  if (loading) return <LoadingState />;
  if (!items.length) return <EmptyState>No continue-learning videos.</EmptyState>;
  return <ul>{items.map((item) => <li key={item.videoContentId}>Resume at {item.lastPositionSeconds}s</li>)}</ul>;
}
