/** @jsxImportSource react */
import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import CountUp from "../CountUp";
import Unfold from "../Unfold";
import { useGo } from "./useGo";
import "../../spendpie.css";

// A ring cut into slices by their share of a whole. Each slice is also a row in the list beside it: hover or focus a row and its slice lifts out and the middle reads out its
// figures; press a row and a few words about it open under it. The ring draws itself round when it scrolls into view. Used for where council money goes and for how the
// government's department budgets share the total.
//   items   [{ key, label, value, colour, about }]
//   total   the whole (defaults to the sum of the values)
//   format  how a value is printed, e.g. (n) => `£${n.toFixed(1)}bn`
//   centre  the small line in the middle before anything is chosen
//   aria    the description of the whole ring for a screen reader
const R = 112;
const LEAD = 0.45;
// Hovering only changes the middle of the ring once the pointer has rested on a slice or row for a moment, and lets go a moment after it leaves. Without that the number flickers
// as the pointer crosses the ring or the gaps between rows. Keyboard focus acts at once.
const DWELL = 260;
const LINGER = 520;
function useHoverIntent() {
  const [hover, setHover] = useState(null);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const set = (key, wait) => {
    clearTimeout(timer.current);
    if (wait <= 0) { setHover(key); return; }
    timer.current = setTimeout(() => setHover(key), wait);
  };
  return { hover, enter: (key) => set(key, DWELL), leave: () => set(null, LINGER), focus: (key) => set(key, 0), blur: () => set(null, 0) };
}

export default function DonutShare({ items, total: totalProp, format, centre, aria, title, note, hint = "Press a slice to open it" }) {
  const [ref, go] = useGo(0.3);
  const still = useReducedMotion();
  const [open, setOpen] = useState(null);
  const { hover, enter, leave, focus, blur } = useHoverIntent();
  const total = totalProp ?? items.reduce((n, s) => n + s.value, 0);
  const arcs = useMemo(() => items.map((s, i) => {
    const before = items.slice(0, i).reduce((n, x) => n + x.value, 0);
    const len = (s.value / total) * 100;
    const start = (before / total) * 100;
    return { ...s, len, start, mid: ((start + len / 2) / 100) * Math.PI * 2 };
  }), [items, total]);
  const pct = (n) => `${Math.round((n / total) * 100)}%`;
  const shown = items.find((s) => s.key === (hover ?? open)) ?? null;
  const aim = (key) => ({ onMouseEnter: () => enter(key), onMouseLeave: leave, onFocus: () => focus(key), onBlur: blur });

  return (
    <figure className="sp" data-go={go} data-still={still ? "1" : "0"}>
      {title && <figcaption className="sp-title">{title}</figcaption>}
      <div className="sp-ring" ref={ref}>
        <svg viewBox="0 0 320 320" role="img" aria-label={aria}>
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
                  onMouseEnter={() => enter(a.key)} onMouseLeave={leave}
                />
              );
            })}
          </g>
        </svg>
        <div className="sp-mid" aria-hidden="true">
          {shown ? (
            <span key={shown.key} className="sp-mid-in" style={{ "--c": shown.colour }}>
              <small>{shown.label}</small>
              <b>{format(shown.value)}</b>
              <em>{pct(shown.value)} of the total</em>
            </span>
          ) : (
            <span className="sp-mid-in">
              <small>{centre}</small>
              <b><CountUp value={total} format={format} /></b>
              <em>{hint}</em>
            </span>
          )}
        </div>
      </div>

      <ul className="sp-list">
        {items.map((s, i) => {
          const isOpen = open === s.key;
          return (
            <li key={s.key} className="sp-row" data-open={isOpen ? "1" : "0"} style={{ "--c": s.colour, "--i": i, "--w": `${Math.max(2, (s.value / total) * 100)}%` }}>
              <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : s.key)} {...aim(s.key)}>
                <span className="sp-dot" aria-hidden="true" />
                <span className="sp-name">{s.label}</span>
                <span className="sp-val"><b>{format(s.value)}</b><small>{pct(s.value)}</small></span>
                <span className="sp-chev" aria-hidden="true" />
                <span className="sp-track" aria-hidden="true"><i /></span>
              </button>
              <Unfold open={isOpen}><p className="sp-about">{s.about}</p></Unfold>
            </li>
          );
        })}
      </ul>
      {note && <p className="sp-note">{note}</p>}
    </figure>
  );
}
