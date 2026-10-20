import { test, expect, type Page } from "@playwright/test";
async function go(page: Page, name: string) {
  await page.goto(`/#${name}`);
  await expect(page.locator("main h1")).toBeVisible();
}
async function role(page: Page, r: "A" | "B") {
  await page
    .locator(".role-switch button")
    .nth(r === "A" ? 0 : 1)
    .click();
  await expect(page.locator(".role-switch .active")).toContainText(r);
}
async function adopt(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "开始领养", exact: true }).click();
  await page.getByLabel("给它一个名字").fill("年糕");
  await page.getByRole("button", { name: "创建双人领养房间" }).click();
  await expect(
    page.getByRole("heading", { name: "年糕的双人小家" }),
  ).toBeVisible();
  await role(page, "B");
  await page.getByRole("button", { name: "我是 B，接受邀请" }).click();
  await role(page, "A");
  await page.getByRole("button", { name: "我是 A，确认共同领养" }).click();
  await expect(
    page.getByRole("button", { name: "回家照顾团子" }),
  ).toBeVisible();
}
async function day(page: Page, d: number) {
  await go(page, "demo");
  await page.getByRole("button", { name: `D${d}`, exact: true }).click();
  await expect(
    page.getByText(`当前 D${d} · 玩家`, { exact: false }),
  ).toBeVisible();
}
test("完整移动端：领养、照顾、线索、信件、商城、小屋、日历、海报和模拟奖励", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await adopt(page);
  await go(page, "home");
  await page.getByRole("button", { name: "免费喂养", exact: false }).click();
  await expect(page.locator(".pet-info")).toContainText("年糕");
  await page.getByRole("button", { name: "摸摸团子", exact: false }).click();
  await go(page, "valuation");
  await expect(
    page.getByRole("heading", { name: "宠物估值实验室" }),
  ).toBeVisible();
  await expect(page.locator(".big-value")).not.toHaveText("¥0.00");
  await go(page, "interact");
  await page.getByLabel("想送给 TA 的话").fill("今天也一起慢慢长大");
  await page.getByRole("button", { name: "让团子送给 B" }).click();
  await role(page, "B");
  await page.getByRole("button", { name: "回复一个抱抱" }).click();
  await expect(page.locator(".letter-card")).toContainText("回复：");
  await page.getByRole("button", { name: "🌙 未来情书" }).click();
  await page.getByLabel("未来信件").fill("D30才能读到的秘密");
  await page.getByRole("button", { name: "密封这封信" }).click();
  await role(page, "A");
  await expect(page.locator(".sealed-letter")).toContainText("还未到解锁日");
  await expect(page.locator(".letter-card")).not.toContainText(
    "D30才能读到的秘密",
  );
  await go(page, "map");
  await page.getByRole("button", { name: "开启地图寻宠" }).click();
  await page.getByRole("button", { name: "打开我的线索" }).click();
  await page
    .locator(".role-tabs")
    .getByRole("button", { name: "玩家 B", exact: false })
    .click();
  await page.getByRole("button", { name: "打开我的线索" }).click();
  const target = await page.evaluate(
    () => JSON.parse(localStorage.getItem("jagat-99-v3")!).adventure.target,
  );
  const names: Record<string, string> = {
    park: "心动公园",
    street: "迷路街区",
    cafe: "约会咖啡馆",
  };
  await page.getByRole("button", { name: names[target], exact: false }).click();
  await expect(
    page.getByRole("heading", { name: "找到一只小淘气！" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "接团子回家" }).click();
  await expect(page.locator(".diary-row")).toContainText("铲屎官");
  await go(page, "shop");
  await page.getByRole("button", { name: "心动蝴蝶结", exact: false }).click();
  await page
    .getByRole("button", { name: "确认模拟兑换", exact: false })
    .click();
  await page.getByRole("button", { name: "我的背包", exact: false }).click();
  await page.getByRole("button", { name: "使用", exact: true }).click();
  await expect(page.locator(".center")).toContainText("蝴蝶结");
  await go(page, "house");
  await page.getByLabel("免费墙纸").selectOption("mint");
  await page.getByRole("button", { name: "保存墙纸与地板" }).click();
  await page.reload();
  await expect(page.getByLabel("免费墙纸")).toHaveValue("mint");
  await go(page, "calendar");
  await expect(page.locator(".timeline")).toContainText("双人寻宠");
  await go(page, "share");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "确认生成并保存图片" }).click();
  expect((await download).suggestedFilename()).toContain("出生证明");
  await expect(page.locator(".generated-poster")).toBeVisible();
  await day(page, 10);
  await go(page, "rewards");
  const reward = page.locator(".milestone-grid .card").first();
  await reward
    .getByRole("button", { name: "领取成长礼包", exact: true })
    .click();
  await expect(
    reward.getByRole("button", { name: "成长礼包已领取", exact: false }),
  ).toBeDisabled();
  await reward.getByRole("button", { name: "提交模拟基金申请" }).click();
  await expect(reward).toContainText("未到账");
  await page.reload();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("jagat-99-v3")!).claimed,
    ),
  ).toContain("m10");
  for (const width of [375, 390, 430, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await go(page, "home");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});
