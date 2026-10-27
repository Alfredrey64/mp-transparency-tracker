/** @jsxImportSource react */
import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { createPortal } from "react-dom";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { PageToggles } from "./insight";
import { IconClassroom } from "./icons";
import { CHAPTERS, GUIDE } from "../data/teacherMode";
import { card, cardTitle } from "../lib/onsStyles";
import Presenter from "./teacher/Presenter";
import Printables from "./teacher/Printables";
import Activities from "./teacher/Activities";
import ShareLesson from "./teacher/ShareLesson";
import CurriculumMap from "./teacher/CurriculumMap";
import NameThem from "./teacher/NameThem";
import { NamesContext, cleanNames, loadNames, saveNames } from "./teacher/characters";
import { ShopScene } from "./teacher/Scenes";
import { useBeats } from "./teacher/useBeats";
import { loadGsap } from "../lib/gsapLoader";
import { lowData } from "../lib/lowData";
import { buildSlides } from "./teacher/slides";
import "../teacher.css";

// Teacher mode: a separate way to use the site. This page explains it and starts it; the lesson itself is the full-screen presenter.
const FIRST = Object.fromEntries(CHAPTERS.map((c) => [c.key, buildSlides().findIndex((s) => s.chapter === c.key)]));

// The picture on the front of the page plays the first story on a loop, a step every couple of seconds, while it is on screen. With less motion
// asked for it just shows the finished picture.
function Preview({ calm, names }) {
  const ref = useRef(null);
  const [beat, setBeat] = useState(calm ? 5 : 0);
  const [seen, setSeen] = useState(false);
  useBeats(ref, calm ? 5 : beat, calm);
  useEffect(() => {
    const el = ref.current;
    if (!el || calm || !("IntersectionObserver" in window)) return undefined;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, [calm]);
  useEffect(() => {
    if (calm || !seen) return undefined;
    const id = setInterval(() => { if (!document.hidden) setBeat((b) => (b + 1) % 6); }, 2300);
    return () => clearInterval(id);
  }, [calm, seen]);
  return <svg ref={ref} viewBox="0 0 800 450"><NamesContext.Provider value={names}><ShopScene /></NamesContext.Provider></svg>;
}

// Five stops along a line: the line fills in as the page scrolls into view, and each stop starts its chapter.
function Route({ calm, onStart }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (calm) { el.style.setProperty("--p", "1"); return undefined; }
    let ctx;
    let alive = true;
    loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (!alive) return;
      ctx = gsap.context(() => {
        const nodes = el.querySelectorAll(".tm-route-n");
        gsap.set(nodes, { scale: 0.4, autoAlpha: 0 });
        const t = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 85%", once: true } });
        t.to(el, { "--p": 1, duration: 1.6, ease: "power2.inOut" }, 0);
        t.to(nodes, { scale: 1, autoAlpha: 1, duration: 0.5, ease: "back.out(2.4)", stagger: 0.32 }, 0.1);
      }, el);
      ScrollTrigger.refresh();
    }).catch(() => { el.style.setProperty("--p", "1"); });
    return () => { alive = false; ctx?.revert(); };
  }, [calm]);
  return (
    <ol className="tm-route" ref={ref} aria-label="The five chapters in order">
      {CHAPTERS.map((c, n) => (
        <li key={c.key} style={{ "--c": c.colour }}>
          <button type="button" onClick={(e) => onStart(FIRST[c.key], e.currentTarget)} aria-label={`Start chapter ${n + 1}: ${c.title}`}>
            <span className="tm-route-n">{n + 1}</span>
            <b>{c.short}</b>
            <small>{c.minutes} min</small>
          </button>
        </li>
      ))}
    </ol>
  );
}

