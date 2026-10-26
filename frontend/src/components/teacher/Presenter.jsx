import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useDialog } from "../../lib/useDialog";
import { lowData } from "../../lib/lowData";
import { supabase } from "../../supabaseClient";
import { CHAPTERS, QUIZ, PARTIES, VOTE } from "../../data/teacherMode";
import { PARTY_MANIFESTOS } from "../../data/partyManifestos";
import { buildSlides } from "./slides";
import { useBeats } from "./useBeats";
import { SCENES } from "./sceneList";
import { ChapterScene, LayersScene, HousesScene, RunScene, PartyIntroScene, PartyScene, NiScene, VoiceScene, VoteScene, QuizScene } from "./Stages";
import LawScene from "./LawScene";

// The full-screen presenter. Everything on it keeps its place from slide to slide: the picture is always the same shape, the words always go in the
// same box, and the buttons never move, so clicking Next only changes what is drawn, never where anything is.

function Picture({ slide, beat, calm, label, seats, votes }) {
  const ref = useRef(null);
  useBeats(ref, beat, calm);
  let inner;
  switch (slide.kind) {
    case "chapter": inner = <ChapterScene chapter={CHAPTERS.find((c) => c.key === slide.chapter)} />; break;
    case "story": { const Scene = SCENES[slide.scene]; inner = <Scene />; break; }
    case "layers": inner = <LayersScene />; break;
    case "houses": inner = <HousesScene />; break;
    case "law": inner = <LawScene beat={beat} calm={calm} />; break;
    case "run": inner = <RunScene />; break;
    case "partyIntro": inner = <PartyIntroScene />; break;
    case "party": inner = <PartyScene party={slide.party} seats={seats[slide.party.key]} />; break;
    case "ni": inner = <NiScene />; break;
    case "voice": inner = <VoiceScene />; break;
    case "vote": inner = <VoteScene votes={votes} />; break;
    default: inner = <QuizScene beat={beat} />;
  }
  return <svg ref={ref} className="t-svg" viewBox="0 0 800 450" role="img" aria-label={label}>{inner}</svg>;
}

function Quiz({ onBeat }) {
  const [q, setQ] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const item = QUIZ[q];
  const done = q >= QUIZ.length;
  const choose = (i) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === item.answer) { setScore((s) => s + 1); onBeat(1); } else onBeat(2);
  };
  const advance = () => { setQ((n) => n + 1); setPicked(null); onBeat(q + 1 >= QUIZ.length ? 3 : 0); };
  if (done) {
    return (
      <div className="t-quiz">
        <div className="t-kicker">Quick quiz</div>
        <h2 className="t-title">You got {score} out of {QUIZ.length}</h2>
        <p className="t-text">{score === QUIZ.length ? "Brilliant. You know your way around politics." : score >= 3 ? "Well done. You know a lot already." : "A good start. Go back through the chapters and try again."}</p>
        <button type="button" className="btn btn-secondary" onClick={() => { setQ(0); setPicked(null); setScore(0); onBeat(0); }}>Try again</button>
      </div>
    );
  }
  return (
    <div className="t-quiz">
      <div className="t-kicker">Quick quiz, question {q + 1} of {QUIZ.length}</div>
      <h2 className="t-title">{item.q}</h2>
      <div className="t-options" role="group" aria-label="Answers">
        {item.options.map((o, i) => (
          <button key={o} type="button" className="t-option" data-state={picked === null ? "idle" : i === item.answer ? "right" : i === picked ? "wrong" : "idle"} onClick={() => choose(i)} disabled={picked !== null && i !== picked && i !== item.answer}>
            {o}
          </button>
        ))}
      </div>
      <p className="t-why" aria-live="polite">{picked === null ? " " : (picked === item.answer ? "Correct. " : "Not quite. ") + item.why}</p>
      {picked !== null && <button type="button" className="btn btn-primary" onClick={advance}>{q + 1 === QUIZ.length ? "See my score" : "Next question"}</button>}
    </div>
  );
}

