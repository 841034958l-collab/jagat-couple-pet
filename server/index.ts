import { createApp } from "./app";
const port = Number(process.env.PORT || 5175);
const app = createApp({
  dbPath: process.env.DATABASE_PATH || ".data/jagat.sqlite",
  publicOrigin: process.env.PUBLIC_ORIGIN || process.env.RENDER_EXTERNAL_URL,
  staticDir: process.env.NODE_ENV === "production" ? "dist" : undefined,
  demo: process.env.DEMO_MODE !== "false",
  secureCookie: process.env.NODE_ENV === "production",
});
app.server.listen(port, "0.0.0.0", () =>
  console.log(`Jagat shared game server listening on port ${port}`),
);
process.on("SIGTERM", () => {
  app.server.close(() => {
    app.db.close();
    process.exit(0);
  });
});
