/** @jsxImportSource react */
import { useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconLordsVote } from "./icons";
import { HowToRead } from "./GlanceStrip";
import CountUp from "./CountUp";
import { LoadFailedNote } from "./MpCards";
import Loading from "./Loading";
import { supabase } from "../supabaseClient";
import { getBillDescription } from "../lib/billDescriptions";
import { plainPoints } from "../lib/billPlain";
import { peerRows, partyUnity, mostDivided, governmentDefeats, filterPeers, longDay, perMonth, regulars, hexOf, findBill, outcomeOf } from "../lib/lordsVotesView";
import "../lordsvotes.css";

// How peers vote: how united each party is in the Lords, the votes where peers broke ranks, and a searchable list of every peer's record. All of it
// comes from Parliament's Lords Votes API (the last 12 months), turned into data/lordsVotes.json by fetch-lords-votes.js.

const fmt = (n) => Math.round(n).toLocaleString("en-GB");
const pct = (x, d = 1) => `${(x * 100).toFixed(d)}%`;
const heading = { fontFamily: "'Figures', 'Newsreader', Georgia, serif", fontSize: 24, fontWeight: 700, color: COLORS.ink, margin: 0 };
const lede = { fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.65, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 720 };

// The page's headline figures, each with a picture of itself: votes by month, peers who turn up, loyalty as a dial, and defeats as dots.
function Ring({ value, colour }) {
  const R = 46;
  const C = 2 * Math.PI * R;
  return (
    <svg className="lv-ring" viewBox="0 0 110 110" aria-hidden="true">
      <circle cx="55" cy="55" r={R} className="lv-ring-bg" />
      <circle cx="55" cy="55" r={R} className="lv-ring-fg" stroke={colour} strokeDasharray={C} style={{ "--c": C, "--to": C * (1 - Math.max(0, Math.min(1, value))) }} transform="rotate(-90 55 55)" />
    </svg>
  );
}

function Scoreboard({ data, view }) {
  const months = useMemo(() => perMonth(data), [data]);
  const top = Math.max(1, ...months.map((m) => m.n));
  const loyal = view.votes ? 1 - view.against / view.votes : 1;
  const regs = regulars(view.rows, data.divisions);
  const lost = view.defeats.length;
  return (
    <section className="lv-board" aria-label="The Lords votes at a glance">
      <article className="lv-tile" style={{ "--tc": "#9B8CFF", "--i": 0 }}>
        <span className="lv-tile-label">Votes in the Lords</span>
        <b><CountUp value={data.divisions} /></b>
        <div className="lv-months" role="img" aria-label="Votes in each of the last 12 months">
          {months.map((m) => <span key={m.key} title={`${m.label}: ${m.n}`}><i style={{ "--h": m.n / top }} /><small>{m.label[0]}</small></span>)}
        </div>
        <span className="lv-tile-sub">since {longDay(data.since)}</span>
      </article>
      <article className="lv-tile" style={{ "--tc": "#FF7A8A", "--i": 1 }}>
        <span className="lv-tile-label">Peers who took part</span>
        <div className="lv-gauge"><Ring value={view.rows.length ? regs / view.rows.length : 0} colour="#FF7A8A" /><div><b><CountUp value={view.rows.length} /></b></div></div>
        <span className="lv-tile-sub"><strong>{fmt(regs)}</strong> voted in at least a quarter of the votes</span>
      </article>
      <article className="lv-tile" style={{ "--tc": "#6FB1FF", "--i": 2 }}>
        <span className="lv-tile-label">Loyal to their party</span>
        <div className="lv-gauge"><Ring value={loyal} colour="#6FB1FF" /><div><b><CountUp value={loyal * 100} format={(n) => `${n.toFixed(1)}%`} /></b></div></div>
        <span className="lv-tile-sub">{fmt(view.votes - view.against)} of {fmt(view.votes)} party votes went the party's way</span>
      </article>
      <article className="lv-tile" style={{ "--tc": "#FFB45E", "--i": 3 }}>
        <span className="lv-tile-label">Government defeats</span>
        <b><CountUp value={lost} /><small> of {fmt(data.divisions)}</small></b>
        <div className="lv-dots" role="img" aria-label={`${lost} of ${data.divisions} votes were lost by the government`}>
          {data.list.map((d, n) => <i key={d.id} data-lost={d.govWin === false ? "1" : "0"} style={{ "--n": n }} />)}
        </div>
        <span className="lv-tile-sub">each dot is a vote; lit dots are defeats</span>
      </article>
    </section>
  );
}

