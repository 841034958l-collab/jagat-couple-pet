import { useEffect, useState } from "react";
import { Modal } from "./UI";
import { Pet } from "./Pet3D";
const scenes = [
  {
    title: "一座小城，许多个等待。",
    line: "在Jagat动物照护站，每个小家伙都在等一个愿意慢慢了解它的人。",
    scene: "shelter",
    caption: "虚拟故事 · 不对应真实动物领养",
  },
  {
    title: "它也有自己的小脾气。",
    line: "怕生，却偷偷好奇；喜欢玩具，也喜欢一个不被打扰的角落。",
    scene: "meet",
    caption: "先认识它，再决定陪伴",
  },
  {
    title: "用99天，成为它信任的人。",
    line: "喂饭、陪玩、一起探索。你们教它的小习惯，会长成独一份的故事。",
    scene: "together",
    caption: "一人建房 · 对方接受 · 共同启程",
  },
  {
    title: "长大的，不只是小动物。",
    line: "从第一次靠近，到认得你们回家的声音。每一份照顾，都留下了变化。",
    scene: "growth",
    caption: "成长形态 · 共同回忆 · 毕业纪念",
  },
  {
    title: "愿每次相遇，都不是一时兴起。",
    line: "屏幕里的99天可以重来，现实中的陪伴需要长久负责。了解它的需要，尊重它的边界。",
    scene: "future",
    caption: "保护动物，从负责任的了解开始",
  },
];
export function AdoptionStory({
  onClose,
  onStart,
}: {
  onClose: () => void;
  onStart: () => void;
}) {
  const [step, setStep] = useState(0),
    [playing, setPlaying] = useState(
      !matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  useEffect(() => {
    if (!playing || step === scenes.length - 1) return;
    const t = setTimeout(() => setStep((v) => v + 1), 5000);
    return () => clearTimeout(t);
  }, [step, playing]);
  const x = scenes[step];
  return (
    <Modal title="Jagat动物照护站" onClose={onClose}>
      <div className="story-dots">
        {scenes.map((_, i) => (
          <button
            key={i}
            className={i === step ? "active" : ""}
            aria-label={`故事第${i + 1}幕`}
            onClick={() => setStep(i)}
          />
        ))}
      </div>
      <div key={step} className={`story-scene ${x.scene}`}>
        <span className="story-window">✦</span>
        <Pet size={230} />
        <span className="story-cloud">☁</span>
      </div>
      <div className="story-copy" key={"copy" + step}>
        <span className="eyebrow">
          {String(step + 1).padStart(2, "0")} / 05
        </span>
        <h3>{x.title}</h3>
        <p>{x.line}</p>
        <small>{x.caption}</small>
      </div>
      <div className="inline-actions spaced">
        <button className="secondary" onClick={() => setPlaying((v) => !v)}>
          {playing ? "暂停播放" : "自动播放"}
        </button>
        {step < 4 ? (
          <button className="primary" onClick={() => setStep(step + 1)}>
            下一幕 →
          </button>
        ) : (
          <button className="primary" onClick={onStart}>
            认识我的小伙伴
          </button>
        )}
        <button className="text-button" onClick={onClose}>
          跳过故事
        </button>
      </div>
      <p className="subtle">静音动画 · 可随时回看 · 不会自动付款</p>
    </Modal>
  );
}
