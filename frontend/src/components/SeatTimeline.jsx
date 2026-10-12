import { useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY } from "../theme";
import { scrollRegion } from "../lib/a11y";
import { GROUPS, shadeFor } from "../lib/electionHistory";
import { loadConstituencies, loadSeatBook } from "../lib/electionData";
import { buildIndex, findSeat, result2024, seatTimeline, summarise } from "../lib/seatNames";
import Loading from "./Loading";

// One seat's winners at every general election since 1950, from the first election it appears in under its present name, with plain facts about
// how often it has changed hands. Used for the seat lookup and for a seat picked on a map.

const para = { fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.6, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 720 };
const short = (g) => GROUPS[g].short ?? GROUPS[g].label;
const label = (id) => (id === "1974a" ? "Feb 1974" : id === "1974b" ? "Oct 1974" : id);
const times = (n) => (n === 1 ? "once" : n === 2 ? "twice" : `${n} times`);

export default function SeatTimeline({ name }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let alive = true;
    Promise.all([loadSeatBook(), loadConstituencies()]).then(([book, cons]) => alive && setData({ book, cons, index: buildIndex(book) }));
    return () => { alive = false; };
  }, []);

  const view = useMemo(() => {
    if (!data) return null;
    const i = findSeat(data.index, name);
    const now = result2024(data.cons, name);
    const line = i >= 0 ? seatTimeline(data.book, i, now?.group ? now : null) : now?.group ? [{ id: "2024", group: now.group, band: now.band }] : [];
    return { i, now, line, facts: line.length ? summarise(line) : null };
  }, [data, name]);

  if (!view) return <Loading />;
  const { line, facts, now } = view;
  const first = line[0];
  const seatName = now?.name ?? name;
  const held = facts ? Object.entries(facts.held).sort((a, b) => b[1] - a[1]) : [];

  return (
    <div aria-live="polite" style={{ marginTop: 16 }}>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, margin: 0, color: COLORS.ink }}>{seatName}</h3>
      {line.length === 0 ? (
        <p style={para}>No general election results were found for a seat called "{name}". Seats are matched by name, so a seat that was renamed or created in 2024 has no earlier results under its new name.</p>
      ) : (
        <>
          <ul {...scrollRegion("Winners by election")} style={{ listStyle: "none", margin: "12px 0 0", padding: "2px 0 8px", display: "flex", gap: 6, overflowX: "auto" }}>
            {line.map((t) => (
              <li key={t.id} style={{ flexShrink: 0, textAlign: "center", minWidth: 54 }}>
                <span title={`${GROUPS[t.group].label}${t.band != null ? `, lead of ${t.band * 5} to ${t.band === 9 ? "50+" : t.band * 5 + 5} points` : ""}`} style={{ display: "block", height: 34, borderRadius: 9, background: shadeFor(GROUPS[t.group].colour, t.band ?? 5), border: `1px solid ${COLORS.hairline}` }} />
                <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 4 }}>{label(t.id)}</span>
                <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.ink, fontWeight: 600 }}>{short(t.group)}</span>
              </li>
            ))}
          </ul>
          <p style={para}>
            {line.length > 1 ? `${seatName} appears under this name at ${line.length} general elections, the first in ${label(first.id)}. ` : `${seatName} only has a result under this name for ${label(first.id)}. `}
            {held.length > 0 && line.length > 1 && `${held.map(([g, n]) => `${GROUPS[g].label} won it ${times(n)}`).join(", ")}. `}
            {facts.changes === 0 && line.length > 1 ? "It has never changed hands in that time. " : facts.changes > 0 ? `It changed hands ${times(facts.changes)}. ` : ""}
            {facts.longest.length > 2 && `The longest unbroken run is ${facts.longest.length} elections for ${GROUPS[facts.longest.group].label}. `}
          </p>
          <p style={{ ...para, fontSize: 12.5 }}>Paler colours were close contests and deeper colours big leads. Boundaries change, so an older result may cover a different area from today's seat.</p>
        </>
      )}
      {now && (
        <p style={{ ...para, marginTop: 8 }}>
          {now.group ? `In 2024: ${GROUPS[now.group].label}${now.runnerUp ? `, ahead of ${now.runnerUp}` : ""}, by ${now.lead.toFixed(1)} points. ` : "There has been a by-election here since 2024. "}
          <a href={`#/constituency/${encodeURIComponent(now.name)}`} style={{ color: COLORS.ink, fontWeight: 700 }}>See this seat in full</a>
        </p>
      )}
    </div>
  );
}
