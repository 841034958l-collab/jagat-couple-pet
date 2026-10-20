import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { createStorage } from "./storage";
import { randomBytes, createHash } from "node:crypto";
import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve, extname, sep } from "node:path";
import {
  initialState,
  reduceCommand,
  publicState,
  uid,
  qualityScore,
  valuation,
} from "../src/domain/engine";
import { naturalDay } from "../src/domain/story";
import type { GameState, Role, Command } from "../src/domain/models";
import type {
  Profile,
  SessionSnapshot,
  Invitation,
} from "../src/services/session-types";
export const avatars = ["🌷", "🌿", "🌙", "☀️", "🍑", "🦊", "🐼", "🐱"];
type UserRow = { id: string; profile: string; room_id: string | null };
type RoomRow = {
  id: string;
  owner_id: string;
  partner_id: string | null;
  state: string;
};
class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
function check(ok: unknown, message: string, status = 400): asserts ok {
  if (!ok) throw new HttpError(status, message);
}

const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export async function createApp(options: {
  databaseURL?: string;
  databaseCA?: string;
  databasePassword?: string;
  schema?: string;
  dropSchemaOnClose?: boolean;
  dbPath: string;
  publicOrigin?: string;
  staticDir?: string;
  demo?: boolean;
  secureCookie?: boolean;
}) {
  const storage = await createStorage(options);
  const user = async (id: string) =>
    (await storage.get("SELECT * FROM users WHERE id=?", id)) as
      UserRow | undefined;
  const room = async (id: string) =>
    (await storage.get("SELECT * FROM rooms WHERE id=?", id)) as
      RoomRow | undefined;
  const putRoom = async (r: RoomRow, state: GameState) =>
    await storage.run(
      "UPDATE rooms SET state=?,partner_id=? WHERE id=?",
      JSON.stringify(state),
      r.partner_id,
      r.id,
    );
  async function readState(r: RoomRow): Promise<GameState> {
    const state = JSON.parse(r.state) as GameState;
    if (options.demo === false && state.couple?.status === "bound") {
      const day = naturalDay(state.couple.boundAt, new Date().toISOString());
      if (day && day > state.demoDay) {
        state.demoDay = day;
        state.revision++;
        state.valuations.push({
          id: uid(),
          createdAt: new Date().toISOString(),
          day,
          cents: valuation(day, qualityScore(state.pet!.quality)),
          quality: qualityScore(state.pet!.quality),
          reason: "服务端自然日推进",
        });
        await putRoom(r, state);
        r.state = JSON.stringify(state);
      }
    }
    return state;
  }
  const profile = (u: UserRow) => JSON.parse(u.profile) as Profile;
  const getRoom = async (u: UserRow) =>
    u.room_id ? await room(u.room_id) : undefined;
  const roleOf = (u: UserRow, r: RoomRow): Role => {
    check(
      r.owner_id === u.id || r.partner_id === u.id,
      "你没有这个房间的权限",
      403,
    );
    return r.owner_id === u.id ? "A" : "B";
  };
  const view = async (u: UserRow): Promise<SessionSnapshot> => {
    const r = await getRoom(u);
    const role = r ? roleOf(u, r) : "A";
    const state = r ? await readState(r) : initialState();
    if (!r)
      state.users = [
        {
          id: u.id,
          name: profile(u).name,
          role: "A",
          createdAt: profile(u).createdAt,
        },
      ];
    const projected = publicState(state, role);
    projected.analytics = projected.analytics.filter((e) => e.role === role);
    return {
      me: profile(u),
      role,
      owner: !!r && r.owner_id === u.id,
      roomId: r?.id ?? null,
      state: projected,
      demo: options.demo !== false,
    };
  };
  async function session(req: IncomingMessage, res: ServerResponse) {
    const token = (req.headers.cookie ?? "")
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("jagat_session="))
      ?.slice(14);
    const row = token
      ? ((await storage.get(
          "SELECT user_id FROM sessions WHERE token_hash=? AND expires_at>?",
          hash(token),
          Date.now(),
        )) as { user_id: string } | undefined)
      : undefined;
    if (row) {
      const u = await user(row.user_id);
      if (u) return u;
    }
    const id = uid(),
      secret = randomBytes(32).toString("hex");
    const p: Profile = {
      id,
      name: "新朋友",
      avatar: "🌷",
      city: "心动小镇",
      bio: "",
      createdAt: new Date().toISOString(),
    };
    await storage.run(
      "INSERT INTO users(id,profile) VALUES (?,?)",
      id,
      JSON.stringify(p),
    );
    await storage.run(
      "INSERT INTO sessions VALUES (?,?,?)",
      hash(secret),
      id,
      Date.now() + 180 * 86400000,
    );
    res.setHeader(
      "Set-Cookie",
      `jagat_session=${secret}; HttpOnly; Path=/; SameSite=Lax; Max-Age=15552000${options.secureCookie ? "; Secure" : ""}`,
    );
    return (await user(id))!;
  }
  async function body(req: IncomingMessage) {
    let data = "";
    for await (const chunk of req) {
      data += chunk.toString();
      check(data.length <= 32768, "请求内容过大", 413);
    }
    try {
      return data ? JSON.parse(data) : {};
    } catch {
      throw new HttpError(400, "请求格式错误");
    }
  }
  const json = (res: ServerResponse, value: unknown, status = 200) => {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(value));
  };
  const rate = new Map<string, { count: number; start: number }>();
  const server = createServer(async (req, res) => {
    try {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Referrer-Policy", "same-origin");
      res.setHeader("X-Frame-Options", "SAMEORIGIN");
      const url = new URL(req.url || "/", "http://localhost");
      if (url.pathname === "/api/health") {
        await storage.get("SELECT 1 AS ready");
        json(res, { ok: true });
        return;
      }
      if (!url.pathname.startsWith("/api/")) {
        if (options.staticDir) {
          let file = resolve(
            options.staticDir,
            "." + decodeURIComponent(url.pathname),
          );
          const root = resolve(options.staticDir);
          check(file.startsWith(root + sep) || file === root, "无效路径", 403);
          if (!existsSync(file) || statSync(file).isDirectory())
            file = resolve(root, "index.html");
          check(existsSync(file), "请先运行 npm run build", 404);
          const types: Record<string, string> = {
            ".html": "text/html; charset=utf-8",
            ".js": "text/javascript",
            ".css": "text/css",
            ".svg": "image/svg+xml",
            ".png": "image/png",
          };
          res.setHeader(
            "Content-Type",
            types[extname(file)] || "application/octet-stream",
          );
          res.setHeader(
            "Cache-Control",
            extname(file) === ".html" ? "no-cache" : "public,max-age=3600",
          );
          res.end(readFileSync(file));
          return;
        }
        throw new HttpError(404, "接口不存在");
      }
      if (req.method !== "GET") {
        const origin = req.headers.origin;
        const expected = options.publicOrigin || `http://${req.headers.host}`;
        check(
          !origin || origin === expected,
          "请求来源不匹配，请从游戏页面操作",
          403,
        );
        check(
          req.headers["content-type"]?.startsWith("application/json"),
          "需要JSON请求",
          415,
        );
      }
      const data = req.method === "GET" ? {} : await body(req);
      let response: { value: unknown; status: number } | null = null;
      const send = (_res: ServerResponse, value: unknown, status = 200) => {
        response = { value, status };
      };
      await storage.transaction(async () => {
        const u = await session(req, res);
        let limiter = rate.get(u.id);
        if (!limiter || Date.now() - limiter.start > 60000) {
          limiter = { count: 0, start: Date.now() };
          rate.set(u.id, limiter);
        }
        check(++limiter.count <= 180, "操作过于频繁，请稍后重试", 429);
        if (rate.size > 5000) {
          for (const [key, v] of rate)
            if (Date.now() - v.start > 60000) rate.delete(key);
        }
        if (req.method === "GET" && url.pathname === "/api/session") {
          send(res, await view(u));
          return;
        }
        const inviteMatch = url.pathname.match(
          /^\/api\/invites\/([a-zA-Z0-9-]+)(\/accept)?$/,
        );
        if (req.method === "GET" && inviteMatch) {
          const i = (await storage.get(
            "SELECT room_id,expires_at FROM invites WHERE token_hash=?",
            hash(inviteMatch[1]),
          )) as { room_id: string; expires_at: number } | undefined;
          check(i, "邀请不存在或已失效", 404);
          const r = await room(i.room_id);
          check(r, "邀请不存在", 404);
          const state = await readState(r);
          const host = profile((await user(r.owner_id))!);
          const status: Invitation["status"] =
            state.couple?.status === "unbound"
              ? "unavailable"
              : r.owner_id === u.id
                ? "mine"
                : r.partner_id === u.id
                  ? "joined"
                  : i.expires_at < Date.now()
                    ? "expired"
                    : r.partner_id
                      ? "unavailable"
                      : "available";
          send(res, {
            petName: state.pet!.name,
            city: state.couple!.city,
            inviter: { name: host.name, avatar: host.avatar },
            expiresAt: new Date(i.expires_at).toISOString(),
            status,
          });
          return;
        }

        {
          const current = (await user(u.id))!;
          if (req.method === "PATCH" && url.pathname === "/api/profile") {
            const p = profile(current);
            check(
              typeof data.name === "string" &&
                data.name.trim().length >= 1 &&
                data.name.trim().length <= 20,
              "昵称需要1–20个字",
            );
            check(avatars.includes(data.avatar), "请选择可用头像");
            check(
              typeof data.city === "string" && data.city.trim().length <= 30,
              "城市最多30个字",
            );
            check(
              typeof data.bio === "string" && data.bio.trim().length <= 120,
              "个人简介最多120个字",
            );
            const updated = {
              ...p,
              name: data.name.trim(),
              avatar: data.avatar,
              city: data.city.trim(),
              bio: data.bio.trim(),
            };
            await storage.run(
              "UPDATE users SET profile=? WHERE id=?",
              JSON.stringify(updated),
              u.id,
            );
            const r = await getRoom(current);
            if (r) {
              const s = await readState(r);
              s.users = s.users.map((person) =>
                person.id === u.id
                  ? { ...person, name: updated.name, avatar: updated.avatar }
                  : person,
              );
              s.revision++;
              await putRoom(r, s);
            }
            send(res, await view((await user(u.id))!));
            return;
          }
          if (req.method === "POST" && url.pathname === "/api/rooms") {
            check(!current.room_id, "你已经在一个房间里了", 409);
            check(profile(current).name !== "新朋友", "请先设置个人昵称");
            let s = reduceCommand(initialState(), "A", {
              id: uid(),
              type: "adopt",
              payload: data,
            });
            s.users = [
              {
                id: u.id,
                role: "A",
                name: profile(current).name,
                avatar: profile(current).avatar,
                createdAt: profile(current).createdAt,
              },
              {
                id: "pending",
                role: "B",
                name: "等待另一位加入",
                createdAt: new Date().toISOString(),
              },
            ];
            const id = uid();
            s.couple!.id = id;
            await storage.run(
              "INSERT INTO rooms VALUES (?,?,NULL,?)",
              id,
              u.id,
              JSON.stringify(s),
            );
            await storage.run(
              "UPDATE users SET room_id=? WHERE id=?",
              id,
              u.id,
            );
            await storage.run(
              "INSERT INTO invites VALUES (?,?,?)",
              hash(s.couple!.inviteToken),
              id,
              Date.parse(s.couple!.expiresAt),
            );
            send(res, await view((await user(u.id))!), 201);
            return;
          }
          if (req.method === "POST" && inviteMatch?.[2]) {
            const i = (await storage.get(
              "SELECT room_id,expires_at FROM invites WHERE token_hash=?",
              hash(inviteMatch[1]),
            )) as { room_id: string; expires_at: number } | undefined;
            check(i, "邀请不存在", 404);
            const r = await room(i.room_id);
            check(r, "房间不存在", 404);
            check(r.owner_id !== u.id, "不能接受自己的邀请");
            if (r.partner_id === u.id) {
              send(res, await view(current));
              return;
            }
            check(!current.room_id, "请先退出当前房间，再接受新的邀请", 409);
            check(profile(current).name !== "新朋友", "请先设置个人昵称");
            check(i.expires_at > Date.now(), "邀请已过期，请对方重新生成", 410);
            check(!r.partner_id, "该邀请已被其他人接受", 409);
            let s = await readState(r);
            s = reduceCommand(s, "B", {
              id: uid(),
              type: "accept",
              payload: { token: inviteMatch[1] },
            });
            s.users[1] = {
              id: u.id,
              role: "B",
              name: profile(current).name,
              avatar: profile(current).avatar,
              createdAt: profile(current).createdAt,
            };
            s = reduceCommand(s, "A", { id: uid(), type: "bind" });
            r.partner_id = u.id;
            await putRoom(r, s);
            await storage.run(
              "UPDATE users SET room_id=? WHERE id=?",
              r.id,
              u.id,
            );
            send(res, await view((await user(u.id))!));
            return;
          }
          if (req.method === "POST" && url.pathname === "/api/rooms/invite") {
            const r = await getRoom(current);
            check(r && r.owner_id === u.id, "只有房主可以生成邀请", 403);
            let s = await readState(r);
            s = reduceCommand(s, "A", { id: uid(), type: "invite_create" });
            await storage.run("DELETE FROM invites WHERE room_id=?", r.id);
            await storage.run(
              "INSERT INTO invites VALUES (?,?,?)",
              hash(s.couple!.inviteToken),
              r.id,
              Date.parse(s.couple!.expiresAt),
            );
            await putRoom(r, s);
            send(res, await view(current));
            return;
          }
          if (req.method === "POST" && url.pathname === "/api/commands") {
            const r = await getRoom(current);
            check(r, "请先创建或加入房间", 403);
            const actor = roleOf(current, r);
            check(
              typeof data.id === "string" &&
                data.id.length <= 80 &&
                typeof data.type === "string",
              "无效操作",
            );
            check(
              ![
                "adopt",
                "accept",
                "bind",
                "invite_create",
                "invite_open",
              ].includes(data.type),
              "请使用房间邀请流程",
              403,
            );
            if (["day", "reward_review", "ad"].includes(data.type))
              check(options.demo !== false, "正式模式不开放此演示操作", 403);
            if (data.type === "day")
              check(r.owner_id === u.id, "只有房主能调整演示日期", 403);
            let s = await readState(r);
            s = reduceCommand(s, actor, data as Command);
            await putRoom(r, s);
            if (data.type === "unbind")
              await storage.run(
                "UPDATE users SET room_id=NULL WHERE room_id=?",
                r.id,
              );
            send(res, await view((await user(u.id))!));
            return;
          }
          throw new HttpError(404, "接口不存在");
        }
      });
      if (response) {
        const result = response as { value: unknown; status: number };
        json(res, result.value, result.status);
      }
    } catch (e) {
      const databaseFailure =
        typeof (e as { code?: unknown })?.code === "string";
      json(
        res,
        {
          error: databaseFailure
            ? "数据库暂时不可用，请稍后重试"
            : (e as Error).message || "服务暂时不可用",
        },
        e instanceof HttpError ? e.status : databaseFailure ? 503 : 400,
      );
    }
  });
  return {
    server,
    storage,
    close: async () => {
      await new Promise<void>((r) => server.close(() => r()));
      await storage.close();
    },
  };
}
