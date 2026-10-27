/** @jsxImportSource react */
import { useState } from "react";
import { SPIN_ROUNDS, TRACE, TOOLKIT, PAPER, trickOptions, questionOptions, barHeights, allClaims } from "../../../lib/teacherGamesSpin";
import { starsFor } from "../../../lib/teacherGamesMore";
import { Coach, Confetti, Dots, Stars } from "./kit";

// Spot the spin: nine made-up claims from an invented paper in an invented town, in three rounds. For each one the class names the trick, then picks the question
// a careful reader would ask, and the picture flips to the fair version. A last layer asks where a number really came from. Nothing real is named, and nothing a
// pupil does is saved or sent anywhere.
const INK = "#1B2438";
const BLUE = "#1E4FB8";
const ORANGE = "#E8741A";
const GREEN = "#1FA97C";
const RED = "#C13A4E";
const f = (n) => n.toLocaleString("en-GB");
const LETTERS = ["A", "B", "C", "D"];

function Person({ x, y, fill }) {
  return <g transform={`translate(${x} ${y})`}><circle cx="0" cy="-10" r="6.5" fill={fill} /><path d="M-10 9 a10 12 0 0 1 20 0z" fill={fill} /></g>;
}
function Crowd({ n, fill, label }) {
  return (
    <svg viewBox={`0 0 ${n * 24 + 8} 34`} width={n * 24 + 8} height="34" role="img" aria-label={label}>
      {Array.from({ length: n }, (_, i) => <Person key={i} x={16 + i * 24} y={22} fill={fill} />)}
    </svg>
  );
}

// The headline, with any shouting words picked out in red once the loud-words trick is the one being looked at.
function Headline({ c }) {
  const loud = c.seen.loud;
  if (!loud) return <h3 className="sp-head">{c.headline}</h3>;
  const parts = c.headline.split(new RegExp(`(${loud.join("|")})`));
  return <h3 className="sp-head">{parts.map((p, i) => (loud.includes(p) ? <mark key={i}>{p}</mark> : p))}</h3>;
}

function Bars({ values, labels, min, colours, note, title }) {
  const hs = barHeights(values, min);
  return (
    <svg viewBox="0 0 320 170" role="img" aria-label={note}>
      {title && <text x="180" y="10" textAnchor="middle" fontSize="11" fontWeight="700" fill="#5B6784" fontFamily="Public Sans, system-ui, sans-serif">{title}</text>}
      <line x1="54" y1="140" x2="304" y2="140" stroke="#B8C3D9" strokeWidth="2" />
      {values.map((v, i) => {
        const x = 70 + i * 120;
        return (
          <g key={labels[i]}>
            <rect x={x} y="30" width="70" height="110" rx="8" fill={colours[i]} className="sp-bar" style={{ transform: `scaleY(${hs[i]})` }} />
            <text x={x + 35} y="22" textAnchor="middle" fontSize="13" fontWeight="800" fill={INK} fontFamily="Public Sans, system-ui, sans-serif">{f(v)}</text>
            <text x={x + 35} y="158" textAnchor="middle" fontSize="12" fontWeight="700" fill="#5B6784" fontFamily="Public Sans, system-ui, sans-serif">{labels[i]}</text>
          </g>
        );
      })}
      <text x="48" y="144" textAnchor="end" fontSize="11" fontWeight="700" fill="#5B6784" fontFamily="Public Sans, system-ui, sans-serif">{f(min)}</text>
    </svg>
  );
}

