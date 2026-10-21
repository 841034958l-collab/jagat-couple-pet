import { useState } from "react";
import { useGame } from "../store";
import { Heading, Card, Modal } from "../components/UI";
import { story, personalities } from "../domain/config";
import { personality, phase } from "../domain/engine";
import { Pet } from "../components/Pet3D";
export function Story({ go }: { go: (p: string) => void }) {
  const { state: s, run, busy } = useGame();
  const [chapter, setChapter] = useState<number | null>(null);
  const active = story.find((c) => c.day === chapter);
  const current = personality(s);
  return (
    <>
      <Heading
        eyebrow="99 DAYS, A STORY ONLY WE CAN WRITE"
        title="我们一起，养了它99天。"
        description="最后一天，你会留下它，还是把它交给 Jagat？每个阶段，都是一页属于我们的故事。"
      />
      <div className="story-intro">
        <Pet size={175} />
        <div>
          <span className="kicker">OUR LITTLE ONE IS GROWING</span>
          <h2>
            {s.pet?.name || "团子"} ·{" "}
            {phase(s.demoDay) ? current.name : "性格萌芽中"}
          </h2>
          <p>{current.description}</p>
          <span className="pill">D21 / D49 / D77 · 三次进化</span>
        </div>
      </div>
      <div className="story-timeline">
        {story.map((c) => (
          <button
            className={`story-chapter ${c.day > s.demoDay ? "locked" : ""} ${s.storySeen.includes(c.day) ? "read" : ""}`}
            key={c.id}
            disabled={
              !s.pet || c.day > s.demoDay || s.couple?.status !== "bound"
            }
            onClick={() => {
              setChapter(c.day);
              void run("story_seen", { day: c.day });
            }}
          >
            <span className="story-day">D{c.day}</span>
            <div>
              <small>
                {c.day > s.demoDay
                  ? "尚未解锁"
                  : s.storySeen.includes(c.day)
                    ? "已收进回忆"
                    : "可以翻开"}
              </small>
              <h3>{c.title}</h3>
              <p>{c.description}</p>
            </div>
            <span>
              {[10, 30, 60, 90, 99].includes(c.day)
                ? "🎁"
                : [21, 49, 77].includes(c.day)
                  ? "✦"
                  : "♡"}
            </span>
          </button>
        ))}
      </div>
      <Card className="spaced">
        <h2>它会长成怎样的团子？</h2>
        <p className="description">
          主动互动累积五种性格权重，当前最高倾向影响外观与进化表现。性格没有好坏，也不对应真实心理诊断。
        </p>
        <div className="personality-list">
          {personalities.map((p) => (
            <div key={p.key}>
              <span style={{ background: p.color }} />
              <b>{p.name}</b>
              <small>{s.pet?.personality[p.key] ?? 0} 次偏好</small>
              <p>{p.description}</p>
            </div>
          ))}
        </div>
      </Card>
      {active && (
        <Modal
          title={`D${active.day} · ${active.title}`}
          onClose={() => setChapter(null)}
        >
          <div className="chapter-art">
            {active.day === 99
              ? "🎓"
              : [21, 49, 77].includes(active.day)
                ? "✨"
                : "💌"}
          </div>
          <p className="chapter-text">{active.description}</p>
          <blockquote>
            {active.day === 99
              ? `亲爱的两位主人：谢谢你们把一只小团子养成了自己。留下来，我会继续陪你们；去旅行，我也会把家放在心里。没有错误的选择。—— ${s.pet?.name}`
              : `「${s.pet?.name}的第${active.day}天」：原来每天的一点点陪伴，真的会长成看得见的模样。今天也想把这一页，认真收进我们的故事里。`}
          </blockquote>
          <button
            className="primary full"
            disabled={busy}
            onClick={() => {
              setChapter(null);
              go(
                active.day === 99
                  ? "ending"
                  : [10, 30, 60, 90].includes(active.day)
                    ? "rewards"
                    : [21, 49, 77].includes(active.day)
                      ? "valuation"
                      : active.day === 35
                        ? "interact"
                        : active.day === 60
                          ? "house"
                          : "map",
              );
            }}
          >
            去体验这一章
          </button>
        </Modal>
      )}
    </>
  );
}
