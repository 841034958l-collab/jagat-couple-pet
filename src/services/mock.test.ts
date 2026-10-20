import { describe, it, expect } from "vitest";
import { MockGameAPI, STORAGE_KEY } from "./mock";
import { uid } from "../domain/engine";
function storage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      data.set(k, v);
    },
    removeItem: (k: string) => {
      data.delete(k);
    },
  };
}
describe("Mock API 持久化边界", () => {
  it("刷新新实例恢复进度，reset清除存档", async () => {
    const db = storage();
    const api = new MockGameAPI(db);
    await api.execute("A", {
      id: uid(),
      type: "adopt",
      payload: { name: "棉花" },
    });
    const after = await new MockGameAPI(db).get("B");
    expect(after.pet?.name).toBe("棉花");
    await api.reset();
    expect((await new MockGameAPI(db).get("A")).pet).toBeNull();
  });
  it("序列化同时请求并去重命令", async () => {
    const api = new MockGameAPI(storage());
    const c = { id: "same", type: "adopt", payload: { name: "棉花" } };
    await Promise.all([api.execute("A", c), api.execute("A", c)]);
    expect((await api.get("A")).revision).toBe(1);
  });
  it("保存失败时不把内存状态伪装为成功", async () => {
    const db = storage();
    const api = new MockGameAPI({
      ...db,
      setItem: () => {
        throw new Error("quota");
      },
    });
    await expect(
      api.execute("A", { id: uid(), type: "adopt", payload: { name: "棉花" } }),
    ).rejects.toThrow("保存失败");
    expect((await api.get("A")).pet).toBeNull();
  });
  it("损坏或不兼容的存档报错，保留原文供用户备份", () => {
    const db = storage();
    db.setItem(STORAGE_KEY, "broken");
    expect(() => new MockGameAPI(db)).toThrow("无法解析");
    expect(db.getItem(STORAGE_KEY)).toBe("broken");
    db.setItem(STORAGE_KEY, JSON.stringify({ schema: 2 }));
    expect(() => new MockGameAPI(db)).toThrow("不兼容");
  });
});

it("嵌套家具或品质损坏不导致页面崩溃，API拒绝加载", async () => {
  const db = storage();
  const api = new MockGameAPI(db);
  await api.execute("A", {
    id: uid(),
    type: "adopt",
    payload: { name: "棉花" },
  });
  const raw = JSON.parse(db.getItem(STORAGE_KEY)!);
  raw.house.positions = {};
  db.setItem(STORAGE_KEY, JSON.stringify(raw));
  expect(() => new MockGameAPI(db)).toThrow("损坏");
});
