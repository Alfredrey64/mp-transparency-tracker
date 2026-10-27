/** @jsxImportSource react */
import { useMemo, useState } from "react";
import { ROLES, options, pointsFor } from "../../../lib/teacherGames";
import { PLACES, ROLE_PLACE, placeOptions, starsFor } from "../../../lib/teacherGamesMore";
import { Coach, Confetti, Dots, PlaceIcon, Stars } from "./kit";

// Role detective: clues about one person in politics are turned over one at a time. Guess early for more points. A wrong guess turns over the next clue.
// Then there is a bonus: where does that person work? One more point for the right building.
export default function RoleDetective() {
  const order = useMemo(() => ROLES.map((r) => r.key), []);
  const [at, setAt] = useState(0);
  const [shown, setShown] = useState(1);
  const [score, setScore] = useState(0);
  const [outcome, setOutcome] = useState(null);
  const [out, setOut] = useState([]);
  const [bonus, setBonus] = useState(null);
  const [placeOut, setPlaceOut] = useState([]);
  const [slips, setSlips] = useState(0);
  const [burst, setBurst] = useState(0);
  const done = at >= order.length;
  const role = ROLES.find((r) => r.key === order[at]);
  const choices = useMemo(() => (role ? options(role.key) : []), [role]);
  const places = useMemo(() => (role ? placeOptions(role.key) : []), [role]);

  const guess = (key) => {
    if (outcome) return;
    if (key === role.key) { const p = pointsFor(shown); setScore((s) => s + p); setOutcome({ right: true, p }); setBurst((b) => b + 1); }
    else if (shown < 3) { setOut((o) => [...o, key]); setShown((n) => n + 1); setSlips((n) => n + 1); }
    else { setOut((o) => [...o, key]); setOutcome({ right: false, p: 0 }); setSlips((n) => n + 1); }
  };
  const where = (key) => {
    if (bonus === "done" || placeOut.includes(key)) return;
    if (key === ROLE_PLACE[role.key]) { setBonus("done"); setScore((s) => s + 1); } else { setPlaceOut((p) => [...p, key]); setSlips((n) => n + 1); }
  };
  const next = () => { setAt((n) => n + 1); setShown(1); setOutcome(null); setOut([]); setBonus(null); setPlaceOut([]); if (at + 1 >= order.length) setBurst((b) => b + 1); };
  const restart = () => { setAt(0); setShown(1); setScore(0); setOutcome(null); setOut([]); setBonus(null); setPlaceOut([]); setSlips(0); };

  if (done) {
    return (
      <div className="gm gm-role">
        <Confetti burst={burst} />
        <div className="gm-end"><Stars n={starsFor(Math.floor(slips / 3))} /><b>{score} of {ROLES.length * 4} points</b><p>Three points for a right answer after one clue, two after two, one after three, and a bonus point for knowing where they work. Every role here is in the lesson.</p><button type="button" className="btn btn-primary btn-lg" onClick={restart}>Play again</button></div>
      </div>
    );
  }
  const answeredRight = outcome?.right;
  return (
    <div className="gm gm-role">
      <Confetti burst={burst} />
      <div className="gm-score"><span>Mystery {at + 1} of {ROLES.length}</span><b>{score} points</b></div>
      <Dots at={at} total={ROLES.length} label="Mysteries" />
      <div className="gm-clues" aria-live="polite">
        {role.clues.map((c, i) => (
          <div key={i} className="gm-clue" data-open={i < shown || outcome ? "1" : "0"}>
            <span aria-hidden="true">{i + 1}</span>
            <p>{i < shown || outcome ? c : "Clue hidden"}</p>
          </div>
        ))}
      </div>
      {!outcome && <p className="gm-help">Who am I? You can win {pointsFor(shown)} {pointsFor(shown) === 1 ? "point" : "points"} now.</p>}
      {!outcome && (
        <div className="gm-choices gm-choices-4" role="group" aria-label="Who am I?">
          {choices.map((o) => (
            <button key={o.key} type="button" className="gm-choice" style={{ "--gc": "#7A5AF0" }} data-state={out.includes(o.key) ? "wrong" : "idle"} disabled={out.includes(o.key)} onClick={() => guess(o.key)}>
              <b>{o.name}</b>
            </button>
          ))}
        </div>
      )}
      {outcome && (
        <>
          <Coach mood={answeredRight ? "happy" : "oops"} right={answeredRight}>{answeredRight ? `Yes: ${role.name}. +${outcome.p} ${outcome.p === 1 ? "point" : "points"}.` : `It was ${role.name}.`}</Coach>
          <p className="gm-help"><b>Bonus point:</b> where does this person work?</p>
          <div className="gm-places" role="group" aria-label="Where do they work?">
            {places.map((p) => (
              <button key={p.key} type="button" className="gm-place" style={{ "--gc": p.colour }} data-state={bonus === "done" && p.key === ROLE_PLACE[role.key] ? "right" : placeOut.includes(p.key) ? "wrong" : "idle"} disabled={bonus === "done" || placeOut.includes(p.key)} onClick={() => where(p.key)}>
                <PlaceIcon k={p.key} /><b>{PLACES.find((x) => x.key === p.key).name}</b>
              </button>
            ))}
          </div>
        </>
      )}
      <div className="cr-row">{outcome && <button type="button" className="btn btn-primary btn-lg" onClick={next}>{bonus === "done" || placeOut.length >= 3 ? (at + 1 === ROLES.length ? "See the score" : "Next mystery") : "Skip the bonus"}</button>}</div>
    </div>
  );
}
