/** @jsxImportSource react */
import { useState } from "react";
import { ROUTES, ROUTE_QUESTIONS } from "../../../lib/publicGames";
import { starsFor } from "../../../lib/teacherGamesMore";
import { Coach, Confetti, Dots, Stars } from "./kit";

// Who handles it? Eight everyday problems. For each one the class picks where to go first. A wrong pick is not scored against anyone: the coach explains and the class tries
// again. The stars at the end count the picks that were wrong. The routes are the ones the How to get something done page sets out.
const COLOURS = ["#1E4FB8", "#7A5AF0", "#0E9AA7", "#E8741A"];

export default function WhereToGo() {
  const [at, setAt] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [firstTime, setFirstTime] = useState(0);
  const [tries, setTries] = useState(0);
  const [burst, setBurst] = useState(0);
  const [done, setDone] = useState(false);
  const q = ROUTE_QUESTIONS[at];
  const total = ROUTE_QUESTIONS.length;

  const pick = (key) => {
    if (feedback?.right || done) return;
    if (key === q.right) {
      setFeedback({ right: true, key, why: q.why });
      if (tries === 0) setFirstTime((n) => n + 1);
    } else {
      setTries((n) => n + 1); setMistakes((n) => n + 1);
      setFeedback({ right: false, key, why: "Not quite. Think about who is responsible, and who should get the first chance to put it right." });
    }
  };
  const next = () => {
    if (at + 1 < total) { setAt(at + 1); setFeedback(null); setTries(0); return; }
    setDone(true); setBurst((b) => b + 1);
  };
  const restart = () => { setAt(0); setFeedback(null); setMistakes(0); setFirstTime(0); setTries(0); setDone(false); };

  return (
    <div className="gm gm-wd">
      <Confetti burst={burst} />
      {!done && (
        <>
          <div className="gm-score"><span>Problem {at + 1} of {total}</span><b>{firstTime} right first time</b></div>
          <Dots at={at + (feedback?.right ? 1 : 0)} total={total} label="Problems" />
          <div className="gm-prompt" key={q.id}>
            <small>Problem {at + 1}</small>
            <b>{q.text}</b>
            <span>Where do you go first?</span>
          </div>
          <div className="gm-choices" data-n="4" role="group" aria-label="Where do you go first?">
            {q.options.map((key, i) => (
              <button key={key} type="button" className="gm-choice" style={{ "--gc": COLOURS[i % COLOURS.length] }} data-state={feedback?.key === key ? (feedback.right ? "right" : "wrong") : "idle"} onClick={() => pick(key)} disabled={Boolean(feedback?.right)}>
                <b>{ROUTES[key]}</b>
              </button>
            ))}
          </div>
          <Coach mood={feedback ? (feedback.right ? "happy" : "oops") : "think"} right={feedback?.right}>{feedback ? (feedback.right ? `Yes. ${feedback.why}` : feedback.why) : "Pick the place to go first."}</Coach>
          <div className="cr-row">{feedback?.right && <button type="button" className="btn btn-primary btn-lg" onClick={next}>{at + 1 === total ? "Finish" : "Next problem"}</button>}</div>
        </>
      )}
      {done && (
        <div className="gm-end">
          <Stars n={starsFor(mistakes)} />
          <b>{firstTime} of {total} right first time.</b>
          <p>Most problems are settled by the body that caused them, if you go to the right place in the right order. Almost every route has a time limit, so it helps to start early. The page How to get something done has the steps.</p>
          <button type="button" className="btn btn-primary btn-lg" onClick={restart}>Play again</button>
        </div>
      )}
    </div>
  );
}
