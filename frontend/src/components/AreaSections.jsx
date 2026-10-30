/** @jsxImportSource react */
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import { useInView } from "motion/react";
import CountUp from "./CountUp";
import { firstTab } from "../lib/mpDoing";
import { debateKind, contributionWords, departmentInfo, questionStatus, connections, NO_WHY } from "../lib/mpContext";
import { explainDivision, describeVote } from "../lib/divisionExplainer";
import { summariseBill, billSearchUrl } from "../lib/billSummary";
import { plainPoints } from "../lib/billPlain";
import { explainStage } from "../lib/billExplain";
import { HISTORY_COLOURS, HISTORY_LABELS, HKEYS } from "./councilsUi";
import { hexPoints } from "../lib/seatMap";
import regionGeo from "../data/regionMap.json";
import { IconPinHome, IconSearch, IconCouncil, IconVote, IconHexMap, IconTrend, IconCalendar, IconPetition, IconHouse, IconShield } from "./icons";
import { ordinal } from "../lib/constituency";
import { shortParty } from "../lib/seatElections";
import { againstUk } from "../lib/seatLocal";
import { formatValue, periodLabel } from "../lib/onsFormat";
import { longDate } from "../lib/councils";
import { daysUntil } from "../lib/localElections";
import { buildIcs, electionEvents, downloadIcs } from "../lib/calendar";
import { taxYear, tenthWords, seatStory, seatHeadline } from "../lib/areaProfile";

// The sections of the Your area page that come from the files saved with the site rather than from the postcode lookup. They load after the page is
// drawn, each on its own, so a slow or missing file leaves one card saying so and nothing else.

const money = (n) => `£${Math.round(n).toLocaleString("en-GB")}`;
const hex = (c, fallback = "#8A94A6") => (c ? `#${String(c).replace(/^#/, "")}` : fallback);
const plural = (n, one, many) => `${n.toLocaleString("en-GB")} ${n === 1 ? one : many}`;

// Each card and section notes when it has first scrolled into view, so its bars, lines and numbers can draw themselves once, at the moment they can be seen.
function useSeen(margin = "0px 0px -12% 0px") {
  const ref = useRef(null);
  const seen = useInView(ref, { once: true, margin });
  return [ref, seen];
}

export function Card({ i, colour, icon, title, className = "", children }) {
  const [ref, seen] = useSeen();
  return (
    <div ref={ref} className={`ma-card ${className}`} role="region" data-in={seen} style={{ "--mc": colour, "--i": i }} aria-label={title}>
      <header><span className="ma-icon" aria-hidden="true">{icon}</span><h3>{title}</h3></header>
      {children}
    </div>
  );
}

export function Section({ id, title, lede, colour, children }) {
  const [ref, seen] = useSeen("0px 0px -8% 0px");
  return (
    <section ref={ref} className="ma-section" id={id} data-in={seen} aria-labelledby={`${id}-h`} style={{ "--mc": colour }}>
      <header><h2 id={`${id}-h`}>{title}</h2>{lede && <p>{lede}</p>}</header>
      <div className="ma-bento">{children}</div>
    </section>
  );
}

const Skel = ({ lines = 3 }) => <div className="ma-skel" aria-hidden="true">{Array.from({ length: lines }, (_, n) => <i key={n} style={{ width: `${92 - n * 14}%` }} />)}</div>;
const Missing = ({ children }) => <p className="ma-sub">{children}</p>;

// Six facts across the top, the ones most people ask first.
export function Glance({ data, x }) {
  const { result: r, council, regionName } = data;
  if (!x || x.seat === undefined || x.tax === undefined || x.snapshot === undefined) return <div className="ma-glance" aria-hidden="true">{Array.from({ length: 6 }, (_, n) => <div key={n} className="ma-g ma-g-skel"><Skel lines={2} /></div>)}</div>;
  const s = x.seat;
  const pay = x.snapshot.find((m) => m.metric.id === "pay");
  const nextDate = x.contests?.[0]?.date ?? council?.next?.[0]?.[0] ?? null;
  const days = nextDate ? daysUntil(nextDate) : null;
  const up = (value, format) => <CountUp value={value} format={format} />;
  const tiles = [
    s && { c: "#3F6FD8", label: "Your MP's majority", value: up(s.result.majority), sub: `${s.safety?.label ?? "Seat"}. ${s.standing ? `The ${ordinal(s.standing.rankNarrowest)} narrowest of ${s.standing.of}.` : ""}` },
    s?.turnout && { c: "#1FA97C", label: `Turnout ${s.when.in}`, value: up(s.turnout.pct, (n) => `${n.toFixed(1)}%`), sub: s.turnout.average ? `The average seat was ${s.turnout.average.toFixed(1)}%.` : "" },
    x.tax && { c: "#E8741A", label: `Band D council tax, ${taxYear(x.tax.to)}`, value: up(x.tax.last, money), sub: `The England average is ${money(x.tax.average)}.` },
    !x.tax && council && { c: "#E8741A", label: "Who runs your council", value: council.control, sub: `${council.total} councillors.` },
    x.nb && { c: "#C0478A", label: "Your neighbourhood", value: ordinal(x.nb.decile) + " tenth", sub: x.nb.decile === 1 ? `Among the most deprived tenth in ${x.nb.nation}.` : `1st is the most deprived tenth in ${x.nb.nation}.` },
    pay && { c: "#7A5AF0", label: `Typical pay in ${regionName}`, value: up(pay.value, (n) => formatValue(pay.metric.format, n)), sub: pay.uk != null ? `${againstUk(pay.value, pay.uk)}.`.replace(/^./, (c) => c.toUpperCase()) : "" },
    days !== null && { c: "#E0367A", label: "Next election here", value: days <= 0 ? "Today" : up(days, (n) => plural(Math.round(n), "day", "days")), sub: longDate(nextDate) },
  ].filter(Boolean).slice(0, 6);
  return (
    <div className="ma-glance" role="list" aria-label={`At a glance in ${r.parliamentary_constituency}`}>
      {tiles.map((t, n) => (
        <div key={t.label} className="ma-g" role="listitem" style={{ "--mc": t.c, "--n": n }}>
          <span>{t.label}</span><b>{t.value}</b>{t.sub && <small>{t.sub}</small>}
        </div>
      ))}
    </div>
  );
}

const JUMPS = [["ma-mp", "MP and seat"], ["ma-council", "Council"], ["ma-place", "Neighbourhood"], ["ma-region", "Region"], ["ma-vote", "Elections"], ["ma-act", "Get help"]];

// Stays under the header while the page scrolls, and marks the section being read.
export function JumpNav() {
  const [active, setActive] = useState(null);
  useEffect(() => {
    if (typeof IntersectionObserver !== "function") return undefined;
    const seen = new Map();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) seen.set(e.target.id, e.isIntersecting);
      setActive(JUMPS.map(([id]) => id).find((id) => seen.get(id)) ?? null);
    }, { rootMargin: "-30% 0px -60% 0px" });
    for (const [id] of JUMPS) { const el = document.getElementById(id); if (el) io.observe(el); }
    return () => io.disconnect();
  }, []);
  const go = (id) => {
    const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };
  return (
    <nav className="ma-jump" aria-label="Sections of this page">
      {JUMPS.map(([id, label]) => <button key={id} type="button" aria-current={active === id ? "true" : undefined} onClick={() => go(id)}>{label}</button>)}
    </nav>
  );
}

