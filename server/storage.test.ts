import { test } from "node:test";
import assert from "node:assert/strict";
import { createStorage, postgresConfig } from "./storage";
test("远程Postgres强制TLS验证、拒绝disable、不在错误中返回连接串", () => {
  const config = postgresConfig(
    "postgresql://demo:placeholder@database.example:5432/postgres?sslmode=require",
  );
  assert.notEqual(config.ssl, false);
  assert.equal(
    (config.ssl as { rejectUnauthorized: boolean }).rejectUnauthorized,
    true,
  );
  assert.ok(!config.connectionString?.includes("sslmode"));
  assert.throws(
    () =>
      postgresConfig("postgresql://demo@database.example/db?sslmode=disable"),
    /必须启用TLS/,
  );
  assert.throws(
    () => postgresConfig("invalid-private-uri"),
    (error) => !String(error).includes("invalid-private-uri"),
  );
});
test("独立密码字段正确编码特殊字符，本地测试才允许非TLS", () => {
  const secret = "test@%:/?[]";
  const config = postgresConfig(
    "postgresql://postgres.project:[YOUR-PASSWORD]@pooler.example:5432/postgres",
    undefined,
    secret,
  );
  assert.equal(
    decodeURIComponent(new URL(config.connectionString!).password),
    secret,
  );
  assert.equal(
    postgresConfig("postgresql://tester@127.0.0.1/db?sslmode=disable").ssl,
    false,
  );
});
test("事务失败回滚、并发请求完整串行提交", async () => {
  const store = await createStorage({ dbPath: ":memory:" });
  try {
    await assert.rejects(
      store.transaction(async () => {
        await store.run(
          "INSERT INTO users(id,profile) VALUES (?,?)",
          "rollback",
          "{}",
        );
        throw new Error("reject");
      }),
    );
    assert.equal(
      await store.get("SELECT * FROM users WHERE id=?", "rollback"),
      undefined,
    );
    await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        store.transaction(async () => {
          await store.run(
            "INSERT INTO users(id,profile) VALUES (?,?)",
            "u" + i,
            "{}",
          );
        }),
      ),
    );
    assert.equal(
      (await store.get<{ n: number }>("SELECT count(*) AS n FROM users"))!.n,
      5,
    );
  } finally {
    await store.close();
  }
});

test("官方CA原样传入TLS且仍验证证书", () => {
  const ca =
    "-----BEGIN CERTIFICATE-----\nTEST-ONLY\n-----END CERTIFICATE-----";
  const config = postgresConfig("postgresql://test@database.example/db", ca);
  assert.equal((config.ssl as { ca: string }).ca, ca);
  assert.equal(
    (config.ssl as { rejectUnauthorized: boolean }).rejectUnauthorized,
    true,
  );
});
