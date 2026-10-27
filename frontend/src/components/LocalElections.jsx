import { useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING, numeric, readable, solid } from "../theme";
import { PageHeader } from "./shared";
import { LoadFailedNote } from "./MpCards";
import { IconCalendar, IconSearch } from "./icons";
import { card, cardTitle } from "../lib/onsStyles";
import { longDate, searchCouncils, councilsForCodes, controlColourOf } from "../lib/councils";
import { upcomingDates, biggestDate, atStake, nationOf } from "../lib/localElections";
import CountUp from "./CountUp";
import "../localelections.css";

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
    <div aria-live="polite" style={{ marginTop: 18, padding: "18px 20px", borderRadius: 14, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: `6px solid ${colour}` }}>
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
        <a className="ons-tap" href="#/myBallot" style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: ink, textDecoration: "none", padding: "9px 16px", borderRadius: 999, border: `1px solid ${ACCENT}66`, background: `${ACCENT}12` }}>Who is standing</a>
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
          {state.error && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: readable("#B3382E"), marginTop: 8 }}>{state.error}</div>}
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

const NATION_COLOUR = { England: "#D4432F", Scotland: "#2A6FDB", Wales: "#1E9E5F", "Northern Ireland": "#E08A00" };
const STRIPE = ["#1FA97C", "#2A6FDB", "#7A5AF0", "#E0367A", "#E08A00", "#0E9AA7"];

function DateCard({ group, first, big, index, mostSeats }) {
  const nations = Object.entries(group.nations).sort((a, b) => b[1] - a[1]);
  const stripe = STRIPE[index % STRIPE.length];
  return (
    <li id={`le-d-${group.date}`} className="le-date" data-first={first ? "1" : "0"} style={{ "--sc": stripe, "--i": Math.min(index, 8) }}>
      <div className="le-date-top">
        <div className="le-date-name">{longDate(group.date)}</div>
        <div className="le-date-days">{group.days === 0 ? "Today" : `${fmt(group.days)} ${group.days === 1 ? "day" : "days"} to go`}</div>
      </div>
      <div className="le-date-figs">
        <span><strong>{fmt(group.councils.length)}</strong> {group.councils.length === 1 ? "council" : "councils"}</span>
        <span><strong>{fmt(group.seats)}</strong> seats</span>
        {big && <span className="le-badge">Biggest day</span>}
      </div>
      <div className="le-meter" role="img" aria-label={`${fmt(group.seats)} seats, ${Math.round((group.seats / mostSeats) * 100)}% of the biggest day`}><i style={{ "--w": Math.max(group.seats / mostSeats, 0.02) }} /></div>
      <div className="le-nations">
        {nations.map(([n, c]) => <span key={n}><i style={{ background: NATION_COLOUR[n] ?? COLORS.inkSoft }} />{n}: {c}</span>)}
      </div>
      <details className="le-more">
        <summary className="ons-tap">See which councils vote</summary>
        <ul>
          {group.councils.map((c) => (
            <li key={c.id}>
              <a href={`#/councils/${c.id}`}>
                <span aria-hidden="true" style={{ background: controlColourOf(c.controlKey) }} />
                {c.name}
              </a>
            </li>
          ))}
        </ul>
      </details>
    </li>
  );
}

// The next election days as columns: the taller the column, the more seats are up that day. Pressing one jumps to its card.
function Skyline({ dates }) {
  const shown = dates.slice(0, 8);
  const most = Math.max(...shown.map((g) => g.seats), 1);
  const go = (date) => document.getElementById(`le-d-${date}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  return (
    <section aria-labelledby="h-sky" className="le-sky">
      <h2 id="h-sky" style={{ ...cardTitle, fontSize: 22 }}>Seats up for election, date by date</h2>
      <p style={para}>The taller the column, the more council seats are up on that day. Press one to see the details.</p>
      <ol className="le-cols">
        {shown.map((g, i) => (
          <li key={g.date} style={{ "--sc": STRIPE[i % STRIPE.length], "--i": i }}>
            <button type="button" onClick={() => go(g.date)} aria-label={`${longDate(g.date)}: ${fmt(g.seats)} seats in ${fmt(g.councils.length)} councils`}>
              <span className="le-col-n">{fmt(g.seats)}</span>
              <span className="le-col-track"><i style={{ height: `${Math.max((g.seats / most) * 100, 4)}%` }} /></span>
              <span className="le-col-d">{new Date(`${g.date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit", timeZone: "UTC" })}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
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
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={IconCalendar} kicker="Your say" title="Local elections" subtitle="When your council next votes, what is up for grabs, and how many councils vote on each date." />
      {failed && <LoadFailedNote item="the council data" />}
      {!failed && !data && <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft }}>Loading the dates…</p>}
      {data && (
        <>
          {big && (
            <section aria-label="The next big election day" className="le-hero">
              <div className="le-hero-kicker">The next big election day</div>
              <div className="le-hero-count">
                <span className="le-hero-n"><CountUp value={big.days} format={(n) => fmt(n)} duration={1.4} /></span>
                <span className="le-hero-t">days to {longDate(big.date)}</span>
              </div>
              <div className="le-hero-stats">
                <span><strong>{fmt(big.councils.length)}</strong> councils vote</span>
                <span><strong>{fmt(big.seats)}</strong> seats up for election</span>
                <span><strong>{Object.keys(big.nations).length}</strong> {Object.keys(big.nations).length === 1 ? "nation" : "nations"}</span>
              </div>
              {soonest && soonest.date !== big.date && (
                <p className="le-hero-note">The very next vote is sooner: <strong>{longDate(soonest.date)}</strong>, with {fmt(soonest.councils.length)} {soonest.councils.length === 1 ? "council" : "councils"}.</p>
              )}
            </section>
          )}

          <Finder data={data} />

          {dates.length > 1 && <Skyline dates={dates} />}

          <section aria-labelledby="h-dates" style={{ marginTop: 26 }}>
            <h2 id="h-dates" style={{ ...cardTitle, fontSize: 24 }}>Every upcoming election date</h2>
            <p style={para}>Some councils elect everyone at once, every four years. Others elect a third or a half at a time, so they vote more often but change more slowly.</p>
            <ol style={{ listStyle: "none", margin: "16px 0 0", padding: 0, display: "grid", gap: 12 }}>
              {dates.map((g, i) => <DateCard key={g.date} group={g} first={i === 0} big={big && g.date === big.date} index={i} mostSeats={Math.max(...dates.map((d) => d.seats), 1)} />)}
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
