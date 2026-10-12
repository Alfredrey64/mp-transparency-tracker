import { useMemo } from "react";
import { COLORS } from "../theme";
import { hemicycleDots } from "../lib/hemicycle";

// A half-circle of dots, one dot for each seat in the Commons, grouped by party from left to right. It is a picture of the balance of
// power, not a seating plan. `parties` is [{ key, colour, count, label }] in the order they should appear.

export default function Hemicycle({ parties, label, width = 720 }) {
  const total = parties.reduce((n, p) => n + p.count, 0);
  const rows = total > 400 ? 12 : total > 200 ? 9 : 7;
  const dots = useMemo(() => hemicycleDots(total, rows), [total, rows]);
  const R = 100;
  const size = useMemo(() => {
    // The gap between neighbouring dots on the outer arc decides how large a dot can be.
    const outer = Math.max(...dots.map((d) => d.r));
    const n = dots.filter((d) => d.r === outer).length;
    return Math.min((Math.PI * outer * R) / n, (R * 0.58) / rows) * 0.42;
  }, [dots, rows]);

  const fills = [];
  parties.forEach((p) => { for (let i = 0; i < p.count; i++) fills.push(p.colour); });

  return (
    <figure style={{ margin: 0 }}>
      <svg role="img" aria-label={label} viewBox={`${-R - 4} ${-R - 4} ${2 * R + 8} ${R + 12}`} style={{ width: "100%", maxWidth: width, height: "auto", display: "block", margin: "0 auto" }}>
        {dots.map((d, i) => (
          <circle key={i} cx={(d.r * R * Math.cos(d.a)).toFixed(2)} cy={(-d.r * R * Math.sin(d.a)).toFixed(2)} r={size.toFixed(2)} fill={fills[i] ?? COLORS.hairline} />
        ))}
      </svg>
    </figure>
  );
}
