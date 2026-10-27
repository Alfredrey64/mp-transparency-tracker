/** @jsxImportSource react */
import { useMemo, useState } from "react";
import { JARGON_ROUNDS, meaningsOf, starsFor } from "../../../lib/teacherGamesMore";
import { Coach, Confetti, Dots, Stars } from "./kit";

// Jargon matcher: six hard words and six plain meanings, all jumbled up. Tap a word, then tap the meaning you think goes with it. A match locks both together
// in the same colour. Three rounds, with harder and harder words.
const HUES = ["#1E4FB8", "#E0367A", "#0E9AA7", "#C7871A", "#7A5AF0", "#2F9E6B"];

export default function JargonMatcher() {
  const [ri, setRi] = useState(0);
  const [term, setTerm] = useState(null);
  const [matched, setMatched] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [stars, setStars] = useState([]);
  const [wrong, setWrong] = useState(null);
  const [line, setLine] = useState(null);
  const [burst, setBurst] = useState(0);
  const round = JARGON_ROUNDS[ri];
  const meanings = useMemo(() => (round ? meaningsOf(round) : []), [round]);
  const finished = ri >= JARGON_ROUNDS.length;
  const roundDone = !finished && matched.length === round.pairs.length;

  const pickTerm = (t) => { if (matched.some((m) => m.term === t)) return; setTerm(t); setLine(null); };
  const pickMeaning = (m) => {
    if (!term || matched.some((x) => x.meaning === m.meaning)) return;
    if (m.term === term) {
      const done = [...matched, m];
      setMatched(done); setTerm(null);
      setLine({ mood: "happy", text: `${m.term}: ${m.meaning.charAt(0).toLowerCase()}${m.meaning.slice(1)}.` });
      if (done.length === round.pairs.length) { setBurst((b) => b + 1); setStars((s) => [...s, starsFor(mistakes)]); }
    } else {
      setMistakes((x) => x + 1); setWrong(m.meaning); setLine({ mood: "oops", text: "Not that one. Read the meaning again, and think about the word." });
      setTimeout(() => setWrong(null), 900);
    }
  };
  const nextRound = () => { setRi((r) => r + 1); setMatched([]); setMistakes(0); setTerm(null); setLine(null); };
  const restart = () => { setRi(0); setMatched([]); setMistakes(0); setStars([]); setTerm(null); setLine(null); };
  const hue = (t) => HUES[matched.findIndex((m) => m.term === t) % HUES.length];

  if (finished) {
    const total = stars.reduce((a, b) => a + b, 0);
    return (
      <div className="gm gm-jargon">
        <Confetti burst={burst} />
        <div className="gm-end"><Stars n={Math.round(total / stars.length)} /><b>{total} of {JARGON_ROUNDS.length * 3} stars</b><p>You matched eighteen words with their plain-English meanings. If you meet one of them again, in the news or in a lesson, you will know what it means.</p><button type="button" className="btn btn-primary btn-lg" onClick={restart}>Play again</button></div>
      </div>
    );
  }
  return (
    <div className="gm gm-jargon" style={{ "--ac": round.colour }}>
      <Confetti burst={burst} />
      <div className="gm-score"><span>Round {ri + 1} of {JARGON_ROUNDS.length}: {round.title}</span><b>{matched.length} of {round.pairs.length} matched</b></div>
      <Dots at={matched.length} total={round.pairs.length} label="Pairs matched" />
      <p className="gm-help">{term ? <>Now tap the meaning of <b>{term}</b>.</> : <>Tap a <b>word</b> on the left, then the <b>meaning</b> on the right.</>}</p>
      <div className="gm-pairs">
        <ul aria-label="Words">
          {round.pairs.map(([t]) => {
            const m = matched.some((x) => x.term === t);
            return <li key={t}><button type="button" className="gm-word" data-state={m ? "done" : term === t ? "picked" : "idle"} style={{ "--gc": m ? hue(t) : round.colour }} disabled={m} aria-pressed={term === t} onClick={() => pickTerm(t)}>{t}{m && <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10l4 4 8-9" /></svg>}</button></li>;
          })}
        </ul>
        <ul aria-label="Meanings">
          {meanings.map((m) => {
            const done = matched.find((x) => x.meaning === m.meaning);
            return <li key={m.meaning}><button type="button" className="gm-mean" data-state={done ? "done" : wrong === m.meaning ? "no" : "idle"} style={{ "--gc": done ? hue(done.term) : round.colour }} disabled={Boolean(done) || !term} onClick={() => pickMeaning(m)}>{m.meaning}</button></li>;
          })}
        </ul>
      </div>
      <Coach mood={line?.mood ?? "think"} right={line?.mood === "happy"}>{line?.text ?? "Pick a word to start."}</Coach>
      <div className="cr-row">{roundDone && <button type="button" className="btn btn-primary btn-lg" onClick={nextRound}>{ri + 1 === JARGON_ROUNDS.length ? "See how you did" : "Next round"}</button>}</div>
      {roundDone && <div className="gm-roundend"><Stars n={stars[ri] ?? 3} /><span>{mistakes === 0 ? "No slips" : `${mistakes} ${mistakes === 1 ? "slip" : "slips"}`}</span></div>}
    </div>
  );
}
