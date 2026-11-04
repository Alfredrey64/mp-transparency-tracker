import { useState } from "react";
import { COLORS, FONT_BODY, readable } from "../theme";
import { isBillWatched, toggleWatchBill } from "../lib/billWatch";
import { IconStar } from "./icons";

// "Follow this bill" on a bill's card. The Watchlist then says when it moves to another stage, becomes law or is defeated. Kept in this browser only.
export default function FollowBillButton({ bill }) {
  const [on, setOn] = useState(() => isBillWatched(bill.bill_id));
  return (
    <>
      <button
        type="button"
        aria-pressed={on}
        onClick={() => setOn(toggleWatchBill(bill))}
        style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: on ? COLORS.paperCard : readable(COLORS.accent), background: on ? COLORS.ink : `${COLORS.accent}12`, border: `1px solid ${on ? COLORS.ink : `${COLORS.accent}55`}`, borderRadius: 999, minHeight: 36, padding: "0 14px", cursor: "pointer" }}
      >
        <IconStar size={15} filled={on} />
        {on ? "Following this bill" : "Follow this bill"}
      </button>
      <span role="status" className="sr-only">{on ? "You are following this bill. The Watchlist will say when it moves." : ""}</span>
    </>
  );
}
