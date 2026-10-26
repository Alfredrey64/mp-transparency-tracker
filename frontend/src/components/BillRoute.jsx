import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { COLORS, FONT_BODY, solid } from "../theme";
import { loadGsap } from "../lib/gsapLoader";
import { lowData } from "../lib/lowData";
import "../billroute.css";

// "How a bill becomes law" as a route you travel by scrolling: the line draws itself down the page, a marker rides along it, and each stop lights up
// as the marker reaches it, with the stage's own explanation shown beside it. Every stop and every word comes from the stage list the timeline
// underneath uses, so the two cannot disagree. Without motion (reduced motion, data saving, or GSAP failing to load) the whole route is simply shown
// complete and the explanations stay in the timeline below.
//
// Every stop can also be picked, with a tap or the keyboard: the marker then travels to it and the panel beside the route tells you more about that
// stage (who decides, how long it takes, and one thing worth knowing). Picking a stop takes over from the scrolling until "Follow my scrolling" is pressed.

// Where each stop sits on the 360 by 720 drawing, and the line joining them: down the House where the bill starts, across to the other House,
// back and forth between the two while they disagree, then down to Royal Assent and the Act coming into force.
const STOPS = {
  idea: [80, 40], first: [80, 100], second: [80, 160], committee: [80, 220], report: [80, 280], third: [80, 340],
  otherhouse: [280, 410], pingpong: [190, 491], assent: [180, 604], implementation: [180, 684],
};
const ROUTE = "M80 40 L80 340 C80 388 280 362 280 410 L280 440 L110 470 L260 510 L130 545 L180 578 L180 684";
const ON_RIGHT = new Set(["otherhouse"]);


// A little more about each stage: who is involved, roughly how long it takes, and one thing worth knowing. Plain facts about how Parliament usually works.
const FACTS = {
  idea: { who: "The government, an MP or a peer", time: "Months or years before it is introduced", know: "Most laws start as promises in a party's manifesto. Many go through public consultations first." },
  first: { who: "The House where the bill starts", time: "A few minutes", know: "The bill is published for the first time, so anyone can read it from now on." },
  second: { who: "All the MPs (or peers)", time: "A day, a few weeks after the first reading", know: "If the House votes against a bill here, it usually ends. It is the first big test." },
  committee: { who: "A small group of MPs, or all the peers", time: "Days to weeks", know: "This is where the detail is checked, line by line, and where most changes are first suggested." },
  report: { who: "The whole House", time: "One or two days", know: "Everyone gets a chance to vote on changes that were made, or suggested, in committee." },
  third: { who: "The whole House", time: "Often the same day as the report stage", know: "The last chance in this House to say yes or no. If it passes, the bill moves to the other House." },
  otherhouse: { who: "The other House: Lords or Commons", time: "Weeks to months", know: "The second House can suggest changes. It cannot usually block a bill for ever, but it can make the government think again." },
  pingpong: { who: "Both Houses, in turn", time: "Days, or sometimes weeks", know: "The bill goes back and forth until the two Houses agree. In almost every case the elected Commons has the final say." },
  assent: { who: "The King", time: "A moment", know: "It has not been refused since 1708. Once given, the bill becomes an Act of Parliament and is law." },
  implementation: { who: "Ministers, civil servants and councils", time: "Weeks to years", know: "Many Acts are switched on bit by bit. Ministers sign orders to start them, and detailed rules often follow." },
};

