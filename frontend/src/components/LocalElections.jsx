import { useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING, numeric, readable, solid } from "../theme";
import { PageHeader, LoadFailedNote } from "./shared";
import { IconCalendar, IconSearch } from "./icons";
import { card, cardTitle } from "../lib/onsStyles";
import { longDate, searchCouncils, councilsForCodes, controlColourOf } from "../lib/councils";
import { upcomingDates, biggestDate, atStake, nationOf } from "../lib/localElections";

// Local elections: when your council next votes, what is up for grabs, and which councils vote on each date. Everything comes from
// councilsIndex.json (the same file as the Your council page), so it updates when that does.

const ACCENT = "#1FA97C";
const ink = readable(ACCENT);
const fmt = (n) => Math.round(n).toLocaleString("en-GB");
const field = { fontFamily: FONT_BODY, fontSize: 16, padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, width: "100%", boxSizing: "border-box" };
const para = { fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.65, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 720 };

function When({ council, data }) {
  const a = atStake(council, data.parties);
  const colour = controlColourOf(council.control_by_seats);
  return (
    <div aria-live="polite" style={{ marginTop: 18, padding: "18px 20px", borderRadius: 18, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: `6px solid ${colour}` }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 21, fontWeight: 700, color: COLORS.ink }}>{council.name}</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginTop: 2 }}>{nationOf(council.id)} · {council.control}</div>
      {a ? (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "6px 14px", margin: "14px 0 4px" }}>
            <span style={{ ...numeric, fontSize: "clamp(34px, 7vw, 52px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1, color: COLORS.ink }}>{a.days === 0 ? "Today" : fmt(a.days)}</span>
            {a.days > 0 && <span style={{ fontFamily: FONT_BODY, fontSize: 15, color: COLORS.inkSoft }}>{a.days === 1 ? "day" : "days"} to go</span>}
          </div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: COLORS.ink }}>{a.dateText}</div>
          <p style={{ ...para, color: COLORS.ink }}>{a.scope}</p>
          <p style={para}>{a.control}</p>
        </>
      ) : (
        <p style={para}>No future election date is recorded for this council.</p>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
        <a className="ons-tap" href={`#/councils/${council.id}`} style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: ink, textDecoration: "none", padding: "9px 16px", borderRadius: 999, border: `1px solid ${ACCENT}66`, background: `${ACCENT}12` }}>See the councillors</a>
        <a className="ons-tap" href="#/howtovote" style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: ink, textDecoration: "none", padding: "9px 16px", borderRadius: 999, border: `1px solid ${ACCENT}66`, background: `${ACCENT}12` }}>How to vote</a>
      </div>
    </div>
  );
}

function Finder({ data }) {
  const [query, setQuery] = useState("");
  const [postcode, setPostcode] = useState("");
  const [picked, setPicked] = useState(null);
  const [state, setState] = useState({ busy: false, error: null });
  const matches = useMemo(() => (picked ? [] : searchCouncils(data.index, query, 6)), [data.index, query, picked]);

  async function lookUp(e) {
    e.preventDefault();
    if (!postcode.trim()) return;
    setState({ busy: true, error: null });
    try {
      const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.trim())}`);
      const json = await res.json();
      if (!res.ok || json.status !== 200) { setState({ busy: false, error: "We couldn't find that postcode. Check it is a full, valid UK postcode." }); return; }
      const { district, county } = councilsForCodes(data.index, json.result.codes);
      const main = district ?? county;
      if (!main) { setState({ busy: false, error: "We found the area but could not match it to a council. Try searching by name instead." }); return; }
      setPicked(main);
      setQuery(main.name);
      setState({ busy: false, error: null });
    } catch {
      setState({ busy: false, error: "The postcode lookup is not working right now. Try searching by council name instead." });
    }
  }

  return (
    <section aria-labelledby="h-when" style={{ ...card, marginTop: 24 }}>
      <h2 id="h-when" style={cardTitle}>When do I next vote?</h2>
      <p style={para}>Search for your council, or look it up by postcode. Nothing you type is stored.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: "16px 22px", marginTop: 16 }}>
        <form onSubmit={lookUp}>
          <label htmlFor="le-pc" style={{ display: "block", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 6 }}>Your postcode</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input id="le-pc" value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="For example SW1A 1AA" autoComplete="postal-code" style={field} />
            <button type="submit" disabled={state.busy} className="ons-chip" style={{ fontFamily: FONT_BODY, fontSize: 14.5, fontWeight: 700, color: "#fff", background: solid(ACCENT), border: "none", borderRadius: 12, padding: "0 18px", cursor: "pointer", flexShrink: 0 }}>{state.busy ? "Looking…" : "Find"}</button>
          </div>
          {state.error && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#B3382E", marginTop: 8 }}>{state.error}</div>}
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 7 }}>Looked up once with postcodes.io. Your postcode isn&apos;t stored.</div>
        </form>
        <div>
          <label htmlFor="le-name" style={{ display: "block", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 6 }}>Or a council name</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: ink, display: "flex" }}><IconSearch size={16} /></span>
            <input id="le-name" type="search" value={query} onChange={(e) => { setQuery(e.target.value); setPicked(null); }} placeholder="For example Hackney or Kent" autoComplete="off" style={{ ...field, paddingLeft: 38 }} />
          </div>
          {matches.length > 0 && (
            <ul style={{ listStyle: "none", margin: "6px 0 0", padding: 0, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, overflow: "hidden", background: COLORS.paperCard }}>
              {matches.map((c) => (
                <li key={c.id} style={{ borderTop: `1px solid ${COLORS.hairline}` }}>
                  <button type="button" onClick={() => { setPicked(c); setQuery(c.name); }} style={{ display: "flex", justifyContent: "space-between", gap: 10, width: "100%", textAlign: "left", background: "none", border: "none", padding: "10px 14px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 14.5, color: COLORS.ink }}>
                    <strong>{c.name}</strong><span style={{ color: COLORS.inkSoft, fontSize: 12.5 }}>{nationOf(c.id)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {picked && <When council={picked} data={data} />}
    </section>
  );
}

function DateCard({ group, first, big }) {
  const nations = Object.entries(group.nations).sort((a, b) => b[1] - a[1]);
  return (
    <li style={{ padding: "16px 18px", borderRadius: 18, background: first ? `linear-gradient(160deg, ${ACCENT}22, ${COLORS.paperCard} 70%)` : COLORS.paperCard, border: `1px solid ${first ? `${ACCENT}77` : COLORS.hairline}` }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: "4px 12px" }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 21, fontWeight: 700, color: COLORS.ink }}>{longDate(group.date)}</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: first ? ink : COLORS.inkSoft }}>{group.days === 0 ? "Today" : `${fmt(group.days)} ${group.days === 1 ? "day" : "days"} to go`}</div>
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink, margin: "6px 0 10px", lineHeight: 1.5 }}>
        <strong style={{ ...numeric, fontSize: 20 }}>{fmt(group.councils.length)}</strong> {group.councils.length === 1 ? "council" : "councils"}, <strong style={{ ...numeric, fontSize: 20 }}>{fmt(group.seats)}</strong> seats
        {big && <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 700, color: "#fff", background: solid(ACCENT), borderRadius: 999, padding: "2px 10px", whiteSpace: "nowrap" }}>Biggest day</span>}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {nations.map(([n, c]) => <span key={n} style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: "2px 10px" }}>{n}: {c}</span>)}
      </div>
      <details style={{ marginTop: 12 }}>
        <summary className="ons-tap" style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700, color: ink, cursor: "pointer", padding: "6px 0" }}>See which councils vote</summary>
        <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(210px, 100%), 1fr))", gap: "4px 14px" }}>
          {group.councils.map((c) => (
            <li key={c.id}>
              <a href={`#/councils/${c.id}`} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, textDecoration: "none", padding: "5px 0" }}>
                <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: controlColourOf(c.controlKey), flexShrink: 0 }} />
                {c.name}
              </a>
            </li>
          ))}
        </ul>
      </details>
    </li>
  );
}

