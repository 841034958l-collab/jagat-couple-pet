import { useEffect, useState } from "react";
import { useGame } from "../store";
import { Card, Heading } from "../components/UI";
const avatars = ["🌷", "🌿", "🌙", "☀️", "🍑", "🦊", "🐼", "🐱"];
export function Profile({ go }: { go: (p: string) => void }) {
  const { me, state: s, saveProfile, busy, roomId } = useGame();
  const [name, setName] = useState(me.name === "新朋友" ? "" : me.name);
  const [avatar, setAvatar] = useState(me.avatar);
  const [city, setCity] = useState(me.city);
  const [bio, setBio] = useState(me.bio);
  useEffect(() => {
    setName(me.name === "新朋友" ? "" : me.name);
    setAvatar(me.avatar);
    setCity(me.city);
    setBio(me.bio);
  }, [me.id]);
  return (
    <>
      <Heading
        eyebrow="A LITTLE SPACE, JUST FOR ME"
        title="我的个人资料"
        description="这里仅展示和编辑你自己的信息。共同养宠的房间中会展示你的昵称和头像。"
      />
      <div className="two-col">
        <Card>
          <div className="profile-hero">
            <span>{avatar}</span>
            <h2>{name || "给自己起个名字"}</h2>
            <p>
              {roomId
                ? s.couple?.status === "bound"
                  ? "已共同养宠"
                  : "已创建房间 · 等待对方"
                : "尚未加入房间"}
            </p>
          </div>
          <label>
            我的昵称
            <input
              value={name}
              maxLength={20}
              onChange={(e) => setName(e.target.value)}
              placeholder="1–20 个字"
            />
          </label>
          <label>选择我的头像</label>
          <div className="avatar-grid">
            {avatars.map((a) => (
              <button
                className={avatar === a ? "selected" : ""}
                aria-label={`头像 ${a}`}
                onClick={() => setAvatar(a)}
                key={a}
              >
                {a}
              </button>
            ))}
          </div>
          <label>
            我的城市（自愿填写，不读取定位）
            <input
              value={city}
              maxLength={30}
              onChange={(e) => setCity(e.target.value)}
            />
          </label>
          <label>
            我的个人简介
            <textarea
              value={bio}
              maxLength={120}
              onChange={(e) => setBio(e.target.value)}
              placeholder="写下一件喜欢的小事…"
            />
          </label>
          <button
            className="primary full"
            disabled={busy || !name.trim()}
            onClick={() => void saveProfile({ name, avatar, city, bio })}
          >
            保存我的资料
          </button>
        </Card>
        <Card>
          <h2>我的养宠入口</h2>
          <p className="description">
            个人资料只属于你；宠物的衣服、配饰、小屋与成长由房间里的两个人共同维护。
          </p>
          <div className="choice-list">
            <button onClick={() => go("couple")}>
              💌 {roomId ? "查看我的双人房间" : "创建房间或接受邀请"}
            </button>
            <button
              disabled={s.couple?.status !== "bound"}
              onClick={() => go("shop")}
            >
              🎀 为我们的团子换装
            </button>
            <button
              disabled={s.couple?.status !== "bound"}
              onClick={() => go("house")}
            >
              🏡 共同布置宠物小屋
            </button>
            <button onClick={() => go("demo")}>
              ✨ 成长日历、奖励与更多功能
            </button>
          </div>
          <p className="notice">
            目前使用独立浏览器会话识别本人。同一浏览器中的多个标签页属于同一个人；不同手机或独立浏览器分别拥有自己的身份。清除Cookie会失去当前身份，需要重新加入；正式账号找回与Jagat登录尚未接入。
          </p>
        </Card>
      </div>
    </>
  );
}
