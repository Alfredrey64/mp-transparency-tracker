import { useState } from "react";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_BODY, numeric } from "../theme";
import { fetchAllRows } from "../lib/supabasePagination";
import { donorPolicyArea, votesInArea } from "../lib/donorVotes";
import { sectorColor } from "../lib/donorSectors";

// Under a donor's result: how the MPs it gave to personally voted on bills in the matching policy area. Loaded only when opened,
// and framed as an overlap, not a cause.

const SHOW = 6;

export default function DonorVotes({ donorName, mps }) {
  const area = donorPolicyArea(donorName);
  const [state, setState] = useState({ open: false, loading: false, failed: false, result: null });
  const [all, setAll] = useState(false);
  if (!area || mps.length === 0) return null;

  async function toggle() {
    if (state.open) { setState((s) => ({ ...s, open: false })); return; }
    if (state.result) { setState((s) => ({ ...s, open: true })); return; }
    setState({ open: true, loading: true, failed: false, result: null });
    try {
      const ids = mps.map((m) => m.id);
      const [votes, { data: bills, error }] = await Promise.all([
        fetchAllRows(() => supabase.from("voting_records").select("politician_id, title, date, voted_aye").in("politician_id", ids)),
        supabase.from("bills").select("short_title, sponsoring_department"),
      ]);
      if (error) throw error;
      setState({ open: true, loading: false, failed: false, result: votesInArea({ votes, bills, mps, category: area.category }) });
    } catch {
      setState({ open: true, loading: false, failed: true, result: null });
    }
  }

  const { open, loading, failed, result } = state;
  const colour = sectorColor(area.sector);
  const shown = result ? (all ? result.bills : result.bills.slice(0, SHOW)) : [];

  return (
    <div style={{ marginTop: 20, borderTop: `1px solid ${COLORS.hairline}`, paddingTop: 14 }}>
      <button
        type="button" onClick={toggle} aria-expanded={open} className="ons-chip"
        style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 12, textAlign: "left", cursor: "pointer", background: `${colour}14`, border: `1px solid ${colour}55`, borderRadius: 14, padding: "12px 14px", fontFamily: FONT_BODY, color: COLORS.ink }}
      >
        <span>
          <span style={{ display: "block", fontSize: 14, fontWeight: 700 }}>How did the MPs it funded vote on {area.category} bills?</span>
          <span style={{ display: "block", fontSize: 12.5, color: COLORS.inkSoft, marginTop: 2 }}>Placed in {area.sector}, the closest policy area is {area.category}.</span>
        </span>
        <span aria-hidden="true" style={{ flexShrink: 0, fontSize: 18, color: colour, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>⌄</span>
      </button>

      {open && (
        <div style={{ marginTop: 12 }}>
          {loading && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Looking up their votes…</div>}
          {failed && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>The votes could not be loaded. Try again in a moment.</div>}
          {result && result.bills.length === 0 && (
            <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.55 }}>None of these MPs has a recorded vote on {result.category} bills.</div>
          )}
          {result && result.bills.length > 0 && (
            <>
              <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink, lineHeight: 1.55, margin: "0 0 12px" }}>
                Between them, {result.mpsWithVotes} {result.mpsWithVotes === 1 ? "MP" : "MPs"} voted <strong>aye {result.aye} {result.aye === 1 ? "time" : "times"}</strong> and <strong>no {result.no} {result.no === 1 ? "time" : "times"}</strong> on {result.category} bills.
              </p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
                {shown.map((b) => {
                  const total = b.aye + b.no;
                  return (
                    <li key={b.title} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "4px 14px", alignItems: "center" }}>
                      <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, lineHeight: 1.35, overflowWrap: "anywhere" }}>{b.title}</span>
                      <span style={{ ...numeric, fontSize: 12.5, color: COLORS.inkSoft, whiteSpace: "nowrap" }}>{b.aye} aye · {b.no} no</span>
                      <span aria-hidden="true" style={{ gridColumn: "1 / -1", display: "flex", height: 6, borderRadius: 3, overflow: "hidden", gap: 2, background: COLORS.hairline }}>
                        {b.aye > 0 && <span style={{ flex: b.aye / total, background: "#2F6F4E" }} />}
                        {b.no > 0 && <span style={{ flex: b.no / total, background: "#9C3B3B" }} />}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {result.bills.length > SHOW && (
                <button type="button" onClick={() => setAll(!all)} className="ons-chip" style={{ marginTop: 10, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.accent }}>
                  {all ? "Show fewer" : `Show all ${result.bills.length} votes`}
                </button>
              )}
            </>
          )}
          <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.55, margin: "12px 0 0" }}>
            This is an overlap, not evidence the money changed any vote. Most MPs vote with their party whoever has funded them, and a shared policy area does not show a link. Votes are matched to bills by title and by the department that sponsored the bill, so it is a rough match.
          </p>
        </div>
      )}
    </div>
  );
}
