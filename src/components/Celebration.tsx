import { useEffect, useRef, useState } from "react";
import { useGame } from "../store";
import { phase } from "../domain/engine";
export function Celebration() {
  const { state: s } = useGame();
  const [message, setMessage] = useState("");
  const previous = useRef({
    claimed: s.claimed.length,
    phase: phase(s.demoDay),
    outcomes: s.outcomes.length,
  });
  useEffect(() => {
    const next = {
      claimed: s.claimed.length,
      phase: phase(s.demoDay),
      outcomes: s.outcomes.length,
    };
    if (next.claimed > previous.current.claimed)
      setMessage("又一起长大了一点点！");
    else if (next.phase > previous.current.phase)
      setMessage("团子长成了新的模样 ✦");
    else if (next.outcomes > previous.current.outcomes)
      setMessage("我们的故事，翻开了新一页。");
    previous.current = next;
  }, [s.claimed.length, s.demoDay, s.outcomes.length]);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 2400);
    return () => clearTimeout(t);
  }, [message]);
  if (!message) return null;
  return (
    <div className="celebration" aria-live="polite">
      <span>{message}</span>
      {Array.from({ length: 18 }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${5 + i * 5}%`,
            animationDelay: `${(i % 5) * 0.08}s`,
            background: ["#F7A8B8", "#CDB7F6", "#A8DEC8", "#F6D889"][i % 4],
          }}
        />
      ))}
    </div>
  );
}
