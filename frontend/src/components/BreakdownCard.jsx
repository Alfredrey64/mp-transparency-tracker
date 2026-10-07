import { memo, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { COLORS, FONT_BODY, numeric } from "../theme";
import { formatValue } from "../lib/onsFormat";
import { breakdownAt } from "../lib/onsBreakdown";
import { card, cardTitle } from "../lib/onsStyles";

// "Out of every £1": a total split into parts as 100 squares, one for each penny.
// The squares fill in once as the card scrolls into view; hovering or focusing a row
// lights up that part's squares.

const COLOURS = ["#0E9AA7", "#E07A1F", "#7B5BD6", "#D4577A", "#3E7CD9", "#3F9B3F"];
const OTHER = "#8A8FA3";

function BreakdownCard({ spec, series, accent }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [hover, setHover] = useState(null);

  const result = useMemo(() => {
    const byId = Object.fromEntries(Object.entries(series).map(([id, item]) => [id, item.points]));
    return breakdownAt(byId, spec.total, spec.parts);
  }, [series, spec]);
  if (!result) return null;

  const rows = [
    ...result.parts.map((p, i) => ({ key: p.id, label: p.label, value: p.value, pence: p.pence, color: COLOURS[i % COLOURS.length] })),
    { key: "other", label: spec.otherLabel, value: result.other.value, pence: result.other.pence, color: OTHER },
  ];
  // One colour per square, in order: the biggest parts first, as listed.
  const squares = rows.flatMap((r, i) => Array.from({ length: r.pence }, () => i));
  const top = rows.filter((r) => r.key !== "other").sort((a, b) => b.pence - a.pence)[0];

  return (
    <motion.section
      ref={ref}
      id={`s-${spec.id}`}
      className="ons-anchor"
      aria-labelledby={`h-${spec.id}`}
      style={{ ...card, position: "relative", overflow: "hidden", gridColumn: "1 / -1" }}
    >
      <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: `linear-gradient(180deg, ${accent}, ${accent}22)` }} />
      <h2 id={`h-${spec.id}`} style={cardTitle}>{spec.title}</h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.55, color: COLORS.ink, margin: "10px 0 6px", maxWidth: 760 }}>{spec.blurb}</p>
      <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, margin: "0 0 18px" }}>
        In the 12 months to {result.refLabel} the public sector {spec.verb} {formatValue("gbpbn", result.total)} in total, at the prices of the time.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: "22px 36px", alignItems: "center" }}>
        <div
          aria-hidden="true"
          style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 4, width: "100%", maxWidth: 300, margin: "0 auto" }}
          onPointerLeave={() => setHover(null)}
        >
          {squares.map((rowIndex, i) => {
            const dim = hover !== null && hover !== rowIndex;
            return (
              <motion.span
                key={i}
                style={{ aspectRatio: "1", borderRadius: 4, background: rows[rowIndex].color, opacity: dim ? 0.18 : 1, transition: "opacity 0.15s" }}
                initial={reduce ? false : { scale: 0, opacity: 0 }}
                animate={inView || reduce ? { scale: 1, opacity: dim ? 0.18 : 1 } : { scale: 0, opacity: 0 }}
                transition={{ delay: reduce ? 0 : 0.15 + i * 0.008, type: "spring", stiffness: 380, damping: 22 }}
                onPointerEnter={() => setHover(rowIndex)}
              />
            );
          })}
        </div>

        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 2 }}>
          {rows.map((r, i) => (
            <li key={r.key}>
              <div
                tabIndex={0}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                style={{ display: "grid", gridTemplateColumns: "14px 1fr auto", gap: 12, alignItems: "center", padding: "9px 8px", borderRadius: 10, background: hover === i ? `${r.color}1f` : "transparent", transition: "background 0.15s", outlineOffset: -2 }}
              >
                <span aria-hidden="true" style={{ width: 14, height: 14, borderRadius: 4, background: r.color }} />
                <span style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.35, color: COLORS.ink, fontWeight: 600, minWidth: 0 }}>{r.label}</span>
                <span style={{ textAlign: "right" }}>
                  <span style={{ ...numeric, fontSize: 20, fontWeight: 600, color: COLORS.ink }}>{r.pence}p</span>
                  <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>{formatValue("gbpbn", r.value)}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {top && (
        <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "16px 0 0" }}>
          The biggest named part is <strong style={{ color: COLORS.ink }}>{top.label.toLowerCase()}</strong>, at {top.pence}p in every £1.
        </p>
      )}
    </motion.section>
  );
}

export default memo(BreakdownCard);
