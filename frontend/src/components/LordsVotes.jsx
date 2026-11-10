/** @jsxImportSource react */
import { useMemo, useState } from "react";
import { useDataFile } from "../lib/useDataFile";
import { lordsVotes } from "../lib/dataFiles";
import { COLORS, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconLordsVote } from "./icons";
import { useGo } from "./story/useGo";
import CountUp from "./CountUp";
import { LoadFailedNote } from "./MpCards";
import Loading from "./Loading";
import { supabase } from "../supabaseClient";
import { getBillDescription } from "../lib/billDescriptions";
import { plainPoints } from "../lib/billPlain";
import { peerRows, partyUnity, mostDivided, governmentDefeats, filterPeers, longDay, monthlyOutcomes, turnoutBands, typicalTurnout, sidesOf, regulars, hexOf, findBill, outcomeOf } from "../lib/lordsVotesView";
import "../lordsvotes.css";
import Unfold from "./Unfold";

// How peers vote: how united each party is in the Lords, the votes where peers broke ranks, and a searchable list of every peer's record. All of it
// comes from Parliament's Lords Votes API (the last 12 months), turned into data/lordsVotes.json by fetch-lords-votes.js.

const fmt = (n) => Math.round(n).toLocaleString("en-GB");
// The first line of what a vote was on, cut short, so votes on the same bill can be told apart.
const brief = (note) => { const t = note.replace(/\s*The House divided:?\s*$/i, ""); return t.length > 150 ? `${t.slice(0, 147).replace(/\s+\S*$/, "")}...` : t; };
const pct = (x, d = 1) => `${(x * 100).toFixed(d)}%`;
const heading = { fontFamily: "'Figures', 'Newsreader', Georgia, serif", fontSize: 24, fontWeight: 700, color: COLORS.ink, margin: 0 };
const lede = { fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.65, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 720 };

// What a Lords vote is, in three steps, with the latest real vote drawn under them.
function Explainer({ latest }) {
  const [ref, go] = useGo(0.25);
  const total = latest.content + latest.notContent || 1;
  return (
    <section ref={ref} className="lv-how" data-go={go} aria-labelledby="h-how">
      <h2 id="h-how" style={heading}>What is a vote in the Lords?</h2>
      <p style={lede}>Before a bill becomes law, the House of Lords reads it and can change it. When peers disagree, they vote. This page counts those votes and shows who voted which way.</p>
      <ol className="lv-steps">
        <li style={{ "--i": 0 }}><span aria-hidden="true">1</span><b>A peer proposes something</b><p>Usually a change to a bill that the Commons has passed, or a rule the government wants approved.</p></li>
        <li style={{ "--i": 1 }}><span aria-hidden="true">2</span><b>Peers vote Content or Not content</b><p>Content means yes. Not content means no. Peers walk through one of two lobbies so they can be counted.</p></li>
        <li style={{ "--i": 2 }}><span aria-hidden="true">3</span><b>The bigger side wins</b><p>If the side the government backed comes second, that is a government defeat. The bill then usually goes back to the Commons.</p></li>
      </ol>
      <div className="lv-eg">
        <p><strong>The latest vote, on {longDay(latest.date)}:</strong> {latest.title}</p>
        <span className="lv-tally" role="img" aria-label={`${latest.content} content, ${latest.notContent} not content`}>
          <i className="lv-tally-c" style={{ width: `${(latest.content / total) * 100}%` }}><span className="lv-lab"><b>{fmt(latest.content)}</b> <small>Content</small></span></i>
          <i className="lv-tally-n" style={{ width: `${(latest.notContent / total) * 100}%` }}><span className="lv-lab"><b>{fmt(latest.notContent)}</b> <small>Not content</small></span></i>
        </span>
      </div>
    </section>
  );
}

