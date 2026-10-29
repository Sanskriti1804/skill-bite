"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ErrorState, Field } from "../../components/ui";
import { useSession } from "../../components/session";
import { api, type Session } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const session = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    try {
      const result = await api<Session>("/api/v1/auth/login", { method: "POST", body: { email, password } });
      const me = await api<{ role: string }>("/api/v1/me", { token: result.accessToken });
      session.setSession({ token: result.accessToken, refreshToken: result.refreshToken, role: me.role });
      router.push(me.role === "ADMIN" ? "/admin" : me.role === "CREATOR" ? "/creator" : "/");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign in failed");
    }
  }

  return (
    <form className="stack" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      <h1>Sign in</h1>
      <Field label="Email" value={email} onChange={setEmail} />
      <Field label="Password" type="password" value={password} onChange={setPassword} />
      {error ? <ErrorState>{error}</ErrorState> : null}
      <Button primary type="submit">Sign in</Button>
      <a href="/register">Register</a>
    </form>
  );
}
