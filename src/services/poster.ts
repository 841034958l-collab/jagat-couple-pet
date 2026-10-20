export type PosterData = {
  kind: string;
  format: "3:4" | "9:16" | "wechat";
  name: string;
  city: string;
  day: number;
  level: number;
  quality: number;
  value: string;
  personality: string;
  color: string;
  summary: string;
  couple: boolean;
  coupleNames?: string;
};
function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  max: number,
  line = 45,
) {
  let row = "";
  for (const char of text) {
    if (ctx.measureText(row + char).width > max) {
      ctx.fillText(row, x, y);
      row = char;
      y += line;
    } else row += char;
  }
  ctx.fillText(row, x, y);
  return y;
}
/** Entirely local; no images, private letters, vote contents or remote fonts are loaded. */
export async function createPoster(d: PosterData): Promise<Blob> {
  const c = document.createElement("canvas");
  c.width = 900;
  c.height = d.format === "9:16" ? 1600 : d.format === "wechat" ? 900 : 1200;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("浏览器不支持图片绘制，请更新浏览器后重试");
  const h = c.height;
  const g = ctx.createLinearGradient(0, 0, 900, h);
  g.addColorStop(0, "#fff9f3");
  g.addColorStop(1, "#f3e0ed");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 900, h);
  ctx.strokeStyle = "#dcbbcd";
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, 840, h - 60);
  ctx.textAlign = "center";
  ctx.fillStyle = "#aa809a";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText("jagat · 99天养宠计划", 450, 105);
  ctx.font = "bold 54px sans-serif";
  ctx.fillStyle = "#76566e";
  ctx.fillText(d.kind, 450, 200);
  const cy = d.format === "wechat" ? 365 : d.format === "9:16" ? 570 : 430;
  ctx.fillStyle = d.color;
  ctx.strokeStyle = "#a77c95";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(290, cy - 60);
  ctx.lineTo(280, cy - 180);
  ctx.quadraticCurveTo(290, cy - 210, 340, cy - 140);
  ctx.quadraticCurveTo(450, cy - 190, 560, cy - 140);
  ctx.quadraticCurveTo(620, cy - 210, 620, cy - 160);
  ctx.lineTo(610, cy - 40);
  ctx.bezierCurveTo(680, cy + 140, 560, cy + 180, 450, cy + 180);
  ctx.bezierCurveTo(290, cy + 180, 240, cy + 100, 290, cy - 60);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#715368";
  for (const x of [390, 510]) {
    ctx.beginPath();
    ctx.ellipse(x, cy + 10, 15, 21, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff9f3";
    ctx.beginPath();
    ctx.arc(x + 4, cy + 3, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#715368";
  }
  ctx.fillStyle = "#e398ad";
  for (const x of [350, 550]) {
    ctx.beginPath();
    ctx.ellipse(x, cy + 54, 24, 13, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#95657d";
  ctx.font = "40px sans-serif";
  ctx.fillText("ω", 450, cy + 70);
  let y = cy + 260;
  ctx.fillStyle = "#795d73";
  ctx.font = "bold 39px sans-serif";
  ctx.fillText(d.name, 450, y);
  ctx.font = "24px sans-serif";
  y += 55;
  ctx.fillText(`DAY ${d.day} · Lv.${d.level} · ${d.personality}`, 450, y);
  if (d.format !== "wechat") {
    y += 48;
    ctx.font = "22px sans-serif";
    ctx.fillText(
      d.city + (d.couple ? ` · ${d.coupleNames || "共同养宠的我们"}` : ""),
      450,
      y,
    );
  }
  ctx.font = "25px sans-serif";
  y = wrap(ctx, d.summary, 450, y + 60, 720, 40);
  if (d.kind === "99天秘密结局" || d.kind === "30天成长报告") {
    ctx.font = "22px sans-serif";
    ctx.fillText(
      `养育品质 ${d.quality} · 模拟估值 ${d.value}`,
      450,
      Math.min(y + 60, h - 140),
    );
  }
  ctx.font = "18px sans-serif";
  ctx.fillStyle = "#b08fa5";
  ctx.fillText("游戏内模拟估值，不代表 Jagat 真实现金收购承诺。", 450, h - 80);
  ctx.font = "17px sans-serif";
  ctx.fillText("一起养大的，从来不只是一只团子。", 450, h - 48);
  return new Promise((resolve, reject) => {
    try {
      c.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("图片导出失败，请重试或更换浏览器")),
        "image/png",
      );
    } catch {
      reject(new Error("图片导出失败，请使用浏览器截图或重试"));
    }
  });
}
export function downloadBlob(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
