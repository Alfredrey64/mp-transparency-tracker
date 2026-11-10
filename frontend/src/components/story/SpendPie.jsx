/** @jsxImportSource react */
import { useState } from "react";
import { useReducedMotion } from "motion/react";
import CountUp from "../CountUp";
import Unfold from "../Unfold";
import { useGo } from "./useGo";
import "../../spendpie.css";

// Where English councils' money goes, as a ring. Each slice is also a row in the list beside it: hover or focus a row and its slice lifts out and the middle reads out its figures;
// press a row and a few words about that service open under it. The ring draws itself round when it scrolls into view. Every figure is the page's own (explainers/councilSpending.jsx).
const TOTAL = 148.8;
const SLICES = [
  { key: "edu", label: "Education", value: 49.1, colour: "#5A7FA6", about: "Much of this is money passed on to schools and to early years and special needs places. The department says education spending is £2.4 billion higher in real terms than the year before, mostly early years and special schools." },
  { key: "adult", label: "Adult social care", value: 28.7, colour: "#9C3B3B", about: "Social care is different from education: councils themselves are responsible for arranging it. With children's social care it comes to £45.7 billion, about 31% of all the spending on services." },
  { key: "child", label: "Children's social care", value: 17.0, colour: "#E8741A", about: "Children's social care is £1.2 billion higher (7.4%) than the year before. Councils themselves are responsible for arranging it." },
  { key: "housing", label: "Housing services", value: 3.7, colour: "#3F7D5C", about: "Spending on homelessness rose by £302 million." },
  { key: "culture", label: "Cultural services", value: 2.6, colour: "#6E4B6E", about: "The only service the department reports as budgeted to fall: £61 million less, or 2.3%." },
];
const REST = { key: "rest", label: "Everything else", value: +(TOTAL - SLICES.reduce((n, s) => n + s.value, 0)).toFixed(1), colour: "#7B8798", about: "Roads, planning, waste and other services make up the rest of the £148.8 billion." };
const ALL = [...SLICES, REST];
const R = 112;
const LEAD = 0.45;

// Where each slice starts and ends round the ring, as a share of 100.
let at = 0;
const arcs = ALL.map((s) => {
  const len = (s.value / TOTAL) * 100;
  const arc = { ...s, len, start: at, mid: ((at + len / 2) / 100) * Math.PI * 2 };
  at += len;
  return arc;
});

const bn = (n) => `£${n.toFixed(1)}bn`;
const pct = (n) => `${Math.round((n / TOTAL) * 100)}%`;

export default function SpendPie() {
  const [ref, go] = useGo(0.3);
  const still = useReducedMotion();
  const [open, setOpen] = useState(null);
  const [hover, setHover] = useState(null);
  const shown = ALL.find((s) => s.key === (hover ?? open)) ?? null;

  const aim = (key) => ({ onMouseEnter: () => setHover(key), onMouseLeave: () => setHover(null), onFocus: () => setHover(key), onBlur: () => setHover(null) });

  return (
    <figure className="sp" data-go={go} data-still={still ? "1" : "0"}>
      <div className="sp-ring" ref={ref}>
        <svg viewBox="0 0 320 320" role="img" aria-label={`Council spending on services in England, 2026 to 2027, ${bn(TOTAL)} in all: ${ALL.map((s) => `${s.label} ${bn(s.value)}`).join(", ")}`}>
          <circle cx="160" cy="160" r={R} fill="none" stroke="rgba(120,130,150,0.12)" strokeWidth="44" />
          <g transform="rotate(-90 160 160)">
            {arcs.map((a, i) => {
              const on = (hover ?? open) === a.key;
              const dim = (hover ?? open) && !on;
              return (
                <circle
                  key={a.key}
                  className="sp-slice"
                  cx="160" cy="160" r={R} fill="none" stroke={a.colour} strokeWidth={on ? 52 : 44} pathLength="100"
                  strokeDasharray={`${Math.max(0.4, a.len - LEAD)} ${100 - Math.max(0.4, a.len - LEAD)}`} strokeDashoffset={-a.start}
                  style={{ "--len": Math.max(0.4, a.len - LEAD), "--i": i, transform: on ? `translate(${(9 * Math.cos(a.mid)).toFixed(2)}px, ${(9 * Math.sin(a.mid)).toFixed(2)}px)` : undefined, opacity: dim ? 0.35 : 1 }}
                  onClick={() => setOpen(open === a.key ? null : a.key)}
                  onMouseEnter={() => setHover(a.key)} onMouseLeave={() => setHover(null)}
                />
              );
            })}
          </g>
        </svg>
        <div className="sp-mid" aria-hidden="true">
          {shown ? (
            <span key={shown.key} className="sp-mid-in" style={{ "--c": shown.colour }}>
              <small>{shown.label}</small>
              <b>{bn(shown.value)}</b>
              <em>{pct(shown.value)} of the total</em>
            </span>
          ) : (
            <span className="sp-mid-in">
              <small>Planned spending on services, 2026 to 2027</small>
              <b><CountUp value={TOTAL} format={(n) => bn(n)} /></b>
              <em>Press a slice to open it</em>
            </span>
          )}
        </div>
      </div>

      <ul className="sp-list">
        {ALL.map((s, i) => {
          const isOpen = open === s.key;
          return (
            <li key={s.key} className="sp-row" data-open={isOpen ? "1" : "0"} style={{ "--c": s.colour, "--i": i, "--w": `${(s.value / ALL[0].value) * 100}%` }}>
              <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : s.key)} {...aim(s.key)}>
                <span className="sp-dot" aria-hidden="true" />
                <span className="sp-name">{s.label}</span>
                <span className="sp-val"><b>{bn(s.value)}</b><small>{pct(s.value)}</small></span>
                <span className="sp-chev" aria-hidden="true" />
                <span className="sp-track" aria-hidden="true"><i /></span>
              </button>
              <Unfold open={isOpen}><p className="sp-about">{s.about}</p></Unfold>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
