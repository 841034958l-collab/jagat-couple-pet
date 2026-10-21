import { useGame } from "../store";
import { Heading, Card, Meter } from "../components/UI";
import { qualityScore, level, personality } from "../domain/engine";
import { careScore, stageName } from "../domain/care-plan";
import { dimensionNames, weights } from "../domain/config";
import type { Quality } from "../domain/models";
export function Valuation() {
  const { state: s } = useGame();
  const p = s.pet!;
  const score = careScore(s);
  return (
    <>
      <Heading
        eyebrow="GROWING WITH CARE"
        title="照护成长报告"
        description="这里记录的是认真照顾与共同成长，不给小动物标价格，也不预测现金回报。"
      />
      <div className="two-col">
        <Card className="valuation-card">
          <span className="kicker">RECENT CARE · 近期照护</span>
          <h2 className="big-value">
            {score}
            <small> / 100</small>
          </h2>
          <p>
            {stageName(s.demoDay)} · {personality(s).name} · Lv.{level(p.xp)}
          </p>
          <Meter label="近期照护成长分" value={score} />
          <p className="description">
            每个完整养宠日结算：喂养+2，随机任务每项+1（最多2）。首个缺席日宽限，连续第二个缺席日起每天−2，下限20。今天未结束不扣分；免费照顾即可恢复。累计XP和已解锁形态不回退。
          </p>
        </Card>
        <Card>
          <h2>变化，慢慢看得见。</h2>
          {[
            [1, "初遇期", "小心翼翼观察你"],
            [8, "熟悉期", "开始追玩具，记住名字"],
            [22, "成长期", "眼神和动作更自在"],
            [50, "自在期", "形成个性与独特动作"],
            [78, "信任期", "主动迎接，准备毕业信"],
          ].map(([day, t, d]) => (
            <div
              key={day}
              className={`stage-row ${s.demoDay >= Number(day) ? "reached" : ""}`}
            >
              <b>
                D{day} · {t}
              </b>
              <span>{d}</span>
            </div>
          ))}
          <p className="subtle">
            3D角色在D21/49/77进化节点改变体型细节、颜色与动作；衣服和配饰可实时展示。
          </p>
        </Card>
      </div>
      <Card className="spaced">
        <h2>照护成长曲线</h2>
        <svg viewBox="0 0 700 180" role="img" aria-label="照护成长分历史曲线">
          <line x1="20" y1="160" x2="680" y2="160" stroke="#ddd" />
          <polyline
            points={Array.from(
              { length: s.demoDay },
              (_, i) =>
                `${20 + (i / Math.max(1, s.demoDay - 1)) * 660},${160 - careScore(s, i + 1) * 1.35}`,
            ).join(" ")}
            fill="none"
            stroke="#cb8fa5"
            strokeWidth="4"
          />
          {s.demoDay === 1 && (
            <circle cx="20" cy={160 - score * 1.35} r="5" fill="#cb8fa5" />
          )}
        </svg>
        <p className="subtle">
          按真实成长事件回算，演示跳日会体现缺席影响，不伪造照顾记录。
        </p>
      </Card>
      <Card className="spaced">
        <h2>五维养育品质 · {qualityScore(p.quality)}分</h2>
        {(Object.keys(weights) as (keyof Quality)[]).map((k) => (
          <Meter
            key={k}
            label={`${dimensionNames[k]} · 权重${weights[k] * 100}%`}
            value={p.quality[k]}
          />
        ))}
        <p className="description">
          免费照顾也能获得完整成长。商城消费、会员和广告不直接提高评分或寄养补贴资格。
        </p>
      </Card>
      <Card className="spaced">
        <h2>寄养补贴 · 独立活动</h2>
        <p>
          99天后可共同选择继续陪伴或回到照护站。补贴预算、档位、名额与审核规则尚未确认；当前只有独立的模拟申请，不代表真实现金发放。
        </p>
        <p className="notice">
          旧版历史数值不会转换成应付款，9.9元演示权益不承诺返现。公益收支与活动补贴分开管理。
        </p>
      </Card>
    </>
  );
}