// The picture for a claim. `fair` is false until the question step is answered, and then the picture shows what was hidden.
function Picture({ c, fair }) {
  const { kind, seen } = c;
  if (kind === "axis") {
    const min = fair ? c.fair.min : seen.min;
    return <Bars values={seen.bars.map((b) => b[1])} labels={seen.bars.map((b) => b[0])} min={min} colours={[BLUE, ORANGE]} note={`Two bars for ${seen.bars.map((b) => `${b[0].toLowerCase()}, ${f(b[1])}`).join(" and ")}. The bottom of the chart is ${f(min)}.`} />;
  }
  if (kind === "rate") {
    const values = fair ? c.fair.per : seen.bars.map((b) => b[1]);
    return <Bars values={values} labels={seen.bars.map((b) => b[0])} min={0} colours={[BLUE, RED]} title={fair ? "Crashes for every 1,000 cars" : "Crashes"} note={`${fair ? "Crashes for every 1,000 cars" : "Crashes"}: ${seen.bars.map((b, i) => `${b[0].toLowerCase()}, ${values[i]}`).join(" and ")}.`} />;
  }
  if (kind === "small") return <div className="sp-big" aria-label="Up 50 per cent">{seen.big}</div>;
  if (kind === "quote") {
    return <blockquote className="sp-quote"><p>&ldquo;{seen.said}{fair ? <span className="sp-rest">{c.fair.rest}</span> : null}&rdquo;</p></blockquote>;
  }
  if (kind === "cause") {
    return (
      <svg viewBox="0 0 320 170" role="img" aria-label={`Two lines that both rise through the summer: ${seen.a} and ${seen.b}.${fair ? ` A sun above them: ${c.fair.hidden}.` : ""}`}>
        <line x1="30" y1="146" x2="304" y2="146" stroke="#B8C3D9" strokeWidth="2" />
        <polyline points="40,130 90,118 140,98 190,78 240,56 290,40" fill="none" stroke={ORANGE} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="40,138 90,128 140,112 190,92 240,72 290,58" fill="none" stroke={BLUE} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <text x="46" y="26" fontSize="12" fontWeight="800" fill={ORANGE} fontFamily="Public Sans, system-ui, sans-serif">{seen.a}</text>
        <text x="46" y="42" fontSize="12" fontWeight="800" fill={BLUE} fontFamily="Public Sans, system-ui, sans-serif">{seen.b}</text>
        {fair && (
          <g className="sp-in">
            <circle cx="262" cy="22" r="11" fill="#F2B632" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <line key={a} x1={262 + Math.cos((a * Math.PI) / 180) * 15} y1={22 + Math.sin((a * Math.PI) / 180) * 15} x2={262 + Math.cos((a * Math.PI) / 180) * 20} y2={22 + Math.sin((a * Math.PI) / 180) * 20} stroke="#F2B632" strokeWidth="3" strokeLinecap="round" />)}
            <path d="M254 38 V52 M254 52 l-3.5 -5 M254 52 l3.5 -5 M272 38 V70 M272 70 l-3.5 -5 M272 70 l3.5 -5" stroke="#C7871A" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
        )}
      </svg>
    );
  }
  if (kind === "sample") {
    return (
      <svg viewBox="0 0 320 90" role="img" aria-label={`Ten people. ${seen.yes} of them said yes and ${seen.of - seen.yes} did not.${fair ? ` ${c.fair.who}` : ""}`}>
        {Array.from({ length: seen.of }, (_, i) => <Person key={i} x={22 + i * 30} y={52} fill={i < seen.yes ? GREEN : "#B8C3D9"} />)}
        {fair && <rect x="4" y="22" width="312" height="52" rx="14" fill="none" stroke={RED} strokeWidth="2.5" strokeDasharray="6 5" className="sp-in" />}
        <text x="160" y="86" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={INK} fontFamily="Public Sans, system-ui, sans-serif">{seen.yes} out of {seen.of} said yes</text>
      </svg>
    );
  }
  if (kind === "old") {
    return (
      <div className="sp-old">
        <div><b>{seen.fig}</b><span>{seen.label}</span></div>
        {fair && <div className="sp-stamp sp-in" role="img" aria-label={`Stamped: counted in ${c.fair.counted}`}>Counted in {c.fair.counted}</div>}
      </div>
    );
  }
  if (kind === "source") {
    return (
      <svg viewBox="0 0 320 130" role="img" aria-label={`A shadowy figure with a speech bubble that says ${seen.says}.`}>
        <circle cx="70" cy="62" r="24" fill="#B8C3D9" /><path d="M24 128 a46 50 0 0 1 92 0z" fill="#B8C3D9" />
        <text x="70" y="70" textAnchor="middle" fontSize="26" fontWeight="800" fill="#fff" fontFamily="Public Sans, system-ui, sans-serif">?</text>
        <path d="M130 26 h170 a10 10 0 0 1 10 10 v40 a10 10 0 0 1 -10 10 h-150 l-22 16 l4 -16 h-2 a10 10 0 0 1 -10 -10 v-40 a10 10 0 0 1 10 -10z" fill="#fff" stroke="#B8C3D9" strokeWidth="2.5" />
        <text x="215" y="62" textAnchor="middle" fontSize="19" fontWeight="800" fill={INK} fontFamily="Newsreader, Georgia, serif">{seen.says}&hellip;</text>
      </svg>
    );
  }
  return null; // "loaded" has no picture of its own: the red words in the headline are the picture.
}

