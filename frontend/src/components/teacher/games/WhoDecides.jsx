/** @jsxImportSource react */
import { useMemo, useState } from "react";
import { DECIDERS, isRight } from "../../../lib/teacherGames";
import { rounds as makeRounds, starsFor } from "../../../lib/teacherGamesMore";
import { Coach, Confetti, Dots, Stars } from "./kit";

// Who decides? Three rounds of four decisions. The class picks the layer that makes each one, and the answer drops into a pyramid of the three layers, which
// fills as the game goes on. Each round ends with stars, and the last one with a full pyramid. Nothing is scored against any pupil.
const BAND = { council: { y: 168, w: 360 }, devolved: { y: 96, w: 560 }, uk: { y: 24, w: 760 } };
const TITLES = ["Close to home", "Across the nations", "The big picture"];

export default function WhoDecides() {
  const rounds = useMemo(() => makeRounds(), []);
  const [ri, setRi] = useState(0);
  const [at, setAt] = useState(0);
  const [placed, setPlaced] = useState({ council: [], devolved: [], uk: [] });
  const [feedback, setFeedback] = useState(null);
  const [tries, setTries] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [stars, setStars] = useState([]);
  const [phase, setPhase] = useState("play");
  const [burst, setBurst] = useState(0);
  const [firstTime, setFirstTime] = useState(0);
  const round = rounds[ri];
  const item = round?.[at];
  const total = rounds.flat().length;

  const pick = (key) => {
    if (feedback?.right || phase !== "play") return;
    if (isRight(item, key)) {
      setFeedback({ right: true, key, why: item.why });
      setPlaced((p) => ({ ...p, [key]: [...p[key], item.id] }));
      if (tries === 0) setFirstTime((n) => n + 1);
    } else {
      setTries((n) => n + 1); setMistakes((n) => n + 1);
      setFeedback({ right: false, key, why: "Not quite. Think about who looks after it, and try another layer." });
    }
  };
  const next = () => {
    if (at + 1 < round.length) { setAt(at + 1); setFeedback(null); setTries(0); return; }
    setStars((s) => [...s, starsFor(mistakes)]);
    setPhase(ri + 1 >= rounds.length ? "end" : "roundEnd");
    setBurst((b) => b + 1);
  };
  const nextRound = () => { setRi(ri + 1); setAt(0); setFeedback(null); setTries(0); setMistakes(0); setPhase("play"); };
  const restart = () => { setRi(0); setAt(0); setPlaced({ council: [], devolved: [], uk: [] }); setFeedback(null); setTries(0); setMistakes(0); setStars([]); setPhase("play"); setFirstTime(0); };
  const sum = stars.reduce((a, b) => a + b, 0);

  return (
    <div className="gm gm-wd">
      <Confetti burst={burst} />
      <svg className="gm-pyramid" viewBox="0 0 800 250" role="img" aria-label="Three layers of decision-making: your council at the bottom, the devolved governments in the middle, the UK Parliament at the top">
        {DECIDERS.map((d) => {
          const b = BAND[d.key];
          const x = 400 - b.w / 2;
          const chips = placed[d.key];
          return (
            <g key={d.key} className="gm-band" data-hit={feedback?.right && feedback.key === d.key ? "1" : "0"}>
              <rect x={x} y={b.y} width={b.w} height="64" rx="20" fill={d.colour} opacity="0.95" />
              <text x={x + 22} y={b.y + 27} fontSize="19" fontWeight="800" fill="#fff" fontFamily="Public Sans, system-ui, sans-serif">{d.title}</text>
              <text x={x + 22} y={b.y + 49} fontSize="13" fontWeight="600" fill="#fff" opacity="0.9" fontFamily="Public Sans, system-ui, sans-serif">{d.blurb}</text>
              {chips.map((id, n) => <circle key={id} cx={x + b.w - 26 - n * 22} cy={b.y + 32} r="8" fill="#fff" className="gm-chip" />)}
            </g>
          );
        })}
        <text x="400" y="244" textAnchor="middle" fontSize="13" fontWeight="700" fill="#5B6784" fontFamily="Public Sans, system-ui, sans-serif">The further a layer reaches, the wider its band</text>
      </svg>

      {phase === "play" && (
        <>
          <div className="gm-score"><span>Round {ri + 1} of {rounds.length}: {TITLES[ri]}</span><b>{stars.reduce((a, b) => a + b, 0)} stars so far</b></div>
          <Dots at={at + (feedback?.right ? 1 : 0)} total={round.length} label="Decisions in this round" />
          <div className="gm-prompt" key={item.id}>
            <small>Decision {at + 1} of {round.length}</small>
            <b>{item.text}</b>
            <span>Who decides?</span>
          </div>
          <div className="gm-choices" role="group" aria-label="Who decides?">
            {DECIDERS.map((d) => (
              <button key={d.key} type="button" className="gm-choice" style={{ "--gc": d.colour }} data-state={feedback?.key === d.key ? (feedback.right ? "right" : "wrong") : "idle"} onClick={() => pick(d.key)} disabled={Boolean(feedback?.right)}>
                <b>{d.title}</b>
                <small>{d.blurb}</small>
              </button>
            ))}
          </div>
          <Coach mood={feedback ? (feedback.right ? "happy" : "oops") : "think"} right={feedback?.right}>{feedback ? (feedback.right ? `Yes. ${feedback.why}` : feedback.why) : "Pick a layer."}</Coach>
          <div className="cr-row">{feedback?.right && <button type="button" className="btn btn-primary btn-lg" onClick={next}>{at + 1 === round.length ? "Finish the round" : "Next decision"}</button>}</div>
        </>
      )}
      {phase === "roundEnd" && (
        <div className="gm-end">
          <Stars n={stars[ri]} />
          <b>Round {ri + 1} done: {TITLES[ri]}</b>
          <p>{stars[ri] === 3 ? "No wrong answers. " : ""}{Object.values(placed).flat().length} of {total} decisions are in the pyramid. The next round has some trickier ones.</p>
          <button type="button" className="btn btn-primary btn-lg" onClick={nextRound}>Start round {ri + 2}</button>
        </div>
      )}
      {phase === "end" && (
        <div className="gm-end">
          <Stars n={Math.round(sum / stars.length)} />
          <b>{sum} of {rounds.length * 3} stars. {firstTime} of {total} right first time.</b>
          <p>Every decision is now in its layer. Some things are shared between layers, and a few change over time, so it is fine to disagree and look it up. The Spot the layer game shows how the same decision can change from one nation to another.</p>
          <button type="button" className="btn btn-primary btn-lg" onClick={restart}>Play again</button>
        </div>
      )}
    </div>
  );
}
