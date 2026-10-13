import { useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY } from "../theme";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";
import { budgetEvents, PARTY_NAMES, whenText } from "../lib/taxRates";
import { Reveal } from "./Motion";
import { ChangeRow } from "./TaxChangeList";

// Budget by Budget: every tax change we can tie to the Budget or statement where it was decided, newest first.

const para = { fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.65, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 780 };

export default function TaxByBudget() {
  const [now] = useState(() => Date.now());
  const events = budgetEvents(now);
  const [open, setOpen] = useState(() => new Set());
  const [shown, setShown] = useState(12);
  const toggle = (d) => setOpen((o) => { const n = new Set(o); if (n.has(d)) n.delete(d); else n.add(d); return n; });
  return (
    <div>
      <Reveal as="section" aria-labelledby="h-tax-bud" style={{ ...card, marginTop: 14 }}>
        <h2 id="h-tax-bud" style={cardTitle}>Budget by Budget</h2>
        <p style={para}>Each Budget or fiscal statement below lists the changes to the rates we follow that were decided at it, with the government and Chancellor of the day. Many changes took effect months later, so the date it began is shown on each one. Changes that simply took effect on a date, such as 6 April, with no known decision date are not in this view: find them under each tax.</p>
        <p style={{ ...para, fontSize: 13.5 }}>{events.length} Budgets and statements, from {events.at(-1) ? whenText({ date: events.at(-1).date }) : ""}.</p>
      </Reveal>
      <ul style={{ listStyle: "none", margin: "16px 0 0", padding: 0, display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 12 }}>
        {events.slice(0, shown).map((e) => {
          const isOpen = open.has(e.date);
          const colour = e.gov?.party === "l" ? "#d50000" : "#0063ba";
          const more = e.changes.filter((c) => c.effect === "more").length;
          const less = e.changes.filter((c) => c.effect === "less").length;
          return (
            <li key={e.date} style={{ ...card, minWidth: 0, padding: "16px clamp(14px, 3.5vw, 22px)", borderLeft: `5px solid ${colour}` }}>
              <button type="button" aria-expanded={isOpen} onClick={() => toggle(e.date)} style={{ cursor: "pointer", display: "block", width: "100%", boxSizing: "border-box", minWidth: 0, margin: 0, padding: 0, border: "none", background: "none", textAlign: "left", font: "inherit", color: "inherit", overflowWrap: "anywhere" }}>
                <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>{whenText({ date: e.date, p: e.approx ? "m" : null })}{e.gov ? `, ${PARTY_NAMES[e.gov.party].split(" and ")[0]} government of ${e.gov.pm.split(" and ")[0]}` : ""}{e.chancellor ? `, Chancellor ${e.chancellor.name}` : ""}</span>
                <span style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginTop: 2 }}>
                  <span style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 700, color: COLORS.ink }}>{e.name}</span>
                  <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>{e.changes.length} change{e.changes.length === 1 ? "" : "s"}: {more} more tax, {less} less tax <span aria-hidden="true" style={{ fontWeight: 700 }}>{isOpen ? "-" : "+"}</span></span>
                </span>
              </button>
              {isOpen && (
                <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0 }}>
                  {e.changes.map((c) => <ChangeRow key={`${c.line.key}-${c.date}`} c={c} showTax />)}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      {shown < events.length && (
        <button type="button" onClick={() => setShown((n) => n + 12)} style={{ ...pillStyle(false), marginTop: 14 }}>Show older Budgets</button>
      )}
    </div>
  );
}