// One line on what was hidden, shown once the picture has flipped. Each is a function, so only the one for this claim's kind is ever worked out.
const HIDDEN = {
  axis: (c) => `The bars really start at ${f(c.fair.min)}, not ${f(c.seen.min)}.`,
  small: (c) => `${c.fair.before} members became ${c.fair.after} members.`,
  quote: () => "The rest of the sentence was left out.",
  cause: (c) => `The hidden link: ${c.fair.hidden}.`,
  sample: (c) => c.fair.who,
  old: (c) => `This was counted in ${c.fair.counted}.`,
  loaded: (c) => c.fair.plain,
  rate: (c) => `Cars on the road: ${f(c.fair.cars[0])}, then ${f(c.fair.cars[1])}. Crashes for every 1,000 cars: ${c.fair.per[0]}, then ${c.fair.per[1]}.`,
  source: (c) => c.fair.missing,
};
const hidden = (c) => HIDDEN[c.kind](c);

function Claim({ c, fair }) {
  return (
    <figure className="sp-card" data-kind={c.kind} data-fair={fair ? "1" : "0"}>
      <div className="sp-top"><span className="sp-ribbon">Made-up example</span><span className="sp-paper">{PAPER}</span></div>
      <Headline c={c} />
      <div className="sp-pic">
        <Picture c={c} fair={fair} />
        {c.kind === "small" && fair && <div className="sp-crowds sp-in"><Crowd n={c.fair.before} fill={BLUE} label={`${c.fair.before} members before`} /><span aria-hidden="true">&rarr;</span><Crowd n={c.fair.after} fill={ORANGE} label={`${c.fair.after} members after`} /></div>}
      </div>
      {/* Before the answer the words are laid out but invisible and hidden from screen readers, so the card keeps its exact size when they appear. */}
      <figcaption className="sp-fair" data-on={fair ? "1" : "0"} aria-hidden={fair ? undefined : "true"} aria-live="polite"><span className={fair ? "sp-in" : undefined}><b>What was hidden: </b>{hidden(c)}</span></figcaption>
    </figure>
  );
}

const PLAY = "play";
const TITLES = SPIN_ROUNDS.map((r) => r.title);
const CLAIMS = allClaims();

