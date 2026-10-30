"use client";

import { useEffect, useState } from "react";
import { Button, ErrorState, Field } from "../../../components/ui";
import { useSession } from "../../../components/session";
import { api } from "../../../lib/api";

export default function SettingsPage() {
  const session = useSession();
  const [value, setValue] = useState("90");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (session.role !== "ADMIN") return;
    api<{ value: number }>("/api/v1/admin/settings/completion-threshold", { token: session.token })
      .then((result) => setValue(String(result.value)))
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load the threshold"));
  }, [session.role, session.token]);
  if (session.role !== "ADMIN") return <ErrorState>Admin access is required.</ErrorState>;

  async function save() {
    setError("");
    try {
      const result = await api<{ value: number }>("/api/v1/admin/settings/completion-threshold", { method: "PUT", token: session.token, body: { value: Number(value) } });
      setMessage(`Saved ${result.value}. Existing completions are not rewritten.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save");
    }
  }

  return (
    <div className="stack">
      <h1>Settings</h1>
      <Field label="Completion threshold percent" value={value} onChange={setValue} hint="Initial value is 90." />
      <Button primary onClick={() => void save()}>Save</Button>
      {message ? <p>{message}</p> : null}
      {error ? <ErrorState>{error}</ErrorState> : null}
    </div>
  );
}
