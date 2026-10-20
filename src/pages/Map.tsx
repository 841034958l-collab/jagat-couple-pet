import { useRef, useState } from "react";
import { Plus, Minus, LocateFixed, ArrowUpRight } from "lucide-react";
import { useGame } from "../store";
import { locations } from "../domain/config";
import { Heading, Card, Modal } from "../components/UI";
import { MapArt } from "../components/MapArt";
import { Pet } from "../components/Pet";
export function Map({ go }: { go: (p: string) => void }) {
  const { state: s, role, me, run, busy, notify } = useGame();
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [success, setSuccess] = useState(false);
  const pointers = useRef(
    new globalThis.Map<number, { x: number; y: number }>(),
  );
  const origin = useRef({ x: 0, y: 0 });
  const last = useRef({ x: 0, y: 0, d: 0 });
  const moved = useRef(false);
  const dist = () => {
    const p = [...pointers.current.values()];
    return p.length === 2 ? Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) : 0;
  };
  const adventure = s.adventure?.status === "active";
  async function visit(id: string) {
    if (moved.current) return;
    const result = await run("location", { id });
    if (!result) return;
    if (adventure) {
      if (result.adventure?.status === "completed") setSuccess(true);
      else notify("这里只有一串脚印…把两份线索拼起来再找找！");
    } else
      notify(
        `已到达${locations.find((l) => l.id === id)?.name}，团子记住了这个地方。`,
      );
  }
  return (
    <>
      <Heading
        eyebrow="TWO CLUES, ONE LITTLE ADVENTURE"
        title="下一站，找到你。"
        description="6个虚拟地点，藏着我们的小日子。不读取 GPS，也不会公开真实位置。"
      />
      <div className="map-layout">
        <div className="map-container">
          <div className="map-title">
            <b>⌖ {s.couple?.city || "心动小镇"}</b>
            <small>拖动探索 · 双指 / 滚轮缩放</small>
          </div>
          <div
            className="map-viewport"
            onWheel={(e) =>
              setScale((v) =>
                Math.max(0.7, Math.min(2.4, v - e.deltaY * 0.001)),
              )
            }
            onPointerDown={(e) => {
              if (!(e.target as Element).closest("button"))
                e.currentTarget.setPointerCapture(e.pointerId);
              pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
              origin.current = { x: e.clientX, y: e.clientY };
              last.current = { x: e.clientX, y: e.clientY, d: dist() };
              moved.current = false;
            }}
            onPointerMove={(e) => {
              if (!pointers.current.has(e.pointerId)) return;
              pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
              if (
                Math.hypot(
                  e.clientX - origin.current.x,
                  e.clientY - origin.current.y,
                ) > 6
              )
                moved.current = true;
              if (pointers.current.size === 2) {
                const d = dist();
                const ratio = last.current.d ? d / last.current.d : 1;
                if (last.current.d)
                  setScale((v) => Math.max(0.7, Math.min(2.4, v * ratio)));
                last.current = { x: e.clientX, y: e.clientY, d };
              } else {
                const dx = e.clientX - last.current.x;
                const dy = e.clientY - last.current.y;
                setPan((v) => ({
                  x: Math.max(-350, Math.min(350, v.x + dx)),
                  y: Math.max(-350, Math.min(350, v.y + dy)),
                }));
                last.current = { x: e.clientX, y: e.clientY, d: 0 };
              }
            }}
            onPointerUp={(e) => {
              pointers.current.delete(e.pointerId);
              const p = [...pointers.current.values()][0];
              if (p) last.current = { ...p, d: 0 };
            }}
            onPointerCancel={() => pointers.current.clear()}
          >
            <div
              className="map-world"
              style={{
                transform: `translate(${pan.x}px,${pan.y}px) scale(${scale})`,
              }}
            >
              <MapArt />
              {locations.map((l) => (
                <button
                  key={l.id}
                  className={`location ${l.unlock > s.demoDay ? "locked" : ""}`}
                  style={{ left: `${l.x}%`, top: `${l.y}%` }}
                  onClick={() =>
                    l.unlock > s.demoDay
                      ? notify(`D${l.unlock} 解锁${l.name}`)
                      : void visit(l.id)
                  }
                >
                  <span>{l.unlock > s.demoDay ? "🔒" : l.icon}</span>
                  <b>{l.name}</b>
                  {l.unlock > s.demoDay && <small>D{l.unlock}</small>}
                </button>
              ))}
              <div
                className={`pet-map-marker ${adventure ? "searching" : ""}`}
                style={{
                  left: `${adventure ? 45 : (locations.find((l) => l.id === s.pet?.position)?.x ?? 45)}%`,
                  top: `${adventure ? 50 : (locations.find((l) => l.id === s.pet?.position)?.y ?? 49)}%`,
                }}
              >
                🐾{adventure ? "等你找到我" : s.pet?.name}
              </div>
              {s.diaries.filter((d) => !d.hidden).length > 0 && (
                <div className="memory-pin" style={{ left: "67%", top: "83%" }}>
                  📍 {s.diaries.filter((d) => !d.hidden).length} 段回忆
                </div>
              )}
            </div>
          </div>
          <div className="map-controls">
            <button
              aria-label="放大地图"
              onClick={() => setScale((v) => Math.min(2.4, v + 0.2))}
            >
              <Plus size={18} />
            </button>
            <button
              aria-label="缩小地图"
              onClick={() => setScale((v) => Math.max(0.7, v - 0.2))}
            >
              <Minus size={18} />
            </button>
            <button
              aria-label="地图复位"
              onClick={() => {
                setScale(1);
                setPan({ x: 0, y: 0 });
              }}
            >
              <LocateFixed size={18} />
            </button>
          </div>
          <span className="map-legend">● 虚拟小镇 · 无真实定位</span>
        </div>
        <Card className="clue-panel">
          <span className="kicker">CO-OP PET RESCUE</span>
          <h2>{adventure ? "寻团子小分队，集合！" : "团子的出逃计划"}</h2>
          <p className="description">
            各看一份专属线索，双方查看后再点击地点寻找。每天成功一次，+20 XP。
          </p>
          <p className="pill">{me.avatar} 这是你的专属线索，需要和对方交流</p>
          {adventure ? (
            <>
              <div className="clue">
                <span>✉ 我的专属线索</span>
                {s.adventure?.clue ? (
                  <p>{s.adventure.clue}</p>
                ) : (
                  <button
                    className="secondary full"
                    disabled={busy}
                    onClick={() => void run("clue")}
                  >
                    打开我的线索
                  </button>
                )}
              </div>
              <p className="description">
                我 {s.adventure?.seen.includes(role) ? "✓ 已查看" : "○ 未查看"}{" "}
                · 对方{" "}
                {s.adventure?.seen.includes(role === "A" ? "B" : "A")
                  ? "✓ 已查看"
                  : "○ 未查看"}
                <br />
                已经找过 {s.adventure?.attempts} 次，找错也没关系。
              </p>
              <button className="primary full" onClick={() => go("share")}>
                生成出逃通缉令 <ArrowUpRight size={17} />
              </button>
            </>
          ) : (
            <button
              className="primary full"
              disabled={busy}
              onClick={() =>
                void run(
                  "adventure_start",
                  {},
                  "团子出门啦，请和对方分别查看线索",
                )
              }
            >
              开启地图寻宠 <ArrowUpRight size={17} />
            </button>
          )}
          <div className="quick-locations">
            <button onClick={() => go("house")}>🏡 布置爱心小屋</button>
            <button onClick={() => go("interact")}>☕ 抽取双人约会</button>
            <button disabled={s.demoDay < 90} onClick={() => go("ending")}>
              🗼 D99 星光毕业
            </button>
          </div>
        </Card>
      </div>
      <Card
        className={`spaced ${s.inventory.some((i) => i.itemId === "diary-bg") ? "star-diary" : ""}`}
      >
        <h3>地图回忆册</h3>
        {s.diaries.length ? (
          s.diaries.map((d) => (
            <div className="diary-row" key={d.id}>
              <span>📖 D{d.day}</span>
              <p>{d.hidden ? "这段私人回忆已隐藏" : d.text}</p>
              <button
                className="text-button"
                onClick={() => void run("diary_hide", { id: d.id })}
              >
                {d.hidden ? "恢复" : "隐藏"}
              </button>
            </div>
          ))
        ) : (
          <p className="description">
            找回一次团子或完成双人约会，就会留下第一段回忆。
          </p>
        )}
      </Card>
      {success && (
        <Modal title="找到一只小淘气！" onClose={() => setSuccess(false)}>
          <div className="center">
            <Pet />
            <p className="description">
              「我才没有迷路，只是想看你们一起找我的样子。」
            </p>
            <span className="reward-pill">✦ 成长 +20 XP · 双人羁绊 +10</span>
          </div>
          <button className="primary full" onClick={() => setSuccess(false)}>
            接团子回家
          </button>
          <button
            className="text-button"
            onClick={() => {
              setSuccess(false);
              go("share");
            }}
          >
            制作纪念分享卡
          </button>
        </Modal>
      )}
    </>
  );
}
