/** @jsxImportSource react */
import { useMemo, useState } from "react";
import { BILL_STEPS } from "../../../data/teacherMode";
import { STEP_ORDER_SHUFFLE } from "../../../data/teacherMode";
import { nextCorrect } from "../../../lib/teacherGames";

// Make a law: the eight steps are on cards in a jumbled order. Tap the one that comes next and a bill travels along the track to its new place. A wrong
// tap says "not yet" and shows nothing about where it goes, so the class has to think. At the end the bill becomes an Act.
const SHORT = ["First reading", "Second reading", "Committee stage", "Report stage", "Third reading", "The other House", "Back and forth", "Royal Assent"];
const POS = [[120, 120], [215, 120], [310, 120], [405, 120], [500, 120], [650, 120], [650, 200], [790, 120]];

export default function MakeALaw() {
  const [placed, setPlaced] = useState([]);
  const [wrong, setWrong] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const cards = useMemo(() => STEP_ORDER_SHUFFLE.filter((i) => !placed.includes(i)), [placed]);
  const finished = placed.length === BILL_STEPS.length;
  const at = placed.length ? POS[placed[placed.length - 1]] : [40, 120];

  const choose = (i) => {
    if (nextCorrect(placed, i)) { setPlaced((p) => [...p, i]); setWrong(null); } else { setWrong(i); setMistakes((m) => m + 1); setTimeout(() => setWrong(null), 1400); }
  };
  const restart = () => { setPlaced([]); setWrong(null); setMistakes(0); };

  return (
    <div className="gm gm-law">
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
            {placed.includes(i) && <text x={x} y={y + (i === 6 ? 40 : 42)} textAnchor="middle" fontSize="11.500" fontWeight="700" fill="#1B2438" fontFamily="Public Sans, system-ui, sans-serif">{SHORT[i]}</text>}
          </g>
        ))}
        <g className="gm-bill" style={{ transform: `translate(${at[0]}px, ${at[1] - 52}px)` }}>
          <rect x="-16" y="-20" width="32" height="40" rx="5" fill="#fff" stroke="#1B2438" strokeWidth="2.500" />
          <path d="M-8 -9 h16 M-8 0 h16 M-8 9 h10" stroke="#1B2438" strokeWidth="2.500" strokeLinecap="round" />
          {finished && <path d="M-6 6 l6 7 l12 -16" stroke="#1FA97C" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
        </g>
        {finished && <text x="450" y="262" textAnchor="middle" fontSize="20" fontWeight="800" fill="#1FA97C" fontFamily="Newsreader, Georgia, serif">It is now an Act of Parliament: a law</text>}
      </svg>
      <p className="gm-help" aria-live="polite">{placed.length === 0 ? "No steps in place yet." : `${placed.length} of ${BILL_STEPS.length} steps in place. Latest: ${SHORT[placed[placed.length - 1]]}.`}</p>
      {!finished ? (
        <>
          <p className="gm-help">Which step comes {placed.length === 0 ? "first" : "next"}? Tap a card.</p>
          <ul className="gm-cards">
            {cards.map((i) => (
              <li key={i}><button type="button" className="gm-card" data-wrong={wrong === i ? "1" : "0"} onClick={() => choose(i)}>{BILL_STEPS[i]}{wrong === i && <em>Not yet. Think about what has to happen before this.</em>}</button></li>
            ))}
          </ul>
        </>
      ) : (
        <div className="gm-end">
          <b>{mistakes === 0 ? "Perfect: no wrong taps" : `${mistakes} ${mistakes === 1 ? "wrong tap" : "wrong taps"} on the way`}</b>
          <p>A bill can start in either House, so the first five steps may happen in the Lords before the Commons. Most bills the government brings in become law, but only after being checked at every step.</p>
          <button type="button" className="btn btn-primary btn-lg" onClick={restart}>Make another law</button>
        </div>
      )}
    </div>
  );
}
