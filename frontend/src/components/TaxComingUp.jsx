import { useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric } from "../theme";
import { card, pillStyle } from "../lib/onsStyles";
import { NEXT_BUDGET } from "../data/taxEvents";
import { allTaxes, comingUp, todayIso, whenText } from "../lib/taxRates";
import { ChangeRow } from "./TaxChangeList";

// What is already decided but not yet in force, across every tax, with a countdown to the next Budget.

const days = (from, to) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);

export default function TaxComingUp({ now }) {
  const [all, setAll] = useState(false);
  const today = todayIso(now);
  const upcoming = allTaxes().flatMap((tax) => comingUp(tax, now).map((c) => ({ ...c, tax }))).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const budget = NEXT_BUDGET && NEXT_BUDGET.date >= today ? NEXT_BUDGET : null;
  if (!budget && !upcoming.length) return null;
  const n = budget ? days(today, budget.date) : 0;
  return (
    <section aria-labelledby="h-tax-soon" style={{ ...card, marginTop: 18 }}>
      <h2 id="h-tax-soon" style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 700, color: COLORS.ink, margin: 0 }}>Coming up</h2>
      {budget && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", marginTop: 12, padding: "12px 16px", borderRadius: 16, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: "4px solid #D6455D" }}>
          <div style={{ ...numeric, fontSize: 34, fontWeight: 600, lineHeight: 1, color: COLORS.ink }}>{n === 0 ? "Today" : n}</div>
          <div style={{ minWidth: 0, flex: "1 1 240px" }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, color: COLORS.ink }}>{n === 0 ? "" : n === 1 ? "day to " : "days to "}the {budget.name}, {whenText({ date: budget.date })}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 3, lineHeight: 1.5 }}>{budget.note} Any changes will be added to this page after it.</div>
          </div>
        </div>
      )}
      {upcoming.length > 0 && (
        <>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: COLORS.ink, margin: "18px 0 0" }}>Already decided, not yet in force</h3>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {(all ? upcoming : upcoming.slice(0, 3)).map((c) => <ChangeRow key={`${c.line.key}-${c.date}`} c={c} showTax future />)}
          </ul>
          {upcoming.length > 3 && <button type="button" onClick={() => setAll((v) => !v)} aria-expanded={all} style={{ ...pillStyle(false), marginTop: 10 }}>{all ? "Show fewer" : `Show all ${upcoming.length}`}</button>}
        </>
      )}
    </section>
  );
}
