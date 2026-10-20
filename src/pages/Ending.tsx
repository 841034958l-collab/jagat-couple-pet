import { useState } from "react";
import { useGame } from "../store";
import { Heading, Card, Notice, money } from "../components/UI";
import { GrowthChart } from "../components/GrowthChart";
import { Pet } from "../components/Pet";
import {
  personality,
  level,
  qualityScore,
  valuation,
  outcomeTitle,
} from "../domain/engine";
export function Ending({ go }: { go: (p: string) => void }) {
  const { state: s, role, me, run, busy } = useGame();
  const [choice, setChoice] = useState<"keep" | "jagat" | null>(null);
  const p = s.pet;
  const outcome = s.outcomes.find((o) => o.round === s.voteRound);
  if (!p || s.demoDay < 99)
    return (
      <>
        <Heading
          eyebrow="THE LAST PAGE IS STILL AHEAD"
          title="星光，还在前方等我们。"
          description="D99 解锁毕业报告与秘密选择；Demo 面板可切换到第99天体验。"
        />
        <button className="primary" onClick={() => go("demo")}>
          打开 Demo 面板
        </button>
      </>
    );
  return (
    <>
      <Heading
        eyebrow="DAY 99 · THANK YOU FOR GROWING WITH US"
        title="最后一天，你会怎么选？"
        description="两份不被催促的答案，为我们的99天写下结尾。没有强制出售，也没有真实现金交易。"
      />
      <Card className="graduation-report">
        <div className="graduation-header">
          <span>✦</span>
          <b>JAGAT · GRADUATION DAY</b>
          <span>✦</span>
        </div>
        <div className="graduation-grid">
          <div className="center">
            <Pet size={230} />
            <h2>{p.name}的99天毕业报告</h2>
            <span className="pill">
              {personality(s).name} · Lv.{level(p.xp)}
            </span>
          </div>
          <div>
            <div className="graduation-metrics">
              <div>
                <span>养育品质</span>
                <b>{qualityScore(p.quality)}</b>
              </div>
              <div>
                <span>成长 XP</span>
                <b>{p.xp}</b>
              </div>
              <div>
                <span>地图冒险</span>
                <b>{s.events.filter((e) => e.kind === "rescue").length}</b>
              </div>
              <div>
                <span>共同回忆</span>
                <b>{s.diaries.filter((d) => !d.hidden).length}</b>
              </div>
            </div>
            <div className="graduation-value">
              <span>游戏内模拟估值</span>
              <b>{money(valuation(99, qualityScore(p.quality)))}</b>
            </div>
            <Notice />
          </div>
        </div>
        <GrowthChart />
        <blockquote>
          亲爱的两位主人：谢谢你们给我起名字，给我留了一盏灯。无论留在家里，还是去星球旅行，我都记得那些一起度过的日子。——{" "}
          {p.name}
        </blockquote>
        <div className="inline-actions">
          <button className="secondary" onClick={() => go("calendar")}>
            翻看养宠日历
          </button>
          <button className="secondary" onClick={() => go("valuation")}>
            查看五维与成长曲线
          </button>
        </div>
      </Card>
      {!outcome ? (
        <Card className="secret-vote spaced">
          <span className="kicker">
            TWO SECRET CHOICES · ROUND {s.voteRound}
          </span>
          <h2>{me.name}，这一刻听听自己的心。</h2>
          <p className="description">
            双方看到相同选项。提交后锁定，本轮双方完成前不会返回或展示对方的答案。
          </p>
          <div className="vote-status">
            <span>我 {s.votes[role] ? "🔒 已提交" : "○ 等待选择"}</span>
            <span>
              对方{" "}
              {s.votes[role === "A" ? "B" : "A"] ? "🔒 已提交" : "○ 等待选择"}
            </span>
          </div>
          {s.votes[role] ? (
            <div className="sealed-letter">
              你的答案已封存，等待对方在自己的设备上完成选择。
              <br />
              这里不会回显你的答案，也不会提前显示对方答案。
            </div>
          ) : (
            <>
              <div className="vote-options">
                <button
                  className={choice === "keep" ? "selected" : ""}
                  onClick={() => setChoice("keep")}
                >
                  <span>🏡</span>
                  <h3>留下宠物</h3>
                  <p>这里永远是它的家，我们继续一起生活。</p>
                </button>
                <button
                  className={choice === "jagat" ? "selected" : ""}
                  onClick={() => setChoice("jagat")}
                >
                  <span>🪐</span>
                  <h3>交给 Jagat</h3>
                  <p>送它去虚拟星球旅行，保留所有成长纪念。</p>
                </button>
              </div>
              <button
                className="primary"
                disabled={!choice || busy}
                onClick={async () => {
                  if (await run("vote", { choice }, "秘密选择已提交"))
                    setChoice(null);
                }}
              >
                确认并密封我的选择
              </button>
            </>
          )}
          <p className="notice">
            Demo
            选票保存在共享服务端，仅在双方提交后揭晓。请等待对方用自己的设备完成选择。
          </p>
        </Card>
      ) : (
        <Card className={`ending-card spaced ${outcome.kind}`}>
          <span className="ending-emoji">
            {outcome.kind === "home"
              ? "🏡"
              : outcome.kind === "planet"
                ? "🪐"
                : "💌"}
          </span>
          <span className="kicker">OUR FINAL CHAPTER</span>
          <h2>{outcomeTitle(outcome.kind)}</h2>
          <p>
            {outcome.kind === "home"
              ? "两份答案都选择留下。爱心小屋多了一位永久家人，地图冒险继续开放。"
              : outcome.kind === "planet"
                ? "两份答案都选择交给 Jagat。团子带着99天的回忆，踏上虚拟星球之旅。纪念册一直留在这里。"
                : "你们的答案暂时不同。团子先留在地图，等你们慢慢商量。不会强制出售，可以重新共同决定。"}
          </p>
          {outcome.kind === "discuss" ? (
            <button
              className="primary"
              disabled={busy}
              onClick={() =>
                void run("revote", {}, "新一轮已开启，请两位重新独立选择")
              }
            >
              商量后，开启新一轮选择
            </button>
          ) : (
            <>
              <button
                className="primary"
                disabled={busy || outcome.confirmed}
                onClick={() =>
                  void run(
                    "outcome_confirm",
                    {},
                    "终局已确认，纪念形态收进背包",
                  )
                }
              >
                {outcome.confirmed
                  ? "✓ 共同结局已确认"
                  : "确认结局 · 解锁纪念形态"}
              </button>
              <div className="inline-actions centered spaced">
                <button className="secondary" onClick={() => go("rewards")}>
                  毕业礼包与模拟基金
                </button>
                <button className="secondary" onClick={() => go("share")}>
                  双方同意后生成结局卡
                </button>
                <button className="secondary" onClick={() => go("map")}>
                  {outcome.kind === "home"
                    ? "继续养成与冒险"
                    : "返回成长纪念地图"}
                </button>
              </div>
            </>
          )}
        </Card>
      )}
    </>
  );
}
