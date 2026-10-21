import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "./app";
import type { AddressInfo } from "node:net";
import type { SessionSnapshot } from "../src/services/session-types";
import { uid } from "../src/domain/engine";
async function fixture(options: { demo?: boolean } = {}) {
  const app = await createApp({
    dbPath: ":memory:",
    databaseURL: process.env.TEST_DATABASE_URL,
    schema: `jagat_test_${uid().replaceAll("-", "")}`,
    dropSchemaOnClose: true,
    ...options,
  });
  await new Promise<void>((r) => app.server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
  function client() {
    let cookie = "";
    return {
      async call(path: string, method = "GET", body?: unknown) {
        const r = await fetch(base + path, {
          method,
          headers: {
            ...(cookie ? { Cookie: cookie } : {}),
            ...(body ? { "Content-Type": "application/json" } : {}),
          },
          body: body ? JSON.stringify(body) : undefined,
        });
        const set = r.headers.get("set-cookie");
        if (set) cookie = set.split(";")[0];
        return { status: r.status, data: await r.json(), cookie };
      },
      async setup(name: string) {
        await this.call("/api/session");
        return this.call("/api/profile", "PATCH", {
          name,
          avatar: "🌿",
          city: name + "的城市",
          bio: name + "的私人简介",
        });
      },
    };
  }
  return {
    app,
    client,
    async close() {
      await new Promise<void>((r) => app.server.close(() => r()));
      await app.storage.close();
    },
  };
}
async function room(f: Awaited<ReturnType<typeof fixture>>) {
  const a = f.client(),
    b = f.client();
  await a.setup("小桃");
  await b.setup("小森");
  const created = await a.call("/api/rooms", "POST", {
    name: "团团",
    city: "杭州",
    color: 0,
  });
  const token = created.data.state.couple.inviteToken;
  return { a, b, token, created };
}
const command = (type: string, payload = {}) => ({ id: uid(), type, payload });
test("各浏览器是独立身份，只能编辑自己的个人资料", async () => {
  const f = await fixture();
  try {
    const a = f.client(),
      b = f.client();
    const aa = await a.setup("小桃"),
      bb = await b.setup("小森");
    assert.notEqual(aa.data.me.id, bb.data.me.id);
    assert.notEqual(aa.cookie, bb.cookie);
    await b.call("/api/profile", "PATCH", {
      name: "小森林",
      avatar: "🌙",
      city: "成都",
      bio: "只属于我的简介",
      id: aa.data.me.id,
    });
    assert.equal((await a.call("/api/session")).data.me.name, "小桃");
    assert.equal((await b.call("/api/session")).data.me.name, "小森林");
    assert.equal(aa.data.state.couple, null);
    assert.match(aa.cookie, /jagat_session=/);
  } finally {
    await f.close();
  }
});
test("一人建房邀请，另一个人接受后直接成立，无需房主再次确认", async () => {
  const f = await fixture();
  try {
    const { a, b, token, created } = await room(f);
    assert.equal(created.data.state.couple.status, "inviting");
    assert.equal(created.data.state.couple.boundAt, null);
    assert.equal(
      (await a.call("/api/commands", "POST", command("feed"))).status,
      400,
    );
    const invite = await b.call("/api/invites/" + token);
    assert.equal(invite.data.inviter.name, "小桃");
    assert.equal(invite.data.status, "available");
    const accepted = await b.call(
      "/api/invites/" + token + "/accept",
      "POST",
      {},
    );
    assert.equal(accepted.status, 200);
    assert.equal(accepted.data.state.couple.status, "bound");
    assert.equal(accepted.data.role, "B");
    const owner = await a.call("/api/session");
    assert.equal(owner.data.state.couple.status, "bound");
    assert.equal(owner.data.roomId, accepted.data.roomId);
    const again = await b.call("/api/invites/" + token + "/accept", "POST", {});
    assert.equal(again.data.state.revision, accepted.data.state.revision);
    assert.equal(
      again.data.state.couple.boundAt,
      accepted.data.state.couple.boundAt,
    );
  } finally {
    await f.close();
  }
});
test("不能接受自己的邀请、不能伪造角色或用旧bind命令操作", async () => {
  const f = await fixture();
  try {
    const { a, b, token } = await room(f);
    assert.equal(
      (await a.call("/api/invites/" + token + "/accept", "POST", {})).status,
      400,
    );
    assert.equal(
      (await a.call("/api/commands", "POST", command("bind"))).status,
      403,
    );
    await b.call("/api/invites/" + token + "/accept", "POST", {});
    await a.call("/api/commands", "POST", command("day", { day: 99 }));
    await a.call("/api/commands", "POST", {
      ...command("vote", { choice: "keep" }),
      role: "B",
    });
    const snapshot = (await a.call("/api/session")).data as SessionSnapshot;
    assert.deepEqual(snapshot.state.votes, { A: true, B: false });
    assert.equal(
      (await b.call("/api/commands", "POST", command("day", { day: 20 })))
        .status,
      403,
    );
  } finally {
    await f.close();
  }
});
test("双方共同换装与家具同步，房间外的人无法读取进度或伪造成员", async () => {
  const f = await fixture();
  try {
    const { a, b, token } = await room(f);
    await b.call("/api/invites/" + token + "/accept", "POST", {});
    await a.call("/api/commands", "POST", command("purchase", { id: "bow" }));
    await b.call("/api/commands", "POST", command("equip", { id: "bow" }));
    assert.equal(
      (await a.call("/api/session")).data.state.outfit.accessory,
      "bow",
    );
    await b.call(
      "/api/commands",
      "POST",
      command("house", { wallpaper: "mint", floor: "tile" }),
    );
    assert.equal(
      (await a.call("/api/session")).data.state.house.wallpaper,
      "mint",
    );
    const stranger = f.client();
    await stranger.setup("路人");
    const outside = await stranger.call("/api/session");
    assert.equal(outside.data.roomId, null);
    assert.equal(outside.data.state.pet, null);
    assert.equal(
      (
        await stranger.call("/api/commands", "POST", {
          ...command("equip", { id: "hat" }),
          roomId: (await a.call("/api/session")).data.roomId,
          role: "A",
        })
      ).status,
      403,
    );
  } finally {
    await f.close();
  }
});
test("邀请过期、重新生成使旧链接失效、已加入其他房间不能再绑定", async () => {
  const f = await fixture();
  try {
    const { a, b, token } = await room(f);
    await f.app.storage.run(
      "UPDATE invites SET expires_at=?",
      Date.now() - 1000,
    );
    assert.equal(
      (await b.call("/api/invites/" + token)).data.status,
      "expired",
    );
    assert.equal(
      (await b.call("/api/invites/" + token + "/accept", "POST", {})).status,
      410,
    );
    const renewed = await a.call("/api/rooms/invite", "POST", {});
    const token2 = renewed.data.state.couple.inviteToken;
    assert.equal((await b.call("/api/invites/" + token)).status, 404);
    await b.call("/api/rooms", "POST", { name: "另一只", city: "上海" });
    assert.equal(
      (await b.call("/api/invites/" + token2 + "/accept", "POST", {})).status,
      409,
    );
  } finally {
    await f.close();
  }
});
test("两个受邀者并发接受，只允许一人加入", async () => {
  const f = await fixture();
  try {
    const { b, token } = await room(f);
    const c = f.client();
    await c.setup("小云");
    const result = await Promise.all([
      b.call("/api/invites/" + token + "/accept", "POST", {}),
      c.call("/api/invites/" + token + "/accept", "POST", {}),
    ]);
    assert.deepEqual(result.map((r) => r.status).sort(), [200, 409]);
  } finally {
    await f.close();
  }
});
test("个人简介不泄露给伙伴，未解锁情书/选票不返回正文", async () => {
  const f = await fixture();
  try {
    const { a, b, token } = await room(f);
    await b.call("/api/invites/" + token + "/accept", "POST", {});
    await a.call(
      "/api/commands",
      "POST",
      command("future_write", { day: 30, body: "未解锁的秘密" }),
    );
    const hidden = await b.call("/api/session");
    assert.equal(hidden.data.state.futureLetters[0].body, "");
    assert.ok(!JSON.stringify(hidden.data).includes("小桃的私人简介"));
    await a.call("/api/commands", "POST", command("day", { day: 99 }));
    await a.call("/api/commands", "POST", command("vote", { choice: "keep" }));
    const sealed = await b.call("/api/session");
    assert.deepEqual(sealed.data.state.votes, { A: true, B: false });
    assert.equal(sealed.data.state.outcomes.length, 0);
    assert.ok(!JSON.stringify(sealed.data).includes('"choice"'));
  } finally {
    await f.close();
  }
});
test("解除后双方退出，旧邀请失效，不能继续修改旧房间", async () => {
  const f = await fixture();
  try {
    const { a, b, token } = await room(f);
    await b.call("/api/invites/" + token + "/accept", "POST", {});
    await a.call("/api/commands", "POST", command("unbind"));
    assert.equal((await b.call("/api/session")).data.roomId, null);
    assert.equal(
      (await b.call("/api/invites/" + token)).data.status,
      "unavailable",
    );
    assert.equal(
      (await b.call("/api/commands", "POST", command("feed"))).status,
      403,
    );
  } finally {
    await f.close();
  }
});

test("文件存档与会话在服务重启后恢复", async () => {
  const { mkdtempSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = mkdtempSync(join(tmpdir(), "jagat-persist-"));
  const file = join(dir, "game.sqlite");
  let app = await createApp({ dbPath: file });
  async function listen() {
    await new Promise<void>((r) => app.server.listen(0, "127.0.0.1", r));
    return `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
  }
  let base = await listen();
  let cookie = "";
  try {
    const init = await fetch(base + "/api/session");
    cookie = init.headers.get("set-cookie")!.split(";")[0];
    await fetch(base + "/api/profile", {
      method: "PATCH",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "持久化测试",
        avatar: "🌷",
        city: "杭州",
        bio: "我的资料",
      }),
    });
    await new Promise<void>((r) => app.server.close(() => r()));
    await app.storage.close();
    app = await createApp({ dbPath: file });
    base = await listen();
    const response = await fetch(base + "/api/session", {
      headers: { Cookie: cookie },
    });
    const value = await response.json();
    assert.equal(value.me.name, "持久化测试");
    assert.equal(value.me.bio, "我的资料");
  } finally {
    await new Promise<void>((r) => app.server.close(() => r()));
    await app.storage.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test("外部来源写入被拒绝，Cookie带HttpOnly和SameSite", async () => {
  const f = await fixture();
  try {
    const response = await new Promise<{ headers: Record<string, unknown> }>(
      (resolve) => {
        const original = f.app.server.address() as AddressInfo;
        fetch(`http://127.0.0.1:${original.port}/api/session`).then(
          async (r) => {
            assert.match(r.headers.get("set-cookie")!, /HttpOnly/);
            assert.match(r.headers.get("set-cookie")!, /SameSite=Lax/);
            resolve({ headers: {} });
          },
        );
      },
    );
    assert.ok(response);
    const address = f.app.server.address() as AddressInfo;
    const denied = await fetch(`http://127.0.0.1:${address.port}/api/profile`, {
      method: "PATCH",
      headers: {
        Origin: "https://other.example",
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    assert.equal(denied.status, 403);
  } finally {
    await f.close();
  }
});

test("非演示模式按服务端时间推进，不能请求跳日", async () => {
  const f = await fixture({ demo: false });
  try {
    const { a, b, token } = await room(f);
    await b.call("/api/invites/" + token + "/accept", "POST", {});
    const saved = (await f.app.storage.get("SELECT id,state FROM rooms")) as {
      id: string;
      state: string;
    };
    const s = JSON.parse(saved.state);
    s.couple.boundAt = new Date(Date.now() - 2 * 86400000).toISOString();
    await f.app.storage.run(
      "UPDATE rooms SET state=? WHERE id=?",
      JSON.stringify(s),
      saved.id,
    );
    const view = await a.call("/api/session");
    assert.equal(view.data.state.demoDay, 3);
    assert.equal(
      (await a.call("/api/commands", "POST", command("day", { day: 99 })))
        .status,
      403,
    );
    assert.equal(
      (
        await a.call(
          "/api/commands",
          "POST",
          command("care_plan_activate", { method: "fee_mock" }),
        )
      ).status,
      403,
    );
    assert.equal(view.data.demo, false);
  } finally {
    await f.close();
  }
});

test("V4随机任务服务端验证与双人模拟权益持久化", async () => {
  const f = await fixture();
  try {
    const { a, b, token } = await room(f);
    await b.call("/api/invites/" + token + "/accept", "POST", {});
    const state = (await a.call("/api/session")).data.state;
    const { dailyTasks } = await import("../src/domain/care-plan");
    const task = dailyTasks(state)[0];
    assert.equal(
      (
        await a.call(
          "/api/commands",
          "POST",
          command("daily_claim", { task: task.id }),
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await b.call(
          "/api/commands",
          "POST",
          command(task.action, task.payload),
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await a.call(
          "/api/commands",
          "POST",
          command("daily_claim", { task: task.id }),
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await b.call(
          "/api/commands",
          "POST",
          command("daily_claim", { task: task.id }),
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await a.call(
          "/api/commands",
          "POST",
          command("care_plan_activate", { method: "fee_mock" }),
        )
      ).status,
      200,
    );
    const partner = (await b.call("/api/session")).data;
    assert.equal(partner.state.carePlan.method, "fee_mock");
    assert.equal(
      (
        await b.call(
          "/api/commands",
          "POST",
          command("care_plan_activate", { method: "member_mock" }),
        )
      ).status,
      400,
    );
  } finally {
    await f.close();
  }
});