for (const [a, b, title] of [
  ["留下宠物", "留下宠物", "永远的家"],
  ["交给 Jagat", "交给 Jagat", "星球毕业"],
  ["留下宠物", "交给 Jagat", "再商量一次"],
])
  test(`D99秘密选择：${title}`, async ({ page }) => {
    await adopt(page);
    await day(page, 99);
    await go(page, "ending");
    await page.getByRole("button", { name: a, exact: false }).click();
    await page.getByRole("button", { name: "确认并密封我的选择" }).click();
    await expect(page.locator(".sealed-letter")).toContainText(
      "你的答案已封存",
    );
    await role(page, "B");
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: b, exact: false }).click();
    await page.getByRole("button", { name: "确认并密封我的选择" }).click();
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    if (title === "再商量一次") {
      await page
        .getByRole("button", { name: "商量后，开启新一轮选择" })
        .click();
      await expect(page.locator(".secret-vote")).toContainText("ROUND 2");
    } else {
      await page
        .getByRole("button", { name: "确认结局", exact: false })
        .click();
      await expect(
        page.getByRole("button", { name: "共同结局已确认", exact: false }),
      ).toBeDisabled();
    }
  });
test("图片导出错误可见，失败不记为生成成功；Demo重置", async ({ page }) => {
  await adopt(page);
  await go(page, "share");
  await page.evaluate(() => {
    HTMLCanvasElement.prototype.toBlob = function (callback) {
      callback(null);
    };
  });
  await page.getByRole("button", { name: "确认生成并保存图片" }).click();
  await expect(page.getByRole("status")).toContainText("图片导出失败");
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("jagat-99-v3")!).artifacts.length,
    ),
  ).toBe(0);
  await go(page, "demo");
  await page.getByRole("button", { name: "重置全部 V3 Demo 数据" }).click();
  await page.getByRole("button", { name: "确认清除并重新开始" }).click();
  await expect(
    page.getByRole("button", { name: "开始领养", exact: true }),
  ).toBeVisible();
});

test("地图手势、双人默契、需要表达、约会完成、模拟广告", async ({ page }) => {
  await adopt(page);
  await go(page, "map");
  const world = page.locator(".map-world");
  const original = await world.getAttribute("style");
  await page.getByRole("button", { name: "放大地图", exact: true }).click();
  expect(await world.getAttribute("style")).not.toBe(original);
  await page.getByRole("button", { name: "地图复位" }).click();
  const box = (await page.locator(".map-viewport").boundingBox())!;
  await page.mouse.move(box.x + 15, box.y + 200);
  await page.mouse.down();
  await page.mouse.move(box.x + 55, box.y + 225, { steps: 5 });
  await page.mouse.up();
  expect(await world.getAttribute("style")).not.toBe(original);
  await page.getByRole("button", { name: "地图复位" }).click();
  expect(await world.getAttribute("style")).toBe(original);
  await go(page, "interact");
  await page.getByRole("button", { name: "💗 今天需要什么" }).click();
  await page.getByRole("button", { name: "想一起玩", exact: false }).click();
  await role(page, "B");
  await page.getByRole("button", { name: "想安静休息", exact: false }).click();
  await expect(page.locator("blockquote").first()).toContainText(
    "留一点安静空间",
  );
  await page.getByRole("button", { name: "🧩 默契小游戏" }).click();
  await page.getByRole("button", { name: "开启晚餐挑战" }).click();
  await page.getByLabel("我的选择").selectOption("火锅");
  await page.getByLabel("我猜 TA 会选").selectOption("面条");
  await page.getByRole("button", { name: "提交玩家 B 的答案" }).click();
  await role(page, "A");
  await page.getByLabel("我的选择").selectOption("面条");
  await page.getByLabel("我猜 TA 会选").selectOption("火锅");
  await page.getByRole("button", { name: "提交玩家 A 的答案" }).click();
  await expect(page.getByRole("heading", { name: "2/2 次猜中" })).toBeVisible();
  await page.getByRole("button", { name: "☕ 约会提案" }).click();
  await page.getByRole("button", { name: "抽取约会盲盒" }).click();
  await page.getByRole("button", { name: "玩家 A 确认约会完成" }).click();
  await role(page, "B");
  await page.getByRole("button", { name: "玩家 B 确认约会完成" }).click();
  await expect(page.locator("blockquote")).toContainText("约会报告");
  await go(page, "demo");
  await page.getByRole("button", { name: "观看明确标识的模拟广告" }).click();
  await page.getByRole("button", { name: "开始模拟观看并领取背景" }).click();
  await expect(page.getByRole("status")).toContainText("模拟装饰已收进背包");
  await go(page, "map");
  await expect(page.locator(".star-diary")).toBeVisible();
});
