/** @jsxImportSource react */
import { useState } from "react";
import CountUp from "./CountUp";
import { useBenchmarks } from "../lib/useBenchmarks";
import { mpMoney, independence, dotAt, yearLabel, spread } from "../lib/areaMp";
import { IconTrend, IconVote, IconPinHome } from "./icons";
import { partyHue, partyShort } from "../lib/areaReps";
import { longDate } from "../lib/councils";
import { Card } from "./AreaSections";
import ShareButton from "./ShareButton";
import { areaShareSpec } from "../lib/shareSpecs";
import { daysUntil } from "../lib/localElections";
import { navigate } from "../lib/route";
import { IconSeatCompare } from "./icons";

// Two cards about the MP that need only records the site already holds: what they have declared and claimed, and how often they vote against their own
// party. Both say where the figure sits among all MPs and never whether that is good or bad.

const money = (n) => `£${Math.round(n).toLocaleString("en-GB")}`;
const Skel = () => <div className="ma-skel" aria-hidden="true">{[92, 78, 64].map((w) => <i key={w} style={{ width: `${w}%` }} />)}</div>;

export function MpMoneyCard({ x, mp, i }) {
  const bench = useBenchmarks();
  const mine = mp ? bench?.byMp?.[mp.id] : null;
  const m = x?.interests ? mpMoney({
    interests: x.interests, expenses: mp?.ipsa_expenses ?? null,
    declared: mine?.declared, declaredSorted: bench?.distributions?.declared, expensesSorted: bench?.distributions?.expenses,
  }) : null;
  const top = m ? Math.max(1, ...m.groups.map((g) => g.count)) : 1;
  const e = m?.expenses;
  const name = mp?.name ?? "Your MP";
  return (
    <Card i={i} colour="#0F8B8D" icon={<IconTrend size={20} />} title={`What ${name} has declared and claimed`} className="ma-money">
      {!mp ? <p className="ma-sub">We could not match this seat to a current MP.</p> : x?.interests === undefined ? <Skel /> : x.interests === null ? <p className="ma-sub">We could not reach the Register of Members' Financial Interests just now. <a href={`#/mp/${mp.id}`}>Their page</a> may have it.</p> : (
        <>
          <div className="ma-money-figs">
            <div><span>Declared in the register</span><b><CountUp value={m.total} format={money} /></b><small>{m.entries === 0 ? "Nothing is listed against their name." : `${m.entries} ${m.entries === 1 ? "entry" : "entries"}, ${m.valuedCount} with a value.`}</small></div>
            <div><span>Claimed in business costs</span><b>{e ? <CountUp value={e.total} format={money} /> : "None yet"}</b><small>{e ? `${yearLabel(e.year) ? `So far in ${yearLabel(e.year)}.` : ""}${e.previous != null ? ` ${money(e.previous)} the year before.` : ""}` : "Nothing is published for this financial year yet."}</small></div>
          </div>
          {m.groups.length > 0 && (
            <ul className="ma-money-groups" aria-label="What was declared, by kind">
              {m.groups.map((g, n) => (
                <li key={g.key} style={{ "--n": n }}>
                  <span><b>{g.label}</b><em>{g.count}{g.value > 0 ? `, ${money(g.value)}` : ""}</em></span>
                  <i style={{ "--w": g.count / top }} />
                </li>
              ))}
            </ul>
          )}
          <ul className="ma-money-notes">
            {m.ongoing > 0 && <li>{m.ongoing === 1 ? "One ongoing paid job or role is" : `${m.ongoing} ongoing paid jobs or roles are`} declared.</li>}
            {m.largest && <li>The largest single entry is {money(m.largest.value)}{m.largest.from ? `, from ${m.largest.from}` : ""}.</li>}
            {m.recent > 0 && <li>{m.recent} {m.recent === 1 ? "entry was" : "entries were"} registered in the last 12 months.</li>}
            {m.declaredPlace && m.total > 0 && <li>Among all MPs, the amount declared is <b>{m.declaredPlace.band.label.toLowerCase()}</b>.</li>}
            {e?.place && <li>Among all MPs, the business costs claimed so far this year are <b>{e.place.band.label.toLowerCase()}</b>.</li>}
            {e?.topCategory && <li>The biggest part of the claim is {e.topCategory.category.toLowerCase()}, {money(e.topCategory.amount)}.</li>}
          </ul>
          <p className="ma-sub">Declaring something is what the rules require, and does not mean anything is wrong. Business costs pay for staff, travel and an office, not for the MP's own pay.</p>
          <a className="ma-link" href={`#/mp/${mp.id}`}>Every entry, with its source</a>
        </>
      )}
    </Card>
  );
}

