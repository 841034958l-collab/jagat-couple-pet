import { useState, useEffect } from "react";
import { useGame } from "../store";
import { Heading, Card, Empty } from "../components/UI";
export function Couple({ go }: { go: (p: string) => void }) {
  const { state: s, role, setRole, run, busy, notify } = useGame();
  const [confirm, setConfirm] = useState(false);
  const c = s.couple;
  const [token, setToken] = useState("");
  useEffect(() => {
    const t = new URLSearchParams(location.search).get("invite");
    if (t) {
      setToken(t);
      void run("invite_open");
    }
  }, []);
  async function copy() {
    if (!c) return;
    const result = await run("invite_create");
    if (!result?.couple) return;
    const url = new URL(location.href);
    url.search = "";
    url.searchParams.set("invite", result.couple.inviteToken);
    url.searchParams.set("source", "couple-card");
    url.hash = "couple";
    try {
      await navigator.clipboard.writeText(url.href);
      notify("邀请链接已复制。Demo 仅同浏览器存档可接受，不支持远程绑定。");
    } catch {
      setToken(url.href);
      notify("无法自动复制，请手动复制下方邀请链接。");
    }
  }
  return (
    <>
      <Heading
        eyebrow="A HOME NEEDS TWO HEARTS"
        title="两个人，才是我们的家。"
        description="Demo 支持同设备 A / B 轮流体验，邀请链接不提供跨设备数据同步。"
      />
      {!c ? (
        <Empty
          icon="💌"
          title="还没有领养房间"
          text="由 A 创建房间，B 接受邀请，再由 A 确认共同领养。"
        >
          <button className="primary" onClick={() => go("home")}>
            返回首页领养
          </button>
        </Empty>
      ) : (
        <div className="two-col">
          <Card>
            <span className="kicker">OUR LITTLE FAMILY</span>
            <div className="couple-avatars">
              👩🏻 <span>♡</span> 👦🏻
            </div>
            <h2>{s.pet?.name}的双人小家</h2>
            <p className="description">
              出生城市：{c.city}
              <br />
              状态：
              {
                {
                  inviting: "等待 B 接受",
                  confirming: "等待 A 确认",
                  bound: "已共同领养",
                  unbound: "已解除绑定",
                }[c.status]
              }
            </p>
            <div className="steps">
              <p className="complete">✓ A 创建房间</p>
              <p className={c.accepted ? "complete" : ""}>
                {c.accepted ? "✓" : "○"} B 接受共同领养
              </p>
              <p className={c.confirmed ? "complete" : ""}>
                {c.confirmed ? "✓" : "○"} A 最终确认 · 启动99天
              </p>
            </div>
            {c.status === "inviting" && (
              <>
                <button
                  className="secondary full"
                  disabled={busy || role !== "A"}
                  onClick={() => void copy()}
                >
                  生成 / 复制邀请链接
                </button>
                <p className="subtle">
                  有效至 {new Date(c.expiresAt).toLocaleString("zh-CN")}
                  （24小时）
                </p>
                <button
                  className="primary full"
                  disabled={busy || role !== "B"}
                  onClick={() =>
                    void run(
                      "accept",
                      {
                        token: token.startsWith("http")
                          ? undefined
                          : token || c.inviteToken,
                      },
                      "B 已接受，请切换 A 确认",
                    )
                  }
                >
                  我是 B，接受邀请
                </button>
              </>
            )}
            {c.status === "confirming" && (
              <button
                className="primary full"
                disabled={busy || role !== "A"}
                onClick={() =>
                  void run("bind", {}, "共同领养完成！D1 正式开始")
                }
              >
                我是 A，确认共同领养
              </button>
            )}
            {c.status === "bound" && (
              <button className="primary full" onClick={() => go("home")}>
                回家照顾团子
              </button>
            )}
          </Card>
          <Card>
            <h2>切换玩家</h2>
            <p className="description">
              当前为玩家 {role}。两个人看到不同线索、各自信件与各自的投票状态。
            </p>
            <div className="role-tabs">
              {(["A", "B"] as const).map((r) => (
                <button
                  className={role === r ? "selected" : ""}
                  onClick={() => setRole(r)}
                  key={r}
                >
                  {r === "A" ? "👩🏻" : "👦🏻"} 玩家 {r}
                </button>
              ))}
            </div>
            {token && (
              <label>
                邀请信息
                <input readOnly value={token} />
              </label>
            )}
            <div className="notice">
              这是本地模拟。存档中包含双方数据，切换角色不构成真实身份验证；正式版需服务端权限控制。
            </div>
            <h3>解除绑定与数据</h3>
            <p className="description">
              解除后停止互动，清除私人信件、偏好与未揭晓投票，保留成长事件和纪念日记供本机回看。可在
              Demo 面板彻底清除 V3 存档。
            </p>
            {confirm ? (
              <div className="inline-actions">
                <button
                  className="danger"
                  onClick={async () => {
                    if (await run("unbind", {}, "已解除绑定，私人信件已清除"))
                      setConfirm(false);
                  }}
                >
                  确认解除
                </button>
                <button className="secondary" onClick={() => setConfirm(false)}>
                  取消
                </button>
              </div>
            ) : (
              <button
                className="text-button"
                disabled={c.status === "unbound"}
                onClick={() => setConfirm(true)}
              >
                解除当前绑定
              </button>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
