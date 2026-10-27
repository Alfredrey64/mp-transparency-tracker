/** @jsxImportSource react */
import { useEffect, useRef, useState } from "react";
import { SEATS, majorityOf, seatsOf } from "../../../lib/teacherGames";
import { PUZZLES, POLICIES, MAX_POLICIES, checkDeal, puzzleScenario, solutions } from "../../../lib/teacherGamesMore";
import { Coach, Confetti, Face, PolicyIcon } from "./kit";

// Coalition negotiator: nobody has won enough seats alone. Invite the parties you want in the government, then choose the policies in the deal. Every party
// has things it must have and things it will never accept. Propose the deal, and each party reacts in turn. Only one government can work.
const nameOf = (k) => POLICIES.find((p) => p.key === k).name;

export default function CoalitionNegotiator() {
  const [pi, setPi] = useState(0);
  const [invited, setInvited] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [phase, setPhase] = useState("plan");
  const [shown, setShown] = useState(0);
  const [result, setResult] = useState(null);
  const [hint, setHint] = useState(false);
  const [tries, setTries] = useState(0);
  const [burst, setBurst] = useState(0);
  const timer = useRef(null);
  const puzzle = PUZZLES[pi];
  const scenario = puzzleScenario(puzzle);
  const seats = seatsOf(scenario, invited);
  const need = majorityOf();

  useEffect(() => () => clearInterval(timer.current), []);

  const reset = (next = pi) => { clearInterval(timer.current); setPi(next); setInvited([]); setPolicies([]); setPhase("plan"); setShown(0); setResult(null); setHint(false); setTries(0); };
  const toggleParty = (n) => { if (phase === "reacting") return; setPhase("plan"); setShown(0); setResult(null); setInvited((v) => (v.includes(n) ? v.filter((x) => x !== n) : [...v, n])); };
  const togglePolicy = (k) => { if (phase === "reacting") return; setPhase("plan"); setShown(0); setResult(null); setPolicies((v) => (v.includes(k) ? v.filter((x) => x !== k) : v.length < MAX_POLICIES ? [...v, k] : v)); };
  const propose = () => {
    const r = checkDeal(puzzle, invited, policies);
    setResult(r); setTries((t) => t + 1); setPhase("reacting"); setShown(0);
    let n = 0;
    timer.current = setInterval(() => {
      n += 1; setShown(n);
      if (n >= r.reactions.length) { clearInterval(timer.current); setPhase("result"); if (r.ok) setBurst((b) => b + 1); }
    }, 750);
  };
  const react = (n) => { if (!result || phase === "plan") return null; const i = result.reactions.findIndex((r) => r.party === n); return i >= 0 && i < shown ? result.reactions[i] : null; };
  const answer = solutions(puzzle)[0];
  const won = phase === "result" && result?.ok;

  let verdict;
  if (!result || phase === "plan") verdict = { mood: "think", text: invited.length ? `${seats} of ${SEATS} seats so far. You need ${need}. Now choose the policies for the deal, then propose it.` : "Tap the parties you want in the government, and pick the policies for the deal." };
  else if (phase === "reacting") verdict = { mood: "think", text: "The parties are looking at the deal…" };
  else if (result.ok) verdict = { mood: "cheer", text: `A government! ${result.seats} seats, and every party got what it needs. It took ${tries} ${tries === 1 ? "go" : "goes"}.` };
  else if (!result.allHappy) verdict = { mood: "oops", text: "At least one party walked out. Read what each party needs and will not accept, and try again." };
  else verdict = { mood: "oops", text: `Everyone is happy, but ${result.seats} seats is short of a majority. You need ${need}.` };

  return (
    <div className="gm gm-coal">
      <Confetti burst={burst} />
      <div className="gm-scen" role="tablist" aria-label="Puzzle">
        {PUZZLES.map((p, n) => <button key={p.key} type="button" role="tab" aria-selected={pi === n} onClick={() => reset(n)}>{p.title}</button>)}
      </div>
      <p className="gm-help">Nobody has more than half of the seats. Invite parties until you reach <b>{need}</b> seats, then fill the deal with up to <b>{MAX_POLICIES} policies</b>. Each party <b>needs</b> some things and <b>will not accept</b> others, so choose carefully.</p>
      <div className="gm-meter" role="img" aria-label={`${seats} seats, ${need} needed`}>
        <i style={{ width: `${Math.min(100, (seats / SEATS) * 100)}%`, background: seats >= need ? "#1FA97C" : "#7A5AF0" }} />
        <u style={{ left: `${(need / SEATS) * 100}%` }}><small>{need}</small></u>
      </div>
      <ul className="gm-table">
        {scenario.parties.map(([name, colour, n]) => {
          const p = puzzle.parties.find((x) => x.name === name);
          const on = invited.includes(name);
          const r = react(name);
          const mood = r ? (r.ok ? "happy" : "angry") : "calm";
          return (
            <li key={name}>
              <button type="button" className="gm-seat-card" style={{ "--gc": colour }} aria-pressed={on} onClick={() => toggleParty(name)} data-mood={mood}>
                <span className="gm-seat-bubble" data-on={r ? "1" : "0"} data-ok={r?.ok ? "1" : "0"}>{r ? r.why : " "}</span>
                <Face colour={colour} mood={mood} />
                <b>{name}</b>
                <span>{n} seats</span>
                <em className="gm-needs"><i>Needs</i>{p.needs.map((k) => <span key={k} className="gm-chipicon" title={nameOf(k)}><PolicyIcon k={k} size={20} />{nameOf(k)}</span>)}</em>
                <em className="gm-nots"><i>Will not accept</i>{p.refuses.map((k) => <span key={k} className="gm-chipicon" data-no="1" title={nameOf(k)}><PolicyIcon k={k} size={20} />{nameOf(k)}</span>)}</em>
                <small>{on ? "In the government" : "Tap to invite"}</small>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="gm-deal">
        <b>The deal <small>{policies.length} of {MAX_POLICIES} policies</small></b>
        <div className="gm-policies">
          {POLICIES.map((p) => (
            <button key={p.key} type="button" className="gm-policy" aria-pressed={policies.includes(p.key)} disabled={!policies.includes(p.key) && policies.length >= MAX_POLICIES} onClick={() => togglePolicy(p.key)}>
              <PolicyIcon k={p.key} /><span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>
      <Coach mood={verdict.mood} right={won}>{verdict.text}</Coach>
      {hint && <p className="gm-help">Hint: look at the parties' red lines. Only {answer.group.join(" and ")} can work together.</p>}
      <div className="cr-row">
        <button type="button" className="btn btn-primary btn-lg" onClick={propose} disabled={!invited.length || phase === "reacting"}>Propose the deal</button>
        <button type="button" className="btn btn-secondary" onClick={() => setHint(true)} disabled={hint}>Give me a hint</button>
        <button type="button" className="btn btn-secondary" onClick={() => reset()}>Start again</button>
        {won && pi < PUZZLES.length - 1 && <button type="button" className="btn btn-primary" onClick={() => reset(pi + 1)}>Next puzzle</button>}
      </div>
      {won && <p className="gm-help">In real life, coalitions are negotiated in just this way: each party trades some of what it wants for a place in government. The parties and policies here are made up.</p>}
    </div>
  );
}