// How the seat voted. Left: every candidate's share and the facts around it. Right: how close it was against every seat, and what it would take to change the winner.
export function SeatResult({ x, name, i }) {
  const s = x?.seat;
  const second = s?.candidates?.[1];
  return (
    <Card i={i} colour="#3F6FD8" icon={<IconHexMap size={20} />} title={`How ${name} voted ${s?.when?.in ?? "in 2024"}`} className="ma-result">
      {x?.seat === undefined ? <Skel lines={5} /> : !s ? <Missing>No saved result for this seat.</Missing> : (
        <div className="ma-result-grid">
          <div className="ma-result-main">
            <ul className="ma-cands">
              {s.candidates.slice(0, 6).map((c, n) => (
                <li key={`${c.name}-${c.party}`} style={{ "--pc": hex(c.colour), "--w": c.share, "--n": n }}>
                  <span className="ma-cand-name"><b>{c.name}</b><small>{c.party}</small></span>
                  <span className="ma-cand-bar" aria-hidden="true"><i /></span>
                  <span className="ma-cand-pct"><b>{(c.share * 100).toFixed(1)}%</b><small>{c.votes.toLocaleString("en-GB")} votes</small></span>
                </li>
              ))}
            </ul>
            {s.others && <p className="ma-sub">All other candidates together won {(s.others.share * 100).toFixed(1)}% of the vote ({s.others.votes.toLocaleString("en-GB")} votes). Only the leading candidates are shown above.</p>}
            {s.when.byElection && <p className="ma-sub">This seat voted again at a by-election, so these are the by-election figures. Its 2024 general election result is no longer the current one.</p>}
            <dl className="ma-trio">
              <div><dt>Won by</dt><dd>{s.result.majority.toLocaleString("en-GB")}</dd><small>votes ({s.result.majorityPct.toFixed(1)} points)</small></div>
              <div><dt>Turnout</dt><dd>{s.turnout ? `${s.turnout.pct.toFixed(1)}%` : "Not saved"}</dd><small>{s.turnout ? `${ordinal(s.turnout.rank)} highest of ${s.turnout.of} seats` : ""}</small></div>
              <div><dt>Voters on the register</dt><dd>{s.result.electorate ? s.result.electorate.toLocaleString("en-GB") : "Not saved"}</dd><small>{s.result.turnout ? `${s.result.turnout.toLocaleString("en-GB")} voted` : ""}</small></div>
            </dl>
            {s.safety && <p className="ma-callout"><strong>{s.safety.label}.</strong> {s.safety.blurb} This site calls a lead of under 5 points marginal and over 20 safe. These are our bands, not an official rule.</p>}
          </div>
          <div className="ma-result-side">
            <h4>How close it was, against every seat</h4>
            <LeadChart bins={s.bins} majorityPct={s.result.majorityPct} />
            {s.national?.changedHands && (
              <p className="ma-sub">At the 2024 general election {s.national.changedHands} of {s.national.total} seats changed party{s.national.underHalf ? `, and ${s.national.underHalf} were won with less than half the vote` : ""}.</p>
            )}
            {second && (
              <>
                <h4>What it would take to change the winner</h4>
                <dl className="ma-trio ma-trio-2">
                  <div><dt>Swing</dt><dd>{(s.result.majorityPct / 2).toFixed(1)} points</dd><small>moving from {shortParty(s.candidates[0].party)} to {shortParty(second.party)}</small></div>
                  <div><dt>Voters changing sides</dt><dd>{(Math.floor(s.result.majority / 2) + 1).toLocaleString("en-GB")}</dd><small>{s.result.turnout ? `about ${Math.max(1, Math.round(((Math.floor(s.result.majority / 2) + 1) / s.result.turnout) * 100))}% of those who voted` : ""}</small></div>
                </dl>
                <p className="ma-sub">A voter who switches takes one vote from the winner and gives it to the runner-up, so the gap closes by two. This counts only those two parties.</p>
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

// How this seat's lead compares with every seat's: one bar for each five points of the vote, with this seat's marked.
function LeadChart({ bins, majorityPct }) {
  const top = Math.max(...bins.counts, 1);
  return (
    <figure className="ma-lead">
      <div className="ma-lead-bars" role="img" aria-label={`Seats grouped by the winner's lead. Yours, at ${majorityPct.toFixed(1)} points, is in the group marked.`}>
        {bins.counts.map((n, i) => <span key={i} className={i === bins.mineBin ? "me" : ""} style={{ "--h": n / top }}>{i === bins.mineBin && <em>You</em>}<i /></span>)}
      </div>
      <p className="ma-lead-scale" aria-hidden="true"><span>Close</span><span>{bins.step * (bins.counts.length - 1)}+ points ahead</span></p>
      <figcaption>Each bar is the number of seats whose winner led by that many points of the vote.</figcaption>
    </figure>
  );
}

// Who has won here: three facts, every election as a pair of columns (the winner's share against the runner-up's), and a ribbon of the MPs the seat has had.
export function SeatHistory({ x, mp, i }) {
  const s = x?.seat;
  const story = s ? seatStory(s, mp) : null;
  const head = story ? seatHeadline({ story, runs: s.runs, safety: s.safety, lead: s.result.majorityPct }) : null;
  const maxShare = s ? Math.max(40, ...s.runs.flatMap((r) => [r.share ?? 0, r.second?.share ?? 0])) : 100;
  const totalYears = story ? story.tenures.reduce((n, m) => n + m.years, 0) : 0;
  return (
    <Card i={i} colour="#7A5AF0" icon={<IconCalendar size={20} />} title="Who has won here" className="ma-history">
      {x?.seat === undefined ? <Skel lines={6} /> : !s || !story ? <Missing>No election history is saved for this seat.</Missing> : (
        <>
          {head && <div className="ma-story" style={{ "--pc": hex(s.runs.at(-1)?.colour) }}><b>{head.head}</b>{head.sub && <span>{head.sub}</span>}</div>}
          <dl className="ma-trio ma-trio-3 ma-tiles3">
            <div style={{ "--pc": hex(s.runs.at(-1)?.colour) }}><dt>Held by</dt><dd>{story.heldFor && story.heldFor.years >= 1 ? <><CountUp value={Math.round(story.heldFor.years)} /> <em>years</em></> : shortParty(story.streak.party)}</dd><small>{story.heldFor && story.heldFor.years >= 1 ? `by the ${story.heldFor.party}, since ${story.heldFor.since.slice(0, 4)}` : `won in ${story.streak.since}`}</small></div>
            <div style={{ "--pc": "#7A5AF0" }}><dt>Changed hands</dt><dd><CountUp value={story.changed} /> <em>{story.changed === 1 ? "time" : "times"}</em></dd><small>{s.runs.length > 1 ? `in ${s.runs.length} elections since ${s.runs[0].year}` : "only one result compares"}</small></div>
            <div style={{ "--pc": "#1FA97C" }}><dt>Biggest lead</dt><dd>{story.biggest ? <><CountUp value={Math.round(story.biggest.lead)} /> <em>points</em></> : "None"}</dd><small>{story.biggest ? `${shortParty(story.biggest.party)} in ${story.biggest.year}` : ""}</small></div>
          </dl>
          {s.runs.length >= 3 ? (
            <>
              <div className="ma-elect" role="img" aria-label={`The winner's share of the vote at each election since ${s.runs[0].year}, against the runner-up's`}>
                {s.runs.map((e, n) => (
                  <div key={e.year} className="ma-elect-col" style={{ "--n": n }}>
                    <em>{e.share != null ? `${Math.round(e.share)}%` : ""}</em>
                    <span className="ma-elect-pair">
                      <i style={{ "--h": (e.share ?? 0) / maxShare, "--pc": hex(e.colour) }} title={`${e.party}, ${e.share != null ? e.share.toFixed(1) : "?"}%`} />
                      {e.second && <i className="second" style={{ "--h": (e.second.share ?? 0) / maxShare, "--pc": hex(e.second.colour) }} title={`${e.second.party}, ${e.second.share != null ? e.second.share.toFixed(1) : "?"}%`} />}
                    </span>
                    <b>{shortParty(e.party)}</b>
                    <small>{e.year}</small>
                  </div>
                ))}
              </div>
              <p className="ma-sub ma-elect-note">Each pair is the winner's share of the vote (left) and the runner-up's (right).</p>
            </>
          ) : (
            <>
              <div className="ma-elect" role="img" aria-label={`Share of the vote won by each of the leading candidates ${s.when.in}`}>
                {s.candidates.slice(0, 5).map((c, n) => (
                  <div key={`${c.name}-${c.party}`} className="ma-elect-col" style={{ "--n": n }}>
                    <em>{(c.share * 100).toFixed(0)}%</em>
                    <span className="ma-elect-pair"><i style={{ "--h": c.share / Math.max(0.4, s.candidates[0].share), "--pc": hex(c.colour) }} title={`${c.name}, ${c.party}`} /></span>
                    <b>{shortParty(c.party)}</b>
                    <small>{c.name.split(" ").at(-1)}</small>
                  </div>
                ))}
              </div>
              <p className="ma-sub ma-elect-note">Only the {s.runs[0].year} result is saved for this seat, as many seats had their boundaries redrawn in 2024, so this shows who stood in it.</p>
            </>
          )}
          {story.tenures.length > 0 && (
            <>
              <h4>Who has been its MP</h4>
              <ol className="ma-tenure" aria-label="MPs for this seat, oldest first">
                {story.tenures.map((m, n) => (
                  <li key={`${m.name}-${m.start}`} className={m.current ? "now" : ""} style={{ "--pc": hex(m.colour), "--g": Math.max(0.6, m.years) , "--n": n }} title={`${m.name}, ${m.party}`}>
                    <i aria-hidden="true" />
                    <b>{m.name.replace(/^(Rt Hon |Dr |Sir |Dame |Ms |Mr |Mrs |Miss )+/i, "")}</b>
                    <small>{m.start.slice(0, 4)} to {m.current ? "now" : m.end.slice(0, 4)}</small>
                  </li>
                ))}
              </ol>
              {story.longest && totalYears > 0 && <p className="ma-sub">{story.longest.current ? "The current MP is the longest serving of those listed" : `${story.longest.name.replace(/^(Rt Hon |Dr |Sir |Dame |Ms |Mr |Mrs |Miss )+/i, "")} served longest of those listed`}, at about {Math.round(story.longest.years)} years.</p>}
            </>
          )}
        </>
      )}
    </Card>
  );
}

// A meter from the most to the least of 650 (or 543) seats, with a marker where this seat falls.
function RankMeter({ label, value, rank, of, low, high }) {
  const at = of > 1 ? ((rank - 1) / (of - 1)) * 100 : 50;
  return (
    <li className="ma-meter">
      <span className="ma-meter-top"><b>{label}</b><em>{value}</em></span>
      <span className="ma-meter-track" role="img" aria-label={`${label}: ${ordinal(rank)} of ${of}`}><i style={{ "--at": `${at}%` }} /><u style={{ "--at": `${at}%` }} /></span>
      <span className="ma-meter-ends" aria-hidden="true"><small>{low}</small><small>{high}</small></span>
    </li>
  );
}

// The seat as a card of its own: its name and who holds it, then where it ranks among all the seats on four things.
export function SeatCard({ x, name, mp, mpColour, i }) {
  const s = x?.seat;
  const win = s?.candidates?.[0];
  return (
    <Card i={i} colour="#1FA97C" icon={<IconHexMap size={20} />} title="Your constituency" className="ma-seat">
      <div className="ma-seat-head" style={{ "--pc": hex(win?.colour, mpColour ?? "#1FA97C") }}>
        <small>One of 650 seats</small>
        <b>{name}</b>
        {mp && <span><i aria-hidden="true" />{mp.name}, {mp.party}</span>}
      </div>
      {x?.seat === undefined ? <Skel lines={4} /> : (
        <ul className="ma-meters">
          {s?.result?.electorate && <li className="ma-meter-plain"><span>Voters on the register</span><b><CountUp value={s.result.electorate} /></b></li>}
          {s?.standing && <RankMeter label="How close the result was" value={`${ordinal(s.standing.rankNarrowest)} narrowest of ${s.standing.of}`} rank={s.standing.rankNarrowest} of={s.standing.of} low="Closest" high="Safest" />}
          {s?.turnout && <RankMeter label="Turnout" value={`${ordinal(s.turnout.rank)} highest of ${s.turnout.of}`} rank={s.turnout.rank} of={s.turnout.of} low="Highest" high="Lowest" />}
          {x.seatDep && <RankMeter label="Deprivation" value={`${ordinal(x.seatDep.rank)} most affected of ${x.seatDep.of}`} rank={x.seatDep.rank} of={x.seatDep.of} low="Most affected" high="Least" />}
        </ul>
      )}
      <a className="ma-link" href={`#/constituency/${encodeURIComponent(name)}`}>Everything on this seat</a>
    </Card>
  );
}

// One line of the feed that opens, with a smooth slide, to say in plain English what it is. Only one is open at a time.
function Entry({ id, open, onToggle, date, title, chips, n, children }) {
  return (
    <li className="ma-entry" data-open={open} style={{ "--n": n }}>
      <button type="button" className="ma-entry-head" aria-expanded={open} aria-controls={`ma-e-${id}`} onClick={onToggle}>
        <span className="ma-entry-text">
          {date && <span className="ma-feed-date">{date}</span>}
          <b>{title}</b>
          {chips}
        </span>
        <span className="ma-entry-more" aria-hidden="true"><i /></span>
        <span className="sr-only">{open ? "Hide the explanation" : "Explain this in plain English"}</span>
      </button>
      <div className="ma-entry-body" id={`ma-e-${id}`} inert={!open}><div className="ma-entry-inner">{children}</div></div>
    </li>
  );
}

const Block = ({ title, children }) => <div className="ma-ctx"><h6>{title}</h6>{children}</div>;
const Links = ({ list }) => (list.length > 0 ? <Block title="Links the records show">{<ul className="ma-ctx-links">{list.map((t) => <li key={t}>{t}</li>)}</ul>}</Block> : null);
const Source = ({ href, label }) => (href ? <a className="ma-src" href={href} target="_blank" rel="noreferrer">{label}<span className="sr-only"> (opens in a new tab)</span></a> : null);

// What a vote's bill is for, looked up the first time the entry is opened.
function useBillFor(name, open) {
  const [bill, setBill] = useState(undefined);
  useEffect(() => {
    if (!open || !name || bill !== undefined) return undefined;
    let alive = true;
    supabase.from("bills").select("short_title, long_title, current_stage, current_house, sponsoring_department, is_act, is_defeated, source_url").ilike("short_title", name).limit(1)
      .then(({ data }) => { if (alive) setBill(data?.[0] ?? null); }, () => { if (alive) setBill(null); });
    return () => { alive = false; };
  }, [open, name, bill]);
  return bill;
}

function BillBlock({ bill, heading = "What the bill is for" }) {
  const sum = summariseBill(bill);
  const points = plainPoints(bill.long_title);
  const stage = explainStage(bill.current_stage, { isAct: bill.is_act, isDefeated: bill.is_defeated });
  return (
    <>
      <Block title={heading}>
        <p>{sum?.summary ?? "Its official title is too general to put more simply."}</p>
        {points.length > 1 && <ul className="ma-ctx-points">{points.slice(0, 4).map((pt) => <li key={pt}>{pt}</li>)}</ul>}
      </Block>
      {stage && <Block title={bill.is_act ? "Where it ended up" : "Where it has got to"}><p>{stage.means} {stage.next && !bill.is_act && !bill.is_defeated ? `Next: ${stage.next}` : ""}</p></Block>}
      {sum?.context && <p className="ma-sub">{sum.context}</p>}
    </>
  );
}

function VoteBody({ v, mp, links }) {
  const exp = useMemo(() => explainDivision(v.title), [v.title]);
  const theirs = exp ? describeVote(exp, v.aye) : null;
  return (
    <>
      {exp ? (
        <>
          <Block title="What was being voted on"><p>{exp.plain}</p></Block>
          <div className="ma-ayeno"><span className="aye"><b>Aye</b>{exp.ayeMeans}</span><span className="no"><b>No</b>{exp.noMeans}</span></div>
          <Block title="How they voted"><p>{mp?.name ?? "They"} voted <strong>{v.aye ? "Aye" : "No"}</strong>.{theirs ? ` ${theirs}` : ""}{v.withParty === true ? " That was the same way as most of their party." : v.withParty === false ? " That was against most of their own party." : ""}</p></Block>
        </>
      ) : <Block title="What was being voted on"><p>Parliament gives this vote only the title above, so we cannot say more than that. They voted {v.aye ? "Aye" : "No"}.</p></Block>}
      {exp?.billName && <BillFromVote name={exp.billName} />}
      <Links list={links} />
      <p className="ma-sub">{NO_WHY}</p>
      <Source href={v.url} label="The vote on Parliament's site" />
    </>
  );
}

function BillFromVote({ name }) {
  const bill = useBillFor(name, true);
  if (bill === undefined) return <p className="ma-sub">Looking up the bill…</p>;
  if (!bill) return <Block title="The bill"><p>{name}. We do not hold a summary of it. Parliament's own bill page explains it: <a href={billSearchUrl(name)} target="_blank" rel="noreferrer">search for it<span className="sr-only"> (opens in a new tab)</span></a>.</p></Block>;
  return <BillBlock bill={bill} heading={`What the ${name} is for`} />;
}

// What the MP has been doing in Parliament, from Parliament's own records, in four tabs. Each line opens to say in plain English what it is.
const DOING_TABS = [["debates", "Debates"], ["questions", "Questions"], ["votes", "Votes"], ["proposed", "Bills and committees"]];
export function MpDoing({ x, mp, i }) {
  const d = x?.doing;
  const [picked, setPicked] = useState(null);
  const [openId, setOpenId] = useState(null);
  const tab = picked ?? firstTab(d);
  const count = (k) => (!d ? 0 : k === "proposed" ? d.bills.length + d.committees.length : d[k].length);
  const choose = (k) => { setPicked(k); setOpenId(null); };
  const onKey = (e) => {
    const at = DOING_TABS.findIndex(([k]) => k === tab);
    const next = e.key === "ArrowRight" ? at + 1 : e.key === "ArrowLeft" ? at - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const [k] = DOING_TABS[(next + DOING_TABS.length) % DOING_TABS.length];
    choose(k);
    document.getElementById(`ma-doing-tab-${k}`)?.focus();
  };
  const fmt = (iso) => (iso ? longDate(iso) : "");
  const ctx = d ? { seatName: x?.seat?.record?.name ?? x?.seatName, committees: d.committees, petitions: (x?.seat?.petitions ?? []).map((p) => p.action), sponsored: d.bills.map((b) => b.title) } : null;
  const toggle = (id) => setOpenId((cur) => (cur === id ? null : id));
  return (
    <Card i={i} colour="#C0478A" icon={<IconVote size={20} />} title={mp ? `What ${mp.name} has been doing` : "What your MP has been doing"} className="ma-doing">
      {x?.doing === undefined ? <Skel lines={5} /> : !d ? <Missing>We could not match this postcode to a current MP.</Missing> : (
        <>
          <p className="ma-sub">Taken from Parliament's own records. Press any line to see in plain English what it is. Parliament publishes what a member has said, asked, voted on and put forward. It does not publish why, or what they intend to do.</p>
          <div className="ma-doing-stats" aria-hidden="true">
            {DOING_TABS.map(([k, label]) => <span key={k}><b>{count(k)}</b>{label}</span>)}
          </div>
          <div className="ma-tabs" role="tablist" aria-label="Kinds of activity" onKeyDown={onKey}>
            {DOING_TABS.map(([k, label]) => (
              <button key={k} id={`ma-doing-tab-${k}`} type="button" role="tab" aria-selected={tab === k} aria-controls="ma-doing-panel" tabIndex={tab === k ? 0 : -1} onClick={() => choose(k)}>{label}<small>{count(k)}</small></button>
            ))}
          </div>
          <div id="ma-doing-panel" role="tabpanel" aria-labelledby={`ma-doing-tab-${tab}`} key={tab} className="ma-feed">
            {tab === "debates" && (d.debates.length === 0 ? <p className="ma-sub">No recent debates are stored for them.</p> : (
              <ul>{d.debates.map((c, n) => {
                const id = `d${n}`; const kind = debateKind(c.section);
                return (
                  <Entry key={id} id={id} n={n} open={openId === id} onToggle={() => toggle(id)} date={fmt(c.date)} title={c.title} chips={<span className="ma-feed-meta"><i>{kind.label}</i></span>}>
                    <Block title="What this debate was"><p>{kind.plain}</p></Block>
                    <Block title="What they did"><p>{contributionWords(c)}</p></Block>
                    {c.saidAll.length > 0 && <Block title="In their words">{c.saidAll.map((t) => <q key={t}>{t}</q>)}</Block>}
                    <Links list={connections({ ...ctx, text: c.title })} />
                    <p className="ma-sub">{NO_WHY}</p>
                    <Source href={c.url} label="The full debate on Hansard" />
                  </Entry>
                );
              })}</ul>
            ))}
            {tab === "questions" && (d.questions.length === 0 ? <p className="ma-sub">No recent written questions are stored for them.</p> : (
              <>
                <ul>{d.questions.map((q, n) => {
                  const id = `q${n}`; const st = questionStatus(q); const dept = departmentInfo(q.department);
                  return (
                    <Entry key={id} id={id} n={n} open={openId === id} onToggle={() => toggle(id)} date={`Asked ${fmt(q.tabled)}`} title={q.heading}
                      chips={<span className="ma-feed-meta">{q.department && <i>{q.department}</i>}<i className={st.answered ? "aye" : "against"}>{st.answered ? "Answered" : "Waiting"}</i></span>}>
                      <Block title="What they asked">{q.text ? <p>{q.text}</p> : <p>The full wording is on Parliament's site.</p>}</Block>
                      <Block title="Who it went to"><p>{q.department ?? "A government department"}{dept ? `. ${dept}` : ""}</p></Block>
                      <Block title="Where it stands"><p>{st.plain}</p></Block>
                      {q.answer && <Block title="The answer, shortened"><q>{q.answer}</q></Block>}
                      <Links list={connections({ ...ctx, text: `${q.heading} ${q.text ?? ""}` })} />
                      <p className="ma-sub">A written question is a question an MP puts to a minister in writing. The minister has to reply in writing, and both are published.</p>
                      <p className="ma-sub">{NO_WHY}</p>
                      <Source href={q.url} label="The question and answer on Parliament's site" />
                    </Entry>
                  );
                })}</ul>
                <a className="ma-link" href="#/writtenQuestions">Every written question</a>
              </>
            ))}
            {tab === "votes" && (d.votes.length === 0 ? <p className="ma-sub">No recent votes are stored for them.</p> : (
              <>
                {d.withParty && <p className="ma-callout">In their latest {d.withParty.of} votes, they voted with their party in <strong>{d.withParty.with}</strong>{d.withParty.with === d.withParty.of ? "." : ` and against it in ${d.withParty.of - d.withParty.with}.`}</p>}
                <ul>{d.votes.map((v, n) => {
                  const id = `v${n}`;
                  return (
                    <Entry key={id} id={id} n={n} open={openId === id} onToggle={() => toggle(id)} date={fmt(v.date)} title={v.title}
                      chips={<span className="ma-feed-meta"><i className={v.aye ? "aye" : "no"}>{v.aye ? "Voted aye" : "Voted no"}</i>{v.withParty === false ? <i className="against">Against their party</i> : null}</span>}>
                      {openId === id && <VoteBody v={v} mp={mp} links={connections({ ...ctx, text: v.title })} />}
                    </Entry>
                  );
                })}</ul>
                {mp && <a className="ma-link" href={`#/mp/${mp.id}`}>Their full voting record</a>}
              </>
            ))}
            {tab === "proposed" && (d.bills.length + d.committees.length === 0 ? <p className="ma-sub">They are not recorded as sponsoring a bill or sitting on a select committee.</p> : (
              <>
                {d.bills.length > 0 && <><h5>Bills they sponsor</h5>
                  <ul>{d.bills.map((b, n) => {
                    const id = `b${n}`;
                    return (
                      <Entry key={id} id={id} n={n} open={openId === id} onToggle={() => toggle(id)} title={b.title}
                        chips={<span className="ma-feed-meta"><i className={b.isAct ? "aye" : b.defeated ? "no" : ""}>{b.isAct ? "Became law" : b.defeated ? "Defeated" : b.stage ?? "In progress"}</i></span>}>
                        <BillBlock bill={{ short_title: b.title, long_title: b.longTitle, current_stage: b.stage, current_house: b.house, sponsoring_department: b.department, is_act: b.isAct, is_defeated: b.defeated, source_url: b.url }} />
                        <Block title="What sponsoring means"><p>The sponsor is the member who puts a bill forward. For a government bill this is a minister. For a private member's bill it is a backbencher, and most of those do not become law.</p></Block>
                        <Source href={b.url} label="The bill on Parliament's site" />
                      </Entry>
                    );
                  })}</ul></>}
                {d.committees.length > 0 && <><h5>Committees they sit on</h5><p className="ma-chiprow">{d.committees.map((c) => <span key={c}>{c}</span>)}</p>
                  <p className="ma-sub">A select committee is a small cross-party group of MPs that examines one area of government, questions ministers and experts, and publishes reports the government must reply to.</p></>}
                {d.role && <p className="ma-sub">Government role: {d.role}.</p>}
              </>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

// The most-signed open petitions among people in this seat.
export function LocalPetitions({ x, name, i }) {
  const list = x?.seat?.petitions ?? [];
  return (
    <Card i={i} colour="#E8741A" icon={<IconPetition size={20} />} title="What people here are signing" className="ma-petitions">
      {x?.seat === undefined ? <Skel lines={3} /> : list.length === 0 ? <Missing>No local signatures found on the most-signed open petitions.</Missing> : (
        <>
          <p className="ma-sub">Among the most-signed open petitions in the country, the ones that drew the most signatures from {name}.</p>
          <ul className="ma-pets">
            {list.map((p) => (
              <li key={p.id}>
                <a href={`https://petition.parliament.uk/petitions/${p.id}`} target="_blank" rel="noreferrer">{p.action}</a>
                <span><b>{p.count.toLocaleString("en-GB")}</b> signatures here, the {ordinal(p.rank)} most of {p.of} seats</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <a className="ma-link" href="#/petitions">All petitions</a>
    </Card>
  );
}

export function CouncilTax({ x, i }) {
  const t = x?.tax;
  const values = t ? t.series.slice(t.start) : [];
  // The scale takes in the England average too, so the dashed line for it is always on the chart.
  const lo = t ? Math.min(...values, t.average) * 0.96 : 0;
  const hi = t ? Math.max(...values, t.average) * 1.03 : 1;
  const y = (v) => 100 - ((v - lo) / (hi - lo || 1)) * 100;
  const pts = values.map((v, n) => [(n / Math.max(1, values.length - 1)) * 100, y(v)]);
  const line = pts.map((p) => p.map((n) => n.toFixed(2)).join(",")).join(" ");
  const mid = t ? t.from + Math.round((t.to - t.from) / 2) : 0;
  const bigger = t ? Math.max(t.last, t.average) : 1;
  return (
    <Card i={i} colour="#E8741A" icon={<IconTrend size={20} />} title="Your council tax" className="ma-tax">
      {x?.tax === undefined ? <Skel lines={4} /> : !t ? <Missing>We hold council tax bills for councils in England only, and could not match this one.</Missing> : (
        <>
          <div className="ma-taxhead"><b><CountUp value={t.last} format={money} /></b><span>a year for a Band D home in {taxYear(t.to)}</span></div>
          {pts.length > 1 && (
            <figure className="ma-taxfig">
              <div className="ma-taxplot" role="img" aria-label={`Band D council tax in ${t.name}, ${t.from} to ${t.to}: from ${money(t.first)} to ${money(t.last)}. The England average for ${taxYear(t.to)} was ${money(t.average)}.`}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  {[25, 50, 75].map((g) => <line key={g} x1="0" x2="100" y1={g} y2={g} className="ma-spark-grid" />)}
                  <line x1="0" x2="100" y1={y(t.average)} y2={y(t.average)} className="ma-spark-avg" />
                  <polygon points={`0,100 ${line} 100,100`} className="ma-spark-fill" />
                  <polyline points={line} className="ma-spark-line" pathLength="1" />
                </svg>
                <span className="ma-spark-dot" style={{ left: `${pts.at(-1)[0]}%`, top: `${pts.at(-1)[1]}%` }} aria-hidden="true" />
                <span className="ma-spark-tag" style={{ top: `${y(t.average)}%` }} aria-hidden="true">England average {money(t.average)}</span>
              </div>
              <div className="ma-taxaxis" aria-hidden="true"><span>{taxYear(t.from)}<b>{money(t.first)}</b></span><span>{taxYear(mid)}</span><span>{taxYear(t.to)}<b>{money(t.last)}</b></span></div>
            </figure>
          )}
          <div className="ma-taxvs" role="img" aria-label={`${t.name} ${money(t.last)}, England average ${money(t.average)}`}>
            <span><em>{t.name}</em><i style={{ "--w": t.last / bigger }} /><b>{money(t.last)}</b></span>
            <span className="avg"><em>England average</em><i style={{ "--w": t.average / bigger }} /><b>{money(t.average)}</b></span>
          </div>
          <dl className="ma-facts">
            {t.sinceFirst !== null && <div><dt>Change since {t.from}</dt><dd>{t.sinceFirst >= 0 ? "Up" : "Down"} {Math.abs(t.sinceFirst).toFixed(0)}%</dd></div>}
            {t.sinceLast !== null && <div><dt>Change on last year</dt><dd>{t.sinceLast >= 0 ? "Up" : "Down"} {Math.abs(t.sinceLast).toFixed(1)}%</dd></div>}
            <div><dt>Where yours ranks</dt><dd>{ordinal(t.rank)} highest of {t.of}</dd></div>
          </dl>
          {t.start > 0 && <p className="ma-sub">{t.name} was created in {t.from}, so there are no earlier bills for it.</p>}
          <p className="ma-sub">This is the whole Band D bill for the area, which includes the county, police, fire and any London or combined authority share. Your own band, and any discount, will differ.</p>
        </>
      )}
      <a className="ma-link" href="#/taxRates">How council tax fits with other taxes</a>
    </Card>
  );
}

export function WhoDoes({ x, i }) {
  const w = x?.who;
  return (
    <Card i={i} colour="#2F9E6E" icon={<IconCouncil size={20} />} title="Who does what here" className="ma-who">
      {x?.who === undefined ? <Skel lines={4} /> : !w ? <Missing>We could not match this postcode to a council.</Missing> : (
        <>
          <p className="ma-sub">{w.title}.</p>
          <ul className="ma-roles">
            {w.rows.map((row) => <li key={row.who}><b>{row.who}</b><small>{row.role}</small><p>{row.does}</p></li>)}
          </ul>
          {x.topics.length > 0 && (
            <>
              <h4>Who to go to for what</h4>
              <dl className="ma-topics">{x.topics.map(([topic, who]) => <div key={topic}><dt>{topic}</dt><dd>{who}</dd></div>)}</dl>
            </>
          )}
          <a className="ma-link" href="#/devolved">Who decides what in Scotland, Wales and Northern Ireland</a>
        </>
      )}
    </Card>
  );
}

// Ten tenths from the most to the least deprived, with this neighbourhood marked.
export function Neighbourhood({ x, i }) {
  const nb = x?.nb;
  const sd = x?.seatDep;
  const dom = x?.seatDomains;
  const DOMAINS = [["income", "Income"], ["employment", "Employment"], ["education", "Education, skills and training"], ["health", "Health and disability"], ["crime", "Crime"], ["barriers", "Barriers to housing and services"], ["living", "Living environment"]];
  return (
    <Card i={i} colour="#C0478A" icon={<IconSearch size={20} />} title="Your neighbourhood" className="ma-hood">
      {x?.seatDep === undefined ? <Skel lines={5} /> : (
        <>
          {nb ? (
            <>
              <p>Your small neighbourhood is in <strong>{tenthWords(nb.decile)}</strong> of {nb.nation}. Ranked {nb.rank.toLocaleString("en-GB")} of {nb.of.toLocaleString("en-GB")}, where 1 is the most deprived.</p>
              <ol className="ma-deciles" aria-label={`Your neighbourhood is in tenth ${nb.decile} of 10, where 1 is the most deprived`}>
                {Array.from({ length: 10 }, (_, n) => <li key={n} className={n + 1 === nb.decile ? "me" : ""} style={{ "--d": n }}>{n + 1 === nb.decile && <span>You</span>}</li>)}
              </ol>
              <p className="ma-scale"><span>Most deprived</span><span>Least deprived</span></p>
            </>
          ) : <Missing>No neighbourhood ranking is available for this postcode.</Missing>}
          {sd && (
            <p className="ma-callout">In your seat, <strong>{sd.worst10 < 1 ? "under 1%" : `${Math.round(sd.worst10)}%`}</strong> of {sd.unit} are in the most deprived tenth of {sd.nation}. That makes it the <strong>{ordinal(sd.rank)}</strong> most affected of {sd.of} seats.</p>
          )}
          {dom && (
            <>
              <h4>Where in your seat people are most affected</h4>
              <ul className="ma-domains">
                {DOMAINS.filter(([k]) => typeof dom[k] === "number").map(([k, label]) => (
                  <li key={k}><span>{label}</span><i aria-hidden="true"><b style={{ "--w": Math.max(0.01, Math.min(1, dom[k] / 100)) }} /></i><em>{Math.round(dom[k])}%</em></li>
                ))}
              </ul>
              <p className="ma-sub">Each bar is the share of residents in your seat living in the most deprived tenth of neighbourhoods in England for that kind of deprivation.</p>
            </>
          )}
          {x.councilDep && <p className="ma-sub">Across all of {x.councilDep.of} councils in England, your council area ranks {ordinal(x.councilDep.rank)} for deprivation, where 1st is the most deprived.</p>}
          <p className="ma-sub">The neighbourhood ranking is the one published through postcodes.io for each nation. It can use an older version of the index than the figures for your seat, which come from the 2025 English index and the latest Welsh, Scottish and Northern Irish ones.</p>
        </>
      )}
    </Card>
  );
}

export function PlaceFacts({ x, i }) {
  return (
    <Card i={i} colour="#0E9AA7" icon={<IconPinHome size={20} />} title="About where you live" className="ma-placefacts">
      {x?.facts === undefined ? <Skel lines={5} /> : x.facts.length === 0 ? <Missing>No further details were found for this postcode.</Missing> : (
        <dl className="ma-facts">{x.facts.map((f) => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</dl>
      )}
    </Card>
  );
}

// Each regional measure with where the region ranks among the twelve.
export function RegionRanks({ x, regionName, i }) {
  const rows = x?.snapshot ?? [];
  return (
    <Card i={i} colour="#7A5AF0" icon={<IconTrend size={20} />} title={`Where ${regionName ?? "your region"} ranks`} className="ma-ranks">
      {x?.snapshot === undefined ? <Skel lines={5} /> : rows.length === 0 ? <Missing>Regional rankings are not available for this area.</Missing> : (
        <>
          <ul className="ma-rankrows">
            {rows.map((s) => (
              <li key={s.metric.id} style={{ "--fc": s.metric.accent }}>
                <span className="ma-rank-label"><b>{s.metric.label}</b><small>{periodLabel(s.period)}</small></span>
                <span className="ma-rank-value">{formatValue(s.metric.format, s.value)}<small>UK {s.uk != null ? formatValue(s.metric.format, s.uk) : "not available"}</small></span>
                {s.rank && <span className="ma-rank-dots" role="img" aria-label={`${ordinal(s.rank)} highest of ${s.of} regions`}>{Array.from({ length: s.of }, (_, n) => <i key={n} className={n + 1 === s.rank ? "me" : ""} />)}</span>}
                {s.rank && <small className="ma-rank-note">{ordinal(s.rank)} highest of {s.of}</small>}
              </li>
            ))}
          </ul>
          {x.pay && <p className="ma-callout">A typical home costs about <strong>{x.pay.years.toFixed(1)} years</strong> of typical pay here{x.pay.ukYears ? `, against ${x.pay.ukYears.toFixed(1)} across the UK` : ""}.</p>}
          <p className="ma-sub">The ONS publishes these for the 12 regions and nations, not for single towns, so your area can be quite different.</p>
        </>
      )}
      <a className="ma-link" href="#/regions">Compare every region</a>
    </Card>
  );
}

// Housing and crime for the region, each figure set against the whole country and placed among the regions.
export function HomesCrime({ x, regionName, i }) {
  const rows = x?.homes ?? [];
  const groups = [["homes", "Homes", "#2F9E6E", "#/housing", "House prices and rents in detail"], ["crime", "Crime", "#D9453B", "#/crime", "Crime in detail"]];
  return (
    <Card i={i} colour="#2F9E6E" icon={<IconHouse size={20} />} title={`Homes and crime in ${regionName ?? "your region"}`} className="ma-ranks ma-homes">
      {x?.homes === undefined ? <Skel lines={5} /> : rows.length === 0 ? <Missing>Housing and crime figures are not available for this area.</Missing> : (
        <>
          <div className="ma-homes-grid">
            {groups.map(([topic, title, colour, href, link]) => {
              const list = rows.filter((r) => r.topic === topic);
              if (list.length === 0) return null;
              return (
                <section key={topic} style={{ "--fc": colour }}>
                  <h4>{topic === "crime" ? <IconShield size={16} /> : <IconHouse size={16} />}{title}</h4>
                  <ul className="ma-rankrows">
                    {list.map((s) => (
                      <li key={s.label} style={{ "--fc": colour }}>
                        <span className="ma-rank-label"><b>{s.label}</b><small>{s.period}</small></span>
                        <span className="ma-rank-value">{formatValue(s.format, s.value)}{s.whole != null && <small>{s.wholeName} {formatValue(s.format, s.whole)}</small>}</span>
                        <span className="ma-rank-dots" role="img" aria-label={`${ordinal(s.rank)} highest of ${s.of} places`}>{Array.from({ length: s.of }, (_, n) => <i key={n} className={n + 1 === s.rank ? "me" : ""} />)}</span>
                        <small className="ma-rank-note">{ordinal(s.rank)} highest of {s.of}</small>
                      </li>
                    ))}
                  </ul>
                  <a className="ma-link" href={href}>{link}</a>
                </section>
              );
            })}
          </div>
          {x.pay && <p className="ma-callout">A typical home costs about <strong>{x.pay.years.toFixed(1)} years</strong> of typical pay here{x.pay.ukYears ? `, against ${x.pay.ukYears.toFixed(1)} across the UK` : ""}.</p>}
          <p className="ma-sub">These are figures for the whole region, from HM Land Registry, the ONS and police recorded crime, not for your street. Crime is recorded for England and Wales only, and more recorded crime can mean more reporting as well as more crime. For your own streets see <a href="https://www.police.uk/" target="_blank" rel="noreferrer">police.uk</a>. For schools, <a href="https://www.gov.uk/find-school-in-england" target="_blank" rel="noreferrer">find a school in England</a> or <a href="https://www.gov.uk/school-term-holiday-dates" target="_blank" rel="noreferrer">check term dates</a>.</p>
        </>
      )}
    </Card>
  );
}

export function Census({ x, regionName, i }) {
  const rows = x?.census ?? [];
  return (
    <Card i={i} colour="#0E9AA7" icon={<IconHexMap size={20} />} title={`Who lives in ${regionName ?? "your region"}`} className="ma-census">
      {x?.census === undefined ? <Skel lines={5} /> : rows.length === 0 ? <Missing>Census figures are not available for this area.</Missing> : (
        <>
          {x.ages && (
            <figure className="ma-ages">
              <figcaption>How old people are</figcaption>
              {[["region", regionName ?? "Your region"], ["uk", "The UK"]].map(([k, label]) => (
                <div key={k} className={`ma-agebar ${k}`} role="img" aria-label={`${label}: ${x.ages.map((a) => `${a.label} ${a[k]}%`).join(", ")}`}>
                  <em>{label}</em>
                  <span>{x.ages.map((a, n) => <i key={a.label} style={{ "--g": a[k], "--n": n }}><b>{Math.round(a[k])}%</b></i>)}</span>
                </div>
              ))}
              <p className="ma-agekey" aria-hidden="true">{x.ages.map((a, n) => <span key={a.label} style={{ "--n": n }}><i />{a.label}</span>)}</p>
            </figure>
          )}
          <ul className="ma-census-rows">
            {rows.map((f) => {
              const top = Math.max(f.value, f.uk ?? 0, 1);
              return (
                <li key={f.id}>
                  <span>{f.label}<small>{f.of}</small></span>
                  <span className="ma-pair"><i style={{ "--w": f.value / top }} /><b>{f.value}%</b></span>
                  {f.uk != null && <span className="ma-pair ma-pair-uk"><i style={{ "--w": f.uk / top }} /><b>{f.uk}%</b></span>}
                </li>
              );
            })}
          </ul>
          <p className="ma-legend"><span><i style={{ background: "#0E9AA7" }} />Your region</span><span><i style={{ background: "#9AA6B8" }} />The UK, or England and Wales where the UK is not published</span></p>
          <p className="ma-sub">From the 2021 Census in England, Wales and Northern Ireland, and Scotland's 2022 Census where the categories match.</p>
        </>
      )}
    </Card>
  );
}

export function Contests({ x, council, i }) {
  const list = x?.contests;
  const calendar = x?.contests === undefined ? [] : electionEvents(list, council);
  return (
    <Card i={i} colour="#E0367A" icon={<IconVote size={20} />} title="Elections coming up where you live" className="ma-contests">
      {x?.contests !== undefined && <DatesLine contests={list} council={council} />}
      {x?.contests === undefined ? <Skel lines={4} /> : list === null ? (
        <Missing>We could not reach the elections lookup just now{council?.next?.[0] ? `. Your council's next election is on ${longDate(council.next[0][0])}.` : "."}</Missing>
      ) : list.length === 0 ? (
        <Missing>No elections are listed for this postcode yet{council?.next?.[0] ? `. Your council's next scheduled election is on ${longDate(council.next[0][0])}.` : "."}</Missing>
      ) : (
        <ul className="ma-contest-list">
          {list.map((c) => {
            const d = daysUntil(c.date);
            const deadline = c.deadlines?.find((z) => !z.passed && z.key === "registration_deadline");
            return (
              <li key={c.id}>
                <time dateTime={c.date}><b>{new Date(`${c.date}T00:00:00Z`).getUTCDate()}</b><span>{new Date(`${c.date}T00:00:00Z`).toLocaleString("en-GB", { month: "short", timeZone: "UTC" })}</span></time>
                <div>
                  <b>{c.title}</b>
                  <small>{[c.role, d <= 0 ? "Today" : plural(d, "day", "days") + " to go", c.voterId ? "Photo ID needed" : null].filter(Boolean).join(". ")}.</small>
                  {c.byElection && <small>{c.byElection}</small>}
                  {deadline && <small>Register to vote by {longDate(deadline.date)}.</small>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <h4>Before polling day</h4>
      <ol className="ma-steps">
        <li><b>Register.</b> You must be on the electoral register. It closes 12 working days before an election.</li>
        <li><b>Photo ID.</b> It is needed at polling stations for UK general elections and for local elections in England. It is not needed for Scottish or Welsh devolved elections, and Northern Ireland has its own rules.</li>
        <li><b>Postal or proxy.</b> You can apply to vote by post, or ask someone you trust to vote for you. Apply early: postal votes close 11 working days before, proxies 6.</li>
      </ol>
      <p className="ma-sub">Check the exact dates for your election on gov.uk, as they change with each one.</p>
      {calendar.length > 0 && <button type="button" className="btn btn-secondary ma-cal" onClick={() => downloadIcs("my-election-dates.ics", buildIcs(calendar, { name: `Election dates${council ? ` for ${council.name}` : ""}` }))}>Add these {calendar.length} dates to your calendar</button>}
      <a className="ma-link" href="#/myBallot">Who is standing, and how to mark the ballot</a>
    </Card>
  );
}

const HELP = [
  ["Find your polling station", "https://wheredoivote.co.uk/", "Enter your postcode. Run by Democracy Club."],
  ["Check what ID you need", "https://www.gov.uk/how-to-vote/photo-id-youll-need", "Which photo ID is accepted at a polling station."],
  ["Register to vote", "https://www.gov.uk/register-to-vote", "It takes about five minutes."],
  ["Write to your MP or councillor", "https://www.writetothem.com/", "Free. It finds the right person for your address."],
  ["Report a local problem", "https://www.fixmystreet.com/", "Potholes, fly-tipping and broken lights go to the council."],
  ["Find your local council", "https://www.gov.uk/find-local-council", "Contact details and services."],
  ["See crime and policing near you", "https://www.police.uk/", "Street-level crime maps and your local team."],
  ["Find NHS services near you", "https://www.nhs.uk/service-search", "GPs, dentists, pharmacies and urgent care."],
  ["Get free advice", "https://www.citizensadvice.org.uk/", "Money, housing, work and benefits."],
];
export function Help({ i }) {
  return (
    <Card i={i} colour="#E8741A" icon={<IconPetition size={20} />} title="Useful links for where you live" className="ma-help-card">
      <ul className="ma-helplist">
        {HELP.map(([title, href, text]) => <li key={href}><a href={href} target="_blank" rel="noreferrer">{title}</a><span>{text}</span></li>)}
      </ul>
    </Card>
  );
}

// The pages on this site that explain who decides what where this person lives.
const DEEPER = [
  ["#/policeCommissioners", "Police and crime commissioners", "Who sets policing priorities and the police budget."],
  ["#/mayors", "Mayors and regional authorities", "Whether your area has a regional mayor."],
  ["#/planning", "Planning: who decides what gets built", "How a planning application is decided."],
  ["#/councilSpending", "Where council money goes", "What councils spend, and why social care dominates."],
  ["#/water", "Water and sewage", "Who runs your water, and how often sewage spills."],
  ["#/justice", "Courts, police and prisons", "How crime, courts and prisons connect."],
];
export function Deeper({ i }) {
  return (
    <Card i={i} colour="#3F6FD8" icon={<IconSearch size={20} />} title="Read more about how this works" className="ma-deeper">
      <ul className="ma-helplist">
        {DEEPER.map(([href, title, text]) => <li key={href}><a href={href}>{title}</a><span>{text}</span></li>)}
      </ul>
    </Card>
  );
}


// Your seat as one of the 650: every seat is a hexagon in the colour of its 2024 winner, and yours is ringed.
export function SeatMap({ x, name }) {
  const m = x?.map;
  const polys = useMemo(() => (m ? m.cells.map((c) => hexPoints(c.x, c.y, 0.97)) : []), [m]);
  if (!x || x.map === undefined) return <Skel lines={5} />;
  if (!m) return <p className="ma-sub">{name} is one of 650 seats in the House of Commons.</p>;
  const { box } = m;
  const me = m.cells[m.mine];
  return (
    <figure className="ma-mapfig">
      <svg className="ma-map" viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`} role="img" aria-label={`Map of the 650 seats, each coloured by its 2024 winner. ${name} is ringed.`}>
        {m.cells.map((c, n) => <polygon key={n} points={polys[n]} fill={c.colour ?? "var(--c-hairline)"} style={{ "--d": `${Math.round(((c.x - box.x) / box.w) * 700)}ms` }} />)}
        <polygon className="ma-map-me" points={hexPoints(me.x, me.y, 1.9)} />
        <polygon className="ma-map-ring" points={hexPoints(me.x, me.y, 1.9)} />
      </svg>
      <figcaption>The 650 seats as equal hexagons, coloured by who won in 2024. Yours is ringed.</figcaption>
    </figure>
  );
}

// Where the seat sits among the 650, and the seats touching it on that map, with who won them.
export function Neighbours({ x, name, i }) {
  const near = x?.map?.neighbours ?? [];
  return (
    <Card i={i} colour="#1FA97C" icon={<IconHexMap size={20} />} title={`Where ${name} sits among the 650`} className="ma-near-card">
      {x?.map === undefined ? <Skel lines={4} /> : !x.map ? <Missing>We could not place this seat on the map.</Missing> : (
        <div className="ma-where">
          <SeatMap x={x} name={name} />
          <div className="ma-where-list">
            <h4>Seats beside yours on the map</h4>
            <ul className="ma-near">
              {near.map((n, k) => (
                <li key={n.key} style={{ "--pc": n.colour ?? "#8A94A6", "--n": k }}>
                  <a href={`#/constituency/${encodeURIComponent(n.name)}`}><b>{n.name}</b><span>{[n.mp, n.party].filter(Boolean).join(", ")}</span>{n.majority != null && <small>Won by {n.majority.toLocaleString("en-GB")} votes</small>}</a>
                </li>
              ))}
            </ul>
            <p className="ma-sub">On this map every seat is the same size, so these touch yours on the map, not necessarily on the ground.</p>
          </div>
        </div>
      )}
    </Card>
  );
}

// How many seats each party has held on the council at each election.
export function CouncilHistory({ x, council, i }) {
  const rows = x?.years ?? [];
  const keys = HKEYS.filter((k) => rows.some((r) => r[k] > 0));
  const lead = (r) => HKEYS.reduce((best, k) => (r[k] > (r[best] ?? 0) ? k : best), "other");
  const first = rows[0];
  const last = rows.at(-1);
  return (
    <Card i={i} colour="#E8741A" icon={<IconTrend size={20} />} title="How your council has changed" className="ma-hist-card">
      {x?.years === undefined ? <Skel lines={4} /> : !council ? <Missing>We could not match this postcode to a council.</Missing> : rows.length < 2 ? <Missing>No election-by-election history is saved for this council.</Missing> : (
        <>
          <div className="ma-hist" role="img" aria-label={`Seats won by each party on ${council.name} council, ${first.year} to ${last.year}`} style={{ "--cols": rows.length }}>
            {rows.map((r, n) => (
              <div key={r.year} style={{ "--n": n }}>
                <span className="ma-hist-stack" title={keys.filter((k) => r[k] > 0).map((k) => `${HISTORY_LABELS[k]} ${r[k]}`).join(", ")}>
                  {keys.filter((k) => r[k] > 0).map((k) => <i key={k} style={{ height: `${(r[k] / r.total) * 100}%`, background: HISTORY_COLOURS[k] }} />)}
                </span>
                <em>{String(r.year).slice(2)}</em>
              </div>
            ))}
            <u aria-hidden="true" title="Majority line" />
          </div>
          <p className="ma-key">{keys.map((k) => <span key={k}><i style={{ background: HISTORY_COLOURS[k] }} />{HISTORY_LABELS[k]}</span>)}</p>
          <p>In {first.year}, {HISTORY_LABELS[lead(first)]} held {first[lead(first)]} of {first.total} seats. In {last.year}, {HISTORY_LABELS[lead(last)]} hold {last[lead(last)]} of {last.total}.</p>
          <p className="ma-sub">Each bar is one year's seats, from {first.year} to {last.year}. The dashed line marks a majority.</p>
        </>
      )}
      {council && <a className="ma-link" href={`#/councils/${council.id}`}>Wards, councillors and every change</a>}
    </Card>
  );
}

// The region on a map of the UK.
export function RegionOutline({ regionKey, regionName }) {
  if (!regionKey) return null;
  return (
    <figure className="ma-outline">
      <svg viewBox={`0 0 ${regionGeo.width} ${regionGeo.height}`} role="img" aria-label={`${regionName} highlighted on a map of the UK`}>
        {regionGeo.regions.map((g) => <path key={g.key} d={g.d} className={g.key === regionKey ? "me" : undefined} />)}
      </svg>
      <figcaption>{regionName}</figcaption>
    </figure>
  );
}

// From today to the general election: the dates ahead on one line, each marked by a number that the list below explains.
function DatesLine({ contests, council }) {
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const end = new Date(Date.UTC(2029, 11, 31));
  const raw = [
    ...(contests ?? []).map((c) => ({ date: c.date, label: c.title })),
    ...(council?.next?.[0] ? [{ date: council.next[0][0], label: `${council.name} council election` }] : []),
  ].filter((e) => e.date >= todayIso).sort((a, b) => a.date.localeCompare(b.date));
  const merged = [];
  for (const e of raw) { const hit = merged.find((m) => m.date === e.date); if (hit) { if (!hit.labels.includes(e.label)) hit.labels.push(e.label); } else merged.push({ date: e.date, labels: [e.label] }); }
  const stops = merged.slice(0, 4);
  const span = end - today;
  const at = (iso) => Math.min(100, Math.max(0, ((new Date(`${iso}T00:00:00Z`) - today) / span) * 100));
  const years = [2027, 2028, 2029].filter((y) => at(`${y}-01-01`) > 12);
  return (
    <div className="ma-dates-line">
      <div className="ma-track" role="img" aria-label="A line from today to the general election, with the dates listed below marked on it">
        <i className="ma-track-line" />
        {years.map((y) => <span key={y} className="ma-track-year" style={{ left: `${at(`${y}-01-01`)}%` }}>{y}</span>)}
        <b className="ma-track-dot ma-track-now" style={{ left: "0%" }}>Today</b>
        {stops.map((s, n) => <b key={s.date} className="ma-track-dot" style={{ left: `${at(s.date)}%`, "--n": n + 1 }}>{n + 1}</b>)}
        <b className="ma-track-dot ma-track-ge" style={{ left: "100%", "--n": stops.length + 1 }}>{stops.length + 1}</b>
      </div>
      <ol className="ma-track-list">
        {stops.map((s) => <li key={s.date}><b>{longDate(s.date)}</b><span>{s.labels.join(". ")}</span></li>)}
        <li><b>By 2029</b><span>The latest the next general election can be held.</span></li>
      </ol>
    </div>
  );
}
