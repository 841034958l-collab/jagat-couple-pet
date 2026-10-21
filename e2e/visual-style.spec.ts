import { test, expect } from "@playwright/test";
test("V4.1深色视觉、宠物表情、独立故事页与完整玩法说明", async ({
  page,
  context,
}) => {
  await context.addInitScript(() =>
    localStorage.setItem("jagat-care-story-opening-v4.1", "seen"),
  );
  await page.goto("/#home");
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(8, 8, 9)",
  );
  await page.getByRole("button", { name: "酷一点", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "酷一点", exact: true }),
  ).toHaveClass("selected");
  await page.getByRole("button", { name: "▷ 照护站故事" }).click();
  await expect(page).toHaveURL(/#shelter$/);
  await expect(
    page.getByRole("heading", { name: "用99天，成为它信任的人。" }),
  ).toBeVisible();
  await expect(page.locator(".mechanic-card")).toHaveCount(6);
  await page.getByRole("button", { name: /D78—99/ }).click();
  await expect(
    page.getByRole("heading", { name: "给未来的一封信" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "怎么玩 ↘" }).click();
  await expect(page.locator("#mechanics")).toBeInViewport();
  await page.getByRole("button", { name: "▷ 观看开场动画" }).click();
  await expect(
    page.getByRole("dialog", { name: "Jagat动物照护站" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "故事第4幕" }).click();
  await expect(
    page.getByRole("heading", { name: "长大的，不只是小动物。" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "关闭弹窗" }).click();
  for (const width of [375, 430, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
  }
});

test("旧版观看记录不挡新版开场，关闭后刷新不重复，可手动和链接重播", async ({
  page,
  context,
}) => {
  await context.addInitScript(() =>
    localStorage.setItem("jagat-care-story-v4", "seen"),
  );
  await page.goto("/");
  await expect(
    page.getByRole("dialog", { name: "Jagat动物照护站" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "跳过故事" }).click();
  await page.reload();
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "重播开场动画" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "关闭弹窗" }).click();
  await page.goto("/?intro=1#home");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "跳过故事" }).click();
  await expect(page).not.toHaveURL(/intro=1/);
  await page.reload();
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  for (const width of [375, 430]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
  }
});
