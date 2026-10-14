import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconBudget } from "./icons";

import { CATEGORIES, PER_HOUSEHOLD, TOTAL_BN } from "../data/publicSpending";

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
        kicker="Government Budget"
        title="Where taxes go"
        subtitle="The UK public sector is due to spend about £1,368bn in 2025-26, roughly £48,000 per household. Tap any slice of the ring, or any category, to explore it."
      />

      <div
        style={{
          background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12,
          padding: "14px 18px", marginTop: 24, marginBottom: 28,
          fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.6, color: COLORS.inkSoft,
        }}
      >
        These are headline totals for 2025-26 from the Office for Budget Responsibility's published guide to the
        public finances, which is only updated a few times a year, at each Budget and Spending Review.
        "Other departmental spending" and "other annually managed spending" are our own arithmetic remainder, not an
        officially published line. See <strong style={{ color: COLORS.ink }}>Data & Methodology</strong> for the full picture.
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

        <div style={{ flex: "1 1 340px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))", gap: 8 }}>
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
              <strong>For context:</strong> {active.didYouKnow}
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
