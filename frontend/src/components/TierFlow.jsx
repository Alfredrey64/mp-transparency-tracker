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
const PACKETS = 24;

const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function setFill(el, f) {
  if (!el) return;
  el.style.strokeDashoffset = String(1 - f);
  el.style.opacity = f > 0.001 ? "1" : "0";
}
const setLit = (el, on) => el && el.setAttribute("data-lit", on ? "1" : "0");
const place = (el, x, y, size, scale = 1) => { el.style.transform = `translate3d(${(x - size / 2).toFixed(1)}px, ${(y - size / 2).toFixed(1)}px, 0)${scale === 1 ? "" : ` scale(${scale.toFixed(3)})`}`; };
const smooth = (t) => { const c = clamp(t); return c * c * (3 - 2 * c); };

function Arrow({ id, color }) {
  return (
    <marker id={id} viewBox="0 0 12 12" refX="9" refY="6" markerWidth="12" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto">
      <path d="M2.5 2 L9 6 L2.5 10" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </marker>
  );
}

export default function TierFlow({ layout, action, calm, visible, curKey, voting, route, dur, color, stepKey, reachedBefore, colors = {}, chain = [] }) {
  const svgRef = useRef(null);
  const routeRef = useRef(null);
  const layerRef = useRef(null);
  const { width, height } = layout;
  const lastTier = [...layout.nodes].reverse().find((n) => !n.isYou);
  const reachedId = reachedBefore.join("|");
  const chainId = chain.join("|");

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
    // Exploring: the tiers between the top and the one picked light up in their own colours, so you can see the line of who answers to whom.
    if (!action) {
      for (const k of chain) { setFill(fills.get(`edge:${k}`), 1); setLit(dots.get(`down:${k}`), true); }
      return undefined;
    }

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
        el.style.opacity = String(TRAIL[i].opacity * (1 - smooth((t - 0.86) / 0.14)));
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
  }, [layout, action, calm, curKey, voting, route, dur, stepKey, reachedId, chainId]);

  // Exploring: one small glowing packet at a time leaves the top and runs down to a tier, then the next leaves for the next tier, and so on round the
  // tiers, always the same time apart. Where tiers share a stretch of branch the packets are therefore evenly spaced on it, never bunched. Votes do the
  // same in the other direction, from you up the trunk and across to each tier. A packet takes the colour of the tier whose branch it is on.
  useEffect(() => {
    const svg = svgRef.current;
    const layer = layerRef.current;
    if (!svg || !layer) return undefined;
    const slots = [...layer.querySelectorAll(".tb-packet")];
    for (const p of slots) p.style.display = "none";
    if (action || calm || !visible) return undefined;

    const dia = svg.closest(".tier-diagram");
    const slab = (key) => dia?.querySelector(`.tier-slab[data-key="${key}"]`);
    const ping = (key) => {
      const el = slab(key);
      if (!el) return;
      // Restart the glow: the attribute leaves the page for one frame before it comes back, with no layout read to force it.
      el.removeAttribute("data-ping");
      requestAnimationFrame(() => el.setAttribute("data-ping", "1"));
    };
    const measure = (path) => ({ path, len: path.getTotalLength(), col: path.dataset.col });
    const edge = (k) => { const p = svg.querySelector(`[data-flow="down"][data-marker="${k}"]`); return p ? measure(p) : null; };
    const tiers = layout.nodes.filter((n) => !n.isYou);
    const SPEED = 96; // pixels a second
    const EVERY = 1.15; // seconds between one packet leaving and the next

    // A route is a list of pieces; `hidden` pieces are the way through a box, where the packet cannot be seen. `ping` names the box it reaches.
    const downRoute = (target) => {
      const keys = [];
      let node = target.isYou ? layout.byKey[tiers[tiers.length - 1].key] : target;
      if (target.isYou) keys.push("you");
      while (node?.parent) { keys.push(node.key); node = layout.byKey[node.parent]; }
      keys.reverse();
      const pieces = [];
      keys.forEach((k, i) => {
        const e = edge(k);
        if (!e) return;
        pieces.push({ ...e, col: colors[k] ?? "#3B4A66" });
        const here = layout.byKey[k];
        const last = i === keys.length - 1;
        if (k !== "you") pieces.push({ hidden: true, len: last ? 0 : here.height * 0.78, ping: k });
      });
      pieces.dest = target.isYou ? "you" : target.key;
      return pieces;
    };
    const trunk = svg.querySelector('[data-lane="trunk"]');
    const trunkLen = trunk?.getTotalLength() ?? 0;
    const upRoute = (target, i) => {
      if (!trunk) return [];
      const routeTo = (pieces) => Object.assign(pieces, { dest: target.key });
      if (i === 0) return routeTo([{ path: trunk, len: trunkLen, col: "#2E7D5B", from: 0 }]);
      const st = layout.stubs.find((x) => x.key === target.key);
      const sp = svg.querySelector(`[data-lane="stub:${target.key}"]`);
      const lead = (st?.at ?? 1) * trunkLen;
      return routeTo([{ path: trunk, len: lead, col: "#2E7D5B", from: 0 }, ...(sp ? [{ path: sp, len: sp.getTotalLength(), col: "#2E7D5B", from: 0 }] : [])]);
    };

    const downs = [...tiers.slice(1), layout.byKey.you].map((t) => downRoute(t)).filter((r) => r.length);
    const ups = tiers.map((t, i) => upRoute(t, i)).filter((r) => r.length);
    const total = (r) => r.reduce((t, p) => t + p.len, 0);
    const live = [];
    let nextDown = 0;
    let nextUp = 0;
    let lastDown = -Infinity;
    let lastUp = -Infinity;
    let frame = 0;
    const start = performance.now();

    const launch = (route, dir, now) => {
      const el = slots.find((sl) => !live.some((l) => l.el === sl));
      if (!el) return;
      el.style.display = "";
      el.dataset.dir = dir;
      live.push({ el, route, born: now, total: total(route), pinged: new Set() });
    };

    const tick = (now) => {
      const t = (now - start) / 1000;
      if (downs.length && t - lastDown >= EVERY) { launch(downs[nextDown++ % downs.length], "down", t); lastDown = t; }
      if (ups.length && t - lastUp >= EVERY && t >= EVERY / 2) { launch(ups[nextUp++ % ups.length], "up", t); lastUp = t; }
      for (let i = live.length - 1; i >= 0; i--) {
        const l = live[i];
        const d = (t - l.born) * SPEED;
        if (d >= l.total) {
          l.el.style.display = "none";
          live.splice(i, 1);
          continue;
        }
        let at = d;
        let piece = l.route[0];
        for (const p of l.route) {
          if (at <= p.len) { piece = p; break; }
          at -= p.len;
          piece = p;
        }
        if (piece.ping && !l.pinged.has(piece.ping) && at > piece.len * 0.5) { l.pinged.add(piece.ping); ping(piece.ping); }
        if (piece.hidden) { l.el.style.opacity = "0"; continue; }
        const pt = piece.path.getPointAtLength(Math.min(piece.len, Math.max(0, at)));
        // Arriving: over its last stretch the packet eases out and shrinks a little as it melts into the box, which glows once as it does.
        const arrive = smooth((l.total - d) / 34);
        if (l.route.dest && !l.pinged.has("dest") && l.total - d < 22) { l.pinged.add("dest"); ping(l.route.dest); }
        place(l.el, pt.x, pt.y, 9, 0.55 + 0.45 * arrive);
        l.el.style.background = piece.col;
        l.el.style.setProperty("--pc", piece.col);
        // Fade in as it leaves, so it never pops.
        l.el.style.opacity = String(Math.min(smooth(d / 18), arrive) * 0.95);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); for (const p of slots) p.style.display = "none"; };
  }, [layout, action, calm, visible, colors]);

  return (
    <>
      <svg ref={svgRef} className="tb-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <defs>
          {layout.edges.map((e) => <Arrow key={e.key} id={`tb-arr-${e.key}`} color={colors[e.key] ?? "#3B4A66"} />)}
          {layout.edges.map((e) => {
            // Each branch fades from its parent's colour to its own, so you can see where it leaves and where it arrives.
            const child = layout.byKey[e.key];
            const parent = layout.byKey[child.parent ?? lastTier.key];
            const [c0, c1] = [colors[parent.key] ?? "#3B4A66", colors[e.key] ?? "#3B4A66"];
            const at = { gradientUnits: "userSpaceOnUse", x1: parent.spineX, y1: parent.bottom, x2: child.left, y2: child.isYou ? child.top : child.midY };
            return (
              <g key={e.key}>
                <linearGradient id={`tbg-${e.key}`} {...at}><stop offset="0" stopColor={c0} stopOpacity="0.34" /><stop offset="1" stopColor={c1} stopOpacity="0.34" /></linearGradient>
                <linearGradient id={`tbs-${e.key}`} {...at}><stop offset="0" stopColor={c0} /><stop offset="1" stopColor={c1} /></linearGradient>
              </g>
            );
          })}
          <Arrow id="tb-arr-up" color="#2E7D5B" />
        </defs>
        {layout.edges.map((e) => (
          <g key={e.key} className="tb-down" style={{ "--ln": colors[e.key] ?? "#3B4A66" }}>
            <path d={e.d} className="tb-base" style={{ stroke: `url(#tbg-${e.key})` }} markerEnd={`url(#tb-arr-${e.key})`} data-flow="down" data-marker={e.key} data-col={colors[e.key]} />
            <path d={e.d} className="tb-done" pathLength="1" style={{ stroke: `url(#tbs-${e.key})` }} data-f={`edge:${e.key}`} />
          </g>
        ))}
        <g className="tb-up">
          <path d={layout.trunk} className="tb-base" markerEnd="url(#tb-arr-up)" data-flow="up" data-marker="up" data-lane="trunk" />
          <path d={layout.trunk} className="tb-done" pathLength="1" data-f="trunk" />
          {layout.stubs.map((st) => (
            <g key={st.key}>
              <path d={st.d} className="tb-base" markerEnd="url(#tb-arr-up)" data-flow="up" data-marker="up" data-lane={`stub:${st.key}`} />
              <path d={st.d} className="tb-done" pathLength="1" data-f={`stub:${st.key}`} />
            </g>
          ))}
        </g>
        {layout.dots.map((d) => (
          <circle key={d.key} cx={d.x} cy={d.y} r="5" className={`tb-dot ${d.up ? "tb-dot-up" : "tb-dot-down"}`} data-dot={`${d.up ? "up" : "down"}:${d.fromLast ? "you" : d.key}`} data-lit="0" style={d.up ? undefined : { "--dc": colors[d.key] }} />
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
