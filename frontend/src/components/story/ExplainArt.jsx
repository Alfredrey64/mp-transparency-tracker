/** @jsxImportSource react */
import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useGo } from "./useGo";
import { lowData } from "../../lib/lowData";
import "../../explainart.css";

// Two pictures for the tops of pages about reading the world critically. Neither carries a figure: they show an idea, and the words under them are the page's own (passed in as `nodes`).
//   StoryFunnel   "How a story gets from an event to what we believe": many events go in, a newsroom lets only a few through, the telling gives them a colour, and what comes out is what people believe
//                 and act on. Plays on a loop while on screen; calmer motion shows the stations with the funnel still.
//   StatsLenses   "The same data, shaped by three choices": three small panels, each one showing a different choice (what a share is of, which average, where a chart starts) turning the same
//                 data into a different picture. Each panel swaps between its two readings every few seconds; calmer motion shows both readings written out and the picture in one state.

// ---- the funnel ---------------------------------------------------------------------------------------------------------------------------------------------------------

// Where each of the 20 events enters (a height in the 170-high picture), and which of them make it through the gate. Fixed, so the picture is the same every time.
const ENTRY = [22, 48, 76, 104, 130, 152, 34, 62, 90, 118, 144, 28, 56, 84, 112, 138, 40, 70, 98, 126];
const THROUGH = new Set([2, 9, 14]);
const STORY = ["#D9A441", "#4F86C6", "#C8546B"];

export function StoryFunnel({ nodes, label }) {
  const [ref, go] = useGo(0.25);
  const still = useReducedMotion() || lowData();
  return (
    <section ref={ref} className="nfn" data-go={go} data-still={still ? "1" : "0"} style={{ "--n": nodes.length }} aria-label={label}>
      <svg className="nfn-svg" viewBox="0 -38 1000 232" aria-hidden="true">
        <defs>
          <linearGradient id="nfnBand" x1="0" x2="1">
            <stop offset="0" stopColor="#E2BE7A" stopOpacity="0.22" />
            <stop offset="0.5" stopColor="#8DB7E8" stopOpacity="0.2" />
            <stop offset="1" stopColor="#5E4B8B" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {/* the funnel: wide where events come in, narrow at the newsroom's gate, wider again for the audience */}
        <path className="nfn-band" d="M0 6C160 6 220 52 300 62V108C220 118 160 164 0 164Z" fill="url(#nfnBand)" />
        <path className="nfn-band" d="M300 62C380 66 440 66 500 66V104C440 104 380 108 300 108Z" fill="url(#nfnBand)" />
        <path className="nfn-band" d="M500 66C580 66 620 40 700 22H1000V148H700C620 130 580 104 500 104Z" fill="url(#nfnBand)" />
        {/* the newsroom's gate */}
        <g className="nfn-gate"><rect x="294" y="6" width="12" height="56" rx="4" /><rect x="294" y="108" width="12" height="56" rx="4" /></g>
        {/* the telling: a frame the story passes through */}
        <g className="nfn-frame"><rect x="470" y="48" width="60" height="74" rx="8" fill="none" strokeWidth="4" /><path d="M482 64h36M482 77h36M482 90h22" strokeWidth="3" strokeLinecap="round" /></g>
        {/* the audience: a person, and the ballot box at the end */}
        <g className="nfn-person"><circle cx="700" cy="70" r="14" /><path d="M672 124c0-18 12-30 28-30s28 12 28 30z" /></g>
        <g className="nfn-box"><rect x="866" y="82" width="68" height="52" rx="6" /><rect x="886" y="82" width="28" height="7" rx="3" className="nfn-slot" /></g>
        {/* the five stages, numbered above the funnel: a number lights up for each in turn, and so does its words below */}
        {nodes.map((s, j) => (
          <g key={s.title} className="nfn-st" style={{ "--j": j, "--tc": s.colour }}>
            <line x1={100 + j * 200} y1={-12} x2={100 + j * 200} y2={6} />
            <circle cx={100 + j * 200} cy={-22} r={15} />
            <text x={100 + j * 200} y={-16.5} textAnchor="middle">{j + 1}</text>
          </g>
        ))}
        {/* what goes in and what comes through, counted from the events drawn */}
        <g className="nfn-count" aria-hidden="true">
          <text x={22} y={190} className="nfn-cn">{ENTRY.length}</text>
          <text x={22 + String(ENTRY.length).length * 17} y={190} className="nfn-cl">things happen</text>
          <text x={332} y={190} className="nfn-cn">{THROUGH.size}</text>
          <text x={332 + String(THROUGH.size).length * 17} y={190} className="nfn-cl">are covered</text>
        </g>
        {/* the events */}
        {ENTRY.map((y, i) => {
          const through = THROUGH.has(i);
          const k = [...THROUGH].indexOf(i);
          return (
            <circle
              key={i} className={through ? "nfn-ev nfn-pass" : "nfn-ev nfn-drop"} r={through ? 8 : 6} cx="0" cy="0"
              style={{ "--y0": `${y}px`, "--yg": `${85 + (y - 85) * 0.26}px`, "--y2": `${86 + (k - 1) * 12}px`, "--d": `${(i * 0.41).toFixed(2)}s`, "--c": through ? STORY[k] : "#8A93A6" }}
            />
          );
        })}
      </svg>
      <ol className="nfn-nodes">
        {nodes.map((s, i) => {
          const Icon = s.icon;
          return (
            <li key={s.title} style={{ "--tc": s.colour, "--i": i }}>
              <span className="nfn-badge" aria-hidden="true">{Icon && <Icon size={24} />}</span>
              <b>{s.title}</b>
              {s.text && <small>{s.text}</small>}
            </li>
          );
        })}
      </ol>
      <p className="nfn-note">An illustration of the idea: the number of events is only there to show how few are chosen, and the colours show that the same event can be told in different ways.</p>
    </section>
  );
}

