"use client";

import { useEffect, useState } from "react";
import { Button, ErrorState, Field, LoadingState } from "../../../components/ui";
import { useSession } from "../../../components/session";
import { api } from "../../../lib/api";

type Category = { categoryId: string; name: string; slug: string };

export default function TaxonomyPage() {
  const session = useSession();
  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tagName, setTagName] = useState("");
  const [tagSlug, setTagSlug] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session.role !== "ADMIN") { setLoading(false); return; }
    api<{ items: Category[] }>("/api/v1/admin/categories", { token: session.token })
      .then((result) => setItems(result.items))
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load categories"))
      .finally(() => setLoading(false));
  }, [session.role, session.token]);

  async function addCategory() {
    const result = await api<{ categoryId: string }>("/api/v1/admin/categories", { method: "POST", token: session.token, body: { name, slug } });
    setItems((current) => [...current, { categoryId: result.categoryId, name, slug }]);
  }

  async function addTag() {
    await api("/api/v1/admin/tags", { method: "POST", token: session.token, body: { name: tagName, slug: tagSlug } });
    setTagName("");
    setTagSlug("");
  }

  if (session.role !== "ADMIN") return <ErrorState>Admin access is required.</ErrorState>;
  if (loading) return <LoadingState />;
  return (
    <div className="stack">
      <h1>Categories and tags</h1>
      {error ? <ErrorState>{error}</ErrorState> : null}
      {items.map((item) => <p key={item.categoryId}>{item.name} · {item.slug}</p>)}
      <Field label="Category name" value={name} onChange={setName} />
      <Field label="Category slug" value={slug} onChange={setSlug} />
      <Button onClick={() => void addCategory()}>Create category</Button>
      <Field label="Tag name" value={tagName} onChange={setTagName} />
      <Field label="Tag slug" value={tagSlug} onChange={setTagSlug} />
      <Button onClick={() => void addTag()}>Create tag</Button>
    </div>
  );
}
