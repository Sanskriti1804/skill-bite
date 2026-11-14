"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { useSession } from "../../components/session";
import { content as contentApi } from "../../lib/services/content";
import { learning } from "../../lib/services/learning";

type HistoryRow = {
  videoContentId: string;
  title: string;
  lastPositionSeconds: number;
  completedAt: string | null;
};

export default function HistoryPage() {
  const session = useSession();
  const [items, setItems] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session.ready) return;
    if (!session.token) {
      setLoading(false);
      return;
    }
    learning.progress(session.token)
      .then(async (result) => {
        const rows = await Promise.all(result.items.map(async (item) => {
          try {
            const detail = await contentApi.detail(item.videoContentId, session.token) as { title?: string };
            return {
              videoContentId: item.videoContentId,
              title: detail.title ?? item.videoContentId,
              lastPositionSeconds: item.lastPositionSeconds,
              completedAt: item.completedAt,
            };
          } catch {
            return {
              videoContentId: item.videoContentId,
              title: item.videoContentId,
              lastPositionSeconds: item.lastPositionSeconds,
              completedAt: item.completedAt,
            };
          }
        }));
        setItems(rows);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load history"))
      .finally(() => setLoading(false));
  }, [session.ready, session.token]);

  if (!session.ready) return <LoadingState />;
  if (!session.token) return <p>Sign in to see history.</p>;
  if (loading) return <LoadingState />;
  if (error) return <ErrorState>{error}</ErrorState>;
  if (!items.length) return <EmptyState>No continue-learning videos.</EmptyState>;
  return (
    <div className="stack">
      <h1>History</h1>
      {items.map((item) => (
        <Link className="card" key={item.videoContentId} href={`/watch/${item.videoContentId}`}>
          {item.title}
          <span className="muted"> Resume at {item.lastPositionSeconds}s{item.completedAt ? " · Completed" : ""}</span>
        </Link>
      ))}
    </div>
  );
}
