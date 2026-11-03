/** @jsxImportSource react */
import { useState } from "react";
import { AnimatePresence, m as motion } from "motion/react";
import { IconBroadcast } from "../icons";
import { useGo } from "./useGo";
import { monogram, caseSpan } from "../../lib/newsView";
import "../../story.css";

// The pictures and cards on the news regulation page (components/MediaLiteracy.jsx holds the words). Each plays once, when it scrolls into view.

function LaneFacts({ facts }) {
  return <dl className="na-facts">{facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>;
}

// The one fact the page rests on, drawn: broadcasters work under a legal duty and newspapers do not. The rings and the pages move on their own, slowly.
const LANE_FACTS = {
  broadcast: [
    ["The rule", "News must be reported with due accuracy and presented with due impartiality."],
    ["Politicians", "They should not be used as newsreaders, interviewers or reporters unless there is a good editorial reason. If they are, their party must be made clear."],
    ["\"Due\"", "It does not mean equal airtime for every view. It depends on the subject, the programme and what the audience expects."],
  ],
  print: [
    ["Not Ofcom", "Ofcom's impartiality rules cover TV, radio and on-demand services, not newspapers."],
    ["Voluntary regulation", "Most newspapers and magazines have chosen to join a press regulator and agreed to follow its Editors' Code of Practice."],
    ["Print and online", "The Code applies to a paper's website as well as the printed page."],
  ],
};

export function TwoLanes() {
  const [ref, go] = useGo(0.25);
  return (
    <figure ref={ref} className="na-lanes" data-go={go}>
      <div className="na-lane" style={{ "--tc": "#2C5F9E", "--i": 0 }}>
        <div className="na-art na-radio" aria-hidden="true"><i /><i /><i /><span><IconBroadcast size={26} /></span></div>
        <b>TV and radio news</b>
        <em>Must be impartial</em>
        <p>The BBC, ITV, Sky News, Channel 4 and GB News all follow Ofcom's Broadcasting Code. Public or private, licence fee or adverts, it makes no difference.</p>
        <LaneFacts facts={LANE_FACTS.broadcast} />
      </div>
      <div className="na-lane" style={{ "--tc": "#9A3F55", "--i": 1 }}>
        <div className="na-art na-paper" aria-hidden="true"><i /><i /><i /></div>
        <b>Newspapers and news websites</b>
        <em>Free to take a side</em>
        <p>They can back a party at an election and run an openly one-sided front page. That is why a paper's lean is well known, and a broadcaster's legally should not be.</p>
        <LaneFacts facts={LANE_FACTS.print} />
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

// How a broadcaster pays its way, in a few words: each kind of money gets its own colour.
const FUNDING_KINDS = [[/licence/i, "#2C5F9E"], [/subscription/i, "#1F7A6E"], [/advert/i, "#A9701F"], [/invest/i, "#5E4B8B"]];
const fundingColour = (text) => FUNDING_KINDS.find(([re]) => re.test(text))?.[1] ?? "#5C6B85";

// Each broadcaster as a row in a list: a badge, its name, and a short chain of who pays for it, who owns it and who regulates it, with the full detail one tap away.
export function Outlets({ outlets }) {
  const [ref, go] = useGo(0.1);
  return (
    <ul ref={ref} className="na-outlets" data-go={go}>
      {outlets.map((o, i) => {
        const [funding, owner] = o.tag.split(" · ");
        const pays = funding.split(/ and /i).map((f) => f.trim()).map((f) => f[0].toUpperCase() + f.slice(1));
        return (
          <li key={o.name} style={{ "--tc": o.color, "--i": i }}>
            <details>
              <summary>
                <span className="na-mono" aria-hidden="true">{monogram(o.name)}</span>
                <span className="na-outlet-name">{o.name}</span>
                <span className="na-flow">
                  <span className="na-step"><small>Paid for by</small><span className="na-chips">{pays.map((f) => <i key={f} style={{ "--fc": fundingColour(f) }}>{f}</i>)}</span></span>
                  <i className="na-arrow" aria-hidden="true" />
                  <span className="na-step"><small>Owned as</small><b>{owner ?? "See detail"}</b></span>
                  <i className="na-arrow" aria-hidden="true" />
                  <span className="na-step"><small>Regulated by</small><b>{/Ofcom/.test(o.regulator) ? "Ofcom" : "See detail"}</b></span>
                </span>
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

const VERDICT_ICONS = {
  Breach: <path d="M7 7l10 10M17 7L7 17" />,
  Overturned: <path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />,
  "Fell short": <path d="M5 12h14M12 5v0M12 19v0" />,
};
const VerdictIcon = ({ kind }) => <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{VERDICT_ICONS[kind] ?? VERDICT_ICONS["Fell short"]}</svg>;

// The cases on one time axis: a bar for each, from the month the programme went out to the month Ofcom ruled, so how long a ruling takes can be seen at a glance.
function CaseTimeline({ cases, verdicts }) {
  const spans = cases.map((c) => caseSpan(c.date));
  if (spans.some((s) => !s)) return null;
  const lo = Math.floor(Math.min(...spans.map((s) => s.start)) / 12) * 12;
  const hi = Math.ceil((Math.max(...spans.map((s) => s.end)) + 1) / 12) * 12;
  const at = (v) => `${((v - lo) / (hi - lo)) * 100}%`;
  const years = Array.from({ length: (hi - lo) / 12 }, (_, k) => lo / 12 + k);
  return (
    <figure className="na-tl">
      <figcaption>From the programme to the ruling</figcaption>
      <div className="na-tl-body">
        <div className="na-tl-years" aria-hidden="true">{years.map((y) => <span key={y} style={{ left: at((y * 12)) }}>{y}</span>)}</div>
        <ul>
          {cases.map((c, i) => (
            <li key={`${c.outlet}-${c.date}`} style={{ "--vc": verdicts[c.verdict].color, "--i": i, "--from": at(spans[i].start), "--w": `${((spans[i].end - spans[i].start + 1) / (hi - lo)) * 100}%` }}>
              <span className="na-tl-name"><b>{c.outlet}</b> {c.programme}</span>
              <span className="na-tl-track"><i style={{ left: at(spans[i].start), width: `${((spans[i].end - spans[i].start + 1) / (hi - lo)) * 100}%` }} /><em style={(spans[i].end + 1 - lo) / (hi - lo) > 0.74 ? { right: `calc(100% - ${at(spans[i].start)})`, marginRight: 8 } : { left: at(spans[i].end + 1) }}>{spans[i].months === 0 ? "same month" : `${spans[i].months} months`}</em></span>
            </li>
          ))}
        </ul>
      </div>
    </figure>
  );
}

// The five Ofcom cases: a count of how they came out, a timeline, then a card for each with its outcome as a coloured panel on the left.
export function Cases({ cases, verdicts }) {
  const [ref, go] = useGo(0.08);
  const counts = Object.keys(verdicts).map((k) => ({ key: k, n: cases.filter((c) => c.verdict === k).length, ...verdicts[k] })).filter((v) => v.n > 0);
  return (
    <div ref={ref} className="na-cases" data-go={go}>
      <div className="na-split" role="img" aria-label={counts.map((c) => `${c.n} ${c.label.toLowerCase()}`).join(", ")}>
        {counts.map((c) => <span key={c.key} style={{ "--vc": c.color, flexGrow: c.n }}><b>{c.n}</b>{c.label}</span>)}
      </div>
      <CaseTimeline cases={cases} verdicts={verdicts} />
      <ol className="na-case-list">
        {cases.map((c, i) => {
          const v = verdicts[c.verdict];
          const span = caseSpan(c.date);
          return (
            <li key={`${c.outlet}-${c.programme}-${c.date}`} data-verdict={c.verdict} style={{ "--vc": v.color, "--oc": c.color, "--i": i }}>
              <div className="na-case-badge"><VerdictIcon kind={c.verdict} /><b>{v.label}</b></div>
              <div className="na-case-main">
                <p className="na-case-meta"><span className="na-pill">{c.outlet}</span><span>{c.programme}</span></p>
                <h3>{c.headline}</h3>
                <p className="na-case-facts"><span>Rule tested: <b>{c.rule}</b></span><span>{c.date}</span></p>
                {span && <p className="na-took" aria-label={`Ofcom took ${span.months} months to rule`}><i style={{ "--m": Math.min(1, (span.months + 1) / 24) }} /><span>{span.months === 0 ? "Ruled in the same month" : `Ofcom took ${span.months} months to rule`}</span></p>}
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
