"use client";

import { useEffect, useState } from "react";
import { Button, Dialog, ErrorState, LoadingState } from "../../../components/ui";
import { useSession } from "../../../components/session";
import { api } from "../../../lib/api";

type User = { userId: string; email: string; displayName: string; role: string; accountStatus: string };

export default function AdminUsersPage() {
  const session = useSession();
  const [items, setItems] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<{ user: User; status: string } | null>(null);

  useEffect(() => {
    if (session.role !== "ADMIN") { setLoading(false); return; }
    api<{ items: User[] }>("/api/v1/admin/users", { token: session.token })
      .then((result) => setItems(result.items))
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load users"))
      .finally(() => setLoading(false));
  }, [session.role, session.token]);

  async function save() {
    if (!pending) return;
    await api(`/api/v1/admin/users/${pending.user.userId}/status`, { method: "PATCH", token: session.token, body: { accountStatus: pending.status } });
    setItems((current) => current.map((item) => item.userId === pending.user.userId ? { ...item, accountStatus: pending.status } : item));
    setPending(null);
  }

  if (session.role !== "ADMIN") return <ErrorState>Admin access is required.</ErrorState>;
  if (loading) return <LoadingState />;
  return (
    <div className="stack">
      <h1>Users</h1>
      {error ? <ErrorState>{error}</ErrorState> : null}
      {!items.length ? <p>No accounts.</p> : null}
      {items.map((user) => (
        <article className="card" key={user.userId}>
          <p>{user.displayName} · {user.email}</p>
          <p className="muted">{user.role} · {user.accountStatus}</p>
          <label>Status
            <select defaultValue={user.accountStatus} onChange={(event) => setPending({ user, status: event.target.value })}>
              <option>ACTIVE</option>
              <option>SUSPENDED</option>
              <option>DEACTIVATED</option>
            </select>
          </label>
        </article>
      ))}
      {pending ? (
        <Dialog title={`Set ${pending.status}?`} onClose={() => setPending(null)}>
          <p>This changes sign-in for {pending.user.email}.</p>
          <Button primary onClick={() => void save()}>Confirm</Button>
        </Dialog>
      ) : null}
    </div>
  );
}
