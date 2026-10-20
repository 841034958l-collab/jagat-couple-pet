import { useState, useEffect } from "react";
import { useGame } from "../store";
import { Heading, Card, money } from "../components/UI";
import { calendar, streak } from "../domain/engine";
import { milestones, story, dimensionNames } from "../domain/config";
import type { Quality } from "../domain/models";
export function Calendar() {
  const { state: s, run } = useGame();
  const [month, setMonth] = useState(Math.floor((s.demoDay - 1) / 30));
  const [selected, setSelected] = useState(s.demoDay);
  useEffect(() => {
    void run("track", { name: "care_calendar_open" });
  }, []);
  const days = calendar(s);
  const current = days[selected - 1];
  const start = month * 30;
  return (
    <>
      <Heading
        eyebrow="99 DAYS OF OUR LITTLE WORLD"
        title="每一天，都算数。"
        description="自然日与连续互动分别记录。中断打卡不清空99天进度，等级也不会下降。"
      />
      <div className="summary-grid">
        <Card>
          <span>养宠自然日</span>
          <h2>
            D{s.demoDay}
            <small> / 99</small>
          </h2>
        </Card>
        <Card>
          <span>连续互动</span>
          <h2>
            {streak(s)}
            <small> 天</small>
          </h2>
        </Card>
        <Card>
          <span>有记录的日子</span>
          <h2>
            {days.filter((d) => d.events.length).length}
            <small> 天</small>
          </h2>
        </Card>
      </div>
      <div className="two-col spaced">
        <Card>
          <div className="calendar-top">
            <button
              className="secondary"
              disabled={month === 0}
              onClick={() => setMonth((m) => m - 1)}
            >
              上月
            </button>
            <h3>
              第 {month + 1} 月 · D{start + 1}–D{Math.min(99, start + 30)}
            </h3>
            <button
              className="secondary"
              disabled={month === 3}
              onClick={() => setMonth((m) => m + 1)}
            >
              下月
            </button>
          </div>
          <div className="calendar-grid">
            {days.slice(start, start + 30).map((d) => (
              <button
                key={d.day}
                className={`calendar-day ${d.status} ${selected === d.day ? "selected" : ""} ${d.day > s.demoDay ? "future" : ""}`}
                onClick={() => setSelected(d.day)}
              >
                <b>{d.day}</b>
                <span>
                  {milestones.some((m) => m.day === d.day)
                    ? "🎁"
                    : story.some((c) => c.day === d.day)
                      ? "✦"
                      : d.status === "complete"
                        ? "♥"
                        : d.status === "partial"
                          ? "◐"
                          : "·"}
                </span>
                <small>{d.roles.join(" · ") || "未记录"}</small>
              </button>
            ))}
          </div>
          <div className="calendar-legend">
            <span>♥ 双方参与</span>
            <span>◐ 部分完成</span>
            <span>✦ 剧情日</span>
            <span>🎁 里程碑</span>
          </div>
        </Card>
        <Card>
          <span className="eyebrow">DAY {selected} · CARE RECORD</span>
          <h2 className="spaced">
            {story.find((c) => c.day === selected)?.title ||
              `团子的第${selected}天`}
          </h2>
          <p className="description">
            A {current.roles.includes("A") ? "已参与" : "未记录"} · B{" "}
            {current.roles.includes("B") ? "已参与" : "未记录"}
            <br />
            XP +{current.xp} · 活力 +{current.vitality} · 模拟估值变化{" "}
            {money(current.valuationChange)}
            <br />
            饱腹记录 {s.nutrition.filter((n) => n.day === selected).length}/2 次
          </p>
          {current.events.at(-1)?.mood && (
            <p className="subtle">
              当天最后记录情绪：
              {
                {
                  happy: "开心",
                  quiet: "想安静",
                  shy: "害羞",
                  missing: "想念",
                  sleeping: "休息中",
                  traveling: "独自旅行",
                }[current.events.at(-1)!.mood]
              }
            </p>
          )}
          {s.nutrition
            .filter((n) => n.day === selected)
            .map((n) => (
              <p className="subtle" key={n.id}>
                {n.role} ·{" "}
                {n.food === "basic"
                  ? "免费基础粮"
                  : n.food === "food"
                    ? "彩虹搭配粮"
                    : "星星小饼干"}{" "}
                · {n.preference}
              </p>
            ))}
          {current.events.length ? (
            <div className="timeline">
              {current.events.map((e) => (
                <div key={e.id}>
                  <span>●</span>
                  <div>
                    <b>
                      {e.role} · {e.label}
                    </b>
                    <p>
                      +{e.xp} XP · Lv.{e.levelBefore} → {e.levelAfter} · 活力 +
                      {e.vitality}
                    </p>
                    <small>
                      {Object.entries(e.quality)
                        .filter(([, v]) => v > 0)
                        .map(
                          ([k, v]) =>
                            `${dimensionNames[k as keyof Quality]} +${v}`,
                        )
                        .join(" / ") || "无品质变化"}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mini-empty">
              这一天尚未留下照顾记录。
              <br />
              Demo 跳日不会自动补齐历史。
            </div>
          )}
          {s.diaries
            .filter((d) => d.day === selected && !d.hidden)
            .map((d) => (
              <blockquote key={d.id}>{d.text}</blockquote>
            ))}
          {s.claimed
            .filter(
              (id) => milestones.find((m) => m.id === id)?.day === selected,
            )
            .map((id) => (
              <p className="notice" key={id}>
                🎁 已领取 D{selected} 里程碑
              </p>
            ))}
        </Card>
      </div>
    </>
  );
}
