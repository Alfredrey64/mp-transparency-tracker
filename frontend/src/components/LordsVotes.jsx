/** @jsxImportSource react */
import { useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconLordsVote } from "./icons";
import { GlanceStrip, HowToRead } from "./GlanceStrip";
import { LoadFailedNote } from "./MpCards";
import Loading from "./Loading";
import { peerRows, partyUnity, mostDivided, governmentDefeats, filterPeers, longDay } from "../lib/lordsVotesView";
import "../lordsvotes.css";

// How peers vote: how united each party is in the Lords, the votes where peers broke ranks, and a searchable list of every peer's record. All of it
// comes from Parliament's Lords Votes API (the last 12 months), turned into data/lordsVotes.json by fetch-lords-votes.js.

const fmt = (n) => Math.round(n).toLocaleString("en-GB");
const pct = (x, d = 1) => `${(x * 100).toFixed(d)}%`;
const heading = { fontFamily: "'Figures', 'Newsreader', Georgia, serif", fontSize: 24, fontWeight: 700, color: COLORS.ink, margin: 0 };
const lede = { fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.65, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 720 };

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

function Division({ d }) {
  const total = d.content + d.notContent || 1;
  return (
    <li className="lv-div">
      <div className="lv-div-top"><b>{d.title}</b><span>{longDay(d.date)}</span></div>
      <div className="lv-tally" role="img" aria-label={`${d.content} content, ${d.notContent} not content`}>
        <i className="lv-tally-c" style={{ width: `${(d.content / total) * 100}%` }} />
        <i className="lv-tally-n" style={{ width: `${(d.notContent / total) * 100}%` }} />
      </div>
      <div className="lv-tally-legend">
        <span><i style={{ background: "#2F9E6B" }} />{fmt(d.content)} Content (yes)</span>
        <span><i style={{ background: "#C13A4E" }} />{fmt(d.notContent)} Not content (no)</span>
        {d.rebels > 0 && <span>{fmt(d.rebels)} against their own party</span>}
        {d.govWin === false && <span style={{ color: COLORS.accentText }}>Government lost</span>}
      </div>
      {d.splits.length > 0 && (
        <div className="lv-splits">
          {d.splits.map(([party, c, n]) => <span key={party} className="lv-split"><i style={{ background: "currentColor" }} />{party}: {c} yes, {n} no</span>)}
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
    return { rows, unity, against, votes, divided: mostDivided(data, 8), defeats: governmentDefeats(data), parties: data.parties.filter((p) => p.peers >= 1) };
  }, [data]);

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: PAGE_PADDING }}>
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
          <GlanceStrip items={[
            { value: fmt(data.divisions), label: "votes in the Lords", sub: `since ${longDay(data.since)}`, colour: "#7A5AF0" },
            { value: fmt(view.rows.length), label: "peers took part", sub: "at least once", colour: "#C13A4E" },
            { value: pct(view.votes ? view.against / view.votes : 0, 2), label: "of party votes went against the party", sub: `${fmt(view.against)} of ${fmt(view.votes)} votes`, colour: "#1E4FB8" },
            { value: fmt(view.defeats.length), label: view.defeats.length === 1 ? "defeat for the government" : "defeats for the government", sub: "the Lords can amend and delay, not block", colour: "#E8741A" },
          ]} />
          <HowToRead steps={[
            { title: "Content and not content", text: "In the Lords a yes vote is \"Content\" and a no vote is \"Not content\"." },
            { title: "Against their party", text: "On a whipped vote, the side most of a party's peers took is its line. A peer on the other side has voted against it. Crossbenchers, bishops and non-affiliated peers have no whip." },
            { title: "Voting is not attending", text: "Peers can be in the House and not vote, and can vote remotely. The figures count recorded votes, not days sat." },
          ]} />
          <Unity parties={view.unity} />
          <section aria-labelledby="h-divided" style={{ marginTop: 32 }}>
            <h2 id="h-divided" style={heading}>Votes that split a party</h2>
            <p style={lede}>The divisions where the most peers voted against the way their own party voted.</p>
            <ul className="lv-list">{view.divided.map((d) => <Division key={d.id} d={d} />)}</ul>
          </section>
          {view.defeats.length > 0 && (
            <section aria-labelledby="h-defeats" style={{ marginTop: 32 }}>
              <h2 id="h-defeats" style={heading}>When the government lost</h2>
              <p style={lede}>The Lords often amends bills and sends them back to the Commons, where the government can usually overturn the change.</p>
              <ul className="lv-list">{view.defeats.slice(0, 8).map((d) => <Division key={d.id} d={d} />)}</ul>
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
