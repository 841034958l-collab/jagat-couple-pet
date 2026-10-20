import { useState } from "react";
import { useGame } from "../store";
import { milestones } from "../domain/config";
import { Heading, Card, money } from "../components/UI";
export function Rewards() {
  const { state: s, run, busy } = useGame();
  const [url, setUrl] = useState("");
  return (
    <>
      <Heading
        eyebrow="MILESTONES OF OUR LITTLE LOVE"
        title="每一段陪伴，都值得庆祝。"
        description="基础成长奖励无需发帖、邀请新人、广告或消费。所有基金仅演示申请与审核，不产生真实到账。"
      />
      <div className="notice">
        模拟活动规则 v1：达到对应天数并领取礼包后可提交一次模拟基金申请；D99
        需要双方完成一致选择并确认，最高模拟¥99。模拟资格不等于真实资格，无财务发放能力。
      </div>
      <div className="milestone-grid">
        {milestones.map((m) => {
          const claimed = s.claimed.includes(m.id);
          const applied = s.applications.find(
            (a) => a.milestoneId === m.id && a.kind === "base",
          );
          const locked = s.demoDay < m.day;
          return (
            <Card className={locked ? "locked-reward" : ""} key={m.id}>
              <div className="milestone-day">
                D{m.day}
                <span>{m.day === 99 ? "🎓" : "🎁"}</span>
              </div>
              <h2>{m.title}</h2>
              <p className="description">
                成长 +{m.xp} XP · 爱心币 +{m.hearts}
                <br />
                {
                  (
                    {
                      snack: "星星饼干礼包 ×3",
                      bow: "专属蝴蝶结",
                      sofa: "云朵沙发",
                      grad: "毕业皮肤",
                      certificate: "毕业纪念册",
                    } as Record<string, string>
                  )[m.item]
                }
              </p>
              <h3 className="fund-value">
                模拟 {money(m.fundCents)} <small>养宠基金</small>
              </h3>
              <button
                className="primary full"
                disabled={busy || locked || claimed}
                onClick={() =>
                  void run("claim", { id: m.id }, `D${m.day} 成长礼包已领取`)
                }
              >
                {claimed
                  ? "✓ 成长礼包已领取"
                  : locked
                    ? `D${m.day} 解锁`
                    : "领取成长礼包"}
              </button>
              <button
                className="secondary full spaced"
                disabled={busy || !claimed || !!applied}
                onClick={() =>
                  void run(
                    "reward_apply",
                    { id: m.id },
                    "模拟申请已提交，不会产生真实转账",
                  )
                }
              >
                {applied ? "模拟申请已提交 · 未到账" : "提交模拟基金申请"}
              </button>
            </Card>
          );
        })}
      </div>
      <div className="two-col spaced">
        <Card>
          <h2>自愿创意活动 · 与基础基金独立</h2>
          <p className="description">
            愿意的话，分享一张出生证明、成长报告或地图故事。填写已经发布的作品链接，仅模拟审核，不验证外部发布成功，不保证奖励或名额。
          </p>
          <label>
            外部作品链接
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              maxLength={500}
            />
          </label>
          <button
            className="primary"
            disabled={busy || !url.trim()}
            onClick={async () => {
              if (await run("ugc", { url }, "已加入模拟创意审核，无现金发放"))
                setUrl("");
            }}
          >
            提交模拟创意申请
          </button>
        </Card>
        <Card>
          <h2>申请记录</h2>
          {s.applications.length ? (
            s.applications.map((a) => (
              <div className="application-row" key={a.id}>
                <span>
                  {a.kind === "ugc"
                    ? "UGC 创意活动"
                    : `D${milestones.find((m) => m.id === a.milestoneId)?.day} 基础基金`}
                </span>
                <b>
                  {a.kind === "ugc"
                    ? "奖励未评定"
                    : `模拟 ${money(a.amountCents)}`}
                </b>
                <small>
                  {
                    {
                      submitted_mock: "模拟已提交 · 等待审核",
                      reviewing_mock: "模拟审核中",
                      approved_mock: "模拟审核通过 · 不发放现金",
                      rejected_mock: "模拟审核未通过",
                    }[a.status]
                  }{" "}
                  · 未真实到账
                </small>
                {["submitted_mock", "reviewing_mock"].includes(a.status) && (
                  <div className="inline-actions">
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() =>
                        void run(
                          "reward_review",
                          { id: a.id, decision: "approve" },
                          "已模拟审核通过，不产生转账",
                        )
                      }
                    >
                      模拟审核通过
                    </button>
                    <button
                      className="text-button"
                      disabled={busy}
                      onClick={() =>
                        void run(
                          "reward_review",
                          { id: a.id, decision: "reject" },
                          "已模拟审核未通过",
                        )
                      }
                    >
                      模拟不通过
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="mini-empty">尚未提交模拟申请。</p>
          )}
        </Card>
      </div>
    </>
  );
}
