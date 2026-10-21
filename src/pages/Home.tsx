import { careScore, stageName } from "../domain/care-plan";
import { useState } from "react";
import {
  Heart,
  ArrowUpRight,
  Utensils,
  Hand,
  BookOpen,
  Moon,
  Brush,
  Sparkles,
  Check,
} from "lucide-react";
import { useGame } from "../store";
import { Pet } from "../components/Pet3D";
import { Card, Heading, Meter, Modal } from "../components/UI";
import {
  qualityScore,
  level,
  phase,
  personality,
  streak,
} from "../domain/engine";
import { personalities, story, xpThresholds } from "../domain/config";
export function Home({ go }: { go: (p: string) => void }) {
  const { state: s, me, run, busy, notify } = useGame();
  const [adopt, setAdopt] = useState(false);
  const [name, setName] = useState("团子");
  const [city, setCity] = useState("心动小镇");
  const [color, setColor] = useState(0);
  const [action, setAction] = useState("");
  const bound = s.couple?.status === "bound";
  const pet = s.pet;
  const chapter = [...story].reverse().find((c) => c.day <= s.demoDay)!;
  async function care(
    type: string,
    payload: Record<string, unknown>,
    animation: string,
  ) {
    const result = await run(type, payload, "团子收到了这份照顾 ♡");
    if (result) {
      setAction(animation);
      setTimeout(() => setAction(""), 1400);
    }
  }
  return (
    <>
      <Heading
        eyebrow="99 DAYS, ONE LITTLE LOVE"
        title="一起，把日子养酷。"
        description="99天新手爸妈计划 · 一起解锁小家伙的每一种可爱。"
      >
        <div className="today-badge">
          ☀️{" "}
          <span>
            {s.couple?.city || "心动小镇"}
            <b>宜 · 一起长大</b>
          </span>
        </div>
      </Heading>
      {!bound && (
        <div className="binding-banner">
          <span>💌</span>
          <div>
            <b>
              {s.couple
                ? s.couple.status === "unbound"
                  ? "这段旅程已暂停"
                  : s.couple.status === "confirming"
                    ? "正在成立你们的房间"
                    : "邀请另一位铲屎官加入"
                : "我们的99天，从共同领养开始"}
            </b>
            <p>双方完成绑定前，不启动养宠周期。</p>
          </div>
          <button
            className="secondary"
            onClick={() =>
              s.couple
                ? go("couple")
                : me.name === "新朋友"
                  ? go("profile")
                  : setAdopt(true)
            }
          >
            {s.couple ? "前往双人房间" : "开始领养"} <ArrowUpRight size={16} />
          </button>
        </div>
      )}
      <div className="home-grid">
        <Card className="pet-card">
          <div className="card-top">
            <span className="pill">
              <span className="online-dot" />
              {bound
                ? `我们的团子 · ${stageName(s.demoDay)}`
                : "等待一个共同的家"}
            </span>
            <span className="subtle">
              {bound ? `DAY ${s.demoDay} / 99` : "尚未启程"}
            </span>
          </div>
          <div className="pet-stage">
            <div className="speech">
              {!pet
                ? "听说，你们在找一个小团子？"
                : pet.mood === "traveling"
                  ? "我留下了两份线索哦～"
                  : pet.mood === "sleeping"
                    ? "充电中，也是在好好长大。"
                    : "今天想收集你们的一个抱抱！"}
            </div>
            <span className="stage-star">✧</span>
            <Pet action={action} size={260} />
            <span className="stage-heart">♡</span>
            <div className="pet-stage-floor" />
          </div>
          <div className="sticker-moods" role="group" aria-label="宠物表情预览">
            {[
              ["happy", "乖一点"],
              ["cool", "酷一点"],
              ["excited", "嗨起来"],
              ["sleeping", "困困了"],
            ].map(([id, label]) => (
              <button
                key={id}
                className={(action || "happy") === id ? "selected" : ""}
                onClick={() => setAction(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="pet-info">
            <div>
              <h2>
                {pet?.name || "遇见恋爱团子"}{" "}
                <span>Lv.{level(pet?.xp ?? 0)}</span>
              </h2>
              <p>
                {pet
                  ? `${phase(s.demoDay) ? personality(s).name : "初生团子"} · ${phase(s.demoDay) ? `第 ${phase(s.demoDay)} 次进化` : "性格正在慢慢长成"}`
                  : "软乎乎的新朋友，想认识你们。"}
              </p>
            </div>
            <Heart size={25} color="#dc98aa" fill="#f9e3e8" />
          </div>
          <Meter
            label="成长 XP · 等级只增不减"
            value={
              pet
                ? Math.min(
                    100,
                    ((pet.xp - xpThresholds[level(pet.xp) - 1]) /
                      ((xpThresholds[level(pet.xp)] ?? pet.xp + 100) -
                        xpThresholds[level(pet.xp) - 1])) *
                      100,
                  )
                : 0
            }
            suffix={`% · 累计 ${pet?.xp ?? 0} XP`}
          />
          {bound && (
            <div className="inline-actions spaced">
              <button
                className="primary"
                disabled={busy}
                onClick={() => void care("feed", { food: "basic" }, "feed")}
              >
                喂食
              </button>
              <button
                className="secondary"
                disabled={busy}
                onClick={() => void care("care", { kind: "pet" }, "pet")}
              >
                抚摸
              </button>
              <button className="secondary" onClick={() => go("identity")}>
                宠物身份卡 ↗
              </button>
            </div>
          )}
          <div className="pet-stats">
            <span>
              ✦ 活力 <b>{pet?.vitality ?? 70}</b>
            </span>
            <span>
              ♡ 双人羁绊 <b>{pet?.bond ?? 0}</b>
            </span>
            <span>
              🌱 养育品质{" "}
              <b>
                {qualityScore(pet?.quality ?? { N: 0, E: 0, X: 0, R: 0, L: 0 })}
              </b>
            </span>
          </div>
        </Card>
        <div className="home-side">
          <div className="hero-adventure">
            <div className="hero-town">
              🏡<span>🌳</span>
              <i>☁</i>
              <b>🐾</b>
            </div>
            <span className="eyebrow">A TINY WORLD, JUST FOR TWO</span>
            <h2>
              {s.adventure?.status === "active"
                ? "团子又偷偷出门啦！"
                : "下一站，一起去冒险。"}
            </h2>
            <p>
              你有一半线索，TA 有另一半。
              <br />
              拼出小镇里属于你们的故事。
            </p>
            <button className="primary" onClick={() => go("map")}>
              进入情侣地图 <ArrowUpRight size={18} />
            </button>
            <small>6 个探索地点 · 双人合作 · 虚拟地图</small>
          </div>
          <button className="valuation-preview" onClick={() => go("valuation")}>
            <span>✧</span>
            <div>
              <p>照护成长报告</p>
              <h3>{pet && bound ? `${careScore(s)} / 100` : "待共同领养"}</h3>
              <small>近期照护与五维品质，不给宠物标价</small>
            </div>
            <ArrowUpRight size={21} />
          </button>
        </div>
      </div>
      <div className="daily-grid spaced">
        <button className="daily-card lavender" onClick={() => go("tasks")}>
          <span>✦</span>
          <div>
            <small>TODAY’S LITTLE DISCOVERY</small>
            <h3>今天的任务，和昨天有点不同。</h3>
            <p>基础照顾、随机小惊喜与等待回应的共同任务。</p>
          </div>
          <ArrowUpRight size={20} />
        </button>
        <button className="daily-card pink" onClick={() => go("shelter")}>
          <span>♡</span>
          <div>
            <small>JAGAT ANIMAL CARE STATION</small>
            <h3>从新手爸妈，到它信任的人。</h3>
            <p>领养故事、模拟体验权益和公益说明。</p>
          </div>
          <ArrowUpRight size={20} />
        </button>
      </div>
      <div className="section-heading">
        <h2>
          今天，也要好好陪伴 <small>DAILY LITTLE LOVE</small>
        </h2>
        <span>免费基础照顾就足够长成满分团子</span>
      </div>
      <div className="care-grid">
        {[
          [Utensils, "免费喂养", "每天 2 次 · +5 XP", "feed", "feed"],
          [Hand, "摸摸团子", "每天 1 次 · +5 XP", "pet", "pet"],
          [BookOpen, "睡前故事", "每天 1 次 · +5 XP", "story", "quiet"],
          [Moon, "休息一下", "每天 1 次 · +5 XP", "rest", "sleeping"],
          [Brush, "整理小屋", "每天 1 次 · +5 XP", "tidy", "happy"],
        ].map(([Icon, title, desc, kind, animation]) => {
          const I = Icon as typeof Heart;
          const count = s.events.filter(
            (e) => e.day === s.demoDay && e.kind === kind,
          ).length;
          return (
            <button
              disabled={busy || !bound}
              className={`care-button ${count >= (kind === "feed" ? 2 : 1) ? "done" : ""}`}
              key={kind as string}
              onClick={() =>
                void care(
                  kind === "feed" ? "feed" : "care",
                  kind === "feed" ? { food: "basic" } : { kind },
                  animation as string,
                )
              }
            >
              <I size={21} />
              <b>{title as string}</b>
              <span>{desc as string}</span>
              <small>
                {count >= (kind === "feed" ? 2 : 1)
                  ? "✓ 今日已完成"
                  : kind === "feed"
                    ? `${count}/2`
                    : "点击开始"}
              </small>
            </button>
          );
        })}
      </div>
      <div className="daily-grid">
        <button className="daily-card pink" onClick={() => go("interact")}>
          <span>💌</span>
          <div>
            <small>BETTER TOGETHER</small>
            <h3>让团子，替你说心里话</h3>
            <p>送信、表达需要，或一起玩个小游戏。</p>
          </div>
          <ArrowUpRight size={20} />
        </button>
        <button className="daily-card lavender" onClick={() => go("story")}>
          <span>🌙</span>
          <div>
            <small>OUR 99-DAY STORY</small>
            <h3>
              D{chapter.day} · {chapter.title}
            </h3>
            <p>{chapter.description}</p>
          </div>
          <ArrowUpRight size={20} />
        </button>
      </div>
      <Card className="journey-strip">
        <div>
          <span className="eyebrow">OUR DAYS TOGETHER</span>
          <h3>
            {bound
              ? `养宠自然日 D${s.demoDay} · 连续互动 ${streak(s)} 天`
              : "先邀请 TA，故事才会开始"}
          </h3>
          <p>
            我们一起养了它99天。最后一天，你会继续陪伴，还是让它回到照护站？
          </p>
        </div>
        <button className="secondary" onClick={() => go("calendar")}>
          打开养宠日历 <ArrowUpRight size={16} />
        </button>
      </Card>
      {adopt && (
        <Modal title="领养一个软乎乎的新家人" onClose={() => setAdopt(false)}>
          <div
            className="adopt-preview"
            style={{ background: personalities[color].color }}
          >
            ♡
          </div>
          <p>原创物种 · 恋爱团子 · 性别中立</p>
          <label>
            给它一个名字
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={12}
              placeholder="1–12 个字"
            />
          </label>
          <label>
            出生城市（虚拟）
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              {["心动小镇", "上海", "杭州", "广州", "成都", "北京"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <div className="color-choices">
            {personalities.map((p, i) => (
              <button
                aria-label={`选择${p.name}初始颜色`}
                className={color === i ? "selected" : ""}
                style={{ background: p.color }}
                onClick={() => setColor(i)}
                key={p.key}
              >
                {color === i && <Check size={17} />}
              </button>
            ))}
          </div>
          <p className="subtle">颜色只决定初始外观；性格由互动偏好形成。</p>
          <button
            className="primary full"
            disabled={busy || !name.trim()}
            onClick={async () => {
              if (
                await run(
                  "adopt",
                  { name, city, color },
                  "房间创建成功，把邀请发给另一位吧",
                )
              ) {
                setAdopt(false);
                go("couple");
              }
            }}
          >
            创建双人领养房间 <Sparkles size={17} />
          </button>
        </Modal>
      )}
    </>
  );
}
