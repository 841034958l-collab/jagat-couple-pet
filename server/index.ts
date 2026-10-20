import { createApp } from "./app";
const port = Number(process.env.PORT || 5175);
if (
  process.env.NODE_ENV === "production" &&
  !process.env.DATABASE_URL &&
  !process.env.DATABASE_PATH
) {
  console.error(
    "生产环境需要配置DATABASE_URL；自管SQLite需显式配置DATABASE_PATH。",
  );
  process.exit(1);
}
const app = await createApp({
  databaseURL: process.env.DATABASE_URL,
  databasePassword: process.env.DATABASE_PASSWORD,
  databaseCA: process.env.DATABASE_CA_CERT,
  dbPath: process.env.DATABASE_PATH || ".data/jagat.sqlite",
  publicOrigin: process.env.PUBLIC_ORIGIN || process.env.RENDER_EXTERNAL_URL,
  staticDir: process.env.NODE_ENV === "production" ? "dist" : undefined,
  demo: process.env.DEMO_MODE !== "false",
  secureCookie: process.env.NODE_ENV === "production",
}).catch((error: unknown) => {
  const code = (error as { code?: string })?.code;
  console.error(
    `数据库初始化失败${code && /^[A-Z0-9_]+$/.test(code) ? ` (${code})` : ""}，请检查DATABASE_URL、TLS证书和数据库权限。连接串不会记录。`,
  );
  process.exit(1);
});
app.server.listen(port, "0.0.0.0", () =>
  console.log(`Jagat shared game server listening on port ${port}`),
);
process.on("SIGTERM", () => {
  app.server.close(async () => {
    await app.storage.close();
    process.exit(0);
  });
});
