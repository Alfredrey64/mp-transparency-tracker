/** @jsxImportSource react */
import { useReducedMotion } from "motion/react";
import { useGo } from "./useGo";
import { caseId } from "../../lib/caseId";

const INK = "#1B2438";
const SOFT = "#5B6784";
const F = "Public Sans, system-ui, sans-serif";
const S = "Newsreader, Georgia, serif";

// Money from a funder nobody names, through a think tank with no duty to say, to an "independent expert" on air. Only the last of the three is ever seen. It plays once, when it
// scrolls into view: the three boxes arrive in turn, the money runs to the think tank and disappears into it, a redaction bar keeps sliding over the funder's name, and an
// arrow labelled "Its staff, its views" carries the think tank across to the "independent expert" (who is its own spokesperson, with a small think tank badge to say so).
// The small padlock beside "Hidden by law" says why the left side is out of sight. Drawn along the page on a wide screen and stacked on a phone.
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

// A small padlock for the heading of the hidden side: the law lets the funder stay unnamed.
function MiniLock({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`} className="ttm-minilock">
      <path d="M -5 -1 V -5 a 5 5 0 0 1 10 0 V -1" fill="none" stroke="#7A2E2E" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="-8" y="-1" width="16" height="12" rx="3" fill="#7A2E2E" />
      <circle cy="4.5" r="1.8" fill="#fff" />
    </g>
  );
}

// The think tank speaking through the "independent" expert: a dashed line that marches from one to the other with an arrowhead, little speech bubbles carrying its words along it
// (they shrink as they reach the expert, who repeats them), a label that says what it carries and a line under it saying how it comes across. `rot` 0 runs along the page, 90
// runs down it; the label and the bubbles are drawn upright either way. The bubbles are SMIL, so they only exist when motion is allowed; the still version keeps one in the middle.
const BUBBLE = (
  <>
    <path d="M -7 8 L -11 18 L 3 9 Z" fill="#9C6B30" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
    <rect x="-17" y="-12" width="34" height="23" rx="9" fill="#9C6B30" stroke="#fff" strokeWidth="2.5" />
    <path d="M -7 8.5 L -10 15 L 1 9.5 Z" fill="#9C6B30" />
    <text x="0" y="8.5" textAnchor="middle" fontSize="26" fontWeight="700" fill="#fff" fontFamily="Newsreader, Georgia, serif">&ldquo;</text>
  </>
);

function Bubbles({ path, dur = 3.4, count = 2 }) {
  return Array.from({ length: count }, (_, i) => {
    const begin = `${(-dur / count) * i}s`;
    return (
      <g key={i} opacity="0">
        {BUBBLE}
        <animateMotion dur={`${dur}s`} begin={begin} repeatCount="indefinite" path={path} keyPoints="0;1" keyTimes="0;1" calcMode="linear" />
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.14;0.8;1" dur={`${dur}s`} begin={begin} repeatCount="indefinite" />
        <animateTransform attributeName="transform" additive="sum" type="scale" values="0.55;1;1;0.6" keyTimes="0;0.2;0.75;1" dur={`${dur}s`} begin={begin} repeatCount="indefinite" />
      </g>
    );
  });
}

function Influence({ x, y, len, rot = 0, d, label, sub, playing }) {
  const dx = rot === 90 ? 0 : 1;
  const dy = rot === 90 ? 1 : 0;
  const path = `M ${x + dx * 14} ${y + dy * 14} L ${x + dx * (len - 26)} ${y + dy * (len - 26)}`;
  const mid = len / 2;
  return (
    <g className="ttm-infl" style={{ "--d": d }}>
      <g transform={`translate(${x} ${y}) rotate(${rot})`}>
        <path className="ttm-shaft" d={`M 0 0 H ${len - 12}`} stroke="#9C6B30" strokeWidth="5" strokeDasharray="3 10" strokeLinecap="round" fill="none" />
        <g transform={`translate(${len - 2} 0)`}>
          <path className="ttm-head" d="M -15 -13 L 0 0 L -15 13" fill="none" stroke="#9C6B30" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
      {playing ? <Bubbles path={path} /> : <g transform={`translate(${x + dx * mid} ${y + dy * mid})`}>{BUBBLE}</g>}
      <g className="ttm-label" style={{ "--d": d }}>
        <rect x={label.x - label.w / 2} y={label.y - 17} width={label.w} height="34" rx="17" fill="#fff" stroke="#9C6B30" strokeWidth="3" />
        <text x={label.x} y={label.y + 5} textAnchor="middle" fontSize="14" fontWeight="800" fill={INK} fontFamily={F}>{label.text}</text>
        <text x={sub.x} y={sub.y} textAnchor="middle" fontSize="13" fontWeight="700" fill="#7A5420" fontFamily={F}>{sub.text}</text>
      </g>
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
        <g transform="translate(14 13)"><rect width="55" height="19" rx="9.5" fill="#C23B3B" /><circle className="ttm-live" cx="11.5" cy="9.5" r="3.5" fill="#fff" /><text x="20" y="13.3" textAnchor="start" textLength="27" lengthAdjust="spacingAndGlyphs" fontSize="10.5" fontWeight="800" fill="#fff" fontFamily={F}>LIVE</text></g>
        <circle cx="100" cy="38" r="17" fill="#5A7FA6" />
        <path d="M 70 84 q 30 -40 60 0z" fill="#5A7FA6" />
        <rect x="18" y="92" width="164" height="26" rx="8" fill="#1B2438" />
        <text x="100" y="110" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff" fontFamily={F}>&ldquo;Independent&rdquo; expert</text>
        <g transform="translate(172 29)">
          <g className="ttm-badge" style={{ "--d": 4 }}>
            <circle r="17" fill="#fff" stroke="#9C6B30" strokeWidth="3" />
            <path d="M -9 -2 L 0 -9 L 9 -2 Z" fill="#9C6B30" />
            {[-5, 0, 5].map((cx) => <rect key={cx} x={cx - 1.6} y="-1" width="3.2" height="7" fill="#9C6B30" />)}
            <rect x="-9" y="7" width="18" height="2.6" rx="1.2" fill="#9C6B30" />
          </g>
        </g>
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
    <svg ref={ref} data-go={go} className="st-trail-wide ttm" viewBox="0 0 1000 340" role="img" aria-label="An undisclosed funder pays a think tank. The think tank's own staff and views then appear on air as an expert presented as independent, and the audience sees only the expert, not who is behind them">
      <Defs id="" />
      <g className="ttm-zone" style={{ "--d": 0 }}>
        <g>
          <rect x="10" y="12" width="590" height="262" rx="26" fill="#F4F6FA" stroke="#C9D3E6" strokeWidth="2" strokeDasharray="8 6" />
          <text x="320" y="48" textAnchor="middle" fontSize="16" fontWeight="800" fill="#7A2E2E" fontFamily={F}>Hidden by law</text>
          <MiniLock x={247} y={36} />
        </g>
        <g>
          <rect x="750" y="12" width="240" height="262" rx="26" fill="#EEF4FB" stroke="#C9DAEE" strokeWidth="2" />
          <text x="870" y="48" textAnchor="middle" fontSize="16" fontWeight="800" fill="#3F5F85" fontFamily={F}>What you see</text>
        </g>
      </g>
      <path className="ttm-pipe" d="M 236 168 H 372" stroke="#9C3B3B" strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" fill="none" />
      <Funder id="" x={36} y={103} d={1} />
      <Tank x={382} y={103} d={2} />
      <Expert id="" x={770} y={103} d={3} />
      {playing && <Coins path="M 236 168 H 398" />}
      <Influence playing={playing} x={592} y={168} len={172} d={3.4} label={{ x: 676, y: 128, w: 164, text: "Its staff, its views" }} sub={{ x: 676, y: 205, text: "sounds \u201Cindependent\u201D" }} />
      <text className="ttm-note" x="500" y="316" textAnchor="middle" fontSize="15" fontWeight="700" fill={SOFT} fontFamily={F}>The audience only ever sees the “expert” on the right, not who is behind them.</text>
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
        <g>
          <rect x="8" y="2" width="344" height="396" rx="24" fill="#F4F6FA" stroke="#C9D3E6" strokeWidth="2" strokeDasharray="8 6" />
          <text x="196" y="34" textAnchor="middle" fontSize="16" fontWeight="800" fill="#7A2E2E" fontFamily={F}>Hidden by law</text>
          <MiniLock x={123} y={22} />
        </g>
        <g>
          <rect x="8" y="462" width="344" height="196" rx="24" fill="#EEF4FB" stroke="#C9DAEE" strokeWidth="2" />
          <text x="30" y="494" textAnchor="start" fontSize="16" fontWeight="800" fill="#3F5F85" fontFamily={F}>What you see</text>
        </g>
      </g>
      <path className="ttm-pipe" d="M 180 196 V 232" stroke="#9C3B3B" strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" fill="none" />
      <Funder id="t" x={80} y={56} d={1} />
      <Tank x={80} y={236} d={2} />
      <Expert id="t" x={80} y={516} d={3} />
      {playing && <Coins path="M 180 196 V 262" count={2} />}
      <Influence playing={playing} x={180} y={376} len={132} rot={90} d={3.4} label={{ x: 272, y: 430, w: 156, text: "Its staff, its views" }} sub={{ x: 272, y: 462, text: "sounds \u201Cindependent\u201D" }} />
      <text className="ttm-note" x="180" y="684" textAnchor="middle" fontSize="14.500" fontWeight="700" fill={SOFT} fontFamily={F}>The audience only ever sees the “expert”.</text>
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
      <ol ref={ref} className="tt-scale" data-staircase="" data-go={go} aria-label="Think tanks placed on the A to E transparency scale">
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
