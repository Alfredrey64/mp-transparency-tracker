/** @jsxImportSource react */
import { useState } from "react";
import { useReducedMotion } from "motion/react";
import { useGo } from "./useGo";
import { useStepper } from "./useStepper";
import { lowData } from "../../lib/lowData";
import { IconHealth, IconMortarboard, IconTransport, IconShield, IconHouse, IconSearch, IconCoin, IconCalculator } from "../icons";
import { IconCrown } from "../newIcons";
import "../../flowart.css";

// Four pictures for the tops of pages about how the state works. Each one shows an idea rather than a figure; the words in them are the page's own (passed in), and the only numbers are ones the
// page already gives. They play once when they scroll into view and then belong to the reader; with calmer motion they are simply shown finished.
//   BudgetFlow   the four steps a Budget goes through, a small red box travelling from stage to stage
//   CivilRelay   advice goes up the stairs: ministers, advice, carrying out, public services
//   WatchZones   the government of the day above a dashed line, the three watchdogs below it, each reaching up to check a different moment
//   GrantPipe    the Crown Estate's profit through the Sovereign Grant formula into the Grant, with a switch to the proposed amount

const useStill = () => useReducedMotion() || lowData();

function PlayButton({ st, label = "Play the steps" }) {
  return (
    <div className="fla-ctl">
      <button type="button" onClick={st.toggle} aria-pressed={!st.running}>{st.running ? "Pause" : label}</button>
    </div>
  );
}

// ---- Budget: the route of a Budget ------------------------------------------------------------------------------------------------------------------------------------

const DWELL_MS = 2800; // how long each step is lit before the box moves on

function RedBox() {
  return (
    <svg viewBox="0 0 28 24" width="38" height="33" aria-hidden="true">
      <rect x="1.5" y="6" width="25" height="16" rx="3" fill="#B3261E" stroke="#6E120D" strokeWidth="1.6" />
      <path d="M1.5 11h25" stroke="#6E120D" strokeWidth="1.4" />
      <rect x="11" y="9" width="6" height="4.4" rx="1" fill="#F0C77A" stroke="#6E120D" strokeWidth="1" />
      <path d="M9 6V4.2A1.7 1.7 0 0 1 10.7 2.5h6.6A1.7 1.7 0 0 1 19 4.2V6" fill="none" stroke="#6E120D" strokeWidth="1.6" />
    </svg>
  );
}

//   steps  [{ icon, who, title, text, colour }]
// The red box rides a rail above the four stages (so it never covers a picture), and the stage it is over is the one that is lit: both are driven by the same step number, so they cannot disagree.
export function BudgetFlow({ steps, label }) {
  const [ref, go] = useGo(0.3);
  const still = useStill();
  const n = steps.length;
  const st = useStepper(n, go, still, DWELL_MS);
  const { step, running } = st;
  return (
    <figure ref={ref} className="fla-b" data-go={go} data-still={still ? "1" : "0"} data-playing={running ? "1" : "0"} style={{ "--n": n, "--step": step, "--p": n > 1 ? step / (n - 1) : 0 }} aria-label={label}>
      <div className="fla-track">
        {!still && (
          <div className="fla-rail">
            <span className="fla-rail-line" aria-hidden="true" />
            <span className="fla-rail-fill" aria-hidden="true" />
            {steps.map((s, i) => (
              <button key={s.title} type="button" className="fla-stop" style={{ "--i": i, "--tc": s.colour }} data-state={i < step ? "done" : i === step ? "on" : "next"} aria-label={`Show step ${i + 1}: ${s.who}`} aria-current={i === step ? "step" : undefined} onClick={() => st.pick(i)} />
            ))}
            <span className="fla-tok" aria-hidden="true"><span className="fla-tok-in" key={step}><RedBox /></span></span>
          </div>
        )}
        <ol className="fla-bs-row">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title} className="fla-bs" data-on={!still && i === step ? "1" : "0"} style={{ "--tc": s.colour, "--d": i < step ? 1 : 0 }}>
                {i < n - 1 && <span className="fla-seg" aria-hidden="true" />}
                <span className="fla-badge" aria-hidden="true">{Icon && <Icon size={30} />}<i>{i + 1}</i></span>
                <span className="fla-who">{s.who}</span>
                <b>{s.title}</b>
                <p>{s.text}</p>
              </li>
            );
          })}
        </ol>
      </div>
      {!still && <PlayButton st={st} />}
    </figure>
  );
}

// ---- Civil service: what the civil service does, step by step -------------------------------------------------------------------------------------------------------------

