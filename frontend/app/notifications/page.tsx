"use client";

import { useEffect, useState } from "react";
import { Button, EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { useSession } from "../../components/session";
import { learning } from "../../lib/services/learning";

type Note = {
  notificationId: string;
  title?: string | null;
  body?: string | null;
  readAt: string | null;
};

export default function NotificationsPage() {
  const session = useSession();
  const [items, setItems] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pushNote, setPushNote] = useState("");

  useEffect(() => {
    if (!session.ready) return;
    if (!session.token) {
      setLoading(false);
      return;
    }
    learning.notifications(session.token)
      .then((result) => setItems(result.items as Note[]))
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load notifications"))
      .finally(() => setLoading(false));
  }, [session.ready, session.token]);

  async function markRead(notificationId: string) {
    if (!session.token) return;
    await learning.markRead(session.token, notificationId);
    setItems((current) => current.map((item) => (
      item.notificationId === notificationId ? { ...item, readAt: new Date().toISOString() } : item
    )));
  }

  if (!session.ready) return <LoadingState />;
  if (!session.token) return <p>Sign in to see notifications.</p>;
  if (loading) return <LoadingState />;
  return (
    <div className="stack">
      <h1>Notifications</h1>
      <Button onClick={() => setPushNote("Push permission is requested here. Delivery stays deferred until a push provider is chosen. A denial does not block playback or progress.")}>
        Request push permission
      </Button>
      {pushNote ? <p className="muted">{pushNote}</p> : null}
      {error ? <ErrorState>{error}</ErrorState> : null}
      {!items.length ? <EmptyState>No notifications.</EmptyState> : null}
      {items.map((item) => (
        <article className="card" key={item.notificationId}>
          <p>{item.title ?? item.notificationId}</p>
          {item.body ? <p>{item.body}</p> : null}
          {item.readAt ? <p className="muted">Read</p> : <Button onClick={() => void markRead(item.notificationId)}>Mark read</Button>}
        </article>
      ))}
    </div>
  );
}
