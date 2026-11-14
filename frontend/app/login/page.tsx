"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, ErrorState, Field } from "../../components/ui";
import { useSession } from "../../components/session";
import { auth } from "../../lib/services/auth";

export default function LoginPage() {
  const router = useRouter();
  const session = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError("");
    setBusy(true);
    try {
      const result = await auth.login(email, password);
      const me = await auth.me(result.accessToken);
      session.setSession({
        token: result.accessToken,
        refreshToken: result.refreshToken,
        role: me.role,
        userId: me.userId,
      });
      router.push(me.role === "ADMIN" ? "/admin" : me.role === "CREATOR" ? "/creator" : "/");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack narrow" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      <h1>Sign in</h1>
      <Field label="Email" value={email} onChange={setEmail} />
      <Field label="Password" type="password" value={password} onChange={setPassword} />
      {error ? <ErrorState>{error}</ErrorState> : null}
      <Button primary type="submit" disabled={busy}>Sign in</Button>
      <Button type="button" disabled onClick={() => undefined}>Continue with Google</Button>
      <p className="muted">Google sign-in is deferred until a client OAuth client id is configured. The API already verifies Google identity tokens.</p>
      <Link href="/register">Register</Link>
      <Link href="/recover">Forgot password</Link>
      <Link href="/verify">Verify email</Link>
    </form>
  );
}
