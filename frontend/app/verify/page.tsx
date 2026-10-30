"use client";

import { useState } from "react";
import { Button, ErrorState, Field } from "../../components/ui";
import { api } from "../../lib/api";

export default function VerifyPage() {
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    try {
      await api("/api/v1/auth/verify-email", { method: "POST", body: { token } });
      setMessage("Email verified.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Verification failed");
    }
  }

  return (
    <form className="stack narrow" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      <h1>Verify email</h1>
      <Field label="Verification token" value={token} onChange={setToken} hint="Paste the token from the verification message." />
      {error ? <ErrorState>{error} Request a new account message if the token expired.</ErrorState> : null}
      {message ? <p>{message}</p> : null}
      <Button primary type="submit">Verify</Button>
    </form>
  );
}