// The answer to "does the government win?": the votes in each month, split into won and lost.
function Outcomes({ data, view }) {
  const [ref, go] = useGo(0.2);
  const months = useMemo(() => monthlyOutcomes(data), [data]);
  const top = Math.max(1, ...months.map((m) => m.n));
  const lost = view.defeats.length;
  const decided = data.list.filter((d) => d.govWin !== null).length;
  return (
    <article ref={ref} className="lv-card lv-card-wide" data-go={go} style={{ "--tc": "#9A3F55" }}>
      <div className="lv-card-text">
        <h3>The government lost <b><CountUp value={lost} /></b> of {fmt(data.divisions)} votes</h3>
        <p>That is {pct(lost / (decided || 1), 0)} of the votes where the government took a side. No party has a majority in the Lords, so the government cannot rely on winning. The Lords can change a bill and send it back, but the Commons has the last word.</p>
      </div>
      <div className="lv-chart">
        <div className="lv-cols" role="img" aria-label={`Votes in each month, and how many the government lost: ${months.map((m) => `${m.label} ${m.lost} lost of ${m.n}`).join(", ")}`}>
          {months.map((m, n) => (
            <span key={m.key} title={`${m.label}: ${m.n} votes, government lost ${m.lost}`} style={{ "--m": n }}>
              <span className="lv-stack" style={{ height: `${(m.n / top) * 100}%` }}>
                {m.lost > 0 && <i className="lv-lost" style={{ flexGrow: m.lost }} />}
                {m.won > 0 && <i className="lv-won" style={{ flexGrow: m.won }} />}
                {m.other > 0 && <i className="lv-other" style={{ flexGrow: m.other }} />}
              </span>
              <small>{m.label}</small>
            </span>
          ))}
        </div>
        <p className="lv-key" aria-hidden="true"><span><i className="lv-lost" />Government lost</span><span><i className="lv-won" />Government won</span><span><i className="lv-other" />No government side</span></p>
      </div>
    </article>
  );
}

// "Peers nearly always vote with their party", drawn as 1,000 votes of which a couple went the other way.
function Loyalty({ view }) {
  const [ref, go] = useGo(0.2);
  const loyal = view.votes ? 1 - view.against / view.votes : 1;
  const cells = 1000;
  const off = Math.max(view.against ? 1 : 0, Math.round((1 - loyal) * cells));
  return (
    <article ref={ref} className="lv-card" data-go={go} style={{ "--tc": "#2C5F9E" }}>
      <div className="lv-card-text">
        <h3>Peers almost always vote with their party: <b><CountUp value={loyal * 100} format={(n) => `${n.toFixed(1)}%`} /></b></h3>
        <p>Of {fmt(view.votes)} votes cast by peers whose party gave an instruction, only {fmt(view.against)} went against it. Here are 1,000 of those votes.</p>
      </div>
      <div className="lv-grid" role="img" aria-label={`Out of every 1,000 votes, about ${off} went against the party`}>
        {Array.from({ length: cells }, (_, k) => <i key={k} data-off={k >= cells - off ? "1" : "0"} style={{ "--c": k % 50 }} />)}
      </div>
      <p className="lv-key" aria-hidden="true"><span><i className="lv-won" />With the party</span><span><i className="lv-lost" />Against the party</span></p>
    </article>
  );
}

// How often peers turn up: the number of peers in each tenth of the votes, from those who rarely vote to those who vote almost every time.
function Turnout({ data, view }) {
  const [ref, go] = useGo(0.2);
  const bands = useMemo(() => turnoutBands(view.rows), [view.rows]);
  const top = Math.max(1, ...bands.map((b) => b.n));
  const half = regulars(view.rows, data.divisions, 0.5);
  return (
    <article ref={ref} className="lv-card" data-go={go} style={{ "--tc": "#1F7A6E" }}>
      <div className="lv-card-text">
        <h3>About <b><CountUp value={typicalTurnout(data)} /></b> peers take part in a typical vote</h3>
        <p>{fmt(view.rows.length)} peers voted at least once. {fmt(regulars(view.rows, data.divisions))} voted in at least a quarter of the votes, and {fmt(half)} in at least half.</p>
      </div>
      <div className="lv-hist" role="img" aria-label={`Peers by the share of votes they took part in: ${bands.map((b) => `${b.from} to ${b.to} percent, ${b.n} peers`).join("; ")}`}>
        {bands.map((b, n) => (
          <span key={b.from} title={`${b.from}% to ${b.to}% of votes: ${b.n} peers`} style={{ "--m": n }}>
            <i style={{ height: `${Math.max(2, (b.n / top) * 100)}%` }} />
            <small>{b.from}</small>
          </span>
        ))}
      </div>
      <p className="lv-axis" aria-hidden="true">Share of the votes a peer took part in (%)</p>
    </article>
  );
}

