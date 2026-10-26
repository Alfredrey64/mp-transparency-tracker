import { useEffect, useMemo, useRef, useState } from "react";
import { useInView } from "motion/react";
import { COLORS, FONT_BODY, FONT_DISPLAY, readable } from "../theme";
import { DOT, layoutLandmarks, nearestNode } from "../lib/landmarkLayout";

// Landmark votes at a glance: one dot for each vote, with time running across and the theme running down. Hover or tap a dot to read what it was;
// "Read it below" jumps to its card. Filled dots are votes that were carried, hollow ones were lost or failed. The cards underneath hold the same
// information in order for keyboards and screen readers, so the chart itself is purely visual.

const LABEL_W = 150;
const WIDE = 640;
const HEAD = 24; // room above the lanes for the era names
const AXIS = 30;

function Tooltip({ node, box, selected, onJump, onClose }) {
  const w = Math.min(260, box.w - 16);
  const left = Math.min(Math.max(8, node.x + box.lab - w / 2), box.w - w - 8);
  const y = node.y + HEAD;
  const above = y > box.h + HEAD - 120;
  return (
    <div
      className="lm-tip" role="status"
      style={{ left, width: w, ...(above ? { bottom: box.h + HEAD + AXIS - y + DOT } : { top: y + DOT }), "--c": node.color }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft }}>
        <span>{node.vote.date}</span>
        <span style={{ color: readable(node.color), background: `${node.color}18`, padding: "1px 8px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.04em", fontSize: 10.5 }}>{node.vote.theme}</span>
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700, color: COLORS.ink, lineHeight: 1.3, margin: "5px 0 3px" }}>{node.vote.title}</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>{node.vote.result}</div>
      {selected && (
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button type="button" className="btn btn-primary" style={{ minHeight: 34, padding: "0 12px", fontSize: 13 }} onClick={onJump}>Read it below</button>
          <button type="button" className="btn btn-secondary" style={{ minHeight: 34, padding: "0 12px", fontSize: 13 }} onClick={onClose}>Close</button>
        </div>
      )}
    </div>
  );
}

export default function LandmarkMap({ votes, eras, themes, filter, selectedId, onSelect, onJump }) {
  const boxRef = useRef(null);
  const seen = useInView(boxRef, { once: true, margin: "0px 0px -15% 0px" });
  const [w, setW] = useState(() => (typeof window === "undefined" ? 900 : Math.max(280, Math.min(1000, window.innerWidth - 56))));
  const [hoverId, setHoverId] = useState(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setW(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const wide = w >= WIDE;
  const lab = wide ? LABEL_W : 0;
  const labelPad = wide ? 6 : 22;
  const layout = useMemo(() => layoutLandmarks({ votes, eras, themes, width: w - lab, labelPad }), [votes, eras, themes, w, lab, labelPad]);
  const h = layout.height;
  const byId = useMemo(() => new Map(layout.nodes.map((n) => [n.id, n])), [layout]);
  const shown = byId.get(hoverId ?? selectedId) ?? null;

  const at = (e) => {
    const r = boxRef.current.getBoundingClientRect();
    return nearestNode(layout.nodes, e.clientX - r.left - lab, e.clientY - r.top - HEAD, wide ? 14 : 18);
  };

  return (
    <div
      ref={boxRef} className="lm" data-in={seen ? "1" : "0"} style={{ height: HEAD + h + AXIS }}
      onPointerMove={(e) => { if (e.pointerType === "mouse") setHoverId(at(e)?.id ?? null); }}
      onPointerLeave={() => setHoverId(null)}
      onClick={(e) => { if (e.target.closest(".lm-tip")) return; const n = at(e); onSelect(n && n.id !== selectedId ? n.id : null); }}
    >
      <div aria-hidden="true" className="lm-plot" style={{ height: HEAD + h + AXIS }}>
        {layout.bands.map((b, i) => (
          <div key={b.key} className="lm-band" data-alt={i % 2} style={{ left: lab + (i === 0 ? 0 : b.left), width: b.width + (i === 0 ? b.left : 0) + (i === layout.bands.length - 1 ? 10 : 0), height: HEAD + h, "--a": b.accent, "--i": i }}>
            {b.width > 64 && <span className="lm-bandname">{b.short}</span>}
          </div>
        ))}
        <div className="lm-body" style={{ top: HEAD, height: h }}>
        {layout.lanes.map((l) => (
          <div key={l.key} className="lm-lane" style={{ top: l.top, height: l.height, "--c": l.color }}>
            <span className="lm-lanelabel" style={wide ? { width: LABEL_W - 12 } : { left: 6, top: 3 }}>
              {l.label}<span className="lm-lanecount">{l.items.length}</span>
            </span>
            <span className="lm-laneline" style={{ left: lab, right: 0 }} />
          </div>
        ))}
        </div>
        {layout.bands.map((b, i) => (
          b.width > 38 || i === 0 ? <span key={`t-${b.key}`} className="lm-tick" style={{ left: lab + b.left - (i === 0 ? 4 : 0), top: HEAD + h + 8 }}>{b.start}</span> : null
        ))}
        {layout.nodes.map((n) => {
          const dim = filter !== "General" && n.theme !== filter;
          const on = n.id === shown?.id;
          return (
            <span
              key={n.id} className="lm-dot" data-hollow={n.vote.outcome !== "achieved" ? "1" : "0"} data-dim={dim ? "1" : "0"} data-on={on ? "1" : "0"}
              style={{ left: lab + n.x - DOT / 2, top: n.y + HEAD - DOT / 2, "--c": n.color, "--d": `${Math.round((n.x / Math.max(1, w - lab)) * 900)}ms` }}
            />
          );
        })}
      </div>
      {shown && <Tooltip node={shown} box={{ w, h, lab }} selected={shown.id === selectedId} onJump={() => onJump(shown.id)} onClose={() => onSelect(null)} />}
    </div>
  );
}
