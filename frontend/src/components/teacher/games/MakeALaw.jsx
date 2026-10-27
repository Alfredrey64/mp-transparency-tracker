/** @jsxImportSource react */
import { useMemo, useState } from "react";
import { BILL_STEPS } from "../../../data/teacherMode";
import { STEP_ORDER_SHUFFLE } from "../../../data/teacherMode";
import { nextCorrect } from "../../../lib/teacherGames";
import { LAW_TROUBLE, starsFor } from "../../../lib/teacherGamesMore";
import { Coach, Confetti, Dots, Stars } from "./kit";

// Make a law: the eight steps are on cards in a jumbled order. Tap the one that comes next and a bill travels along the track to its new place. A wrong
// tap says "not yet" and shows nothing about where it goes, so the class has to think. At the end the bill becomes an Act.
const SHORT = ["First reading", "Second reading", "Committee stage", "Report stage", "Third reading", "The other House", "Back and forth", "Royal Assent"];
const FROM = [0, 5, 5];
const POS = [[120, 120], [215, 120], [310, 120], [405, 120], [500, 120], [650, 120], [650, 200], [790, 120]];

export default function MakeALaw() {
  const [placed, setPlaced] = useState([]);
  const [wrong, setWrong] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [q, setQ] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [line, setLine] = useState(null);
  const [burst, setBurst] = useState(0);
  const [stage, setStage] = useState("order");
  const cards = useMemo(() => STEP_ORDER_SHUFFLE.filter((i) => !placed.includes(i)), [placed]);
  const finished = placed.length === BILL_STEPS.length;
  const trouble = LAW_TROUBLE[q];
  const at = stage === "order" ? (placed.length ? POS[placed[placed.length - 1]] : [40, 120]) : POS[answered || stage === "end" ? trouble.at : FROM[q]];

  const choose = (i) => {
    if (nextCorrect(placed, i)) { const p = [...placed, i]; setPlaced(p); setWrong(null); if (p.length === BILL_STEPS.length) { setBurst((b) => b + 1); setLine({ mood: "cheer", text: "It is a law! But a bill does not always get this far. Now see what happens when things go wrong." }); } } else { setWrong(i); setMistakes((m) => m + 1); setTimeout(() => setWrong(null), 1400); }
  };
  const answer = (o) => {
    if (answered) return;
    if (o === trouble.answer) { setAnswered(true); setLine({ mood: "happy", text: `Yes. ${trouble.why}` }); }
    else { setMistakes((m) => m + 1); setLine({ mood: "oops", text: "Not quite. Think about the steps you have just put in order, and try again." }); }
  };
  const nextQ = () => { if (q + 1 >= LAW_TROUBLE.length) { setStage("end"); setBurst((b) => b + 1); setLine(null); } else { setQ(q + 1); setAnswered(false); setLine(null); } };
  const restart = () => { setPlaced([]); setWrong(null); setMistakes(0); setQ(0); setAnswered(false); setLine(null); setStage("order"); };

  return (
    <div className="gm gm-law">
      <Confetti burst={burst} />
      <svg className="gm-track" viewBox="0 0 900 280" role="img" aria-label="The route of a bill through Parliament">
        <rect x="70" y="40" width="470" height="140" rx="26" fill="#E5EDFB" stroke="#1E4FB8" strokeWidth="3" />
        <text x="90" y="68" fontSize="15" fontWeight="800" fill="#1E4FB8" fontFamily="Public Sans, system-ui, sans-serif">The first House</text>
        <rect x="590" y="40" width="130" height="190" rx="26" fill="#FBE5E8" stroke="#C13A4E" strokeWidth="3" />
        <text x="605" y="68" fontSize="15" fontWeight="800" fill="#C13A4E" fontFamily="Public Sans, system-ui, sans-serif">Other House</text>
        <g transform="translate(790 120)"><path d="M-30 18 l-6 -34 l18 14 l18 -26 l18 26 l18 -14 l-6 34z" fill="#F2B632" stroke="#C7871A" strokeWidth="3" strokeLinejoin="round" /><rect x="-30" y="18" width="60" height="10" rx="3" fill="#C7871A" /><text y="52" textAnchor="middle" fontSize="13" fontWeight="800" fill="#7A5A10" fontFamily="Public Sans, system-ui, sans-serif">The King</text></g>
        <path d="M 120 120 H 500 C 560 120, 600 120, 650 120 V 200 M 650 120 H 760" fill="none" stroke="#B8C3D9" strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" />
        {POS.slice(0, 7).map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="17" fill={placed.includes(i) ? "#1FA97C" : "#fff"} stroke={placed.includes(i) ? "#1FA97C" : "#B8C3D9"} strokeWidth="3" className="gm-node" />
            <text x={x} y={y + 5} textAnchor="middle" fontSize="14" fontWeight="800" fill={placed.includes(i) ? "#fff" : "#8A94A6"} fontFamily="Public Sans, system-ui, sans-serif">{i + 1}</text>
            {placed.includes(i) && <text x={x} y={y + (i === 6 ? 40 : 42)} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#1B2438" fontFamily="Public Sans, system-ui, sans-serif">{SHORT[i]}</text>}
          </g>
        ))}
        <g className="gm-bill" data-mood={stage === "trouble" && answered ? trouble.mood : "none"} style={{ transform: `translate(${at[0]}px, ${at[1] - 52}px)` }}>
          <rect x="-16" y="-20" width="32" height="40" rx="5" fill="#fff" stroke="#1B2438" strokeWidth="2.5" />
          <path d="M-8 -9 h16 M-8 0 h16 M-8 9 h10" stroke="#1B2438" strokeWidth="2.5" strokeLinecap="round" />
          {(stage === "end" || (finished && stage === "order")) && <path d="M-6 6 l6 7 l12 -16" stroke="#1FA97C" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
        </g>
        {stage === "end" && <text x="450" y="262" textAnchor="middle" fontSize="20" fontWeight="800" fill="#1FA97C" fontFamily="Newsreader, Georgia, serif">It is now an Act of Parliament: a law</text>}
      </svg>
      {stage === "order" && <p className="gm-help" aria-live="polite">{placed.length === 0 ? "No steps in place yet." : `${placed.length} of ${BILL_STEPS.length} steps in place. Latest: ${SHORT[placed[placed.length - 1]]}.`}</p>}
      {stage === "order" && !finished && (
        <>
          <Dots at={placed.length} total={BILL_STEPS.length} label="Steps in place" />
          <p className="gm-help">Which step comes {placed.length === 0 ? "first" : "next"}? Tap a card.</p>
          <ul className="gm-cards">
            {cards.map((i) => (
              <li key={i}><button type="button" className="gm-card" data-wrong={wrong === i ? "1" : "0"} onClick={() => choose(i)}>{BILL_STEPS[i]}{wrong === i && <em>Not yet. Think about what has to happen before this.</em>}</button></li>
            ))}
          </ul>
        </>
      )}
      {stage === "order" && finished && (
        <>
          <Coach mood="cheer" right>{line?.text}</Coach>
          <div className="cr-row"><button type="button" className="btn btn-primary btn-lg" onClick={() => { setStage("trouble"); setLine(null); }}>Bill in trouble: try the challenge</button></div>
        </>
      )}
      {stage === "trouble" && (
        <>
          <Dots at={q + (answered ? 1 : 0)} total={LAW_TROUBLE.length} label="Challenges" />
          <div className="gm-prompt" key={q}><small>Challenge {q + 1} of {LAW_TROUBLE.length}</small><b>{trouble.q}</b><span>Pick what really happens.</span></div>
          <div className="gm-choices" role="group" aria-label="What happens?">
            {trouble.options.map((o, i) => <button key={o} type="button" className="gm-choice" style={{ "--gc": "#1E4FB8" }} data-state={answered && i === trouble.answer ? "right" : "idle"} disabled={answered} onClick={() => answer(i)}><b>{o}</b></button>)}
          </div>
          <Coach mood={line?.mood ?? "think"} right={line?.mood === "happy"}>{line?.text ?? "Look at the track. What would happen to the bill?"}</Coach>
          <div className="cr-row">{answered && <button type="button" className="btn btn-primary btn-lg" onClick={nextQ}>{q + 1 >= LAW_TROUBLE.length ? "Finish" : "Next challenge"}</button>}</div>
        </>
      )}
      {stage === "end" && (
        <div className="gm-end">
          <Stars n={starsFor(mistakes)} />
          <b>{mistakes === 0 ? "Perfect: no wrong taps" : `${mistakes} ${mistakes === 1 ? "wrong tap" : "wrong taps"} on the way`}</b>
          <p>A bill can start in either House, so the first five steps may happen in the Lords before the Commons. Most bills the government brings in become law, but only after being checked at every step. Try the Lords and Commons ping-pong game to see the back and forth for yourself.</p>
          <button type="button" className="btn btn-primary btn-lg" onClick={restart}>Make another law</button>
        </div>
      )}
    </div>
  );
}
