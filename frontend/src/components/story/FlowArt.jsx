/** @jsxImportSource react */
import { useState } from "react";
import { useReducedMotion } from "motion/react";
import { useGo } from "./useGo";
import { lowData } from "../../lib/lowData";
import { IconHealth, IconMortarboard, IconTransport, IconShield, IconHouse, IconBallot, IconSearch, IconCoin, IconCalculator } from "../icons";
import { IconCrown } from "../newIcons";
import "../../flowart.css";

// Four pictures for the tops of pages about how the state works. Each one shows an idea rather than a figure; the words in them are the page's own (passed in), and the only numbers are ones the
// page already gives. They play once when they scroll into view and then belong to the reader; with calmer motion they are simply shown finished.
//   BudgetFlow   the four steps a Budget goes through, a small red box travelling from stage to stage
//   CivilSwap    an election swaps the ministers, while the civil servants and the services carry on
//   WatchZones   the government of the day above a dashed line, the three watchdogs below it, each reaching up to check a different moment
//   GrantPipe    the Crown Estate's profit through the Sovereign Grant formula into the Grant, with a switch to the proposed amount

const useStill = () => useReducedMotion() || lowData();

// ---- Budget: the route of a Budget ------------------------------------------------------------------------------------------------------------------------------------

const STEP = 1.6; // seconds from one stage to the next
const DWELL = 0.5; // seconds the box rests at a stage
const START = 0.5;

function RedBox() {
  return (
    <svg viewBox="0 0 28 24" width="28" height="24" aria-hidden="true">
      <rect x="1.5" y="6" width="25" height="16" rx="3" fill="#B3261E" stroke="#6E120D" strokeWidth="1.6" />
      <path d="M1.5 11h25" stroke="#6E120D" strokeWidth="1.4" />
      <rect x="11" y="9" width="6" height="4.4" rx="1" fill="#F0C77A" stroke="#6E120D" strokeWidth="1" />
      <path d="M9 6V4.2A1.7 1.7 0 0 1 10.7 2.5h6.6A1.7 1.7 0 0 1 19 4.2V6" fill="none" stroke="#6E120D" strokeWidth="1.6" />
    </svg>
  );
}

//   steps  [{ icon, who, title, text, colour }]
export function BudgetFlow({ steps, label }) {
  const [ref, go] = useGo(0.3);
  const still = useStill();
  const n = steps.length;
  const total = (n - 1) * STEP + 0.4;
  const pct = (t) => ((t / total) * 100).toFixed(2);
  const centre = (i) => (((i + 0.5) / n) * 100).toFixed(2);
  const frames = steps
    .map((_, i) => (i < n - 1
      ? `${pct(i * STEP)}% { left: ${centre(i)}%; animation-timing-function: cubic-bezier(0.45, 0, 0.2, 1); } ${pct(i * STEP + DWELL)}% { left: ${centre(i)}%; }`
      : `${pct(i * STEP)}% { left: ${centre(i)}%; } 100% { left: ${centre(i)}%; }`))
    .join(" ");
  return (
    <figure ref={ref} className="fla-b" data-go={go} data-still={still ? "1" : "0"} style={{ "--n": n }} aria-label={label}>
      <style>{`.fla-b[data-go="1"][data-still="0"] .fla-tok { animation: flaRun ${total.toFixed(2)}s linear ${START}s both; } @keyframes flaRun { ${frames} }`}</style>
      <div className="fla-track">
        <ol className="fla-bs-row">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title} className="fla-bs" style={{ "--tc": s.colour, "--at": `${(START + i * STEP).toFixed(2)}s`, "--sa": `${(START + i * STEP + DWELL).toFixed(2)}s`, "--sd": `${(STEP - DWELL).toFixed(2)}s` }}>
                {i < n - 1 && <span className="fla-seg" aria-hidden="true" />}
                <span className="fla-badge" aria-hidden="true">{Icon && <Icon size={30} />}<i>{i + 1}</i></span>
                <span className="fla-who">{s.who}</span>
                <b>{s.title}</b>
                <p>{s.text}</p>
              </li>
            );
          })}
        </ol>
        <span className="fla-tok" aria-hidden="true"><RedBox /></span>
      </div>
    </figure>
  );
}

// ---- Civil service: an election swaps the ministers ------------------------------------------------------------------------------------------------------------------

