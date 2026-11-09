/** @jsxImportSource react */
import { useState, useId, useMemo, useEffect } from "react";
import { useReducedMotion } from "motion/react";
import { useGo } from "./story/useGo";
import { withScrollPreserved } from "../lib/preserveScroll";
import LEADERS from "../data/partyLeaders.json";
import { partyAge, chartScale } from "../lib/partyHistory";
import { bannerColours } from "../lib/partyBrand";
import PartyFlag from "./PartyFlag";
import LeaderPortrait from "./LeaderPortrait";
import { FLAG_OF } from "../lib/partyFlags";
import "../partyhistory.css";

// The "Party History & Lineage" tab: a chart of how long each party has existed and what it grew out of, then a card for each party with its story and its leader. The
// parties and their words come from PoliticalHistory; this only lays them out.

const yearOf = (text, from) => (/^\d{4}$/.test(String(text)) ? Number(text) : from);

// Each step of a party's lineage as a stretch of the chart, from the year it began to the year the next step began (or to today).
function stretches(party, { from, today }) {
  const steps = (party.lineage?.length ? party.lineage : [{ label: party.party, year: String(party.founded) }]).map((n) => ({ ...n, from: yearOf(n.year, from) }));
  return steps.map((n, i) => ({ ...n, to: i + 1 < steps.length ? steps[i + 1].from : today, last: i === steps.length - 1 }));
}

