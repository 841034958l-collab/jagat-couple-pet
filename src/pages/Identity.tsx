import { useGame } from "../store";
import { Card, Heading } from "../components/UI";
import { Pet } from "../components/Pet3D";
import { personality, level } from "../domain/engine";
import { stageName } from "../domain/care-plan";
export function Identity({ go }: { go: (p: string) => void }) {
  const { state: s } = useGame();
  const p = s.pet!;
  const traits = personality(s);
  return (
    <>
      <Heading
        eyebrow="EVERY LITTLE ONE HAS A STORY"
        title={`${p.name}的小小身份卡`}
        description="性格由互动偏好形成，是游戏角色设定，不是心理诊断。默认只在你们的小家中展示。"
      />
      <div className="two-col">
        <Card className="identity-card">
          <span className="eyebrow">JAGAT CARE STATION · RESIDENT</span>
          <Pet size={250} />
          <h2>{p.name}</h2>
          <span className="pill">
            {stageName(s.demoDay)} · {traits.name} · Lv.{level(p.xp)}
          </span>
          <p className="pet-quote">
            “我认得你们回家的声音，也记得一起听过的故事。”
          </p>
          <small>
            专属编号 {p.id.slice(0, 8)} · 来站日{" "}
            {new Date(p.createdAt).toLocaleDateString("zh-CN")}
          </small>
        </Card>
        <Card>
          <h2>认识我，慢慢来。</h2>
          <div className="history-list">
            <div>
              <span>我的性格</span>
              <b>{traits.name}</b>
            </div>
            <div>
              <span>小小自我介绍</span>
              <b>{traits.description}</b>
            </div>
            <div>
              <span>喜欢的事</span>
              <b>
                {p.personality.exploration > p.personality.companionship
                  ? "地图探索和新鲜风景"
                  : "睡前故事与柔软角落"}
              </b>
            </div>
            <div>
              <span>请尊重我的边界</span>
              <b>等我自己靠近，不突然叫醒我。</b>
            </div>
            <div>
              <span>共同养宠的日子</span>
              <b>D{s.demoDay} / 99</b>
            </div>
          </div>
          <h3 className="spaced">我的成长经历</h3>
          {s.events
            .filter((e) =>
              ["adopt", "rescue", "date", "cooperate"].includes(e.kind),
            )
            .slice(-5)
            .map((e) => (
              <p key={e.id}>
                D{e.day} · {e.label}
              </p>
            ))}
          {s.events.length < 2 && <p>故事刚开始，还会有许多第一次。</p>}
          <button className="secondary" onClick={() => go("calendar")}>
            翻开完整成长日历 →
          </button>
          <button className="secondary spaced" onClick={() => go("share")}>
            编辑身份卡海报与隐私 →
          </button>
        </Card>
      </div>
    </>
  );
}
