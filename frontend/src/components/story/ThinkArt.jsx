/** @jsxImportSource react */
import { useReducedMotion } from "motion/react";
import { useGo } from "./useGo";
import { caseId } from "../../lib/caseId";

const INK = "#1B2438";
const SOFT = "#5B6784";
const F = "Public Sans, system-ui, sans-serif";
const S = "Newsreader, Georgia, serif";

// Money from a funder nobody names, through a think tank with no duty to say, to an "independent expert" on air. Only the last of the three is ever seen. It plays once, when it
// scrolls into view: the three boxes arrive in turn, the money runs to the think tank and disappears into it, a redaction bar keeps sliding over the funder's name, and the
// expert's words carry on to the audience past a padlock that stands for "hidden by law". Drawn along the page on a wide screen and stacked on a phone.
export function Masked() {
  return <><MaskedWide /><MaskedTall /></>;
}

const COIN = (
  <>
    <circle r="11" fill="#B5533C" stroke="#fff" strokeWidth="2.5" />
    <circle r="6.5" fill="none" stroke="#F3C9BF" strokeWidth="1.2" />
    <text y="4" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" fontFamily={F}>£</text>
  </>
);

function Coins({ path, dur = 5.2, count = 3 }) {
  return Array.from({ length: count }, (_, i) => {
    const begin = `${(-dur / count) * i}s`;
    return (
      <g key={i} opacity="0">
        {COIN}
        <animateMotion dur={`${dur}s`} begin={begin} repeatCount="indefinite" path={path} keyPoints="0;1" keyTimes="0;1" calcMode="linear" />
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.82;1" dur={`${dur}s`} begin={begin} repeatCount="indefinite" />
        <animateTransform attributeName="transform" additive="sum" type="scale" values="1;1;0.55" keyTimes="0;0.7;1" dur={`${dur}s`} begin={begin} repeatCount="indefinite" />
      </g>
    );
  });
}

function Padlock({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle className="ttm-ring" r="19" fill="none" stroke="#9C3B3B" strokeWidth="2" />
      <circle r="19" fill="#fff" stroke="#9C3B3B" strokeWidth="3" />
      <path d="M -6 -3 V -7 a 6 6 0 0 1 12 0 V -3" fill="none" stroke="#9C3B3B" strokeWidth="3" strokeLinecap="round" />
      <rect x="-9" y="-3" width="18" height="14" rx="3.5" fill="#9C3B3B" />
      <circle cy="4" r="2" fill="#fff" />
    </g>
  );
}

// A voice carried outwards: three arcs that travel along `dir`, one after the other.
function Voice({ x, y, rot = 0 }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {[0, 1, 2].map((i) => (
        <path key={i} className="ttm-wave" style={{ "--w": i }} d="M 0 -15 Q 11 0 0 15" fill="none" stroke="#5A7FA6" strokeWidth="4" strokeLinecap="round" />
      ))}
    </g>
  );
}

function Funder({ x, y, d, id }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="ttm-card" style={{ "--d": d }}>
        <rect width="200" height="130" rx="24" fill={`url(#tt-h${id})`} stroke="#9C3B3B" strokeWidth="3.5" strokeDasharray="10 6" />
        <circle cx="48" cy="46" r="24" fill="#fff" stroke="#9C3B3B" strokeWidth="3" />
        <text x="48" y="58" textAnchor="middle" fontSize="34" fontWeight="800" fill="#9C3B3B" fontFamily={S}>?</text>
        <rect x="88" y="30" width="86" height="11" rx="5.5" fill="#fff" opacity="0.85" />
        <rect x="88" y="50" width="62" height="11" rx="5.5" fill="#fff" opacity="0.85" />
        <rect className="ttm-redact" style={{ "--r": 0 }} x="84" y="27" width="94" height="17" rx="5" fill="#1B2438" />
        <rect className="ttm-redact" style={{ "--r": 1 }} x="84" y="47" width="70" height="17" rx="5" fill="#1B2438" />
        <text x="100" y="104" textAnchor="middle" fontSize="15" fontWeight="800" fill="#7A2E2E" fontFamily={F}>Undisclosed funder</text>
      </g>
    </g>
  );
}

