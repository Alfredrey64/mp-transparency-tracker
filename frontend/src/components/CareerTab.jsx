import { useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric } from "../theme";
import { loadCareerDetail } from "../lib/careerDetail";
import {
  EVENT_KINDS, axisTicks, buildEvents, buildLanes, careerStory, chartRange, duration, monthYear, ms, partyColourByName, summarise,
} from "../lib/careerTimeline";

// The Career tab on a profile: how an MP's career has progressed. A short
// story, headline figures, a swimlane chart of every spell (seats, parties,
// government, shadow front bench, other posts, committees), then the same
// thing as a dated log you can filter. All from Parliament's own biography
// record for the MP.

const LANE_COLOURS = { lords: "#9B4FE0", commons: "#4F46E5", seat: "#4F46E5", gov: "#1FA97C", opp: "#E8A33D", other: "#7B6CF0", committee: "#2F8FBF" };
const ROW = 24;
const LABEL_W = 104;

// Dark text on pale bars, white on dark ones.
function textOn(hex) {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? "#1b1b1b" : "#fff";
}

function Stat({ value, label, note }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ ...numeric, fontSize: 30, fontWeight: 600, lineHeight: 1.05, color: COLORS.ink, letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: COLORS.ink, marginTop: 5 }}>{label}</div>
      {note && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 1, lineHeight: 1.4 }}>{note}</div>}
    </div>
  );
}

