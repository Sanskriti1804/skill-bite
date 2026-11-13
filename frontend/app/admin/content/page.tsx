"use client";

import { useEffect, useState } from "react";
import { Button, EmptyState, ErrorState, Field, LoadingState, StatusBadge } from "../../../components/ui";
import { useSession } from "../../../components/session";
import { admin } from "../../../lib/services/admin";
import { content as contentApi } from "../../../lib/services/content";

type ContentRow = { contentId: string; title: string; contentType: string; status?: string };

export default function AdminContentPage() {
  const session = useSession();
  const [items, setItems] = useState<ContentRow[]>([]);
  const [contentId, setContentId] = useState("");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ sort: "newest" });
      if (query.trim()) params.set("q", query.trim());
      const result = await contentApi.search(params);
      setItems(result.items.map((item) => ({ ...item, status: "PUBLISHED" })));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load content");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!session.ready || session.role !== "ADMIN") return;
    void load();
  }, [session.ready, session.role]);

  if (!session.ready) return <LoadingState />;
  if (session.role !== "ADMIN") return <ErrorState>Admin access is required.</ErrorState>;

  async function act(action: "delete" | "restore", id: string) {
    setError("");
    setMessage("");
    try {
      const result = action === "delete"
        ? await admin.removeContent(session.token, id)
        : await admin.restoreContent(session.token, id);
      setMessage(`${id}: ${result.status}`);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update content");
    }
  }

  return (
    <div className="stack">
      <h1>Content</h1>
      <p className="muted">Published content is listed below. Removed content stays recoverable by id.</p>
      <Field label="Search published content" value={query} onChange={setQuery} />
      <Button onClick={() => void load()}>Refresh list</Button>
      {loading ? <LoadingState /> : null}
      {!loading && !items.length ? <EmptyState>No published content matched.</EmptyState> : null}
      {items.map((item) => (
        <article className="card" key={item.contentId}>
          <p>{item.title} <StatusBadge status={item.status ?? "PUBLISHED"} /> <span className="muted">{item.contentType}</span></p>
          <p className="muted">{item.contentId}</p>
          <div className="row">
            <Button danger onClick={() => void act("delete", item.contentId)}>Remove</Button>
            <Button onClick={() => setContentId(item.contentId)}>Use id</Button>
          </div>
        </article>
      ))}
      <h2>Recover by id</h2>
      <Field label="Content id" value={contentId} onChange={setContentId} />
      <div className="row">
        <Button danger disabled={!contentId.trim()} onClick={() => void act("delete", contentId.trim())}>Remove</Button>
        <Button disabled={!contentId.trim()} onClick={() => void act("restore", contentId.trim())}>Restore</Button>
      </div>
      {message ? <p>{message}</p> : null}
      {error ? <ErrorState>{error}</ErrorState> : null}
    </div>
  );
}
