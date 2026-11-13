"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState, viewState } from "../components/ui";
import { useSession } from "../components/session";
import { content as contentApi } from "../lib/services/content";
import { learning } from "../lib/services/learning";

type Item = { contentId: string; title: string; contentType: string };
type Category = { slug: string; name: string };

export default function BrowsePage() {
  const session = useSession();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [resume, setResume] = useState("");

  useEffect(() => {
    contentApi.categories()
      .then((result) => setCategories(result.items))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!session.token) return;
    learning.progress(session.token)
      .then((result) => setResume(result.items[0]?.videoContentId ?? ""))
      .catch(() => setResume(""));
  }, [session.token]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category) params.set("category", category);
    params.set("sort", "newest");
    setLoading(true);
    contentApi.search(params)
      .then((result) => { setItems(result.items); setFailed(false); })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [query, category]);

  const state = viewState(loading, items.length, failed);
  return (
    <div className="stack">
      <h1>Browse</h1>
      {resume ? <p><Link href="/history">Continue learning</Link></p> : null}
      <label>Search<input aria-label="Search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div className="row">
        <button className="chip" type="button" aria-pressed={category === ""} onClick={() => setCategory("")}>All</button>
        {categories.map((item) => (
          <button key={item.slug} className="chip" type="button" aria-pressed={category === item.slug} onClick={() => setCategory(item.slug)}>{item.name}</button>
        ))}
      </div>
      {state === "loading" ? <LoadingState /> : null}
      {state === "error" ? <ErrorState>Content could not be loaded. <button type="button" onClick={() => setQuery(query)}>Retry</button></ErrorState> : null}
      {state === "empty" ? <EmptyState>{query || category ? "Nothing matched." : "Nothing in this category."}</EmptyState> : null}
      {state === "ready" ? items.map((item) => (
        <Link className="card" key={item.contentId} href={`/watch/${item.contentId}`}>{item.title}<span className="muted"> {item.contentType}</span></Link>
      )) : null}
    </div>
  );
}
