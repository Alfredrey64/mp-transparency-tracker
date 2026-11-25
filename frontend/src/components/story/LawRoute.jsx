/** @jsxImportSource react */
import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useGo } from "./useGo";
import { lowData } from "../../lib/lowData";
import "../../lawroute.css";

// The picture at the top of "How a law is made": the whole route of a bill drawn as a line with a stop for every stage, like a railway map. A small paper bill rides the line, stopping at each stop in
// turn, and the card under the line says in Parliament's own words what happens there and, for the real Act the page follows, the day it happened. It plays once when it scrolls into view and
// then belongs to the reader: press any stop (or Back and Next) to go to it. With calmer motion nothing moves by itself. All the words come from the page that gives the stops.
//   stops  [{ key, band: "Commons" | "Lords" | "Both" | "Assent", colour, top, bottom, title, text, real }]
//          top and bottom are the two short lines under a stop; title and text fill the card; real is the day it happened in the real Act (or null).

const BANDS = { Commons: "House of Commons", Lords: "House of Lords" };
const STEP_MS = 3600;

function Bill() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M6 2.5h8l4.5 4.5v14.5H6z" fill="#fff" stroke="#1B2A44" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 2.5V7h4.5" fill="#E8EDF6" stroke="#1B2A44" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 11.5h6M9 15h6M9 18.5h3.5" stroke="#1B2A44" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export default function LawRoute({ stops, caption }) {
  const [ref, go] = useGo(0.3);
  const still = useReducedMotion() || lowData();
  const n = stops.length;
  const [sel, setSel] = useState(0);
  const [handled, setHandled] = useState(false);

  // The first time the picture is on screen, the bill sets off by itself and stops at the end; once it is pressed it only moves when it is told to.
  const auto = go === "1" && !still && !handled && sel < n - 1;
  useEffect(() => {
    if (!auto) return undefined;
    const t = setTimeout(() => setSel((k) => k + 1), sel === 0 ? 1400 : STEP_MS);
    return () => clearTimeout(t);
  }, [auto, sel]);

  const pick = (k) => { setHandled(true); setSel(Math.max(0, Math.min(n - 1, k))); };
  const replay = () => { setHandled(false); setSel(0); };

  // Where each band starts and how many stops it holds, for the coloured bars above the line.
  const groups = [];
  stops.forEach((s, i) => {
    const last = groups[groups.length - 1];
    if (last && last.band === s.band) last.len += 1; else groups.push({ band: s.band, colour: s.colour, start: i, len: 1 });
  });
  const cur = stops[sel];

  return (
    <figure ref={ref} className="lwr" data-go={go} data-still={still ? "1" : "0"} data-auto={auto ? "1" : "0"} style={{ "--n": n, "--i": sel, "--cc": cur.colour }}>
      <div className="lwr-map">
        <ol className="lwr-bands" aria-hidden="true">
          {groups.map((g) => (
            <li key={g.start} style={{ gridColumn: `${g.start + 1} / span ${g.len}`, "--c": g.colour }} data-solo={g.len === 1 ? "1" : undefined}>{g.len > 1 ? BANDS[g.band] : ""}</li>
          ))}
        </ol>
        <div className="lwr-row">
          <span className="lwr-rail" aria-hidden="true" />
          <span className="lwr-prog" aria-hidden="true" />
          <ol className="lwr-stops" aria-label="The stages of a bill, in order">
            {stops.map((s, i) => (
              <li key={s.key}>
                <button type="button" className="lwr-st" data-state={i < sel ? "done" : i === sel ? "now" : "todo"} style={{ "--c": s.colour }} aria-current={i === sel ? "step" : undefined} onClick={() => pick(i)}>
                  <span className="sr-only">Stage {i + 1} of {n}: {s.title}. </span>
                  <i className="lwr-dot" aria-hidden="true">{i < sel ? <svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}</i>
                  <span className="lwr-lab"><b>{s.top}</b><span>{s.bottom}</span></span>
                  <span className="lwr-lab-flat"><em style={{ "--c": s.colour }}>{BANDS[s.band] ? s.band : s.band === "Both" ? "Both Houses" : "The King"}</em>{s.top} {s.bottom}</span>
                </button>
              </li>
            ))}
          </ol>
          <span className="lwr-token" aria-hidden="true"><span key={sel} className="lwr-hop"><Bill /></span></span>
        </div>
      </div>

      <div className="lwr-card" aria-live={auto ? "off" : "polite"}>
        {stops.map((s, i) => (
          <div key={s.key} className="lwr-panel" data-on={i === sel ? "1" : "0"} aria-hidden={i === sel ? undefined : "true"} style={{ "--c": s.colour }}>
            <p className="lwr-k"><em>{BANDS[s.band] ?? (s.band === "Both" ? "Both Houses" : "The King")}</em><span>Stop {i + 1} of {n}</span></p>
            <h2>{s.title}</h2>
            <p className="lwr-tx">{s.text}</p>
            {s.real && <p className="lwr-real"><b>In the real Act below</b>{s.real}</p>}
          </div>
        ))}
      </div>

      <div className="lwr-ctl">
        <button type="button" onClick={() => pick(sel - 1)} disabled={sel === 0}>Back</button>
        <button type="button" className="lwr-pri" onClick={() => pick(sel + 1)} disabled={sel === n - 1}>Next stop</button>
        {!still && <button type="button" onClick={replay}>{sel === n - 1 && !auto ? "Play again" : "Play the journey"}</button>}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
