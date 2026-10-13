import { useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric, solid } from "../theme";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";
import { scrollRegion } from "../lib/a11y";
import { GOVERNMENTS } from "../data/governments";
import { GROUPS } from "../data/taxCatalogue";
import { GROUPS as PARTY_GROUPS } from "../lib/electionHistory";
import { PARTY_NAMES, changesByGovernment, fmt, headlinesFor } from "../lib/taxRates";
import { Reveal } from "./Motion";
import ChangeList from "./TaxChangeList";

// Pick a government and see every tax change decided during its time, and the main rates at the start and end. It lays out what happened and
// does not say which government did better: how many changes were made depends on which rates we follow, and many rates move because of
// events rather than choices.

const para = { fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.65, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 780 };
const yr = (iso) => iso.slice(0, 4);
const partyColour = (p) => (p === "l" ? PARTY_GROUPS.l.colour : PARTY_GROUPS.c.colour);

function diffText(unit, a, b) {
  if (a === undefined || b === undefined || a === null || b === null) return "";
  if (Math.abs(a - b) < 1e-9) return "no change";
  const d = b - a;
  const dir = d > 0 ? "up" : "down";
  const m = Math.abs(d);
  if (unit === "pct") return `${dir} ${Math.round(m * 100) / 100} point${m === 1 ? "" : "s"}`;
  if (unit === "pence") return `${dir} ${Math.round(m * 100) / 100}p`;
  return `${dir} ${fmt(unit, m)}`;
}

export default function TaxByGovernment({ govId, onPick }) {
  const [now] = useState(() => Date.now());
  const gov = GOVERNMENTS.find((g) => g.id === govId) ?? GOVERNMENTS[GOVERNMENTS.length - 1];
  const [groupKey, setGroupKey] = useState("all");
  const changes = useMemo(() => changesByGovernment(gov.id, now), [gov.id, now]);
  const heads = useMemo(() => headlinesFor(gov.id, now), [gov.id, now]);
  const shown = groupKey === "all" ? changes : changes.filter((c) => c.tax.group.key === groupKey);
  const more = changes.filter((c) => c.effect === "more").length;
  const less = changes.filter((c) => c.effect === "less").length;
  const colour = partyColour(gov.party);
  return (
    <div>
      <p style={{ ...para, marginTop: 8 }}>
        Pick a government to see every change to the rates we follow that it decided, and the main rates when it began and when it ended. The count of changes depends on which rates we follow and when each record starts, so it is not a score.
      </p>
      <div role="group" aria-label="Choose a government" style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "12px 2px 6px" }}>
        {GOVERNMENTS.map((g) => {
          const on = g.id === gov.id;
          const c = partyColour(g.party);
          return (
            <button
              key={g.id} type="button" aria-pressed={on} onClick={() => { setGroupKey("all"); onPick(g.id); }}
              style={{ ...pillStyle(false), display: "inline-flex", alignItems: "center", gap: 7, background: on ? solid(c) : "transparent", borderColor: on ? solid(c) : COLORS.hairline, color: on ? "#fff" : COLORS.ink }}
            >
              <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: "50%", background: on ? "#fff" : c }} />
              {g.pm.split(" and ")[0].split(" ").slice(-1)[0]} <span style={{ fontWeight: 500, opacity: 0.85 }}>{yr(g.from)}</span>
            </button>
          );
        })}
      </div>

      <Reveal key={gov.id} as="section" aria-labelledby="h-tax-gov" style={{ ...card, marginTop: 10, borderTop: `5px solid ${colour}` }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>{PARTY_NAMES[gov.party]}, {yr(gov.from)} to {gov.to ? yr(gov.to) : "now"}</div>
        <h2 id="h-tax-gov" style={{ ...cardTitle, fontSize: "clamp(22px, 4.2vw, 32px)", marginTop: 2 }}>{gov.pm}</h2>
        <p style={para}>
          {changes.length === 0
            ? "None of the rates we follow changed under this government, or our records do not reach back this far."
            : <>Of the changes in our record, <strong style={{ color: COLORS.ink }}>{changes.length}</strong> were decided under this government: <strong style={{ color: COLORS.ink }}>{more}</strong> meant more tax and <strong style={{ color: COLORS.ink }}>{less}</strong> meant less. A change is counted under the government in power when it was decided, so a rise set by one government and in force under the next is counted under the first.</>}
        </p>

        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: COLORS.ink, margin: "22px 0 0" }}>The main rates, start to end</h3>
        <div {...scrollRegion("Main rates under this government, scrollable")} style={{ overflowX: "auto", marginTop: 8 }}>
          <table style={{ width: "100%", minWidth: 520, borderCollapse: "collapse", fontFamily: FONT_BODY, fontSize: 14 }}>
            <caption style={{ position: "absolute", left: -9999 }}>Main tax rates when {gov.pm} began and ended</caption>
            <thead>
              <tr style={{ color: COLORS.inkSoft, textAlign: "left", fontSize: 12.5 }}>
                <th scope="col" style={{ fontWeight: 600, padding: "6px 0" }}>Rate</th>
                <th scope="col" style={{ fontWeight: 600, padding: "6px 0 6px 12px" }}>At the start</th>
                <th scope="col" style={{ fontWeight: 600, padding: "6px 0 6px 12px" }}>{gov.to ? "At the end" : "Now"}</th>
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
        <p style={{ ...para, fontSize: 12.5, marginTop: 8 }}>
          Income tax rates are for England, Wales and Northern Ireland. Fuel duty is in pence per litre of petrol, and our records for it start in 1989. Council tax is the average Band D bill in England, set by councils. Inheritance tax is the tax-free band.
        </p>

        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: COLORS.ink, margin: "24px 0 0" }}>Every change it decided</h3>
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
