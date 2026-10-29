"use client";

import { Button } from "../../components/ui";
import { useSession } from "../../components/session";
import { api } from "../../lib/api";

export default function AccountPage() {
  const session = useSession();
  async function switchRole(role: "USER" | "CREATOR") {
    await api("/api/v1/me/role", { method: "PATCH", token: session.token, body: { role } });
    session.setSession({ token: session.token, refreshToken: session.refreshToken, role });
  }
  if (!session.token) return <p>Sign in to manage the account.</p>;
  return (
    <div className="stack">
      <h1>Account</h1>
      <p>Active role: {session.role}</p>
      <Button onClick={() => void switchRole("USER")}>Use as User</Button>
      <Button onClick={() => void switchRole("CREATOR")}>Use as Creator</Button>
      <Button onClick={session.clear}>Sign out</Button>
    </div>
  );
}