function Tank({ x, y, d }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="ttm-card" style={{ "--d": d }}>
        <rect width="200" height="130" rx="24" fill="#fff" stroke="#9C6B30" strokeWidth="3.5" />
        <rect className="ttm-tank-glow" width="200" height="130" rx="24" fill="#F3D9AE" />
        <path d="M 62 46 L 100 22 L 138 46 Z" fill="#9C6B30" />
        {[72, 94, 116].map((cx) => <rect key={cx} x={cx} y="50" width="11" height="26" fill="#9C6B30" />)}
        <rect x="60" y="79" width="80" height="7" rx="2.5" fill="#9C6B30" />
        <text x="100" y="109" textAnchor="middle" fontSize="15" fontWeight="800" fill={INK} fontFamily={F}>The think tank</text>
      </g>
    </g>
  );
}

function Expert({ x, y, d, id }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="ttm-card" style={{ "--d": d }}>
        <rect className="ttm-spot" x="-12" y="-12" width="224" height="154" rx="34" fill={`url(#tt-glow${id})`} />
        <rect width="200" height="130" rx="24" fill="#fff" stroke="#5A7FA6" strokeWidth="3.5" />
        <g transform="translate(14 13)"><rect width="46" height="19" rx="9.5" fill="#C23B3B" /><circle className="ttm-live" cx="12" cy="9.5" r="3.5" fill="#fff" /><text x="31" y="13.5" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#fff" fontFamily={F}>LIVE</text></g>
        <circle cx="100" cy="38" r="17" fill="#5A7FA6" />
        <path d="M 70 84 q 30 -40 60 0z" fill="#5A7FA6" />
        <rect x="18" y="92" width="164" height="26" rx="8" fill="#1B2438" />
        <text x="100" y="110" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff" fontFamily={F}>Independent expert</text>
      </g>
    </g>
  );
}

function Defs({ id }) {
  return (
    <defs>
      <pattern id={`tt-h${id}`} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="#F7E7E7" /><rect width="3" height="9" fill="#E6BDBD" /></pattern>
      <radialGradient id={`tt-glow${id}`} cx="50%" cy="50%" r="60%"><stop offset="0" stopColor="#8DB4E2" stopOpacity="0.55" /><stop offset="1" stopColor="#8DB4E2" stopOpacity="0" /></radialGradient>
    </defs>
  );
}

function MaskedWide() {
  const [ref, go] = useGo(0.3);
  const still = useReducedMotion();
  const playing = go === "1" && !still;
  return (
    <svg ref={ref} data-go={go} className="st-trail-wide ttm" viewBox="0 0 900 340" role="img" aria-label="An undisclosed funder pays a think tank, whose staff appear on air as independent experts; the audience sees only the expert">
      <Defs id="" />
      <g className="ttm-zone" style={{ "--d": 0 }}>
        <rect x="10" y="12" width="590" height="262" rx="26" fill="#F4F6FA" stroke="#C9D3E6" strokeWidth="2" strokeDasharray="8 6" />
        <rect x="650" y="12" width="240" height="262" rx="26" fill="#EEF4FB" stroke="#C9DAEE" strokeWidth="2" />
        <text x="305" y="48" textAnchor="middle" fontSize="16" fontWeight="800" fill="#7A2E2E" fontFamily={F}>Hidden by law</text>
        <text x="770" y="48" textAnchor="middle" fontSize="16" fontWeight="800" fill="#3F5F85" fontFamily={F}>What you see</text>
      </g>
      <path className="ttm-pipe" d="M 236 168 H 372" stroke="#9C3B3B" strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" fill="none" />
      <path className="ttm-pipe ttm-pipe-b" d="M 582 168 H 660" stroke="#5A7FA6" strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" fill="none" />
      <Funder id="" x={36} y={103} d={1} />
      <Tank x={382} y={103} d={2} />
      <Expert id="" x={670} y={103} d={3} />
      {playing && <Coins path="M 236 168 H 398" />}
      {go === "1" && <Voice x={592} y={168} />}
      <g className="ttm-lock" style={{ "--d": 3 }}><Padlock x={625} y={168} /></g>
      <text className="ttm-note" x="450" y="316" textAnchor="middle" fontSize="15" fontWeight="700" fill={SOFT} fontFamily={F}>The audience only ever sees the circle on the right.</text>
    </svg>
  );
}

