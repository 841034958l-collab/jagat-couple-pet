import type { GameState, Role, Command } from "../domain/models";
import { initialState, publicState, reduceCommand } from "../domain/engine";
import type { GameAPI } from "./adapters";
export const STORAGE_KEY = "jagat-99-v3";
export function validateState(value: unknown): value is GameState {
  if (!value || typeof value !== "object") return false;
  const s = value as GameState;
  const has = (v: unknown, keys: string[]) =>
    !!v && typeof v === "object" && keys.every((k) => k in (v as object));
  const scores = (v: unknown, keys: string[]) =>
    has(v, keys) &&
    keys.every(
      (k) =>
        Number.isFinite((v as Record<string, number>)[k]) &&
        (v as Record<string, number>)[k] >= 0,
    );
  try {
    const baseline = initialState();
    if (!Object.keys(baseline).every((k) => k in s)) return false;
    for (const [key, template] of Object.entries(baseline)) {
      if (Array.isArray(template) && !Array.isArray(s[key as keyof GameState]))
        return false;
    }
    return (
      s.schema === 3 &&
      Number.isInteger(s.revision) &&
      s.revision >= 0 &&
      Number.isInteger(s.demoDay) &&
      s.demoDay >= 1 &&
      s.demoDay <= 99 &&
      Number.isInteger(s.voteRound) &&
      s.voteRound > 0 &&
      scores(s.wallet, ["hearts", "stars"]) &&
      has(s.outfit, ["hat", "clothing", "accessory"]) &&
      has(s.house, ["theme", "wallpaper", "floor", "slots", "positions"]) &&
      ["bed", "bowl", "toy", "furniture"].every(
        (k) =>
          typeof s.house.slots[k as keyof typeof s.house.slots] === "string" &&
          scores(s.house.positions[k], ["x", "y"]),
      ) &&
      s.users.length === 2 &&
      s.users.every((u) => u.id && ["A", "B"].includes(u.role)) &&
      s.events.every(
        (e) =>
          e.id &&
          e.createdAt &&
          e.key &&
          typeof e.label === "string" &&
          Number.isFinite(e.xp) &&
          scores(e.quality, ["N", "E", "X", "R", "L"]),
      ) &&
      s.valuations.every((v) => v.id && Number.isFinite(v.cents)) &&
      s.inventory.every(
        (i) =>
          i.id &&
          typeof i.itemId === "string" &&
          Number.isInteger(i.quantity) &&
          i.quantity >= 0,
      ) &&
      s.letters.every((l) => l.id && typeof l.body === "string") &&
      s.futureLetters.every(
        (l) =>
          l.id && typeof l.body === "string" && ["A", "B"].includes(l.sender),
      ) &&
      s.diaries.every((d) => d.id && typeof d.text === "string") &&
      s.analytics.every((e) => e.id && typeof e.name === "string") &&
      s.processed.every((id) => typeof id === "string") &&
      (!s.couple ||
        has(s.couple, ["status", "expiresAt", "inviteToken", "boundAt"])) &&
      (s.couple?.status !== "bound" || !!s.pet) &&
      (!s.pet ||
        (typeof s.pet.name === "string" &&
          Number.isFinite(s.pet.xp) &&
          scores(s.pet.quality, ["N", "E", "X", "R", "L"]) &&
          scores(s.pet.personality, [
            "expression",
            "exploration",
            "companionship",
            "creativity",
            "independence",
          ]) &&
          [
            "happy",
            "quiet",
            "shy",
            "missing",
            "sleeping",
            "traveling",
          ].includes(s.pet.mood))) &&
      (!s.adventure ||
        (has(s.adventure, ["id", "seen", "target", "attempts", "status"]) &&
          Array.isArray(s.adventure.seen))) &&
      (!s.challenge ||
        has(s.challenge, ["id", "answers", "guesses", "kind", "status"])) &&
      (!s.dateMission ||
        (has(s.dateMission, [
          "id",
          "title",
          "description",
          "completed",
          "status",
        ]) &&
          Array.isArray(s.dateMission.completed)))
    );
  } catch {
    return false;
  }
}
/** Local demo only. Browser storage is not an authorization or payment boundary. */
export class MockGameAPI implements GameAPI {
  private state: GameState;
  private queue: Promise<unknown> = Promise.resolve();
  constructor(
    private storage: Pick<
      Storage,
      "getItem" | "setItem" | "removeItem"
    > = localStorage,
  ) {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) {
      let value: unknown;
      try {
        value = JSON.parse(raw);
      } catch {
        throw new Error("本地存档无法解析。请导出备份后重置 Demo。");
      }
      if (!validateState(value))
        throw new Error("存档版本不兼容或损坏，请重置 Demo。");
      this.state = value;
    } else this.state = initialState();
  }
  async get(role: Role) {
    return publicState(this.state, role);
  }
  async execute(role: Role, command: Command) {
    const job = this.queue.then(() => {
      const stored = this.storage.getItem(STORAGE_KEY);
      if (stored) {
        const latest = JSON.parse(stored);
        if (!validateState(latest)) throw new Error("存档异常，请重置 Demo。");
        if (latest.revision > this.state.revision) this.state = latest;
      }
      const next = reduceCommand(this.state, role, command);
      try {
        this.storage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        throw new Error(
          "保存失败：浏览器存储不可用或空间已满。本次操作未生效。",
        );
      }
      this.state = next;
      return publicState(this.state, role);
    });
    this.queue = job.catch(() => {});
    return job;
  }
  async reset() {
    this.storage.removeItem(STORAGE_KEY);
    this.state = initialState();
  }
}
