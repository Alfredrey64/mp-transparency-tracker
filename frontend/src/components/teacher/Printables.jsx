import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { COLORS, FONT_BODY, FONT_DISPLAY } from "../../theme";
import { BILL_STEPS, CHAPTERS, CHECKED, STEP_ORDER_SHUFFLE } from "../../data/teacherMode";
import { STAGE_DEFS } from "../../lib/billRoute";

// Print and take away: four sheets a teacher can print without anything else on the page. Choosing one draws it into a layer that only shows when
// printing (see .tm-sheet in teacher.css), opens the browser's print box, then removes it. Nothing is sent anywhere.

const SPLIT = (w) => { const i = w.indexOf(":"); return [w.slice(0, i).trim(), w.slice(i + 1).trim()]; };
const ALL_WORDS = CHAPTERS.flatMap((c) => c.words.map((w) => ({ chapter: c, ...Object.fromEntries([["term", SPLIT(w)[0]], ["meaning", SPLIT(w)[1]]]) })));

const SHEETS = [
  { key: "plan", title: "Lesson plan", blurb: "One page for a chapter: aims, a starter question, the timings and the key words.", colour: "#7A5AF0" },
  { key: "words", title: "Word cards", blurb: "Every key word with its meaning, to cut out and use as flash cards or a word wall.", colour: "#0E9AA7" },
  { key: "order", title: "Law in order", blurb: "Eight steps to cut out and put in order, with the answers on a separate sheet.", colour: "#1E4FB8" },
  { key: "ballot", title: "Mock vote", blurb: "Ballot papers and a tally sheet, so a class can hold its own fair vote on a choice of its own.", colour: "#E0367A" },
];

function PlanSheet({ chapter }) {
  const c = chapter;
  return (
    <div className="tm-page">
      <h1>{c.title}</h1>
      <p className="tm-meta">Teacher mode lesson plan &middot; about {c.minutes} minutes &middot; ages roughly 8 to 14</p>
      <h2>What pupils will be able to do</h2>
      <ul>{c.aims.map((a) => <li key={a}>{a}</li>)}</ul>
      <h2>How to run it</h2>
      <table>
        <tbody>
          <tr><th>Start (3 min)</th><td>Put this question to the class and take a few answers without correcting them: <em>{c.ask[0]}</em></td></tr>
          <tr><th>Watch ({Math.max(c.minutes - 7, 4)} min)</th><td>Open this chapter in Teacher mode and present it full screen. It moves one step at a time, so stop at each step and ask what they notice before you go on.</td></tr>
          <tr><th>Talk (3 min)</th><td>In pairs: <em>{c.ask[1] ?? c.ask[0]}</em></td></tr>
          <tr><th>Finish (1 min)</th><td>Each pupil writes one thing they learned and one thing they still wonder about.</td></tr>
        </tbody>
      </table>
      <h2>Key words</h2>
      <ul className="tm-sheet-words">{c.words.map((w) => { const [t, m] = SPLIT(w); return <li key={t}><b>{t}</b>: {m}</li>; })}</ul>
      <h2>Notes for the teacher</h2>
      <ul>
        <li>Nothing in Teacher mode says who to vote for. When pupils ask which party is best, turn it back to what each one promises and how they could check.</li>
        <li>This chapter fits the political system, Parliament, voting and the role of parties in Key Stage 3 Citizenship in England. Scotland, Wales and Northern Ireland have their own curricula, so match it to yours.</li>
        <li>Facts were last checked on {CHECKED}. If something looks out of date, check it on the page it comes from.</li>
      </ul>
      <p className="tm-foot">Simple Politics &middot; Teacher mode</p>
    </div>
  );
}

function WordsSheet() {
  return (
    <div className="tm-page">
      <h1>Word cards</h1>
      <p className="tm-meta">Cut along the lines. The colour shows the chapter each word comes from.</p>
      <div className="tm-cards">
        {ALL_WORDS.map((w) => (
          <div key={`${w.chapter.key}-${w.term}`} className="tm-card" style={{ "--c": w.chapter.colour }}>
            <b>{w.term}</b>
            <span>{w.meaning}</span>
          </div>
        ))}
      </div>
      <p className="tm-foot">Simple Politics &middot; Teacher mode</p>
    </div>
  );
}

