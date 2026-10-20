import { DatabaseSync } from "node:sqlite";
import { AsyncLocalStorage } from "node:async_hooks";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import pg, { type PoolClient, type PoolConfig } from "pg";
type Params = (string | number | null)[];
export function postgresConfig(
  connectionString: string,
  ca?: string,
  password?: string,
): PoolConfig {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("DATABASE_URL格式错误，请在服务端设置完整连接串");
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol))
    throw new Error("DATABASE_URL必须是PostgreSQL连接地址");
  if (password !== undefined) url.password = encodeURIComponent(password);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const mode = url.searchParams.get("sslmode");
  if (!local && mode === "disable")
    throw new Error("远程数据库必须启用TLS验证");
  for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"])
    url.searchParams.delete(key);
  return {
    connectionString: url.href,
    max: 2,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
    ssl:
      local && mode === "disable"
        ? false
        : {
            rejectUnauthorized: true,
            ...(ca ? { ca } : {}),
          },
  };
}
export async function createStorage(options: {
  dbPath: string;
  databaseURL?: string;
  databaseCA?: string;
  databasePassword?: string;
  schema?: string;
  dropSchemaOnClose?: boolean;
}) {
  const schema = options.schema || "jagat_private";
  if (!/^jagat_[a-z0-9_]+$/.test(schema)) throw new Error("无效数据库schema");
  const pool = options.databaseURL
    ? new pg.Pool(
        postgresConfig(
          options.databaseURL,
          options.databaseCA,
          options.databasePassword,
        ),
      )
    : null;
  if (!pool && options.dbPath !== ":memory:")
    mkdirSync(dirname(resolve(options.dbPath)), { recursive: true });
  pool?.on("error", () => console.error("数据库连接中断，后续请求将尝试重连"));
  const sqlite = pool ? null : new DatabaseSync(options.dbPath);
  const clientContext = new AsyncLocalStorage<PoolClient>();
  function sql(text: string) {
    if (!pool) return text;
    let i = 0;
    return text
      .replace(/\?/g, () => `$${++i}`)
      .replace(/\b(users|sessions|rooms|invites)\b/g, `"${schema}".$1`);
  }
  async function get<T>(
    text: string,
    ...values: Params
  ): Promise<T | undefined> {
    if (sqlite) return sqlite.prepare(text).get(...values) as T | undefined;
    const row = (
      await (clientContext.getStore() || pool!).query(sql(text), values)
    ).rows[0];
    if (row && typeof row.expires_at === "string")
      row.expires_at = Number(row.expires_at);
    return row as T | undefined;
  }
  async function run(text: string, ...values: Params) {
    if (sqlite) {
      sqlite.prepare(text).run(...values);
      return;
    }
    await (clientContext.getStore() || pool!).query(sql(text), values);
  }
  if (sqlite) sqlite.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;");
  if (pool)
    await pool.query(
      `CREATE SCHEMA IF NOT EXISTS "${schema}"; REVOKE ALL ON SCHEMA "${schema}" FROM PUBLIC;`,
    );
  for (const text of [
    "CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,profile TEXT NOT NULL,room_id TEXT)",
    "CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,expires_at BIGINT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS rooms(id TEXT PRIMARY KEY,owner_id TEXT NOT NULL,partner_id TEXT,state TEXT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS invites(token_hash TEXT PRIMARY KEY,room_id TEXT NOT NULL,expires_at BIGINT NOT NULL)",
    "CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at)",
    "CREATE INDEX IF NOT EXISTS invite_room ON invites(room_id)",
  ])
    await run(text);
  if (pool)
    await pool.query(
      `REVOKE ALL ON ALL TABLES IN SCHEMA "${schema}" FROM PUBLIC;`,
    );
  let queue: Promise<unknown> = Promise.resolve();
  async function transaction<T>(fn: () => Promise<T>): Promise<T> {
    if (pool) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN"); // Small-demo global lock prevents lost room updates across processes as well as requests.
        await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
          schema,
        ]);
        const result = await clientContext.run(client, fn);
        await client.query("COMMIT");
        return result;
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
    }
    const job = queue.then(async () => {
      sqlite!.exec("BEGIN IMMEDIATE");
      try {
        const result = await fn();
        sqlite!.exec("COMMIT");
        return result;
      } catch (e) {
        sqlite!.exec("ROLLBACK");
        throw e;
      }
    });
    queue = job.catch(() => {});
    return job;
  }
  async function close() {
    await queue;
    if (pool) {
      if (options.dropSchemaOnClose)
        await pool.query(`DROP SCHEMA "${schema}" CASCADE`);
      await pool.end();
    } else sqlite!.close();
  }
  return { get, run, transaction, close, kind: pool ? "postgres" : "sqlite" };
}