// The same three steps stacked, for a narrow screen.
function MaskedTall() {
  const [ref, go] = useGo(0.2);
  const still = useReducedMotion();
  const playing = go === "1" && !still;
  return (
    <svg ref={ref} data-go={go} className="st-trail-tall ttm" viewBox="0 0 360 700" aria-hidden="true">
      <Defs id="t" />
      <g className="ttm-zone" style={{ "--d": 0 }}>
        <rect x="8" y="2" width="344" height="396" rx="24" fill="#F4F6FA" stroke="#C9D3E6" strokeWidth="2" strokeDasharray="8 6" />
        <rect x="8" y="462" width="344" height="196" rx="24" fill="#EEF4FB" stroke="#C9DAEE" strokeWidth="2" />
        <text x="180" y="34" textAnchor="middle" fontSize="16" fontWeight="800" fill="#7A2E2E" fontFamily={F}>Hidden by law</text>
        <text x="180" y="494" textAnchor="middle" fontSize="16" fontWeight="800" fill="#3F5F85" fontFamily={F}>What you see</text>
      </g>
      <path className="ttm-pipe" d="M 180 196 V 232" stroke="#9C3B3B" strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" fill="none" />
      <path className="ttm-pipe ttm-pipe-b" d="M 180 366 V 518" stroke="#5A7FA6" strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" fill="none" />
      <Funder id="t" x={80} y={56} d={1} />
      <Tank x={80} y={236} d={2} />
      <Expert id="t" x={80} y={516} d={3} />
      {playing && <Coins path="M 180 196 V 262" count={2} />}
      {go === "1" && <Voice x={180} y={372} rot={90} />}
      <g className="ttm-lock" style={{ "--d": 3 }}><Padlock x={180} y={430} /></g>
      <text className="ttm-note" x="180" y="684" textAnchor="middle" fontSize="14.500" fontWeight="700" fill={SOFT} fontFamily={F}>The audience only ever sees the box at the bottom.</text>
    </svg>
  );
}

const GRADES = [["A", "#3F7D5C", "Open"], ["B", "#4C7A6B", ""], ["C", "#9C6B30", ""], ["D", "#B5533C", ""], ["E", "#9C3B3B", "Undisclosed"]];

// Takes the reader to a think tank's card further down and gives it a brief glow so the eye finds it.
function showCase(name) {
  const el = document.getElementById(caseId(name));
  if (!el) return;
  const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "center" });
  el.classList.remove("tt-flash");
  void el.offsetWidth;
  el.classList.add("tt-flash");
  window.setTimeout(() => el.classList.remove("tt-flash"), 2200);
}

// The A to E scale. On a wide screen it is five columns, each as tall as the number of think tanks given that grade, under a bar that runs from open to undisclosed; on a phone
// the same five are rows. Everything arrives in turn when it scrolls into view, and pressing a think tank takes you to what was found about it.
export function Ladder({ tanks }) {
  const [ref, go] = useGo(0.25);
  return (
    <div className="tt-wrap" data-go={go}>
      <div className="tt-meter" aria-hidden="true"><i /></div>
      <ol ref={ref} className="tt-scale" data-go={go} aria-label="Think tanks placed on the A to E transparency scale">
        {GRADES.map(([g, c, label], i) => {
          const here = tanks.filter((t) => t.grade === g);
          return (
            <li key={g} className="tt-col" style={{ "--tc": c, "--i": i, "--n": here.length }}>
              <span className="tt-grade" aria-hidden="true">{g}</span>
              <div className="tt-rung-body">
                <i className="tt-fill" aria-hidden="true" />
                <span className="sr-only">Grade {g}{label ? `, ${label}` : ""}</span>
                {label && <span className="tt-rung-label" aria-hidden="true">{label}</span>}
                {here.length > 0 ? (
                  <ul className="tt-chips">
                    {here.map((t, k) => (
                      <li key={t.name} style={{ "--k": k }}>
                        <button type="button" onClick={() => showCase(t.name)} aria-label={`${t.short ?? t.name}, grade ${g}. Go to what was found.`}>{t.short ?? t.name}</button>
                      </li>
                    ))}
                  </ul>
                ) : <span className="tt-none">None in this sample</span>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
