import assert from "node:assert/strict";
import test from "node:test";
import { apiRequest } from "../client/src/lib/queryClient";

test("apiRequest preserves FormData and lets fetch set the multipart boundary", async () => {
  const originalFetch = globalThis.fetch;
  let captured: RequestInit | undefined;
  globalThis.fetch = async (_input, init) => {
    captured = init;
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const form = new FormData();
    form.append("govtIdType", "passport");
    form.append("document", new Blob(["image"], { type: "image/png" }), "id.png");
    await apiRequest("POST", "/api/verification/submit", form);

    assert.equal(captured?.body, form);
    assert.deepEqual(captured?.headers, {});
  } finally {
    globalThis.fetch = originalFetch;
  }
});