const SERVICES = [IconHealth, IconMortarboard, IconTransport, IconShield, IconHouse];

//   nodes     [{ icon, who, title, text, colour }]  four stages: ministers decide, civil servants advise, they carry it out, the services reach people
//   protects  [{ icon, title, text }]               what the rules about impartiality protect
// The stages climb like steps; a folder hops up them, and the stage it is over is lit and shows a small picture of what happens there.
export function CivilRelay({ nodes, protects, label }) {
  const [ref, go] = useGo(0.3);
  const still = useStill();
  const n = nodes.length;
  const st = useStepper(n, go, still, 3400);
  const { step } = st;
  return (
    <section ref={ref} className="fla-r" data-go={go} data-still={still ? "1" : "0"} style={{ "--n": n, "--step": step }} aria-label={label}>
      <div className="fla-r-stairs">
        {!still && (
          <span className="fla-r-tok" aria-hidden="true">
            <span className="fla-r-tok-in" key={step}>
              <svg viewBox="0 0 40 34" width="40" height="34"><path d="M2 8a3 3 0 0 1 3-3h10l4 4h16a3 3 0 0 1 3 3v17a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3z" fill="#C88A1E" stroke="#6B4A0E" strokeWidth="1.8" strokeLinejoin="round" /><path d="M2 13h36" stroke="#6B4A0E" strokeWidth="1.6" /><path d="M10 20h14M10 25h9" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
            </span>
          </span>
        )}
        <ol className="fla-r-row">
          {nodes.map((s, i) => {
            const Icon = s.icon;
            const on = !still && i === step;
            return (
              <li key={s.title} className="fla-r-st" data-on={on ? "1" : "0"} data-i={i} style={{ "--tc": s.colour, "--i": i }}>
                <button type="button" className="fla-r-tile" aria-label={`Show stage ${i + 1}: ${s.title}`} aria-current={on ? "step" : undefined} onClick={() => st.pick(i)}>
                  <span className="fla-r-badge" aria-hidden="true">{Icon && <Icon size={26} />}<i>{i + 1}</i></span>
                  <span className="fla-r-who">{s.who}</span>
                  <b>{s.title}</b>
                  <span className="fla-r-tx">{s.text}</span>
                  <span className="fla-r-fx" aria-hidden="true">
                    {i === 0 && <span className="fla-r-arrow"><u /><u /><u /></span>}
                    {i === 1 && <><em className="ok">Will work</em><em className="no">Will not</em></>}
                    {i === 2 && <span className="fla-r-bar"><u /></span>}
                    {i === 3 && SERVICES.map((Svc, k) => <span key={k} className="fla-r-svc" style={{ "--k": k }}><Svc size={18} /></span>)}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="fla-r-why">
        <p className="fla-r-wl">What the rules about impartiality protect</p>
        <ul>
          {protects.map((p, i) => {
            const Icon = p.icon;
            return <li key={p.title} style={{ "--i": i }}><span aria-hidden="true">{Icon && <Icon size={20} />}</span><div><b>{p.title}</b><small>{p.text}</small></div></li>;
          })}
        </ul>
      </div>
      {!still && <PlayButton st={st} label="Play the stages" />}
    </section>
  );
}

// ---- Watchdogs: the government of the day above a line, the three watchdogs below it ----------------------------------------------------------------------------------

const MOMENTS = ["The government makes its plans", "The government spends public money", "Something goes wrong"];

//   nodes  [{ icon, title, text, colour }]  the three watchdogs, in the order of the moments above
export function WatchZones({ nodes, label }) {
  const [ref, go] = useGo(0.3);
  const still = useStill();
  return (
    <section ref={ref} className="fla-w" data-go={go} data-still={still ? "1" : "0"} aria-label={label}>
      <p className="fla-w-z fla-w-top" aria-hidden="true">The government of the day</p>
      <ol className="fla-w-row">
        {nodes.map((s, i) => {
          const Icon = s.icon;
          return (
            <li key={s.title} className="fla-w-col" style={{ "--tc": s.colour, "--at": `${0.4 + i * 1.1}s` }}>
              <span className="fla-w-stage" aria-hidden="true"><i>{i + 1}</i>{MOMENTS[i]}<span className="fla-w-lens"><IconSearch size={16} /></span></span>
              <span className="fla-w-conn" aria-hidden="true">{i === 1 && <em>Kept at a distance</em>}</span>
              <div className="fla-w-card">
                <span className="fla-w-ico" aria-hidden="true">{Icon && <Icon size={28} />}</span>
                <b>{s.title}</b>
                <p>{s.text}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="fla-w-z fla-w-bot" aria-hidden="true">The watchdogs</p>
    </section>
  );
}

// ---- Monarchy: from the Crown Estate's profit to the Sovereign Grant ------------------------------------------------------------------------------------------------------

const FORMULA = ["Take 12% of the Crown Estate's profit", "Round it up to the next £100,000", "It can never fall below last year's grant", "A reserve can reduce it", "The result is the grant"];

//   now / proposed  { value, text, pct }  the grant in force and the cut that has been proposed (pct is the proposed amount as a share of the current one, 0 to 100)
//   estate { value, text }  the Crown Estate figure the page gives
// Wide pages lay the four stages out as rows (the words on the left, the working on the right) so the space in each box is used; very wide ones run them across; phones stack everything.
function Link() {
  return (
    <span className="fla-g-link" aria-hidden="true">
      <svg className="fla-g-ah" viewBox="0 0 44 20"><path d="M3 10H31" className="fla-g-stem" /><path d="M27 3.5 38 10 27 16.5" className="fla-g-head" /></svg>
      <svg className="fla-g-av" viewBox="0 0 20 44"><path d="M10 3V31" className="fla-g-stem" /><path d="M3.5 27 10 38 16.5 27" className="fla-g-head" /></svg>
      <u /><u /><u />
    </span>
  );
}

export function GrantPipe({ estate, now, proposed, label, duties }) {
  const [ref, go] = useGo(0.3);
  const still = useStill();
  const [view, setView] = useState("now");
  const cur = view === "now" ? now : proposed;
  return (
    <section ref={ref} className="fla-g" data-go={go} data-still={still ? "1" : "0"} data-view={view} aria-label={label}>
      <div className="fla-g-row">
        <article className="fla-g-card fla-g-estate" style={{ "--tc": "#B08432", "--at": "0.2s" }}>
          <span className="fla-g-ico" aria-hidden="true"><IconHouse size={26} /></span>
          <div className="fla-g-hd"><b>The Crown Estate</b><small>A property business with a yearly profit</small></div>
          <div className="fla-g-body">
            <span className="fla-g-fig"><strong>{estate.value}</strong>{estate.text}</span>
          </div>
        </article>
        <Link />
        <article className="fla-g-card fla-g-formula" style={{ "--tc": "#5E4B8B", "--at": "0.8s" }}>
          <span className="fla-g-ico" aria-hidden="true"><IconCalculator size={26} /></span>
          <div className="fla-g-hd"><b>The formula</b><small>Five steps in the Sovereign Grant Act 2011</small></div>
          <div className="fla-g-body">
            <ol>
              {FORMULA.map((f, i) => <li key={f} style={{ "--s": `${1.2 + i * 0.35}s`, "--k": i }}><i aria-hidden="true">{i + 1}</i>{f}</li>)}
            </ol>
          </div>
        </article>
        <Link />
        <article className="fla-g-card fla-g-grant" style={{ "--tc": "#1F7A6E", "--at": "1.4s" }}>
          <span className="fla-g-ico" aria-hidden="true"><IconCoin size={26} /></span>
          <div className="fla-g-hd"><b>The Sovereign Grant</b><small>Public money paid to the Royal Household</small></div>
          <div className="fla-g-body">
            <div className="fla-g-tank">
              <div className="fla-g-gauge" aria-hidden="true">
                <span className="fla-g-fill" style={{ height: `${view === "now" ? 100 : proposed.pct}%` }} />
                <span className="fla-g-cut" style={{ height: `${100 - proposed.pct}%` }} />
              </div>
              <div className="fla-g-val">
                <strong aria-live="polite">{cur.value}</strong>
                <span>{cur.text}</span>
              </div>
            </div>
            <div className="fla-g-sw" role="group" aria-label="Which amount to show">
              <button type="button" aria-pressed={view === "now"} onClick={() => setView("now")}>{now.button}</button>
              <button type="button" aria-pressed={view === "proposed"} onClick={() => setView("proposed")}>{proposed.button}</button>
            </div>
          </div>
        </article>
        <Link />
        <article className="fla-g-card fla-g-duties" style={{ "--tc": "#2C5F9E", "--at": "2s" }}>
          <span className="fla-g-ico" aria-hidden="true"><IconCrown size={26} /></span>
          <div className="fla-g-hd"><b>{duties.title}</b><small>{duties.text}</small></div>
        </article>
      </div>
    </section>
  );
}