export default function BillRoute({ stages, color }) {
  const calm = useReducedMotion() || lowData();
  const box = useRef(null);
  const line = useRef(null);
  const bead = useRef(null);
  const tl = useRef(null);
  const at = useRef([]);
  const [state, setState] = useState({ active: calm ? stages.length - 1 : 0, live: false });
  const [manual, setManual] = useState(false);
  const stops = stages.filter((s) => STOPS[s.key]);

  useEffect(() => {
    if (calm) return undefined;
    let ctx;
    let dead = false;
    loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (dead || !box.current || !line.current || !bead.current) return;
      const path = line.current;
      const total = path.getTotalLength();
      // How far along the line each stop is, found by walking the line and taking the point closest to the stop.
      at.current = stops.map((s) => {
        const [x, y] = STOPS[s.key];
        let best = 0;
        let bestD = Infinity;
        for (let i = 0; i <= 720; i++) {
          const p = path.getPointAtLength((i / 720) * total);
          const d = (p.x - x) ** 2 + (p.y - y) ** 2;
          if (d < bestD) { bestD = d; best = i / 720; }
        }
        return best;
      });
      ctx = gsap.context(() => {
        gsap.set(bead.current, { opacity: 1 });
        const t = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: box.current, start: "top 62%", end: "bottom 78%", scrub: 0.6, invalidateOnRefresh: true,
            onUpdate: (self) => {
              let n = 0;
              at.current.forEach((f, i) => { if (self.progress >= f - 0.002) n = i; });
              setState((s) => (s.active === n && s.live ? s : { active: n, live: true }));
            },
          },
        });
        t.fromTo(path, { drawSVG: "0%" }, { drawSVG: "100%" }, 0);
        t.to(bead.current, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5] } }, 0);
        tl.current = t;
      }, box);
      // The page above settles a moment after it opens (fonts, the glossary), so measure again once it has.
      const later = setTimeout(() => ScrollTrigger.refresh(), 900);
      ctx.add(() => clearTimeout(later));
    }).catch(() => setState({ active: stages.length - 1, live: false }));
    return () => { dead = true; tl.current = null; ctx?.revert(); };
    // stops is derived from stages, which never changes for a given page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calm]);

  // Picking a stop: the marker travels to it, and the scrolling lets go until it is asked to take over again.
  function pick(i) {
    const n = Math.max(0, Math.min(stops.length - 1, i));
    setManual(true);
    setState({ active: n, live: true });
    const t = tl.current;
    if (!t) return;
    t.scrollTrigger?.disable(false);
    loadGsap().then(({ gsap }) => gsap.to(t, { progress: at.current[n] ?? 1, duration: 0.9, ease: "power2.inOut", overwrite: true })).catch(() => {});
  }
  function follow() {
    setManual(false);
    const st = tl.current?.scrollTrigger;
    if (st) { st.enable(); st.update(); }
  }

  const idx = Math.min(state.active, stops.length - 1);
  const current = stops[idx];
  const shown = calm || !state.live ? (calm ? current : null) : current;
  const facts = shown ? FACTS[shown.key] : null;

  return (
    <div ref={box} className="billroute" style={{ "--c": color }}>
      <div className="billroute-caption" style={{ "--c": color }} aria-live="polite">
        <div className="billroute-count">{shown ? `Stage ${stops.indexOf(shown) + 1} of ${stops.length}` : "Tap a stage, or scroll to follow a bill"}</div>
        <div className="billroute-title" key={shown?.key ?? "start"}>{shown ? shown.label.replace(/"/g, "") : "From idea to law"}</div>
        <p className="billroute-desc">
          {shown ? shown.desc : "A line will draw itself down the page and a marker will stop at each stage, from the first idea to the Act coming into force. You can also tap any stage on the route to jump straight to it."}
        </p>
        {facts && (
          <dl className="billroute-facts">
            <div><dt>Who decides</dt><dd>{facts.who}</dd></div>
            <div><dt>How long</dt><dd>{facts.time}</dd></div>
            <div className="billroute-know"><dt>Good to know</dt><dd>{facts.know}</dd></div>
          </dl>
        )}
        {shown?.visual && <div className="billroute-visual">{shown.visual}</div>}
        <div className="billroute-nav">
          <button type="button" onClick={() => pick(idx - 1)} disabled={idx === 0 && state.live}>Back</button>
          <button type="button" className="billroute-primary" onClick={() => pick(state.live ? idx + 1 : 0)} disabled={idx === stops.length - 1 && state.live}>{state.live ? "Next stage" : "Start at the idea"}</button>
          {!calm && manual && <button type="button" onClick={follow}>Follow my scrolling</button>}
        </div>
        <ol className="billroute-chips" aria-label="Jump to a stage">
          {stops.map((s, i) => (
            <li key={s.key}><button type="button" aria-current={shown && i === idx ? "step" : undefined} data-done={i < idx && shown ? "1" : "0"} onClick={() => pick(i)} title={s.label.replace(/"/g, "")}>{i + 1}</button></li>
          ))}
        </ol>
      </div>
      <svg viewBox="0 0 360 720" className="billroute-svg" role="group" aria-label="The route of a bill. Each stop can be picked.">
        <path d={ROUTE} fill="none" stroke={`color-mix(in srgb, ${color} 22%, ${COLORS.hairline})`} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path ref={line} d={ROUTE} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        {stops.map((s, i) => {
          const [x, y] = STOPS[s.key];
          const lit = calm || (state.live && i <= state.active);
          const right = ON_RIGHT.has(s.key);
          const here = shown && i === idx;
          const label = s.label.replace(/"/g, "");
          return (
            <g
              key={s.key} className="billroute-stop" data-here={here ? "1" : "0"} role="button" tabIndex={0} aria-label={`Stage ${i + 1}: ${label}`} aria-pressed={here}
              onClick={() => pick(i)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(i); } }}
            >
              <rect x={right ? x - 150 : x - 20} y={y - 20} width="170" height="40" fill="transparent" />
              {here && <circle cx={x} cy={y} r="19" fill="none" stroke={color} strokeWidth="2" className="billroute-halo" />}
              <circle cx={x} cy={y} r="13" fill={lit ? solid(color) : COLORS.paperCard} stroke={color} strokeWidth="3" style={{ transition: "fill 0.3s" }} />
              <text x={x} y={y + 4.5} textAnchor="middle" fontFamily={FONT_BODY} fontSize="12.5" fontWeight="700" fill={lit ? "#fff" : color}>{i + 1}</text>
              <text
                x={right ? x - 22 : x + 22} y={y + 5} textAnchor={right ? "end" : "start"} fontFamily={FONT_BODY} fontSize="14.5" fontWeight={here ? 800 : 600}
                fill={COLORS.ink} stroke={COLORS.paperCard} strokeWidth="4" paintOrder="stroke" strokeLinejoin="round"
              >
                {label}
              </text>
            </g>
          );
        })}
        {!calm && <circle ref={bead} cx="80" cy="40" r="8" fill="#fff" stroke={color} strokeWidth="3.5" style={{ opacity: 0, filter: `drop-shadow(0 0 6px ${color})`, pointerEvents: "none" }} />}
      </svg>
    </div>
  );
}