export function IndependenceCard({ mp, i }) {
  const bench = useBenchmarks();
  const sorted = bench?.distributions?.rebelPct;
  const r = mp && bench ? independence({ rate: bench.byMp?.[mp.id]?.rebelPct, sorted, party: mp.party }) : null;
  const bands = r?.kind === "ok" ? spread(sorted, r.rate) : [];
  const topBand = Math.max(1, ...bands.map((b) => b.count));
  const fmt = (n) => `${(Math.round(n * 10) / 10).toFixed(1).replace(/\.0$/, "")}%`;
  return (
    <Card i={i} colour="#7A5AF0" icon={<IconVote size={20} />} title="How often they vote against their party" className="ma-indep">
      {!mp ? <p className="ma-sub">We could not match this seat to a current MP.</p> : !bench ? <Skel /> : !r ? <p className="ma-sub">The comparison with other MPs is not available just now.</p> : r.kind === "none" ? <p>{r.reason}</p> : r.kind === "few" ? (
        <p>{mp.name} has not yet voted often enough, on votes where their party had a clear position, for a fair comparison. We wait for ten.</p>
      ) : (
        <>
          <p className="ma-indep-big"><b><CountUp value={r.rate} format={fmt} /></b> <span>of the votes where their party had a clear position, they voted the other way</span></p>
          <div className="ma-indep-line" role="img" aria-label={`${mp.name} voted against their party in ${fmt(r.rate)} of votes. The typical MP did so in ${fmt(r.median)}. The highest is ${fmt(r.max)}.`}>
            <span className="ma-indep-track"><i style={{ "--at": `${dotAt(r.rate, r.max)}%` }} /><s style={{ "--at": `${dotAt(r.median, r.max)}%` }} /><u style={{ "--at": `${dotAt(r.rate, r.max)}%` }} /></span>
            <span className="ma-indep-ends" aria-hidden="true"><small>{r.median === 0 ? "Never (the typical MP)" : "Never"}</small>{r.median > 0 && <small style={{ "--at": `${dotAt(r.median, r.max)}%` }} className="ma-indep-mid">Typical MP {fmt(r.median)}</small>}<small>{fmt(r.max)}</small></span>
          </div>
          <p>{r.never ? `${mp.name} has not voted against their party in any of the votes we track.` : `That is ${r.band.tone === "high" ? "higher than" : r.band.tone === "low" ? "lower than" : "close to"} most MPs.`} {r.of - r.everRebelled} of the {r.of} MPs compared have never done so.</p>
          <div className="ma-spread" role="img" aria-label={`How the ${r.of} MPs compared are spread: ${bands.map((b) => `${b.count} at ${b.label.toLowerCase()}`).join(", ")}. ${mp.name} is in the band ${bands.find((b) => b.mine)?.label.toLowerCase()}.`}>
            {bands.map((b, n) => <span key={b.label} className={b.mine ? "mine" : undefined} style={{ "--n": n }}><i style={{ "--h": Math.sqrt(b.count / topBand) }} /><b>{b.count}</b><small>{b.label}</small></span>)}
          </div>
          <p className="ma-sub">This counts the {bench.divisions} Commons votes the site follows. The whips' instructions are not published, so it measures voting against the majority of the MP's own party. A free vote is not a rebellion.</p>
          <a className="ma-link" href="#/rebels">Who votes against their party, and on what</a>
        </>
      )}
    </Card>
  );
}

