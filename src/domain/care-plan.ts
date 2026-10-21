import type { GameState } from "./models";
export const careTasks = [
  {
    id: "sunny-pet",
    kind: "pet",
    title: "把早安藏进一个摸摸里",
    description: "轻轻摸摸团子，让它自己靠近。",
    icon: "☀",
    action: "care",
    payload: { kind: "pet" },
  },
  {
    id: "moon-story",
    kind: "story",
    title: "今晚的故事由你来选",
    description: "讲一段睡前故事，陪团子慢慢放松。",
    icon: "☾",
    action: "care",
    payload: { kind: "story" },
  },
  {
    id: "little-home",
    kind: "tidy",
    title: "给它留一个舒服的角落",
    description: "一起整理小屋，收好散落的小玩具。",
    icon: "⌂",
    action: "care",
    payload: { kind: "tidy" },
  },
  {
    id: "quiet-hour",
    kind: "rest",
    title: "今天也允许好好休息",
    description: "留一段安静时间，尊重它的休息需要。",
    icon: "✧",
    action: "care",
    payload: { kind: "rest" },
  },
  {
    id: "gentle-pet",
    kind: "pet",
    title: "观察它喜欢的抚摸方式",
    description: "用一个摸摸，记住它的小偏好。",
    icon: "♡",
    action: "care",
    payload: { kind: "pet" },
  },
  {
    id: "rain-story",
    kind: "story",
    title: "给雨天编一个小故事",
    description: "讲一个有温暖结局的故事。",
    icon: "☂",
    action: "care",
    payload: { kind: "story" },
  },
  {
    id: "toy-home",
    kind: "tidy",
    title: "为心爱的玩具找个家",
    description: "收好玩具，让团子明天还能找到它。",
    icon: "◇",
    action: "care",
    payload: { kind: "tidy" },
  },
  {
    id: "slow-rest",
    kind: "rest",
    title: "和团子一起慢下来",
    description: "不打扰，也是今天的一份照顾。",
    icon: "☁",
    action: "care",
    payload: { kind: "rest" },
  },
] as const;
type CareState = Pick<GameState, "demoDay" | "pet" | "events" | "couple">;
export function dailyTasks(s: CareState) {
  const seed = [...(s.pet?.id ?? "jagat")].reduce(
    (n, c) => (n * 31 + c.charCodeAt(0)) >>> 0,
    0,
  );
  const index = (seed + s.demoDay) % careTasks.length;
  return [careTasks[index], careTasks[(index + 1) % careTasks.length]];
}
export function careScore(s: CareState, day = s.demoDay) {
  let score = 70,
    missed = 0;
  for (let d = 1; d <= Math.min(99, day); d++) {
    const events = s.events.filter((e) => e.day === d);
    if (events.some((e) => e.kind === "feed")) {
      score += 2;
      missed = 0;
    } else if (d < day) {
      missed++;
      if (missed >= 2) score -= 2;
    }
    score += Math.min(2, events.filter((e) => e.kind === "daily_claim").length);
    score = Math.max(20, Math.min(100, score));
  }
  return score;
}
export function stageName(day: number) {
  return day <= 7
    ? "初遇期"
    : day <= 21
      ? "熟悉期"
      : day <= 49
        ? "成长期"
        : day <= 77
          ? "自在期"
          : "信任期";
}
export const animalLessons = [
  "让小动物自己靠近，尊重它不想被触摸的时候。",
  "决定领养前，想好时间、空间、预算和长期照料。",
  "不随意投喂不适合的食物；真实养宠请咨询兽医。",
  "不打扰睡眠，给小动物一个安静、安全的角落。",
  "领养不是一时兴起。现实里的陪伴需要持续负责。",
];
