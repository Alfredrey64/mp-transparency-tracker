/** @jsxImportSource react */
import { useEffect, useRef, useState } from "react";
import { useGo } from "./useGo";
import AnimatedValue from "./AnimatedValue";
import { monthName } from "../../lib/instrumentsView";
import { caseStudy, shortDate, dayGap } from "../../lib/instrumentsCase";
import "../../siart.css";

// The pictures on the Laws made by ministers page. Each plays once when it scrolls into view and can be pressed to play again. Their motion is in siart.css and is
// switched off for anyone who has asked for calmer motion, so they see the finished picture.

const GREEN = "#3F7D5C";
const SLATE = "#5B6784";

function Paper() {
  return (
    <svg viewBox="0 0 26 32" aria-hidden="true">
      <path d="M2 2h15l7 7v21H2z" /><path d="M17 2v7h7" className="fold" />
      <path d="M7 15h12M7 20h12M7 25h8" className="rule" />
    </svg>
  );
}

// An Act with a gap in it, and the instrument that fills the gap.
export function SiFill() {
  const [ref, go] = useGo(0.3);
  const [on, setOn] = useState(false);
  const own = useRef(false);
  useEffect(() => {
    if (go !== "1") return undefined;
    const t = setTimeout(() => { if (!own.current) setOn(true); }, 1800);
    return () => clearTimeout(t);
  }, [go]);
  const pick = (v) => { own.current = true; setOn(v); };
  return (
    <figure ref={ref} className="sif" data-go={go} data-on={on ? "1" : "0"}>
      <figcaption>How an Act and an instrument fit together</figcaption>
      <div className="sif-ctl" role="group" aria-label="Before or after the minister writes the instrument">
        <button type="button" aria-pressed={!on} onClick={() => pick(false)}>The Act on its own</button>
        <button type="button" aria-pressed={on} onClick={() => pick(true)}>With the minister&rsquo;s instrument</button>
      </div>
      <div className="sif-stage">
        <div className="sif-sheet sif-act">
          <b className="sif-h">The Act</b>
          <span className="sif-sub">Passed by a vote in both Houses</span>
          <span className="sif-lines" aria-hidden="true"><i /><i /><i /></span>
          <p className="sif-key">This part of the Act starts on <span className="sif-gap"><span className="sif-empty">a day to be set</span><span className="sif-full">1 April</span></span>.</p>
          <span className="sif-lines" aria-hidden="true"><i /><i /></span>
        </div>
        <div className="sif-arrow" aria-hidden="true">
          <svg viewBox="0 0 90 24"><path d="M2 12h74" className="line" /><path d="M70 5l14 7-14 7" className="head" /></svg>
          <span>fills the gap</span>
        </div>
        <div className="sif-sheet sif-si">
          <b className="sif-h">The statutory instrument</b>
          <span className="sif-sub">Written by the minister</span>
          <span className="sif-lines" aria-hidden="true"><i /><i /></span>
          <p className="sif-key">That part of the Act starts on <b>1 April</b>.</p>
          <span className="sif-lines" aria-hidden="true"><i /><i /></span>
        </div>
      </div>
      <p className="sif-say" aria-live="polite">{on
        ? "The instrument fills the gap with a day, so the Act now has its start date. The instrument is law too. No new Act was needed."
        : "The Act sets a rule but leaves one detail open, and says the minister may fill it in by writing an instrument."}</p>
      <p className="sif-eg">A made-up example of a common kind: an Act that starts on a day to be set.</p>
    </figure>
  );
}

const SCENE = {
  approve: {
    name: "It needs Parliament\u2019s approval",
    yes: { button: "Parliament approves it", title: "It becomes law", say: "Both Houses usually have to approve it, normally after a debate and a vote. A draft then becomes law, and one that was already made stays law." },
    no: { button: "Parliament says no", title: "It falls away", say: "A draft never becomes law, and one that was already made stops being law. Parliament has to vote for these, so a No is possible, though very rare." },
  },
  object: {
    name: "It goes ahead unless a House objects",
    yes: { button: "No House objects", title: "It stands", say: "If neither House objects within 40 days (recesses do not count) it stands. There is no vote and no guaranteed debate." },
    no: { button: "A House objects", title: "It falls away", say: "If either House passes a motion against it, it is rejected. A draft does not become law and one already made stops being law." },
  },
};

