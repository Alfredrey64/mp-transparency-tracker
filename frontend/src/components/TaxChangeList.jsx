import { useState } from "react";
import { COLORS, FONT_BODY, numeric } from "../theme";
import { PARTY_NAMES, changeText, fmt, whenText } from "../lib/taxRates";

// A list of tax changes: when, what changed, and which government and Chancellor decided it. The wording is plain on purpose: it says who
// set the rate, not whether it was a good idea.

const EFFECT = { more: "More tax", less: "Less tax" };
const tag = { fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap", border: `1px solid ${COLORS.hairline}`, color: COLORS.inkSoft };

function whoText(c) {
  const party = c.gov ? PARTY_NAMES[c.gov.party] : null;
  const pm = c.gov ? c.gov.pm : null;
  const bits = [];
  if (pm) bits.push(`${party} government of ${pm}`);
  if (c.chancellor) bits.push(`Chancellor ${c.chancellor.name}`);
  return bits.join(", ");
}

export function ChangeRow({ c, showTax, future = false }) {
  const u = c.line.unit;
  const later = c.decidedEarlier && c.point.ann && c.point.ann.slice(0, 4) !== c.point.date.slice(0, 4);
  return (
    <li style={{ display: "grid", gridTemplateColumns: "minmax(0, 118px) minmax(0, 1fr)", gap: "4px 14px", padding: "11px 0", borderTop: `1px solid ${COLORS.hairline}` }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, fontWeight: 600 }}>{whenText(c.point)}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "4px 10px" }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 14.5, color: COLORS.ink, fontWeight: 600 }}>
            {showTax && <span style={{ color: COLORS.inkSoft, fontWeight: 600 }}>{c.tax.name}. </span>}
            {c.move === "up" || c.move === "down"
              ? <>{c.line.label}: {c.move === "up" ? "up" : "down"} from <span style={numeric}>{fmt(u, c.from)}</span> to <span style={numeric}>{fmt(u, c.to)}</span></>
              : changeText(c)}
          </span>
          {c.effect && <span style={tag}>{EFFECT[c.effect]}</span>}
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginTop: 3, lineHeight: 1.5 }}>
          {c.gov ? <>Set under the {whoText(c)}.</> : null}
          {later && c.gov && <> It {future ? "takes" : "took"} effect {c.point.p === "m" ? "in" : "on"} {whenText(c.point)}.</>}
          {c.point.note && <> {c.point.note}</>}
        </div>
      </div>
    </li>
  );
}

export default function ChangeList({ changes, showTax = false, initial = 10, newestFirst = true, empty = "No changes recorded." }) {
  const [all, setAll] = useState(false);
  const rows = newestFirst ? [...changes].reverse() : changes;
  const shown = all ? rows : rows.slice(0, initial);
  if (!rows.length) return <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft }}>{empty}</p>;
  return (
    <div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {shown.map((c) => <ChangeRow key={`${c.line.key}-${c.date}`} c={c} showTax={showTax} />)}
      </ul>
      {rows.length > initial && (
        <button type="button" onClick={() => setAll((v) => !v)} aria-expanded={all} style={{ marginTop: 8, fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700, padding: "7px 14px", borderRadius: 999, cursor: "pointer", border: `1px solid ${COLORS.hairline}`, background: "transparent", color: COLORS.ink }}>
          {all ? "Show fewer" : `Show all ${rows.length} changes`}
        </button>
      )}
    </div>
  );
}