function Tree({ parties, counts, seatCountFor }) {
  const [ref, go] = useGo(0.1);
  const scale = useMemo(() => chartScale(), []);
  const { pct, ticks, today } = scale;
  const rows = useMemo(() => [...parties].map((p) => ({ p, runs: stretches(p, scale) })).sort((a, b) => a.runs[0].from - b.runs[0].from), [parties, scale]);
  return (
    <section className="ph-tree" aria-labelledby="ph-tree-h" ref={ref} data-go={go}>
      <div className="ph-tree-head">
        <h2 id="ph-tree-h">How long each party has been around</h2>
        <p>Each bar runs from the party's earliest root to today. A dot marks a step in its story: a new name, or another party joining it.</p>
      </div>
      <div className="ph-chart">
        <div className="ph-grid" aria-hidden="true">
          {ticks.map((y, i) => i % 2 === 1 && <i key={`b${y}`} style={{ left: `${pct(y)}%`, width: `${pct(y + 50) - pct(y)}%` }} />)}
          {ticks.map((y) => <u key={y} style={{ left: `${pct(y)}%` }}><span>{y}</span></u>)}
          <b className="ph-today" style={{ left: `${pct(today)}%` }}><span>Today</span></b>
        </div>
        <ol className="ph-rows">
          {rows.map(({ p, runs }, r) => {
            const n = seatCountFor(counts, p);
            return (
              <li key={p.party} className="ph-row" style={{ "--c": p.color, "--fill": bannerColours(p.brand ?? p.color).fill, "--on": bannerColours(p.brand ?? p.color).on, "--r": r }}>
                <div className="ph-who">
                  <b>{p.party}</b>
                  <span>Since {p.founded}{n > 0 ? ` · ${n} MPs` : ""}</span>
                </div>
                <div className="ph-track" aria-label={`${p.party}: ${runs.map((s) => `${s.label}, ${s.year}`).join("; then ")}`} role="img">
                  {runs.map((s, i) => {
                    const w = pct(s.to) - pct(s.from);
                    // The step's name is written inside its stretch only when it fits whole: on a phone the chart is narrow, so only the longest stretches carry a name.
                    return (
                      <span key={`${s.label}-${s.year}`} className="ph-seg" data-last={s.last ? "1" : "0"} data-first={i === 0 ? "1" : "0"} data-m={w >= s.label.length * 2.1 + 3 ? "1" : "0"} data-d={w >= s.label.length * 1.1 + 3 ? "1" : "0"} style={{ left: `${pct(s.from)}%`, width: `${w}%`, "--k": i }} title={`${s.label}, ${s.year}`}>
                        <em>{s.label}</em>
                      </span>
                    );
                  })}
                  {runs.map((s, i) => <i key={`d${s.label}-${s.year}`} className="ph-dot" data-first={i === 0 ? "1" : "0"} style={{ left: `${pct(s.from)}%`, "--k": i }} title={`${s.label}, ${s.year}`} />)}
                  <i className="ph-dot ph-end" style={{ left: `${pct(today)}%`, "--k": runs.length }} />
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

// A count that runs up to its number once, when the card scrolls into view. Anyone who has asked for calmer motion sees the number straight away.
function CountUp({ to, go }) {
  const still = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (still || go !== "1") return undefined;
    let frame;
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / 1100);
      setN(Math.round(to * (1 - (1 - k) ** 3)));
      if (k < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [go, to, still]);
  return <>{still ? to : n}</>;
}

// The "How it got here" flow: one box for each name the party has had, joined by a line that draws itself, ending in the party as it is today. A step that begins "+" is
// another party joining it, and is drawn as a smaller dashed box.
function Flow({ runs }) {
  return (
    <ol className="ph-flow">
      {runs.map((n, i) => {
        const merge = n.label.startsWith("+ ");
        const kind = merge ? "merge" : i === runs.length - 1 ? "now" : "step";
        return (
          <li key={`${n.label}-${n.year}`} data-kind={kind} style={{ "--k": i, "--t": runs.length > 1 ? i / (runs.length - 1) : 1 }}>
            <span className="ph-node">
              <time>{n.year}</time>
              <b>{merge ? <><i aria-hidden="true">+</i><span className="ph-sr">joined by </span>{n.label.slice(2)}</> : n.label}</b>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Card({ party, seatCount, leader }) {
  const [open, setOpen] = useState(false);
  const [ref, go] = useGo(0.25);
  const id = useId();
  const runs = party.lineage ?? [];
  const age = partyAge(party.founded);
  const b = bannerColours(party.brand ?? party.color);
  return (
    <article ref={ref} data-go={go} className="ph-card" data-dark={b.dark ? "1" : "0"} style={{ "--c": party.color, "--b1": b.from, "--b2": b.to, "--fill": b.fill, "--on": b.on }} data-open={open ? "1" : "0"}>
      <header className="ph-banner">
        <div className="ph-art" aria-hidden="true">
          <span className="ph-pattern" />
          <PartyFlag kind={FLAG_OF[party.party]} />
        </div>
        <div className="ph-title">
          <h3>{party.party}</h3>
          <p className="ph-ideology">{party.ideology}</p>
          {leader && <p className="ph-led">{leader.role === "President" ? "President" : "Leader"} <b>{leader.name}</b></p>}
          <ul className="ph-chips">
            {seatCount > 0 && <li><b><CountUp to={seatCount} go={go} /></b> MPs now</li>}
            <li><b>{age}</b> years old</li>
          </ul>
        </div>
        {leader && <LeaderPortrait leader={leader} />}
      </header>
      <div className="ph-body">
        <p className="ph-founded">Founded {party.founded}</p>
        <p className="ph-text">{party.text}</p>
        {runs.length > 1 && (
          <div className="ph-lineage">
            <h4>How it got here</h4>
            <Flow runs={runs} />
          </div>
        )}
        <button type="button" className="ph-more" aria-expanded={open} aria-controls={id} onClick={() => withScrollPreserved(() => setOpen((v) => !v))}>
          {open ? "Hide the timeline" : "Show the timeline and leaders"}
          <i aria-hidden="true" />
        </button>
        <div className="ph-panel" id={id} inert={!open}>
          <div>
            <h4>Timeline</h4>
            <ol className="ph-time">
              {party.timeline.map((t) => <li key={`${t.year}-${t.event}`}><b>{t.year}</b><span>{t.event}</span></li>)}
            </ol>
            <h4>Notable leaders</h4>
            <ul className="ph-leaders">{party.leaders.map((l) => <li key={l}>{l}</li>)}</ul>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function PartyHistoryTab({ parties, counts, seatCountFor }) {
  return (
    <div className="ph">
      <Tree parties={parties} counts={counts} seatCountFor={seatCountFor} />
      <div className="ph-cards">
        {parties.map((p) => <Card key={p.party} party={p} seatCount={seatCountFor(counts, p)} leader={LEADERS.leaders[p.party]} />)}
      </div>
      <p className="ph-credit">Current leaders from each party’s Wikipedia page, portraits from Wikimedia Commons, checked {new Date(LEADERS.retrieved).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.</p>
    </div>
  );
}