function Unity({ parties }) {
  return (
    <section aria-labelledby="h-unity" style={{ marginTop: 28 }}>
      <h2 id="h-unity" style={heading}>How united is each party?</h2>
      <p style={lede}>Of the votes cast by each party's peers in divisions where the party had a whip, how many went the way most of that party voted. The Lords are much more loyal than most people expect.</p>
      <div className="lv-bars">
        {parties.map((p) => (
          <div key={p.name} className="lv-bar" style={{ "--pc": p.colour }}>
            <b>{p.name}<small>{fmt(p.peers)} {p.peers === 1 ? "peer" : "peers"} voted</small></b>
            <span className="lv-track" role="img" aria-label={`${pct(p.unity)} of votes with the party line`}><i style={{ width: `${p.unity * 100}%` }} /></span>
            <span>{pct(p.unity)}<small style={{ display: "block", fontWeight: 500, fontSize: 12, color: COLORS.inkSoft }}>{fmt(p.against)} against</small></span>
          </div>
        ))}
      </div>
    </section>
  );
}

// The bills table, fetched once the first time a vote is opened, to say in plain English what the bill is for.
let billsPromise = null;
const loadBills = () => {
  if (!billsPromise) {
    billsPromise = supabase.from("bills").select("short_title, long_title, summary, source_url").then(({ data, error }) => { if (error) throw error; return data ?? []; }).catch(() => { billsPromise = null; return null; });
  }
  return billsPromise;
};

