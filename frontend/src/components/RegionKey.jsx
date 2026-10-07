import { COLORS, FONT_BODY, numeric } from "../theme";
import { formatValue, formatAxis } from "../lib/onsFormat";
import { classColour } from "../lib/regionData";

// The colour key: a bar of classes with round-number edges, with the UK figure marked on it.
export default function ColourKey({ bounds, accent, format, uk, caption, ukLabel = "the UK as a whole" }) {
  const n = bounds.length - 1;
  const ukAt = uk === null || uk === undefined ? null : Math.max(0, Math.min(1, (uk - bounds[0]) / (bounds[n] - bounds[0])));
  return (
    <div style={{ margin: "14px auto 0", maxWidth: 560 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, gap: 10 }}>
        <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.ink }}>Colour key</span>
        <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, textAlign: "right" }}>{caption}</span>
      </div>
      <div style={{ position: "relative", paddingBottom: 22 }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${n}, 1fr)`, height: 18, borderRadius: 9, overflow: "hidden", boxShadow: `0 0 0 1px ${COLORS.hairline}` }} aria-hidden="true">
          {Array.from({ length: n }, (_, i) => <div key={i} style={{ background: classColour(accent, i, n) }} />)}
        </div>
        {bounds.map((b, i) => (
          <span key={i} style={{ ...numeric, position: "absolute", top: 22, left: `${(i / n) * 100}%`, transform: i === 0 ? "none" : i === n ? "translateX(-100%)" : "translateX(-50%)", fontSize: 11.5, color: COLORS.inkSoft, whiteSpace: "nowrap" }}>{formatAxis(format, b)}</span>
        ))}
        {ukAt !== null && (
          <span aria-hidden="true" title={`UK ${formatValue(format, uk)}`} style={{ position: "absolute", left: `${ukAt * 100}%`, top: -4, width: 0, height: 0, transform: "translateX(-50%)", borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: `7px solid ${COLORS.ink}` }} />
        )}
      </div>
      {uk !== null && uk !== undefined && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>▼ marks {ukLabel}: {formatValue(format, uk)}</div>}
    </div>
  );
}
