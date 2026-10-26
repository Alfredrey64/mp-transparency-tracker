/** @jsxImportSource react */
import { useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconCouncillor, IconSearch } from "./icons";
import { GlanceStrip } from "./GlanceStrip";
import { LoadFailedNote } from "./MpCards";
import Loading from "./Loading";
import { loadCouncilDetail } from "../lib/councilDetail";
import { seatsByParty, nextElectionText, longDate } from "../lib/councils";
import { loadCouncillorList, search, councillorPath, parseParam, partyCounts } from "../lib/councillorsView";
import "../councillors.css";

// Councillors: a search across every councillor in the UK (name, ward or council), and a page for each person with who runs their council, who
// they sit alongside, and whether they have changed party. Data is Open Council Data UK's (CC BY-SA 4.0), the same as the Your council page. Parish
// and town councillors are not covered, and nor are contact details, declared interests or voting records: those are not published as open data.

const fmt = (n) => Math.round(n).toLocaleString("en-GB");
const PAGE = 36;
const initialsOf = (name) => String(name ?? "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const href = (r) => `#${councillorPath(r)}`;

function Card({ r, parties }) {
  const p = parties[r.party] ?? { name: "Unknown", colour: "#8A94A6" };
  return (
    <li>
      <a className="cl-card" href={href(r)} style={{ "--pc": p.colour }}>
        <b>{r.name}</b>
        <span>{r.ward}, {r.council}</span>
        <span className="cl-chip"><i />{p.name}{r.moved ? ", changed party" : ""}</span>
      </a>
    </li>
  );
}

function Directory({ prepared }) {
  const { rows, parties } = prepared;
  const [query, setQuery] = useState("");
  const [party, setParty] = useState("all");
  const [moved, setMoved] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const found = useMemo(() => search(rows, query, { party: party === "all" ? null : Number(party), movedOnly: moved }), [rows, query, party, moved]);
  const top = useMemo(() => partyCounts(rows, parties).slice(0, 4), [rows, parties]);
  const nMoved = useMemo(() => rows.filter((r) => r.moved).length, [rows]);
  const reset = () => setShown(PAGE);
  return (
    <>
      <GlanceStrip items={[
        { value: fmt(rows.length), label: "councillors on the list", sub: "across every council in the UK", colour: "#1E4FB8" },
        ...top.slice(0, 3).map((t) => ({ value: fmt(t.count), label: t.name, sub: "councillors", colour: t.colour })),
        { value: fmt(nMoved), label: "changed party in the last year", sub: "they won under one party and now sit for another", colour: "#E0367A" },
      ].slice(0, 5)} />
      <div className="cl-tools">
        <div className="cl-search">
          <IconSearch size={18} />
          <input type="search" value={query} onChange={(e) => { setQuery(e.target.value); reset(); }} placeholder="Search by name, ward or council" aria-label="Search councillors" autoComplete="off" />
        </div>
        <select value={party} onChange={(e) => { setParty(e.target.value); reset(); }} aria-label="Party">
          <option value="all">Every party</option>
          {partyCounts(rows, parties).map((t) => <option key={t.idx} value={t.idx}>{t.name} ({fmt(t.count)})</option>)}
        </select>
        <label className="cl-check"><input type="checkbox" checked={moved} onChange={(e) => { setMoved(e.target.checked); reset(); }} style={{ width: 20, minHeight: 20 }} /> Changed party</label>
      </div>
      <div className="cl-count" aria-live="polite">{found.length === rows.length ? `All ${fmt(found.length)} councillors` : `${fmt(found.length)} ${found.length === 1 ? "councillor" : "councillors"} match`}</div>
      <ul className="cl-grid">{found.slice(0, shown).map((r) => <Card key={r.i} r={r} parties={parties} />)}</ul>
      {found.length > shown && <div className="cl-more"><button type="button" className="btn btn-secondary btn-lg" onClick={() => setShown((n) => n + PAGE)}>Show {Math.min(PAGE, found.length - shown)} more of {fmt(found.length - shown)} left</button></div>}
    </>
  );
}

function Profile({ prepared, target }) {
  const { rows, parties } = prepared;
  const r = rows.find((x) => x.councilId === target.councilId && x.ward === target.ward && x.name === target.name);
  const [ctx, setCtx] = useState({ council: null, moves: [] });
  useEffect(() => {
    if (!r) return undefined;
    let alive = true;
    Promise.all([import("../data/councilsIndex.json"), loadCouncilDetail(r.councilId).catch(() => null)]).then(([m, detail]) => {
      if (alive) setCtx({ council: m.default.index.find((c) => c.id === r.councilId) ?? null, moves: detail?.moved ?? [] });
    }).catch(() => {});
    return () => { alive = false; };
  }, [r]);
  if (!r) return <div className="cl-note" style={{ "--pc": "#C0504D", margin: "22px 0" }}>We couldn't find that councillor. They may have left office or the list has been updated. <a href="#/councillors">Search the list</a>.</div>;
  const p = parties[r.party] ?? { name: "Unknown", colour: "#8A94A6" };
  const mates = rows.filter((x) => x.councilId === r.councilId && x.ward === r.ward && x.i !== r.i);
  const seats = ctx.council ? seatsByParty(ctx.council, parties.map((x) => ({ short: x.name, name: x.name, colour: x.colour }))) : [];
  const move = ctx.moves.find(([ward, name]) => ward === r.ward && name === r.name);
  return (
    <article className="cl-profile" style={{ "--pc": p.colour }}>
      <div className="cl-profile-top">
        <span className="cl-avatar" aria-hidden="true">{initialsOf(r.name)}</span>
        <div>
          <h2>{r.name}</h2>
          <p>Councillor for {r.ward}, {r.council}</p>
          <p style={{ fontWeight: 700 }}>{p.name}</p>
        </div>
      </div>
      {move && <p className="cl-note" style={{ marginTop: 18 }}>Elected for {parties[move[2]]?.name ?? "another party"}, now sitting for {parties[move[3]]?.name ?? p.name}. Open Council Data spotted the change by comparing this year's list with last year's.</p>}
      <div className="cl-profile-body">
        <section className="cl-box" aria-labelledby="cl-h-council">
          <h3 id="cl-h-council">Who runs {r.council}</h3>
          {ctx.council ? (
            <>
              <p>{ctx.council.control}. {ctx.council.total} councillors in all.</p>
              <div className="cl-seats" role="img" aria-label="Seats by party">{seats.map((s) => <i key={s.idx} style={{ flexGrow: s.count, background: s.colour ?? "#8A94A6" }} title={`${s.short}: ${s.count}`} />)}</div>
              <div className="cl-key">{seats.slice(0, 5).map((s) => <span key={s.idx}><i style={{ background: s.colour ?? "#8A94A6" }} />{s.short} {s.count}</span>)}</div>
              <p>{nextElectionText(ctx.council)}</p>
            </>
          ) : <p>Loading the council's figures…</p>}
        </section>
        <section className="cl-box" aria-labelledby="cl-h-ward">
          <h3 id="cl-h-ward">{mates.length ? `Who else represents ${r.ward}` : `${r.ward} has one councillor`}</h3>
          {mates.length > 0 ? (
            <ul>{mates.map((m) => {
              const mp = parties[m.party] ?? { name: "Unknown", colour: "#8A94A6" };
              return <li key={m.i}><a className="cl-mate" href={href(m)} style={{ "--pc": mp.colour }}><span><b>{m.name}</b><small>{mp.name}</small></span></a></li>;
            })}</ul>
          ) : <p>Some wards elect one councillor, and some elect up to three. This ward has only one on the list.</p>}
        </section>
        <section className="cl-box" aria-labelledby="cl-h-do">
          <h3 id="cl-h-do">What a councillor does</h3>
          <p>Councillors vote on the council's budget, planning decisions and local services such as bins, roads, libraries, housing and social care. They also help residents with problems. Most councils decide things through committees, and a few have an elected mayor.</p>
          <p>You can write to yours for free through <a href="https://www.writetothem.com/" target="_blank" rel="noreferrer" style={{ color: COLORS.accentText, fontWeight: 700 }}>WriteToThem</a>, run by mySociety.</p>
        </section>
      </div>
      <div className="cl-links">
        <a className="btn btn-primary" href={`#/councils/${r.councilId}/${encodeURIComponent(r.ward)}`}>See {r.ward} on the council page</a>
        <a className="btn btn-secondary" href="#/councillors">Search all councillors</a>
        {ctx.council?.next?.[0] && <a className="btn btn-secondary" href="#/localElections">Next election: {longDate(ctx.council.next[0][0])}</a>}
      </div>
    </article>
  );
}

export default function Councillors({ param }) {
  const [prepared, setPrepared] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    loadCouncillorList().then((p) => alive && setPrepared(p)).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, []);
  const target = parseParam(param);
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconCouncillor}
        kicker="Your area & your say"
        title="Your councillors"
        subtitle="Search every councillor in the UK by name, ward or council. See who runs their council, who they sit alongside, and who has changed party."
      />
      {failed && <LoadFailedNote item="the councillor list" />}
      {!failed && !prepared && <Loading />}
      {prepared && (target ? <Profile key={param} prepared={prepared} target={target} /> : <Directory prepared={prepared} />)}
      {prepared && (
        <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.6, color: COLORS.inkSoft, marginTop: 26, maxWidth: 800 }}>
          Councillors, parties and election dates come from <a href="https://opencouncildata.co.uk" target="_blank" rel="noreferrer" style={{ color: COLORS.accentText, fontWeight: 600 }}>Open Council Data UK</a> (CC BY-SA 4.0), updated after each round of elections. Parish and town councillors are not included. Contact details, declared interests and voting records for councillors are not published as open data, so they are not shown here.
        </p>
      )}
    </div>
  );
}
