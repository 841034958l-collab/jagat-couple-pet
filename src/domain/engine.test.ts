import { describe, it, expect } from "vitest";
import {
  initialState,
  reduceCommand,
  qualityScore,
  valuation,
  level,
  calendar,
  publicState,
  uid,
} from "./engine";
import type { GameState, Role } from "./models";
const now = new Date("2026-10-20T00:00:00Z");
const cmd = (
  s: GameState,
  type: string,
  payload: Record<string, unknown> = {},
  role: Role = "A",
) => reduceCommand(s, role, { id: uid(), type, payload }, now);
function bound() {
  let s = cmd(initialState(), "adopt", {
    name: "年糕",
    city: "上海",
    color: 0,
  });
  s = cmd(s, "accept", {}, "B");
  return cmd(s, "bind");
}
describe("Phase 1 · 核心养成", () => {
  it("双方成功绑定才启动周期", () => {
    let s = cmd(initialState(), "adopt", { name: "团子" });
    expect(s.couple?.boundAt).toBeNull();
    expect(() => cmd(s, "feed")).toThrow();
    s = cmd(s, "accept", {}, "B");
    s = cmd(s, "bind");
    expect(s.couple?.status).toBe("bound");
    expect(s.demoDay).toBe(1);
    expect(s.couple?.boundAt).toBe(now.toISOString());
  });
  it("估值边界、整数分和五维权重", () => {
    expect(qualityScore({ N: 100, E: 0, X: 0, R: 0, L: 0 })).toBe(25);
    expect(qualityScore({ N: 100, E: 100, X: 100, R: 100, L: 100 })).toBe(100);
    expect(valuation(99, 100)).toBe(19890);
    expect(valuation(0, -10)).toBe(2071);
    expect(valuation(999, 999)).toBe(19890);
  });
  it("免费喂养每日最多2次，XP不重复领取", () => {
    let s = cmd(bound(), "feed");
    s = cmd(s, "feed", {}, "B");
    expect(s.pet?.xp).toBe(10);
    expect(s.pet?.quality.N).toBe(10);
    expect(() => cmd(s, "feed")).toThrow("今日已完成");
    expect(calendar(s)[0].roles).toEqual(["A", "B"]);
  });
  it("同一个命令幂等，等级只增加", () => {
    let s = bound();
    const c = { id: "one", type: "feed" };
    s = reduceCommand(s, "A", c);
    const again = reduceCommand(s, "A", c);
    expect(again).toEqual(s);
    expect(level(30)).toBe(2);
    expect(level(80)).toBe(3);
  });
  it("五维每日上限与历史追溯", () => {
    let s = bound();
    for (const kind of ["pet", "rest", "story", "tidy"])
      s = cmd(s, "care", { kind });
    expect(s.pet?.quality.E).toBe(10);
    expect(s.pet?.quality.L).toBe(10);
    expect(s.events.every((e) => e.id && e.createdAt && e.key)).toBe(true);
    s = cmd(s, "day", { day: 2 });
    s = cmd(s, "care", { kind: "pet" });
    expect(s.pet?.quality.E).toBe(15);
    s = cmd(s, "day", { day: 1 });
    expect(() => cmd(s, "care", { kind: "pet" })).toThrow();
    expect(s.events.filter((e) => e.day === 2)).toHaveLength(1);
  });
  it("未记录日期不生成虚假照顾", () => {
    let s = cmd(bound(), "day", { day: 99 });
    expect(calendar(s)[98].events).toHaveLength(0);
    expect(s.pet?.xp).toBe(0);
  });
});
describe("隐私、双人任务与成长", () => {
  it("邀请过期和重复绑定", () => {
    const s = cmd(initialState(), "adopt", { name: "团子" });
    expect(() =>
      reduceCommand(
        s,
        "B",
        { id: uid(), type: "accept" },
        new Date("2026-10-22"),
      ),
    ).toThrow("过期");
    expect(() => cmd(bound(), "accept", {}, "B")).toThrow();
  });
  it("未来信件未到日不向接收者返回正文，发送者可撤回", () => {
    let s = cmd(bound(), "future_write", { day: 30, body: "秘密正文" });
    expect(publicState(s, "B").futureLetters[0].body).toBe("");
    expect(publicState(s, "A").futureLetters[0].body).toBe("秘密正文");
    const id = s.futureLetters[0].id;
    s = cmd(s, "future_delete", { id });
    expect(s.futureLetters[0].body).toBe("");
    expect(publicState(s, "B").futureLetters).toHaveLength(0);
  });
  it("双人异步提交前隐藏另一方答案", () => {
    let s = cmd(bound(), "challenge_start", { kind: "晚餐" });
    s = cmd(s, "challenge_answer", { value: "火锅", guess: "面条" });
    expect(publicState(s, "B").challenge?.result).toBeNull();
    expect(publicState(s, "B").challenge?.mine).toBeNull();
    s = cmd(s, "challenge_answer", { value: "面条", guess: "火锅" }, "B");
    expect(publicState(s, "B").challenge?.result?.matches).toBe(2);
    expect(s.pet?.bond).toBe(10);
  });
  it("寻宠要求A/B查看线索，奖励不重复", () => {
    let s = cmd(bound(), "adventure_start");
    const target = s.adventure!.target;
    expect(publicState(s, "A").adventure).not.toHaveProperty("target");
    expect(() => cmd(s, "location", { id: target })).toThrow("两位");
    s = cmd(s, "clue");
    s = cmd(s, "clue", {}, "B");
    s = cmd(s, "location", { id: target });
    expect(s.pet?.xp).toBe(20);
    expect(s.diaries).toHaveLength(1);
    expect(() => cmd(s, "adventure_start")).toThrow("今天已经");
  });
});
describe("商城与奖励", () => {
  it("余额不足、重复购买、实际装备", () => {
    let s = bound();
    expect(() => cmd(s, "purchase", { id: "sakura" })).not.toThrow();
    s = cmd(s, "purchase", { id: "bow" });
    expect(s.wallet.hearts).toBe(200);
    expect(() => cmd(s, "purchase", { id: "bow" })).toThrow("已经拥有");
    expect(() => cmd(s, "purchase", { id: "hat" })).toThrow("余额不足");
    s = cmd(s, "equip", { id: "bow" });
    expect(s.outfit.accessory).toBe("bow");
    expect(s.pet?.quality).toEqual({ N: 0, E: 0, X: 0, R: 0, L: 0 });
  });
  it("里程碑与申请去重，不要求UGC消费广告", () => {
    let s = cmd(bound(), "day", { day: 10 });
    s = cmd(s, "claim", { id: "m10" });
    expect(s.pet?.xp).toBe(100);
    expect(() => cmd(s, "claim", { id: "m10" })).toThrow("已经领取");
    s = cmd(s, "reward_apply", { id: "m10" });
    expect(s.applications[0].status).toBe("submitted_mock");
    expect(s.applications[0].amountCents).toBe(200);
    expect(() => cmd(s, "reward_apply", { id: "m10" })).toThrow("重复");
  });
});
describe("秘密终局与解绑", () => {
  for (const [a, b, result] of [
    ["keep", "keep", "home"],
    ["jagat", "jagat", "planet"],
    ["keep", "jagat", "discuss"],
  ])
    it(`三种结局 ${result}`, () => {
      let s = cmd(bound(), "day", { day: 99 });
      s = cmd(s, "vote", { choice: a });
      expect(s.outcomes).toHaveLength(0);
      expect(publicState(s, "B").votes).toEqual({ A: true, B: false });
      expect(publicState(s, "B").votes).not.toHaveProperty("choice");
      expect(() => cmd(s, "vote", { choice: a })).toThrow("已提交");
      s = cmd(s, "vote", { choice: b }, "B");
      expect(s.outcomes[0].kind).toBe(result);
      expect(() =>
        cmd(s, "share", { kind: "99天秘密结局", format: "3:4" }),
      ).toThrow("双方");
      if (result === "discuss") {
        s = cmd(s, "revote");
        expect(s.voteRound).toBe(2);
        expect(publicState(s, "A").votes).toEqual({ A: false, B: false });
      } else {
        s = cmd(s, "outcome_confirm");
        expect(s.outcomes[0].confirmed).toBe(true);
        s = cmd(s, "claim", { id: "m99" });
        expect(s.claimed).toContain("m99");
      }
    });
  it("解除绑定清除私人信件并阻止互动", () => {
    let s = cmd(bound(), "future_write", { day: 30, body: "private" });
    s = cmd(s, "unbind");
    expect(s.futureLetters.every((l) => l.body === "")).toBe(true);
    expect(() => cmd(s, "feed")).toThrow("共同领养");
    expect(s.events.length).toBeGreaterThan(0);
  });
  it("埋点不含私人信件正文", () => {
    const s = cmd(bound(), "letter_send", { body: "secret private text" });
    expect(JSON.stringify(s.analytics)).not.toContain("secret private text");
  });
});

