import { useMemo, useState } from "react";
import { COLORS, FONT_BODY, numeric } from "../theme";
import { hemicycleDots } from "../lib/hemicycle";

// A half-circle of dots, one dot for each seat in the Commons, grouped by party from left to right. It is a picture of the balance of
// power, not a seating plan. The dots arrive in a sweep from left to right. `parties` is [{ key, colour, count, name }] in the order they
// should appear; point at a party in the key (or tap it) to light up its seats.

export default function Hemicycle({ parties, label, width = 720, replayKey = "" }) {
  const total = parties.reduce((n, p) => n + p.count, 0);
  const rows = total > 400 ? 12 : total > 200 ? 9 : 7;
  const dots = useMemo(() => hemicycleDots(total, rows), [total, rows]);
  const [active, setActive] = useState(null);
  const R = 100;
  const size = useMemo(() => {
    // The gap between neighbouring dots on the outer arc decides how large a dot can be.
    const outer = Math.max(...dots.map((d) => d.r));
    const n = dots.filter((d) => d.r === outer).length;
    return Math.min((Math.PI * outer * R) / n, (R * 0.58) / rows) * 0.42;
  }, [dots, rows]);

  const owners = useMemo(() => parties.flatMap((p) => Array.from({ length: p.count }, () => p.key)), [parties]);
  const colours = useMemo(() => Object.fromEntries(parties.map((p) => [p.key, p.colour])), [parties]);
  const sweep = useMemo(() => parties.map((p) => p.key).join(""), [parties]);

  return (
    <figure style={{ margin: 0 }}>
      <svg key={`${replayKey}${sweep}${total}`} role="img" aria-label={label} viewBox={`${-R - 4} ${-R - 4} ${2 * R + 8} ${R + 12}`} style={{ width: "100%", maxWidth: width, height: "auto", display: "block", margin: "0 auto" }}>
        {dots.map((d, i) => (
          <circle
            key={i}
            className="hemi-dot"
            cx={(d.r * R * Math.cos(d.a)).toFixed(2)}
            cy={(-d.r * R * Math.sin(d.a)).toFixed(2)}
            r={size.toFixed(2)}
            fill={colours[owners[i]] ?? COLORS.hairline}
            style={{ animationDelay: `${((i / total) * 0.9).toFixed(3)}s`, opacity: active && owners[i] !== active ? 0.16 : 1 }}
          />
        ))}
      </svg>
      <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 8px" }}>
        {parties.map((p) => (
          <li key={p.key}>
            <button
              type="button"
              aria-pressed={active === p.key}
              onMouseEnter={() => setActive(p.key)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(p.key)}
              onBlur={() => setActive(null)}
              onClick={() => setActive((a) => (a === p.key ? null : p.key))}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 11px", borderRadius: 999, border: `1px solid ${active === p.key ? p.colour : COLORS.hairline}`, background: active === p.key ? `color-mix(in srgb, ${p.colour} 14%, transparent)` : "transparent", color: COLORS.ink, fontFamily: FONT_BODY, fontSize: 13, cursor: "pointer", transition: "background 0.2s, border-color 0.2s" }}
            >
              <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: "50%", background: p.colour }} />
              {p.name}
              <strong style={{ ...numeric, fontWeight: 700 }}>{p.count}</strong>
            </button>
          </li>
        ))}
      </ul>
    </figure>
  );
}
