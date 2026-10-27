/** @jsxImportSource react */
import { useMemo, useState } from "react";
import { ROLES, options, pointsFor } from "../../../lib/teacherGames";

// Role detective: clues about one person in politics are turned over one at a time. Guess early for more points. A wrong guess turns over the next clue.
export default function RoleDetective() {
  const order = useMemo(() => ROLES.map((r) => r.key), []);
  const [at, setAt] = useState(0);
  const [shown, setShown] = useState(1);
  const [score, setScore] = useState(0);
  const [outcome, setOutcome] = useState(null);
  const [out, setOut] = useState([]);
  const done = at >= order.length;
  const role = ROLES.find((r) => r.key === order[at]);
  const choices = useMemo(() => (role ? options(role.key) : []), [role]);

  const guess = (key) => {
    if (outcome) return;
    if (key === role.key) { const p = pointsFor(shown); setScore((s) => s + p); setOutcome({ right: true, p }); }
    else if (shown < 3) { setOut((o) => [...o, key]); setShown((n) => n + 1); }
    else { setOut((o) => [...o, key]); setOutcome({ right: false, p: 0 }); }
  };
  const next = () => { setAt((n) => n + 1); setShown(1); setOutcome(null); setOut([]); };
  const restart = () => { setAt(0); setShown(1); setScore(0); setOutcome(null); setOut([]); };

  if (done) {
    return (
      <div className="gm gm-role"><div className="gm-end"><b>{score} of {ROLES.length * 3} points</b><p>Three points for a right answer after one clue, two after two, and one after three. Every role here is in the lesson.</p><button type="button" className="btn btn-primary btn-lg" onClick={restart}>Play again</button></div></div>
    );
  }
  return (
    <div className="gm gm-role">
      <div className="gm-score"><span>Mystery {at + 1} of {ROLES.length}</span><b>{score} points</b></div>
      <div className="gm-clues" aria-live="polite">
        {role.clues.map((c, i) => (
          <div key={i} className="gm-clue" data-open={i < shown || outcome ? "1" : "0"}>
            <span aria-hidden="true">{i + 1}</span>
            <p>{i < shown || outcome ? c : "Clue hidden"}</p>
          </div>
        ))}
      </div>
      <p className="gm-help">Who am I? You can win {pointsFor(shown)} {pointsFor(shown) === 1 ? "point" : "points"} now.</p>
      <div className="gm-choices gm-choices-4" role="group" aria-label="Who am I?">
        {choices.map((o) => (
          <button key={o.key} type="button" className="gm-choice" style={{ "--gc": "#7A5AF0" }} data-state={outcome && o.key === role.key ? "right" : out.includes(o.key) ? "wrong" : "idle"} disabled={Boolean(outcome) || out.includes(o.key)} onClick={() => guess(o.key)}>
            <b>{o.name}</b>
          </button>
        ))}
      </div>
      {outcome && (
        <p className="gm-feedback" data-right={outcome.right ? "1" : "0"}>{outcome.right ? `Yes: ${role.name}. +${outcome.p} ${outcome.p === 1 ? "point" : "points"}.` : `It was ${role.name}.`}</p>
      )}
      <div className="cr-row">{outcome && <button type="button" className="btn btn-primary btn-lg" onClick={next}>{at + 1 === ROLES.length ? "See the score" : "Next mystery"}</button>}</div>
    </div>
  );
}
