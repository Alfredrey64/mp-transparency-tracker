import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconBudget } from "./icons";

// Figures are for 2025-26 (the most recent year with published headline
// totals at the time this was written), drawn from the OBR's "brief guide
// to the public finances" and, for the Welfare & Pensions split, Full
// Fact's benefit-spending breakdown. This is a curated snapshot of
// well-sourced headline totals, not a live feed — it needs updating by
// hand whenever a new Budget or Spending Review resets these numbers.
// "Other departmental spending" and "Other annually managed expenditure"
// are our own arithmetic remainders (total minus the named categories
// above), not individually published lines. The "breakdown" bullets and
// "didYouKnow" lines are qualitative context, not additional precise
// figures — we don't have confidently-sourced sub-totals for those.
const TOTAL_BN = 1368;
const PER_HOUSEHOLD = 48000;

const CATEGORIES = [
  {
    key: "welfare",
    label: "Welfare & Pensions",
    amountBn: 334,
    color: "#B0473E",
    summary: "The single biggest slice of the budget — benefits and pensions paid directly to individuals.",
    detail:
      "The State Pension alone accounts for roughly £146bn of this — more than any other individual benefit. The rest covers Universal Credit and other working-age support, and disability and incapacity benefits.",
    breakdown: ["State Pension — the largest single benefit, around £146bn", "Universal Credit and other working-age support", "Disability and incapacity benefits", "Housing support and other benefits"],
    didYouKnow: "Bigger than the entire Health budget — welfare and pensions alone account for roughly a quarter of everything the government spends.",
  },
  {
    key: "health",
    label: "Health",
    amountBn: 204,
    color: "#2F6F4E",
    summary: "Day-to-day running costs for the NHS and the rest of the health budget.",
    detail:
      "The large majority goes to NHS England — hospitals, GPs, mental health services, and community care. Building new hospitals counts separately, as capital investment.",
    breakdown: ["NHS England — hospitals, GPs, mental health, community care", "Public health and health protection", "Department of Health & Social Care running costs"],
    didYouKnow: "Health spending has roughly doubled in cash terms over the past 15 years, driven by an ageing population and rising treatment costs.",
  },
  {
    key: "otherAme",
    label: "Other Annually Managed Spending",
    amountBn: 245,
    color: "#8A6D3B",
    summary: "Demand-led spending that isn't fixed in advance, outside welfare and debt interest.",
    detail:
      "Mostly public sector pensions paid to retired teachers, NHS staff, civil servants and the armed forces, plus a number of smaller items that move with need rather than a fixed departmental budget.",
    breakdown: ["Public sector pensions for retired teachers, NHS staff, civil servants and the armed forces", "Locally financed council spending", "A range of smaller demand-led items"],
    didYouKnow: "Unlike departmental budgets, this spending isn't capped in advance — it's forecast, and can rise or fall depending on demand.",
  },
  {
    key: "otherDept",
    label: "Other Departmental Spending",
    amountBn: 185,
    color: "#3C6E8F",
    summary: "Day-to-day running costs for every department other than health, education and defence.",
    detail:
      "Policing, courts and prisons, local government funding, the Home Office, diplomacy and international aid, and every other department's staff and running costs.",
    breakdown: ["Home Office — policing and borders", "Ministry of Justice — courts and prisons", "Local government funding", "Foreign, Commonwealth & Development Office"],
    didYouKnow: "This one catch-all category is actually bigger than the entire Education or Defence budgets — a reminder of just how many departments share it.",
  },
  {
    key: "capital",
    label: "Capital Investment",
    amountBn: 157,
    color: "#6B5B95",
    summary: "Money spent building or buying things, rather than running services day to day.",
    detail:
      "New roads, hospitals, schools and military equipment, plus loans such as student finance. This is the budget for assets that last for years, not this year's running costs.",
    breakdown: ["Transport infrastructure — roads and rail", "New NHS and school buildings", "Student loans", "Defence equipment procurement"],
    didYouKnow: "Capital spending is usually the easiest budget to cut in a squeeze — and the easiest to regret cutting, since the cost shows up years later in worn-out infrastructure.",
  },
  {
    key: "debt",
    label: "Debt Interest",
    amountBn: 110,
    color: "#7A7A7A",
    summary: "Interest paid on the government's accumulated borrowing.",
    detail:
      "Not a public service — this is the cost of past deficits. It moves with interest rates and the size of the national debt, not with any policy choice about services.",
    breakdown: ["Interest on government bonds (gilts)", "A meaningful share is index-linked, so it moves directly with inflation"],
    didYouKnow: "Debt interest now costs more than the entire Education budget — a legacy of borrowing since the 2008 financial crisis and the pandemic.",
  },
  {
    key: "education",
    label: "Education",
    amountBn: 95,
    color: "#B08A2E",
    summary: "Day-to-day running costs for schools, colleges and universities.",
    detail:
      "Covers teaching and running costs across the education system. New school buildings count separately, as capital investment.",
    breakdown: ["Schools", "Further education and skills", "Higher education, net of loan write-offs"],
    didYouKnow: "Only around 7p in every £1 the government spends goes on education.",
  },
  {
    key: "defence",
    label: "Defence",
    amountBn: 39,
    color: "#4A5A6A",
    summary: "Day-to-day running costs of the armed forces.",
    detail:
      "Salaries, training and maintaining existing equipment. Buying new equipment — ships, jets, vehicles — is largely capital spending, counted separately.",
    breakdown: ["Armed forces personnel and training", "Running and maintaining existing equipment", "New equipment is counted separately, as capital spending"],
    didYouKnow: "The government has committed to raising defence spending as a share of national income over the coming years.",
  },
];

