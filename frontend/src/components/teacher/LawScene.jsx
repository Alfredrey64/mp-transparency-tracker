/** @jsxImportSource react */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { loadGsapCore } from "../../lib/gsapLoader";
import { LAW_STEPS } from "../../data/teacherMode";
import { Sky, Ground, Cloud, Paper, Bulb, Confetti, Burst } from "./art";

// An idea travelling to become a law. The line draws itself and a sheet of paper rides along it from stop to stop as the steps advance; each stop
// lights up when the paper has been there. The stops are spaced evenly along the line, and their places are read from the line itself.
const ROUTE = "M70 310 C150 310 160 170 260 170 S380 320 470 320 S560 170 650 170 S680 300 704 300";
const COLOURS = ["#F2B632", "#16A34A", "#C0392B", "#C7871A", "#1E4FB8"];

export default function LawScene({ beat, calm }) {
  const line = useRef(null);
  const bead = useRef(null);
  const prev = useRef(null);
  const [points, setPoints] = useState([]);

  useLayoutEffect(() => {
    const path = line.current;
    const len = path.getTotalLength();
    setPoints(LAW_STEPS.map((_, i) => path.getPointAtLength((len * i) / (LAW_STEPS.length - 1))));
  }, []);

  useEffect(() => {
    const path = line.current;
    const bd = bead.current;
    if (!path || !bd || !points.length) return undefined;
    const to = beat / (LAW_STEPS.length - 1);
    const from = prev.current ?? to;
    prev.current = to;
    const place = (f) => { const p = path.getPointAtLength(path.getTotalLength() * f); bd.setAttribute("transform", `translate(${p.x} ${p.y})`); };
    const first = from === to;
    let alive = true;
    let tween;
    path.style.strokeDasharray = "1 1";
    path.setAttribute("pathLength", "1");
    if (calm) { path.style.strokeDashoffset = String(1 - to); place(to); return undefined; }
    loadGsapCore().then(({ gsap }) => {
      if (!alive) return;
      gsap.killTweensOf([path, bd]);
      bd.removeAttribute("transform");
      if (first) { path.style.strokeDashoffset = String(1 - to); gsap.set(bd, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5], start: to, end: to } }); return; }
      const t = gsap.timeline({ defaults: { duration: 1.1, ease: "power2.inOut" } });
      t.to(path, { strokeDashoffset: 1 - to }, 0);
      t.to(bd, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5], start: from, end: to } }, 0);
      tween = t;
    }).catch(() => { path.style.strokeDashoffset = String(1 - to); place(to); });
    return () => { alive = false; tween?.kill(); };
  }, [beat, calm, points]);

  return (
    <>
      <Sky tone="#E8F0FF" tone2="#F8FAFF" />
      <Cloud x={150} y={64} />
      <Cloud x={640} y={56} s={0.8} delay={-8} />
      <Ground colour="#D2E8D2" path="#EADFC9" />
      <path d={ROUTE} fill="none" stroke="#CBD3E2" strokeWidth="12" strokeLinecap="round" strokeDasharray="2 18" />
      <path ref={line} d={ROUTE} fill="none" stroke="#1E4FB8" strokeWidth="12" strokeLinecap="round" style={{ strokeDashoffset: 1 }} />
      {points.map((p, i) => {
        const lit = i <= beat;
        return (
          <g key={LAW_STEPS[i].key} transform={`translate(${p.x} ${p.y})`}>
            <circle r="30" fill={lit ? COLOURS[i] : "#fff"} stroke={COLOURS[i]} strokeWidth="5" style={{ transition: "fill 0.4s" }} />
            <text y="9" textAnchor="middle" fontSize="26" fontWeight="800" fontFamily="Figures, Public Sans, system-ui, sans-serif" fill={lit ? "#fff" : COLOURS[i]}>{i + 1}</text>
            <text y={i % 2 === 0 ? 62 : -46} textAnchor="middle" fontSize="23" fontWeight="800" fontFamily="Figures, Public Sans, system-ui, sans-serif" fill="#0B1B33" stroke="#F8FAFF" strokeWidth="5" paintOrder="stroke">{LAW_STEPS[i].label}</text>
          </g>
        );
      })}
      {points.length > 0 && beat === 3 && (
        <g transform={`translate(${points[3].x + 40} 74)`} aria-hidden="true">
          <g className="t-stamp" style={{ animationDelay: "1.15s" }}>
            <rect x="-86" y="-24" width="172" height="48" rx="10" fill="none" stroke="#C0392B" strokeWidth="5" />
            <text y="9" textAnchor="middle" fontSize="25" fontWeight="800" fontFamily="Figures, Public Sans, system-ui, sans-serif" fill="#C0392B" letterSpacing="1.5">APPROVED</text>
          </g>
        </g>
      )}
      {points.length > 0 && beat === 4 && (
        <>
          <Burst x={points[4].x} y={points[4].y} r={62} delay={1100} colour="#1E4FB8" />
          <Confetti x={points[4].x - 120} y={20} spread={260} n={26} delay={1100} />
        </>
      )}
      <g ref={bead}><g transform="translate(0 -4)"><Paper x={0} y={0} /></g></g>
      {beat === 0 && <g transform="translate(70 238)" className="t-glow"><Bulb x={0} y={0} /></g>}
    </>
  );
}
