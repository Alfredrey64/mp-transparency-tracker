/** @jsxImportSource react */
import { useMemo, useState } from "react";
import { DAY_SLOTS, DAY_EVENTS, shuffled } from "../../../lib/teacherGames";
import { BALLOTS, CANDIDATES, countBallots, starsFor } from "../../../lib/teacherGamesMore";
import { Coach, Confetti, Dots, Stars } from "./kit";

// Election day: ten things happen between the campaign and a new government. Each comes up one at a time and the class says when it happens, on a strip that
// runs from morning to night to the days after. Every right answer drops a dot into that part of the day.
const W = 152;
const GAP = 10;
const FILL = { before: ["#DCE8FF", "#F6F9FF"], voting: ["#BFE3FF", "#FFF4D4"], close: ["#6B5BC9", "#C99AD8"], night: ["#0E1733", "#2B3A67"], after: ["#FFD1A9", "#FFE9D6"] };
const DARK = new Set(["close", "night"]);
const ink = (k) => (DARK.has(k) ? "#fff" : "#1B2438");

function Icon({ k, x }) {
  const cx = x + W / 2;
  if (k === "before") return <g transform={`translate(${cx} 70)`}><rect x="-26" y="-24" width="52" height="48" rx="8" fill="#fff" stroke="#1E4FB8" strokeWidth="3" /><rect x="-26" y="-24" width="52" height="14" rx="6" fill="#1E4FB8" />{[-14, 0, 14].map((a) => [4, 16].map((b) => <circle key={`${a}${b}`} cx={a} cy={b} r="3" fill="#1E4FB8" opacity="0.6" />))}</g>;
  if (k === "voting") return <g transform={`translate(${cx} 70)`}>{Array.from({ length: 8 }, (_, i) => <line key={i} x1="0" y1="-34" x2="0" y2="-24" stroke="#E8A21A" strokeWidth="4" strokeLinecap="round" transform={`rotate(${i * 45})`} />)}<circle r="17" fill="#F2B632" stroke="#C7871A" strokeWidth="3" /></g>;
  if (k === "close") return <g transform={`translate(${cx} 70)`}><circle r="26" fill="#fff" stroke="#fff" strokeWidth="3" /><circle r="22" fill="#2B2160" /><line x1="0" y1="0" x2="0" y2="-17" stroke="#fff" strokeWidth="3" strokeLinecap="round" /><line x1="0" y1="0" x2="-11" y2="-6.5" stroke="#F2B632" strokeWidth="4" strokeLinecap="round" /><circle r="3" fill="#fff" /></g>;
  if (k === "night") return <g transform={`translate(${cx} 70)`}><path d="M18 -26 a22 22 0 1 0 8 30 a18 18 0 0 1 -8 -30z" fill="#F7E7A9" /><rect x="-30" y="2" width="38" height="26" rx="5" fill="#fff" /><rect x="-20" y="8" width="18" height="4" rx="2" fill="#2B3A67" /><circle cx="22" cy="-10" r="2" fill="#fff" /><circle cx="14" cy="14" r="1.5" fill="#fff" /></g>;
  return <g transform={`translate(${cx} 76)`}><path d="M-30 18 l-6 -34 l18 14 l18 -26 l18 26 l18 -14 l-6 34z" fill="#F2B632" stroke="#C7871A" strokeWidth="3" strokeLinejoin="round" /><rect x="-30" y="18" width="60" height="10" rx="3" fill="#C7871A" /></g>;
}

