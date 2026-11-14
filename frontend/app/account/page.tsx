"use client";

import { useEffect, useState } from "react";
import { Button, Dialog, ErrorState, LoadingState } from "../../components/ui";
import { useSession } from "../../components/session";
import { auth, type Me } from "../../lib/services/auth";

export default function AccountPage() {
  const session = useSession();
  const [pending, setPending] = useState<"USER" | "CREATOR" | null>(null);
  const [profile, setProfile] = useState<Me | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session.ready) return;
    if (!session.token) {
      setLoading(false);
      return;
    }
    auth.me(session.token)
      .then(setProfile)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load account"))
      .finally(() => setLoading(false));
  }, [session.ready, session.token]);

  async function switchRole() {
    if (!pending) return;
    setError("");
    try {
      await auth.switchRole(session.token, pending);
      session.setSession({
        token: session.token,
        refreshToken: session.refreshToken,
        role: pending,
        userId: session.userId || profile?.userId,
      });
      setProfile((current) => current ? { ...current, role: pending } : current);
      setMessage(`Active role is ${pending}. Existing progress and content stay.`);
      setPending(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not switch");
    }
  }

  async function signOut() {
    try {
      if (session.token) await auth.logout(session.token);
    } finally {
      session.clear();
    }
  }

  if (!session.ready || loading) return <LoadingState />;
  if (!session.token) return <p>Sign in to manage the account.</p>;
  if (session.role === "ADMIN") {
    return (
      <div className="stack">
        <h1>Account</h1>
        <p>{profile?.email}</p>
        <p>Active role: ADMIN</p>
        <p className="muted">Admin accounts are not switched from this page.</p>
        <Button onClick={() => void signOut()}>Sign out</Button>
      </div>
    );
  }
  return (
    <div className="stack">
      <h1>Account</h1>
      <p>{profile?.displayName}</p>
      <p>{profile?.email}</p>
      <p>Active role: {session.role || profile?.role || "Unknown"}</p>
      <p className="muted">Status: {profile?.accountStatus ?? "Unknown"}</p>
      <Button onClick={() => setPending("USER")}>Use as User</Button>
      <Button onClick={() => setPending("CREATOR")}>Use as Creator</Button>
      <Button onClick={() => void signOut()}>Sign out</Button>
      {message ? <p>{message}</p> : null}
      {error ? <ErrorState>{error}</ErrorState> : null}
      {pending ? (
        <Dialog title={`Switch to ${pending}?`} onClose={() => setPending(null)}>
          <p>The other role’s screens hide. Progress and content remain.</p>
          <Button primary onClick={() => void switchRole()}>Confirm switch</Button>
        </Dialog>
      ) : null}
    </div>
  );
}
