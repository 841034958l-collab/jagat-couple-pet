import { useState } from "react";
import { useGame } from "../store";
import { Heading, Card, Modal } from "../components/UI";
import { story } from "../domain/config";
import { mockAds } from "../services/adapters";
export function Demo({ go }: { go: (p: string) => void }) {
  const { state: s, me, owner, demo, run, busy, notify } = useGame();
  const [day, setDay] = useState(s.demoDay);
  const [ad, setAd] = useState(false);
  const [adBusy, setAdBusy] = useState(false);
  const bound = s.couple?.status === "bound";
  return (
    <>
      <Heading
        eyebrow="MORE LITTLE THINGS TO DO TOGETHER"
        title="我们的小世界，还有这些。"
        description="个人身份与你的设备绑定，宠物和小屋由房间里的两个人共同照顾。"
      />
      <div className="demo-links">
        {[
          ["profile", "🌷 我的个人资料"],
          ["couple", "💌 我的双人房间"],
          ["valuation", "✧ 宠物估值"],
          ["calendar", "📆 养宠日历"],
          ["house", "🏡 共同布置小屋"],
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
          <h2>我的互动记录</h2>
          <p className="description">
            {me.avatar} {me.name} · 今天完成{" "}
            {
              s.events.filter(
                (e) =>
                  e.day === s.demoDay &&
                  e.role === s.users.find((u) => u.id === me.id)?.role,
              ).length
            }{" "}
            次成长事件
          </p>
          <div className="event-log">
            {s.analytics
              .slice(-15)
              .reverse()
              .map((e) => (
                <div key={e.id}>
                  <span>D{e.day}</span>
                  <code>{e.name}</code>
                  <small>
                    {new Date(e.createdAt).toLocaleTimeString("zh-CN")}
                  </small>
                </div>
              ))}
          </div>
          {!s.analytics.length && (
            <p className="mini-empty">尚未留下互动记录。</p>
          )}
        </Card>
        <Card>
          <h2>关于这个体验</h2>
          <p className="description">
            共享房间、个人资料、邀请与宠物装扮已连接服务端，另一台设备会自动同步。支付、基金审核和广告仍为模拟，不产生真实支付或现金发放。
          </p>
          <button
            className="secondary"
            disabled={!bound || !demo}
            onClick={() => setAd(true)}
          >
            观看明确标识的模拟广告
          </button>
          <p className="subtle">仅获得日记装饰，不改变现金奖励资格。</p>
        </Card>
      </div>
      {demo && (
        <Card className="spaced">
          <h2>房主专用 · 剧情演示日期</h2>
          <p className="description">
            当前D{s.demoDay}
            。只有房主可调整共享演示日期，双方进度会一起变化；这不会补发未完成的任务。
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
            className="primary"
            disabled={
              !owner ||
              !bound ||
              busy ||
              day < 1 ||
              day > 99 ||
              !Number.isInteger(day)
            }
            onClick={() =>
              void run("day", { day }, `房间演示日期已调整到D${day}`)
            }
          >
            调整演示日期
          </button>
          <div className="day-shortcuts">
            {story.map((c) => (
              <button
                disabled={!owner || !bound || busy}
                key={c.id}
                onClick={() => {
                  setDay(c.day);
                  void run("day", { day: c.day });
                }}
              >
                D{c.day}
              </button>
            ))}
          </div>
        </Card>
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
            <p>演示播放，不接入真实广告。</p>
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
                    "模拟装饰已加入共同背包",
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
