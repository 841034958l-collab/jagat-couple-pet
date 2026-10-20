import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createStorage } from "./storage";
import { createApp } from "./app";
import { uid } from "../src/domain/engine";
const databaseURL = process.env.TEST_DATABASE_URL;
if (!databaseURL)
  throw new Error(
    "PostgreSQL集成测试需要TEST_DATABASE_URL，请使用独立测试数据库",
  );
const schema = () => `jagat_test_${uid().replaceAll("-", "")}`;
test("PostgreSQL事务回滚、私有schema不向PUBLIC开放", async () => {
  const name = schema();
  const store = await createStorage({
    dbPath: ":memory:",
    databaseURL,
    schema: name,
    dropSchemaOnClose: true,
  });
  try {
    await assert.rejects(
      store.transaction(async () => {
        await store.run(
          "INSERT INTO users(id,profile) VALUES (?,?)",
          "temp",
          "{}",
        );
        throw new Error("cancel");
      }),
    );
    assert.equal(
      await store.get("SELECT * FROM users WHERE id=?", "temp"),
      undefined,
    );
    const grants = await store.get<{ n: number }>(
      "SELECT count(*)::int AS n FROM pg_namespace n CROSS JOIN LATERAL aclexplode(n.nspacl) a WHERE n.nspname=? AND a.grantee=0",
      name,
    );
    assert.equal(grants?.n, 0);
  } finally {
    await store.close();
  }
});
test("两个独立连接池并发修改不丢失状态", async () => {
  const name = schema();
  const a = await createStorage({
    dbPath: ":memory:",
    databaseURL,
    schema: name,
  });
  const b = await createStorage({
    dbPath: ":memory:",
    databaseURL,
    schema: name,
    dropSchemaOnClose: true,
  });
  try {
    await a.run("INSERT INTO users(id,profile) VALUES (?,?)", "counter", "0");
    await Promise.all(
      [a, b].map((store) =>
        store.transaction(async () => {
          const row = await store.get<{ profile: string }>(
            "SELECT profile FROM users WHERE id=?",
            "counter",
          );
          await new Promise((r) => setTimeout(r, 15));
          await store.run(
            "UPDATE users SET profile=? WHERE id=?",
            String(Number(row!.profile) + 1),
            "counter",
          );
        }),
      ),
    );
    assert.equal(
      (await a.get<{ profile: string }>(
        "SELECT profile FROM users WHERE id=?",
        "counter",
      ))!.profile,
      "2",
    );
  } finally {
    await a.close();
    await b.close();
  }
});
test("PostgreSQL服务重建后会话、个人资料与邀请房间恢复", async () => {
  const name = schema();
  let app = await createApp({ dbPath: ":memory:", databaseURL, schema: name });
  async function listen() {
    await new Promise<void>((r) => app.server.listen(0, "127.0.0.1", r));
    return `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
  }
  let base = await listen();
  let cookie = "";
  try {
    const init = await fetch(base + "/api/session");
    cookie = init.headers.get("set-cookie")!.split(";")[0];
    const headers = { Cookie: cookie, "Content-Type": "application/json" };
    await fetch(base + "/api/profile", {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        name: "云端资料",
        avatar: "🌷",
        city: "杭州",
        bio: "private",
      }),
    });
    const made = await fetch(base + "/api/rooms", {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "云团子", city: "杭州" }),
    });
    const id = (await made.json()).roomId;
    await app.close();
    app = await createApp({
      dbPath: ":memory:",
      databaseURL,
      schema: name,
      dropSchemaOnClose: true,
    });
    base = await listen();
    const restored = await fetch(base + "/api/session", {
      headers: { Cookie: cookie },
    });
    const state = await restored.json();
    assert.equal(state.me.name, "云端资料");
    assert.equal(state.roomId, id);
    assert.equal(state.state.pet.name, "云团子");
  } finally {
    await app.close();
  }
});
