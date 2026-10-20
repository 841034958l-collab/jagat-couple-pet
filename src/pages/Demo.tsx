import { useState } from "react";
import { useGame } from "../store";
import { Heading, Card, Modal } from "../components/UI";
import { story } from "../domain/config";
import { qualityScore, level } from "../domain/engine";
import { mockAds } from "../services/adapters";
export function Demo({ go }: { go: (p: string) => void }) {
  const { state: s, role, run, busy, notify, reset } = useGame();
  const [day, setDay] = useState(s.demoDay);
  const [confirm, setConfirm] = useState(false);
  const [ad, setAd] = useState(false);
  const [adBusy, setAdBusy] = useState(false);
  const count = (n: string) => s.analytics.filter((e) => e.name === n).length;
  const percent = (a: number, b: number) =>
    b ? `${Math.round((a / b) * 100)}%` : "暂无样本";
  const bound = s.couple?.status === "bound";
  const metrics = [
    ["领养次数", count("pet_adopt_complete")],
    [
      "双人绑定率",
      percent(count("couple_bind_success"), count("pet_adopt_start")),
    ],
    ["今日互动", s.events.filter((e) => e.day === s.demoDay).length],
    [
      "双人任务完成率",
      percent(
        count("couple_task_complete"),
        s.submissions.filter((t) => t.task === "challenge").length ||
          count("challenge_start"),
      ),
    ],
    ["宠物成长分布", s.pet ? `Lv.${level(s.pet.xp)} · 本机1只` : "无宠物"],
    [
      "估值/品质分布",
      s.pet ? `Q ${qualityScore(s.pet.quality)} · 本机1只` : "无样本",
    ],
    ["商城点击率", percent(count("shop_item_view"), count("shop_open"))],
    [
      "模拟购买率",
      percent(count("shop_purchase_mock"), count("shop_item_view")),
    ],
    ["分享生成率", percent(count("share_card_generate"), count("share_open"))],
    [
      "里程碑领取率",
      percent(
        s.claimed.length,
        [10, 30, 60, 90, 99].filter((d) => d <= s.demoDay).length,
      ),
    ],
    ["终局投票完成率", percent(Number(s.votes.A) + Number(s.votes.B), 2)],
  ];
  return (
    <>
      <Heading
        eyebrow="DEMO CONTROL ROOM"
        title="一场99天的故事，现在就能体验。"
        description="本地演示数据，不产生真实现金资格。跳转日期不会伪造互动、品质或历史奖励。"
      />
      <div className="demo-links">
        {[
          ["valuation", "✧ 宠物估值"],
          ["calendar", "📆 养宠日历"],
          ["couple", "💌 双人房间"],
          ["house", "🏡 布置小屋"],
          ["rewards", "🎁 成长奖励"],
          ["story", "📖 99天故事"],
          ["share", "🖼 分享海报"],
          ["ending", "🎓 毕业选择"],
        ].map(([id, label]) => (
          <button key={id} onClick={() => go(id)}>
            {label}
          </button>
        ))}
      </div>
      <div className="two-col">
        <Card>
          <h2>快速切换剧情日期</h2>
          <p className="description">
            当前 D{s.demoDay} · 玩家 {role}。仅 Demo
            提供此能力；正式版必须使用服务端自然日。
          </p>
          <label>
            养宠第几天
            <input
              type="number"
              min={1}
              max={99}
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
            />
          </label>
          <button
            className="primary full"
            disabled={
              busy || !bound || !Number.isInteger(day) || day < 1 || day > 99
            }
            onClick={() => void run("day", { day }, `已切换到 D${day}`)}
          >
            切换到 D{day}
          </button>
          <div className="day-shortcuts">
            {story.map((c) => (
              <button
                disabled={busy || !bound}
                className={s.demoDay === c.day ? "selected" : ""}
                onClick={() => {
                  setDay(c.day);
                  void run(
                    "day",
                    { day: c.day },
                    `已切换到 D${c.day}：${c.title}`,
                  );
                }}
                key={c.id}
              >
                D{c.day}
              </button>
            ))}
          </div>
          <p className="notice">
            未绑定不可跳日。同日任务和里程碑不会因切换日期重置。99天周期与连续活跃分别计算。
          </p>
        </Card>
        <Card>
          <h2>演示设置</h2>
          <p className="description">
            此环境没有真实登录、支付、GPS、广告、现金奖励或跨设备同步。旧版 MVP
            数据保存在独立键中，不覆盖。
          </p>
          <button
            className="secondary full"
            disabled={!bound || adBusy}
            onClick={() => setAd(true)}
          >
            观看明确标识的模拟广告
          </button>
          <p className="subtle">
            仅获得星光日记背景，不增加 XP、品质、估值或现金资格。
          </p>
          <button className="danger spaced" onClick={() => setConfirm(true)}>
            重置全部 V3 Demo 数据
          </button>
          <p className="description">
            将清除本机的情侣绑定、私人信件、成长、购买和秘密选择。需再次确认。
          </p>
          <div className="notice">
            正式接入 Adapter：GameAPI / JagatBridge / MapAdapter /
            PaymentAdapter / RewardAdapter / AdAdapter。当前仅 MockGameAPI
            已运行，不提供正式服务端安全保证。
          </div>
        </Card>
      </div>
      <div className="section-heading">
        <h2>本机数据面板</h2>
        <span>单浏览器样本，不代表全站增长数据</span>
      </div>
      <p className="description">
        比率按本机事件次数计算，重复浏览会影响结果；不是独立用户漏斗。真实转化率需服务端去重与归因。
      </p>
      <div className="analytics-grid">
        {metrics.map(([name, value]) => (
          <Card key={String(name)}>
            <span>{name}</span>
            <b>{value}</b>
          </Card>
        ))}
      </div>
      <Card className="spaced">
        <h3>最近事件 · 不含信件正文、照片或精确定位</h3>
        <div className="event-log">
          {s.analytics
            .slice(-25)
            .reverse()
            .map((e) => (
              <div key={e.id}>
                <span>
                  D{e.day} · {e.role}
                </span>
                <code>{e.name}</code>
                <small>
                  {new Date(e.createdAt).toLocaleTimeString("zh-CN")}
                </small>
              </div>
            ))}
        </div>
      </Card>
      {confirm && (
        <Modal title="确认重置本机演示？" onClose={() => setConfirm(false)}>
          <p>本机 V3 数据将永久清除。已下载的海报和旧版 MVP 存档不受影响。</p>
          <button
            className="danger full spaced"
            onClick={async () => {
              await reset();
              setConfirm(false);
              go("home");
            }}
          >
            确认清除并重新开始
          </button>
          <button className="text-button" onClick={() => setConfirm(false)}>
            保留当前故事
          </button>
        </Modal>
      )}
      {ad && (
        <Modal
          title="模拟激励广告 · 非真实广告"
          onClose={() => {
            if (!adBusy) setAd(false);
          }}
        >
          <div className="ad-mock">
            <span>✦</span>
            <h3>团子的星光日记背景</h3>
            <p>演示广告体验，约1.3秒。不接广告 SDK，无真实商家。</p>
          </div>
          <button
            className="primary full"
            disabled={adBusy || busy}
            onClick={async () => {
              setAdBusy(true);
              try {
                const r = await mockAds.showRewardedAd("diary");
                if (
                  r.completed &&
                  (await run(
                    "ad",
                    { placement: "diary" },
                    "模拟装饰已收进背包",
                  ))
                )
                  setAd(false);
              } catch (e) {
                notify((e as Error).message);
              } finally {
                setAdBusy(false);
              }
            }}
          >
            {adBusy ? "模拟播放中…" : "开始模拟观看并领取背景"}
          </button>
        </Modal>
      )}
    </>
  );
}
