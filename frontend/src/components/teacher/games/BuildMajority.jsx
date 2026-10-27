/** @jsxImportSource react */
import { useMemo, useState } from "react";
import { govEvents } from "../../../lib/teacherGamesMore";
import { starsFor } from "../../../lib/teacherGamesMore";
import { Coach, Confetti, Dots, Stars } from "./kit";
import { SCENARIOS, SEATS, majorityOf, seatsOf, verdict, smallestCoalitions, hemicycle } from "../../../lib/teacherGames";

// Build a majority: 650 seats in a half circle, with made-up parties. Tap parties to join them into a government. Their seats light up, a counter climbs to
// the line at 326, and the game says whether the group is short, enough, or has a party it did not need.
const R = 150;

export default function BuildMajority() {
  const [s, setS] = useState(0);
  const [chosen, setChosen] = useState([]);
  const [showBest, setShowBest] = useState(false);
  const scenario = SCENARIOS[s];
  const pts = useMemo(() => hemicycle(), []);
  const need = majorityOf();
  const v = verdict(scenario, chosen);
  const best = useMemo(() => smallestCoalitions(scenario), [scenario]);

  // Each party's seats are a block of the half circle, left to right.
  const owner = useMemo(() => {
    const out = [];
    scenario.parties.forEach(([name, , n]) => { for (let i = 0; i < n; i++) out.push(name); });
    return out;
  }, [scenario]);
  const colourOf = (name) => scenario.parties.find(([n]) => n === name)[1];
  const toggle = (name) => { setTest(null); setChosen((c) => (c.includes(name) ? c.filter((x) => x !== name) : [...c, name])); setShowBest(false); };
  const pick = (n) => { setTest(null); setS(n); setChosen([]); setShowBest(false); };
  const pct = Math.min(100, (v.seats / SEATS) * 100);

  // Stage two: test the government you built against three votes, and say before each one whether it will win.
  const [test, setTest] = useState(null);
  const [ei, setEi] = useState(0);
  const [guess, setGuess] = useState(null);
  const [slips, setSlips] = useState(0);
  const [burst, setBurst] = useState(0);
  const events = useMemo(() => govEvents(scenario, chosen), [scenario, chosen]);
  const ev = events[ei];
  const ready = v.state === "best" || v.state === "spare";
  const startTest = () => { setTest("play"); setEi(0); setGuess(null); setSlips(0); };
  const answerTest = (yes) => { if (guess !== null) return; setGuess(yes); if (yes !== ev.wins) setSlips((n) => n + 1); };
  const nextEvent = () => { if (ei + 1 >= events.length) { setTest("end"); setBurst((b) => b + 1); } else { setEi(ei + 1); setGuess(null); } };
  const leave = () => { setTest(null); };

  return (
    <div className="gm gm-maj">
      <Confetti burst={burst} />
      <div className="gm-scen" role="tablist" aria-label="Scenario">
        {SCENARIOS.map((sc, n) => <button key={sc.key} type="button" role="tab" aria-selected={s === n} onClick={() => pick(n)}>{sc.title}</button>)}
      </div>
      <p className="gm-help">{scenario.blurb} Join parties together until they have more than half of the 650 seats. You need <b>{need}</b>.</p>
      <div className="gm-hemi">
        <svg viewBox={`-6 -6 ${R * 2 + 12} ${R + 30}`} role="img" aria-label={`${v.seats} of ${SEATS} seats chosen`}>
          {pts.map((p, i) => {
            const name = owner[i];
            const on = chosen.includes(name);
            return <circle key={i} cx={p.x} cy={p.y} r="3.6" fill={on ? colourOf(name) : "#C9D3E6"} opacity={on ? 1 : 0.55} className="gm-seat" />;
          })}
          <text x={R} y={R - 6} textAnchor="middle" fontSize="40" fontWeight="800" fill="#1B2438" fontFamily="Newsreader, Georgia, serif">{v.seats}</text>
          <text x={R} y={R + 14} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#5B6784" fontFamily="Public Sans, system-ui, sans-serif">of {SEATS} seats</text>
        </svg>
      </div>
      <div className="gm-meter" role="img" aria-label={`${v.seats} seats, ${need} needed`}>
        <i style={{ width: `${pct}%`, background: v.seats >= need ? "#1FA97C" : "#7A5AF0" }} />
        <u style={{ left: `${(need / SEATS) * 100}%` }}><small>{need}</small></u>
      </div>
      <div className="gm-parties">
        {scenario.parties.map(([name, colour, n]) => {
          const on = chosen.includes(name);
          return (
            <button key={name} type="button" className="gm-party" style={{ "--gc": colour }} aria-pressed={on} onClick={() => toggle(name)}>
              <i /><b>{name}</b><span>{n} seats</span><small>{on ? "In the government" : "Tap to join"}</small>
            </button>
          );
        })}
      </div>
      <Coach mood={v.state === "empty" ? "think" : v.state === "short" ? "oops" : "happy"} right={v.state === "best" || v.state === "spare"}>
        {v.state === "empty" && "Choose a party to start."}
        {v.state === "short" && `Not enough yet: ${v.gap} ${v.gap === 1 ? "seat" : "seats"} short of a majority.`}
        {v.state === "best" && "A majority, with as few parties as possible. That is a stable government."}
        {v.state === "spare" && `A majority, but you did not need ${v.spare === 1 ? "one of those parties" : "all of those parties"}. Could fewer do it?`}
      </Coach>
      <div className="cr-row">
        <button type="button" className="btn btn-secondary" onClick={() => setShowBest((b) => !b)}>{showBest ? "Hide the answer" : "Show the smallest government"}</button>
        <button type="button" className="btn btn-secondary" onClick={() => { setChosen([]); setShowBest(false); setTest(null); }} disabled={!chosen.length}>Clear</button>
        <button type="button" className="btn btn-primary" onClick={startTest} disabled={!ready || test === "play"}>Test your government</button>
      </div>
      {showBest && <p className="gm-help">{best.length > 1 ? `Several pairs work: ${best.map((g) => g.join(" and ")).join("; ")}.` : `${best[0].join(" and ")} ${best[0].length === 1 ? "has" : "have"} ${seatsOf(scenario, best[0])} seats, enough on ${best[0].length === 1 ? "its own" : "their own"}.`} A group with more than half the seats can pass its laws. When nobody has enough, parties may share the government (a coalition) or one may govern as a minority.</p>}
      {test === "play" && (
        <div className="gm-test">
          <Dots at={ei + (guess !== null ? 1 : 0)} total={events.length} label="Votes" />
          <div className="gm-prompt" key={ei}><small>Vote {ei + 1} of {events.length}: {ev.label}</small><b>{ev.text}</b><span>Will the government win the vote?</span></div>
          <div className="gm-votebar" role="img" aria-label={`Government ${guess === null ? "?" : ev.gov}, everyone else ${guess === null ? "?" : ev.rest}`}>
            <i style={{ width: `${guess === null ? (v.seats / SEATS) * 100 : (ev.gov / SEATS) * 100}%` }}><b>{guess === null ? v.seats : ev.gov}</b></i>
            <em><b>{guess === null ? SEATS - v.seats : ev.rest}</b></em>
          </div>
          <div className="gm-choices gm-choices-4" role="group" aria-label="Will the government win?">
            {[[true, "Yes, it wins"], [false, "No, it loses"]].map(([y, t]) => <button key={t} type="button" className="gm-choice" style={{ "--gc": y ? "#2F9E6B" : "#C13A4E" }} data-state={guess === null ? "idle" : y === ev.wins ? "right" : guess === y ? "wrong" : "idle"} disabled={guess !== null} onClick={() => answerTest(y)}><b>{t}</b></button>)}
          </div>
          <Coach mood={guess === null ? "think" : guess === ev.wins ? "happy" : "oops"} right={guess !== null && guess === ev.wins}>
            {guess === null ? "Count it up in your head. The side with more votes wins." : `${ev.wins ? "The government wins" : "The government loses"}, ${ev.gov} votes to ${ev.rest}. ${guess === ev.wins ? "You called it." : "Not what you expected?"} ${ev.lose > 0 ? "Every MP who changes sides takes a vote from one side and gives it to the other." : ""}`}
          </Coach>
          <div className="cr-row">{guess !== null && <button type="button" className="btn btn-primary btn-lg" onClick={nextEvent}>{ei + 1 >= events.length ? "Finish" : "Next vote"}</button>}</div>
        </div>
      )}
      {test === "end" && (
        <div className="gm-end">
          <Stars n={starsFor(slips)} />
          <b>{events.filter((e) => e.wins).length} of {events.length} votes won</b>
          <p>{events.every((e) => e.wins) ? "Your government held together through all three. A bigger majority gives more room for rebels." : "A government with a thin majority can lose a vote when just a few of its own MPs rebel. That is why parties work hard to keep their MPs together, and why a bigger majority is safer."}</p>
          <button type="button" className="btn btn-primary btn-lg" onClick={leave}>Back to building</button>
        </div>
      )}
    </div>
  );
}