// ---- the lenses ---------------------------------------------------------------------------------------------------------------------------------------------------------

// Eleven dots: eight close together and three far off, so the middle one and the mean sit a clear way apart. Both markers are worked out from the dots, not placed by hand.
const DOTS = [28, 40, 50, 58, 66, 74, 82, 90, 200, 225, 248];
const MID = [...DOTS].sort((a, b) => a - b)[Math.floor(DOTS.length / 2)];
const MEAN = Math.round(DOTS.reduce((a, b) => a + b, 0) / DOTS.length);
// The line: five points rising to the right. Drawn from zero it is squashed towards its top (every value is high against a zero base); from the low point it fills the picture.
const LINE = [[20, 96], [70, 80], [120, 66], [170, 46], [220, 24]];
const FLAT = 0.2;

export function StatsLenses({ nodes, label }) {
  const [ref, go] = useGo(0.25);
  const still = useReducedMotion() || lowData();
  // One reading at a time, swapping every few seconds while the picture is on screen. With calmer motion it stays on the first and both readings are written out.
  const [phase, setPhase] = useState("a");
  useEffect(() => {
    if (go !== "1" || still) return undefined;
    const t = setInterval(() => setPhase((p) => (p === "a" ? "b" : "a")), 3400);
    return () => clearInterval(t);
  }, [go, still]);
  const words = [["a small share", "a large share"], ["the middle", "the mean"], ["from zero", "from the low point"]];
  return (
    <section ref={ref} className="slx" data-go={go} data-still={still ? "1" : "0"} data-phase={phase} aria-label={label}>
      <ol className="slx-grid">
        {nodes.map((s, i) => {
          return (
            <li key={s.title} className="slx-card" style={{ "--tc": s.colour, "--i": i }}>
              <div className="slx-frame" aria-hidden="true">
                {i === 0 && (
                  /* The same count (a solid bar) inside a whole that shrinks. The two are separate boxes, so neither is stretched: the bar stays the same size and always fits inside the dotted outline. */
                  <div className="slx-share">
                    <div className="slx-whole" />
                    <div className="slx-part" />
                    <span className="slx-lab">the same count</span>
                  </div>
                )}
                {i === 1 && (
                  <svg className="slx-pic" viewBox="0 0 260 120">
                    <line x1="10" y1="62" x2="250" y2="62" className="slx-axis" />
                    {DOTS.map((x, k) => <circle key={k} cx={x} cy="62" r="5.5" className={k >= DOTS.length - 3 ? "slx-dot slx-out" : "slx-dot"} />)}
                    {/* the mean is marked above the line and the middle below it, so their labels never meet */}
                    <g className="slx-mean"><path d={`M${MEAN} 52l-7-12h14z`} /><text x={MEAN} y="30" textAnchor="middle">mean</text></g>
                    <g className="slx-mid"><path d={`M${MID} 72l-7 12h14z`} /><text x={MID} y="100" textAnchor="middle">middle</text></g>
                  </svg>
                )}
                {i === 2 && (
                  <svg className="slx-pic" viewBox="0 0 260 120">
                    <line x1="14" y1="100" x2="250" y2="100" className="slx-axis" />
                    {/* only the line is stretched: the dot at its end stays where it is, and stays round */}
                    <polyline className="slx-poly" points={LINE.map(([x, y]) => `${x},${y}`).join(" ")} fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ "--flat": FLAT, transformOrigin: "0 24px" }} vectorEffect="non-scaling-stroke" />
                    <circle className="slx-end" cx="220" cy="24" r="6" />
                    <text className="slx-lab" x="14" y="14">the same line</text>
                    <text className="slx-lab slx-ax-a" x="14" y="114">the axis starts at zero</text>
                    <text className="slx-lab slx-ax-b" x="14" y="114">the axis starts at the low point</text>
                  </svg>
                )}
              </div>
              <div className="slx-txt">
                <b>{s.title}</b>
                {s.text && <small>{s.text}</small>}
                <span className="slx-read" aria-hidden={!still}>
                  <em className="slx-a">{words[i][0]}</em>
                  <em className="slx-b">{words[i][1]}</em>
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
