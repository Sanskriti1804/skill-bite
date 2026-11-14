"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, ErrorState, Field } from "../../components/ui";
import { auth } from "../../lib/services/auth";

export default function RecoverPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestReset() {
    setError("");
    setBusy(true);
    try {
      await auth.startReset(email.trim());
      setMessage("If the account can be recovered, a reset token was sent. The response does not say whether the email exists.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    setError("");
    setBusy(true);
    try {
      await auth.confirmReset(token.trim(), password);
      setMessage("Password updated. Sign in with the new password.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Recovery failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack narrow">
      <h1>Reset password</h1>
      <Field label="Email" value={email} onChange={setEmail} />
      <Button disabled={busy || !email.trim()} onClick={() => void requestReset()}>Send reset</Button>
      <Field label="Reset token" value={token} onChange={setToken} />
      <Field label="New password" type="password" value={password} onChange={setPassword} hint="At least 8 characters." />
      <Button primary disabled={busy || !token.trim() || password.length < 8} onClick={() => void confirm()}>Set new password</Button>
      {error ? <ErrorState>{error}</ErrorState> : null}
      {message ? <p>{message} <Link href="/login">Sign in</Link></p> : null}
    </div>
  );
}