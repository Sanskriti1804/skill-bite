"use client";

import { useEffect, useState } from "react";
import { ErrorState, LoadingState } from "../../../components/ui";
import { useSession } from "../../../components/session";
import { api } from "../../../lib/api";

type Row = { auditId?: string; actorUserId: string | null; action: string; createdAt: string };

export default function AuditPage() {
  const session = useSession();
  const [items, setItems] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (session.role !== "ADMIN") { setLoading(false); return; }
    api<{ items: Row[] }>("/api/v1/admin/audit", { token: session.token })
      .then((result) => setItems(result.items))
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load audit"))
      .finally(() => setLoading(false));
  }, [session.role, session.token]);
  if (session.role !== "ADMIN") return <ErrorState>Admin access is required.</ErrorState>;
  if (loading) return <LoadingState />;
  return (
    <div className="stack">
      <h1>Audit</h1>
      {error ? <ErrorState>{error}</ErrorState> : null}
      {!items.length ? <p>No audit rows.</p> : null}
      {items.map((item) => (
        <p key={item.auditId ?? `${item.action}-${item.createdAt}`}>{item.actorUserId} · {item.action} · {item.createdAt}</p>
      ))}
    </div>
  );
}
