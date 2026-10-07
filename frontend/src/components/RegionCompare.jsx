import { useMemo, useState } from "react";
import { COLORS, FONT_BODY, numeric } from "../theme";
import RegionMap from "./RegionMap";
import ColourKey from "./RegionKey";
import { REGIONS, inSentence } from "../data/regionMetrics";
import { formatValue } from "../lib/onsFormat";
import { niceBands, classOf, classColour, ranked, ordinal } from "../lib/regionData";

// One figure for each region, drawn on the map with a label on every place, a colour key with round-number
// edges, and a ranked list beside it. For figures that do not change over time (a census, a deprivation index):
// the animated version lives on the Regions page.
//
//   values       { regionKey: number | null }; places left out, or null, are greyed and say so
//   format       a format from lib/onsFormat ("pct", "gbp", ...)
//   noun         what the figure is, for the screen reader and the headline ("Asian residents")
//   ukValue      the whole-country figure to mark on the key, if there is one
//   ukLabel      what that whole is called ("England and Wales")

const MISSING = "no figure";

export default function RegionCompare({ values, format, accent, noun, ukValue = null, ukLabel = "the UK as a whole", unit = "", caption, note }) {
  const [selected, setSelected] = useState(null);
  const [hover, setHover] = useState(null);

  const { bounds, order } = useMemo(() => {
    const present = Object.values(values).filter((v) => v !== null && v !== undefined);
    const lo = present.length ? Math.min(...present) : 0;
    const hi = present.length ? Math.max(...present) : 1;
    return { bounds: niceBands(lo, hi, 6).bounds, order: ranked(values) };
  }, [values]);
  const n = bounds.length - 1;
  const has = (k) => values[k] !== null && values[k] !== undefined;
  const colour = (k) => (has(k) ? classColour(accent, classOf(values[k], bounds), n) : COLORS.hairline);
  const text = (k) => (has(k) ? `${formatValue(format, values[k])}${unit}` : "–");
  const top = (hover ?? selected) ?? order[0]?.key;
  const max = order.length ? values[order[0].key] : 1;
  const select = (k) => setSelected((cur) => (cur === k ? null : k));
  const missing = REGIONS.filter((r) => !has(r.key)).map((r) => r.name);

  return (
    <div className="regions-wrap" style={{ marginTop: 14 }}>
    <div className="regions-grid">
      <div style={{ minWidth: 0 }}>
        <RegionMap
          regions={REGIONS} view="map" fill={colour} valueText={text} accent={accent} smooth
          a11yLabel={(k) => `${REGIONS.find((r) => r.key === k).name}: ${has(k) ? `${text(k)} ${noun}` : MISSING}`}
          selected={selected} hover={hover} onHover={setHover} onSelect={select}
        />
        <ColourKey bounds={bounds} accent={accent} format={format} uk={ukValue} ukLabel={ukLabel} caption={caption ?? "Round-number steps, same colours on every map here"} />
      </div>
      <div style={{ minWidth: 0 }}>
        <ol aria-label={`Places ranked by ${noun}`} style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 3 }}>
          {order.map(({ key, rank }) => {
            const r = REGIONS.find((x) => x.key === key);
            const on = top === key;
            return (
              <li key={key}>
                <button
                  type="button" className="ons-chip" aria-pressed={selected === key} onClick={() => select(key)}
                  onPointerEnter={(e) => { if (e.pointerType !== "touch") setHover(key); }} onPointerLeave={(e) => { if (e.pointerType !== "touch") setHover(null); }}
                  onFocus={() => setHover(key)} onBlur={() => setHover(null)}
                  style={{ display: "grid", gridTemplateColumns: "26px minmax(0, 1fr) auto", gap: "2px 10px", alignItems: "center", width: "100%", textAlign: "left", font: "inherit", cursor: "pointer", background: on ? `${accent}14` : "none", border: `1.5px solid ${selected === key ? accent : "transparent"}`, borderRadius: 10, padding: "6px 9px" }}
                >
                  <span style={{ ...numeric, fontSize: 13, color: COLORS.inkSoft }}>{rank}</span>
                  <span style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                  <span style={{ ...numeric, fontSize: 16, fontWeight: 600, color: COLORS.ink }}>{text(key)}</span>
                  <span />
                  <span aria-hidden="true" style={{ gridColumn: "2 / 4", height: 8, borderRadius: 4, background: `${accent}18`, overflow: "hidden" }}>
                    <span style={{ display: "block", height: "100%", width: `${Math.max(2, (values[key] / (max || 1)) * 100)}%`, background: colour(key), borderRadius: 4, boxShadow: `inset 0 0 0 1px ${COLORS.hairline}` }} />
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        {top && has(top) && ukValue !== null && (
          <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "12px 0 0" }}>
            <strong style={{ color: COLORS.ink }}>{inSentence(top).replace(/^the /, (m) => (m ? "The " : ""))}</strong> is {ordinal(order.find((o) => o.key === top).rank)} of {order.length} places, at {text(top)}, compared with {formatValue(format, ukValue)}{unit} for {ukLabel}.
          </p>
        )}
        {(note || missing.length > 0) && (
          <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "10px 0 0" }}>
            {note}{missing.length > 0 ? ` Greyed out, with no figure: ${missing.join(" and ")}.` : ""}
          </p>
        )}
      </div>
    </div>
    </div>
  );
}
