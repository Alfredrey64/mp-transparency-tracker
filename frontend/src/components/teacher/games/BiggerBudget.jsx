/** @jsxImportSource react */
import { useMemo, useState } from "react";
import { budgetQuestions } from "../../../lib/publicGames";
import { starsFor } from "../../../lib/teacherGamesMore";
import { Coach, Confetti, Dots, Stars } from "./kit";

// Which budget is bigger? Eight pairs of government departments. The class picks the one planned to spend more in 2028-29, then both bars grow to show the real amounts, from the
// Treasury's Spending Review 2025. The stars count the guesses that were wrong.
const bn = (n) => `£${n.toFixed(1)} billion`;

export default function BiggerBudget() {
  const qs = useMemo(() => budgetQuestions(), []);
  const [at, setAt] = useState(0);
  const [picked, setPicked] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [firstTime, setFirstTime] = useState(0);
  const [burst, setBurst] = useState(0);
  const [done, setDone] = useState(false);
  const q = qs[at];
  const answered = picked !== null;
  const right = answered && picked === q.bigger;
  const top = Math.max(q.left.later, q.right.later);

  const pick = (name) => {
    if (answered) return;
    setPicked(name);
    if (name === q.bigger) setFirstTime((n) => n + 1); else setMistakes((n) => n + 1);
  };
  const next = () => {
    if (at + 1 < qs.length) { setAt(at + 1); setPicked(null); return; }
    setDone(true); setBurst((b) => b + 1);
  };
  const restart = () => { setAt(0); setPicked(null); setMistakes(0); setFirstTime(0); setDone(false); };

  return (
    <div className="gm gm-wd">
      <Confetti burst={burst} />
      {!done && (
        <>
          <div className="gm-score"><span>Pair {at + 1} of {qs.length}</span><b>{firstTime} right</b></div>
          <Dots at={at + (answered ? 1 : 0)} total={qs.length} label="Pairs" />
          <div className="gm-prompt" key={q.id}>
            <small>Pair {at + 1}</small>
            <b>Which department is planned to spend more in 2028-29?</b>
            <span>Day-to-day spending and investment added together.</span>
          </div>
          <div className="gm-choices gm-bb" role="group" aria-label="Which department is planned to spend more?">
            {[q.left, q.right].map((d, i) => (
              <button key={d.name} type="button" className="gm-choice" style={{ "--gc": i ? "#7A5AF0" : "#1E4FB8" }} data-state={answered && picked === d.name ? (right ? "right" : "wrong") : "idle"} onClick={() => pick(d.name)} disabled={answered}>
                <b>{d.short}</b>
                {answered && (
                  <>
                    <span className="gm-bb-bar" aria-hidden="true"><i style={{ width: `${Math.max(3, (d.later / top) * 100)}%` }} /></span>
                    <small>{bn(d.later)}</small>
                  </>
                )}
              </button>
            ))}
          </div>
          <Coach mood={answered ? (right ? "happy" : "oops") : "think"} right={right}>
            {answered ? `${right ? "Yes." : "Not this time."} ${q.bigger} is planned to spend ${bn(Math.max(q.left.later, q.right.later))}, which is ${bn(q.gap)} more.` : "Pick the bigger budget."}
          </Coach>
          <div className="cr-row">{answered && <button type="button" className="btn btn-primary btn-lg" onClick={next}>{at + 1 === qs.length ? "Finish" : "Next pair"}</button>}</div>
        </>
      )}
      {done && (
        <div className="gm-end">
          <Stars n={starsFor(mistakes)} />
          <b>{firstTime} of {qs.length} right.</b>
          <p>These are plans from the Spending Review in June 2025. They leave out benefits and the State Pension, which are counted separately, so Work and Pensions looks small. The page Spending by department shows every department.</p>
          <button type="button" className="btn btn-primary btn-lg" onClick={restart}>Play again</button>
        </div>
      )}
    </div>
  );
}
