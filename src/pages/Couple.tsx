import { useEffect, useState } from "react";
import { useGame } from "../store";
import { Heading, Card, Empty } from "../components/UI";
import type { Invitation } from "../services/session-types";
export function Couple({ go }: { go: (p: string) => void }) {
  const {
    state: s,
    me,
    owner,
    run,
    busy,
    notify,
    acceptInvite,
    getInvite,
    renewInvite,
  } = useGame();
  const [confirm, setConfirm] = useState(false);
  const [link, setLink] = useState("");
  const [invite, setInvite] = useState<Invitation | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const token = new URLSearchParams(location.search).get("invite");
  const c = s.couple;
  const other = s.users.find((u) => u.id !== me.id && u.id !== "pending");
  async function load() {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      setInvite(await getInvite(token));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, [token, s.couple?.status]);
  function buildLink(t: string) {
    const url = new URL(location.href);
    url.search = "";
    url.searchParams.set("invite", t);
    url.hash = "couple";
    return url.href;
  }
  async function copy(renew = false) {
    const t = renew ? await renewInvite() : c?.inviteToken;
    if (!t) return;
    const url = buildLink(t);
    setLink(url);
    try {
      await navigator.clipboard.writeText(url);
      notify("邀请链接已复制，发送给另一位即可");
    } catch {
      notify("自动复制不可用，请长按下方链接手动复制");
    }
  }
  return (
    <>
      <Heading
        eyebrow="ONE INVITATION, ONE SHARED HOME"
        title="邀请你，一起养大它。"
        description="一个人创建房间，另一位用自己的设备接受邀请。接受后房间立即成立，开始99天共同养宠。"
      />
      {token && (
        <Card className="invitation-card">
          <span className="invite-envelope">💌</span>
          {loading ? (
            <p className="description">正在读取邀请…</p>
          ) : error ? (
            <>
              <h2>暂时无法读取邀请</h2>
              <p className="description">{error}</p>
              <button className="secondary" onClick={() => void load()}>
                重新加载
              </button>
            </>
          ) : (
            invite && (
              <>
                <h2>
                  {invite.status === "mine"
                    ? "这是你发出的邀请"
                    : `${invite.inviter.avatar} ${invite.inviter.name} 邀请你共同养宠`}
                </h2>
                <p className="description">
                  宠物：{invite.petName} · 出生城市：{invite.city}
                  <br />
                  有效至 {new Date(invite.expiresAt).toLocaleString("zh-CN")}
                </p>
                {invite.status === "available" ? (
                  me.name === "新朋友" ? (
                    <>
                      <p className="notice">
                        先设置你自己的昵称和头像，再回来接受邀请。
                      </p>
                      <button className="primary" onClick={() => go("profile")}>
                        先设置我的资料
                      </button>
                    </>
                  ) : (
                    <button
                      className="primary"
                      disabled={busy || !!c}
                      onClick={async () => {
                        if (await acceptInvite(token)) {
                          history.replaceState(
                            null,
                            "",
                            location.pathname + "#couple",
                          );
                          setInvite(null);
                        }
                      }}
                    >
                      {c
                        ? "你已经在一个房间中，需先解除后再加入"
                        : "接受邀请，一起养宠"}
                    </button>
                  )
                ) : (
                  <p className="notice">
                    {
                      {
                        mine: "不能接受自己的邀请。请将链接发送给另一位，对方在自己的手机或独立浏览器打开。",
                        joined: "你已接受这份邀请，房间已经成立。",
                        expired: "邀请已过期，请让房主生成新的邀请链接。",
                        unavailable: "邀请已失效或房间已被其他人加入。",
                      }[
                        invite.status as Exclude<
                          Invitation["status"],
                          "available"
                        >
                      ]
                    }
                  </p>
                )}
              </>
            )
          )}
        </Card>
      )}
      {!c ? (
        !token && (
          <Empty
            icon="🏡"
            title="还没有共同的小家"
            text="先设置个人资料，再由你或对方创建一个房间。一人只能加入一个房间。"
          >
            <button
              className="primary"
              onClick={() => go(me.name === "新朋友" ? "profile" : "home")}
            >
              {me.name === "新朋友" ? "设置我的资料" : "去创建领养房间"}
            </button>
          </Empty>
        )
      ) : (
        <div className="two-col spaced">
          <Card>
            <span className="kicker">OUR LITTLE FAMILY</span>
            <div className="couple-avatars">
              <span>{me.avatar}</span>
              <span>♡</span>
              <span>{other?.avatar || "✉️"}</span>
            </div>
            <h2>{s.pet?.name}的双人小家</h2>
            <p className="description">
              我：{me.name}
              <br />
              {other ? `共同养宠人：${other.name}` : "共同养宠人：等待接受邀请"}
              <br />
              状态：
              {c.status === "bound"
                ? "房间已成立 · 共同养宠中"
                : "等待对方接受邀请"}
              <br />
              出生城市：{c.city}
            </p>
            <div className="steps">
              <p className="complete">✓ 房主创建房间并发出邀请</p>
              <p className={c.accepted ? "complete" : ""}>
                {c.accepted ? "✓" : "○"} 另一位接受邀请
              </p>
              <p className={c.status === "bound" ? "complete" : ""}>
                {c.status === "bound" ? "✓" : "○"} 房间成立，开始99天养宠
              </p>
            </div>
            {c.status === "inviting" && owner && (
              <>
                <button
                  className="primary full"
                  disabled={busy}
                  onClick={() => void copy()}
                >
                  复制邀请链接
                </button>
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() => void copy(true)}
                >
                  邀请过期或想撤销旧链接？重新生成
                </button>
                <label>
                  可直接发送给对方的邀请链接
                  <input
                    readOnly
                    value={link || buildLink(c.inviteToken)}
                    onFocus={(e) => e.target.select()}
                  />
                </label>
                <p className="description">
                  对方打开链接后，用自己的身份接受即可。你不用再次确认，页面会自动更新房间状态。
                </p>
              </>
            )}
            {c.status === "bound" && (
              <div className="inline-actions">
                <button className="primary" onClick={() => go("home")}>
                  开始照顾我们的团子
                </button>
                <button className="secondary" onClick={() => go("shop")}>
                  一起装扮宠物
                </button>
              </div>
            )}
          </Card>
          <Card>
            <h2>我的房间身份</h2>
            <div className="profile-summary">
              <span>{me.avatar}</span>
              <div>
                <b>{me.name}</b>
                <p>{owner ? "房间创建者" : "受邀共同养宠人"}</p>
              </div>
            </div>
            <p className="description">
              本页只允许你以自己的身份操作。对方需要在自己的设备上提交线索、互动回应和秘密选择，不能在这里切换成对方。
            </p>
            <button className="secondary" onClick={() => go("profile")}>
              编辑我的个人资料
            </button>
            <h3 className="spaced">解除共同养宠</h3>
            <p className="description">
              解除后双方退出当前房间，停止共同互动，并清除房间内私人信件和未揭晓投票。此操作会影响两个人。
            </p>
            {confirm ? (
              <div className="inline-actions">
                <button
                  className="danger"
                  disabled={busy}
                  onClick={async () => {
                    if (await run("unbind", {}, "已解除绑定，双方退出当前房间"))
                      setConfirm(false);
                  }}
                >
                  确认解除房间
                </button>
                <button className="secondary" onClick={() => setConfirm(false)}>
                  取消
                </button>
              </div>
            ) : (
              <button className="text-button" onClick={() => setConfirm(true)}>
                解除当前房间
              </button>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
