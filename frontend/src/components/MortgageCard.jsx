import { memo, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { COLORS, FONT_BODY, numeric } from "../theme";
import { periodLabel, periodToT } from "../lib/onsFormat";
import { monthlyPayment } from "../lib/mortgage";
import { card, cardTitle } from "../lib/onsStyles";

// What a mortgage costs each month at today's rate, a year ago, and at the lowest and
// highest rates on record, with sliders for the size and length of the loan.

const gbp = (v) => `£${Math.round(v).toLocaleString("en-GB")}`;

function MortgageCard({ points, accent }) {
  const reduce = useReducedMotion();
  const [loan, setLoan] = useState(200000);
  const [years, setYears] = useState(25);

  const rates = useMemo(() => {
    if (!points?.length) return null;
    const [nowP, nowV] = points.at(-1);
    const yearAgo = points.find(([p]) => Math.abs(periodToT(p) - (periodToT(nowP) - 1)) < 0.02);
    let low = points[0];
    let high = points[0];
    for (const p of points) {
      if (p[1] < low[1]) low = p;
      if (p[1] > high[1]) high = p;
    }
    return [
      { key: "now", name: "Now", when: periodLabel(nowP), rate: nowV, color: accent },
      yearAgo && { key: "year", name: "A year ago", when: periodLabel(yearAgo[0]), rate: yearAgo[1], color: "#E07A1F" },
      { key: "low", name: "Lowest on record", when: periodLabel(low[0]), rate: low[1], color: "#3F9B3F" },
      { key: "high", name: "Highest on record", when: periodLabel(high[0]), rate: high[1], color: "#D4577A" },
    ].filter(Boolean);
  }, [points, accent]);
  if (!rates) return null;

  const rows = rates.map((r) => ({ ...r, pay: monthlyPayment(loan, r.rate, years) }));
  const biggest = Math.max(...rows.map((r) => r.pay), 1);
  const now = rows[0];
  const before = rows.find((r) => r.key === "year");
  const diff = before ? now.pay - before.pay : null;

  return (
    <motion.section
      id="s-mortgage-cost"
      className="ons-anchor"
      aria-labelledby="h-mortgage-cost"
      style={{ ...card, position: "relative", overflow: "hidden", gridColumn: "1 / -1" }}
    >
      <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: `linear-gradient(180deg, ${accent}, ${accent}22)` }} />
      <h2 id="h-mortgage-cost" style={cardTitle}>What a mortgage costs each month</h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.55, color: COLORS.ink, margin: "10px 0 18px", maxWidth: 760 }}>
        Choose a loan and see the monthly repayment at today's two-year fixed rate, and at other points in the past. It shows how much of a difference the rate makes.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: "14px 32px", marginBottom: 20 }}>
        <label style={{ display: "block", fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700, color: COLORS.ink }}>
          Amount borrowed: <span style={{ ...numeric, fontWeight: 600 }}>{gbp(loan)}</span>
          <input
            className="ons-range" type="range" min={50000} max={500000} step={5000} value={loan} onChange={(e) => setLoan(Number(e.target.value))}
            aria-valuetext={gbp(loan)} style={{ display: "block", width: "100%", marginTop: 8, accentColor: accent }}
          />
        </label>
        <label style={{ display: "block", fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700, color: COLORS.ink }}>
          Length of the mortgage: <span style={{ ...numeric, fontWeight: 600 }}>{years} years</span>
          <input
            className="ons-range" type="range" min={10} max={40} step={1} value={years} onChange={(e) => setYears(Number(e.target.value))}
            aria-valuetext={`${years} years`} style={{ display: "block", width: "100%", marginTop: 8, accentColor: accent }}
          />
        </label>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {rows.map((r) => (
          <div key={r.key} style={{ display: "grid", gridTemplateColumns: "minmax(110px, 170px) 1fr auto", gap: 12, alignItems: "center" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700, color: COLORS.ink }}>{r.name}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>{r.when} · {r.rate.toFixed(2)}%</div>
            </div>
            <div aria-hidden="true" style={{ height: 16, borderRadius: 8, background: COLORS.hairline, overflow: "hidden" }}>
              <motion.div
                style={{ height: "100%", borderRadius: 8, background: r.color }}
                initial={reduce ? false : { width: 0 }}
                animate={{ width: `${(r.pay / biggest) * 100}%` }}
                transition={{ type: "spring", stiffness: 140, damping: 22 }}
              />
            </div>
            <div style={{ ...numeric, fontSize: 20, fontWeight: 600, color: COLORS.ink, minWidth: 92, textAlign: "right" }}>{gbp(r.pay)}</div>
          </div>
        ))}
      </div>

      <p role="status" style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.ink, margin: "18px 0 0" }}>
        At today's rate, borrowing {gbp(loan)} over {years} years costs {gbp(now.pay)} a month.
        {diff !== null && Math.abs(diff) >= 1 && ` That is ${gbp(Math.abs(diff))} a month ${diff > 0 ? "more" : "less"} than a year ago.`}
      </p>
      <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.5, color: COLORS.inkSoft, margin: "8px 0 0" }}>
        A simple estimate for a repayment mortgage: the rate is assumed to stay the same for the whole term, and fees are left out. Real deals differ, and most rates are fixed for only two or five years. The rate is the average for a 25% deposit.
      </p>
    </motion.section>
  );
}

export default memo(MortgageCard);