// Two ways an instrument is checked, to try side by side: pick the route and what Parliament does, and watch the instrument travel.
export function SiRoutes() {
  const [ref, go] = useGo(0.25);
  const [route, setRoute] = useState("approve");
  const [out, setOut] = useState("yes");
  const [run, setRun] = useState(0);
  const sc = SCENE[route];
  const c = sc[out];
  return (
    <figure ref={ref} className="sir" data-go={go} data-route={route} data-out={out}>
      <figcaption>Try the two routes</figcaption>
      <div className="sir-ctl">
        <div className="sir-seg" role="group" aria-label="Which route the instrument takes">
          {Object.entries(SCENE).map(([k, v]) => <button key={k} type="button" aria-pressed={route === k} onClick={() => setRoute(k)}>{v.name}</button>)}
        </div>
        <div className="sir-seg" role="group" aria-label="What Parliament does">
          {["yes", "no"].map((k) => <button key={k} type="button" aria-pressed={out === k} data-k={k} onClick={() => setOut(k)}>{sc[k].button}</button>)}
        </div>
      </div>
      <div className="sir-stage" key={`${route}-${out}-${run}`}>
        <div className="sir-rail" aria-hidden="true"><span className="sir-doc"><Paper /></span></div>
        <div className="sir-card sir-laid">
          <b>Laid before Parliament</b>
          <span>The minister puts it in front of MPs and peers</span>
        </div>
        <span className="sir-lane" aria-hidden="true" />
        <div className="sir-card sir-check">
          {route === "approve" ? (
            <>
              <b>Debate and vote</b>
              <span className="sir-votes" aria-hidden="true">
                <i className="a"><em>One House</em><u /></i>
                <i className="b"><em>The other House</em><u /></i>
              </span>
            </>
          ) : (
            <>
              <b>40 days to object</b>
              <span className="sir-clock" aria-hidden="true"><i /><em>Day 1</em><em>Day 40</em></span>
              <span className="sir-flag" aria-hidden="true">A House objects</span>
            </>
          )}
        </div>
        <span className="sir-lane" aria-hidden="true" />
        <div className="sir-card sir-res">
          <i className="sir-mark" aria-hidden="true" />
          <b>{c.title}</b>
        </div>
      </div>
      <p className="sir-say" aria-live="polite">{c.say}</p>
      <button type="button" className="sir-again" onClick={() => setRun((n) => n + 1)}>Play it again</button>
    </figure>
  );
}

// Parliament can only accept or reject: try to change a line, then try the two things it can do.
export function SiNoAmend() {
  const [ref, go] = useGo(0.3);
  const [st, setSt] = useState({ k: "idle", n: 0 });
  const set = (k) => setSt((s) => ({ k, n: s.n + 1 }));
  const SAY = {
    idle: "An instrument comes to Parliament as one block. Try to change a line, then try the two things MPs and peers can do.",
    tried: "Not allowed. With very few exceptions, MPs and peers cannot change the wording of an instrument.",
    yes: "Approved as it stands, every line.",
    no: "Rejected as a whole, even if only one line was the problem.",
  };
  return (
    <figure ref={ref} className="sin" data-go={go} data-k={st.k}>
      <figcaption>Can Parliament change a word?</figcaption>
      <div className="sin-ctl" role="group" aria-label="What an MP or peer can do with an instrument">
        <button type="button" aria-pressed={st.k === "tried"} onClick={() => set("tried")}>Try to change a line</button>
        <button type="button" aria-pressed={st.k === "yes"} data-k="yes" onClick={() => set("yes")}>Approve it</button>
        <button type="button" aria-pressed={st.k === "no"} data-k="no" onClick={() => set("no")}>Reject it</button>
      </div>
      <div className="sin-stage">
        <div className="sin-sheet" key={st.n}>
          <span className="sin-lines" aria-hidden="true"><i /><i /><i className="pick" /><i /><i /></span>
          <span className="sin-pen" aria-hidden="true" />
          <span className="sin-stamp" aria-hidden="true">{st.k === "tried" ? "Locked" : st.k === "yes" ? "Approved" : st.k === "no" ? "Rejected" : ""}</span>
        </div>
      </div>
      <p className="sin-say" aria-live="polite">{SAY[st.k]}</p>
    </figure>
  );
}