describe("补充边界", () => {
  it("十个照顾日，免费任务足以达到五维品质100", () => {
    let s = bound();
    for (let d = 1; d <= 10; d++) {
      s = cmd(s, "day", { day: d });
      s = cmd(s, "feed");
      s = cmd(s, "feed", {}, "B");
      for (const kind of ["pet", "rest", "tidy"]) s = cmd(s, "care", { kind });
      s = cmd(s, "location", { id: "park" });
      s = cmd(s, "adventure_start");
      s = cmd(s, "clue");
      s = cmd(s, "clue", {}, "B");
      s = cmd(s, "location", { id: s.adventure!.target });
    }
    expect(s.pet?.quality).toEqual({ N: 100, E: 100, X: 100, R: 100, L: 100 });
    expect(qualityScore(s.pet!.quality)).toBe(100);
    expect(s.wallet.stars).toBe(18);
    expect(s.applications).toHaveLength(0);
  });
  it("错误查找记录次数，不增加XP；活动中禁止跳日", () => {
    let s = cmd(bound(), "adventure_start");
    s = cmd(s, "clue");
    s = cmd(s, "clue", {}, "B");
    const wrong = ["park", "street", "cafe"].find(
      (l) => l !== s.adventure!.target,
    )!;
    s = cmd(s, "location", { id: wrong });
    expect(s.adventure?.attempts).toBe(1);
    expect(s.adventure?.status).toBe("active");
    expect(s.pet?.xp).toBe(0);
    expect(() => cmd(s, "day", { day: 99 })).toThrow("先完成当前寻宠");
  });
  it("日期解锁未来信件，未授权接收者不读取", () => {
    let s = cmd(bound(), "future_write", { day: 30, body: "未来的秘密" });
    expect(publicState(s, "B").futureLetters[0].body).toBe("");
    s = cmd(s, "day", { day: 30 });
    expect(publicState(s, "B").futureLetters[0].body).toBe("未来的秘密");
  });
  it("模拟广告不改变品质、XP、估值贡献，去重装饰", () => {
    let s = bound();
    const before = structuredClone(s.pet);
    s = cmd(s, "ad", { placement: "diary" });
    expect(s.pet?.xp).toBe(before?.xp);
    expect(s.pet?.quality).toEqual(before?.quality);
    expect(s.inventory[0].itemId).toBe("diary-bg");
    expect(() => cmd(s, "ad", { placement: "diary" })).toThrow("今日");
    expect(() => cmd(s, "ad", { placement: "vote" })).toThrow("不显示广告");
  });
  it("双方同意后才能生成结局海报，UGC独立于基础基金", () => {
    let s = cmd(bound(), "day", { day: 99 });
    s = cmd(s, "vote", { choice: "keep" });
    s = cmd(s, "vote", { choice: "keep" }, "B");
    s = cmd(s, "consent");
    expect(() =>
      cmd(s, "share", { kind: "99天秘密结局", format: "9:16" }),
    ).toThrow("双方");
    s = cmd(s, "consent", {}, "B");
    s = cmd(s, "share", { kind: "99天秘密结局", format: "9:16" });
    expect(s.artifacts).toHaveLength(1);
    s = cmd(s, "ugc", { url: "https://example.com/my-post" });
    expect(s.applications[0].kind).toBe("ugc");
    expect(s.applications[0].amountCents).toBe(0);
    expect(() => cmd(s, "ugc", { url: "https://example.com/my-post" })).toThrow(
      "已提交",
    );
  });
});

it("不能把装饰当食物，模拟审核不支付且不可重复审核", () => {
  let s = cmd(bound(), "purchase", { id: "bow" });
  expect(() => cmd(s, "feed", { food: "bow" })).toThrow("只能喂食");
  s = cmd(s, "day", { day: 10 });
  s = cmd(s, "claim", { id: "m10" });
  s = cmd(s, "reward_apply", { id: "m10" });
  const id = s.applications[0].id;
  s = cmd(s, "reward_review", { id, decision: "approve" });
  expect(s.applications[0].status).toBe("approved_mock");
  expect(() => cmd(s, "reward_review", { id, decision: "approve" })).toThrow(
    "没有可审核",
  );
});
