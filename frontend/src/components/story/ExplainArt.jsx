/** @jsxImportSource react */
import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useGo } from "./useGo";
import { useStepper } from "./useStepper";
import { lowData } from "../../lib/lowData";
import "../../explainart.css";

// Two pictures for the tops of pages about reading the world critically. Neither carries a figure: they show an idea, and the words under them are the page's own (passed in as `nodes`).
//   StoryFunnel   "How a story gets from an event to what we believe": many events go in, a newsroom lets only a few through, the telling gives them a colour, and what comes out is what people believe
//                 and act on. Plays on a loop while on screen; calmer motion shows the stations with the funnel still.
//   StatsLenses   "The same data, shaped by three choices": three small panels, each one showing a different choice (what a share is of, which average, where a chart starts) turning the same
//                 data into a different picture. Each panel swaps between its two readings every few seconds; calmer motion shows both readings written out and the picture in one state.

// ---- the funnel ---------------------------------------------------------------------------------------------------------------------------------------------------------

// One story travels through the funnel, stage by stage, and the stage it is at is the one that is lit: both come from the same step number, so the dot and the stages move together.
// The grey dots left of the gate are the other things that happen; they stay where they are, because they are not covered.
const STAGE_X = [100, 300, 500, 700, 900];
const STAGE_Y = [85, 85, 85, 40, 60];
const GREY = "#8A93A6";
// 19 resting dots scattered inside the wide end of the funnel (worked out from a fixed pattern, so the picture is the same every time), kept clear of the one that moves
const REST = Array.from({ length: 40 }, (_, i) => {
  const x = 22 + ((i * 53) % 215);
  const t = x / 300;
  const top = 6 + 56 * t + 10;
  const bottom = 164 - 56 * t - 10;
  const y = top + (((i * 37) % 100) / 100) * (bottom - top);
  return { x, y };
}).filter((d) => Math.hypot(d.x - STAGE_X[0], d.y - STAGE_Y[0]) > 22).slice(0, 19);

export function StoryFunnel({ nodes, label }) {
  const [ref, go] = useGo(0.25);
  const still = useReducedMotion() || lowData();
  const st = useStepper(nodes.length, go, still, 2700);
  const { step } = st;
  // when the story goes back to the start it reappears there instead of flying back across the picture
  const back = st.wrap;
  const shown = still ? 0 : step;
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
        {/* the five stages, numbered above the funnel: the number for the stage the story is at lights up, and so do its words below */}
        {nodes.map((s, j) => (
          <g key={s.title} className="nfn-st" data-on={!still && j === step ? "1" : "0"} style={{ "--tc": s.colour }}>
            <line x1={STAGE_X[j]} y1={-12} x2={STAGE_X[j]} y2={6} />
            <circle cx={STAGE_X[j]} cy={-22} r={15} />
            <text x={STAGE_X[j]} y={-16.5} textAnchor="middle">{j + 1}</text>
          </g>
        ))}
        {/* what goes in, counted from the dots drawn: these are not covered */}
        <g className="nfn-count" aria-hidden="true">
          <text x={22} y={190} className="nfn-cn">{REST.length + 1}</text>
          <text x={22 + String(REST.length + 1).length * 21 + 8} y={190} className="nfn-cl">things happen</text>
          <text x={332} y={190} className="nfn-cl">only a few are covered</text>
        </g>
        {REST.map((d, i) => <circle key={i} className="nfn-rest" cx={d.x} cy={d.y} r="5.5" />)}
        {/* the one story that is followed */}
        <g className="nfn-tok" data-back={back ? "1" : "0"} style={{ transform: `translate(${STAGE_X[shown]}px, ${STAGE_Y[shown]}px)` }}>
          <circle className="nfn-dot" r="9" style={{ fill: shown >= 2 ? nodes[shown].colour : GREY }} />
        </g>
      </svg>
      <ol className="nfn-nodes">
        {nodes.map((s, i) => {
          const Icon = s.icon;
          return (
            <li key={s.title} data-on={!still && i === step ? "1" : "0"} style={{ "--tc": s.colour, "--i": i }}>
              <button type="button" className="nfn-stb" onClick={() => st.pick(i)} aria-current={!still && i === step ? "step" : undefined}>
                <span className="nfn-badge" aria-hidden="true">{Icon && <Icon size={24} />}</span>
                <span className="nfn-tx">
                  <b>{s.title}</b>
                  {s.text && <small>{s.text}</small>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      {!still && (
        <div className="nfn-ctl"><button type="button" onClick={st.toggle} aria-pressed={!st.running}>{st.running ? "Pause" : "Play the story"}</button></div>
      )}
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
                    {still ? (
                      /* calmer motion: both markers are shown, the mean above the line and the middle below it, so their labels never meet */
                      <>
                        <g className="slx-mean"><path d={`M${MEAN} 52l-7-12h14z`} /><text x={MEAN} y="30" textAnchor="middle">mean</text></g>
                        <g className="slx-mid"><path d={`M${MID} 72l-7 12h14z`} /><text x={MID} y="100" textAnchor="middle">middle</text></g>
                      </>
                    ) : (
                      /* one marker slides from the middle to the mean, so the picture moves like the other two and shows how far the far dots pull the mean away */
                      <>
                        <line className="slx-gap" x1={MID} x2={MEAN} y1="62" y2="62" />
                        <g className="slx-mk" style={{ "--dx": `${MEAN - MID}px` }}>
                          <path d={`M${MID} 72l-7 12h14z`} />
                          <text className="slx-mk-a" x={MID} y="100" textAnchor="middle">middle</text>
                          <text className="slx-mk-b" x={MID} y="100" textAnchor="middle">mean</text>
                        </g>
                      </>
                    )}
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
