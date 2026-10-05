import { COLORS, FONT_BODY } from "../theme";
import { everyday } from "../lib/everyday";
import { MEDIAN_SALARY, MP_SALARY } from "../data/referenceFigures";

// Tone colours are deliberately neutral shades, not red and green: a figure
// being high or low says where it sits, not whether it is good or bad.
const TONE = { high: "#4F46E5", mid: "#8A8FA8", low: "#2F8FBF" };

// One line under a chart or figure saying what it means: a marker for where
// it sits ("Higher than most") and a sentence. `result` comes from
// lib/interpret.js; `caveat` is a short "but this doesn't show..." to go with it.
export default function WhatThisMeans({ result, caveat, style }) {
  if (!result) return null;
  const colour = TONE[result.tone] ?? TONE.mid;
  return (
    <div
      style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "4px 10px", marginTop: 12, padding: "9px 12px", borderRadius: 10, background: `${colour}14`, borderLeft: `3px solid ${colour}`, ...style }}
    >
      <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: COLORS.inkSoft }}>What this means</span>
      <span style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: colour, background: `${colour}1f`, borderRadius: 999, padding: "2px 9px", whiteSpace: "nowrap" }}>{result.marker}</span>
      <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, lineHeight: 1.5, flex: "1 1 240px" }}>
        {result.text}
        {caveat && <span style={{ color: COLORS.inkSoft }}> {caveat}</span>}
      </span>
    </div>
  );
}

// "That's about 4 days' pay for a typical full-time worker." for a sum of money.
// The reasoning is in the tooltip and the page's source note.
export function Everyday({ amount, lead = "That's", style }) {
  const text = everyday(amount);
  if (!text) return null;
  return (
    <span
      title={`Compared with ${MEDIAN_SALARY.label} (£${MEDIAN_SALARY.value.toLocaleString("en-GB")}, ${MEDIAN_SALARY.source}) and ${MP_SALARY.label} (£${MP_SALARY.value.toLocaleString("en-GB")}, ${MP_SALARY.source}).`}
      style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, lineHeight: 1.5, ...style }}
    >
      {lead} {text}.
    </span>
  );
}
