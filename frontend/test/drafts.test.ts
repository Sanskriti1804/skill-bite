import assert from "node:assert/strict";
import test from "node:test";
import { loadDrafts, saveDrafts, upsertDraft, updateDraftStatus } from "../lib/drafts.ts";

const memory = new Map<string, string>();

test("creator drafts upsert and update status", () => {
  const originalWindow = globalThis.window;
  const storage = {
    get length() { return memory.size; },
    clear() { memory.clear(); },
    key(index: number) { return [...memory.keys()][index] ?? null; },
    getItem(key: string) { return memory.get(key) ?? null; },
    setItem(key: string, value: string) { memory.set(key, value); },
    removeItem(key: string) { memory.delete(key); },
  } satisfies Storage;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: storage },
  });

  memory.clear();
  assert.deepEqual(loadDrafts("user-1"), []);
  upsertDraft("user-1", { contentId: "c1", title: "One", status: "DRAFT", kind: "VIDEO" });
  upsertDraft("user-1", { contentId: "c1", title: "One edited", status: "DRAFT", kind: "VIDEO" });
  const listed = loadDrafts("user-1");
  assert.equal(listed.length, 1);
  assert.equal(listed[0]?.title, "One edited");
  updateDraftStatus("user-1", "c1", "PUBLISHED");
  assert.equal(loadDrafts("user-1")[0]?.status, "PUBLISHED");
  saveDrafts("user-1", []);
  assert.deepEqual(loadDrafts("user-1"), []);

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: originalWindow,
  });
});
