import { useEffect, useLayoutEffect, useRef } from "react";

// The moving parts of the "who does what" diagram: the branches, the glowing comet that carries a law, a pound or a planning application from tier
// to tier, and the small packets that drift along the branches while you explore.
//
// Everything that moves is driven from one animation loop and moves with a transform, which the browser can draw on the graphics card, so
// nothing is repainted frame after frame and nothing is laid out again. The branch lines fill in exactly as far as the comet has travelled
// because both come from the same number.

const TRAIL = [
  { size: 13, opacity: 0.6, lag: 0.05 },
  { size: 10.5, opacity: 0.42, lag: 0.1 },
  { size: 8, opacity: 0.26, lag: 0.15 },
  { size: 6, opacity: 0.14, lag: 0.2 },
];
const PACKETS = 30;
const PACKET_SPEED = 46; // pixels a second
const PACKET_GAP = 120; // pixels between packets on a branch

const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function setFill(el, f) {
  if (!el) return;
  el.style.strokeDashoffset = String(1 - f);
  el.style.opacity = f > 0.001 ? "1" : "0";
}
const setLit = (el, on) => el && el.setAttribute("data-lit", on ? "1" : "0");
const place = (el, x, y, size) => { el.style.transform = `translate3d(${(x - size / 2).toFixed(1)}px, ${(y - size / 2).toFixed(1)}px, 0)`; };

function Arrow({ id, color }) {
  return (
    <marker id={id} viewBox="0 0 12 12" refX="9" refY="6" markerWidth="12" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto">
      <path d="M2.5 2 L9 6 L2.5 10" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </marker>
  );
}

