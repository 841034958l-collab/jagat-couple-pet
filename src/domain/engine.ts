import { dailyTasks } from "./care-plan";
import type {
  GameState,
  Role,
  Quality,
  Command,
  PublicState,
  DailyCareRecord,
  FinalOutcome,
} from "./models";
import {
  zeroQuality,
  zeroPersonality,
  weights,
  xpThresholds,
  taskConfig,
  personalities,
  locations,
  milestones,
  catalog,
  story,
  dates,
} from "./config";
export const uid = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const clamp = (n: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, n));
export const qualityScore = (q: Quality) =>
  Math.round(
    Object.entries(weights).reduce(
      (s, [k, w]) => s + clamp(q[k as keyof Quality]) * w,
      0,
    ) * 100,
  ) / 100;
export const valuation = (day: number, q: number) =>
  Math.min(
    19900,
    Math.round(
      1990 + (8000 * clamp(day, 1, 99)) / 99 + (9900 * clamp(q)) / 100,
    ),
  );
export const level = (xp: number) => xpThresholds.filter((t) => t <= xp).length;
export function personality(s: Pick<GameState, "pet">) {
  const p = s.pet?.personality ?? zeroPersonality();
  return [...personalities].sort((a, b) => p[b.key] - p[a.key])[0];
}
export const phase = (day: number) =>
  day >= 77 ? 3 : day >= 49 ? 2 : day >= 21 ? 1 : 0;
