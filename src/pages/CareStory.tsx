import { useGame } from "../store";
import { Heading, Card } from "../components/UI";
import { Pet } from "../components/Pet3D";
export function CareStory({
  go,
  replay,
}: {
  go: (p: string) => void;
  replay: () => void;
}) {
  const { state: s, run, busy, demo } = useGame();
  const bound = s.couple?.status === "bound";
  return (
    <>
      <Heading
        eyebrow="JAGAT ANIMAL CARE STATION"
        title="用99天，成为它信任的人。"
        description="这是虚拟动物照护站的故事。每一份认真相处，都能留下一个独特的小习惯。"
      />
      <div className="two-col">
        <Card>
          <div className="shelter-stage">
            <Pet size={260} />
          </div>
          <h2>一只小团子，一段共同生活。</h2>
          <p>
            从躲在玩具后面，到认得你们回家的声音。喂饭、陪玩、一起冒险，慢慢理解一个小生命的需要。
          </p>
          <button className="secondary" onClick={replay}>
            重播动画故事
          </button>
        </Card>
        <Card>
          <span className="pill">演示权益 · 无真实支付</span>
          <h2>99天的新手爸妈体验</h2>
          <p>
            拟议方案：一房一份权益，9.9元体验或Jagat会员权益。另一位不重复开通；当前仅模拟激活，不扣款，也不会自动续费。
          </p>
          {s.carePlan ? (
            <div className="notice">
              ✓ 已模拟激活：
              {s.carePlan.method === "fee_mock"
                ? "9.9元体验方案"
                : "会员体验方案"}
              <br />
              本次没有真实支付或公益转付。
            </div>
          ) : (
            <div className="choice-list">
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
              先建立房间并由另一位接受，再模拟激活体验。未绑定前不启动99天。
            </p>
          )}
          <button
            className="primary spaced"
            onClick={() => go(bound ? "home" : "couple")}
          >
            {bound ? "回到我们的小家" : "创建或接受共同领养邀请"}
          </button>
          <p className="subtle">
            已有游戏不因未激活模拟权益而被锁定；正式支付、退款与会员验证尚未接入。
          </p>
        </Card>
      </div>
      <Card className="spaced">
        <h2>让关心，走向屏幕外。</h2>
        <p>
          我们希望将未来活动领养费用用于流浪动物救助。当前公益合作筹备中，没有真实收款或捐赠；合作机构、金额口径、退款、转付周期和凭证确认后才开放。
        </p>
        <p>会员体验不代表整笔会员费自动捐出。游戏照顾不是现实救助凭证。</p>
        <button className="secondary" onClick={() => go("charity")}>
          公益说明与项目状态 →
        </button>
      </Card>
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