// One real government defeat, drawn as a tug of war: who stood on each side.
function Sides({ d, colours }) {
  const [ref, go] = useGo(0.25);
  const [yes, no] = sidesOf(d, colours);
  const seg = (list) => list.map((s) => <i key={s.party} style={{ flexGrow: s.n, background: s.colour }} title={`${s.party}: ${s.n}`} />);
  const names = [...new Set([...yes, ...no].map((s) => s.party))];
  const colourOf = (name) => [...yes, ...no].find((s) => s.party === name)?.colour;
  return (
    <figure ref={ref} className="lv-sides" data-go={go}>
      <figcaption><strong>How a defeat adds up.</strong> {longDay(d.date)}: {d.title}. The government lost, {fmt(d.content)} to {fmt(d.notContent)}.</figcaption>
      <div className="lv-vs" role="img" aria-label={`Content ${d.content}: ${yes.map((s) => `${s.party} ${s.n}`).join(", ")}. Not content ${d.notContent}: ${no.map((s) => `${s.party} ${s.n}`).join(", ")}.`}>
        <span className="lv-side" style={{ flexGrow: d.content }}><b>Content (yes) {fmt(d.content)}</b><span className="lv-bar-line">{seg(yes)}</span></span>
        <span className="lv-side" style={{ flexGrow: d.notContent }}><b>Not content (no) {fmt(d.notContent)}</b><span className="lv-bar-line">{seg(no)}</span></span>
      </div>
      <p className="lv-key" aria-hidden="true">{names.map((n) => <span key={n}><i style={{ background: colourOf(n) }} />{n}</span>)}</p>
    </figure>
  );
}

