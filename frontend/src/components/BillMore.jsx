import { useState } from "react";
import { COLORS, FONT_BODY } from "../theme";
import { billMore } from "../lib/billMore";
import Unfold from "./Unfold";

// The "What it proposes" button that sits under a bill's one-line summary wherever the site gives one: press it for the bill read clause by clause in plain English,
// with the official wording underneath. Shows nothing when there is nothing more to say (see lib/billMore.js). With `bare`, the points show straight away
// (for a place that is already a box you have opened) instead of behind the button.
export function BillPointsList({ more, size = 13 }) {
  return (
    <div style={{ padding: "8px 12px", borderRadius: 10, background: COLORS.paper, borderLeft: `3px solid ${COLORS.accent}` }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, marginBottom: 4 }}>What it proposes, point by point</div>
      <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 3 }}>
        {more.points.map((pt, i) => <li key={i} style={{ fontFamily: FONT_BODY, fontSize: size, color: COLORS.ink, lineHeight: 1.5 }}>{pt}</li>)}
      </ul>
      {more.extra > 0 && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 3 }}>and {more.extra} more {more.extra === 1 ? "point" : "points"}. See the official wording below.</div>}
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.5, marginTop: 6 }}>Official wording: {more.official}</div>
    </div>
  );
}

export default function BillMore({ bill, bare = false }) {
  const [open, setOpen] = useState(false);
  const more = billMore(bill);
  if (!more) return null;
  if (bare) return <BillPointsList more={more} />;
  return (
    <div style={{ marginTop: 2 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 28, padding: "2px 0", background: "none", border: "none", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.accentText, textAlign: "left" }}
      >
        <span aria-hidden="true">{open ? "▾" : "▸"}</span>
        What it proposes<span className="sr-only"> in {bill.short_title}</span>
      </button>
      <Unfold open={open}>
        <div style={{ paddingTop: 4, paddingBottom: 4 }}><BillPointsList more={more} /></div>
      </Unfold>
    </div>
  );
}
