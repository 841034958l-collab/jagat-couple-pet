import assert from "node:assert/strict";
import { resolve } from "node:path";
import type { AddressInfo } from "node:net";
import { createApp } from "../server/app";
const app = createApp({
  dbPath: ":memory:",
  staticDir: resolve("dist"),
  secureCookie: true,
});
await new Promise<void>((r) => app.server.listen(0, "127.0.0.1", r));
try {
  const base = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
  const index = await fetch(base);
  assert.equal(index.status, 200);
  const html = await index.text();
  assert.ok(html.includes("99天养宠计划"));
  const asset = html.match(/src="([^"]+\.js)"/)?.[1];
  assert.ok(asset);
  const js = await fetch(new URL(asset, base));
  assert.equal(js.status, 200);
  assert.match(js.headers.get("content-type") || "", /javascript/);
  const session = await fetch(base + "/api/session");
  assert.match(session.headers.get("set-cookie") || "", /HttpOnly/);
  assert.match(session.headers.get("set-cookie") || "", /Secure/);
  assert.equal(session.status, 200);
  const health = await fetch(base + "/api/health");
  assert.deepEqual(await health.json(), { ok: true });
  console.log("Production static HTML/JS + API + secure-cookie smoke: passed");
} finally {
  await new Promise<void>((r) => app.server.close(() => r()));
  app.db.close();
}
