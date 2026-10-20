import { spawn } from "node:child_process";
const frontend = process.argv.slice(2).filter((x) => x !== "--");
const children = [
  spawn(process.execPath, ["--import", "tsx", "server/index.ts"], {
    stdio: "inherit",
    env: { ...process.env, PORT: process.env.API_PORT || "5175" },
  }),
  spawn(
    process.execPath,
    ["node_modules/vite/bin/vite.js", "--host", "0.0.0.0", ...frontend],
    { stdio: "inherit" },
  ),
];
let closing = false;
function stop(code = 0) {
  if (closing) return;
  closing = true;
  children.forEach((c) => c.kill("SIGTERM"));
  setTimeout(() => process.exit(code), 100).unref();
}
children.forEach((c) => c.on("exit", (code) => stop(code ?? 1)));
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
