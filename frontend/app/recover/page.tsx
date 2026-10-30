"use client";

import { useState } from "react";
import { Button, ErrorState, Field } from "../../components/ui";
import { api } from "../../lib/api";

export default function RecoverPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function requestReset() {
    setError("");
    try {
      await api("/api/v1/auth/password-reset", { method: "POST", body: { email } });
      setMessage("If the account can be recovered, a reset token was sent. The response does not say whether the email exists.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Request failed");
    }
  }

  async function confirm() {
    setError("");
    try {
      await api("/api/v1/auth/password-reset/confirm", { method: "POST", body: { token, password } });
      setMessage("Password updated. Sign in with the new password. A suspended account is not signed in.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Recovery failed");
    }
  }

  return (
    <div className="stack narrow">
      <h1>Reset password</h1>
      <Field label="Email" value={email} onChange={setEmail} />
      <Button onClick={() => void requestReset()}>Send reset</Button>
      <Field label="Reset token" value={token} onChange={setToken} />
      <Field label="New password" type="password" value={password} onChange={setPassword} />
      <Button primary onClick={() => void confirm()}>Set new password</Button>
      {error ? <ErrorState>{error}</ErrorState> : null}
      {message ? <p>{message}</p> : null}
    </div>
  );
}
