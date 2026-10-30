"use client";

import { useState } from "react";
import { Button, ErrorState, Field, StatusBadge } from "../../components/ui";
import { useSession } from "../../components/session";
import { api } from "../../lib/api";

type Draft = { contentId: string; status: string; title: string };

export default function CreatorPage() {
  const session = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sources, setSources] = useState("");
  const [keywords, setKeywords] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function create() {
    setError("");
    setBusy(true);
    try {
      const result = await api<{ contentId: string; status: string }>("/api/v1/videos", {
        method: "POST",
        token: session.token,
        body: { title, description, sources, keywords, durationSeconds: 60 },
      });
      setDrafts((current) => [{ contentId: result.contentId, status: result.status, title }, ...current]);
      setMessage("Draft saved for this visit. The API has no list of your drafts.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create");
    } finally {
      setBusy(false);
    }
  }

  async function act(contentId: string, action: "publish" | "takedown") {
    const result = await api<{ status: string }>(`/api/v1/videos/${contentId}/${action}`, { method: "POST", token: session.token });
    setDrafts((current) => current.map((item) => item.contentId === contentId ? { ...item, status: result.status } : item));
  }

  if (session.role !== "CREATOR" && session.role !== "ADMIN") return <p>Switch to Creator on the account page. Creator tools are hidden for the User role.</p>;
  return (
    <div className="stack">
      <h1>Content</h1>
      <Field label="Title" value={title} onChange={setTitle} />
      <Field label="Description" value={description} onChange={setDescription} />
      <Field label="Sources" value={sources} onChange={setSources} />
      <Field label="Keywords" value={keywords} onChange={setKeywords} />
      <Button primary disabled={busy} onClick={() => void create()}>Save draft</Button>
      {message ? <p>{message}</p> : null}
      {error ? <ErrorState>{error}</ErrorState> : null}
      {!drafts.length ? <p>No videos or courses in this visit yet.</p> : null}
      {drafts.map((item) => (
        <article className="card" key={item.contentId}>
          <p>{item.title} <StatusBadge status={item.status} /></p>
          <div className="row">
            <Button onClick={() => void act(item.contentId, "publish")}>Publish</Button>
            <Button onClick={() => void act(item.contentId, "takedown")}>Take down</Button>
          </div>
          <p className="muted">Published text stays read-only until a takedown. Publish needs a tag and a video file on the server.</p>
        </article>
      ))}
    </div>
  );
}
