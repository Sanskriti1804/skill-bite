"use client";

import { useState } from "react";
import { Button, ErrorState, Field } from "../../../components/ui";
import { useSession } from "../../../components/session";
import { api } from "../../../lib/api";

export default function AdminContentPage() {
  const session = useSession();
  const [contentId, setContentId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  if (session.role !== "ADMIN") return <ErrorState>Admin access is required.</ErrorState>;

  async function act(action: "delete" | "restore") {
    setError("");
    try {
      const result = await api<{ status: string }>(`/api/v1/admin/content/${contentId}/${action}`, { method: "POST", token: session.token });
      setMessage(result.status);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update content");
    }
  }

  return (
    <div className="stack">
      <h1>Content</h1>
      <p className="muted">The API does not list every draft. Enter a content id to remove or restore it. Removed content stays recoverable.</p>
      <Field label="Content id" value={contentId} onChange={setContentId} />
      <div className="row">
        <Button danger onClick={() => void act("delete")}>Remove</Button>
        <Button onClick={() => void act("restore")}>Restore</Button>
      </div>
      {message ? <p>{message}</p> : null}
      {error ? <ErrorState>{error}</ErrorState> : null}
    </div>
  );
}
