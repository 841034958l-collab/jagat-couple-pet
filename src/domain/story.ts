import { story } from "./config";
/** Production must supply serverNow; never trust the browser clock for eligibility. */
export function naturalDay(
  boundAt: string | null,
  serverNow: string,
): number | null {
  if (!boundAt) return null;
  const start = Date.parse(boundAt),
    now = Date.parse(serverNow);
  if (!Number.isFinite(start) || !Number.isFinite(now) || now < start)
    throw new Error("无效服务端时间");
  return Math.min(99, Math.floor((now - start) / 86400000) + 1);
}
export const StoryEngine = {
  unlocked: (day: number) => story.filter((c) => c.day <= day),
  current: (day: number) => [...story].reverse().find((c) => c.day <= day),
  evolutionDays: [21, 49, 77] as const,
};