// A minister changes the words of an Act by instrument: one line is struck out and a new one takes its place.
export function SiHenry() {
  const [ref, go] = useGo(0.3);
  const [on, setOn] = useState(false);
  const own = useRef(false);
  useEffect(() => {
    if (go !== "1") return undefined;
    const t = setTimeout(() => { if (!own.current) setOn(true); }, 1600);
    return () => clearTimeout(t);
  }, [go]);
  const pick = (v) => { own.current = true; setOn(v); };
  return (
    <figure ref={ref} className="sih" data-go={go} data-on={on ? "1" : "0"}>
      <figcaption>What a Henry VIII power does</figcaption>
      <div className="sih-ctl" role="group" aria-label="Before or after the minister uses the power">
        <button type="button" aria-pressed={!on} onClick={() => pick(false)}>The Act as Parliament passed it</button>
        <button type="button" aria-pressed={on} onClick={() => pick(true)}>After the minister uses the power</button>
      </div>
      <div className="sih-sheet">
        <b className="sih-h">The Act</b>
        <span className="sih-lines" aria-hidden="true"><i /><i /></span>
        <p className="sih-line"><span className="old">Applications must be made within 28 days.</span><span className="new">Applications must be made within 56 days.</span></p>
        <span className="sih-lines" aria-hidden="true"><i /><i /></span>
        <span className="sih-tag" aria-hidden="true">Changed by an instrument</span>
      </div>
      <p className="sih-say" aria-live="polite">{on
        ? "The words of the Act itself have changed, by instrument and not by a new Act. Critics say this is Parliament’s job alone. Some uses, like this one, are purely technical."
        : "A Henry VIII power lets a minister change the words of an Act using an instrument. Press the second button to see it happen."}</p>
      <p className="sih-eg">A made-up example, to show the idea.</p>
    </figure>
  );
}

