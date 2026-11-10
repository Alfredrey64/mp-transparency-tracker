/** @jsxImportSource react */

// Pieces shared by the pictures that show something moving from one place to another (dark money trail, who handles ACOBA's work now, the two routes to a minister).
// Their entrance and flow animations are in story.css (dmx-*) and are switched off for anyone who has asked for calmer motion.
const INK = "#1B2438";

export const Shadow = ({ id }) => <filter id={id} x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="4" floodColor={INK} floodOpacity="0.15" /></filter>;

export const ArrowDef = ({ id }) => <marker id={id} markerWidth="14" markerHeight="14" refX="5" refY="3" orient="auto" markerUnits="userSpaceOnUse" viewBox="0 0 6 6"><path d="M0 0 6 3 0 6z" fill="#5B6784" /></marker>;

// A route: a soft wide ribbon with a thin line of dashes running along it, so the direction shows even when nothing moves.
export const Ribbon = ({ d, c, delay = 0.5, opacity = 1, arrow }) => (
  <g className="dmx-in" style={{ "--d": delay }} opacity={opacity}>
    <path d={d} fill="none" stroke={c} strokeOpacity="0.18" strokeWidth="16" strokeLinecap="round" />
    <path className="dmx-dash" d={d} fill="none" stroke={c} strokeOpacity="0.85" strokeWidth="3" strokeDasharray="3 12" strokeLinecap="round" markerEnd={arrow} />
  </g>
);

// A round badge with a simple white figure in it, drawn at the origin and moved with x, y. k scales it.
export function Badge({ x, y, c, glyph = "person", k = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <circle r="23" fill={c} stroke="#fff" strokeWidth="4" />
      <g fill="#fff">
        {glyph === "person" && <><circle cy="-6" r="5.500" /><path d="M -11 11 q 11 -18 22 0z" /></>}
        {glyph === "people" && <><circle cx="-6" cy="-6" r="4.500" /><path d="M -15 11 q 9 -16 18 0z" /><circle cx="7" cy="-3" r="3.800" opacity="0.8" /><path d="M -1 11 q 8 -13 16 0z" opacity="0.8" /></>}
        {glyph === "building" && <><rect x="-11" y="-3" width="9" height="15" rx="1.500" /><rect x="-1" y="-12" width="12" height="24" rx="1.500" /><g fill={c}><rect x="2" y="-8" width="2.500" height="3" /><rect x="6.500" y="-8" width="2.500" height="3" /><rect x="2" y="-2" width="2.500" height="3" /><rect x="6.500" y="-2" width="2.500" height="3" /></g></>}
        {glyph === "briefcase" && <><rect x="-11" y="-5" width="22" height="16" rx="3" /><path d="M -4 -5 V -8 H 4 V -5" fill="none" stroke="#fff" strokeWidth="2.500" /><rect x="-11" y="1" width="22" height="2.500" fill={c} opacity="0.5" /></>}
        {glyph === "tick" && <path d="M -9 1 L -3 7 L 9 -7" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
        {glyph === "hidden" && <><path d="M -12 0 Q 0 -11 12 0 Q 0 11 -12 0 Z" /><circle r="4" fill={c} /><path d="M -11 11 L 11 -11" stroke={c} strokeWidth="5" /><path d="M -11 11 L 11 -11" stroke="#fff" strokeWidth="2.500" strokeLinecap="round" /></>}
      </g>
    </g>
  );
}

// A small envelope that travels along a path and then disappears: an application, a request, a letter. `fade` is how clear it still is when it arrives (1 is fully, lower is dimmer).
export const Letter = ({ path, begin = "0s", colour, dur = "4.8s", fade = 1 }) => (
  <g opacity="0">
    <rect x="-10" y="-7" width="20" height="14" rx="3" fill="#fff" stroke={colour} strokeWidth="2" /><path d="M -10 -6 L 0 2 L 10 -6" fill="none" stroke={colour} strokeWidth="2" strokeLinejoin="round" />
    <animateMotion dur={dur} begin={begin} repeatCount="indefinite" path={path} keyPoints="0;1;1" keyTimes="0;0.8;1" calcMode="linear" />
    <animate attributeName="opacity" values={`0;1;${fade};0;0`} keyTimes="0;0.08;0.74;0.82;1" dur={dur} begin={begin} repeatCount="indefinite" />
  </g>
);