const initials = (name) => String(name ?? "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

function Person({ p, n }) {
  return (
    <li className="ma-rep" style={{ "--pc": partyHue(p.party), "--n": n }}>
      <span className="ma-rep-av" aria-hidden="true">{initials(p.name)}</span>
      <b>{p.name}</b>
      {p.party && <small>{partyShort(p.party)}</small>}
    </li>
  );
}

const SOON = "https://www.gov.uk/government/news/police-and-crime-commissioners-to-be-scrapped";
const LOOKUPS = {
  Senedd: ["https://senedd.wales/find-a-member", "Find your Senedd members"],
  "Scottish Parliament": ["https://www.parliament.scot/msps/find-your-msp", "Find your MSPs on the Parliament's site"],
  "Northern Ireland Assembly": ["https://www.niassembly.gov.uk/", "The Assembly's own website"],
};

// The other elected people for this postcode, besides the MP and the council.
export function RepsCard({ x, country, i }) {
  const reps = x?.reps;
  const { police, mayor, devolved } = reps ?? {};
  const link = devolved ? LOOKUPS[devolved.body] : null;
  return (
    <Card i={i} colour="#2A7FA8" icon={<IconPinHome size={20} />} title="Everyone else who speaks for you" className="ma-reps">
      {reps === undefined ? <Skel /> : reps === null ? <p className="ma-sub">We could not load the list of representatives just now.</p> : (
        <>
          <p className="ma-sub">Besides your MP and your councillors, these are the other elected people for your postcode, from the lists published by Parliament, the devolved parliaments and the Association of Police and Crime Commissioners.</p>
          <div className="ma-rep-groups">
            {police && (
              <section>
                <h4>Police</h4>
                <p><b>{police.force}</b></p>
                {police.kind === "commissioner" && (police.person ? <ul className="ma-rep-list"><Person p={police.person} n={0} /></ul> : <p className="ma-sub">We could not match this force to its commissioner.</p>)}
                {police.kind === "commissioner" && police.person && <p className="ma-sub">Police and crime commissioner. The government has said the role will end in 2028. <a href={SOON} target="_blank" rel="noreferrer">What it announced</a></p>}
                {police.kind === "mayor" && (police.person && mayor?.person?.name === police.person.name ? <p className="ma-sub">Here the regional mayor does the job a police and crime commissioner does elsewhere. That is {police.person.name}, below.</p> : police.person ? <><ul className="ma-rep-list"><Person p={police.person} n={0} /></ul><p className="ma-sub">{police.post}. The mayor does the job a police and crime commissioner does elsewhere.</p></> : <p className="ma-sub">The regional mayor does the job of a police and crime commissioner here.</p>)}
                {police.kind === "city" && <p className="ma-sub">Overseen by the City of London Corporation's police authority, not by a commissioner.</p>}
                {police.kind === "scotland" && <p className="ma-sub">Policing in Scotland is overseen by the Scottish Police Authority and answers to the Scottish Parliament. There are no police commissioners.</p>}
                {police.kind === "ni" && <p className="ma-sub">Policing in Northern Ireland is overseen by the Northern Ireland Policing Board. There are no police commissioners.</p>}
              </section>
            )}
            {mayor && (
              <section>
                <h4>Regional mayor</h4>
                <p><b>{mayor.authority}</b></p>
                {mayor.person ? <><ul className="ma-rep-list"><Person p={mayor.person} n={1} /></ul><p className="ma-sub">{mayor.post}.</p></> : <p className="ma-sub">This regional authority has no elected mayor yet.</p>}
              </section>
            )}
            {!mayor && country === "England" && (
              <section>
                <h4>Regional mayor</h4>
                <p className="ma-sub">Your council is not part of a regional authority with an elected mayor. Many parts of England are still outside one. <a href="#/mayors">How they work</a></p>
              </section>
            )}
          </div>
          {devolved && (
            <section className="ma-rep-dev">
              <h4>{devolved.body}: {devolved.seat}</h4>
              {devolved.constituencyMember ? (
                <>
                  <p className="ma-rep-sub">Your constituency MSP</p>
                  <ul className="ma-rep-list ma-rep-grid"><Person p={devolved.constituencyMember} n={0} /></ul>
                  <p className="ma-rep-sub">Your seven regional MSPs, for {devolved.region}</p>
                  <ul className="ma-rep-list ma-rep-grid">{devolved.regional.map((m, n) => <Person key={m.name} p={m} n={n + 1} />)}</ul>
                </>
              ) : <ul className="ma-rep-list ma-rep-grid">{devolved.members.map((m, n) => <Person key={m.name} p={m} n={n} />)}</ul>}
              <p className="ma-sub">{devolved.note}</p>
              {link && <a className="ma-link" href={link[0]} target="_blank" rel="noreferrer">{link[1]}</a>}
            </section>
          )}
          {reps.scotlandLookupFailed && <p className="ma-sub">We could not find your Scottish Parliament constituency just now. <a href="https://www.parliament.scot/msps/find-your-msp" target="_blank" rel="noreferrer">Find your MSPs on the Parliament's site</a>.</p>}
          {!devolved && !reps.scotlandLookupFailed && country === "England" && <p className="ma-sub">England has no parliament of its own. Laws for England are made at Westminster.</p>}
          <p className="ma-sub">Checked on {longDate(reps.checked)}. After an election or a resignation the lists can lag by a few days.</p>
        </>
      )}
    </Card>
  );
}

// Share, print or compare: the ways to take this page somewhere else.
export function AreaTools({ data, x, i }) {
  const { result: r, mp, council, regionName } = data;
  const [other, setOther] = useState("");
  const [state, setState] = useState({ busy: false, error: null });
  const mine = r.parliamentary_constituency;
  const near = (x?.map?.neighbours ?? []).slice(0, 4);
  const go = (a, b) => navigate(`#/compareSeats/${encodeURIComponent(`${a}~${b}`)}`);
  const compare = async (e) => {
    e.preventDefault();
    if (!other.trim()) return;
    setState({ busy: true, error: null });
    try {
      const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(other.trim())}`);
      const json = await res.json();
      const seat = json?.result?.parliamentary_constituency;
      if (!res.ok || !seat) throw new Error("postcode");
      if (seat === mine) { setState({ busy: false, error: `That postcode is in ${mine} too. Try one from a different seat.` }); return; }
      go(mine, seat);
    } catch { setState({ busy: false, error: "We couldn't find that postcode. Check it is a full, valid UK postcode." }); }
  };
  const spec = () => {
    const next = x?.contests?.[0]?.date ?? council?.next?.[0]?.[0] ?? null;
    const days = next ? daysUntil(next) : null;
    return areaShareSpec({
      place: [r.admin_ward, council?.name ?? r.admin_district ?? mine].filter(Boolean).join(", "), constituency: mine, regionName, mp,
      majority: x?.seat?.result?.majority ?? null, turnoutPct: x?.seat?.turnout?.pct ?? null, taxBandD: x?.tax?.last ?? null,
      nextElection: days != null && days > 0 ? { value: days.toLocaleString("en-GB"), label: "days to the next election here" } : null,
      council, link: `${window.location.origin}/myArea`,
    });
  };
  return (
    <Card i={i} colour="#7A5AF0" icon={<IconSeatCompare size={20} />} title="Share it, print it or compare it" className="ma-tools">
      <div className="ma-tools-grid">
        <div>
          <h4>Take this page with you</h4>
          <p className="ma-sub">A picture to send to someone, or the whole page on paper or as a PDF. Your postcode is never in either.</p>
          <div className="ma-tools-row">
            <ShareButton getSpec={spec} filename="my-area" label="Share a summary card" />
            <button type="button" className="btn btn-secondary" onClick={() => window.print()}>Print or save as PDF</button>
          </div>
        </div>
        <div>
          <h4>Compare {mine} with another place</h4>
          <form className="ma-tools-form" onSubmit={compare}>
            <input value={other} onChange={(e) => setOther(e.target.value)} placeholder="A friend's postcode" aria-label="A postcode to compare with" autoComplete="off" />
            <button type="submit" className="btn btn-primary" disabled={state.busy}>{state.busy ? "Looking…" : "Compare"}</button>
          </form>
          {state.error && <p className="ma-err" role="alert">{state.error}</p>}
          {near.length > 0 && (
            <p className="ma-tools-near"><span>Or a seat next to yours:</span>{near.map((n) => <button key={n.key} type="button" className="ma-chipbtn" onClick={() => go(mine, n.name)}>{n.name}</button>)}</p>
          )}
          <p className="ma-sub">It looks up the postcode once, then opens the two seats side by side. <a href="#/compareCouncils">Compare councils</a> works the same way.</p>
        </div>
      </div>
    </Card>
  );
}
