import { COLORS, FONT_BODY, FONT_MONO } from "../theme";

// One row of a horizontal bar chart: a label, a thin bar with a rounded
// data end, and the value written beside it. `tick` draws a dashed marker
// at that fraction of the track (the majority line on the seats chart).
export default function BarRow({ label, color, fraction, valueText, detail, tick }) {
  return (
    <div
      role="img"
      aria-label={`${label}: ${valueText}${detail ? `, ${detail}` : ""}`}
      title={`${label}: ${valueText}${detail ? ` (${detail})` : ""}`}
      style={{ display: "grid", gridTemplateColumns: "minmax(110px, 170px) 1fr minmax(72px, auto)", alignItems: "center", gap: 12, padding: "5px 0" }}
    >
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
      <div style={{ position: "relative", height: 10, background: COLORS.paperCard, borderRadius: 4 }}>
        <div style={{ width: `${Math.max(0, Math.min(1, fraction)) * 100}%`, minWidth: fraction > 0 ? 3 : 0, height: "100%", background: color, borderRadius: "0 4px 4px 0" }} />
        {tick != null && <div style={{ position: "absolute", left: `${tick * 100}%`, top: -4, bottom: -4, borderLeft: `1.5px dashed ${COLORS.inkSoft}`, opacity: 0.7 }} />}
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: COLORS.ink, textAlign: "right", whiteSpace: "nowrap" }}>
        {valueText}
        {detail && <span style={{ color: COLORS.inkSoft }}> · {detail}</span>}
      </div>
    </div>
  );
}