function Swimlanes({ detail, now }) {
  const lanes = useMemo(() => buildLanes(detail, now), [detail, now]);
  const range = useMemo(() => chartRange(lanes, now), [lanes, now]);
  const ticks = useMemo(() => axisTicks(range), [range]);
  const span = range.to - range.from;
  const pos = (t) => `${((t - range.from) / span) * 100}%`;
  const lost = detail.l.filter((l) => l[1]);

  if (lanes.length === 0 && lost.length === 0) return null;
  return (
    <div style={{ overflowX: "auto", border: `1px solid ${COLORS.hairline}`, borderRadius: 14, background: COLORS.paperCard }}>
      <div style={{ minWidth: 600, padding: "10px 14px 12px" }}>
        {/* year axis */}
        <div style={{ display: "grid", gridTemplateColumns: `${LABEL_W}px minmax(0, 1fr)`, gap: 10 }}>
          <span />
          <div style={{ position: "relative", height: 18 }}>
            {ticks.map((t) => (
              <span key={t.year} style={{ position: "absolute", left: pos(t.at), transform: "translateX(-50%)", ...numeric, fontSize: 11, color: COLORS.inkSoft }}>{t.year}</span>
            ))}
          </div>
        </div>

        {lanes.map((lane, li) => (
          <div key={lane.key} style={{ display: "grid", gridTemplateColumns: `${LABEL_W}px minmax(0, 1fr)`, gap: 10, alignItems: "start", padding: "6px 0", borderTop: `1px solid ${COLORS.hairline}` }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, paddingTop: 3, position: "sticky", left: 0, background: COLORS.paperCard, zIndex: 2 }}>{lane.label}</div>
            <div style={{ position: "relative", height: lane.rows * ROW }}>
              {ticks.map((t) => (
                <span key={t.year} aria-hidden="true" style={{ position: "absolute", left: pos(t.at), top: 0, bottom: 0, borderLeft: `1px solid ${COLORS.hairline}`, opacity: 0.55 }} />
              ))}
              {lane.items.map((item, i) => {
                const colour = lane.key === "party" ? partyColourByName(item.label) : lane.key === "seat" ? (i % 2 ? "#6D64E8" : "#4F46E5") : LANE_COLOURS[lane.key];
                const widthPct = ((item.to - item.from) / span) * 100;
                const tip = `${item.label}${item.note ? ` (${item.note})` : ""}: ${monthYear(new Date(item.from).toISOString().slice(0, 10))} to ${item.ongoing ? "now" : monthYear(new Date(item.to).toISOString().slice(0, 10))}`;
                return (
                  <div
                    key={`${item.label}-${item.from}-${i}`}
                    className="career-bar"
                    title={tip}
                    style={{
                      position: "absolute", left: pos(item.from), width: `${Math.max(widthPct, 0.5)}%`, top: item.row * ROW + 2, height: ROW - 6,
                      background: colour, color: textOn(colour), borderRadius: item.ongoing ? "4px 10px 10px 4px" : 4, padding: "0 6px", boxSizing: "border-box",
                      fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, lineHeight: `${ROW - 6}px`, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                      animationDelay: `${li * 70 + (i % 8) * 25}ms`,
                    }}
                  >
                    {widthPct > 4 ? item.label : ""}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {lost.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: `${LABEL_W}px minmax(0, 1fr)`, gap: 10, alignItems: "center", padding: "8px 0 2px", borderTop: `1px solid ${COLORS.hairline}` }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, position: "sticky", left: 0, background: COLORS.paperCard, zIndex: 2 }}>Elections lost</div>
            <div style={{ position: "relative", height: 18 }}>
              {lost.map(([seat, date]) => (
                <span
                  key={`${seat}-${date}`}
                  title={`Stood for ${seat} and lost, ${monthYear(date)}`}
                  style={{ position: "absolute", left: pos(ms(date)), top: 3, width: 11, height: 11, marginLeft: -5, background: "#C2415D", transform: "rotate(45deg)", borderRadius: 2 }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Log({ events, now }) {
  const [hidden, setHidden] = useState(() => new Set());
  const [newestFirst, setNewestFirst] = useState(false);
  const counts = useMemo(() => {
    const c = {};
    for (const e of events) c[e.kind] = (c[e.kind] ?? 0) + 1;
    return c;
  }, [events]);
  const shown = useMemo(() => {
    const list = events.filter((e) => !hidden.has(e.kind));
    return newestFirst ? [...list].reverse() : list;
  }, [events, hidden, newestFirst]);
  const groups = useMemo(() => {
    const out = [];
    for (const e of shown) {
      const last = out[out.length - 1];
      if (last && last.year === e.years) last.items.push(e);
      else out.push({ year: e.years, items: [e] });
    }
    return out;
  }, [shown]);
  const kind = (k) => EVENT_KINDS.find((x) => x.key === k);
  const toggle = (k) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 14 }}>
        {EVENT_KINDS.filter((k) => counts[k.key]).map((k) => {
          const on = !hidden.has(k.key);
          return (
            <button
              key={k.key}
              type="button"
              onClick={() => toggle(k.key)}
              aria-pressed={on}
              style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, padding: "5px 11px", borderRadius: 999, cursor: "pointer", border: `1px solid ${on ? k.colour : COLORS.hairline}`, background: on ? `${k.colour}1c` : "transparent", color: on ? COLORS.ink : COLORS.inkSoft }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: on ? k.colour : COLORS.hairline }} />
              {k.label} <span style={{ ...numeric, color: COLORS.inkSoft }}>{counts[k.key]}</span>
            </button>
          );
        })}
        <button type="button" onClick={() => setNewestFirst((v) => !v)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.accent }}>
          {newestFirst ? "Show oldest first" : "Show newest first"}
        </button>
      </div>

      {groups.length === 0 && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Nothing selected. Turn a filter back on.</div>}
      {groups.map((g) => (
        <div key={g.year} style={{ display: "grid", gridTemplateColumns: "56px minmax(0, 1fr)", gap: 14, contentVisibility: "auto", containIntrinsicSize: "auto 120px" }}>
          <div style={{ ...numeric, fontSize: 18, fontWeight: 600, color: COLORS.inkSoft, paddingTop: 10 }}>{g.year}</div>
          <div style={{ borderLeft: `2px solid ${COLORS.hairline}`, paddingLeft: 16, paddingBottom: 6 }}>
            {g.items.map((e, i) => {
              const k = kind(e.kind);
              const single = e.kind === "lost" || e.start === e.end;
              return (
                <div key={`${e.kind}-${e.title}-${e.start}-${i}`} style={{ position: "relative", padding: "9px 0", borderBottom: i === g.items.length - 1 ? "none" : `1px solid ${COLORS.hairline}` }}>
                  <span aria-hidden="true" style={{ position: "absolute", left: -23, top: 15, width: 10, height: 10, borderRadius: "50%", background: k.colour, border: `2px solid ${COLORS.paper}` }} />
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "2px 10px" }}>
                    <span style={{ fontFamily: FONT_BODY, fontSize: 14.5, fontWeight: 600, color: COLORS.ink }}>{e.title}</span>
                    <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: k.colour }}>{k.label}</span>
                  </div>
                  {e.sub && <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 1 }}>{e.sub}</div>}
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>
                    {single ? monthYear(e.start) : `${monthYear(e.start)} to ${e.ongoing ? "now" : monthYear(e.end)}`}
                    {!single && ` · ${duration(e.start, e.end, now)}`}
                    {e.ongoing && !single && <strong style={{ color: COLORS.accent }}> · current</strong>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CareerTab({ politician, house = "commons" }) {
  // A peer's row id in the peers table is their Parliament member id.
  const memberId = house === "lords" ? politician.id : politician.parliament_member_id;
  const [state, setState] = useState({ id: null, detail: null, failed: false });
  const [now] = useState(() => Date.now());

  useEffect(() => {
    if (memberId == null) return;
    let cancelled = false;
    loadCareerDetail(memberId, house)
      .then((detail) => {
        if (!cancelled) setState({ id: memberId, detail, failed: false });
      })
      .catch(() => {
        if (!cancelled) setState({ id: memberId, detail: null, failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [memberId, house]);

  const detail = state.id === memberId ? state.detail : null;
  const loading = memberId != null && state.id !== memberId;
  const summary = useMemo(() => (detail ? summarise(detail, now) : null), [detail, now]);
  const story = useMemo(() => (detail ? careerStory(politician.name, detail, now) : []), [detail, politician.name, now]);
  const events = useMemo(() => (detail ? buildEvents(detail) : []), [detail]);

  if (memberId == null || (!loading && !detail)) {
    return (
      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, padding: "20px 0", textAlign: "center" }}>
        {state.failed ? "Couldn't load this career record just now. Try again in a moment." : "No career record is available for this MP yet."}
      </div>
    );
  }
  if (loading) return <div style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft, padding: "20px 0" }}>Loading career…</div>;

  const hasAnything = events.length > 0;
  const yrs = (n) => (n >= 1 ? `${Math.round(n)} yrs` : n > 0 ? "<1 yr" : "–");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <section>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: COLORS.ink, margin: "0 0 8px" }}>Career so far</h2>
        {story.map((line) => (
          <p key={line} style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.65, color: COLORS.ink, margin: "0 0 4px", maxWidth: 720 }}>{line}</p>
        ))}
        {!hasAnything && <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Parliament's record holds no dated career entries for this MP.</p>}
      </section>

      {hasAnything && summary && (
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "20px 24px", padding: "18px 20px", background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderTop: `3px solid ${COLORS.accent}`, borderRadius: 16 }}>
          {summary.firstElected && <Stat value={summary.firstElected.slice(0, 4)} label="first elected" note={monthYear(summary.firstElected)} />}
          {summary.lordsFrom && <Stat value={yrs(summary.yearsInLords)} label="in the Lords" note={`since ${summary.lordsFrom.slice(0, 4)}`} />}
          {summary.firstElected && <Stat value={yrs(summary.yearsInCommons)} label={summary.lordsFrom ? "as an MP" : "in the Commons"} />}
          {summary.firstElected && <Stat value={summary.electionsWon} label="elections won" note={summary.electionsLost ? `${summary.electionsLost} lost` : undefined} />}
          <Stat value={summary.governmentPosts} label="government posts" note={summary.governmentPosts ? `${yrs(summary.governmentYears)} in government` : undefined} />
          <Stat value={summary.shadowPosts} label="shadow posts" note={summary.shadowPosts ? `${yrs(summary.shadowYears)} on the front bench` : undefined} />
          <Stat value={summary.committees} label="committees" note={summary.committeesNow ? `${summary.committeesNow} now` : undefined} />
          <Stat value={summary.partyChanges} label="party changes" note={summary.partyChanges ? "including spells as an independent" : undefined} />
        </section>
      )}

      {hasAnything && (
        <section>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: COLORS.ink, margin: "0 0 4px" }}>The career on one chart</h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, lineHeight: 1.55, margin: "0 0 12px", maxWidth: 640 }}>
            Each bar is a spell in a seat, a party, a post or a committee. A rounded right end means it is still going. Hover a bar for its dates; scroll sideways on a small screen.
          </p>
          <Swimlanes detail={detail} now={now} />
        </section>
      )}

      {hasAnything && (
        <section>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: COLORS.ink, margin: "0 0 12px" }}>Every step, in order</h2>
          <Log events={events} now={now} />
        </section>
      )}

      <p style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.55, margin: 0 }}>
        From Parliament's Members API biography record. It lists the posts and committees Parliament has recorded, so informal or party-only roles may be missing, and dates can be a
        few days either side of an announcement.
      </p>
    </div>
  );
}
