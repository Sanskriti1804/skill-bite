"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, ErrorState, Field } from "../../components/ui";
import { api } from "../../lib/api";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("USER");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError("");
    if (password.length < 8) {
      setError("Password is too weak");
      return;
    }
    setBusy(true);
    try {
      await api("/api/v1/auth/register", { method: "POST", body: { email, password, displayName, role } });
      setMessage("Account created. Use the verification token from your mail, then sign in.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack narrow" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      <h1>Register</h1>
      <Field label="Display name" value={displayName} onChange={setDisplayName} />
      <Field label="Email" value={email} onChange={setEmail} />
      <Field label="Password" type="password" value={password} onChange={setPassword} hint="At least 8 characters." />
      <label>Starting role
        <select value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="USER">User</option>
          <option value="CREATOR">Creator</option>
        </select>
      </label>
      {error ? <ErrorState>{error}</ErrorState> : null}
      {message ? <p>{message} <Link href="/verify">Verify email</Link></p> : null}
      <Button primary type="submit" disabled={busy}>Create account</Button>
      <Link href="/login">Sign in</Link>
    </form>
  );
}
