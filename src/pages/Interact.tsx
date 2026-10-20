import { useState, useLayoutEffect } from "react";
import { useGame } from "../store";
import { Heading, Card } from "../components/UI";
import { Pet } from "../components/Pet";
const options = {
  晚餐: ["火锅", "面条", "寿司", "家常菜"],
  心情: ["开心", "平静", "想休息", "想被鼓励"],
  约会: ["公园散步", "咖啡馆", "居家电影", "城市探索"],
  装扮: ["粉色蝴蝶结", "绿色探险帽", "条纹套装", "原本就可爱"],
  密码: ["心动", "陪伴", "星光", "回家"],
};
export function Interact() {
  const { state: s, role, run, busy } = useGame();
  const [tab, setTab] = useState("letters");
  const [body, setBody] = useState("今天辛苦了，想陪你一起慢慢休息。");
  const [reply, setReply] = useState("收到一个抱抱 ♡");
  const [future, setFuture] = useState("");
  const [day, setDay] = useState(30);
  const [kind, setKind] = useState<keyof typeof options>("晚餐");
  const [answer, setAnswer] = useState("");
  const [guess, setGuess] = useState("");
  const [mediation, setMediation] = useState("吃火锅");
  useLayoutEffect(() => {
    setBody("今天辛苦了，想陪你一起慢慢休息。");
    setReply("收到一个抱抱 ♡");
    setFuture("");
    setAnswer("");
    setGuess("");
    setMediation("吃火锅");
  }, [role]);
  const c = s.challenge;
  const choices = options[(c?.kind || kind) as keyof typeof options];
  return (
    <>
      <Heading
        eyebrow="LITTLE WORDS, BIG FEELINGS"
        title="心意，让团子替你送达。"
        description="每一种需要都值得被听见。这里没有关系评分，也不要求一定说“我爱你”。"
      />
      <div className="tabs">
        {[
          ["letters", "💌 宠物信使"],
          ["needs", "💗 今天需要什么"],
          ["challenge", "🧩 默契小游戏"],
          ["date", "☕ 约会提案"],
          ["future", "🌙 未来情书"],
          ["repair", "🌿 情绪修复站"],
        ].map(([id, label]) => (
          <button
            className={tab === id ? "selected" : ""}
            key={id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "letters" && (
        <div className="two-col">
          <Card>
            <span className="kicker">FROM {role}, WITH LOVE</span>
            <h2>宠物替我说一句</h2>
            <div className="template-choices">
              {[
                "今天辛苦了，想陪你一起慢慢休息。",
                "发现一件小事，第一时间想和你分享。",
                "不用急着回复，我一直在这里。",
              ].map((t) => (
                <button key={t} onClick={() => setBody(t)}>
                  {t}
                </button>
              ))}
            </div>
            <label>
              想送给 TA 的话
              <textarea
                maxLength={500}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </label>
            <button
              className="primary full"
              disabled={busy || !body.trim()}
              onClick={async () => {
                if (
                  await run(
                    "letter_send",
                    { body },
                    "团子出发送信啦！切换另一位玩家回复",
                  )
                )
                  setBody("");
              }}
            >
              让团子送给 {role === "A" ? "B" : "A"}
            </button>
            <p className="subtle">
              不记录信件正文到通用埋点。此为本地存档，请勿填写敏感信息。
            </p>
          </Card>
          <Card>
            <h2>团子邮局</h2>
            {!s.letters.length && (
              <p className="mini-empty">
                暂时没有来信。写下第一句轻轻的关心吧。
              </p>
            )}
            {s.letters.map((l) => (
              <div className="letter-card" key={l.id}>
                <span className="kicker">
                  {l.sender} → {l.sender === "A" ? "B" : "A"}
                </span>
                <p>{l.body}</p>
                {l.reply ? (
                  <blockquote>回复：{l.reply}</blockquote>
                ) : l.sender !== role ? (
                  <>
                    <label>
                      我的回复
                      <input
                        maxLength={300}
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                      />
                    </label>
                    <button
                      className="secondary"
                      disabled={busy || !reply.trim()}
                      onClick={() =>
                        void run(
                          "letter_reply",
                          { id: l.id, body: reply },
                          "心意已回应，今日首次回复获得5 XP",
                        )
                      }
                    >
                      回复一个抱抱
                    </button>
                  </>
                ) : (
                  <small>等待另一位收到心意…</small>
                )}
                <button
                  className="text-button"
                  onClick={() =>
                    void run("letter_delete", { id: l.id }, "信件已删除")
                  }
                >
                  删除信件
                </button>
              </div>
            ))}
          </Card>
        </div>
      )}
      {tab === "needs" && (
        <div className="two-col">
          <Card>
            <h2>今天，你需要什么？</h2>
            <p className="description">每位玩家分别选择，不评判谁更爱谁。</p>
            <div className="choice-list">
              {[
                "想被安慰",
                "想一起玩",
                "想分享开心的事",
                "想安静休息",
                "想被鼓励",
              ].map((v, i) => (
                <button
                  className={s.needs[role] === v ? "selected" : ""}
                  onClick={() =>
                    void run("needs", { value: v }, "团子记下了你今天的需要")
                  }
                  key={v}
                >
                  {["🫂", "🎮", "✨", "🌙", "🌱"][i]} {v}
                </button>
              ))}
            </div>
            {s.needs.A && s.needs.B ? (
              <blockquote>
                A：{s.needs.A}
                <br />
                B：{s.needs.B}
                <br />
                团子建议：
                {s.needs.A === "想安静休息" || s.needs.B === "想安静休息"
                  ? "先留一点安静空间，稍后再分享一个开心的小片段。"
                  : "互相分享一件小事，再选择一个两人都舒服的小活动。"}
              </blockquote>
            ) : (
              <p className="description">
                {s.needs[role]
                  ? "已记录，切换另一位完成选择。"
                  : "选一个今天最贴近的需要吧。"}
              </p>
            )}
          </Card>
          <Card>
            <h2>小小选择，让团子当和事佬</h2>
            <p className="description">
              只用于吃什么、看什么、穿什么等轻量选择。
            </p>
            <label>
              玩家 {role} 的提议
              <select
                value={mediation}
                onChange={(e) => setMediation(e.target.value)}
              >
                {["吃火锅", "吃面条", "看喜剧", "公园散步", "咖啡馆坐坐"].map(
                  (v) => (
                    <option key={v}>{v}</option>
                  ),
                )}
              </select>
            </label>
            <button
              className="primary"
              disabled={busy}
              onClick={() => void run("mediate", { value: mediation })}
            >
              提交我的提议
            </button>
            {s.mediation.A && s.mediation.B && (
              <blockquote>
                你们的提议：{s.mediation.A} / {s.mediation.B}
                <br />
                团子建议：
                {s.mediation.A === s.mediation.B
                  ? "想到一起啦，就这么定！"
                  : `今天先${s.mediation.A}，下次留给「${s.mediation.B}」。也可以重新一起商量。`}
              </blockquote>
            )}
          </Card>
        </div>
      )}
      {tab === "challenge" && (
        <div className="two-col">
          <Card>
            <span className="kicker">SAME LITTLE TEAM</span>
            <h2>我们有一点默契，也有一点惊喜</h2>
            <p className="description">
              先选自己的答案，再猜 TA
              的答案。双方异步提交后揭晓。密码题也需两人独立选择同一口令，不是身份验证。
            </p>
            <label>
              挑战类型
              <select
                value={kind}
                disabled={c?.status === "active"}
                onChange={(e) => {
                  setKind(e.target.value as keyof typeof options);
                  setAnswer("");
                  setGuess("");
                }}
              >
                {Object.keys(options).map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            {c?.status !== "active" ? (
              <button
                className="primary"
                onClick={() =>
                  void run(
                    "challenge_start",
                    { kind },
                    "任务开启，各自秘密选择吧",
                  )
                }
              >
                开启{kind}挑战
              </button>
            ) : (
              <>
                <span className="pill">{c.kind}挑战进行中</span>
                {c.mine ? (
                  <p className="description">
                    你已提交。
                    {c.otherSubmitted
                      ? "双方已完成"
                      : "切换另一位继续，答案尚未揭晓。"}
                  </p>
                ) : (
                  <>
                    <label>
                      我的选择
                      <select
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                      >
                        <option value="">请选择</option>
                        {choices.map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      我猜 TA 会选
                      <select
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                      >
                        <option value="">请选择</option>
                        {choices.map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                    <button
                      disabled={!answer || !guess || busy}
                      className="primary full"
                      onClick={async () => {
                        if (
                          await run(
                            "challenge_answer",
                            { value: answer, guess },
                            "答案已密封提交",
                          )
                        ) {
                          setAnswer("");
                          setGuess("");
                        }
                      }}
                    >
                      提交玩家 {role} 的答案
                    </button>
                  </>
                )}
              </>
            )}
          </Card>
          <Card className="challenge-result">
            <span className="result-emoji">🧩</span>
            <h2>
              {c?.result
                ? `${c.result.matches}/2 次猜中`
                : "两份答案，一份期待"}
            </h2>
            {c?.result ? (
              <>
                <p className="description">
                  A：{c.result.answers.A}
                  <br />
                  B：{c.result.answers.B}
                </p>
                <blockquote>
                  {c.result.matches === 2
                    ? "团子：你们是不是偷偷共享了脑电波？"
                    : "团子：原来你们各有自己的可爱！下次约会又有新灵感了。"}
                </blockquote>
                <p className="subtle">
                  首次每日双人任务 +10 XP，羁绊 +10。低匹配不代表关系不合适。
                </p>
              </>
            ) : (
              <p className="description">
                不会提前展示另一位的答案。
                <br />
                请在顶部切换 A / B，轮流完成提交。
              </p>
            )}
          </Card>
        </div>
      )}
      {tab === "date" && (
        <div className="two-col">
          <Card key={s.dateMission?.id || "new-date"} className="date-card">
            <span className="result-emoji">🎁</span>
            <span className="kicker">A LITTLE DATE, JUST FOR TWO</span>
            <h2>{s.dateMission?.title || "今天的约会，交给团子决定"}</h2>
            <p className="description">
              {s.dateMission?.description ||
                "从四种轻量任务中抽一份惊喜，两位分别确认完成后留下地图报告。"}
            </p>
            {s.dateMission?.status === "active" ? (
              <>
                <p className="pill">
                  A {s.dateMission.completed.includes("A") ? "✓" : "○"} · B{" "}
                  {s.dateMission.completed.includes("B") ? "✓" : "○"}
                </p>
                <button
                  className="primary full"
                  disabled={busy || s.dateMission.completed.includes(role)}
                  onClick={() =>
                    void run(
                      "date_complete",
                      {},
                      "已确认完成，等待双方一起留下报告",
                    )
                  }
                >
                  玩家 {role} 确认约会完成
                </button>
              </>
            ) : (
              <button
                className="primary full"
                disabled={busy}
                onClick={() => void run("date_draw")}
              >
                {s.dateMission ? "再抽一份约会" : "抽取约会盲盒"}
              </button>
            )}
          </Card>
          <Card>
            <h2>约会报告</h2>
            {s.diaries
              .filter((d) => !d.hidden && d.text.includes("约会报告"))
              .map((d) => (
                <blockquote key={d.id}>
                  D{d.day} · {d.text}
                </blockquote>
              ))}
            {!s.diaries.some((d) => d.text.includes("约会报告")) && (
              <p className="mini-empty">
                完成一次双人约会，团子就会写下今天的报告。
              </p>
            )}
            <p className="notice">
              地点偏好可在「默契小游戏 →
              约会」中分别选择，双方可据此共同决定任务的具体地点。
            </p>
          </Card>
        </div>
      )}
      {tab === "future" && (
        <div className="two-col">
          <Card>
            <h2>寄给未来的我们</h2>
            <p className="description">
              D30 / D60 / D90 才交给对方。发送者可以在解锁前撤回。
            </p>
            <label>
              解锁日
              <select
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
              >
                {[30, 60, 90].map((d) => (
                  <option key={d} value={d} disabled={d <= s.demoDay}>
                    D{d}
                    {d <= s.demoDay ? " · 已到期" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              未来信件
              <textarea
                maxLength={500}
                value={future}
                onChange={(e) => setFuture(e.target.value)}
                placeholder="可以从今天的一件小事写起…"
              />
            </label>
            <button
              className="primary full"
              disabled={busy || !future.trim() || day <= s.demoDay}
              onClick={async () => {
                if (
                  await run(
                    "future_write",
                    { day, body: future },
                    "信件已封存，等未来的你打开",
                  )
                )
                  setFuture("");
              }}
            >
              密封这封信
            </button>
          </Card>
          <Card>
            <h2>时间邮筒</h2>
            {s.futureLetters.length ? (
              s.futureLetters.map((l) => (
                <div className="letter-card" key={l.id}>
                  <span className="pill">
                    D{l.unlockDay} · {l.sender} → {l.recipient}
                  </span>
                  {l.body ? (
                    <p>{l.body}</p>
                  ) : (
                    <div className="sealed-letter">
                      🔒 还未到解锁日，收件人无法读取正文。
                    </div>
                  )}
                  {l.sender === role && s.demoDay < l.unlockDay && (
                    <button
                      className="text-button"
                      onClick={() =>
                        void run(
                          "future_delete",
                          { id: l.id },
                          "未送达信件已撤回并删除",
                        )
                      }
                    >
                      撤回并删除
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="mini-empty">这里还没有封存的未来信件。</p>
            )}
          </Card>
        </div>
      )}
      {tab === "repair" && (
        <div className="two-col">
          <Card className="center">
            <Pet />
            <h2>
              团子今天想
              {
                {
                  happy: "开心地陪你",
                  quiet: "安静一会儿",
                  shy: "收一个小拥抱",
                  missing: "翻翻回忆",
                  sleeping: "好好休息",
                  traveling: "去看看世界",
                }[s.pet!.mood]
              }
            </h2>
            <p className="description">
              宠物情绪只是游戏剧情，不代表真实情侣心理状态。
              <br />
              不活跃也不会让宠物死亡。
            </p>
          </Card>
          <Card>
            <h2>一份轻轻的恢复任务</h2>
            <div className="choice-list">
              {[
                ["story", "📖 讲个睡前故事"],
                ["pet", "🤲 给团子一个摸摸"],
                ["rest", "🌙 让团子安静休息"],
                ["tidy", "🪴 一起收拾小屋"],
              ].map(([kind, label]) => (
                <button
                  disabled={busy}
                  key={kind}
                  onClick={() =>
                    void run("care", { kind }, "团子舒服地呼了一口气")
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="description">
              每项每天一次，恢复活力；今日已完成的任务不会重复发 XP。
            </p>
          </Card>
        </div>
      )}
    </>
  );
}
