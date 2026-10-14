import { COLORS, FONT_BODY } from "../theme";

// A short note for an MP who now sits for a different party from the one they were elected for (see lib/partyChange.js).
export default function PartyChangeNote({ change, style }) {
  if (!change) return null;
  return (
    <div role="note" style={{ padding: "10px 14px", borderRadius: 12, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${COLORS.accent}`, fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.55, color: COLORS.ink, textAlign: "left", ...style }}>
      <strong>Changed party since the election.</strong> {change.text}{change.detail ? ` ${change.detail}` : ""}
    </div>
  );
}
