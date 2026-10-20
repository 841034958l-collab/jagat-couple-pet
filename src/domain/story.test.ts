import { expect, it } from "vitest";
import { naturalDay, StoryEngine } from "./story";
it("正式自然日仅在绑定后计算，服务端时间推进，最大99", () => {
  expect(naturalDay(null, "2026-10-20T00:00:00Z")).toBeNull();
  expect(naturalDay("2026-10-20T00:00:00Z", "2026-10-20T23:59:59Z")).toBe(1);
  expect(naturalDay("2026-10-20T00:00:00Z", "2026-10-21T00:00:00Z")).toBe(2);
  expect(naturalDay("2025-01-01T00:00:00Z", "2026-10-20T00:00:00Z")).toBe(99);
  expect(() => naturalDay("invalid", "invalid")).toThrow();
});
it("剧情引擎不解锁未来章节", () => {
  expect(StoryEngine.unlocked(7).map((c) => c.day)).toEqual([1, 7]);
  expect(StoryEngine.current(99)?.day).toBe(99);
});
