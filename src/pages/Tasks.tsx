import { useState } from "react";
import { useGame } from "../store";
import { Heading, Card, Meter } from "../components/UI";
import {
  dailyTasks,
  careScore,
  animalLessons,
  stageName,
} from "../domain/care-plan";
export function Tasks({ go }: { go: (p: string) => void }) {
  const { state: s, run, busy } = useGame();
  const [tab, setTab] = useState("daily");
  const tasks = dailyTasks(s);
  const completed = (kind: string) =>
    s.events.some((e) => e.day === s.demoDay && e.kind === kind);
  async function finish(task: (typeof tasks)[number]) {
    if (!completed(task.kind)) {
      const result = await run(task.action, task.payload);
      if (!result) return;
    }
    await run(
      "daily_claim",
      { task: task.id },
      "今日任务奖励已领取 · +5 XP / +10爱心币",
    );
  }
  return (
    <>
      <Heading
        eyebrow="A LITTLE DIFFERENT EVERY DAY"
        title="今天，陪它发现一点新鲜。"
        description={`D${s.demoDay} · ${stageName(s.demoDay)} · 每个养宠日更新，刷新不会重抽。任一方完成基础照顾即可。`}
      />
      <div className="tabs">
        {[
          ["daily", "日常照顾"],
          ["together", "双人互动"],
          ["adventure", "地图冒险"],
          ["journey", "成长旅程"],
        ].map(([id, t]) => (
          <button
            key={id}
            className={tab === id ? "selected" : ""}
            onClick={() => setTab(id)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "daily" ? (
        <>
          <Card className="care-summary">
            <div>
              <span className="eyebrow">TODAY’S CARE</span>
              <h2>照顾不需要全勤。</h2>
              <p>
                基础照料：
                {completed("feed") ? "✓ 今天吃饱啦" : "今天还没有喂食记录"}
              </p>
            </div>
            <button
              className="primary"
              disabled={busy || completed("feed")}
              onClick={() =>
                void run("feed", { food: "basic" }, "免费基础喂养完成")
              }
            >
              {completed("feed") ? "今日已喂养" : "免费喂养"}
            </button>
          </Card>
          <div className="two-col spaced">
            {tasks.map((task) => {
              const claimed = s.events.some(
                (e) => e.key === `daily:${s.demoDay}:${task.id}`,
              );
              return (
                <Card key={task.id}>
                  <span className="task-icon">{task.icon}</span>
                  <span className="pill">今日随机 · 约1分钟</span>
                  <h2>{task.title}</h2>
                  <p>{task.description}</p>
                  <p className="subtle">
                    额外奖励 +5 XP / +10爱心币 · 每房每天仅领一次
                  </p>
                  <button
                    className="primary"
                    disabled={busy || claimed}
                    onClick={() => void finish(task)}
                  >
                    {claimed
                      ? "✓ 已完成并领奖"
                      : completed(task.kind)
                        ? "领取今日任务奖励"
                        : "开始照顾并领取"}
                  </button>
                </Card>
              );
            })}
          </div>
          <Card className="spaced">
            <h2>也学会照顾屏幕外的它们</h2>
            <p>{animalLessons[(s.demoDay - 1) % animalLessons.length]}</p>
            <p className="subtle">
              知识提示不是现实救助证明，无需捐款或公开发帖。
            </p>
            <Meter label="近期照护成长分" value={careScore(s)} />
            <p className="description">
              完成基础喂养 +2；每项随机任务奖励
              +1（最多2）。完整缺席首日宽限，连续第二个缺席日起每天−2，最低20；今日未结束不扣分。免费照顾可恢复，累计XP与已解锁阶段保留。
            </p>
          </Card>
        </>
      ) : (
        <div className="two-col spaced">
          {(tab === "together"
            ? [
                [
                  "interact",
                  "心动互动中心",
                  "信使、需要、默契、约会、未来情书与修复。",
                ],
                [
                  "couple",
                  "我的双人房间",
                  "另一位在自己的设备回应，没有角色切换。",
                ],
              ]
            : tab === "adventure"
              ? [
                  ["map", "地图寻宠与探索", "你有一半线索，伙伴有另一半。"],
                  [
                    "interact",
                    "约会盲盒",
                    "按偏好生成轻任务，完成后留下报告。",
                  ],
                ]
              : [
                  ["story", "99天成长旅程", "阶段故事、性格进化、共同经历。"],
                  ["rewards", "阶段纪念奖励", "D10 / 30 / 60 / 90 / 99。"],
                  [
                    "valuation",
                    "照护成长报告",
                    "近期照护、五维品质、阶段变化。",
                  ],
                  ["ending", "毕业秘密选择", "D99分别选择继续养或回到照护站。"],
                ]
          ).map(([id, t, d]) => (
            <Card key={t}>
              <h2>{t}</h2>
              <p>{d}</p>
              <button className="secondary" onClick={() => go(id)}>
                进入 →
              </button>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
