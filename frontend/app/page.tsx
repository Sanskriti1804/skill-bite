"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState, viewState } from "../components/ui";
import { api } from "../lib/api";

type Item = { contentId: string; title: string; contentType: string };

export default function BrowsePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api<{ items: Item[] }>(`/api/v1/content?q=${encodeURIComponent(query)}`)
      .then((result) => { setItems(result.items); setFailed(false); })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [query]);

  const state = viewState(loading, items.length, failed);
  return (
    <div className="stack">
      <h1>Browse</h1>
      <input aria-label="Search" value={query} onChange={(event) => setQuery(event.target.value)} />
      {state === "loading" ? <LoadingState /> : null}
      {state === "error" ? <ErrorState>Content could not be loaded.</ErrorState> : null}
      {state === "empty" ? <EmptyState>Nothing matched.</EmptyState> : null}
      {state === "ready" ? items.map((item) => <Link key={item.contentId} href={`/watch/${item.contentId}`}>{item.title}</Link>) : null}
    </div>
  );
}
