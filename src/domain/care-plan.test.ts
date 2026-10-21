import { describe, it, expect } from "vitest";
import { initialState, reduceCommand, uid } from "./engine";
import type { GameState, Role } from "./models";
import { dailyTasks, careScore, stageName } from "./care-plan";
function cmd(
  s: GameState,
  type: string,
  payload: Record<string, unknown> = {},
  role: Role = "A",
) {
  return reduceCommand(s, role, { id: uid(), type, payload });
}
function bound() {
  let s = cmd(initialState(), "adopt", { name: "团子" });
  s = cmd(s, "accept", {}, "B");
  return cmd(s, "bind");
}
describe("V4 · 照护与随机日常", () => {
  it("相同宠物同一天刷新不重抽，次日任务变化", () => {
    const s = bound();
    expect(dailyTasks(s)).toEqual(dailyTasks(structuredClone(s)));
    const next = cmd(s, "day", { day: 2 });
    expect(dailyTasks(next).map((t) => t.id)).not.toEqual(
      dailyTasks(s).map((t) => t.id),
    );
    expect(new Set(dailyTasks(s).map((t) => t.kind)).size).toBe(2);
  });
  it("未完成动作不能领奖，不能伪造非当日任务", () => {
    const s = bound(),
      t = dailyTasks(s)[0];
    expect(() => cmd(s, "daily_claim", { task: t.id })).toThrow("先完成");
    expect(() => cmd(s, "daily_claim", { task: "invalid" })).toThrow(
      "不是今日任务",
    );
  });
  it("任一方完成照顾后可领奖，双方不可重复领同一奖励", () => {
    let s = bound();
    const t = dailyTasks(s)[0];
    s = cmd(s, t.action, t.payload, "B");
    const xp = s.pet!.xp;
    s = cmd(s, "daily_claim", { task: t.id });
    expect(s.pet!.xp).toBe(xp + 5);
    expect(() => cmd(s, "daily_claim", { task: t.id }, "B")).toThrow(
      "已经领取",
    );
    expect(careScore(s)).toBe(71);
  });
  it("缺席首日宽限，当日未结束不扣，累计XP与进化历史不倒退", () => {
    let s = bound();
    expect(careScore(s)).toBe(70);
    s = cmd(s, "day", { day: 2 });
    expect(careScore(s)).toBe(70);
    s = cmd(s, "day", { day: 3 });
    expect(careScore(s)).toBe(68);
    s = cmd(s, "feed", { food: "basic" });
    expect(careScore(s)).toBe(70);
    expect(s.pet!.xp).toBe(5);
  });
  it("长时间缺席有下限，免费喂养可恢复，重复读分不累扣", () => {
    let s = cmd(bound(), "day", { day: 99 });
    expect(careScore(s)).toBe(20);
    expect(careScore(s)).toBe(20);
    s = cmd(s, "feed", { food: "basic" });
    expect(careScore(s)).toBe(22);
  });
  it("一房一份模拟权益，方法白名单，不能重复激活", () => {
    let s = bound();
    expect(() => cmd(s, "care_plan_activate", { method: "cash" })).toThrow(
      "请选择",
    );
    s = cmd(s, "care_plan_activate", { method: "member_mock" }, "B");
    expect(s.carePlan?.activatedBy).toBe("B");
    expect(() => cmd(s, "care_plan_activate", { method: "fee_mock" })).toThrow(
      "不重复",
    );
    expect(s.wallet.hearts).toBe(300);
  });
  it("未绑定不能开权益，阶段命名覆盖整个99天", () => {
    expect(() =>
      cmd(initialState(), "care_plan_activate", { method: "fee_mock" }),
    ).toThrow();
    expect(stageName(1)).toBe("初遇期");
    expect(stageName(99)).toBe("信任期");
  });
});
