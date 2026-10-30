"use client";

import { useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { useSession } from "../../components/session";
import { api } from "../../lib/api";

type Note = { notificationId: string; title?: string; body?: string; readAt: string | null };

export default function NotificationsPage() {
  const session = useSession();
  const [items, setItems] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pushNote, setPushNote] = useState("");

  useEffect(() => {
    if (!session.token) { setLoading(false); return; }
    api<{ items: Note[] }>("/api/v1/notifications", { token: session.token })
      .then((result) => setItems(result.items))
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load notifications"))
      .finally(() => setLoading(false));
  }, [session.token]);

  async function markRead(notificationId: string) {
    await api(`/api/v1/notifications/${notificationId}/read`, { method: "POST", token: session.token });
    setItems((current) => current.map((item) => item.notificationId === notificationId ? { ...item, readAt: new Date().toISOString() } : item));
  }

  if (!session.token) return <p>Sign in to see notifications.</p>;
  if (loading) return <LoadingState />;
  return (
    <div className="stack">
      <h1>Notifications</h1>
      <button type="button" onClick={() => setPushNote("Push permission is requested here. A denial does not block playback or progress.")}>Request push permission</button>
      {pushNote ? <p>{pushNote}</p> : null}
      {error ? <ErrorState>{error}</ErrorState> : null}
      {!items.length ? <EmptyState>No notifications.</EmptyState> : null}
      {items.map((item) => (
        <article className="card" key={item.notificationId}>
          <p>{item.title ?? item.notificationId}</p>
          {item.readAt ? <p className="muted">Read</p> : <button type="button" onClick={() => void markRead(item.notificationId)}>Mark read</button>}
        </article>
      ))}
    </div>
  );
}
