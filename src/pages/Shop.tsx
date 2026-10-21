import { useState, useEffect } from "react";
import { useGame } from "../store";
import { catalog } from "../domain/config";
import { Heading, Card, Modal } from "../components/UI";
import type { ShopItem, ShopCategory } from "../domain/models";
import { Pet } from "../components/Pet3D";
export function Shop({ go }: { go: (p: string) => void }) {
  const { state: s, run, busy } = useGame();
  useEffect(() => {
    void run("track", { name: "shop_open" });
  }, []);
  const [category, setCategory] = useState("全部");
  const [item, setItem] = useState<ShopItem | null>(null);
  const [bag, setBag] = useState(false);
  const owned = (id: string) =>
    s.inventory.some((i) => i.itemId === id && i.quantity > 0);
  const items = catalog.filter(
    (i) => category === "全部" || i.category === category,
  );
  return (
    <>
      <Heading
        eyebrow="DRESS UP OUR LITTLE HAPPINESS"
        title="团子的心动小商店"
        description="基础粮永久免费，消费只改变装饰与趣味，不影响现金奖励或基础健康。"
      >
        <div className="wallet">
          <span>♡ {s.wallet.hearts}</span>
          <span>
            ✦ {s.wallet.stars} <small>模拟</small>
          </span>
        </div>
      </Heading>
      <div className="shop-toolbar">
        <div className="tabs">
          <button
            className={!bag ? "selected" : ""}
            onClick={() => setBag(false)}
          >
            逛逛商店
          </button>
          <button
            className={bag ? "selected" : ""}
            onClick={() => setBag(true)}
          >
            我的背包（{s.inventory.filter((i) => i.quantity > 0).length}）
          </button>
        </div>
        <button className="secondary" onClick={() => go("house")}>
          🏡 布置小屋
        </button>
      </div>
      {!bag ? (
        <>
          <div className="category-tabs">
            {[
              "全部",
              "服装",
              "帽子",
              "配饰",
              "玩具",
              "家具",
              "主题",
              "粮食",
              "零食",
            ].map((c) => (
              <button
                className={category === c ? "selected" : ""}
                onClick={() => setCategory(c)}
                key={c}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="shop-grid">
            {items.map((i) => (
              <button
                className={`shop-item ${owned(i.id) ? "owned" : ""}`}
                key={i.id}
                onClick={() => {
                  setItem(i);
                  void run("shop_view", { id: i.id });
                }}
              >
                <div
                  className={`item-art ${i.category === "主题" ? "sakura" : ""}`}
                >
                  {i.icon}
                </div>
                <span className="kicker">{i.category}</span>
                <h3>{i.name}</h3>
                <div>
                  <span>
                    {i.currency === "hearts" ? "♡" : "✦"} {i.price}
                  </span>
                  <small>
                    {owned(i.id) && !i.consumable
                      ? "已拥有"
                      : i.currency === "stars"
                        ? "模拟兑换"
                        : "爱心币兑换"}
                  </small>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="two-col">
          <Card className="center">
            <Pet />
            <h2>{s.pet?.name}的今日穿搭</h2>
            <p className="description">
              帽子：{s.outfit.hat ? "探险帽" : "未佩戴"} · 配饰：
              {s.outfit.accessory ? "蝴蝶结" : "未佩戴"}
              <br />
              服装：
              {s.outfit.clothing === "grad"
                ? "毕业皮肤"
                : s.outfit.clothing
                  ? "条纹套装"
                  : "原本就可爱"}
            </p>
            <button
              className="secondary"
              onClick={() => void run("unequip", {}, "已恢复团子的原本模样")}
            >
              卸下服饰
            </button>
          </Card>
          <Card>
            <h2>我的物品</h2>
            {s.inventory
              .filter((i) => i.quantity > 0)
              .map((inv) => {
                const i = catalog.find((c) => c.id === inv.itemId);
                const special: Record<string, string> = {
                  grad: "毕业皮肤",
                  certificate: "毕业纪念册",
                  "final-form": "终局纪念形态",
                  "diary-bg": "星光日记背景",
                };
                return (
                  <div className="inventory-row" key={inv.id}>
                    <span>{i?.icon || "🎓"}</span>
                    <div>
                      <b>{i?.name || special[inv.itemId] || inv.itemId}</b>
                      <small>数量 {inv.quantity}</small>
                    </div>
                    {i?.consumable ? (
                      <button
                        className="secondary"
                        disabled={busy}
                        onClick={() =>
                          void run(
                            "feed",
                            { food: inv.itemId },
                            "已喂给团子，与免费粮共享每天2次上限",
                          )
                        }
                      >
                        喂给团子
                      </button>
                    ) : i || inv.itemId === "grad" ? (
                      <button
                        className="secondary"
                        disabled={busy}
                        onClick={() =>
                          void run(
                            "equip",
                            { id: inv.itemId },
                            "已经用上啦，回家看看新模样",
                          )
                        }
                      >
                        使用
                      </button>
                    ) : (
                      <span className="pill">已收藏</span>
                    )}
                  </div>
                );
              })}
            {!s.inventory.some((i) => i.quantity > 0) && (
              <p className="mini-empty">
                背包空空的。免费基础粮在首页随时可用。
              </p>
            )}
          </Card>
        </div>
      )}
      <div className="notice">
        Demo
        初始赠送300爱心币、18枚模拟星星币。任务与里程碑可赚爱心币；没有真实充值入口，星星币无真实货币价值。
      </div>
      {item && (
        <Modal title={item.name} onClose={() => setItem(null)}>
          <div className="product-detail-art">{item.icon}</div>
          <span className="pill">{item.category}</span>
          <p className="description">{item.description}</p>
          <p className="description">
            价格：{item.currency === "hearts" ? "♡ 爱心币" : "✦ 模拟星星币"}{" "}
            {item.price}
            <br />
            余额：{s.wallet[item.currency]}
          </p>
          {owned(item.id) && !item.consumable ? (
            <button
              className="secondary full"
              onClick={async () => {
                if (await run("equip", { id: item.id }, "已使用商品"))
                  setItem(null);
              }}
            >
              已经拥有 · 立即使用
            </button>
          ) : (
            <button
              className="primary full"
              disabled={busy || s.wallet[item.currency] < item.price}
              onClick={async () => {
                if (
                  await run(
                    "purchase",
                    { id: item.id },
                    "模拟兑换成功，物品已放入背包",
                  )
                )
                  setItem(null);
              }}
            >
              {s.wallet[item.currency] < item.price
                ? "余额不足"
                : "确认模拟兑换 · 不产生真实扣费"}
            </button>
          )}
        </Modal>
      )}
    </>
  );
}
