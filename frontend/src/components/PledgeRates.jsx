import { useState } from "react";
import { COLORS, FONT_BODY, numeric } from "../theme";
import { changesOf, fmt, getTax, todayIso } from "../lib/taxRates";

// Under a tax pledge: what actually happened to the rates it named, from the election to the next one (or to today). The figures are the same ones
// as on the Tax rates through time page.

const TAX_OF = { incomeTax: "income-tax", ni: "national-insurance", vat: "vat", corp: "corporation-tax" };

export default function PledgeRates({ keys, from, to }) {
  const [today] = useState(() => todayIso(Date.now()));
  const end = to ?? today;
  const rows = keys.map((key) => {
    const taxId = TAX_OF[key.split(".")[0]];
    const tax = getTax(taxId);
    const line = tax.lines.find((l) => l.key === key);
    const valueAt = (iso) => { let v; for (const p of line.points) { if (p.date <= iso) v = p.value; else break; } return v; };
    const changes = changesOf(line).filter((c) => !c.first && (c.point.ann ?? c.date) >= from && (c.point.ann ?? c.date) < end);
    return { key, tax, line, start: valueAt(from), finish: valueAt(end), changes };
  });
  return (
    <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 12, background: COLORS.paper, border: `1px solid ${COLORS.hairline}` }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.ink }}>What happened to the rates{to ? " in that Parliament" : " since the election"}</div>
      <ul style={{ listStyle: "none", margin: "6px 0 0", padding: 0, display: "grid", gap: 4 }}>
        {rows.map((r) => (
          <li key={r.key} style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.5 }}>
            <a href={`#/taxRates/${r.tax.id}`} style={{ color: COLORS.ink, fontWeight: 600 }}>{r.tax.name}: {r.line.label.toLowerCase()}</a>{" "}
            {r.start === undefined || r.finish === undefined ? "no record yet" : r.start === r.finish
              ? <>stayed at <span style={numeric}>{fmt(r.line.unit, r.finish)}</span></>
              : <><span style={numeric}>{fmt(r.line.unit, r.start)}</span> to <span style={numeric}>{fmt(r.line.unit, r.finish)}</span></>}
            {r.changes.length > 0 && <> ({r.changes.length} change{r.changes.length === 1 ? "" : "s"} decided)</>}
          </li>
        ))}
      </ul>
    </div>
  );
}
