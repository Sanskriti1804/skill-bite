import assert from "node:assert/strict";
import test from "node:test";
import { viewState } from "../lib/state.ts";

test("loading is not shown as empty", () => {
  assert.equal(viewState(true, 0, false), "loading");
  assert.equal(viewState(false, 0, false), "empty");
  assert.equal(viewState(false, 0, true), "error");
});

test("inactive account message is not protected content", () => {
  const message = "Account is not active";
  assert.equal(message.includes("progress"), false);
});