const TABS = [
  { key: "lessons", label: "The lesson", blurb: "The five animated chapters to present, with the names for the stories.", colour: "#C7871A" },
  { key: "activities", label: "Activities and games", blurb: "Games and class activities that teach one idea each: who decides, how a law is made, how a majority is built and who is who.", colour: "#2F9E6B" },
  { key: "info", label: "For the teacher", blurb: "Printable sheets, a link and code to share, how it fits the curriculum, and our promise to be fair to every party.", colour: "#1E4FB8" },
];
const KEYS = new Set(TABS.map((t) => t.key));
const parseTab = (param) => { const first = String(param ?? "").split("/")[0]; return KEYS.has(first) ? first : "lessons"; };

export default function TeacherMode({ param = null }) {
  const [tab, setTab] = useState(() => parseTab(param));
  const [seenParam, setSeenParam] = useState(param);
  if (param !== seenParam) { setSeenParam(param); setTab(parseTab(param)); }
  const toggles = useRef(null);
  function go(next) {
    const moved = next !== tab;
    setTab(next);
    window.history.replaceState(null, "", next === "lessons" ? "#/teacher" : `#/teacher/${next}`);
    if (moved && toggles.current && toggles.current.getBoundingClientRect().top < 0) toggles.current.scrollIntoView({ block: "start" });
  }
  const calm = Boolean(useReducedMotion()) || lowData();
  // An address such as /teacher/parliament opens that chapter straight away, for a pupil who was sent the link or scanned the code.
  const linked = param && FIRST[param] >= 0 ? FIRST[param] : null;
  const [open, setOpen] = useState(linked !== null);
  const [startAt, setStartAt] = useState(linked ?? 0);
  const [names, setNames] = useState(loadNames);
  const setAndSave = (n) => { setNames(n); saveNames(cleanNames(n)); };
  // What the lesson uses is always tidy, even while a name is half typed.
  const tidyNames = useMemo(() => cleanNames(names), [names]);
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

      <div ref={toggles} style={{ scrollMarginTop: 12 }}>
        <PageToggles tabs={TABS} current={tab} onPick={go} label="Teacher mode sections" idPrefix="tm" />
      </div>
      <div key={tab} className="ge-fade" role="tabpanel" id="tm-panel" aria-labelledby={`tm-tab-${tab}`}>
        {tab === "lessons" && (
          <>
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
          <Preview calm={calm} names={tidyNames} />
        </div>
      </section>

      <NameThem names={names} onChange={setAndSave} />

      <section aria-labelledby="h-tm-chapters" style={{ marginTop: 34 }}>
        <h2 id="h-tm-chapters" style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, color: COLORS.ink, margin: 0 }}>The five chapters</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.55, color: COLORS.inkSoft, margin: "6px 0 18px", maxWidth: 640 }}>Start anywhere. Each chapter has a question to ask the class.</p>
        <Route calm={calm} onStart={start} />
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
          </>
        )}
        {tab === "activities" && <Activities />}
        {tab === "info" && (
          <>
      <Printables />

      <ShareLesson />

      <CurriculumMap />

      <section aria-labelledby="h-tm-fair" style={{ ...card, marginTop: 34 }}>
        <h2 id="h-tm-fair" style={cardTitle}>Fair to every party</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 15.5, lineHeight: 1.65, color: COLORS.inkSoft, margin: "8px 0 0", maxWidth: 760 }}>
          Nothing in Teacher mode tells a child who to vote for. In the stories, people weigh up ideas, and the ideas are described, not ranked. On the party
          slides each party gets the same space: who leads it, its main ideas, and what it promised at the 2024 election, taken from the summaries on
          the <a href="#/parties" style={{ color: COLORS.ink, fontWeight: 700 }}>party promises page</a>. Where a number or a leader can change, the slide says when it was last
          checked. If you spot anything that looks wrong, please tell us.
        </p>
      </section>
          </>
        )}
      </div>

      {open && createPortal(<Presenter open startAt={startAt} names={names} onNames={setAndSave} onClose={() => setOpen(false)} openerRef={opener} />, document.body)}
    </div>
  );
}
