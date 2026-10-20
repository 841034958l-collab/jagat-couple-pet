import { useGame } from "../store";
import { personality, phase } from "../domain/engine";
import { personalities } from "../domain/config";
export function Pet({
  action = "",
  size = 220,
}: {
  action?: string;
  size?: number;
}) {
  const { state } = useGame();
  const p = state.pet;
  const shape = phase(state.demoDay);
  const color = p
    ? shape
      ? personality(state).color
      : personalities[p.birthColor].color
    : "#F7A8B8";
  const sleep = p?.mood === "sleeping";
  return (
    <div
      className={`pet-illustration ${action || p?.mood || "happy"} evolution-${shape}`}
      style={{ width: size }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 260 250"
        role="img"
        aria-label={`恋爱团子 ${p?.name || "等待领养"} ${sleep ? "睡觉中" : "开心"}`}
      >
        <defs>
          <radialGradient id="pet-body">
            <stop stopColor="#fff8f2" />
            <stop offset="1" stopColor={color} />
          </radialGradient>
        </defs>
        <ellipse
          cx="130"
          cy="225"
          rx="78"
          ry="11"
          fill="#b39c9b"
          opacity=".14"
        />
        {shape > 0 && (
          <g fill="#e6bd6d">
            <path d="M46 63l4-12 4 12 12 4-12 4-4 12-4-12-12-4z" />
            <path d="M212 103l3-9 3 9 9 3-9 3-3 9-3-9-9-3z" />
          </g>
        )}
        {state.inventory.some((i) => i.itemId === "final-form") && (
          <path
            d="M104 30l10-16 16 12 16-12 10 16z"
            fill="#e7bf73"
            stroke="#cba25c"
            strokeWidth="2"
          />
        )}
        <g className="pet-body">
          <path
            d="M66 99L62 42Q65 29 78 40L108 66M155 67L183 40Q196 29 199 44L194 101"
            fill={color}
            stroke="#946b77"
            strokeWidth="2.5"
          />
          <path d="M74 49l6 33 17-10m86-23-7 33-16-10" fill="#efb6bf" />
          <path
            d="M52 141Q50 72 130 66Q208 70 209 141Q214 215 131 220Q49 215 52 141"
            fill="url(#pet-body)"
            stroke="#946b77"
            strokeWidth="2.5"
          />
          <ellipse
            cx="60"
            cy="168"
            rx="15"
            ry="23"
            fill={color}
            transform="rotate(25 60 168)"
          />
          <ellipse
            cx="201"
            cy="167"
            rx="15"
            ry="23"
            fill={color}
            transform="rotate(-25 201 167)"
          />
          <ellipse cx="95" cy="216" rx="21" ry="11" fill={color} />
          <ellipse cx="163" cy="216" rx="21" ry="11" fill={color} />
          {sleep ? (
            <g
              fill="none"
              stroke="#795560"
              strokeWidth="4"
              strokeLinecap="round"
            >
              <path d="M86 131q10 10 20 0m48 0q10 10 20 0" />
            </g>
          ) : (
            <g>
              <ellipse cx="96" cy="127" rx="11" ry="14" fill="#644e5c" />
              <ellipse cx="164" cy="127" rx="11" ry="14" fill="#644e5c" />
              <circle cx="99" cy="122" r="4" fill="white" />
              <circle cx="167" cy="122" r="4" fill="white" />
            </g>
          )}
          <ellipse
            cx="80"
            cy="151"
            rx="15"
            ry="8"
            fill="#f09dac"
            opacity=".65"
          />
          <ellipse
            cx="181"
            cy="151"
            rx="15"
            ry="8"
            fill="#f09dac"
            opacity=".65"
          />
          <path d="M121 146q9-6 18 0l-9 7z" fill="#ac7381" />
          <path
            d="M130 152q-4 12-13 6m13-6q4 12 13 6"
            fill="none"
            stroke="#946b77"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {state.outfit.clothing && (
            <path
              d="M70 176q60 30 120 0l-3 27q-57 23-114 0z"
              fill={state.outfit.clothing === "grad" ? "#9e8bcc" : "#88bbae"}
            />
          )}
          <path d="M117 190q13-15 26 0-13 19-26 0" fill="#e39aab" />
          {state.outfit.accessory && (
            <g transform="translate(183 83)">
              <path d="M0 0l-23-11v24l23-9 22 10v-27z" fill="#cb759c" />
              <circle r="6" fill="#e8a7bd" />
            </g>
          )}
          {state.outfit.hat && (
            <g>
              <path d="M86 73q45-54 89 0" fill="#c1ac76" />
              <ellipse cx="130" cy="74" rx="61" ry="9" fill="#d8c493" />
              <path d="M102 58h57" stroke="#987d6b" strokeWidth="8" />
            </g>
          )}
        </g>
        {sleep && (
          <text x="205" y="62" fill="#b599bf" fontSize="22">
            z Z
          </text>
        )}
      </svg>
      {action === "feed" && <span className="pet-food">🥣</span>}
      {action === "pet" && <span className="pet-heart">♡</span>}
    </div>
  );
}
