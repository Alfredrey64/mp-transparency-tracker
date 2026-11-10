/** @jsxImportSource react */
import { useCallback, useEffect, useRef, useState } from "react";
import { m as motion, AnimatePresence } from "motion/react";
import { QUESTIONS, walk } from "../../lib/guideFlow";
import { glide } from "../../lib/scrollBehavior";
import { IconCouncil, IconHeartbeat, IconSearch, IconQuestion, IconPin, IconHouse, IconDoor, IconRoute, IconCalendar, IconShield } from "../icons";
import { IconDepartments, IconPolice } from "../newIcons";
import "../../guidefinder.css";

// "Who do I contact?": a few questions, one at a time, then the route for that problem with the reader's place on it marked. The questions and answers are in lib/guideFlow.js and are
// the page's own chapters, so this is a way into the text below, not a replacement for it.
const ICONS = { council: IconCouncil, nhs: IconHeartbeat, dept: IconDepartments, police: IconPolice, foi: IconSearch, unsure: IconQuestion, pin: IconPin, house: IconHouse, start: IconDoor, step: IconRoute, wait: IconCalendar, alert: IconShield };

function Route({ steps, here, colour }) {
  return (
    <ol className="gf-route" style={{ "--gc": colour }}>
      {steps.map((s, i) => {
        const state = here == null ? "todo" : i < here ? "done" : i === here ? "now" : "todo";
        return (
          <li key={s.title} className="gf-step" data-state={state} style={{ "--i": i }}>
            <span className="gf-node" aria-hidden="true">{state === "done" ? "✓" : i + 1}</span>
            <div className="gf-step-body">
              {state === "now" && <span className="gf-here">You are here. Do this next</span>}
              {state === "done" && <span className="sr-only">Done. </span>}
              <b>{s.title}</b>
              <p>{s.text}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Answer({ answer, here, onAgain }) {
  const jump = () => document.getElementById(`st-h-${answer.chapter}`)?.scrollIntoView({ behavior: glide(), block: "start" });
  return (
    <div className="gf-answer" style={{ "--gc": answer.colour }}>
      <p className="gf-lead">{answer.lead}</p>
      {answer.callout && <p className="gf-callout">{answer.callout}</p>}
      {answer.steps && <Route steps={answer.steps} here={here} colour={answer.colour} />}
      {answer.points && <ul className="gf-points">{answer.points.map((p, i) => <li key={i} style={{ "--i": i }}>{p}</li>)}</ul>}
      {answer.facts && (
        <dl className="gf-facts">
          {answer.facts.map((f) => (
            <div key={f.label}><dt>{f.label}</dt><dd><b>{f.value}</b><span>{f.note}</span></dd></div>
          ))}
        </dl>
      )}
      {answer.note && <p className="gf-note">{answer.note}</p>}
      <div className="gf-actions">
        <button type="button" className="gf-primary" onClick={jump}>Read the full guide for this</button>
        {answer.links?.map((l) => <a key={l.href} href={l.href} {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})}>{l.label}{l.external && <span className="sr-only"> (opens in a new tab)</span>}</a>)}
        <button type="button" onClick={onAgain}>Start again</button>
      </div>
    </div>
  );
}

export default function GuideFinder() {
  const [picks, setPicks] = useState([]);
  const [dir, setDir] = useState(1);
  const ready = useRef(false);
  useEffect(() => { ready.current = true; }, []);
  // Each new question or answer takes the reader's place as it arrives, so a screen reader announces it and a keyboard user is not left on a button that has gone. (Not on first load.)
  const heading = useCallback((node) => { if (node && ready.current) node.focus({ preventScroll: true }); }, []);
  const { node, answer, here, trail } = walk(picks);
  const question = node ? QUESTIONS[node] : null;
  const colour = answer?.colour;

  const choose = (i) => { setDir(1); setPicks([...picks, i]); };
  const back = (to) => { setDir(-1); setPicks(picks.slice(0, to)); };
  const key = `${picks.join("-")}`;

  return (
    <section className="gf" aria-labelledby="gf-title" style={colour ? { "--gc": colour } : undefined}>
      <div className="gf-top">
        <span className="gf-badge" aria-hidden="true"><IconRoute size={22} /></span>
        <div>
          <h2 id="gf-title">Who should I contact?</h2>
          <p>Answer a few questions and get the exact next step, with the time limit that applies.</p>
        </div>
      </div>

      {trail.length > 0 && (
        <ol className="gf-trail" aria-label="Your answers so far">
          <li><button type="button" onClick={() => back(0)}>Start</button></li>
          {trail.map((t, i) => (
            <li key={t.id}><button type="button" onClick={() => back(i)} aria-label={`${t.q} ${t.option.label}. Change this answer.`}><span aria-hidden="true">{t.option.label}</span></button></li>
          ))}
        </ol>
      )}

      <div className="gf-stage" aria-live="polite">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={key}
            custom={dir}
            variants={{ in: (d) => ({ opacity: 0, x: 36 * d }), show: { opacity: 1, x: 0 }, out: (d) => ({ opacity: 0, x: -36 * d }) }}
            initial="in" animate="show" exit="out" transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            {question ? (
              <>
                <h3 ref={heading} tabIndex={-1} className="gf-q">{question.q}</h3>
                {question.hint && <p className="gf-hint">{question.hint}</p>}
                <ul className="gf-options" data-n={question.options.length}>
                  {question.options.map((o, i) => {
                    const Icon = ICONS[o.icon] ?? IconRoute;
                    return (
                      <li key={o.label} style={{ "--i": i }}>
                        <button type="button" onClick={() => choose(i)}>
                          <span className="gf-ico" aria-hidden="true"><Icon size={24} /></span>
                          <span className="gf-opt"><b>{o.label}</b>{o.hint && <small>{o.hint}</small>}</span>
                          <span className="gf-arrow" aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <>
                <h3 ref={heading} tabIndex={-1} className="gf-q gf-q-answer">{answer.title}</h3>
                <Answer answer={answer} here={here} onAgain={() => back(0)} />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      {picks.length > 0 && question && <button type="button" className="gf-back" onClick={() => back(picks.length - 1)}>Back</button>}
    </section>
  );
}
