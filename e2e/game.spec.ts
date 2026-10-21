import { test, expect, type Page, type Browser } from "@playwright/test";
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() =>
    localStorage.setItem("jagat-care-story-v4", "seen"),
  );
});
async function go(p: Page, id: string) {
  await p.goto("/#" + id);
  await expect(p.locator("main h1")).toBeVisible();
}
async function profile(p: Page, name: string) {
  await p.goto("/#profile");
  await p.getByLabel("我的昵称").fill(name);
  await p.getByLabel("我的城市").fill(name + "的城市");
  await p.getByLabel("我的个人简介").fill(name + "的个人介绍");
  await p.getByRole("button", { name: "保存我的资料" }).click();
  await expect(p.locator(".my-profile-chip")).toContainText(name);
}
async function pair(owner: Page, browser: Browser) {
  await profile(owner, "小桃");
  await go(owner, "home");
  await owner.getByRole("button", { name: "开始领养", exact: true }).click();
  await owner.getByLabel("给它一个名字").fill("团团");
  await owner.getByRole("button", { name: "创建双人领养房间" }).click();
  const link = await owner
    .getByLabel("可直接发送给对方的邀请链接")
    .inputValue();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  await context.addInitScript(() =>
    localStorage.setItem("jagat-care-story-v4", "seen"),
  );
  const partner = await context.newPage();
  await partner.goto(link);
  await partner.getByRole("button", { name: "先设置我的资料" }).click();
  await partner.getByLabel("我的昵称").fill("小森");
  await partner.getByLabel("我的城市").fill("成都");
  await partner.getByLabel("我的个人简介").fill("小森的私密个人简介");
  await partner.getByRole("button", { name: "保存我的资料" }).click();
  await expect(partner.locator(".my-profile-chip")).toContainText("小森");
  await go(partner, "couple"); // preserve invitation through profile navigation
  // go() intentionally navigates to the current site's root; reopen the original invitation.
  await partner.goto(link);
  await partner.getByRole("button", { name: "接受邀请，一起养宠" }).click();
  await expect(
    partner.getByRole("button", { name: "开始照顾我们的团子" }),
  ).toBeVisible();
  await expect(
    owner.getByRole("button", { name: "开始照顾我们的团子" }),
  ).toBeVisible({ timeout: 8000 });
  return { partner, context, link };
}
async function day(p: Page, d: number) {
  await go(p, "demo");
  await p.getByRole("button", { name: `D${d}`, exact: true }).click();
  await expect(p.getByText(`当前D${d}。`, { exact: false })).toBeVisible();
}
test("独立身份邀请、接受后自动成立、个人资料隔离与双方装扮同步", async ({
  page,
  browser,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const { partner, context } = await pair(page, browser);
  try {
    await expect(page.locator(".role-switch")).toHaveCount(0);
    await expect(partner.locator(".role-switch")).toHaveCount(0);
    await go(page, "profile");
    await expect(page.getByLabel("我的昵称")).toHaveValue("小桃");
    await expect(page.getByLabel("我的个人简介")).toHaveValue("小桃的个人介绍");
    await expect(page.locator("main")).not.toContainText("小森的私密个人简介");
    await go(partner, "profile");
    await expect(partner.getByLabel("我的昵称")).toHaveValue("小森");
    await go(page, "shop");
    await page
      .getByRole("button", { name: "心动蝴蝶结", exact: false })
      .click();
    await page
      .getByRole("button", { name: "确认模拟兑换", exact: false })
      .click();
    await go(partner, "shop");
    await partner
      .getByRole("button", { name: "我的背包", exact: false })
      .click();
    await partner.getByRole("button", { name: "使用", exact: true }).click();
    await page.getByRole("button", { name: "我的背包", exact: false }).click();
    await expect(page.locator(".center")).toContainText("蝴蝶结", {
      timeout: 8000,
    });
    await go(page, "house");
    await go(partner, "house");
    await partner.getByLabel("免费墙纸").selectOption("mint");
    await partner.getByRole("button", { name: "保存墙纸与地板" }).click();
    await expect(page.getByLabel("免费墙纸")).toHaveValue("mint", {
      timeout: 8000,
    });
    await page.reload();
    await expect(page.getByLabel("免费墙纸")).toHaveValue("mint");
    for (const width of [375, 430, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await go(page, "profile");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});
test("不能接受自己的邀请，链接有真实可操作入口", async ({ page }) => {
  await profile(page, "房主");
  await go(page, "home");
  await page.getByRole("button", { name: "开始领养", exact: true }).click();
  await page.getByRole("button", { name: "创建双人领养房间" }).click();
  const link = await page.getByLabel("可直接发送给对方的邀请链接").inputValue();
  await page.goto(link);
  await expect(
    page.getByText("不能接受自己的邀请。", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "接受邀请，一起养宠" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "复制邀请链接", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(/复制|链接/);
});
test("两设备分别查看线索并完成寻宠，互送心意与秘密任务", async ({
  page,
  browser,
}) => {
  const { partner, context } = await pair(page, browser);
  try {
    await go(page, "interact");
    await page.getByLabel("想送给 TA 的话").fill("今天一起慢慢长大");
    await page.getByRole("button", { name: "让团子送给对方" }).click();
    await go(partner, "interact");
    await partner.getByRole("button", { name: "回复一个抱抱" }).click();
    await expect(page.locator(".letter-card")).toContainText("回复：", {
      timeout: 8000,
    });
    await go(page, "map");
    await page.getByRole("button", { name: "开启地图寻宠" }).click();
    await page.getByRole("button", { name: "打开我的线索" }).click();
    await go(partner, "map");
    await partner.getByRole("button", { name: "打开我的线索" }).click();
    const clue = await partner.locator(".clue p").innerText();
    const name = clue.includes("东北")
      ? "心动公园"
      : clue.includes("西北")
        ? "迷路街区"
        : "约会咖啡馆";
    await page.getByRole("button", { name, exact: false }).click();
    await expect(
      page.getByRole("heading", { name: "找到一只小淘气！" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "接团子回家" }).click();
    await expect(partner.locator(".diary-row")).toContainText("铲屎官", {
      timeout: 8000,
    });
    await go(page, "interact");
    await go(partner, "interact");
    for (const p of [page, partner])
      await p.getByRole("button", { name: "🧩 默契小游戏" }).click();
    await page.getByRole("button", { name: "开启晚餐挑战" }).click();
    for (const p of [page, partner]) {
      await p.getByLabel("我的选择").selectOption("火锅");
      await p.getByLabel("我猜 TA 会选").selectOption("火锅");
      await p.getByRole("button", { name: "提交我的答案" }).click();
    }
    await expect(page.getByRole("heading", { name: "2/2 次猜中" })).toBeVisible(
      { timeout: 8000 },
    );
  } finally {
    await context.close();
  }
});
for (const [a, b, title] of [
  ["留下宠物", "留下宠物", "永远的家"],
  ["回到照护站", "回到照护站", "回站毕业"],
  ["留下宠物", "回到照护站", "再商量一次"],
])
  test(`两人独立秘密选择：${title}`, async ({ page, browser }) => {
    const { partner, context } = await pair(page, browser);
    try {
      await day(page, 99);
      await go(page, "ending");
      await page.getByRole("button", { name: a, exact: false }).click();
      await page.getByRole("button", { name: "确认并密封我的选择" }).click();
      await go(partner, "ending");
      await expect(
        partner.getByRole("heading", { name: title, exact: true }),
      ).toHaveCount(0);
      await partner.getByRole("button", { name: b, exact: false }).click();
      await partner.getByRole("button", { name: "确认并密封我的选择" }).click();
      await expect(
        page.getByRole("heading", { name: title, exact: true }),
      ).toBeVisible({ timeout: 8000 });
      await expect(
        partner.getByRole("heading", { name: title, exact: true }),
      ).toBeVisible();
    } finally {
      await context.close();
    }
  });
test("PNG下载与导出失败反馈", async ({ page, browser }) => {
  const { context } = await pair(page, browser);
  try {
    await go(page, "share");
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "确认生成并保存图片" }).click();
    expect((await download).suggestedFilename()).toContain("出生证明");
    await page.evaluate(() => {
      HTMLCanvasElement.prototype.toBlob = function (callback) {
        callback(null);
      };
    });
    await page.getByRole("button", { name: "确认生成并保存图片" }).click();
    await expect(page.getByRole("status")).toContainText("图片导出失败");
  } finally {
    await context.close();
  }
});

test("V4首次动画、跳过记忆、首页回看及四主导航", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.removeItem("jagat-care-story-v4"));
  // Override the fixture's init script for this explicit first-visit scenario.
  await page.addInitScript(() =>
    localStorage.removeItem("jagat-care-story-v4"),
  );
  await page.reload();
  await expect(
    page.getByRole("dialog", { name: "Jagat动物照护站" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "跳过故事" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(() => localStorage.getItem("jagat-care-story-v4")),
  ).toBe("seen");
  await expect(page.locator(".mobile-nav button")).toHaveText([
    "首页",
    "任务",
    "商店",
    "我的",
  ]);
  await page.getByRole("button", { name: "▷ 照护站故事" }).click();
  await expect(
    page.getByRole("heading", { name: "用99天，成为它信任的人。" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "▷ 观看开场动画" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "故事第5幕" }).click();
  await page.getByRole("button", { name: "认识我的小伙伴" }).click();
  await expect(
    page.getByRole("heading", { name: "用99天，成为它信任的人。" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "模拟9.9元体验" }),
  ).toBeDisabled();
});
test("V4任务领奖防重、权益双方同步、身份卡与照护报告", async ({
  page,
  browser,
}) => {
  const { partner, context } = await pair(page, browser);
  try {
    await go(page, "tasks");
    await page.getByRole("button", { name: "开始照顾并领取" }).first().click();
    await expect(
      page.getByRole("button", { name: "✓ 已完成并领奖" }),
    ).toHaveCount(1);
    await page.reload();
    await expect(
      page.getByRole("button", { name: "✓ 已完成并领奖" }),
    ).toHaveCount(1);
    await go(page, "shelter");
    await page.getByRole("button", { name: "模拟9.9元体验" }).click();
    await expect(
      page.getByText("✓ 已模拟激活：", { exact: false }),
    ).toBeVisible();
    await go(partner, "shelter");
    await expect(
      partner.getByText("✓ 已模拟激活：", { exact: false }),
    ).toBeVisible();
    await go(page, "identity");
    await expect(
      page.getByRole("heading", { name: "团团的小小身份卡" }),
    ).toBeVisible();
    await go(page, "valuation");
    await expect(
      page.getByRole("heading", { name: "照护成长报告", exact: true }),
    ).toBeVisible();
    await expect(page.locator("main")).not.toContainText("模拟估值");
    for (const width of [375, 430]) {
      await page.setViewportSize({ width, height: 844 });
      for (const id of [
        "home",
        "tasks",
        "identity",
        "valuation",
        "shelter",
        "charity",
      ]) {
        await go(page, id);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
        ).toBe(false);
      }
    }
  } finally {
    await context.close();
  }
});