export default function LocalElections() {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    import("../data/councilsIndex.json").then((m) => alive && setData(m.default)).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, []);
  const dates = useMemo(() => (data ? upcomingDates(data.index) : []), [data]);
  const big = useMemo(() => biggestDate(dates), [dates]);
  const soonest = dates[0];

  return (
    <div style={{ maxWidth: 940, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={IconCalendar} kicker="Your say" title="Local elections" subtitle="When your council next votes, what is up for grabs, and how many councils vote on each date." />
      {failed && <LoadFailedNote item="the council data" />}
      {!failed && !data && <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft }}>Loading the dates…</p>}
      {data && (
        <>
          {big && (
            <section aria-label="The next big election day" style={{ ...card, marginTop: 4, padding: "clamp(20px, 4vw, 30px)", background: `radial-gradient(560px 260px at 100% 0%, ${ACCENT}33, transparent 70%), ${COLORS.paperCard}` }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: ink }}>The next big election day</div>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "6px 16px", margin: "6px 0 8px" }}>
                <span style={{ ...numeric, fontSize: "clamp(48px, 10vw, 84px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 0.95, color: COLORS.ink }}>{fmt(big.days)}</span>
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(18px, 3vw, 24px)", color: COLORS.ink }}>days to {longDate(big.date)}</span>
              </div>
              <p style={{ ...para, color: COLORS.ink }}>On that day <strong>{fmt(big.councils.length)} councils</strong> hold elections, with <strong>{fmt(big.seats)} seats</strong> up for election.{soonest && soonest.date !== big.date ? ` The first vote of all is on ${longDate(soonest.date)}, in ${soonest.councils.length === 1 ? "one council" : `${soonest.councils.length} councils`}.` : ""}</p>
            </section>
          )}

          <Finder data={data} />

          <section aria-labelledby="h-dates" style={{ marginTop: 26 }}>
            <h2 id="h-dates" style={{ ...cardTitle, fontSize: 24 }}>Every upcoming election date</h2>
            <p style={para}>Some councils elect everyone at once, every four years. Others elect a third or a half at a time, so they vote more often but change more slowly.</p>
            <ol style={{ listStyle: "none", margin: "16px 0 0", padding: 0, display: "grid", gap: 12 }}>
              {dates.map((g, i) => <DateCard key={g.date} group={g} first={i === 0} big={big && g.date === big.date} />)}
            </ol>
          </section>

          <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.6, color: COLORS.inkSoft, marginTop: 24, maxWidth: 780 }}>
            Dates come from Open Council Data UK (CC BY-SA 4.0), updated {data.generatedAt ? longDate(data.generatedAt.slice(0, 10)) : "regularly"}. Elections can be moved, for example while councils are being merged, so check with your council for the final date. To vote, you need to be registered: see <a href="#/howtovote" style={{ color: COLORS.inkSoft }}>How to vote</a>.
          </p>
        </>
      )}
    </div>
  );
}
