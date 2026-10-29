"use client";

import { useEffect, useState } from "react";
import { Button, ErrorState } from "../../components/ui";
import { useSession } from "../../components/session";
import { api } from "../../lib/api";

export default function AdminPage() {
  const session = useSession();
  const [threshold, setThreshold] = useState("90");
  const [audit, setAudit] = useState<string>("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (session.role !== "ADMIN") return;
    api<{ value: number }>("/api/v1/admin/settings/completion-threshold", { token: session.token })
      .then((result) => setThreshold(String(result.value)))
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Forbidden"));
    api<{ items: unknown[] }>("/api/v1/admin/audit", { token: session.token })
      .then((result) => setAudit(`${result.items.length} audit rows`))
      .catch(() => undefined);
  }, [session.role, session.token]);
  if (session.role !== "ADMIN") return <ErrorState>Admin access is required.</ErrorState>;
  return (
    <div className="stack">
      <h1>Admin</h1>
      <p>Analytics metrics are not defined yet.</p>
      <label>Completion threshold
        <input value={threshold} onChange={(event) => setThreshold(event.target.value)} />
      </label>
      <Button onClick={() => void api("/api/v1/admin/settings/completion-threshold", { method: "PUT", token: session.token, body: { value: Number(threshold) } })}>Save threshold</Button>
      <p>{audit}</p>
      {error ? <ErrorState>{error}</ErrorState> : null}
    </div>
  );
}
