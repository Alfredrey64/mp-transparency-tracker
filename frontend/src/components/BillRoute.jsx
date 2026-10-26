import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { COLORS, FONT_BODY, FONT_DISPLAY, solid } from "../theme";
import { loadGsap } from "../lib/gsapLoader";
import { lowData } from "../lib/lowData";

// "How a bill becomes law" as a route you travel by scrolling: the line draws itself down the page, a marker rides along it, and each stop lights up
// as the marker reaches it, with the stage's own explanation shown beside it. Every stop and every word comes from the stage list the timeline
// underneath uses, so the two cannot disagree. Without motion (reduced motion, data saving, or GSAP failing to load) the whole route is simply shown
// complete and the explanations stay in the timeline below.

// Where each stop sits on the 360 by 720 drawing, and the line joining them: down the House where the bill starts, across to the other House,
// back and forth between the two while they disagree, then down to Royal Assent and the Act coming into force.
const STOPS = {
  idea: [80, 40], first: [80, 100], second: [80, 160], committee: [80, 220], report: [80, 280], third: [80, 340],
  otherhouse: [280, 410], pingpong: [190, 491], assent: [180, 604], implementation: [180, 684],
};
const ROUTE = "M80 40 L80 340 C80 388 280 362 280 410 L280 440 L110 470 L260 510 L130 545 L180 578 L180 684";
const ON_RIGHT = new Set(["otherhouse"]);

export default function BillRoute({ stages, color }) {
  const calm = useReducedMotion() || lowData();
  const box = useRef(null);
  const line = useRef(null);
  const bead = useRef(null);
  const [state, setState] = useState({ active: calm ? stages.length - 1 : 0, live: false });
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
      const at = stops.map((s) => {
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
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: box.current, start: "top 62%", end: "bottom 78%", scrub: 0.6, invalidateOnRefresh: true,
            onUpdate: (self) => {
              let n = 0;
              at.forEach((f, i) => { if (self.progress >= f - 0.002) n = i; });
              setState((s) => (s.active === n && s.live ? s : { active: n, live: true }));
            },
          },
        });
        tl.fromTo(path, { drawSVG: "0%" }, { drawSVG: "100%" }, 0);
        tl.to(bead.current, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5] } }, 0);
      }, box);
      // The page above settles a moment after it opens (fonts, the glossary), so measure again once it has.
      const later = setTimeout(() => ScrollTrigger.refresh(), 900);
      ctx.add(() => clearTimeout(later));
    }).catch(() => setState({ active: stages.length - 1, live: false }));
    return () => { dead = true; ctx?.revert(); };
    // stops is derived from stages, which never changes for a given page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calm]);

  const current = stops[Math.min(state.active, stops.length - 1)];
  const shown = calm || !state.live ? null : current;

  return (
    <div ref={box} className="billroute" aria-hidden={calm ? undefined : "true"}>
      {!calm && (
        <div className="billroute-caption" style={{ "--c": color }} aria-hidden="true">
          <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft }}>
            {shown ? `Stage ${stops.indexOf(shown) + 1} of ${stops.length}` : "Scroll to follow a bill"}
          </div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700, color: COLORS.ink, lineHeight: 1.2, margin: "2px 0 6px" }}>{shown ? shown.label : "From idea to law"}</div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: 0 }}>
            {shown ? shown.desc : "A line will draw itself down the page and a marker will stop at each stage, from the first idea to the Act coming into force."}
          </p>
        </div>
      )}
      <svg viewBox="0 0 360 720" className="billroute-svg" role="presentation" focusable="false">
        <path d={ROUTE} fill="none" stroke={`color-mix(in srgb, ${color} 22%, ${COLORS.hairline})`} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path ref={line} d={ROUTE} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        {stops.map((s, i) => {
          const [x, y] = STOPS[s.key];
          const lit = calm || i <= state.active;
          const right = ON_RIGHT.has(s.key);
          return (
            <g key={s.key}>
              <circle cx={x} cy={y} r="13" fill={lit ? solid(color) : COLORS.paperCard} stroke={color} strokeWidth="3" style={{ transition: "fill 0.3s" }} />
              <text x={x} y={y + 4.5} textAnchor="middle" fontFamily={FONT_BODY} fontSize="12.5" fontWeight="700" fill={lit ? "#fff" : color}>{i + 1}</text>
              <text
                x={right ? x - 22 : x + 22} y={y + 5} textAnchor={right ? "end" : "start"} fontFamily={FONT_BODY} fontSize="14.5" fontWeight={i === state.active && !calm ? 700 : 600}
                fill={COLORS.ink} stroke={COLORS.paperCard} strokeWidth="4" paintOrder="stroke" strokeLinejoin="round"
              >
                {s.label.replace(/"/g, "")}
              </text>
            </g>
          );
        })}
        {!calm && <circle ref={bead} cx="80" cy="40" r="8" fill="#fff" stroke={color} strokeWidth="3.5" style={{ opacity: 0, filter: `drop-shadow(0 0 6px ${color})` }} />}
      </svg>
    </div>
  );
}
