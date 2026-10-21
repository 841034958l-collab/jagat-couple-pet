import { useState } from "react";
import { useGame } from "../store";
import { Heading, Card } from "../components/UI";
import { Pet } from "../components/Pet3D";
const chapters = [
  {
    day: "D1—7",
    title: "陌生的小家伙",
    label: "初遇",
    body: "第一次来到小屋，它会先躲在玩具旁，观察你们。记住名字、准备第一顿饭、留一个安静角落。它不需要立刻热情，你们也不需要什么都懂。",
    quote: "“你们可以坐近一点点，但先别突然抱我哦。”",
  },
  {
    day: "D8—21",
    title: "它开始记住你",
    label: "熟悉",
    body: "一个摸摸、一段故事、第一次在地图上找回它。团子开始知道，门外的脚步声也可能带来好消息。D21迎来第一次性格进化。",
    quote: "“我没在等你，我只是刚好站在门口。”",
  },
  {
    day: "D22—49",
    title: "长成我们的样子",
    label: "成长",
    body: "探索和陪伴留下不同的性格倾向。你们分别完成线索、约会和小任务，一段段经历进入日记。D49再次进化，它有了更自在的神态。",
    quote: "“他们负责想去哪儿，我负责把旅行变成找我的游戏。”",
  },
  {
    day: "D50—77",
    title: "自在地做自己",
    label: "自在",
    body: "小屋有了喜欢的角落，衣橱里有了自己的风格。团子会开心，也会想安静休息。D77的成年礼，纪念你们学会尊重彼此的小边界。",
    quote: "“会自己玩，也喜欢你们在旁边。”",
  },
  {
    day: "D78—99",
    title: "给未来的一封信",
    label: "信任",
    body: "毕业邀请送达。翻开身份卡、共同回忆和照护报告，两人分别做出秘密选择：继续共同生活，或让团子回到照护站。答案不同就慢慢商量，没有被催促的告别。",
    quote: "“无论下一站在哪儿，我都记得你们给我留的那盏灯。”",
  },
];
const mechanics = [
  {
    icon: "01",
    title: "一起建立一个家",
    text: "先设置自己的资料，由一人建房、邀请另一位。对方在自己的设备接受后，开始正式D1。没有A/B身份切换。",
    route: "couple",
    cta: "前往双人房间",
  },
  {
    icon: "02",
    title: "每天，有一点不同",
    text: "任务页每天生成两项稳定的随机照顾任务；刷新不重抽。免费喂养、抚摸、讲故事和休息，都会留下真实成长记录。",
    route: "tasks",
    cta: "看看今天的任务",
  },
  {
    icon: "03",
    title: "两份线索，一个小淘气",
    text: "地图里有6个虚拟地点。你与伙伴分别得到线索，组合信息找回宠物；也可以抽约会任务、用文字信使表达心意。",
    route: "map",
    cta: "进入地图冒险",
  },
  {
    icon: "04",
    title: "成长，不只一个数字",
    text: "累计XP记录长期经历；近期照护分反映最近的照顾。首个完整缺席日宽限，之后按规则有限下降。免费照顾可以恢复，不抹除累计XP，不让宠物死亡。",
    route: "valuation",
    cta: "阅读照护成长报告",
  },
  {
    icon: "05",
    title: "把经历变成纪念",
    text: "D10/30/60/90/99有里程碑，D21/49/77有性格进化。身份卡保存个性和经历；分享图片先选择昵称、地点及双方信息是否公开。",
    route: "identity",
    cta: "打开宠物身份卡",
  },
  {
    icon: "06",
    title: "第99天，听听自己的心",
    text: "双方各自秘密选择。都留下，就继续养成；都回站，就保留纪念与回站剧情；答案不同，宠物先留下，再共同决定。模拟奖励不等于真实补贴。",
    route: "ending",
    cta: "查看毕业章节",
  },
];
export function CareStory({
  go,
  replay,
}: {
  go: (p: string) => void;
  replay: () => void;
}) {
  const { state: s, run, busy, demo } = useGame();
  const [chapter, setChapter] = useState(0);
  const bound = s.couple?.status === "bound";
  const active = chapters[chapter];
  function enter(route: string) {
    go(bound || route === "couple" ? route : "couple");
  }
  return (
    <>
      <Heading
        eyebrow="JAGAT ORIGINAL · OUR FIRST 99 DAYS"
        title="用99天，成为它信任的人。"
        description="一群小动物，一座虚拟照护站。关于相遇、照顾，以及慢慢建立的信任。"
      />
      <section className="story-premiere" aria-label="照护站开场动画入口">
        <div className="premiere-orbit" />
        <div className="premiere-copy">
          <span className="film-tag">JAGAT CARE STATION · 序章</span>
          <h2>
            不是每一次靠近，
            <br />
            都要立刻有答案。
          </h2>
          <p>
            有的小家伙会先躲起来。
            <br />
            有的会装作不在意。
            <br />
            有的，正在等你打开这段故事。
          </p>
          <button className="primary" onClick={replay}>
            ▷ 观看开场动画
          </button>
          <small>5幕自动播放 · 可暂停 / 跳过 · 默认静音</small>
        </div>
        <div className="premiere-pet">
          <Pet size={300} />
          <span className="premiere-sticker">HEY, NEW PARENTS!</span>
        </div>
      </section>
      <nav className="story-section-links" aria-label="故事页章节导航">
        {[
          ["world", "故事背景"],
          ["chapters", "99天章节"],
          ["mechanics", "怎么玩"],
          ["experience", "体验权益"],
          ["charity-story", "公益与毕业"],
        ].map(([id, t]) => (
          <a
            href={`#shelter`}
            key={id}
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById(id)
                ?.scrollIntoView({
                  behavior: matchMedia("(prefers-reduced-motion: reduce)")
                    .matches
                    ? "instant"
                    : "smooth",
                  block: "start",
                });
            }}
          >
            {t} ↘
          </a>
        ))}
      </nav>
      <section id="world" className="story-section">
        <span className="eyebrow">01 / THE PLACE WHERE WE MEET</span>
        <h2>
          小城的一角，
          <br />
          有人在等一个自己的名字。
        </h2>
        <div className="two-col spaced">
          <Card>
            <h3>欢迎来到Jagat动物照护站。</h3>
            <p>
              在这个虚拟小城里，一群还没找到归属的小家伙住进了照护站。它们有不同的性格：好奇的喜欢跑出去，慢热的喜欢把自己藏在柔软角落，活泼的总想拉你一起玩。
            </p>
            <p className="spaced">
              照护员想邀请两位新手爸妈，用99天参与它的日常。不需要完美，不必每天同时在线，先从一顿饭和一个不勉强的摸摸开始。
            </p>
          </Card>
          <Card className="first-letter">
            <span className="film-tag">来自一个还没名字的小家伙</span>
            <blockquote>
              “我还不知道你们是谁。
              <br />
              我喜欢亮亮的小玩具，也需要安静。
              <br />
              如果我没有马上靠近，别着急。
              <br />
              等熟悉了，也许我会先跑向你。”
            </blockquote>
            <p className="subtle">
              原创虚拟故事，不对应真实动物交易或已发生的救助。
            </p>
          </Card>
        </div>
      </section>
      <section id="chapters" className="story-section">
        <span className="eyebrow">02 / FIVE CHAPTERS OF TRUST</span>
        <h2>99天，五段慢慢靠近。</h2>
        <div
          className="chapter-selector"
          role="group"
          aria-label="成长故事阶段"
        >
          {chapters.map((c, i) => (
            <button
              key={c.day}
              aria-pressed={chapter === i}
              onClick={() => setChapter(i)}
              className={chapter === i ? "selected" : ""}
            >
              <span>{c.day}</span>
              <b>{c.label}</b>
            </button>
          ))}
        </div>
        <Card className="chapter-detail">
          <span className="pill">
            {active.day} · {active.label}
          </span>
          <h3>{active.title}</h3>
          <p>{active.body}</p>
          <blockquote>{active.quote}</blockquote>
        </Card>
      </section>
      <section id="mechanics" className="story-section">
        <span className="eyebrow">03 / HOW OUR LITTLE WORLD WORKS</span>
        <h2>
          知道怎么玩，
          <br />
          也知道为什么照顾它。
        </h2>
        <div className="two-col spaced">
          {mechanics.map((m) => (
            <Card key={m.icon} className="mechanic-card">
              <span className="mechanic-number">{m.icon}</span>
              <h3>{m.title}</h3>
              <p>{m.text}</p>
              <button className="secondary" onClick={() => enter(m.route)}>
                {bound || m.route === "couple" ? m.cta : "先共同领养，再来体验"}{" "}
                →
              </button>
            </Card>
          ))}
        </div>
      </section>
      <section id="experience" className="story-section">
        <span className="eyebrow">04 / AN EXPERIENCE FOR TWO</span>
        <h2>两个人，一份共同体验。</h2>
        <Card>
          <span className="pill">模拟体验 · 不会扣款</span>
          <h3>拟议权益：9.9元体验 / Jagat会员</h3>
          <p>
            一房一份99天权益，另一位不重复开通。当前是演示激活，不验证真实会员、不自动续费，也不会锁住已有养宠进度。
          </p>
          {s.carePlan ? (
            <div className="notice">
              ✓ 已模拟激活：
              {s.carePlan.method === "fee_mock"
                ? "9.9元体验方案"
                : "会员体验方案"}
              <br />
              没有真实支付或公益转付。
            </div>
          ) : (
            <div className="choice-list spaced">
              <button
                disabled={busy || !bound || !demo}
                onClick={() =>
                  void run(
                    "care_plan_activate",
                    { method: "fee_mock" },
                    "模拟体验已激活，没有扣款",
                  )
                }
              >
                模拟9.9元体验
              </button>
              <button
                disabled={busy || !bound || !demo}
                onClick={() =>
                  void run(
                    "care_plan_activate",
                    { method: "member_mock" },
                    "模拟会员体验已激活",
                  )
                }
              >
                模拟Jagat会员体验
              </button>
            </div>
          )}
          {!bound && (
            <p className="notice">
              对方接受邀请后才开始99天；先成立房间，再模拟激活体验。
            </p>
          )}
          <p className="subtle">
            正式价格、退款、会员周期与补贴需独立规则，当前不作现金回报承诺。
          </p>
        </Card>
      </section>
      <section id="charity-story" className="story-section">
        <span className="eyebrow">05 / CARE BEYOND THE SCREEN</span>
        <h2>
          愿这份关心，
          <br />
          也能走向屏幕外。
        </h2>
        <Card>
          <h3>游戏里的陪伴，是一段学习的开始。</h3>
          <p>
            我们希望未来将活动领养费用用于真实流浪动物救助。当前公益合作筹备中，尚未收款或转付；只有机构、金额口径、退款、转付周期与凭证落实后，才会开放真实活动。
          </p>
          <p className="spaced">
            会员体验不代表整笔会员费自动捐出；照护成长分不是宠物身价。寄养补贴的预算、档位、名额与审核尚未确定，原模拟奖励不代表真实到账。
          </p>
          <button className="secondary spaced" onClick={() => go("charity")}>
            查看公益项目状态与说明 →
          </button>
        </Card>
        <div className="story-final">
          <span>✦</span>
          <h3>
            屏幕里的99天可以重来，
            <br />
            现实里的信任需要长久负责。
          </h3>
          <p>
            理解动物的需要，尊重它的边界。决定真实领养前，先准备好时间、空间和长期照顾。
          </p>
          <button
            className="primary"
            onClick={() => go(bound ? "home" : "profile")}
          >
            {bound ? "回到我们的小家" : "设置我的资料，准备相遇"}
          </button>
        </div>
      </section>
    </>
  );
}
export function Charity() {
  return (
    <>
      <Heading
        eyebrow="CARE BEYOND THE SCREEN"
        title="愿每次相遇，都不是一时兴起。"
        description="现实中的陪伴，需要时间、空间、预算，以及长久负责。"
      />
      <Card>
        <span className="pill">公益合作筹备中</span>
        <h2>项目与资金公开</h2>
        <div className="history-list">
          {[
            ["合作机构", "尚未确认"],
            ["真实收款", "尚未开通"],
            ["公益转付", "尚未发生"],
            ["资金凭证", "合作落实后公开"],
            ["会员配捐", "规则待定，与体验费分开说明"],
          ].map(([a, b]) => (
            <div key={a}>
              <span>{a}</span>
              <b>{b}</b>
            </div>
          ))}
        </div>
        <p className="description">
          筹备期间不接受捐赠、不显示虚构救助数量。请勿向未经核实的账号转账。
        </p>
      </Card>
      <Card className="spaced">
        <h2>今天可以做的小事</h2>
        <p>
          了解动物习性，尊重不愿靠近的时候；不随意投喂；真实健康问题咨询兽医。决定现实领养前，先做好长期准备。
        </p>
      </Card>
    </>
  );
}