function Person() {
  return (
    <svg className="fla-p" viewBox="0 0 40 72" aria-hidden="true">
      <circle cx="20" cy="13" r="10" />
      <path d="M4 70v-24c0-10 7-17 16-17s16 7 16 17v24z" />
    </svg>
  );
}

const SERVICES = [IconHealth, IconMortarboard, IconTransport, IconShield, IconHouse];
const PER_SIDE = 5;
const TAGS = ["Change with the government", "Still here", "Carry on"];

//   nodes  [{ icon, title, text, colour }]  ministers, civil servants, public services in that order
export function CivilSwap({ nodes, label }) {
  const [ref, go] = useGo(0.3);
  const still = useStill();
  const [run, setRun] = useState(0);
  return (
    <section ref={ref} className="fla-c" data-go={go} data-still={still ? "1" : "0"} aria-label={label}>
      <div className="fla-c-body" key={run}>
        <div className="fla-c-head" aria-hidden="true">
          <span className="fla-c-gov" data-side="a">One government</span>
          <span className="fla-c-gov" data-side="b">The next government</span>
        </div>
        <span className="fla-c-line" aria-hidden="true"><b><IconBallot size={18} /></b><em>Election</em></span>
        {nodes.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="fla-c-lane" data-lane={i} style={{ "--tc": s.colour, "--i": i }}>
              <div className="fla-c-lab">
                <span className="fla-c-ico" aria-hidden="true">{Icon && <Icon size={22} />}</span>
                <div><b>{s.title}</b><small>{s.text}</small></div>
              </div>
              <div className="fla-c-track" aria-hidden="true">
                <span className="fla-c-tag" style={{ "--d": `${1.9 + i * 0.25}s` }}>{TAGS[i]}</span>
                {i < 2 && Array.from({ length: PER_SIDE * 2 }, (_, k) => (
                  <span key={k} className="fla-c-pp" data-side={k < PER_SIDE ? "a" : "b"} data-lane={i} style={{ "--k": k - PER_SIDE }}><Person /></span>
                ))}
                {i === 2 && SERVICES.map((Svc, k) => <span key={k} className="fla-c-svc" style={{ "--k": k }}><Svc size={26} /></span>)}
                {i === 2 && SERVICES.map((Svc, k) => <span key={`b${k}`} className="fla-c-svc" style={{ "--k": k + SERVICES.length }}><Svc size={26} /></span>)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="fla-c-foot">
        <p>At an election the ministers can change. The civil servants who run the departments, and the services they deliver, carry on.</p>
        {!still && <button type="button" onClick={() => setRun((r) => r + 1)}>Replay</button>}
      </div>
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
          <b>The Crown Estate</b>
          <small>A property business with a yearly profit</small>
          <span className="fla-g-fig"><strong>{estate.value}</strong>{estate.text}</span>
        </article>
        <span className="fla-g-link" aria-hidden="true"><i /><u /><u /><u /></span>
        <article className="fla-g-card fla-g-formula" style={{ "--tc": "#5E4B8B", "--at": "0.8s" }}>
          <span className="fla-g-ico" aria-hidden="true"><IconCalculator size={26} /></span>
          <b>The formula</b>
          <small>Five steps in the Sovereign Grant Act 2011</small>
          <ol>
            {FORMULA.map((f, i) => <li key={f} style={{ "--s": `${1.2 + i * 0.35}s` }}><i aria-hidden="true">{i + 1}</i>{f}</li>)}
          </ol>
        </article>
        <span className="fla-g-link" aria-hidden="true"><i /><u /><u /><u /></span>
        <article className="fla-g-card fla-g-grant" style={{ "--tc": "#1F7A6E", "--at": "1.4s" }}>
          <span className="fla-g-ico" aria-hidden="true"><IconCoin size={26} /></span>
          <b>The Sovereign Grant</b>
          <small>Public money paid to the Royal Household</small>
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
        </article>
        <span className="fla-g-link" aria-hidden="true"><i /><u /><u /><u /></span>
        <article className="fla-g-card fla-g-duties" style={{ "--tc": "#2C5F9E", "--at": "2s" }}>
          <span className="fla-g-ico" aria-hidden="true"><IconCrown size={26} /></span>
          <b>{duties.title}</b>
          <small>{duties.text}</small>
        </article>
      </div>
    </section>
  );
}