const R = 90;
const STROKE = 30;
const CENTER = 120;
const CIRCUMFERENCE = 2 * Math.PI * R;

function formatBn(n) {
  return `£${n.toLocaleString()}bn`;
}

function formatHousehold(amountBn) {
  const value = Math.round((amountBn / TOTAL_BN) * PER_HOUSEHOLD / 10) * 10;
  return `£${value.toLocaleString()}`;
}

export default function GovernmentBudget() {
  const [activeKey, setActiveKey] = useState(null);

  const segments = CATEGORIES.map((c, i) => {
    const priorBn = CATEGORIES.slice(0, i).reduce((sum, x) => sum + x.amountBn, 0);
    const fraction = c.amountBn / TOTAL_BN;
    return { ...c, segLen: fraction * CIRCUMFERENCE, offset: (priorBn / TOTAL_BN) * CIRCUMFERENCE, pct: fraction * 100 };
  });

  const active = segments.find((c) => c.key === activeKey) ?? null;

  function select(key) {
    setActiveKey((prev) => (prev === key ? null : key));
  }

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconBudget}
        kicker="Public Record · Government Budget"
        title="Where the government's money goes"
        subtitle="The UK public sector is due to spend about £1,368bn in 2025-26 — roughly £48,000 per household. Click any slice of the ring, or any category, to explore it."
      />

      <div
        style={{
          background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12,
          padding: "14px 18px", marginTop: 24, marginBottom: 28,
          fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.6, color: COLORS.inkSoft,
        }}
      >
        These are headline totals for 2025-26 from the Office for Budget Responsibility's published guide to the
        public finances, hand-curated here rather than pulled live — there's no free public API for a full spending
        breakdown, and the official detail is only published a few times a year, at each Budget and Spending Review.
        "Other departmental spending" and "other annually managed spending" are our own arithmetic remainder, not an
        officially published line — see <strong style={{ color: COLORS.ink }}>Data & Methodology</strong> for the full picture.
      </div>

      <div style={{ display: "flex", gap: 36, flexWrap: "wrap", alignItems: "center", marginBottom: 28 }}>
        <div style={{ position: "relative", width: CENTER * 2, height: CENTER * 2, flexShrink: 0, margin: "0 auto" }}>
          <svg width={CENTER * 2} height={CENTER * 2} viewBox={`0 0 ${CENTER * 2} ${CENTER * 2}`}>
            <circle cx={CENTER} cy={CENTER} r={R} fill="none" stroke={COLORS.hairline} strokeWidth={STROKE} opacity={0.4} />
            <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
              {segments.map((s, i) => {
                const isActive = activeKey === s.key;
                const dimmed = activeKey !== null && !isActive;
                return (
                  <motion.circle
                    key={s.key}
                    cx={CENTER}
                    cy={CENTER}
                    r={R}
                    fill="none"
                    stroke={s.color}
                    strokeDashoffset={-s.offset}
                    strokeLinecap="butt"
                    initial={{ strokeDasharray: `0 ${CIRCUMFERENCE}`, strokeWidth: STROKE }}
                    animate={{
                      strokeDasharray: `${s.segLen} ${CIRCUMFERENCE - s.segLen}`,
                      strokeWidth: isActive ? STROKE + 10 : STROKE,
                      opacity: dimmed ? 0.32 : 1,
                    }}
                    transition={{
                      strokeDasharray: { duration: 1.1, delay: i * 0.09, ease: [0.16, 1, 0.3, 1] },
                      strokeWidth: { duration: 0.25, ease: "easeOut" },
                      opacity: { duration: 0.25 },
                    }}
                    style={{ cursor: "pointer" }}
                    onClick={() => select(s.key)}
                  />
                );
              })}
            </g>
          </svg>
          <div
            style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column", textAlign: "center", padding: 30, pointerEvents: "none",
            }}
          >
            <AnimatePresence mode="wait">
              {active ? (
                <motion.div
                  key={active.key}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 27, color: active.color, lineHeight: 1.1 }}>{formatBn(active.amountBn)}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: COLORS.ink, marginTop: 6, lineHeight: 1.3 }}>{active.label}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>{active.pct.toFixed(1)}% of total</div>
                </motion.div>
              ) : (
                <motion.div
                  key="total"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 30, color: COLORS.ink, lineHeight: 1.1 }}>£1,368bn</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 6 }}>Total spending, 2025-26</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div style={{ flex: "1 1 340px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 }}>
          {segments.map((c, i) => {
            const isActive = activeKey === c.key;
            return (
              <motion.button
                key={c.key}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + i * 0.05 }}
                onClick={() => select(c.key)}
                style={{
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: `1px solid ${isActive ? c.color : COLORS.hairline}`,
                  background: isActive ? `${c.color}14` : COLORS.paperCard,
                  cursor: "pointer",
                  transition: "border-color 0.15s, background 0.15s",
                }}
              >
                <span style={{ width: 11, height: 11, borderRadius: 3, background: c.color, flexShrink: 0 }} />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13, color: COLORS.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.label}
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 1 }}>
                    {formatBn(c.amountBn)} · {c.pct.toFixed(1)}%
                  </div>
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {active ? (
          <motion.div
            key={active.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{
              background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${active.color}`,
              borderRadius: 12, padding: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 10 }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.ink }}>{active.label}</div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: active.color }}>{formatBn(active.amountBn)}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>{active.pct.toFixed(1)}% of total spending</div>
              </div>
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: COLORS.ink, lineHeight: 1.6, marginBottom: 10 }}>
              {active.summary}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.65, marginBottom: 16 }}>
              {active.detail}
            </div>

            <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              What's inside this category
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              {active.breakdown.map((b, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ marginTop: 7, width: 5, height: 5, borderRadius: "50%", background: active.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, lineHeight: 1.5 }}>{b}</span>
                </div>
              ))}
            </div>

            <div style={{ background: `${active.color}0d`, borderRadius: 10, padding: "12px 14px", marginBottom: 16, fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, lineHeight: 1.55 }}>
              <strong>Worth knowing:</strong> {active.didYouKnow}
            </div>

            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, borderTop: `1px solid ${COLORS.hairline}`, paddingTop: 12 }}>
              Roughly <strong style={{ color: COLORS.ink }}>{formatHousehold(active.amountBn)}</strong> of the average
              £48,000 a UK household contributes to public spending each year goes here.
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              border: `1px dashed ${COLORS.hairline}`, borderRadius: 12, padding: 24, textAlign: "center",
              fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft,
            }}
          >
            Click a slice of the ring, or one of the categories above, to see what it's actually spent on.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