export default function TierFlow({ layout, action, calm, visible, curKey, voting, route, dur, color, stepKey, reachedBefore }) {
  const svgRef = useRef(null);
  const routeRef = useRef(null);
  const layerRef = useRef(null);
  const { width, height } = layout;
  const reachedId = reachedBefore.join("|");

  // The walk-through: the comet travels the route while the branch it is on fills in behind it.
  useLayoutEffect(() => {
    const svg = svgRef.current;
    const layer = layerRef.current;
    if (!svg || !layer) return undefined;
    const fills = new Map([...svg.querySelectorAll("[data-f]")].map((e) => [e.dataset.f, e]));
    const dots = new Map([...svg.querySelectorAll("[data-dot]")].map((e) => [e.dataset.dot, e]));
    const head = layer.querySelector(".tb-head");
    const trail = [...layer.querySelectorAll(".tb-trail")];
    for (const e of fills.values()) setFill(e, 0);
    for (const e of dots.values()) setLit(e, false);
    if (!action) return undefined;

    const before = new Set(reachedBefore);
    for (const k of before) {
      setFill(fills.get(`edge:${k}`), 1);
      setLit(dots.get(`down:${k}`), true);
    }

    const path = routeRef.current;
    const len = path?.getTotalLength?.() ?? 0;
    const at = (p) => (len > 0 ? path.getPointAtLength(len * p) : path.getPointAtLength(0));
    const upDots = layout.dots.filter((d) => d.up);
    const paint = (t) => {
      const p = ease(clamp(t));
      const pt = at(p);
      place(head, pt.x, pt.y, 16);
      trail.forEach((el, i) => {
        const q = at(ease(clamp(t - TRAIL[i].lag / Math.max(dur, 0.3))));
        place(el, q.x, q.y, TRAIL[i].size);
        el.style.opacity = t >= 1 ? "0" : String(TRAIL[i].opacity);
      });
      if (voting) {
        setFill(fills.get("trunk"), p);
        for (const st of layout.stubs) setFill(fills.get(`stub:${st.key}`), clamp((p - st.at) / 0.16));
        for (const d of upDots) setLit(dots.get(`up:${d.key}`), p >= d.at);
      } else {
        setFill(fills.get(`edge:${curKey}`), p);
        setLit(dots.get(`down:${curKey}`), p >= 0.97);
      }
    };
    head.style.opacity = "1";
    if (calm || dur <= 0) { paint(1); return undefined; }

    let frame = 0;
    const start = performance.now();
    const tick = (now) => {
      const t = (now - start) / (dur * 1000);
      paint(t);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    paint(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  // reachedId stands for reachedBefore, which is a new array on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, action, calm, curKey, voting, route, dur, stepKey, reachedId]);

  // Exploring: small packets drift along the branches, red ones carrying laws and money down, green ones carrying votes up.
  useEffect(() => {
    const svg = svgRef.current;
    const layer = layerRef.current;
    if (!svg || !layer) return undefined;
    const packets = [...layer.querySelectorAll(".tb-packet")];
    for (const p of packets) p.style.display = "none";
    if (action || calm || !visible) return undefined;

    const lanes = [];
    let used = 0;
    for (const path of svg.querySelectorAll("[data-flow]")) {
      const len = path.getTotalLength();
      if (len < 24) continue;
      const n = Math.max(1, Math.round(len / PACKET_GAP));
      for (let i = 0; i < n && used < PACKETS; i++, used++) {
        const el = packets[used];
        el.style.display = "";
        el.dataset.dir = path.dataset.flow;
        lanes.push({ path, len, el, offset: i / n });
      }
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now) => {
      const travelled = ((now - start) / 1000) * PACKET_SPEED;
      for (const l of lanes) {
        const pt = l.path.getPointAtLength(((l.offset + travelled / l.len) % 1) * l.len);
        place(l.el, pt.x, pt.y, 8);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [layout, action, calm, visible]);

  return (
    <>
      <svg ref={svgRef} className="tb-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <defs>
          <Arrow id="tb-arr-down" color="#D4573A" />
          <Arrow id="tb-arr-up" color="#1FA97C" />
        </defs>
        {layout.edges.map((e) => (
          <g key={e.key} className="tb-down">
            <path d={e.d} className="tb-base" markerEnd="url(#tb-arr-down)" data-flow="down" data-marker="down" />
            <path d={e.d} className="tb-done" pathLength="1" data-f={`edge:${e.key}`} />
          </g>
        ))}
        <g className="tb-up">
          <path d={layout.trunk} className="tb-base" markerEnd="url(#tb-arr-up)" data-flow="up" data-marker="up" />
          <path d={layout.trunk} className="tb-done" pathLength="1" data-f="trunk" />
          {layout.stubs.map((st) => (
            <g key={st.key}>
              <path d={st.d} className="tb-base" markerEnd="url(#tb-arr-up)" data-flow="up" data-marker="up" />
              <path d={st.d} className="tb-done" pathLength="1" data-f={`stub:${st.key}`} />
            </g>
          ))}
        </g>
        {layout.dots.map((d) => (
          <circle key={d.key} cx={d.x} cy={d.y} r="5" className={`tb-dot ${d.up ? "tb-dot-up" : "tb-dot-down"}`} data-dot={`${d.up ? "up" : "down"}:${d.fromLast ? "you" : d.key}`} data-lit="0" />
        ))}
        <path ref={routeRef} d={route} fill="none" stroke="none" />
      </svg>
      <div ref={layerRef} className="tb-layer" aria-hidden="true" style={{ "--tokc": color }}>
        {Array.from({ length: PACKETS }, (_, i) => <span key={i} className="tb-packet" style={{ display: "none" }} />)}
        {action && TRAIL.map((t, i) => <span key={`${i}-${stepKey}`} className="tb-trail" style={{ width: t.size, height: t.size }} />)}
        {action && (
          <span key={`head-${stepKey}`} className="tb-head" style={{ opacity: 0 }}>
            <span className="tier-ripple" style={{ "--dur": `${dur}s` }} />
          </span>
        )}
      </div>
    </>
  );
}
