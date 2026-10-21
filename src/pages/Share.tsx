import { careScore } from "../domain/care-plan";
import { useState, useEffect } from "react";
import { useGame } from "../store";
import { Pet } from "../components/Pet3D";
import { Heading, Card, Notice } from "../components/UI";
import {
  level,
  qualityScore,
  personality,
  outcomeTitle,
} from "../domain/engine";
import { createPoster, downloadBlob } from "../services/poster";
export function Share() {
  const { state: s, role, run, busy, notify } = useGame();
  useEffect(() => {
    void run("track", { name: "share_open" });
  }, []);
  const [kind, setKind] = useState("出生证明");
  const [format, setFormat] = useState<"3:4" | "9:16" | "wechat">("3:4");
  const [hideName, setHideName] = useState(false);
  const [hideLocation, setHideLocation] = useState(true);
  const [showCouple, setShowCouple] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const p = s.pet;
  const outcome = s.outcomes.find((o) => o.round === s.voteRound);
  const q = p ? qualityScore(p.quality) : 0;
  const summary =
    kind === "出生证明"
      ? "今天起，两个人，一只团子，一起长大。"
      : kind === "出逃通缉令"
        ? "小团子出逃！悬赏：一个抱抱和一份免费基础粮。"
        : kind === "默契报告"
          ? "相似是惊喜，不同也是新的约会灵感。"
          : kind === "性格进化卡"
            ? `长成${personality(s).name}的我，每一种模样都值得被爱。`
            : kind === "30天成长报告"
              ? "把每一份认真照顾，收进我们共同的成长故事。"
              : `我们的共同结局：${outcome ? outcomeTitle(outcome.kind) : "等待揭晓"}`;
  async function generate() {
    if (!p) return;
    setDrawing(true);
    try {
      const blob = await createPoster({
        kind,
        format,
        name: hideName ? "我们的小团子" : p.name,
        city: hideLocation ? "地点已隐藏" : s.couple?.city || "心动小镇",
        day: s.demoDay,
        level: level(p.xp),
        quality: q,
        value: `${careScore(s)} / 100`,
        personality: personality(s).name,
        color: personality(s).color,
        summary,
        couple: showCouple,
        coupleNames: showCouple
          ? s.users.map((u) => u.name).join(" ♡ ")
          : undefined,
      });
      const result = await run("share", {
        kind,
        format,
        hideName,
        hideLocation,
        showCouple,
      });
      if (!result) return;
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(blob));
      downloadBlob(blob, `Jagat-${kind}-${format.replace(":", "x")}.png`);
      notify("PNG 已生成并触发下载；手机也可长按预览图片保存。");
      await run("share_click", { channel: "download" });
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setDrawing(false);
    }
  }
  const blocked =
    kind === "99天秘密结局"
      ? !outcome || s.shareConsent.length < 2 || s.demoDay !== 99
      : kind === "性格进化卡"
        ? s.demoDay < 21
        : kind === "30天成长报告"
          ? s.demoDay < 30
          : kind === "默契报告"
            ? s.challenge?.status !== "completed"
            : false;
  return (
    <>
      <Heading
        eyebrow="KEEP A LITTLE PIECE OF US"
        title="把我们的故事，装进一张卡。"
        description="主动选择再保存，不会自动发布到任何平台。分享点击不等于外部分享成功。"
      />
      {!p ? (
        <Card>
          <p>先共同领养团子，再生成属于你们的纪念。</p>
        </Card>
      ) : (
        <div className="two-col">
          <Card>
            <h2>选择一份纪念</h2>
            <label>
              分享主题
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                {[
                  "出生证明",
                  "出逃通缉令",
                  "默契报告",
                  "性格进化卡",
                  "30天成长报告",
                  "99天秘密结局",
                ].map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
            <label>
              海报比例
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as typeof format)}
              >
                <option value="3:4">3:4 · 小红书海报</option>
                <option value="9:16">9:16 · 故事海报</option>
                <option value="wechat">1:1 · 微信分享图</option>
              </select>
            </label>
            <div className="privacy-options">
              <label>
                <input
                  type="checkbox"
                  checked={hideName}
                  onChange={(e) => setHideName(e.target.checked)}
                />
                隐藏宠物昵称
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={hideLocation}
                  onChange={(e) => setHideLocation(e.target.checked)}
                />
                隐藏出生城市
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={showCouple}
                  onChange={(e) => setShowCouple(e.target.checked)}
                />
                公开双方昵称
              </label>
            </div>
            {kind === "99天秘密结局" && (
              <div className="consent-box">
                <p>
                  结局海报需双方主动同意：我{" "}
                  {s.shareConsent.includes(role) ? "✓" : "○"} · 对方{" "}
                  {s.shareConsent.includes(role === "A" ? "B" : "A")
                    ? "✓"
                    : "○"}
                </p>
                <button
                  className="secondary full"
                  disabled={!outcome || s.shareConsent.includes(role)}
                  onClick={() =>
                    void run("consent", {}, "已记录你的结局分享同意")
                  }
                >
                  我同意公开本轮结局
                </button>
              </div>
            )}
            {blocked && (
              <p className="notice">
                此卡尚未满足条件：默契报告需完成双人挑战、进化卡需D21、成长报告需D30、结局卡需D99完成选择且双方同意。
              </p>
            )}
            <button
              className="primary full"
              disabled={
                drawing || busy || blocked || s.couple?.status !== "bound"
              }
              onClick={() => void generate()}
            >
              {drawing ? "正在绘制原创海报…" : "确认生成并保存图片"}
            </button>
            <p className="description">
              海报展示照护成长，不代表任何现金补贴承诺。未读取私人信件，不展示原始秘密投票。图片导出失败会显示错误并允许重试。
            </p>
          </Card>
          <div className="poster-preview">
            <span className="kicker">JAGAT · 99 DAYS OF LOVE</span>
            <h2>{kind}</h2>
            <Pet size={210} />
            <h3>{hideName ? "我们的小团子" : p.name}</h3>
            <p>
              D{s.demoDay} · {personality(s).name} · Lv.{level(p.xp)}
            </p>
            <p>
              {hideLocation ? "地点已隐藏" : s.couple?.city}
              {showCouple ? ` · ${s.users.map((u) => u.name).join(" ♡ ")}` : ""}
            </p>
            <blockquote>{summary}</blockquote>
            <Notice />
          </div>
        </div>
      )}
      {preview && (
        <Card className="spaced">
          <h3>刚生成的 PNG · 可长按保存</h3>
          <img
            className="generated-poster"
            src={preview}
            alt="生成的分享海报"
          />
        </Card>
      )}
      <Card className="spaced">
        <h3>分享记录</h3>
        <p className="description">
          已生成 {s.artifacts.length}{" "}
          张海报，仅记录生成与下载按钮点击，不声称已发布。
        </p>
        <div className="history-list">
          {s.artifacts
            .slice(-5)
            .reverse()
            .map((a) => (
              <div key={a.id}>
                <span>
                  {a.kind} · {a.format}
                </span>
                <small>{new Date(a.createdAt).toLocaleString("zh-CN")}</small>
              </div>
            ))}
        </div>
      </Card>
    </>
  );
}
