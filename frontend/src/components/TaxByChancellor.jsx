import { useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric, solid } from "../theme";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";
import { scrollRegion } from "../lib/a11y";
import { CHANCELLORS } from "../data/chancellors";
import { GROUPS } from "../data/taxCatalogue";
import { chancellorsWithChanges, changesByChancellor, chancellorSpan, fmt, governmentOn, headlinesBetween, PARTY_NAMES, whenText } from "../lib/taxRates";
import { Reveal } from "./Motion";
import ChangeList from "./TaxChangeList";

// Pick a Chancellor of the Exchequer and see the tax changes decided in their time and the main rates when they started and left. Only changes
// where the Chancellor can be named with confidence are counted, so the list can be shorter than the real record.

const para = { fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.65, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 780 };
const yr = (iso) => iso.slice(0, 4);

function diffText(unit, a, b) {
  if (a === undefined || b === undefined || a === null || b === null) return "";
  if (Math.abs(a - b) < 1e-9) return "no change";
  const m = Math.abs(b - a);
  const dir = b > a ? "up" : "down";
  if (unit === "pct") return `${dir} ${Math.round(m * 100) / 100} point${m === 1 ? "" : "s"}`;
  if (unit === "pence") return `${dir} ${Math.round(m * 100) / 100}p`;
  return `${dir} ${fmt(unit, m)}`;
}

export default function TaxByChancellor({ name, onPick }) {
  const [now] = useState(() => Date.now());
  const list = chancellorsWithChanges(now);
  const chosen = list.find((c) => c.name === name) ?? list[list.length - 1];
  const span = chancellorSpan(chosen.name);
  const changes = changesByChancellor(chosen.name, now);
  const heads = headlinesBetween(span.from, span.to, now);
  const [groupKey, setGroupKey] = useState("all");
  const shown = groupKey === "all" ? changes : changes.filter((c) => c.tax.group.key === groupKey);
  const more = changes.filter((c) => c.effect === "more").length;
  const less = changes.filter((c) => c.effect === "less").length;
  const gov = governmentOn(span.from);
  const colour = gov?.party === "l" ? "#d50000" : "#0063ba";
  const index = CHANCELLORS.findIndex((c) => c.name === chosen.name);
  return (
    <div>
      <p style={{ ...para, marginTop: 8 }}>Pick a Chancellor of the Exchequer to see the changes decided while they held the job. A change is only listed where we can be sure which Chancellor set it, so a Budget set up by a predecessor is not credited to the next one. The count is not a score.</p>
      <div role="group" aria-label="Choose a Chancellor" style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "12px 2px 6px" }}>
        {list.map((c) => {
          const on = c.name === chosen.name;
          const g = governmentOn(c.from);
          const col = g?.party === "l" ? "#d50000" : "#0063ba";
          return (
            <button key={c.name} type="button" aria-pressed={on} onClick={() => { setGroupKey("all"); onPick(c.name); }} style={{ ...pillStyle(false), display: "inline-flex", alignItems: "center", gap: 7, background: on ? solid(col) : "transparent", borderColor: on ? solid(col) : COLORS.hairline, color: on ? "#fff" : COLORS.ink }}>
              <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: "50%", background: on ? "#fff" : col }} />
              {c.short} <span style={{ fontWeight: 500, opacity: 0.85 }}>{yr(c.from)}</span>
            </button>
          );
        })}
      </div>

      <Reveal key={chosen.name} as="section" aria-labelledby="h-tax-chan" style={{ ...card, marginTop: 10, boxShadow: `var(--shadow-1), inset 0 5px 0 ${colour}` }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>Chancellor of the Exchequer, {whenText({ date: span.from })} to {span.to ? whenText({ date: span.to }) : "now"}{gov ? `, under ${gov.pm.split(" and ")[0]} (${PARTY_NAMES[gov.party].split(" and ")[0]})` : ""}</div>
        <h2 id="h-tax-chan" style={{ ...cardTitle, fontSize: "clamp(22px, 4.2vw, 32px)", marginTop: 2 }}>{chosen.name}</h2>
        <p style={para}>
          <strong style={{ color: COLORS.ink }}>{changes.length}</strong> changes in our record can be credited to this Chancellor: <strong style={{ color: COLORS.ink }}>{more}</strong> meant more tax and <strong style={{ color: COLORS.ink }}>{less}</strong> meant less.
          {index > 0 && " The first Budget after taking over often carried out plans made by the previous Chancellor."}
        </p>

        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: COLORS.ink, margin: "22px 0 0" }}>The main rates, start to end</h3>
        <div {...scrollRegion("Main rates under this Chancellor, scrollable")} style={{ overflowX: "auto", marginTop: 8 }}>
          <table style={{ width: "100%", minWidth: 520, borderCollapse: "collapse", fontFamily: FONT_BODY, fontSize: 14 }}>
            <caption style={{ position: "absolute", left: -9999 }}>Main tax rates when {chosen.name} began and left the Treasury</caption>
            <thead>
              <tr style={{ color: COLORS.inkSoft, textAlign: "left", fontSize: 12.5 }}>
                <th scope="col" style={{ fontWeight: 600, padding: "6px 0" }}>Rate</th>
                <th scope="col" style={{ fontWeight: 600, padding: "6px 0 6px 12px" }}>At the start</th>
                <th scope="col" style={{ fontWeight: 600, padding: "6px 0 6px 12px" }}>{span.to ? "At the end" : "Now"}</th>
                <th scope="col" style={{ fontWeight: 600, padding: "6px 0 6px 12px" }}>Change</th>
              </tr>
            </thead>
            <tbody>
              {heads.map((h) => (
                <tr key={h.key} style={{ borderTop: `1px solid ${COLORS.hairline}` }}>
                  <th scope="row" style={{ textAlign: "left", fontWeight: 600, color: COLORS.ink, padding: "9px 0" }}>{h.label}</th>
                  <td style={{ ...numeric, padding: "9px 0 9px 12px", color: COLORS.ink }}>{h.start === undefined ? <span style={{ color: COLORS.inkSoft, fontFamily: FONT_BODY, fontSize: 13 }}>no record yet</span> : fmt(h.unit, h.start)}</td>
                  <td style={{ ...numeric, padding: "9px 0 9px 12px", color: COLORS.ink }}>{h.end === undefined ? <span style={{ color: COLORS.inkSoft, fontFamily: FONT_BODY, fontSize: 13 }}>no record yet</span> : fmt(h.unit, h.end)}</td>
                  <td style={{ padding: "9px 0 9px 12px", color: COLORS.inkSoft, fontSize: 13.5 }}>{diffText(h.unit, h.start, h.end)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: COLORS.ink, margin: "24px 0 0" }}>Every change credited to them</h3>
        {changes.length > 0 && (
          <div role="group" aria-label="Show changes to" style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0 4px" }}>
            <button type="button" aria-pressed={groupKey === "all"} onClick={() => setGroupKey("all")} style={pillStyle(groupKey === "all")}>All {changes.length}</button>
            {GROUPS.filter((g) => changes.some((c) => c.tax.group.key === g.key)).map((g) => (
              <button key={g.key} type="button" aria-pressed={groupKey === g.key} onClick={() => setGroupKey(g.key)} style={pillStyle(groupKey === g.key)}>{g.label} {changes.filter((c) => c.tax.group.key === g.key).length}</button>
            ))}
          </div>
        )}
        <ChangeList changes={shown} showTax newestFirst={false} initial={12} empty="No changes recorded." />
      </Reveal>
    </div>
  );
}