// The class vote. The teacher taps once for each hand that goes up, and the columns in the picture grow. The words and buttons stay where they are.
function Vote({ votes, setVotes }) {
  const total = votes[0] + votes[1];
  return (
    <div className="t-votebox">
      <div className="t-kicker">{VOTE.kicker}</div>
      <p className="t-text t-vote-q">{VOTE.text}</p>
      <div className="t-votes" role="group" aria-label="Count the hands">
        {VOTE.options.map((o, i) => (
          <button key={o} type="button" className="t-option t-vote" style={{ "--oc": VOTE.colours[i] }} onClick={() => setVotes((v) => v.map((n, k) => (k === i ? n + 1 : n)))}>
            <span>{o}</span><b aria-hidden="true">+1</b>
          </button>
        ))}
        <button type="button" className="btn btn-secondary" onClick={() => setVotes([0, 0])} disabled={total === 0}>Start again</button>
      </div>
      <p className="t-why t-vote-why" aria-live="polite">{total === 0 ? " " : votes[0] === votes[1] ? VOTE.tie : VOTE.after}</p>
    </div>
  );
}

// Splits what is said into words so each can rise into place in turn. A long passage is capped so the last word never waits more than about a second.
function Words({ text }) {
  const words = text.split(" ");
  const step = Math.min(26, 900 / words.length);
  return words.map((w, i) => <span key={i}><span className="t-w" style={{ "--w": i, animationDelay: `${(i * step).toFixed(0)}ms` }}>{w}</span>{i < words.length - 1 ? " " : ""}</span>);
}

function Caption({ step }) {
  return (
    <div className="t-captionbody" key={`${step.kicker}-${step.title}-${step.text}`}>
      {step.kicker && <div className="t-kicker">{step.kicker}</div>}
      {step.title && <h2 className="t-title">{step.title}</h2>}
      {step.text && <p className="t-text" aria-label={step.text}><Words text={step.text} /></p>}
      {step.chips && <ul className="t-chips">{step.chips.map((c, i) => <li key={c} style={{ "--i": i }}>{c}</li>)}</ul>}
      {step.list && <ul className="t-list">{step.list.map((c, i) => <li key={c} style={{ "--i": i }}>{c}</li>)}</ul>}
      {step.fact && <p className="t-fact"><strong>Did you know?</strong> {step.fact}</p>}
    </div>
  );
}

// How many MPs each party has, from the same list the rest of the site uses. If it cannot be fetched the slides simply leave the number out.
function useSeats(open) {
  const [seats, setSeats] = useState({});
  useEffect(() => {
    if (!open || lowData()) return;
    let alive = true;
    supabase.from("politicians").select("party").then(({ data }) => {
      if (!alive || !data) return;
      const by = {};
      for (const r of data) if (r.party) by[r.party.toLowerCase()] = (by[r.party.toLowerCase()] ?? 0) + 1;
      const out = {};
      for (const p of PARTIES) {
        const m = PARTY_MANIFESTOS.find((x) => x.key === p.manifesto);
        const n = (m?.matchNames ?? []).reduce((t, name) => t + (by[name] ?? 0), 0);
        if (n) out[p.key] = n;
      }
      setSeats(out);
    }).catch(() => {});
    return () => { alive = false; };
  }, [open]);
  return seats;
}

