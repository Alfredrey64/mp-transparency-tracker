/** @jsxImportSource react */
import { useMemo, useState } from "react";
import { DECIDERS, DECISIONS, shuffled, isRight } from "../../../lib/teacherGames";

// Who decides? Decisions come one at a time; the class picks the layer that makes each one. The right answer flies up into a pyramid of the three layers,
// which fills as the game goes on, and a wrong answer says why before the next one. Nothing is scored against any pupil.
const BAND = { council: { y: 168, w: 360 }, devolved: { y: 96, w: 560 }, uk: { y: 24, w: 760 } };

export default function WhoDecides() {
  const order = useMemo(() => shuffled(DECISIONS), []);
  const [at, setAt] = useState(0);
  const [placed, setPlaced] = useState({ council: [], devolved: [], uk: [] });
  const [feedback, setFeedback] = useState(null);
  const [firstTime, setFirstTime] = useState(0);
  const [tries, setTries] = useState(0);
  const done = at >= order.length;
  const item = order[at];

  const pick = (key) => {
    if (feedback?.right) return;
    if (isRight(item, key)) {
      setFeedback({ right: true, key, why: item.why });
      setPlaced((p) => ({ ...p, [key]: [...p[key], item.id] }));
      if (tries === 0) setFirstTime((n) => n + 1);
    } else {
      setTries((n) => n + 1);
      setFeedback({ right: false, key, why: "Not quite. Think about who looks after it, and try another layer." });
    }
  };
  const next = () => { setAt((n) => n + 1); setFeedback(null); setTries(0); };
  const restart = () => { setAt(0); setPlaced({ council: [], devolved: [], uk: [] }); setFeedback(null); setFirstTime(0); setTries(0); };

  return (
    <div className="gm gm-wd">
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

      {!done ? (
        <>
          <div className="gm-prompt" key={item.id}>
            <small>Decision {at + 1} of {order.length}</small>
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
          <p className="gm-feedback" data-right={feedback?.right ? "1" : "0"} aria-live="polite">{feedback ? (feedback.right ? `Yes. ${feedback.why}` : feedback.why) : "Pick a layer."}</p>
          <div className="cr-row">{feedback?.right && <button type="button" className="btn btn-primary btn-lg" onClick={next}>{at + 1 === order.length ? "See how you did" : "Next decision"}</button>}</div>
        </>
      ) : (
        <div className="gm-end">
          <b>{firstTime} of {order.length} right first time</b>
          <p>Every decision is now in its layer. Some things are shared between layers, and a few change over time, so it is fine to disagree and look it up.</p>
          <button type="button" className="btn btn-primary btn-lg" onClick={restart}>Play again</button>
        </div>
      )}
    </div>
  );
}
