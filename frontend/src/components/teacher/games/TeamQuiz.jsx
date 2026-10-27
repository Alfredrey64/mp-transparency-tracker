/** @jsxImportSource react */
import { useEffect, useMemo, useState } from "react";
import { Coach, Confetti } from "./kit";
import { TEAM_COLOURS, QUESTION_POINTS, pickQuestions, rankTeams } from "../../../lib/teacherGames";

// Team quiz: made to be run from the front of the class. The teams are named, a question comes up with a countdown, and the first team to call out gets to
// answer: the teacher taps that team, then the answer they gave. Right earns points. A wrong answer locks that team out and the clock carries on for the rest.
const SECONDS = 20;
const LETTERS = ["A", "B", "C", "D"];
const tidy = (v, fallback) => v.replace(/\s+/g, " ").trim().slice(0, 20) || fallback;

export default function TeamQuiz() {
  const [step, setStep] = useState("setup");
  const [count, setCount] = useState(3);
  const [names, setNames] = useState(["Team 1", "Team 2", "Team 3", "Team 4"]);
  const [rounds, setRounds] = useState(10);
  const [seed, setSeed] = useState(11);
  const [scores, setScores] = useState([0, 0, 0, 0]);
  const [at, setAt] = useState(0);
  const [phase, setPhase] = useState("open");
  const [who, setWho] = useState(null);
  const [locked, setLocked] = useState([]);
  const [outcome, setOutcome] = useState(null);
  const [left, setLeft] = useState(SECONDS);
  const [chosen, setChosen] = useState([]);
  const [burst, setBurst] = useState(0);

  const questions = useMemo(() => pickQuestions(rounds, seed), [rounds, seed]);
  const q = questions[at];
  const labels = names.slice(0, count).map((n, i) => tidy(n, `Team ${i + 1}`));
  const teams = labels.map((name, i) => ({ name, i, score: scores[i], colour: TEAM_COLOURS[i] }));

  // The clock runs while the question is open and nobody is answering. It is a plain interval, so it never moves anything on the page.
  useEffect(() => {
    if (step !== "play" || phase !== "open") return undefined;
    const id = setInterval(() => setLeft((s) => Math.max(0, +(s - 0.25).toFixed(2))), 250);
    return () => clearInterval(id);
  }, [step, phase, at]);
  const timeUp = step === "play" && phase === "open" && left <= 0;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (timeUp) { setPhase("done"); setOutcome({ kind: "time" }); }
  }, [timeUp]);

  const begin = () => { setScores([0, 0, 0, 0]); setAt(0); resetQuestion(); setStep("play"); };
  function resetQuestion() { setPhase("open"); setWho(null); setLocked([]); setOutcome(null); setLeft(SECONDS); setChosen([]); }
  const buzz = (i) => { if (phase !== "open" || locked.includes(i)) return; setWho(i); setPhase("answering"); };
  const answer = (o) => {
    if (phase !== "answering") return;
    setChosen((c) => [...c, o]);
    if (o === q.answer) {
      setScores((s) => s.map((v, i) => (i === who ? v + QUESTION_POINTS : v)));
      setBurst((b) => b + 1);
      setOutcome({ kind: "right", team: who });
      setPhase("done");
    } else {
      const nowLocked = [...locked, who];
      setLocked(nowLocked);
      setWho(null);
      if (nowLocked.length >= count) { setOutcome({ kind: "none" }); setPhase("done"); } else setPhase("open");
    }
  };
  const next = () => { if (at + 1 >= questions.length) { setStep("end"); return; } setAt(at + 1); resetQuestion(); };
  const again = () => { setSeed((s) => s + 7); setStep("setup"); };

  useEffect(() => {
    if (step !== "play" || phase !== "open") return undefined;
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea, select")) return;
      const n = Number(e.key);
      if (n >= 1 && n <= count) { e.preventDefault(); buzz(n - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (step === "setup") {
    return (
      <div className="gm gm-quiz">
        <p className="gm-help">Split the class into teams. A question comes up with a countdown. The first team to call out answers, and you tap their name and the answer they give. Right is worth {QUESTION_POINTS} points, and a wrong answer lets the other teams in.</p>
        <div className="gm-setup">
          <fieldset className="gm-fieldset">
            <legend>How many teams?</legend>
            <div className="gm-scen">{[2, 3, 4].map((n) => <button key={n} type="button" aria-pressed={count === n} onClick={() => setCount(n)}>{n} teams</button>)}</div>
          </fieldset>
          <fieldset className="gm-fieldset">
            <legend>How many questions?</legend>
            <div className="gm-scen">{[5, 10, 15].map((n) => <button key={n} type="button" aria-pressed={rounds === n} onClick={() => setRounds(n)}>{n}</button>)}</div>
          </fieldset>
        </div>
        <div className="gm-teamnames">
          {names.slice(0, count).map((n, i) => (
            <label key={i} className="cr-field" style={{ "--tc": TEAM_COLOURS[i] }}>
              <span><i className="gm-dot" style={{ background: TEAM_COLOURS[i] }} />Team {i + 1} name</span>
              <input type="text" value={n} maxLength={20} onChange={(e) => setNames((x) => x.map((v, j) => (j === i ? e.target.value : v)))} />
            </label>
          ))}
        </div>
        <div className="cr-row"><button type="button" className="btn btn-primary btn-lg" onClick={begin}>Start the quiz</button></div>
      </div>
    );
  }

  if (step === "end") {
    const ranked = rankTeams(teams);
    const top = ranked.filter((t) => t.place === 1);
    return (
      <div className="gm gm-quiz">
        <div className="gm-end">
          <b>{top.length > 1 ? `A tie: ${top.map((t) => t.name).join(" and ")}` : `${top[0].name} win`}</b>
          <p>{top[0].score === 0 ? "Nobody scored, so it is time for another go." : `${top[0].score} points from ${questions.length} questions.`}</p>
        </div>
        <ol className="gm-rank">
          {ranked.map((t) => <li key={t.i} style={{ "--tc": t.colour }}><span>{t.place}</span><b>{t.name}</b><em>{t.score} points</em></li>)}
        </ol>
        <div className="cr-row">
          <button type="button" className="btn btn-primary btn-lg" onClick={() => { setSeed((s) => s + 7); begin(); }}>Play again, new questions</button>
          <button type="button" className="btn btn-secondary btn-lg" onClick={again}>Change the teams</button>
        </div>
      </div>
    );
  }

  const revealed = phase === "done";
  return (
    <div className="gm gm-quiz">
      <Confetti burst={burst} />
      <ol className="gm-board" aria-label="Scores">
        {teams.map((t) => (
          <li key={t.i} style={{ "--tc": t.colour }} data-on={who === t.i ? "1" : "0"} data-out={locked.includes(t.i) ? "1" : "0"}>
            <b>{t.name}</b>
            <span>{t.score}</span>
            <small>{locked.includes(t.i) ? "Out for this one" : who === t.i ? (phase === "done" ? "Got it right" : "Answering") : " "}</small>
          </li>
        ))}
      </ol>
      <div className="gm-time" role="timer" aria-label={`${Math.ceil(left)} seconds left`}>
        <i style={{ transform: `scaleX(${left / SECONDS})`, background: left < 6 ? "#C13A4E" : "#7A5AF0", opacity: phase === "answering" ? 0.4 : 1 }} />
        <span>{revealed ? " " : phase === "answering" ? "Clock paused" : `${Math.ceil(left)}s`}</span>
      </div>
      <div className="gm-prompt" key={q.id}>
        <small>Question {at + 1} of {questions.length}</small>
        <b>{q.q}</b>
        <span>{phase === "open" ? "Which team is answering? Tap its name, or press its number." : phase === "answering" ? `${labels[who]}: tap the answer they gave.` : " "}</span>
      </div>
      <div className="gm-buzz" role="group" aria-label="Which team is answering?">
        {teams.map((t) => (
          <button key={t.i} type="button" className="gm-buzzbtn" style={{ "--tc": t.colour }} onClick={() => buzz(t.i)} disabled={phase !== "open" || locked.includes(t.i)}>
            <kbd>{t.i + 1}</kbd>{t.name}
          </button>
        ))}
      </div>
      <div className="gm-choices gm-choices-q" role="group" aria-label="Answers">
        {q.options.map((o, i) => (
          <button key={o} type="button" className="gm-choice" style={{ "--gc": "#7A5AF0" }} onClick={() => answer(i)} disabled={phase !== "answering" || chosen.includes(i)} data-state={revealed && i === q.answer ? "right" : chosen.includes(i) ? "wrong" : "idle"}>
            <b>{LETTERS[i]}. {o}</b>
          </button>
        ))}
      </div>
      <Coach mood={outcome?.kind === "right" ? "cheer" : outcome ? "oops" : phase === "answering" ? "think" : "think"} right={outcome?.kind === "right"}>
        {outcome?.kind === "right" ? `${labels[outcome.team]} get ${QUESTION_POINTS} points. ${q.why}`
          : outcome?.kind === "time" ? `Time is up. The answer is ${q.options[q.answer]}. ${q.why}`
          : outcome?.kind === "none" ? `No team got it. The answer is ${q.options[q.answer]}. ${q.why}`
          : phase === "answering" ? "A wrong answer locks that team out and the clock carries on." : "Read the question out, and wait for a team to call."}
      </Coach>
      <div className="cr-row">
        {revealed && <button type="button" className="btn btn-primary btn-lg" onClick={next}>{at + 1 >= questions.length ? "See the scores" : "Next question"}</button>}
        {!revealed && phase === "open" && <button type="button" className="btn btn-secondary btn-lg" onClick={() => { setOutcome({ kind: "none" }); setPhase("done"); }}>Skip: show the answer</button>}
      </div>
    </div>
  );
}