function OrderSheet() {
  return (
    <>
      <div className="tm-page">
        <h1>How a bill becomes a law</h1>
        <p className="tm-meta">Cut out the cards, mix them up and put them in the right order. Then number them.</p>
        <div className="tm-cards tm-cards-one">
          {STEP_ORDER_SHUFFLE.map((i) => <div key={i} className="tm-card" style={{ "--c": "#1E4FB8" }}><span>{BILL_STEPS[i]}</span></div>)}
        </div>
        <p className="tm-foot">Simple Politics &middot; Teacher mode</p>
      </div>
      <div className="tm-page">
        <h1>Answers: how a bill becomes a law</h1>
        <p className="tm-meta">Teacher copy. A bill can start in either House, so steps 1 to 5 may happen in the Commons or the Lords first.</p>
        <ol>{BILL_STEPS.map((s) => <li key={s}>{s}</li>)}</ol>
        <p className="tm-foot">The five stages in each House are: {STAGE_DEFS.map((s) => s.label).join(", ")}.</p>
      </div>
    </>
  );
}

function BallotSheet() {
  const ballot = (n) => (
    <div key={n} className="tm-ballot">
      <h3>Class vote</h3>
      <p>The question: ______________________________________</p>
      <p className="tm-ballot-rule">Put one cross in one box only.</p>
      {[1, 2, 3].map((o) => <div key={o} className="tm-ballot-row"><span>______________________________</span><i /></div>)}
    </div>
  );
  return (
    <>
      <div className="tm-page">
        <h1>Mock vote</h1>
        <p className="tm-meta">Pick a choice that belongs to the class, such as the book to read, the trip or the class charity. Write the question and three options on the board, then pupils copy them on.</p>
        <div className="tm-ballots">{[1, 2, 3, 4, 5, 6].map(ballot)}</div>
        <p className="tm-foot">Simple Politics &middot; Teacher mode</p>
      </div>
      <div className="tm-page">
        <h1>Tally sheet</h1>
        <p className="tm-meta">Count each vote out loud while the class watches. One person reads each paper, one makes a mark, and one checks.</p>
        <table className="tm-tally">
          <thead><tr><th>Option</th><th>Tally marks</th><th>Total</th></tr></thead>
          <tbody>{[1, 2, 3].map((o) => <tr key={o}><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>)}</tbody>
        </table>
        <h2>Talk about it</h2>
        <ul>
          <li>Was it fair? Could anyone vote twice, or see how someone else voted?</li>
          <li>What if the winner got only 9 of 30 votes? Is that enough?</li>
          <li>In a real election, who counts the votes and how is it checked?</li>
        </ul>
        <p className="tm-foot">Simple Politics &middot; Teacher mode</p>
      </div>
    </>
  );
}

export default function Printables() {
  const [sheet, setSheet] = useState(null);
  const [chapterKey, setChapterKey] = useState(CHAPTERS[0].key);
  const chapter = CHAPTERS.find((c) => c.key === chapterKey);

  // Once the sheet is on the page, open the print box; when it closes, take the sheet away again.
  useEffect(() => {
    if (!sheet) return undefined;
    document.body.classList.add("tm-printing");
    const done = () => setSheet(null);
    window.addEventListener("afterprint", done);
    const id = setTimeout(() => window.print(), 80);
    return () => { clearTimeout(id); window.removeEventListener("afterprint", done); document.body.classList.remove("tm-printing"); };
  }, [sheet]);

  return (
    <section aria-labelledby="h-tm-print" style={{ marginTop: 34 }}>
      <h2 id="h-tm-print" style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, color: COLORS.ink, margin: 0 }}>Print and take away</h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.55, color: COLORS.inkSoft, margin: "6px 0 18px", maxWidth: 680 }}>
        Four sheets for the classroom. Each one prints on its own, in black and white if you like, with nothing else from the page.
      </p>
      <div className="box-row" style={{ "--n": 4, "--min": "230px", "--gap": "16px" }}>
        {SHEETS.map((s) => (
          <article key={s.key} className="tm-print-card" style={{ "--c": s.colour }}>
            <h3>{s.title}</h3>
            <p>{s.blurb}</p>
            {s.key === "plan" && (
              <label className="tm-print-pick">
                <span>Chapter</span>
                <select value={chapterKey} onChange={(e) => setChapterKey(e.target.value)}>
                  {CHAPTERS.map((c, n) => <option key={c.key} value={c.key}>{n + 1}. {c.short}</option>)}
                </select>
              </label>
            )}
            <div style={{ flex: 1 }} />
            <button type="button" className="btn btn-secondary" onClick={() => setSheet(s.key)}>Print this sheet</button>
          </article>
        ))}
      </div>
      {sheet && createPortal(
        <div className="tm-sheet" aria-hidden="true">
          {sheet === "plan" && <PlanSheet chapter={chapter} />}
          {sheet === "words" && <WordsSheet />}
          {sheet === "order" && <OrderSheet />}
          {sheet === "ballot" && <BallotSheet />}
        </div>,
        document.body,
      )}
    </section>
  );
}
