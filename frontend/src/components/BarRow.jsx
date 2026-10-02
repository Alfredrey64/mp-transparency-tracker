import { motion, useReducedMotion } from "framer-motion";
import { COLORS, FONT_BODY, numeric } from "../theme";

// One row of a horizontal bar chart: a label, a thin bar with a rounded
// data end that grows in when it scrolls into view, and the value set in the
// numeric typeface beside it. `tick` draws a dashed marker at that fraction
// of the track. Label and value columns have fixed widths, so every row in
// a chart has a track of exactly the same length: bars are comparable by eye.
export default function BarRow({ label, color, fraction, valueText, detail, tick, labelWidth = 170, valueWidth = 120, delay = 0 }) {
  const reduce = useReducedMotion();
  const width = `${Math.max(0, Math.min(1, fraction)) * 100}%`;
  return (
    <div
      role="img"
      aria-label={`${label}: ${valueText}${detail ? `, ${detail}` : ""}`}
      title={`${label}: ${valueText}${detail ? ` (${detail})` : ""}`}
      style={{ display: "grid", gridTemplateColumns: `minmax(90px, ${labelWidth}px) minmax(0, 1fr) ${valueWidth}px`, alignItems: "center", gap: 12, padding: "5px 0" }}
    >
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
      <div style={{ position: "relative", height: 10, background: COLORS.paperCard, borderRadius: 4 }}>
        <motion.div
          initial={reduce ? false : { width: 0 }}
          whileInView={{ width }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
          style={{ minWidth: fraction > 0 ? 3 : 0, height: "100%", background: color, borderRadius: "0 4px 4px 0" }}
        />
        {tick != null && <div style={{ position: "absolute", left: `${tick * 100}%`, top: -4, bottom: -4, borderLeft: `1.5px dashed ${COLORS.inkSoft}`, opacity: 0.7 }} />}
      </div>
      <div style={{ ...numeric, fontSize: 14, fontWeight: 600, color: COLORS.ink, textAlign: "right", whiteSpace: "nowrap" }}>
        {valueText}
        {detail && <span style={{ color: COLORS.inkSoft, fontWeight: 500, fontSize: 12.5 }}> · {detail}</span>}
      </div>
    </div>
  );
}
