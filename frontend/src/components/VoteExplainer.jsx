import { useMemo } from "react";
import { COLORS, FONT_BODY } from "../theme";
import { explainDivision, describeVote } from "../lib/divisionExplainer";

// What a vote actually was, in plain English, from its title alone — see
// lib/divisionExplainer.js for how it's worked out and where it stops. Two
// shapes: `inline` is a quiet line under a vote in a list (including one
// inside a clickable row, so it holds no buttons); the default is a small
// panel for a vote's own card, spelling out what Aye and No each meant.
export default function VoteExplainer({ title, votedAye = null, inline = false }) {
  const explanation = useMemo(() => explainDivision(title), [title]);
  if (!explanation) return null;
  const theirs = describeVote(explanation, votedAye);

  if (inline) {
    return (
      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.5, marginTop: 3 }}>
        {explanation.plain}
        {theirs && <> <strong style={{ color: COLORS.ink }}>{votedAye ? "Voting Aye:" : "Voting No:"}</strong> {theirs}</>}
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: COLORS.accent, marginBottom: 4 }}>What was this vote?</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink, lineHeight: 1.55, marginBottom: 6 }}>{explanation.plain}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 18px", fontFamily: FONT_BODY, fontSize: 12, lineHeight: 1.5 }}>
        <span style={{ color: "#2F6F4E", flex: "1 1 200px" }}><strong>Aye:</strong> {explanation.ayeMeans}</span>
        <span style={{ color: "#9C3B3B", flex: "1 1 200px" }}><strong>No:</strong> {explanation.noMeans}</span>
      </div>
    </div>
  );
}
