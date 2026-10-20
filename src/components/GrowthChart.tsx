import { useGame } from "../store";
export function GrowthChart() {
  const { state: s } = useGame();
  const days = Array.from({ length: s.demoDay }, (_, i) => ({
    day: i + 1,
    xp: s.events
      .filter((e) => e.day <= i + 1)
      .reduce((sum, e) => sum + e.xp, 0),
  }));
  const max = Math.max(100, ...days.map((d) => d.xp));
  const points = days
    .map(
      (d, i) =>
        `${25 + (i / Math.max(1, days.length - 1)) * 650},${165 - (d.xp / max) * 130}`,
    )
    .join(" ");
  return (
    <div className="growth-chart">
      <h3>99天成长 XP 曲线</h3>
      <p className="description">累计已记录的成长事件，空白日不补发 XP。</p>
      <svg
        viewBox="0 0 700 205"
        className="chart"
        role="img"
        aria-label="成长XP曲线"
      >
        <path
          d="M25 35H675M25 100H675M25 165H675"
          stroke="#e9dce7"
          strokeDasharray="5 5"
        />
        <polyline
          points={points}
          stroke="#b59bc9"
          strokeWidth="3"
          fill="none"
        />
        <text x="25" y="20" fontSize="10" fill="#b49bac">
          {max} XP
        </text>
        <text x="25" y="195" fontSize="11" fill="#b49bac">
          D1
        </text>
        <text x="650" y="195" fontSize="11" fill="#b49bac">
          D{s.demoDay}
        </text>
      </svg>
    </div>
  );
}
