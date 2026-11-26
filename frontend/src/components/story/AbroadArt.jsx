/** @jsxImportSource react */
import AnimatedValue from "./AnimatedValue";
import { useGo } from "./useGo";
import "../../abroadart.css";

// The panel at the top of The UK abroad page. Left: what the UK spent on aid in 2025, with the share of national income drawn as four columns, each against the 0.7% target
// (the dashed outline): the target itself, the cut to 0.5% from 2021, 2025 and the plan for 2027. Right: the 21 sitting days Parliament has to object to a treaty, filling one at a
// time. Every figure is one the page already states in its timeline and its chapter on treaties. It plays once, when it scrolls into view.
const TARGET = 0.7;
const COLUMNS = [
  { pct: 0.7, label: "Target", sub: "to 2020", kind: "target" },
  { pct: 0.5, label: "Cut to 0.5%", sub: "from 2021", kind: "cut" },
  { pct: 0.44, label: "2025", sub: "the latest", kind: "now" },
  { pct: 0.3, label: "Plan", sub: "by 2027", kind: "plan" },
];
const DAYS = 21;

export default function AbroadArt() {
  const [ref, go] = useGo(0.25);
  return (
    <figure ref={ref} className="ab" data-go={go} aria-label="UK aid spending in 2025, its share of national income against the 0.7% target, and the 21 sitting days Parliament has to object to a treaty">
      <section className="ab-aid">
        <span className="ab-kick">UK aid spending in 2025</span>
        <div className="ab-head">
          <b className="ab-big"><AnimatedValue text="£13.1bn" /></b>
          <span className="ab-chip">7.0% less than in 2024</span>
        </div>
        <ul className="ab-cols" aria-label="Aid as a share of national income">
          {COLUMNS.map((c, i) => (
            <li key={c.kind} data-kind={c.kind} style={{ "--p": c.pct / TARGET, "--i": i }}>
              <b>{c.kind === "now" ? <AnimatedValue text="0.44%" /> : `${c.pct}%`}</b>
              <span className="ab-box"><i /></span>
              <em>{c.label}</em>
              <small>{c.sub}</small>
            </li>
          ))}
        </ul>
        <p className="ab-foot">Aid as a share of national income. The dashed outline is the 0.7% target.</p>
      </section>
      <section className="ab-days">
        <span className="ab-kick">Sitting days Parliament has to object to a treaty</span>
        <b className="ab-big"><AnimatedValue text="21" /></b>
        <ol className="ab-pips" aria-hidden="true">
          {Array.from({ length: DAYS }, (_, k) => <li key={k} style={{ "--k": k }} />)}
        </ol>
        <p className="ab-foot">before it can be ratified</p>
      </section>
    </figure>
  );
}