// Who looks at the powers before an Act, and who reads the instrument afterwards.
const CHECKS = [
  { when: "While the Bill is still being debated", say: "These committees look at the powers it would give ministers.", colour: "#C88A1E", nodes: [["Delegated Powers and Regulatory Reform Committee", "A Lords committee"], ["Constitution Committee", "A Lords committee"]] },
  { when: "Once an instrument has been laid", say: "These committees read the instrument and report on it.", colour: "#3F7D5C", nodes: [["Joint Committee on Statutory Instruments", "Technical and legal points"], ["Secondary Legislation Scrutiny Committee", "Lords: the policy behind it"]] },
];
export function SiCheckers() {
  const [ref, go] = useGo(0.25);
  return (
    <figure ref={ref} className="sic" data-go={go}>
      <figcaption>Who reads them before MPs vote</figcaption>
      <ol className="sic-lanes">
        {CHECKS.map((l, i) => (
          <li key={l.when} style={{ "--tc": l.colour, "--i": i }}>
            <div className="sic-head"><b>{l.when}</b><span>{l.say}</span></div>
            <div className="sic-track" aria-hidden="true"><i /></div>
            <ul>
              {l.nodes.map(([name, note], k) => (
                <li key={name} style={{ "--k": k }}><b>{name}</b><span>{note}</span></li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </figure>
  );
}

// Month by month: tall columns, green for what Parliament had to approve and slate for the rest. Press a month to read it.
export function SiMonths({ months, generated }) {
  const [ref, go] = useGo(0.25);
  const totals = months.map((m) => m.approve + m.object);
  const top = Math.max(...totals);
  const busy = totals.indexOf(top);
  const [sel, setSel] = useState(busy);
  const m = months[sel];
  const partial = months.at(-1).month === generated.slice(0, 7);
  const label = (x) => monthName(x.month);
  const short = (x, i) => {
    const d = new Date(`${x.month}-01T12:00:00Z`);
    const mo = d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
    return { mo, yr: i === 0 || mo === "Jan" ? `\u2019${String(d.getUTCFullYear()).slice(2)}` : "" };
  };
  return (
    <figure ref={ref} className="sim" data-go={go}>
      <figcaption>Instruments laid, month by month</figcaption>
      <p className="sim-key"><span><i style={{ background: GREEN }} />Parliament must approve</span><span><i style={{ background: SLATE }} />Goes ahead unless a House objects</span></p>
      <p className="sim-read" aria-live="polite">
        <b>{label(m)}</b>
        <span>{totals[sel]} laid: {m.approve} had to be approved, {m.object} could be objected to.{sel === busy ? " The busiest month." : ""}{partial && sel === months.length - 1 ? " The month is not over yet." : ""}</span>
      </p>
      <ol className="sim-cols">
        {months.map((x, i) => (
          <li key={x.month} style={{ "--i": i }}>
            <button type="button" aria-pressed={sel === i} data-part={partial && i === months.length - 1 ? "1" : "0"} onClick={() => setSel(i)} aria-label={`${label(x)}: ${totals[i]} laid, ${x.approve} had to be approved, ${x.object} could be objected to`}>
              <span className="sim-bar" style={{ height: `${Math.max(3, (totals[i] / top) * 100)}%` }}>
                <i className="o" style={{ flexGrow: x.object }} />
                <i className="a" style={{ flexGrow: x.approve }} />
              </span>
              <em>{short(x, i).mo}<small>{short(x, i).yr}</small></em>
            </button>
          </li>
        ))}
      </ol>
      <p className="sim-note">{partial ? `${label(months.at(-1))} is not over yet.` : ""} Few are laid while Parliament is in recess.</p>
    </figure>
  );
}

// The four names as a grid: is it law yet when Parliament sees it, and what can Parliament do about it.
const CELLS = [["Draft affirmative", "draft", "approve"], ["Draft negative", "draft", "object"], ["Made affirmative", "made", "approve"], ["Made negative", "made", "object"]];
export function SiGrid({ data }) {
  const [ref, go] = useGo(0.2);
  const total = Object.values(data.procedures).reduce((a, b) => a + b, 0);
  const pct = (n) => { const p = (n / total) * 100; return `${p >= 10 ? Math.round(p) : p.toFixed(1)}%`; };
  return (
    <figure ref={ref} className="sig" data-go={go}>
      <figcaption>The four names, and how many of each</figcaption>
      <div className="sig-grid">
        <span className="sig-corner" aria-hidden="true" />
        <span className="sig-col" style={{ "--tc": GREEN }}>Parliament must approve it</span>
        <span className="sig-col" style={{ "--tc": SLATE }}>Goes ahead unless a House objects</span>
        <span className="sig-row">Draft<small>Not law yet when Parliament sees it</small></span>
        {CELLS.slice(0, 2).map(([name, row, route], i) => <Cell key={name} data={data} name={name} row={row} route={route} i={i} n={data.procedures[name] ?? 0} share={pct(data.procedures[name] ?? 0)} total={total} />)}
        <span className="sig-row">Made<small>Already law when Parliament sees it</small></span>
        {CELLS.slice(2).map(([name, row, route], i) => <Cell key={name} data={data} name={name} row={row} route={route} i={i + 2} n={data.procedures[name] ?? 0} share={pct(data.procedures[name] ?? 0)} total={total} />)}
      </div>
    </figure>
  );
}
function Cell({ data, name, row, route, i, n, share, total }) {
  const colour = route === "approve" ? GREEN : SLATE;
  return (
    <section className="sig-cell" style={{ "--tc": colour, "--i": i }} data-row={row}>
      <span className="sig-paper" aria-hidden="true"><Paper /></span>
      <h3>{name}</h3>
      <p className="sig-where">{row === "draft" ? "Draft" : "Made"} &middot; {route === "approve" ? "must be approved" : "can be objected to"}</p>
      <p className="sig-n"><b><AnimatedValue text={n.toLocaleString("en-GB")} /></b><span>{share} of all</span></p>
      <span className="sig-bar" aria-hidden="true"><i style={{ width: `${Math.max(2, (n / total) * 100)}%` }} /></span>
      <p className="sig-say">{data.kinds[name].say}</p>
    </section>
  );
}

// One real instrument, from its day to its coming into force, with the 40 days in which a House may object.
export function SiCase({ data }) {
  const [ref, go] = useGo(0.25);
  const c = caseStudy(data);
  if (!c) return null;
  const R = 6;
  const pos = (d) => `${R + (d / c.span) * (100 - 2 * R)}%`;
  return (
    <figure ref={ref} className="sics" data-go={go}>
      <figcaption>One real instrument, from the day it was made</figcaption>
      <p className="sics-name"><a href={c.link ?? undefined} target="_blank" rel="noreferrer">{c.name}<span className="sr-only"> (opens in a new tab)</span></a><span>{c.department ? `Laid by ${c.department}` : ""}</span></p>
      <div className="sics-axis" role="img" aria-label={c.alt}>
        <i className="sics-line" />
        <i className="sics-window" style={{ left: pos(c.windowFrom), width: `calc(${pos(c.windowTo)} - ${pos(c.windowFrom)})` }}><em>A House can object for 40 days (recesses do not count)</em></i>
        {c.steps.map((s, k) => (
          <span key={s.key} className="sics-dot" data-side={k % 2 === 0 ? "up" : "down"} style={{ left: pos(s.day), "--k": k, "--tc": s.colour }}>{k + 1}</span>
        ))}
      </div>
      <ol className="sics-list">
        {c.steps.map((s, k) => (
          <li key={s.key} style={{ "--k": k, "--tc": s.colour }}>
            <b aria-hidden="true">{k + 1}</b>
            <span><strong>{s.label}</strong> {shortDate(s.date)}</span>
            <small>{k === 0 ? "The start" : dayGap(c.steps[k - 1].day, s.day)}</small>
          </li>
        ))}
      </ol>
      <p className="sics-say">{c.say}</p>
    </figure>
  );
}