export default function ElectionDay() {
  const order = useMemo(() => shuffled(DAY_EVENTS, 13), []);
  const [at, setAt] = useState(0);
  const [placed, setPlaced] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [firstTime, setFirstTime] = useState(0);
  const [tries, setTries] = useState(0);
  const done = at >= order.length;
  // Stage two: count twelve ballot papers, one at a time, into a pile for each candidate. One paper has two crosses and cannot be counted.
  const [stage, setStage] = useState("sort");
  const [bi, setBi] = useState(0);
  const [piles, setPiles] = useState({ a: 0, b: 0, c: 0, x: 0 });
  const [slips, setSlips] = useState(0);
  const [note, setNote] = useState(null);
  const [burst, setBurst] = useState(0);
  const paper = BALLOTS[bi];
  const tally = countBallots();
  const toss = (k) => {
    if (k === paper) {
      setPiles((p) => ({ ...p, [k]: p[k] + 1 }));
      setNote({ mood: "happy", text: k === "x" ? "Right. Two crosses means the paper cannot be counted." : "Counted." });
      if (bi + 1 >= BALLOTS.length) { setStage("result"); setBurst((b) => b + 1); } else setBi(bi + 1);
    } else { setSlips((n) => n + 1); setNote({ mood: "oops", text: paper === "x" ? "Look again. Is there more than one cross on this paper?" : "Not that pile. Look at where the cross is." }); }
  };
  const ev = order[at];

  const pick = (key) => {
    if (feedback?.right) return;
    if (key === ev.slot) {
      setFeedback({ right: true, key, why: ev.why });
      setPlaced((p) => ({ ...p, [key]: [...(p[key] ?? []), ev.id] }));
      if (tries === 0) setFirstTime((n) => n + 1);
    } else {
      setTries((n) => n + 1);
      setFeedback({ right: false, key, why: "Not quite. Think about what has to happen first, and try another time." });
    }
  };
  const next = () => { setAt((n) => n + 1); setFeedback(null); setTries(0); };
  const restart = () => { setStage("sort"); setBi(0); setPiles({ a: 0, b: 0, c: 0, x: 0 }); setSlips(0); setNote(null); setAt(0); setPlaced({}); setFeedback(null); setFirstTime(0); setTries(0); };

  return (
    <div className="gm gm-day">
      <Confetti burst={burst} />
      <svg className="gm-pyramid" viewBox={`0 0 ${W * 5 + GAP * 4} 190`} role="img" aria-label="A strip of five parts of election time: before the day, polling day, 10pm, overnight and the days after">
        <defs>{DAY_SLOTS.map((s) => <linearGradient key={s.key} id={`gd-${s.key}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={FILL[s.key][0]} /><stop offset="1" stopColor={FILL[s.key][1]} /></linearGradient>)}</defs>
        {DAY_SLOTS.map((s, i) => {
          const x = i * (W + GAP);
          const dots = placed[s.key] ?? [];
          return (
            <g key={s.key} className="gm-band" data-hit={feedback?.right && feedback.key === s.key ? "1" : "0"}>
              <rect x={x} y="0" width={W} height="190" rx="22" fill={`url(#gd-${s.key})`} />
              <Icon k={s.key} x={x} />
              <text x={x + W / 2} y="136" textAnchor="middle" fontSize="16" fontWeight="800" fill={ink(s.key)} fontFamily="Public Sans, system-ui, sans-serif">{s.title}</text>
              <text x={x + W / 2} y="154" textAnchor="middle" fontSize="12.5" fontWeight="600" fill={ink(s.key)} opacity="0.85" fontFamily="Public Sans, system-ui, sans-serif">{s.sub}</text>
              {dots.map((id, n) => <circle key={id} cx={x + 24 + n * 17} cy="176" r="6" fill={DARK.has(s.key) ? "#fff" : s.colour} className="gm-chip" />)}
            </g>
          );
        })}
      </svg>
      {!done ? (
        <>
          <Dots at={at + (feedback?.right ? 1 : 0)} total={order.length} label="Events" />
          <div className="gm-prompt" key={ev.id}>
            <small>Event {at + 1} of {order.length}</small>
            <b>{ev.text}</b>
            <span>When does this happen?</span>
          </div>
          <div className="gm-choices gm-choices-5" role="group" aria-label="When does this happen?">
            {DAY_SLOTS.map((s) => (
              <button key={s.key} type="button" className="gm-choice" style={{ "--gc": s.colour }} data-state={feedback?.key === s.key ? (feedback.right ? "right" : "wrong") : "idle"} onClick={() => pick(s.key)} disabled={Boolean(feedback?.right)}>
                <b>{s.title}</b>
                <small>{s.sub}</small>
              </button>
            ))}
          </div>
          <Coach mood={feedback ? (feedback.right ? "happy" : "oops") : "think"} right={feedback?.right}>{feedback ? (feedback.right ? `Yes. ${feedback.why}` : feedback.why) : "Pick a time."}</Coach>
          <div className="cr-row">{feedback?.right && <button type="button" className="btn btn-primary btn-lg" onClick={next}>{at + 1 === order.length ? "See how you did" : "Next event"}</button>}</div>
        </>
      ) : stage === "sort" ? (
        <div className="gm-end">
          <b>{firstTime} of {order.length} right first time</b>
          <p>From the poll card to a new Prime Minister, an election takes weeks, with one very long day in the middle. Now it is your turn to be the counting officer: twelve ballot papers are waiting.</p>
          <button type="button" className="btn btn-primary btn-lg" onClick={() => { setStage("count"); setBurst((b) => b + 1); }}>Count the votes</button>
        </div>
      ) : stage === "count" ? (
        <>
          <Dots at={bi} total={BALLOTS.length} label="Papers counted" />
          <div className="gm-count">
            <div className="gm-ballot" key={bi} aria-label={paper === "x" ? "A ballot paper with two crosses" : `A ballot paper marked for ${CANDIDATES.find((c) => c.key === paper).name}`}>
              <small>Ballot paper {bi + 1} of {BALLOTS.length}</small>
              {CANDIDATES.map((c) => (
                <div key={c.key} className="gm-ballot-row"><span>{c.name}</span><i>{paper === c.key || (paper === "x" && c.key !== "c") ? "X" : ""}</i></div>
              ))}
            </div>
            <div className="gm-piles" role="group" aria-label="Which pile does it go in?">
              {CANDIDATES.map((c) => (
                <button key={c.key} type="button" className="gm-pile" style={{ "--gc": c.colour }} onClick={() => toss(c.key)}><b>{c.name}</b><span key={piles[c.key]}>{piles[c.key]}</span></button>
              ))}
              <button type="button" className="gm-pile" style={{ "--gc": "#6B7487" }} onClick={() => toss("x")}><b>Cannot be counted</b><span key={piles.x}>{piles.x}</span></button>
            </div>
          </div>
          <Coach mood={note?.mood ?? "think"} right={note?.mood === "happy"}>{note?.text ?? "Look at where the cross is, and put the paper in that pile."}</Coach>
        </>
      ) : (
        <div className="gm-end">
          <Stars n={starsFor(Math.floor(slips / 2))} />
          <b>{tally.winners.length === 1 ? `${CANDIDATES.find((c) => c.key === tally.winners[0]).name} wins` : "It is a tie"}</b>
          <div className="gm-results" aria-label="The result">
            {CANDIDATES.map((c) => <div key={c.key} className="gm-result"><span>{c.name}</span><i style={{ width: `${(tally[c.key] / tally.valid) * 100}%`, background: c.colour }} /><b>{tally[c.key]}</b></div>)}
          </div>
          <p>{tally.a} of {tally.valid} counted votes is {Math.round(tally.share * 100)}%, which is less than half. In a general election the candidate with the <b>most</b> votes wins the area, even without more than half. This is called first past the post. {tally.x} paper had to be set aside.</p>
          <button type="button" className="btn btn-primary btn-lg" onClick={restart}>Play again</button>
        </div>
      )}
    </div>
  );
}
