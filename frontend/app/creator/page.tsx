"use client";

import { useState } from "react";
import { Button, ErrorState, Field, StatusBadge } from "../../components/ui";
import { useSession } from "../../components/session";
import { api } from "../../lib/api";

export default function CreatorPage() {
  const session = useSession();
  const [title, setTitle] = useState("");
  const [contentId, setContentId] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function create() {
    setError("");
    try {
      const result = await api<{ contentId: string; status: string }>("/api/v1/videos", { method: "POST", token: session.token, body: { title, durationSeconds: 1 } });
      setContentId(result.contentId);
      setStatus(result.status);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create");
    }
  }

  async function takedown() {
    const result = await api<{ status: string }>(`/api/v1/videos/${contentId}/takedown`, { method: "POST", token: session.token });
    setStatus(result.status);
  }

  if (session.role !== "CREATOR" && session.role !== "ADMIN") return <p>Switch to Creator on the account page to publish.</p>;
  return (
    <div className="stack">
      <h1>Creator</h1>
      <Field label="Title" value={title} onChange={setTitle} />
      <Button primary onClick={() => void create()}>Create draft</Button>
      {contentId ? <p>Draft {contentId} <StatusBadge status={status} /></p> : null}
      {contentId ? <Button onClick={() => void takedown()}>Take down</Button> : null}
      {error ? <ErrorState>{error}</ErrorState> : null}
    </div>
  );
}
