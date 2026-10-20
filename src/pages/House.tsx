import { useState, useRef, useEffect } from "react";
import { useGame } from "../store";
import { Pet } from "../components/Pet";
import { Card, Heading } from "../components/UI";
import type { PetHouse } from "../domain/models";
export function House() {
  const { state: s, run, busy } = useGame();
  const [wall, setWall] = useState(s.house.wallpaper);
  const [floor, setFloor] = useState(s.house.floor);
  const [slot, setSlot] = useState<keyof PetHouse["slots"]>("bed");
  const [placing, setPlacing] = useState(false);
  const scene = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setWall(s.house.wallpaper);
    setFloor(s.house.floor);
  }, [s.house.wallpaper, s.house.floor]);
  const colors: Record<string, string> = {
    cream: "#fff0df",
    pink: "#f6e1e8",
    mint: "#e0f0e7",
    lavender: "#e9e2f5",
  };
  const icons: Record<keyof PetHouse["slots"], string[]> = {
    bed: ["🛏️", "🧺"],
    bowl: ["🥣", "🍽️"],
    toy: ["🧸", "🎾"],
    furniture: ["🪴", "📚"],
  };
  return (
    <>
      <Heading
        eyebrow="A SOFT LITTLE PLACE TO CALL HOME"
        title="把小屋，住成我们喜欢的样子。"
        description="免费床、食盆、玩具和家具都可以布置。完成整理任务即可获得环境品质分。"
      />
      <div className="two-col">
        <Card>
          <div
            className={`house-scene ${floor}`}
            style={{ background: colors[wall] }}
            ref={scene}
            onClick={(e) => {
              if (!placing || !scene.current) return;
              const r = scene.current.getBoundingClientRect();
              void run(
                "house",
                {
                  slot,
                  position: {
                    x: ((e.clientX - r.left) / r.width) * 100,
                    y: ((e.clientY - r.top) / r.height) * 100,
                  },
                },
                "家具位置已保存",
              );
              setPlacing(false);
            }}
          >
            <div className="house-window">
              ☀️<span>☁</span>
            </div>
            <div className="house-floor" />
            <div className="house-pet">
              <Pet
                action={s.house.slots.toy === "🧶" ? "pet" : ""}
                size={180}
              />
            </div>
            {Object.entries(s.house.slots).map(([key, icon]) => (
              <button
                aria-label={`选择${key}家具`}
                className={`house-furniture ${slot === key ? "selected" : ""}`}
                style={{
                  left: `${s.house.positions[key].x}%`,
                  top: `${s.house.positions[key].y}%`,
                }}
                key={key}
                onClick={(e) => {
                  if (!placing) {
                    e.stopPropagation();
                    setSlot(key as keyof PetHouse["slots"]);
                  }
                }}
              >
                {icon}
              </button>
            ))}
            {placing && (
              <div className="placing-tip">点击小屋地面，放置选中的家具</div>
            )}
          </div>
          <p className="description">
            当前主题：{s.house.theme === "sakura" ? "🌸 樱花小屋" : "奶油小屋"}{" "}
            · 团子会随玩具开心摇晃
          </p>
          <button
            className="primary full"
            disabled={busy}
            onClick={() =>
              void run(
                "care",
                { kind: "tidy" },
                "整理完成！免费获得环境品质加分",
              )
            }
          >
            🧹 一起整理小屋 · 每日 +10 环境品质
          </button>
        </Card>
        <Card>
          <h2>我们的布置台</h2>
          <label>
            免费墙纸
            <select value={wall} onChange={(e) => setWall(e.target.value)}>
              {[
                ["cream", "奶油白"],
                ["pink", "珊瑚粉"],
                ["mint", "薄荷绿"],
                ["lavender", "浅紫色"],
              ].map(([id, name]) => (
                <option value={id} key={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            免费地板
            <select value={floor} onChange={(e) => setFloor(e.target.value)}>
              {[
                ["wood", "温暖木地板"],
                ["tile", "柔色方砖"],
                ["cloud", "云朵地毯"],
              ].map(([id, name]) => (
                <option value={id} key={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="secondary full"
            disabled={busy}
            onClick={() =>
              void run("house", { wallpaper: wall, floor }, "墙纸和地板已保存")
            }
          >
            保存墙纸与地板
          </button>
          <label>
            选择家具区域
            <select
              value={slot}
              onChange={(e) =>
                setSlot(e.target.value as keyof PetHouse["slots"])
              }
            >
              {[
                ["bed", "宠物床"],
                ["bowl", "食盆"],
                ["toy", "玩具"],
                ["furniture", "家具"],
              ].map(([id, name]) => (
                <option value={id} key={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <div className="inline-actions">
            {icons[slot].map((icon) => (
              <button
                className="furniture-option"
                key={icon}
                disabled={busy}
                onClick={() =>
                  void run("house", { slot, icon }, "免费家具已切换")
                }
              >
                {icon}
              </button>
            ))}
          </div>
          <button
            className="primary full spaced"
            onClick={() => setPlacing((v) => !v)}
          >
            {placing ? "取消摆放" : "移动选中家具：再点击小屋中的位置"}
          </button>
          <p className="description">
            保存后对房间内双方
            共同可见，另一台设备会自动同步。购买家具仅用于外观，不会直接提升品质。
          </p>
        </Card>
      </div>
    </>
  );
}
