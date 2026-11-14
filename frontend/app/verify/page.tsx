"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, ErrorState, Field } from "../../components/ui";
import { auth } from "../../lib/services/auth";

export default function VerifyPage() {
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError("");
    setBusy(true);
    try {
      await auth.verify(token.trim());
      setMessage("Email verified. You can sign in.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack narrow" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      <h1>Verify email</h1>
      <Field label="Verification token" value={token} onChange={setToken} hint="Paste the token from the verification message." />
      {error ? <ErrorState>{error} Request a new account message if the token expired.</ErrorState> : null}
      {message ? <p>{message} <Link href="/login">Sign in</Link></p> : null}
      <Button primary type="submit" disabled={busy || !token.trim()}>Verify</Button>
    </form>
  );
}