export default function Presenter({ open, startAt = 0, onClose, openerRef }) {
  const calm = Boolean(useReducedMotion()) || lowData();
  const seats = useSeats(open);
  const slides = useMemo(() => buildSlides(seats), [seats]);
  const [at, setAt] = useState({ i: startAt, beat: 0 });
  const [notes, setNotes] = useState(false);
  const [full, setFull] = useState(false);
  const [quizBeat, setQuizBeat] = useState(0);
  const [votes, setVotes] = useState([0, 0]);
  const root = useRef(null);
  const nextRef = useRef(null);
  const touch = useRef(null);
  useDialog({ open, onClose, panelRef: root, returnFocusRef: openerRef, initialFocusRef: nextRef });

  const slide = slides[Math.min(at.i, slides.length - 1)];
  const last = slides.length - 1;
  const quiz = slide.kind === "quiz";
  const vote = slide.kind === "vote";
  const beat = quiz ? quizBeat : Math.min(at.beat, slide.steps.length - 1);
  const step = slide.steps[Math.min(beat, slide.steps.length - 1)];
  const chapter = CHAPTERS.find((c) => c.key === slide.chapter);
  const atEnd = at.i === last && (quiz || beat >= slide.steps.length - 1);
  const own = quiz || vote;

  const next = useCallback(() => {
    if (at.beat < slide.steps.length - 1) setAt({ i: at.i, beat: at.beat + 1 });
    else if (at.i < last) { setQuizBeat(0); setAt({ i: at.i + 1, beat: 0 }); }
  }, [at, slide, last]);
  const back = useCallback(() => {
    if (at.beat > 0) setAt({ i: at.i, beat: at.beat - 1 });
    else if (at.i > 0) { setQuizBeat(0); setAt({ i: at.i - 1, beat: slides[at.i - 1].steps.length - 1 }); }
  }, [at, slides]);
  const jump = (i) => { setQuizBeat(0); setAt({ i, beat: 0 }); };

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const typing = e.target.closest?.("button, a, input, select, textarea");
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); back(); }
      else if (e.key === "Home") { e.preventDefault(); jump(0); }
      else if (e.key === "End") { e.preventDefault(); jump(last); }
      else if (e.key === " " && !typing) { e.preventDefault(); next(); }
      else if ((e.key === "n" || e.key === "N") && !typing) setNotes((v) => !v);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, next, back, last]);

  useEffect(() => {
    const on = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);
  useEffect(() => () => { if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}); }, []);

  if (!open) return null;
  const toggleFull = () => { if (document.fullscreenElement) document.exitFullscreen?.(); else root.current?.requestFullscreen?.().catch(() => {}); };
  const onTouchEnd = (e) => {
    const t = touch.current; touch.current = null;
    if (!t) return;
    const dx = e.changedTouches[0].clientX - t.x;
    const dy = e.changedTouches[0].clientY - t.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { if (dx < 0) next(); else back(); }
  };
  const firstOf = (key) => slides.findIndex((s) => s.chapter === key);

  return (
    <div ref={root} className="t-root" role="dialog" aria-modal="true" aria-label={`Teacher mode: ${chapter.title}`} tabIndex={-1} data-calm={calm ? "1" : undefined} style={{ "--tc": chapter.colour }}>
      <header className="t-top">
        <button type="button" className="btn btn-secondary t-exit" onClick={onClose}>Exit</button>
        <nav className="t-chapters" aria-label="Chapters">
          {CHAPTERS.map((c, n) => (
            <button key={c.key} type="button" className="t-chap" aria-label={`Chapter ${n + 1}: ${c.title}`} aria-current={c.key === slide.chapter ? "step" : undefined} style={{ "--c": c.colour }} onClick={() => jump(firstOf(c.key))}>
              <span className="t-chap-n">{n + 1}</span><span className="t-chap-l">{c.short}</span>
            </button>
          ))}
        </nav>
        <div className="t-tools">
          <button type="button" className="btn btn-secondary" onClick={() => setNotes((v) => !v)} aria-pressed={notes}>Notes</button>
          <button type="button" className="btn btn-secondary t-full" onClick={toggleFull} aria-pressed={full}>{full ? "Leave full screen" : "Full screen"}</button>
        </div>
      </header>

      <main className="t-main" onTouchStart={(e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }} onTouchEnd={onTouchEnd}>
        <div className="t-stage" key={slide.id}>
          <Picture slide={slide} beat={beat} calm={calm} seats={seats} votes={votes} label={[step.title, step.text].filter(Boolean).join(". ")} />
        </div>
        <section className="t-caption" aria-live="polite" aria-label="What to say">
          {quiz ? <Quiz key={slide.id} onBeat={setQuizBeat} /> : vote ? <Vote votes={votes} setVotes={setVotes} /> : <Caption step={step} />}
        </section>
      </main>

      <footer className="t-bottom">
        <button type="button" className="btn btn-secondary btn-lg" onClick={back} disabled={at.i === 0 && beat === 0}>Back</button>
        <div className="t-progress" role="progressbar" aria-valuemin={1} aria-valuemax={slides.length} aria-valuenow={at.i + 1} aria-label={`Slide ${at.i + 1} of ${slides.length}`}>
          <span style={{ width: `${((at.i + (own ? 1 : (beat + 1) / slide.steps.length)) / slides.length) * 100}%` }} />
        </div>
        <button ref={nextRef} type="button" className="btn btn-primary btn-lg" onClick={atEnd ? onClose : next}>{atEnd ? "Finish" : "Next"}</button>
      </footer>

      {notes && (
        <aside className="t-notes" aria-label="Notes for the teacher">
          <h3>Ask the class</h3>
          {slide.ask?.length ? <ul>{slide.ask.map((a) => <li key={a}>{a}</li>)}</ul> : <p>Let the pupils discuss their answers in pairs.</p>}
          <p className="t-notes-hint">Slide {at.i + 1} of {slides.length}. Press N to hide this.</p>
        </aside>
      )}
    </div>
  );
}
