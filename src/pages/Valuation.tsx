import { useEffect } from "react";
import { useGame } from "../store";
import { Heading, Card, Meter, Notice, money } from "../components/UI";
import { qualityScore, valuation, level, personality } from "../domain/engine";
import { dimensionNames, weights } from "../domain/config";
import type { Quality } from "../domain/models";
export function Valuation() {
  const { state: s, run } = useGame();
  useEffect(() => {
    void run("track", { name: "pet_valuation_view" });
  }, []);
  const p = s.pet!;
  const q = qualityScore(p.quality);
  const v = valuation(s.demoDay, q);
  const yesterday = [...s.valuations]
    .reverse()
    .find((v) => v.day === s.demoDay - 1);
  const daily = Array.from({ length: s.demoDay }, (_, i) => {
    const records = s.valuations.filter((v) => v.day === i + 1);
    return records.at(-1);
  }).filter((v) => !!v);
  const range = Math.max(1, daily.length - 1);
  const line = daily
    .map(
      (v, i) => `${30 + (i / range) * 640},${190 - (v!.cents / 19900) * 155}`,
    )
    .join(" ");
  return (
    <>
      <Heading
        eyebrow="EVERY LITTLE CARE COUNTS"
        title="宠物估值实验室"
        description="价值来自一起度过的日子，以及每一份认真照顾。这里的金额仅用于游戏模拟。"
      />
      <Notice />
      <div className="two-col">
        <Card className="valuation-card">
          <span className="kicker">SIMULATED PET VALUE</span>
          <h2 className="big-value">{money(v)}</h2>
          <div className="value-comparison">
            <span>昨日 {yesterday ? money(yesterday.cents) : "暂无记录"}</span>
            <b>
              {yesterday
                ? `${v >= yesterday.cents ? "+" : ""}${money(v - yesterday.cents)}`
                : "从今天开始记录"}
            </b>
          </div>
          <div className="value-formula">
            19.90 + 80 × {s.demoDay}/99 + 99 × {q}/100
          </div>
          <p className="description">
            自然日贡献 {money(Math.round((8000 * s.demoDay) / 99))} · 品质贡献{" "}
            {money(Math.round((9900 * q) / 100))}
            <br />
            上限 ¥199.00 · 商城消费和广告不会直接加分
          </p>
          <div className="pet-stats">
            <span>
              等级 <b>Lv.{level(p.xp)}</b>
            </span>
            <span>
              收藏{" "}
              <b>
                {q >= 80
                  ? "星光"
                  : q >= 50
                    ? "闪耀"
                    : q >= 20
                      ? "珍爱"
                      : "初遇"}
              </b>
            </span>
            <span>
              性格 <b>{personality(s).name}</b>
            </span>
          </div>
        </Card>
        <Card>
          <h2>Day99 预计模拟估值</h2>
          <h3 className="projection">{money(valuation(99, q))}</h3>
          <p className="description">
            假设：养育品质保持当前 {q}{" "}
            分，养宠自然日达到99天。此为明确假设下的数学推演，不保证未来达到，也不是现金收益。
          </p>
          <h3 className="spaced">最近变化原因</h3>
          <div className="history-list">
            {s.valuations
              .slice(-4)
              .reverse()
              .map((v) => (
                <div key={v.id}>
                  <span>
                    D{v.day} · {v.reason}
                  </span>
                  <b>{money(v.cents)}</b>
                </div>
              ))}
          </div>
        </Card>
      </div>
      <Card className="spaced">
        <h2>模拟估值成长曲线</h2>
        <p className="description">
          按有记录的游戏日绘制；切换 Demo 日期不伪造过去的照顾记录。
        </p>
        <svg
          viewBox="0 0 700 230"
          className="chart"
          role="img"
          aria-label="估值历史曲线"
        >
          <path
            d="M30 35H670M30 110H670M30 190H670"
            stroke="#eee5e9"
            strokeDasharray="5 5"
          />
          <text x="30" y="22" fontSize="10" fill="#aaa">
            ¥199
          </text>
          <text x="30" y="217" fontSize="11" fill="#aaa">
            D1
          </text>
          <text x="640" y="217" fontSize="11" fill="#aaa">
            D{s.demoDay}
          </text>
          <polyline
            points={line}
            fill="none"
            stroke="#cb8fa7"
            strokeWidth="3"
          />
          {daily.map((v, i) => (
            <circle
              key={v!.id}
              cx={30 + (i / range) * 640}
              cy={190 - (v!.cents / 19900) * 155}
              r="4"
              fill="#b38dc8"
            >
              <title>
                D{v!.day}: {money(v!.cents)}
              </title>
            </circle>
          ))}
        </svg>
      </Card>
      <div className="section-heading">
        <h2>
          五维养育品质 <small>Q = {q}</small>
        </h2>
        <span>每个维度每日最多 +10，累计上限100</span>
      </div>
      <div className="quality-grid">
        {(Object.keys(weights) as (keyof Quality)[]).map((k, i) => (
          <Card key={k}>
            <span className="quality-symbol">
              {["🥣", "💗", "🧭", "🤝", "🏡"][i]}
            </span>
            <Meter
              label={dimensionNames[k]}
              value={p.quality[k]}
              color={["#e3be72", "#e5a0b2", "#91c5b2", "#b6a0d7", "#a8bccf"][i]}
            />
            <p className="description">
              权重 {weights[k] * 100}% · 综合贡献{" "}
              {(p.quality[k] * weights[k]).toFixed(2)} 分<br />
              {
                [
                  "合理喂养，每次 +5；每天2次。价格不影响营养分。",
                  "摸摸、故事、休息、心意回复，每项 +5。",
                  "地图访问 +5，寻宠 +5，约会 +5。",
                  "喂养 +2，整理 +3，双人任务/寻宠/约会 +5。",
                  "免费整理小屋 +10。家具价格不影响评分。",
                ][i]
              }
            </p>
          </Card>
        ))}
      </div>
      <Card className="spaced">
        <h3>评分规则与追溯</h3>
        <p className="description">
          时间窗口为当前99天养宠周期，累计成长，不因未登录降低。每个维度双方合计每日
          +10；同一日同一任务按任务上限去重，奖励领取使用唯一里程碑 ID。Demo
          回到同一天不会清除上限。基础粮永久免费，免费整理即可获得生活环境满额加分，十个合理照顾日可以累计达到五维满分。
        </p>
        <div className="history-list">
          {s.events
            .filter((e) => Object.values(e.quality).some((v) => v > 0))
            .slice(-10)
            .reverse()
            .map((e) => (
              <div key={e.id}>
                <span>
                  D{e.day} · {e.role} · {e.label}
                </span>
                <b>
                  {Object.entries(e.quality)
                    .filter(([, n]) => n > 0)
                    .map(
                      ([k, n]) => `${dimensionNames[k as keyof Quality]} +${n}`,
                    )
                    .join(" / ")}
                </b>
              </div>
            ))}
        </div>
      </Card>
    </>
  );
}