export default function SpotTheSpin() {
  const [ri, setRi] = useState(0);
  const [at, setAt] = useState(0);
  const [step, setStep] = useState("trick");
  const [phase, setPhase] = useState(PLAY);
  const [chosen, setChosen] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [stars, setStars] = useState([]);
  const [line, setLine] = useState(null);
  const [burst, setBurst] = useState(0);
  const [ti, setTi] = useState(0);
  const [traceDone, setTraceDone] = useState(false);

  const round = SPIN_ROUNDS[ri];
  const claim = round?.claims[at];
  const n = ri * 3 + at;
  const total = CLAIMS.length;
  const tricks = claim ? trickOptions(claim) : [];
  const questions = claim ? questionOptions(claim, n) : [];
  const sum = stars.reduce((a, b) => a + b, 0);

  const wrong = (text, id) => { setMistakes((m) => m + 1); setChosen((c) => [...c, id]); setLine({ mood: "oops", text }); };
  const pickTrick = (key) => {
    if (step !== "trick" || chosen.includes(key)) return;
    if (key === claim.trick) { setChosen([]); setStep("ask"); setLine({ mood: "happy", text: "Yes, that is the trick. Now: what would you ask to get to the truth?" }); }
    else wrong("Not that one. Look at the picture and the headline again, and see which trick fits.", key);
  };
  const pickQuestion = (q, i) => {
    if (step !== "ask" || chosen.includes(i)) return;
    if (q.best) { setChosen([]); setStep("reveal"); setLine({ mood: "cheer", text: claim.reveal }); setBurst((b) => b + 1); }
    else wrong("You could ask that, but it will not help you check the claim. Try a question that goes to the heart of it.", i);
  };
  const next = () => {
    if (at + 1 < round.claims.length) { setAt(at + 1); setStep("trick"); setChosen([]); setLine(null); return; }
    setStars((s) => [...s, starsFor(mistakes)]);
    setPhase("roundEnd"); setBurst((b) => b + 1); setLine(null);
  };
  const nextRound = () => {
    if (ri + 1 < SPIN_ROUNDS.length) { setRi(ri + 1); setAt(0); setStep("trick"); setMistakes(0); setChosen([]); setPhase(PLAY); setLine(null); }
    else { setMistakes(0); setChosen([]); setTi(0); setTraceDone(false); setPhase("trace"); setLine(null); }
  };
  const pickSource = (i) => {
    if (traceDone || chosen.includes(i)) return;
    if (i === TRACE[ti].answer) { setChosen([]); setTraceDone(true); setLine({ mood: "cheer", text: TRACE[ti].why }); setBurst((b) => b + 1); }
    else wrong("Not that one. Which of these is closest to the people who actually counted?", i);
  };
  const nextTrace = () => {
    if (ti + 1 < TRACE.length) { setTi(ti + 1); setTraceDone(false); setChosen([]); setLine(null); return; }
    setStars((s) => [...s, starsFor(mistakes)]); setPhase("end"); setBurst((b) => b + 1); setLine(null);
  };
  const restart = () => { setRi(0); setAt(0); setStep("trick"); setPhase(PLAY); setChosen([]); setMistakes(0); setStars([]); setLine(null); setTi(0); setTraceDone(false); };

  return (
    <div className="gm gm-spin">
      <Confetti burst={burst} />

      {phase === PLAY && (
        <>
          <div className="gm-score"><span>Round {ri + 1} of {SPIN_ROUNDS.length}: {TITLES[ri]}</span><b>{sum} {sum === 1 ? "star" : "stars"} so far</b></div>
          <Dots at={at + (step === "reveal" ? 1 : 0)} total={round.claims.length} label="Claims in this round" />
          <Claim key={claim.id} c={claim} fair={step === "reveal"} />
          {step === "trick" && (
            <>
              <div className="gm-prompt" key={`${claim.id}-t`}><small>Claim {n + 1} of {total}. Step 1 of 2</small><b>What is the trick?</b><span>Pick the one that fits this claim best.</span></div>
              <div className="gm-choices gm-choices-q" role="group" aria-label="What is the trick?">
                {tricks.map((t, i) => (
                  <button key={t.key} type="button" className="gm-choice" style={{ "--gc": BLUE }} data-state={chosen.includes(t.key) ? "wrong" : "idle"} disabled={chosen.includes(t.key)} onClick={() => pickTrick(t.key)}>
                    <b><span className="sp-letter" aria-hidden="true">{LETTERS[i]}</span>{t.text}</b>
                  </button>
                ))}
              </div>
            </>
          )}
          {step === "ask" && (
            <>
              <div className="gm-prompt" key={`${claim.id}-a`}><small>Claim {n + 1} of {total}. Step 2 of 2</small><b>What would you ask?</b><span>The best question helps you check the claim.</span></div>
              <div className="gm-choices gm-choices-q" role="group" aria-label="What would you ask?">
                {questions.map((q, i) => (
                  <button key={q.text} type="button" className="gm-choice" style={{ "--gc": ORANGE }} data-state={chosen.includes(i) ? "wrong" : "idle"} disabled={chosen.includes(i)} onClick={() => pickQuestion(q, i)}>
                    <b>{q.text}</b>
                  </button>
                ))}
              </div>
            </>
          )}
          <Coach mood={line?.mood ?? "think"} right={line?.mood === "happy" || line?.mood === "cheer"}>{line?.text ?? (step === "trick" ? "Read the headline and look at the picture. Something is not quite fair about how it is shown." : "")}</Coach>
          <div className="cr-row">{step === "reveal" && <button type="button" className="btn btn-primary btn-lg" onClick={next}>{at + 1 === round.claims.length ? "Finish the round" : "Next claim"}</button>}</div>
        </>
      )}

      {phase === "roundEnd" && (
        <div className="gm-end">
          <Stars n={stars[ri]} />
          <b>Round {ri + 1} done: {TITLES[ri]}</b>
          <p>{stars[ri] === 3 ? "No wrong answers. " : ""}{ri + 1 < SPIN_ROUNDS.length ? `${SPIN_ROUNDS[ri + 1].title} comes next: ${SPIN_ROUNDS[ri + 1].blurb.toLowerCase()}` : "One last layer: where did the number really come from?"}</p>
          <button type="button" className="btn btn-primary btn-lg" onClick={nextRound}>{ri + 1 < SPIN_ROUNDS.length ? `Start round ${ri + 2}` : "Trace the source"}</button>
        </div>
      )}

      {phase === "trace" && (
        <>
          <div className="gm-score"><span>Last layer: trace the source</span><b>{sum} {sum === 1 ? "star" : "stars"} so far</b></div>
          <Dots at={ti + (traceDone ? 1 : 0)} total={TRACE.length} label="Source puzzles" />
          <div className="gm-prompt" key={TRACE[ti].id}><small>Puzzle {ti + 1} of {TRACE.length}</small><b>{TRACE[ti].q}</b><span>Pick the best one.</span></div>
          <div className="gm-choices gm-choices-q" role="group" aria-label="Where did it come from?">
            {TRACE[ti].options.map((o, i) => (
              <button key={o} type="button" className="gm-choice" style={{ "--gc": GREEN }} data-state={traceDone && i === TRACE[ti].answer ? "right" : chosen.includes(i) ? "wrong" : "idle"} disabled={traceDone || chosen.includes(i)} onClick={() => pickSource(i)}>
                <b><span className="sp-letter" aria-hidden="true">{LETTERS[i]}</span>{o}</b>
              </button>
            ))}
          </div>
          <Coach mood={line?.mood ?? "think"} right={line?.mood === "cheer"}>{line?.text ?? "Think about who counted, and whether you could check it yourself."}</Coach>
          <div className="cr-row">{traceDone && <button type="button" className="btn btn-primary btn-lg" onClick={nextTrace}>{ti + 1 === TRACE.length ? "See how you did" : "Next puzzle"}</button>}</div>
        </>
      )}

      {phase === "end" && (
        <div className="gm-end">
          <Stars n={Math.round(sum / stars.length)} />
          <b>{sum} of {stars.length * 3} stars. You are a spin spotter.</b>
          <p>Four questions to carry away, for anything you read or share:</p>
          <ol className="sp-kit">
            {TOOLKIT.map(([q, a]) => <li key={q}><b>{q}</b><span>{a}</span></li>)}
          </ol>
          <button type="button" className="btn btn-primary btn-lg" onClick={restart}>Play again</button>
        </div>
      )}
    </div>
  );
}
