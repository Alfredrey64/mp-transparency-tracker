import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconClassroom } from "./icons";
import { CHAPTERS, GUIDE } from "../data/teacherMode";
import { card, cardTitle } from "../lib/onsStyles";
import Presenter from "./teacher/Presenter";
import { ShopScene } from "./teacher/Scenes";
import { buildSlides } from "./teacher/slides";
import "../teacher.css";

// Teacher mode: a separate way to use the site. This page explains it and starts it; the lesson itself is the full-screen presenter.
const FIRST = Object.fromEntries(CHAPTERS.map((c) => [c.key, buildSlides().findIndex((s) => s.chapter === c.key)]));

export default function TeacherMode() {
  const [open, setOpen] = useState(false);
  const [startAt, setStartAt] = useState(0);
  const opener = useRef(null);
  const start = (i, el) => { opener.current = el; setStartAt(i); setOpen(true); };

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconClassroom}
        kicker="Teacher mode"
        title="Teacher mode"
        subtitle="Animated stories and plain explanations for a class: why politics touches everyday life, who decides what, how Parliament works, what the main parties believe and who leads them, and how young people can be heard."
      />

      <section className="tm-start" aria-labelledby="h-tm-start">
        <div>
          <h2 id="h-tm-start" style={{ ...cardTitle, fontSize: "clamp(24px, 3vw, 32px)" }}>A lesson you can present</h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 16, lineHeight: 1.6, color: COLORS.inkSoft, margin: "8px 0 0", maxWidth: 520 }}>
            It runs full screen, one step at a time, so you can pause and ask a question before the next piece of the picture appears. It takes about an hour
            in all, or use one chapter at a time. It is written for ages of roughly 8 to 14.
          </p>
          <div className="tm-actions" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 20 }}>
            <button type="button" className="btn btn-primary btn-lg" onClick={(e) => start(0, e.currentTarget)}>Start the lesson</button>
            <a className="btn btn-secondary btn-lg" href="#/parties" style={{ textDecoration: "none" }}>See the parties page</a>
          </div>
          <ul className="tm-guide">{GUIDE.map((g) => <li key={g}>{g}</li>)}</ul>
        </div>
        <div className="tm-preview" aria-hidden="true">
          <svg viewBox="0 0 800 450"><ShopScene /></svg>
        </div>
      </section>

      <section aria-labelledby="h-tm-chapters" style={{ marginTop: 34 }}>
        <h2 id="h-tm-chapters" style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, color: COLORS.ink, margin: 0 }}>The five chapters</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.55, color: COLORS.inkSoft, margin: "6px 0 18px", maxWidth: 640 }}>Start anywhere. Each chapter has a question to ask the class.</p>
        <div className="box-row" style={{ "--n": 3, "--min": "300px", "--gap": "18px" }}>
          {CHAPTERS.map((c, n) => (
            <article key={c.key} className="tm-chapter" style={{ "--c": c.colour }}>
              <div className="tm-chapter-head">
                <span className="tm-chapter-n" aria-hidden="true">{n + 1}</span>
                <h3>{c.title}</h3>
                <span className="tm-chapter-time">{c.minutes} min</span>
              </div>
              <div className="tm-chapter-body">
                <p style={{ margin: 0 }}>{c.blurb}</p>
                <h4>Pupils will</h4>
                <ul>{c.aims.map((a) => <li key={a}>{a}</li>)}</ul>
                <h4>Ask the class</h4>
                <ul>{c.ask.map((a) => <li key={a}>{a}</li>)}</ul>
                <div style={{ flex: 1 }} />
                <button type="button" className="btn btn-secondary" onClick={(e) => start(FIRST[c.key], e.currentTarget)}>Start this chapter</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="h-tm-fair" style={{ ...card, marginTop: 34 }}>
        <h2 id="h-tm-fair" style={cardTitle}>Fair to every party</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 15.5, lineHeight: 1.65, color: COLORS.inkSoft, margin: "8px 0 0", maxWidth: 760 }}>
          Nothing in Teacher mode tells a child who to vote for. In the stories, people weigh up ideas, and the ideas are described, not ranked. On the party
          slides each party gets the same space: who leads it, what it tends to believe, and what it promised at the 2024 election, taken from the summaries on
          the <a href="#/parties" style={{ color: COLORS.ink, fontWeight: 700 }}>party promises page</a>. Where a number or a leader can change, the slide says when it was last
          checked. If you spot anything that looks wrong, please tell us.
        </p>
      </section>

      {open && createPortal(<Presenter open startAt={startAt} onClose={() => setOpen(false)} openerRef={opener} />, document.body)}
    </div>
  );
}
