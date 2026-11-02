/** @jsxImportSource react */
import { useState } from "react";
import { AnimatePresence, m as motion } from "motion/react";
import { IconBroadcast } from "../icons";
import { useGo } from "./useGo";
import "../../story.css";

// The pictures and cards on the news regulation page (components/MediaLiteracy.jsx holds the words). Each plays once, when it scrolls into view.

// The one fact the page rests on, drawn: broadcasters work under a legal duty and newspapers do not. The rings and the pages move on their own, slowly.
export function TwoLanes() {
  const [ref, go] = useGo(0.25);
  return (
    <figure ref={ref} className="na-lanes" data-go={go}>
      <div className="na-lane" style={{ "--tc": "#2F7BD6", "--i": 0 }}>
        <div className="na-art na-radio" aria-hidden="true"><i /><i /><i /><span><IconBroadcast size={26} /></span></div>
        <b>TV and radio news</b>
        <em>Must be impartial</em>
        <p>The BBC, ITV, Sky News, Channel 4 and GB News all follow Ofcom's Broadcasting Code. Public or private, licence fee or adverts, it makes no difference.</p>
      </div>
      <div className="na-lane" style={{ "--tc": "#E2574C", "--i": 1 }}>
        <div className="na-art na-paper" aria-hidden="true"><i /><i /><i /></div>
        <b>Newspapers and news websites</b>
        <em>Free to take a side</em>
        <p>They can back a party at an election and run an openly one-sided front page. That is why a paper's lean is well known, and a broadcaster's legally should not be.</p>
      </div>
    </figure>
  );
}

// The five rules as bold coloured cards, each with its own picture and the rule's own words folded away.
export function Rules({ rules }) {
  const [ref, go] = useGo(0.1);
  return (
    <ol ref={ref} className="na-rules" data-go={go}>
      {rules.map((r, i) => {
        const Icon = r.icon;
        return (
          <li key={r.title} style={{ "--tc": r.color, "--i": i }}>
            <span className="na-n" aria-hidden="true">{i + 1}</span>
            {Icon && <span className="na-ruleico" aria-hidden="true"><Icon size={26} /></span>}
            <b>{r.title}</b>
            <p>{r.short}</p>
            <details>
              <summary>Read the rule</summary>
              <small>{r.rule}</small>
              <p>{r.body}</p>
            </details>
          </li>
        );
      })}
    </ol>
  );
}

// Eight outlets to sort, one at a time: broadcaster or newspaper.
export function Quiz({ items }) {
  const [order] = useState(() => {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  });
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const current = order[step];
  const done = step >= order.length;

  function answer(choice) {
    if (feedback) return;
    const correct = choice === current.answer;
    setFeedback(correct ? "correct" : "wrong");
    if (correct) setScore((s) => s + 1);
    setTimeout(() => { setFeedback(null); setStep((s) => s + 1); }, 900);
  }
  function restart() { setStep(0); setScore(0); setFeedback(null); }

  return (
    <div className="na-quiz">
      <ol className="na-quiz-dots" aria-label={done ? "All eight sorted" : `Question ${step + 1} of ${order.length}`}>
        {order.map((o, i) => <li key={o.name} data-state={i < step ? "done" : i === step && !done ? "now" : "todo"} />)}
      </ol>
      <div className="na-quiz-stage">
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
              <div className="na-quiz-card" data-feedback={feedback ?? undefined}>
                <span className="na-quiz-name">{current.name}</span>
                {feedback && (
                  <motion.span className="na-quiz-says" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                    {feedback === "correct" ? "Correct" : `Actually ${current.answer === "broadcast" ? "a broadcaster, legally impartial" : "a newspaper, free to editorialise"}`}
                  </motion.span>
                )}
              </div>
              <div className="na-quiz-buttons">
                <button type="button" className="na-quiz-yes" onClick={() => answer("broadcast")} disabled={Boolean(feedback)}>Broadcaster, must be impartial</button>
                <button type="button" className="na-quiz-no" onClick={() => answer("print")} disabled={Boolean(feedback)}>Newspaper, free to editorialise</button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }} className="na-quiz-done">
              <b>{score} / {order.length}</b>
              <p>
                {score === order.length
                  ? "The regulatory line tracks the medium, not the outlet's reputation: every TV and radio news service sits on one side of it, every newspaper on the other, regardless of who owns them or what they're known for."
                  : "Ownership, funding, and popular reputation don't determine which side of the line an outlet sits on: only the medium does: broadcast, or print."}
              </p>
              <button type="button" className="na-quiz-no" onClick={restart}>Try again</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Each broadcaster as a card: its name and how it is funded and owned on the front, and the detail one tap away.
export function Outlets({ outlets }) {
  const [ref, go] = useGo(0.1);
  return (
    <ul ref={ref} className="na-outlets" data-go={go}>
      {outlets.map((o, i) => {
        const [funding, owner] = o.tag.split(" · ");
        return (
          <li key={o.name} style={{ "--tc": o.color, "--i": i }}>
            <details>
              <summary>
                <span className="na-outlet-name">{o.name}</span>
                <span className="na-chips"><i>{funding}</i>{owner && <i>{owner}</i>}</span>
                <span className="na-chev" aria-hidden="true" />
              </summary>
              <dl>
                <dt>Ownership</dt><dd>{o.ownership}</dd>
                <dt>Funding</dt><dd>{o.funding}</dd>
                <dt>Regulation</dt><dd>{o.regulator}</dd>
              </dl>
            </details>
          </li>
        );
      })}
    </ul>
  );
}

// The five Ofcom cases as a plain list, one row each, with how it came out first and the detail one tap away.
export function Cases({ cases, verdicts }) {
  const [ref, go] = useGo(0.1);
  const counts = Object.keys(verdicts).map((k) => ({ key: k, n: cases.filter((c) => c.verdict === k).length, ...verdicts[k] })).filter((v) => v.n > 0);
  return (
    <div ref={ref} className="na-cases" data-go={go}>
      <ul className="na-tally">{counts.map((c) => <li key={c.key} style={{ "--vc": c.color }}><b>{c.n}</b> {c.label.toLowerCase()}</li>)}</ul>
      <ol className="na-case-list">
        {cases.map((c, i) => {
          const v = verdicts[c.verdict];
          return (
            <li key={`${c.outlet}-${c.programme}-${c.date}`} style={{ "--vc": v.color, "--i": i }}>
              <span className="na-verdict">{v.label}</span>
              <div className="na-case-main">
                <p className="na-case-meta"><b>{c.outlet}</b><span>{c.programme}</span><span>{c.date}</span></p>
                <h3>{c.headline}</h3>
                <p className="na-case-rule">Rule tested: {c.rule}</p>
                <details>
                  <summary>What happened</summary>
                  <p>{c.summary}</p>
                </details>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// A list of links to the official source, each with a line on what it is.
export function LinkList({ links }) {
  return (
    <ul className="st-sources">
      {links.map((l) => (
        <li key={l.url}><a href={l.url} target="_blank" rel="noreferrer">{l.label}<span className="sr-only"> (opens in a new tab)</span></a>{l.note && <span>{l.note}</span>}</li>
      ))}
    </ul>
  );
}
