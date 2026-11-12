"use client";

import { useState } from "react";
import { Button, Dialog, ErrorState } from "../../components/ui";
import { useSession } from "../../components/session";
import { auth } from "../../lib/services/auth";

export default function AccountPage() {
  const session = useSession();
  const [pending, setPending] = useState<"USER" | "CREATOR" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function switchRole() {
    if (!pending) return;
    setError("");
    try {
      await auth.switchRole(session.token, pending);
      session.setSession({ token: session.token, refreshToken: session.refreshToken, role: pending });
      setMessage(`Active role is ${pending}. Existing progress and content stay.`);
      setPending(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not switch");
    }
  }

  if (!session.token) return <p>Sign in to manage the account.</p>;
  if (session.role === "ADMIN") return <p>Admin accounts are not switched from this page.</p>;
  return (
    <div className="stack">
      <h1>Account</h1>
      <p>Active role: {session.role || "Unknown"}</p>
      <Button onClick={() => setPending("USER")}>Use as User</Button>
      <Button onClick={() => setPending("CREATOR")}>Use as Creator</Button>
      <Button onClick={() => void auth.logout(session.token).finally(session.clear)}>Sign out</Button>
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
