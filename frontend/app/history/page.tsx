"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { useSession } from "../../components/session";
import { api } from "../../lib/api";

export default function HistoryPage() {
  const session = useSession();
  const [items, setItems] = useState<{ videoContentId: string; lastPositionSeconds: number; completedAt: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!session.token) { setLoading(false); return; }
    api<{ items: { videoContentId: string; lastPositionSeconds: number; completedAt: string | null }[] }>("/api/v1/me/progress", { token: session.token })
      .then((result) => setItems(result.items))
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load history"))
      .finally(() => setLoading(false));
  }, [session.token]);
  if (!session.token) return <p>Sign in to see history.</p>;
  if (loading) return <LoadingState />;
  if (error) return <ErrorState>{error}</ErrorState>;
  if (!items.length) return <EmptyState>No continue-learning videos.</EmptyState>;
  return (
    <div className="stack">
      <h1>History</h1>
      {items.map((item) => (
        <Link key={item.videoContentId} href={`/watch/${item.videoContentId}`}>
          Resume at {item.lastPositionSeconds}s{item.completedAt ? " · Completed" : ""}
        </Link>
      ))}
    </div>
  );
}