export function initialState(): GameState {
  return {
    schema: 3,
    revision: 0,
    demoDay: 1,
    users: [
      {
        id: "player-a",
        role: "A",
        name: "玩家 A",
        createdAt: new Date().toISOString(),
      },
      {
        id: "player-b",
        role: "B",
        name: "玩家 B",
        createdAt: new Date().toISOString(),
      },
    ],
    couple: null,
    pet: null,
    wallet: { id: "wallet", hearts: 300, stars: 18 },
    inventory: [],
    outfit: { id: "outfit", clothing: null, hat: null, accessory: null },
    house: {
      id: "house",
      theme: "cream",
      wallpaper: "cream",
      floor: "wood",
      slots: { bed: "🛏️", bowl: "🥣", toy: "🧸", furniture: "🪴" },
      positions: {
        bed: { x: 16, y: 65 },
        bowl: { x: 70, y: 76 },
        toy: { x: 45, y: 77 },
        furniture: { x: 78, y: 45 },
      },
    },
    events: [],
    nutrition: [],
    valuations: [],
    submissions: [],
    diaries: [],
    futureLetters: [],
    letters: [],
    adventure: null,
    dateMission: null,
    challenge: null,
    needs: {},
    mediation: {},
    claimed: [],
    applications: [],
    votes: [],
    outcomes: [],
    voteRound: 1,
    shareConsent: [],
    artifacts: [],
    analytics: [],
    processed: [],
    storySeen: [],
  };
}
function requireRule(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
export function event(
  s: GameState,
  role: Role,
  name: string,
  properties: Record<string, string | number | boolean> = {},
) {
  s.analytics.push({
    id: uid(),
    createdAt: new Date().toISOString(),
    day: s.demoDay,
    role,
    name,
    properties,
  });
}
function record(
  s: GameState,
  role: Role,
  kind: string,
  label: string,
  xp: number,
  q: Partial<Quality>,
  key: string,
  bond = 0,
  personalityKey?: string,
) {
  const pet = s.pet!;
  const day = s.demoDay;
  const prev = valuation(day, qualityScore(pet.quality));
  const beforeLevel = level(pet.xp);
  const delta = zeroQuality();
  for (const k of Object.keys(delta) as (keyof Quality)[]) {
    const today = s.events
      .filter((e) => e.day === day)
      .reduce((n, e) => n + e.quality[k], 0);
    delta[k] = Math.min(
      q[k] ?? 0,
      Math.max(0, 10 - today),
      100 - pet.quality[k],
    );
    pet.quality[k] += delta[k];
  }
  const beforeH = pet.vitality;
  pet.vitality = clamp(pet.vitality + 8);
  pet.xp += xp;
  pet.bond = clamp(pet.bond + bond);
  if (personalityKey)
    pet.personality[personalityKey as keyof typeof pet.personality] += 1;
  const next = valuation(day, qualityScore(pet.quality));
  const now = new Date().toISOString();
  s.events.push({
    id: uid(),
    createdAt: now,
    day,
    role,
    kind,
    label,
    xp,
    vitality: pet.vitality - beforeH,
    bond,
    quality: delta,
    valuationBefore: prev,
    valuationAfter: next,
    levelBefore: beforeLevel,
    levelAfter: level(pet.xp),
    mood: pet.mood,
    key,
  });
  s.valuations.push({
    id: uid(),
    createdAt: now,
    day,
    cents: next,
    quality: qualityScore(pet.quality),
    reason: label,
  });
  if (xp) event(s, role, "pet_xp_gain", { amount: xp });
  if (Object.values(delta).some((v) => v > 0))
    event(s, role, "pet_quality_update", { score: qualityScore(pet.quality) });
  if (next !== prev)
    event(s, role, "pet_valuation_change", { before: prev, after: next });
  event(s, role, "daily_care_complete", { kind });
}
function care(s: GameState, role: Role, kind: keyof typeof taskConfig) {
  const t = taskConfig[kind];
  const count = s.events.filter(
    (e) => e.day === s.demoDay && e.kind === kind,
  ).length;
  requireRule(
    count < t.limit,
    `「${t.label}」今日已完成 ${t.limit} 次，明天再来，不影响等级。`,
  );
  record(
    s,
    role,
    kind,
    t.label,
    t.xp,
    t.quality,
    `day:${s.demoDay}:${kind}:${count}`,
    kind === "cooperate" || kind === "date" || kind === "rescue" ? 10 : 0,
    t.personality,
  );
  s.submissions.push({
    id: uid(),
    createdAt: new Date().toISOString(),
    day: s.demoDay,
    role,
    task: kind,
    value: "completed",
    status: "completed",
  });
  s.wallet.hearts += kind === "date" ? 30 : 10;
}
function owned(s: GameState, id: string) {
  return s.inventory.some((i) => i.itemId === id && i.quantity > 0);
}
function give(s: GameState, id: string, quantity = 1) {
  const i = s.inventory.find((i) => i.itemId === id);
  if (i) i.quantity += quantity;
  else
    s.inventory.push({
      id: uid(),
      createdAt: new Date().toISOString(),
      itemId: id,
      quantity,
    });
}
export function reduceCommand(
  input: GameState,
  role: Role,
  command: Command,
  now = new Date(),
): GameState {
  if (input.processed.includes(command.id)) return input;
  const s = structuredClone(input);
  const p = command.payload ?? {};
  const at = now.toISOString();
  const bound = s.couple?.status === "bound";
  const base = { id: uid(), createdAt: at };
  const string = (k: string, max = 500) =>
    String(p[k] ?? "")
      .trim()
      .slice(0, max);
  const requireBound = () =>
    requireRule(bound && s.pet, "请先让双方完成共同领养。");
  switch (command.type) {
    case "adopt": {
      requireRule(role === "A", "请切换到玩家 A 创建房间。");
      requireRule(!s.couple, "已有领养记录；演示新周期请在设置中重置。");
      const name = string("name", 12);
      requireRule(name, "给团子起一个名字吧。");
      s.couple = {
        ...base,
        status: "inviting",
        city: string("city", 20) || "心动小镇",
        inviteToken: uid(),
        expiresAt: new Date(now.getTime() + 24 * 3600000).toISOString(),
        accepted: false,
        confirmed: false,
        boundAt: null,
      };
      s.pet = {
        id: uid(),
        createdAt: at,
        name,
        species: "恋爱团子",
        xp: 0,
        vitality: 70,
        bond: 0,
        quality: zeroQuality(),
        personality: zeroPersonality(),
        mood: "happy",
        position: "home",
        birthColor: clamp(Number(p.color) || 0, 0, 4),
      };
      event(s, role, "pet_adopt_start");
      break;
    }
    case "invite_create":
      requireRule(
        s.couple && role === "A" && s.couple.status === "inviting",
        "只能由待绑定房主创建邀请。",
      );
      s.couple.inviteToken = uid();
      s.couple.expiresAt = new Date(now.getTime() + 24 * 3600000).toISOString();
      event(s, role, "couple_invite_create");
      break;
    case "invite_open":
      event(s, role, "couple_invite_open");
      event(s, role, "new_user_enter");
      break;
    case "accept":
      requireRule(
        s.couple && role === "B" && s.couple.status === "inviting",
        "请由玩家 B 接受待绑定邀请。",
      );
      requireRule(
        now.getTime() < Date.parse(s.couple.expiresAt),
        "邀请已过期，请 A 重新生成。",
      );
      requireRule(
        !p.token || p.token === s.couple.inviteToken,
        "邀请无效，请重新打开邀请。",
      );
      s.couple.accepted = true;
      s.couple.status = "confirming";
      event(s, role, "invite_activate");
      break;
    case "bind":
      requireRule(
        s.couple &&
          role === "A" &&
          s.couple.accepted &&
          s.couple.status === "confirming",
        "请先由玩家 B 接受邀请，再由 A 确认。",
      );
      s.couple.status = "bound";
      s.couple.confirmed = true;
      s.couple.boundAt = at;
      s.demoDay = 1;
      record(s, role, "adopt", "共同领养成功", 0, {}, "adopt");
      event(s, role, "couple_bind_success");
      event(s, role, "pet_adopt_complete");
      break;
    case "unbind":
      requireRule(s.couple, "暂无绑定。");
      s.couple.status = "unbound";
      s.futureLetters = s.futureLetters.map((l) => ({
        ...l,
        body: "",
        status: "deleted",
      }));
      s.letters = [];
      s.needs = {};
      s.mediation = {};
      s.adventure = null;
      s.dateMission = null;
      s.challenge = null;
      s.shareConsent = [];
      s.votes = [];
      event(s, role, "couple_unbind");
      break;
    case "day": {
      requireBound();
      const day = Number(p.day);
      requireRule(
        Number.isInteger(day) && day >= 1 && day <= 99,
        "日期范围为 D1–D99。",
      );
      requireRule(
        s.adventure?.status !== "active",
        "请先完成当前寻宠，再切换剧情日期。",
      );
      const old = s.demoDay;
      s.demoDay = day;
      const v = valuation(day, qualityScore(s.pet!.quality));
      s.valuations.push({
        ...base,
        day,
        cents: v,
        quality: qualityScore(s.pet!.quality),
        reason: "Demo 剧情日期切换（不代表真实时间流逝）",
      });
      if (phase(old) !== phase(day))
        event(s, role, "pet_personality_evolve", { phase: phase(day) });
      for (const m of milestones)
        if (old < m.day && day >= m.day)
          event(s, role, "milestone_unlock", { milestone: m.id });
      event(s, role, "demo_day_change", { day });
      break;
    }
    case "care_plan_activate": {
      requireBound();
      requireRule(
        ["fee_mock", "member_mock"].includes(String(p.method)),
        "请选择模拟体验方式。",
      );
      requireRule(!s.carePlan, "本房间已激活模拟体验，不重复开通。");
      s.carePlan = {
        method: p.method as "fee_mock" | "member_mock",
        activatedAt: at,
        activatedBy: role,
      };
      event(s, role, "care_plan_activate_mock");
      break;
    }
    case "daily_claim": {
      requireBound();
      const task = dailyTasks(s).find((t) => t.id === p.task);
      requireRule(task, "不是今日任务，请刷新任务页。");
      requireRule(
        s.events.some((e) => e.day === s.demoDay && e.kind === task.kind),
        "请先完成任务中的照顾动作。",
      );
      const key = `daily:${s.demoDay}:${task.id}`;
      requireRule(
        !s.events.some((e) => e.key === key),
        "这个任务今天已经领取过了。",
      );
      record(s, role, "daily_claim", `今日任务：${task.title}`, 5, {}, key);
      s.wallet.hearts += 10;
      break;
    }
    case "feed": {
      requireBound();
      const food = string("food") || "basic";
      requireRule(
        ["basic", "food", "snack"].includes(food),
        "只能喂食基础粮、特色粮或零食。",
      );
      if (food !== "basic") {
        requireRule(owned(s, food), "库存不足，请先兑换。");
        s.inventory.find((i) => i.itemId === food)!.quantity--;
      }
      s.pet!.mood = "happy";
      care(s, role, "feed");
      s.nutrition.push({
        ...base,
        day: s.demoDay,
        role,
        food,
        preference: food === "basic" ? "最安心的味道" : "今天是彩虹口味",
      });
      if (food === "snack")
        s.diaries.push({
          ...base,
          day: s.demoDay,
          text: `${s.pet!.name}：小饼干是星星味的。我决定暂时原谅你们忘记摸摸我的第3秒。`,
          hidden: false,
        });
      event(s, role, "pet_feed", { food });
      break;
    }
    case "care": {
      requireBound();
      const kind = string("kind");
      requireRule(
        ["pet", "rest", "story", "tidy"].includes(kind),
        "未知照顾任务。",
      );
      s.pet!.mood =
        kind === "rest" ? "sleeping" : kind === "story" ? "quiet" : "happy";
      care(s, role, kind as "pet");
      event(s, role, "pet_mood_change", { mood: s.pet!.mood });
      break;
    }
    case "needs":
      requireBound();
      requireRule(
        [
          "想被安慰",
          "想一起玩",
          "想分享开心的事",
          "想安静休息",
          "想被鼓励",
        ].includes(string("value")),
        "请选择一个需要。",
      );
      s.needs[role] = string("value");
      event(s, role, "pet_emotion_interaction", { kind: "needs" });
      break;
    case "mediate":
      requireBound();
      s.mediation[role] = string("value", 30);
      event(s, role, "pet_emotion_interaction", { kind: "mediation" });
      break;
    case "letter_send":
      requireBound();
      requireRule(string("body"), "写一点想说的话吧。");
      requireRule(
        !s.letters.some((l) => !l.reply && l.sender === role),
        "还有一封未回复信件，请等 TA 接收。",
      );
      s.pet!.mood = "shy";
      s.letters.push({
        ...base,
        sender: role,
        body: string("body"),
        reply: null,
      });
      event(s, role, "pet_emotion_interaction", { kind: "send" });
      break;
    case "letter_reply": {
      requireBound();
      const l = s.letters.find((l) => l.id === p.id);
      requireRule(
        l && l.sender !== role && !l.reply,
        "信件已回复或你不是收件人。",
      );
      requireRule(string("body"), "选择或填写回复。");
      l.reply = string("body");
      if (!s.events.some((e) => e.day === s.demoDay && e.kind === "emotion"))
        care(s, role, "emotion");
      event(s, role, "pet_emotion_interaction", { kind: "reply" });
      break;
    }
    case "letter_delete": {
      const l = s.letters.find((l) => l.id === p.id);
      requireRule(l, "信件不存在。");
      s.letters = s.letters.filter((l) => l.id !== p.id);
      break;
    }
    case "future_write": {
      requireBound();
      const day = Number(p.day);
      requireRule(
        [30, 60, 90].includes(day) && day > s.demoDay,
        "只能写给尚未到来的 D30 / D60 / D90。",
      );
      requireRule(string("body"), "写一点未来的心意吧。");
      requireRule(
        !s.futureLetters.some(
          (l) =>
            l.sender === role && l.unlockDay === day && l.status !== "deleted",
        ),
        "同一解锁日已有信件，可先撤回。",
      );
      s.futureLetters.push({
        ...base,
        sender: role,
        recipient: role === "A" ? "B" : "A",
        unlockDay: day,
        body: string("body"),
        status: "sealed",
      });
      break;
    }
    case "future_delete": {
      const l = s.futureLetters.find((l) => l.id === p.id);
      requireRule(
        l && l.sender === role && s.demoDay < l.unlockDay,
        "只能撤回自己尚未到期的信件。",
      );
      l.status = "deleted";
      l.body = "";
      break;
    }
    case "adventure_start": {
      requireBound();
      requireRule(
        !s.adventure || s.adventure.status === "completed",
        "冒险正在进行，先找到团子吧。",
      );
      requireRule(
        !s.events.some((e) => e.day === s.demoDay && e.kind === "rescue"),
        "今天已经找回团子，明天再冒险吧。",
      );
      const pool = locations.filter(
        (l) => l.unlock <= s.demoDay && l.id !== "home",
      );
      s.adventure = {
        ...base,
        day: s.demoDay,
        target: pool[Math.floor(Math.random() * pool.length)].id,
        status: "active",
        seen: [],
        attempts: 0,
      };
      s.pet!.mood = "traveling";
      s.pet!.position = "unknown";
      event(s, role, "map_adventure_start");
      break;
    }
    case "clue":
      requireBound();
      requireRule(s.adventure?.status === "active", "暂无寻宠任务。");
      if (!s.adventure.seen.includes(role)) s.adventure.seen.push(role);
      break;
    case "location": {
      requireBound();
      const l = locations.find((l) => l.id === p.id);
      requireRule(l && l.unlock <= s.demoDay, "该区域尚未解锁。");
      if (s.adventure?.status === "active") {
        requireRule(
          s.adventure.seen.includes("A") && s.adventure.seen.includes("B"),
          "需要两位玩家分别查看线索后再合作寻找。",
        );
        s.adventure.attempts++;
        if (s.adventure.target !== l.id) {
          event(s, role, "map_adventure_wrong", { location: l.id });
          break;
        }
        s.adventure.status = "completed";
        s.pet!.position = "home";
        s.pet!.mood = "happy";
        care(s, role, "rescue");
        s.diaries.unshift({
          ...base,
          day: s.demoDay,
          text: `本团子只是去${l.name}考察一下，才没有迷路！两位铲屎官看了两份线索、找了${s.adventure.attempts}次才接到我。下次罚你们多讲一个睡前故事。`,
          hidden: false,
        });
        event(s, role, "map_adventure_complete");
      } else {
        s.pet!.position = l.id;
        if (!s.events.some((e) => e.day === s.demoDay && e.kind === "explore"))
          care(s, role, "explore");
        event(s, role, "map_location_visit", { location: l.id });
      }
      break;
    }
    case "challenge_start":
      requireBound();
      requireRule(
        !s.challenge || s.challenge.status === "completed",
        "先完成当前双人任务。",
      );
      requireRule(
        ["晚餐", "心情", "约会", "装扮", "密码"].includes(string("kind")),
        "选择有效题目。",
      );
      s.challenge = {
        ...base,
        day: s.demoDay,
        kind: string("kind"),
        answers: {},
        guesses: {},
        status: "active",
      };
      event(s, role, "challenge_start");
      break;
    case "challenge_answer": {
      requireBound();
      const c = s.challenge;
      requireRule(
        c && c.status === "active" && !c.answers[role],
        "当前角色已提交或任务未开启。",
      );
      requireRule(string("value") && string("guess"), "请填写选择与猜测。");
      c.answers[role] = string("value", 40);
      c.guesses[role] = string("guess", 40);
      if (c.answers.A && c.answers.B) {
        c.status = "completed";
        if (
          !s.events.some((e) => e.day === s.demoDay && e.kind === "cooperate")
        )
          care(s, role, "cooperate");
        event(s, role, "couple_task_complete", { kind: c.kind });
      }
      break;
    }
    case "date_draw":
      requireBound();
      requireRule(
        !s.dateMission || s.dateMission.status === "completed",
        "请先共同完成当前约会任务。",
      );
      {
        const d = dates[Math.floor(Math.random() * dates.length)];
        const preferences =
          s.challenge?.kind === "约会" && s.challenge.status === "completed"
            ? ` 两位的偏好：${s.challenge.answers.A} / ${s.challenge.answers.B}，请据此一起选择舒服的地点。`
            : "";
        s.dateMission = {
          ...base,
          day: s.demoDay,
          ...d,
          description: d.description + preferences,
          completed: [],
          status: "active",
        };
      }
      break;
    case "date_complete":
      requireBound();
      requireRule(s.dateMission?.status === "active", "暂无待完成约会。");
      requireRule(
        !s.dateMission.completed.includes(role),
        "你已确认，等另一位确认。",
      );
      s.dateMission.completed.push(role);
      if (s.dateMission.completed.length === 2) {
        s.dateMission.status = "completed";
        if (!s.events.some((e) => e.day === s.demoDay && e.kind === "date"))
          care(s, role, "date");
        s.diaries.unshift({
          ...base,
          day: s.demoDay,
          text: `今日约会报告：${s.dateMission.title}。两位主人都确认完成。本团子宣布，今天的快乐含量超标！`,
          hidden: false,
        });
        event(s, role, "date_mission_complete");
      }
      break;
    case "shop_view":
      event(s, role, "shop_item_view", { item: string("id", 40) });
      break;
    case "purchase": {
      requireBound();
      const item = catalog.find((i) => i.id === p.id);
      requireRule(item, "商品不存在。");
      requireRule(item.consumable || !owned(s, item.id), "已经拥有这件商品。");
      requireRule(
        s.wallet[item.currency] >= item.price,
        "余额不足，完成任务可赚爱心币；星星币仅为模拟。",
      );
      s.wallet[item.currency] -= item.price;
      give(s, item.id);
      event(s, role, "shop_purchase_mock", {
        item: item.id,
        currency: item.currency,
        price: item.price,
      });
      break;
    }
    case "equip": {
      requireBound();
      const id = string("id");
      requireRule(owned(s, id), "请先获得该商品。");
      const category = catalog.find((i) => i.id === id)?.category;
      if (category === "帽子") s.outfit.hat = id;
      else if (category === "配饰") s.outfit.accessory = id;
      else if (category === "服装" || id === "grad") s.outfit.clothing = id;
      else if (category === "主题") {
        s.house.theme = "sakura";
        s.house.wallpaper = "pink";
      } else if (category === "家具") s.house.slots.furniture = "🛋️";
      else if (category === "玩具") s.house.slots.toy = "🧶";
      else throw new Error("此物品请在喂养或纪念册中使用。");
      event(s, role, "pet_outfit_change", { item: id });
      break;
    }
    case "unequip":
      requireBound();
      s.outfit = { id: "outfit", hat: null, clothing: null, accessory: null };
      break;
    case "house": {
      requireBound();
      if (["cream", "pink", "mint", "lavender"].includes(string("wallpaper")))
        s.house.wallpaper = string("wallpaper");
      if (["wood", "tile", "cloud"].includes(string("floor")))
        s.house.floor = string("floor");
      if (p.slot && p.icon) {
        const slot = string("slot") as keyof typeof s.house.slots;
        requireRule(
          ["bed", "bowl", "toy", "furniture"].includes(slot),
          "无效家具。",
        );
        const allowed: Record<string, string[]> = {
          bed: ["🛏️", "🧺"],
          bowl: ["🥣", "🍽️"],
          toy: ["🧸", "🎾"],
          furniture: ["🪴", "📚"],
        };
        requireRule(
          allowed[slot].includes(string("icon")),
          "请选择可用的免费家具。",
        );
        s.house.slots[slot] = string("icon");
      }
      if (p.position) {
        const slot = string("slot");
        requireRule(slot in s.house.slots, "无效家具位置。");
        const point = p.position as { x: number; y: number };
        requireRule(
          Number.isFinite(point.x) && Number.isFinite(point.y),
          "无效坐标。",
        );
        s.house.positions[slot] = {
          x: clamp(point.x, 5, 90),
          y: clamp(point.y, 35, 90),
        };
      }
      event(s, role, "house_save");
      break;
    }
    case "claim": {
      requireBound();
      const m = milestones.find((m) => m.id === p.id);
      requireRule(m && s.demoDay >= m.day, "还没到奖励日。");
      requireRule(
        !s.claimed.includes(m.id),
        "该里程碑已经领取，不可重复领取。",
      );
      if (m.day === 99)
        requireRule(
          s.outcomes.some(
            (o) =>
              o.round === s.voteRound && o.kind !== "discuss" && o.confirmed,
          ),
          "请先完成双方秘密投票并确认终局。",
        );
      s.claimed.push(m.id);
      give(s, m.item, m.item === "snack" ? 3 : 1);
      s.wallet.hearts += m.hearts;
      record(s, role, "milestone", `D${m.day} 阶段奖励`, m.xp, {}, m.id);
      event(s, role, "milestone_reward_claim", { milestone: m.id });
      break;
    }
    case "reward_apply": {
      requireBound();
      const m = milestones.find((m) => m.id === p.id);
      requireRule(m && s.claimed.includes(m.id), "先领取对应里程碑礼包。");
      requireRule(
        !s.applications.some(
          (a) => a.milestoneId === m.id && a.kind === "base",
        ),
        "已提交模拟申请，请勿重复申请。",
      );
      s.applications.push({
        ...base,
        milestoneId: m.id,
        amountCents: m.fundCents,
        status: "submitted_mock",
        kind: "base",
      });
      event(s, role, "reward_application_submit", { kind: "base" });
      break;
    }
    case "reward_review": {
      const app = s.applications.find((a) => a.id === p.id);
      requireRule(
        app && ["submitted_mock", "reviewing_mock"].includes(app.status),
        "没有可审核的模拟申请。",
      );
      requireRule(
        p.decision === "approve" || p.decision === "reject",
        "无效审核选项。",
      );
      app.status = p.decision === "approve" ? "approved_mock" : "rejected_mock";
      event(s, role, "reward_review_mock", { decision: string("decision") });
      break;
    }
    case "ugc": {
      requireBound();
      const url = string("url", 500);
      requireRule(/^https:\/\//.test(url), "请输入 https:// 开头的作品链接。");
      try {
        new URL(url);
      } catch {
        throw new Error("作品链接格式不正确。");
      }
      requireRule(
        !s.applications.some((a) => a.workUrl === url),
        "该作品已提交。",
      );
      s.applications.push({
        ...base,
        milestoneId: "ugc",
        amountCents: 0,
        status: "reviewing_mock",
        kind: "ugc",
        workUrl: url,
      });
      event(s, role, "reward_application_submit", { kind: "ugc" });
      break;
    }
    case "vote": {
      requireBound();
      requireRule(s.demoDay === 99, "D99 才能开启秘密选择。");
      requireRule(
        p.choice === "keep" || p.choice === "jagat",
        "请选择有效选项。",
      );
      requireRule(
        !s.votes.some((v) => v.round === s.voteRound && v.role === role),
        "本轮已提交，双方完成前不能修改。",
      );
      s.votes.push({ ...base, role, choice: p.choice, round: s.voteRound });
      event(s, role, "final_vote_submit");
      const vs = s.votes.filter((v) => v.round === s.voteRound);
      if (vs.length === 2) {
        const kind = vs.every((v) => v.choice === "keep")
          ? "home"
          : vs.every((v) => v.choice === "jagat")
            ? "planet"
            : "discuss";
        s.outcomes.push({
          id: uid(),
          createdAt: at,
          round: s.voteRound,
          kind,
          confirmed: false,
        });
        event(s, role, "final_vote_reveal", { kind });
      }
      break;
    }
    case "revote": {
      requireBound();
      const o = s.outcomes.find((o) => o.round === s.voteRound);
      requireRule(o?.kind === "discuss", "仅意见不同时可开启新一轮。");
      s.voteRound++;
      s.shareConsent = [];
      break;
    }
    case "outcome_confirm": {
      const o = s.outcomes.find((o) => o.round === s.voteRound);
      requireRule(o && o.kind !== "discuss", "请先完成一致的共同选择。");
      requireRule(!o.confirmed, "已确认该结局。");
      o.confirmed = true;
      give(s, "final-form");
      event(s, role, "final_outcome_confirm", { kind: o.kind });
      break;
    }
    case "consent":
      requireBound();
      requireRule(
        s.outcomes.some((o) => o.round === s.voteRound),
        "揭晓后才可同意分享结局。",
      );
      if (!s.shareConsent.includes(role)) s.shareConsent.push(role);
      break;
    case "share": {
      requireBound();
      const kind = string("kind");
      requireRule(
        [
          "出生证明",
          "出逃通缉令",
          "默契报告",
          "性格进化卡",
          "30天成长报告",
          "99天秘密结局",
        ].includes(kind),
        "无效分享卡。",
      );
      if (kind === "99天秘密结局") {
        requireRule(
          s.demoDay === 99 && s.outcomes.some((o) => o.round === s.voteRound),
          "先完成毕业选择。",
        );
        requireRule(
          s.shareConsent.includes("A") && s.shareConsent.includes("B"),
          "需双方分别同意公开结局。",
        );
      }
      if (kind === "30天成长报告")
        requireRule(s.demoDay >= 30, "D30 解锁成长报告。");
      if (kind === "性格进化卡")
        requireRule(s.demoDay >= 21, "D21 解锁进化卡。");
      if (kind === "默契报告")
        requireRule(
          s.challenge?.status === "completed",
          "先完成一次双人默契挑战。",
        );
      requireRule(
        ["3:4", "9:16", "wechat"].includes(string("format")),
        "无效海报比例。",
      );
      s.artifacts.push({
        ...base,
        kind,
        format: string("format") as "3:4",
        hideName: !!p.hideName,
        hideLocation: !!p.hideLocation,
        showCouple: !!p.showCouple,
      });
      event(s, role, "share_card_generate", { kind });
      break;
    }
    case "share_click":
      event(s, role, "share_click", {
        channel: string("channel", 20) || "download",
        confirmedExternal: false,
      });
      break;
    case "ad":
      requireBound();
      requireRule(
        !["vote", "letters", "ending"].includes(string("placement")),
        "此节点不显示广告。",
      );
      requireRule(
        !s.events.some((e) => e.day === s.demoDay && e.kind === "ad"),
        "今日模拟装饰奖励已领取。",
      );
      record(s, role, "ad", "模拟广告：日记背景", 0, {}, `ad:${s.demoDay}`);
      give(s, "diary-bg");
      event(s, role, "ad_mock_complete");
      break;
    case "diary_hide": {
      const d = s.diaries.find((d) => d.id === p.id);
      requireRule(d, "日记不存在。");
      d.hidden = !d.hidden;
      break;
    }
    case "story_seen": {
      const d = Number(p.day);
      requireRule(
        story.some((c) => c.day === d) && d <= s.demoDay,
        "剧情尚未解锁。",
      );
      if (!s.storySeen.includes(d)) s.storySeen.push(d);
      break;
    }
    case "track":
      requireRule(
        [
          "pet_valuation_view",
          "care_calendar_open",
          "milestone_unlock",
          "share_click",
          "shop_open",
          "share_open",
        ].includes(string("name")),
        "无效事件。",
      );
      event(s, role, string("name"));
      break;
    default:
      throw new Error("未知操作。");
  }
  s.revision++;
  s.processed.push(command.id);
  return s;
}
export function publicState(s: GameState, role: Role): PublicState {
  const current = s.votes.filter((v) => v.round === s.voteRound);
  const a = s.adventure;
  const c = s.challenge;
  return {
    ...structuredClone(s),
    votes: {
      A: current.some((v) => v.role === "A"),
      B: current.some((v) => v.role === "B"),
    },
    futureLetters: s.futureLetters
      .filter((l) => l.status !== "deleted")
      .map((l) => ({
        ...l,
        body: l.sender === role || s.demoDay >= l.unlockDay ? l.body : "",
        status: s.demoDay >= l.unlockDay ? "delivered" : "sealed",
      })),
    adventure: a
      ? {
          id: a.id,
          createdAt: a.createdAt,
          day: a.day,
          status: a.status,
          seen: [...a.seen],
          attempts: a.attempts,
          clue: a.seen.includes(role)
            ? locations.find((l) => l.id === a.target)![
                role === "A" ? "clueA" : "clueB"
              ]
            : null,
        }
      : null,
    challenge: c
      ? {
          id: c.id,
          createdAt: c.createdAt,
          day: c.day,
          kind: c.kind,
          status: c.status,
          mine: c.answers[role] ?? null,
          myGuess: c.guesses[role] ?? null,
          otherSubmitted: !!c.answers[role === "A" ? "B" : "A"],
          result:
            c.status === "completed"
              ? {
                  answers: { ...c.answers },
                  matches:
                    Number(c.guesses.A === c.answers.B) +
                    Number(c.guesses.B === c.answers.A),
                }
              : null,
        }
      : null,
  };
}
export function calendar(s: Pick<GameState, "events">): DailyCareRecord[] {
  return Array.from({ length: 99 }, (_, i) => {
    const day = i + 1;
    const events = s.events.filter((e) => e.day === day);
    const roles = [...new Set(events.map((e) => e.role))];
    const quality = zeroQuality();
    events.forEach((e) => {
      for (const k of Object.keys(quality) as (keyof Quality)[])
        quality[k] += e.quality[k];
    });
    return {
      id: `care-day-${day}`,
      day,
      events,
      roles,
      xp: events.reduce((n, e) => n + e.xp, 0),
      vitality: events.reduce((n, e) => n + e.vitality, 0),
      quality,
      valuationChange: events.reduce(
        (n, e) => n + e.valuationAfter - e.valuationBefore,
        0,
      ),
      status:
        roles.length === 2 ? "complete" : events.length ? "partial" : "empty",
    };
  });
}
export function streak(s: Pick<GameState, "events" | "demoDay">) {
  let days = 0;
  for (let d = s.demoDay; d > 0; d--) {
    if (!s.events.some((e) => e.day === d)) break;
    days++;
  }
  return days;
}
export function outcomeTitle(kind: FinalOutcome["kind"]) {
  return { home: "永远的家", planet: "回站毕业", discuss: "再商量一次" }[kind];
}