function Unity({ parties, quiet }) {
  const [ref, go] = useGo(0.15);
  return (
    <section ref={ref} aria-labelledby="h-unity" data-go={go} style={{ marginTop: 36 }}>
      <h2 id="h-unity" style={heading}>How loyal is each party?</h2>
      <p style={lede}>Most parties give their peers an instruction on how to vote, called a whip. This shows how many votes in each party went the way the party told them. Peers who vote against the party are rare.</p>
      <div className="lv-bars">
        {parties.map((p, i) => (
          <div key={p.name} className="lv-bar" style={{ "--pc": p.colour, "--i": i }}>
            <b>{p.name}<small>{fmt(p.peers)} {p.peers === 1 ? "peer" : "peers"} voted</small></b>
            <span className="lv-track" role="img" aria-label={`${pct(p.unity)} of votes with the party line`}><i style={{ width: `${p.unity * 100}%` }} /></span>
            <span>{pct(p.unity)}<small>{fmt(p.against)} {p.against === 1 ? "vote" : "votes"} against</small></span>
          </div>
        ))}
      </div>
      {quiet.length > 0 && (
        <p className="lv-quiet"><strong>No party instruction:</strong> {quiet.map((p) => `${p.name} (${fmt(p.peers)} peers)`).join(", ")}. These peers choose how to vote for themselves, so they cannot go against a party line.</p>
      )}
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
        {d.note && <span className="lv-div-note">{brief(d.note)}</span>}
        <span className="lv-tally" role="img" aria-label={`${d.content} content, ${d.notContent} not content`}>
          <i className="lv-tally-c" style={{ width: `${(d.content / total) * 100}%` }}><span className="lv-lab"><b>{fmt(d.content)}</b> <small>Content</small></span></i>
          <i className="lv-tally-n" style={{ width: `${(d.notContent / total) * 100}%` }}><span className="lv-lab"><b>{fmt(d.notContent)}</b> <small>Not content</small></span></i>
        </span>
        <span className="lv-div-meta">
          <span className="lv-pill" data-tone={agreed ? "ok" : "no"}>{agreed ? "Proposal passed" : "Proposal failed"}</span>
          {d.govWin === false && <span className="lv-pill" data-tone="warn">Government lost</span>}{d.govWin === true && <span className="lv-pill" data-tone="plain">Government won</span>}
          {d.rebels > 0 && <span className="lv-pill" data-tone="plain">{fmt(d.rebels)} against their party</span>}
          <span className="lv-div-chev" aria-hidden="true">{open ? "Hide the detail" : "What was this?"}</span>
        </span>
      </button>
      <Unfold open={open}>
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
      </Unfold>
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
  const { data: data, failed } = useDataFile(lordsVotes);
  const view = useMemo(() => {
    if (!data) return null;
    const rows = peerRows(data);
    const unity = partyUnity(data);
    const against = unity.reduce((t, p) => t + p.against, 0);
    const votes = unity.reduce((t, p) => t + p.votes, 0);
    return { colours: Object.fromEntries(data.parties.map((p) => [p.name, hexOf(p.colour)])), rows, unity, against, votes, divided: mostDivided(data, 8), defeats: governmentDefeats(data), parties: data.parties.filter((p) => p.peers >= 1), quiet: data.parties.filter((p) => !p.whipped && p.peers >= 1), example: governmentDefeats(data).find((d) => { const [y, n] = sidesOf(d, {}); return y.length > 1 && n.length > 0; }) ?? null };
  }, [data]);

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconLordsVote}
        kicker="Who's in charge"
        title="How peers vote"
        subtitle="How the House of Lords votes: how often the government loses, how loyal peers are to their party, and who turns up. The last 12 months, from Parliament's own records."
      />
      {failed && <LoadFailedNote item="the Lords voting figures" />}
      {!failed && !data && <Loading />}
      {data && view && (
        <>
          <Explainer latest={data.list[0]} />
          <section className="lv-findings" aria-label="What the votes show">
            <Outcomes data={data} view={view} />
            <Loyalty view={view} />
            <Turnout data={data} view={view} />
          </section>
          <Unity parties={view.unity} quiet={view.quiet} />
          <p className="lv-notes"><strong>Two things to keep in mind.</strong> A peer is counted as voting against their party when they take the opposite side to most of their party's peers on a whipped vote. And voting is not the same as attending: peers can be in the House without voting, and some vote remotely, so these figures count recorded votes, not days sat.</p>
          {view.defeats.length > 0 && (
            <section aria-labelledby="h-defeats" style={{ marginTop: 36 }}>
              <h2 id="h-defeats" style={heading}>When the government lost</h2>
              <p style={lede}>A defeat in the Lords does not stop a bill for good. The Lords sends its change back to the Commons, where the government can usually overturn it. Open a vote to see what it was about.</p>
              {view.example && <Sides d={view.example} colours={view.colours} />}
              <ul className="lv-list">{view.defeats.slice(0, 8).map((d) => <Division key={d.id} d={d} colours={view.colours} />)}</ul>
            </section>
          )}
          <section aria-labelledby="h-divided" style={{ marginTop: 36 }}>
            <h2 id="h-divided" style={heading}>Votes where peers went against their party</h2>
            <p style={lede}>{fmt(data.list.filter((d) => d.rebels > 0).length)} of the {fmt(data.divisions)} votes had at least one peer go against their own party. These are the ones with the most.</p>
            <ul className="lv-list">{view.divided.map((d) => <Division key={d.id} d={d} colours={view.colours} />)}</ul>
          </section>
          <Peers rows={view.rows} parties={view.parties} divisions={data.divisions} />
          <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.6, color: COLORS.inkSoft, marginTop: 28, maxWidth: 780 }}>
            Source: <a href="https://lordsvotes-api.parliament.uk" target="_blank" rel="noreferrer" style={{ color: COLORS.accentText, fontWeight: 600 }}>Parliament's Lords Votes API</a>, updated {longDay(data.generatedAt)}. A party needs at least five peers voting in a division to have a line that day, and an even split has none.
          </p>
        </>
      )}
    </div>
  );
}
