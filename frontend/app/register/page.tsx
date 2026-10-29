"use client";

import { useState } from "react";
import { Button, ErrorState, Field } from "../../components/ui";
import { api } from "../../lib/api";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("USER");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    try {
      await api("/api/v1/auth/register", { method: "POST", body: { email, password, displayName, role } });
      setMessage("Account created. Check the verification message, then sign in.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Registration failed");
    }
  }

  return (
    <form className="stack" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      <h1>Register</h1>
      <Field label="Display name" value={displayName} onChange={setDisplayName} />
      <Field label="Email" value={email} onChange={setEmail} />
      <Field label="Password" type="password" value={password} onChange={setPassword} />
      <label>Role
        <select value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="USER">User</option>
          <option value="CREATOR">Creator</option>
        </select>
      </label>
      {error ? <ErrorState>{error}</ErrorState> : null}
      {message ? <p>{message}</p> : null}
      <Button primary type="submit">Create account</Button>
    </form>
  );
}