// One vote, kept simple: the bill, the date, how it went and one bar. Press it to read what was voted on, what the bill does and how each party split.
function Division({ d, colours }) {
  const [open, setOpen] = useState(false);
  const [bill, setBill] = useState(undefined);
  const total = d.content + d.notContent || 1;
  const toggle = () => {
    setOpen((v) => !v);
    if (bill === undefined) loadBills().then((rows) => setBill(rows ? findBill(d.title, rows) : null));
  };
  const plain = bill ? (getBillDescription(bill.short_title, null) ? [getBillDescription(bill.short_title, null)] : plainPoints(bill.long_title)) : [];
  const agreed = outcomeOf(d) === "Agreed";
  return (
    <li className="lv-div" data-open={open ? "1" : "0"}>
      <button type="button" className="lv-div-btn" onClick={toggle} aria-expanded={open}>
        <span className="lv-div-top">
          <b>{d.title}</b>
          <span className="lv-div-date">{longDay(d.date)}</span>
        </span>
        <span className="lv-tally" role="img" aria-label={`${d.content} content, ${d.notContent} not content`}>
          <i className="lv-tally-c" style={{ width: `${(d.content / total) * 100}%` }}>{fmt(d.content)}</i>
          <i className="lv-tally-n" style={{ width: `${(d.notContent / total) * 100}%` }}>{fmt(d.notContent)}</i>
        </span>
        <span className="lv-div-meta">
          <span className="lv-pill" data-tone={agreed ? "ok" : "no"}>{agreed ? "Motion agreed" : "Motion rejected"}</span>
          {d.govWin === false && <span className="lv-pill" data-tone="warn">Government lost</span>}
          {d.rebels > 0 && <span className="lv-pill" data-tone="plain">{fmt(d.rebels)} against their party</span>}
          <span className="lv-div-chev" aria-hidden="true">{open ? "Hide the detail" : "What was this?"}</span>
        </span>
      </button>
      {open && (
        <div className="lv-detail">
          {d.note && <section><h4>What was voted on</h4><p>{d.note.replace(/\s*The House divided:?\s*$/i, "")}</p></section>}
          <section>
            <h4>What the bill does, in plain English</h4>
            {bill === undefined && <p>Looking it up…</p>}
            {bill === null && <p>We couldn't match this vote to a bill we hold. Parliament's page for it has the full text.</p>}
            {bill && plain.length > 0 && <ul>{plain.slice(0, 5).map((pt, i) => <li key={i}>{pt}</li>)}</ul>}
            {bill && plain.length === 0 && <p>{bill.long_title ?? bill.short_title}</p>}
            {bill?.source_url && <p><a href={bill.source_url} target="_blank" rel="noreferrer">Read the bill on Parliament's site</a></p>}
          </section>
          {d.splits.length > 0 && (
            <section>
              <h4>How each party voted</h4>
              <div className="lv-splits">
                {d.splits.map(([party, c, n]) => (
                  <span key={party} className="lv-split" style={{ "--pc": colours[party] ?? "#8A94A6" }}>
                    <b><i />{party}</b>
                    <span className="lv-mini" role="img" aria-label={`${party}: ${c} yes, ${n} no`}><i style={{ flexGrow: c }} /><u style={{ flexGrow: n }} /></span>
                    <small>{c} yes, {n} no</small>
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </li>
  );
}

function Peers({ rows, parties, divisions }) {
  const [query, setQuery] = useState("");
  const [party, setParty] = useState("all");
  const [sort, setSort] = useState("voted");
  const [shown, setShown] = useState(36);
  const list = useMemo(() => filterPeers(rows, { query, party, sort }), [rows, query, party, sort]);
  return (
    <section aria-labelledby="h-peers" style={{ marginTop: 32 }}>
      <h2 id="h-peers" style={heading}>Every peer's record</h2>
      <p style={lede}>How many of the last {fmt(divisions)} votes each peer took part in, and how often they went against their party. A peer who joined recently, or was on leave, has had fewer chances to vote.</p>
      <div className="lv-tools">
        <input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setShown(36); }} placeholder="Search by name" aria-label="Search peers by name" />
        <select value={party} onChange={(e) => { setParty(e.target.value); setShown(36); }} aria-label="Party">
          <option value="all">Every party</option>
          {parties.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by">
          <option value="voted">Voted most</option>
          <option value="fewest">Voted least</option>
          <option value="against">Most against their party</option>
          <option value="name">Name, A to Z</option>
        </select>
      </div>
      {list.length === 0 && <p style={lede}>No peer matches that.</p>}
      <ul className="lv-peers">
        {list.slice(0, shown).map((p) => (
          <li key={p.id}>
            <a className="lv-peer" href={`#/lords/${p.id}`} style={{ "--pc": p.colour }}>
              <span><b>{p.name}</b><small>{p.party}{p.from && p.from !== "Life peer" ? `, ${p.from.toLowerCase()}` : ""}</small></span>
              <span className="lv-peer-n">{fmt(p.voted)} votes<small style={{ display: "block", fontWeight: 500, color: COLORS.inkSoft }}>{p.whipped ? `${fmt(p.against)} against party` : "no party whip"}</small></span>
              <span className="lv-track" role="img" aria-label={`Voted in ${pct(p.share, 0)} of divisions`}><i style={{ width: `${Math.min(100, p.share * 100)}%` }} /></span>
            </a>
          </li>
        ))}
      </ul>
      {list.length > shown && <div className="lv-more"><button type="button" className="btn btn-secondary btn-lg" onClick={() => setShown((n) => n + 36)}>Show {Math.min(36, list.length - shown)} more of {fmt(list.length - shown)} left</button></div>}
    </section>
  );
}

export default function LordsVotes() {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    import("../data/lordsVotes.json").then((m) => alive && setData(m.default)).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, []);
  const view = useMemo(() => {
    if (!data) return null;
    const rows = peerRows(data);
    const unity = partyUnity(data);
    const against = unity.reduce((t, p) => t + p.against, 0);
    const votes = unity.reduce((t, p) => t + p.votes, 0);
    return { colours: Object.fromEntries(data.parties.map((p) => [p.name, hexOf(p.colour)])), rows, unity, against, votes, divided: mostDivided(data, 8), defeats: governmentDefeats(data), parties: data.parties.filter((p) => p.peers >= 1) };
  }, [data]);

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconLordsVote}
        kicker="Who's in charge"
        title="How peers vote"
        subtitle="Who turns up to vote in the House of Lords, how loyal each party is, and which votes split a party. The last 12 months, straight from Parliament's own records."
      />
      {failed && <LoadFailedNote item="the Lords voting figures" />}
      {!failed && !data && <Loading />}
      {data && view && (
        <>
          <Scoreboard data={data} view={view} />
          <HowToRead steps={[
            { title: "Content and not content", text: "In the Lords a yes vote is \"Content\" and a no vote is \"Not content\"." },
            { title: "Against their party", text: "On a whipped vote, the side most of a party's peers took is its line. A peer on the other side has voted against it. Crossbenchers, bishops and non-affiliated peers have no whip." },
            { title: "Voting is not attending", text: "Peers can be in the House and not vote, and can vote remotely. The figures count recorded votes, not days sat." },
          ]} />
          <Unity parties={view.unity} />
          <section aria-labelledby="h-divided" style={{ marginTop: 32 }}>
            <h2 id="h-divided" style={heading}>Votes that split a party</h2>
            <p style={lede}>The divisions where the most peers voted against the way their own party voted.</p>
            <ul className="lv-list">{view.divided.map((d) => <Division key={d.id} d={d} colours={view.colours} />)}</ul>
          </section>
          {view.defeats.length > 0 && (
            <section aria-labelledby="h-defeats" style={{ marginTop: 32 }}>
              <h2 id="h-defeats" style={heading}>When the government lost</h2>
              <p style={lede}>The Lords often amends bills and sends them back to the Commons, where the government can usually overturn the change.</p>
              <ul className="lv-list">{view.defeats.slice(0, 8).map((d) => <Division key={d.id} d={d} colours={view.colours} />)}</ul>
            </section>
          )}
          <Peers rows={view.rows} parties={view.parties} divisions={data.divisions} />
          <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.6, color: COLORS.inkSoft, marginTop: 28, maxWidth: 780 }}>
            Source: <a href="https://lordsvotes-api.parliament.uk" target="_blank" rel="noreferrer" style={{ color: COLORS.accentText, fontWeight: 600 }}>Parliament's Lords Votes API</a>, updated {longDay(data.generatedAt)}. A party needs at least five peers voting in a division to have a line that day, and an even split has none.
          </p>
        </>
      )}
    </div>
  );
}
