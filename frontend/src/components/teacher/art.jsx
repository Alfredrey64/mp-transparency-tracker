/** @jsxImportSource react */
// The pieces the story pictures are drawn from: flat, friendly shapes in the site's colours. Everything is drawn on an 800 by 450 sheet with the
// ground at y = 360. A piece never carries its own transform on the group that is animated: the animation owns that, so each piece positions
// itself with its own inner group.

import { useContext } from "react";
import { INK, SKIN } from "./palette";
import { NamesContext } from "./characters";

export function Sky({ tone = "#DCEBFF", tone2 = "#F4F8FF" }) {
  const still = stillMotion();
  return (
    <>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={tone} /><stop offset="1" stopColor={tone2} /></linearGradient>
        <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#FFF4C7" stopOpacity="0.95" /><stop offset="0.35" stopColor="#FFF0B8" stopOpacity="0.45" /><stop offset="1" stopColor="#FFF0B8" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="800" height="450" fill="url(#sky)" />
      <circle cx="748" cy="44" r="150" fill="url(#sun)">{!still && <animate attributeName="r" values="150;166;150" dur="9s" repeatCount="indefinite" />}</circle>
      <circle cx="748" cy="44" r="22" fill="#FFF1B0" opacity="0.8" />
      <g aria-hidden="true">
        <path d="M-60 318 Q30 276 140 306 T360 300 T560 286 T800 304 T860 300 V362 H-60Z" fill="#C6DDD0" opacity="0.7">
          {!still && <animateTransform attributeName="transform" type="translate" values="0 0;-24 0;0 0" dur="46s" repeatCount="indefinite" />}
        </path>
        <path d="M-60 336 Q80 304 220 332 T500 326 T800 322 T860 326 V362 H-60Z" fill="#B3D6BC" opacity="0.85">
          {!still && <animateTransform attributeName="transform" type="translate" values="0 0;18 0;0 0" dur="34s" repeatCount="indefinite" />}
        </path>
        {!still && [0, 1, 2].map((i) => (
          <g key={i}>
            <path d="M0 0 q5 -6 10 0 q5 -6 10 0" fill="none" stroke="#5B6B86" strokeWidth="1.8" strokeLinecap="round" opacity="0.55" transform={`translate(${-60 - i * 26} ${26 + i * 12}) scale(${1 - i * 0.15})`}>
              <animateTransform attributeName="transform" type="translate" additive="sum" from="0 0" to="940 -14" dur={`${52 + i * 9}s`} begin={`${-(i * 17)}s`} repeatCount="indefinite" />
            </path>
          </g>
        ))}
      </g>
    </>
  );
}

// A small repeatable "random": the same picture every time it is drawn, so nothing jumps when a slide is redrawn.
const wob = (i, k) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };

// The ground, a path along its top edge and a row of grass tufts and flowers that sway in a breeze, each a little out of step with its neighbours.
export function Ground({ colour = "#CFE6CF", path = "#E9E1D0" }) {
  const blade = `color-mix(in srgb, ${colour} 55%, #2F8F3C)`;
  const tufts = Array.from({ length: 36 }, (_, i) => {
    const x = 10 + i * 22 + wob(i, 1) * 10;
    const h = 11 + wob(i, 2) * 9;
    return { x, h, d: -wob(i, 3) * 4, flower: i % 7 === 3 };
  });
  return (
    <>
      <rect x="0" y="360" width="800" height="90" fill={colour} />
      <rect x="0" y="360" width="800" height="26" fill={path} />
      <g aria-hidden="true">
        {tufts.map((t, i) => (
          <g key={i} transform={`translate(${t.x.toFixed(1)} 392)`}>
            <g className="t-sway" style={{ animationDelay: `${t.d.toFixed(2)}s`, animationDuration: `${(2.6 + wob(i, 4) * 1.6).toFixed(2)}s` }}>
              <path d={`M-4 0 q1 -${(t.h * 0.7).toFixed(1)} 0 -${t.h.toFixed(1)} q4 ${(t.h * 0.35).toFixed(1)} 4 ${t.h.toFixed(1)}z`} fill={blade} />
              <path d={`M1 0 q2 -${(t.h * 0.6).toFixed(1)} 5 -${(t.h * 0.85).toFixed(1)} q0 ${(t.h * 0.4).toFixed(1)} -1 ${(t.h * 0.85).toFixed(1)}z`} fill={blade} opacity="0.85" />
              {t.flower && <g transform={`translate(2 -${(t.h + 3).toFixed(1)})`}><circle r="3.2" fill={["#F2B632", "#E0365B", "#fff"][i % 3]} /><circle r="1.2" fill="#8A5A0E" /></g>}
            </g>
          </g>
        ))}
      </g>
    </>
  );
}

// A cloud that drifts slowly across and rises and falls a little, at a pace of its own.
export function Cloud({ x, y, s = 1, delay = 0 }) {
  const seed = Math.abs(x * 3 + y * 7);
  return (
    <g className="t-cloud" style={{ animationDelay: `${delay}s`, animationDuration: `${34 + (seed % 17)}s`, "--cx": `${50 + (seed % 40)}px` }}>
      <g className="t-bobble" style={{ animationDelay: `${-(seed % 5)}s`, animationDuration: `${6 + (seed % 4)}s` }}>
        <g transform={`translate(${x} ${y}) scale(${s})`} fill="#fff" opacity="0.94">
          <ellipse cx="0" cy="0" rx="46" ry="16" />
          <ellipse cx="-20" cy="-10" rx="22" ry="16" />
          <ellipse cx="14" cy="-14" rx="26" ry="19" />
          <ellipse cx="36" cy="-4" rx="18" ry="12" />
        </g>
      </g>
    </g>
  );
}

// A tree at the edge of a scene: the whole crown sways from the trunk, and the leaves shimmer as if in a breeze.
export function Tree({ x, y = 392, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} aria-hidden="true">
      <ellipse cx="0" cy="2" rx="30" ry="6" fill="#000" opacity="0.08" />
      <rect x="-7" y="-70" width="14" height="72" rx="5" fill="#8A5A3C" />
      <g className="t-tree">
        <circle cx="-22" cy="-92" r="30" fill="#4FA85E" />
        <circle cx="22" cy="-92" r="30" fill="#4FA85E" />
        <circle cx="0" cy="-118" r="34" fill="#5CB96B" />
        <circle cx="-8" cy="-96" r="26" fill="#68C477" opacity="0.9" />
      </g>
    </g>
  );
}

// A person standing with their feet at (x, y). `kid` makes them smaller and rounder. `mood`: ok, worried, happy, thinking.
// A small name tag under someone's feet. `who` is one of the four children (their name comes from the class's choice); `tag` is a fixed word such as "Dad".
function NameTag({ x, y, text, accent }) {
  const w = Math.max(44, text.length * 8.6 + 20);
  return (
    <g transform={`translate(${x} ${y + 24})`} className="t-tag">
      <rect x={-w / 2} y="-12" width={w} height="24" rx="12" fill="#fff" fillOpacity="0.94" stroke={accent} strokeWidth="2" />
      <text y="5.5" textAnchor="middle" fontSize="14.5" fontWeight="800" fontFamily="Figures, Public Sans, system-ui, sans-serif" fill="#1B2438">{text}</text>
    </g>
  );
}

export function Person({ x, y, s = 1, skin = SKIN[1], shirt = "#1E4FB8", trousers = "#2D3A55", hair = "#3B2A20", kid = false, mood = "ok", long = false, flip = false, who, tag }) {
  const names = useContext(NamesContext);
  const label = who ? names[who] : tag;
  const k = (kid ? 0.74 : 1) * s;
  const mouth = {
    ok: <path d="M-5 -93 q5 3 10 0" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />,
    happy: <path d="M-7 -95 q7 8 14 0" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />,
    worried: <path d="M-6 -90 q6 -5 12 0" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />,
    thinking: <path d="M-5 -92 h10" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />,
  }[mood];
  return (
    <>
    {label && <NameTag x={x} y={y} text={label} accent={shirt} />}
    <g transform={`translate(${x} ${y}) scale(${flip ? -k : k} ${k})`}>
      <ellipse cx="0" cy="2" rx="26" ry="5" fill="#000" opacity="0.1" />
      <g className="t-idle" style={{ animationDelay: `${-((Math.abs(x) * 7 + Math.abs(y)) % 40) / 10}s` }}>
      <rect x="-15" y="-36" width="11" height="36" rx="5" fill={trousers} />
      <rect x="4" y="-36" width="11" height="36" rx="5" fill={trousers} />
      <rect x="-31" y="-80" width="12" height="40" rx="6" fill={shirt} />
      <rect x="19" y="-80" width="12" height="40" rx="6" fill={shirt} />
      <circle cx="-25" cy="-38" r="6" fill={skin} />
      <circle cx="25" cy="-38" r="6" fill={skin} />
      <rect x="-21" y="-84" width="42" height="54" rx="17" fill={shirt} />
      {long && <path d="M-19 -108 q-6 22 -2 40 l7 -6 l0 -30z M19 -108 q6 22 2 40 l-7 -6 l0 -30z" fill={hair} />}
      <circle cx="0" cy="-101" r="18" fill={skin} />
      <path d={long ? "M-19 -104 a19 19 0 0 1 38 0 q-19 -12 -38 0z" : "M-18 -105 a18 18 0 0 1 36 0 q-18 -9 -36 0z"} fill={hair} />
      <g className="t-eyes" style={{ animationDelay: `${-((Math.abs(x) * 13 + Math.abs(y) * 3) % 50) / 10}s` }}>
        <circle cx="-6.5" cy="-101" r="2.3" fill={INK} />
        <circle cx="6.5" cy="-101" r="2.3" fill={INK} />
      </g>
      {mood === "worried" && <path d="M-11 -108 l7 -3 M11 -108 l-7 -3" stroke={INK} strokeWidth="2" strokeLinecap="round" />}
      {mouth}
      </g>
    </g>
    </>
  );
}

// Money travelling from one place to another along a curve: coins leave, arc through the air, and each one lands with a soft green ring where it arrives.
export function MoneyFlow({ from, to, lift = 70, coins = 3, dur = 3.8 }) {
  const still = stillMotion();
  const [x1, y1] = from;
  const [x2, y2] = to;
  const cx = (x1 + x2) / 2;
  const cy = Math.min(y1, y2) - lift;
  const d = `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`;
  const at = (t) => [(1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2, (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2];
  return (
    <g aria-hidden="true">
      <path d={d} stroke="#8FAEE8" strokeWidth="3" strokeDasharray="1 9" strokeLinecap="round" fill="none" />
      {Array.from({ length: coins }, (_, i) => {
        const begin = `${-((i * dur) / coins).toFixed(2)}s`;
        if (still) { const [x, y] = at(0.2 + (i * 0.6) / Math.max(coins - 1, 1)); return <Coin key={i} x={x} y={y} r={12} />; }
        return (
          <g key={i}>
            <circle cx={x2} cy={y2} r="6" fill="none" stroke="#16A34A" strokeWidth="3" opacity="0">
              <animate attributeName="r" values="6;6;10;30" keyTimes="0;0.86;0.9;1" dur={`${dur}s`} begin={begin} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;0;0.85;0" keyTimes="0;0.86;0.9;1" dur={`${dur}s`} begin={begin} repeatCount="indefinite" />
            </circle>
            <g opacity="0">
              <Coin x={0} y={0} r={12} />
              <animateMotion path={d} dur={`${dur}s`} begin={begin} repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.35 0 0.55 1" />
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.86;1" dur={`${dur}s`} begin={begin} repeatCount="indefinite" />
            </g>
          </g>
        );
      })}
    </g>
  );
}

export function Coin({ x, y, r = 14 }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill="#F2B632" stroke="#C7871A" strokeWidth="2.5" />
      <text y={r * 0.36} textAnchor="middle" fontSize={r * 1.15} fontWeight="800" fontFamily="Figures, Public Sans, system-ui, sans-serif" fill="#8A5A0E">£</text>
    </g>
  );
}

// A short caption in the picture, on a small white label so it reads over anything behind it and is centred in its own box.
export function Caption({ x, y, size = 18, fill = "#0B1B33", anchor = "middle", children }) {
  const text = String(children);
  if (anchor !== "middle") return <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight="800" fontFamily="Figures, Public Sans, system-ui, sans-serif" fill={fill} stroke="#F4F8FF" strokeWidth={size * 0.28} paintOrder="stroke" strokeLinejoin="round">{children}</text>;
  const w = Math.round(text.length * size * 0.56 + size * 1.5);
  const h = Math.round(size * 1.75);
  return (
    <g>
      <rect x={x - w / 2} y={y - size * 0.35 - h / 2} width={w} height={h} rx={h / 2} fill="#fff" fillOpacity="0.93" stroke="#CBD3E2" strokeWidth="1.5" />
      <text x={x} y={y} textAnchor="middle" fontSize={size} fontWeight="800" fontFamily="Figures, Public Sans, system-ui, sans-serif" fill={fill}>{children}</text>
    </g>
  );
}

export function Bubble({ x, y, w = 90, h = 70, tail = "left", children, fill = "#fff", stroke = "#CBD3E2" }) {
  // The tail is drawn over the bottom edge of the box; a small patch of the fill hides the edge's line only where the tail joins, and nowhere else.
  const base = tail === "left" ? [x + 18, x + 34] : tail === "right" ? [x + w - 34, x + w - 18] : [x + w / 2 - 12, x + w / 2 + 12];
  const t = tail === "left" ? `M${x + 18} ${y + h - 1} l-14 20 l30 -20z` : tail === "right" ? `M${x + w - 18} ${y + h - 1} l14 20 l-30 -20z` : `M${x + w / 2 - 12} ${y + h - 1} l12 22 l12 -22z`;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="22" fill={fill} stroke={stroke} strokeWidth="2.5" />
      <path d={t} fill={fill} stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />
      <rect x={base[0] + 2.5} y={y + h - 2.6} width={base[1] - base[0] - 5} height="3.4" fill={fill} />
      <g transform={`translate(${x + w / 2} ${y + h / 2})`}>{children}</g>
    </g>
  );
}

export function Shop({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="115" cy="4" rx="133" ry="9" fill="#000" opacity="0.09" />
      <rect x="0" y="-150" width="230" height="150" rx="8" fill="#F7E3C4" />
      <rect x="-8" y="-170" width="246" height="34" rx="6" fill="#C0392B" />
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={-8 + i * 41} y="-170" width="20.5" height="34" fill="#fff" opacity="0.88" />)}
      <rect x="20" y="-118" width="110" height="78" rx="6" fill="#BFE0F5" />
      <rect x="20" y="-118" width="110" height="78" rx="6" fill="none" stroke="#fff" strokeWidth="4" />
      <rect x="28" y="-62" width="20" height="20" rx="3" fill="#E0775A" /><rect x="54" y="-70" width="16" height="28" rx="3" fill="#6AB023" /><rect x="76" y="-60" width="22" height="18" rx="3" fill="#F2B632" /><rect x="102" y="-68" width="18" height="26" rx="3" fill="#7A5AF0" />
      <rect x="152" y="-110" width="58" height="110" rx="6" fill="#8A5A3C" /><circle cx="198" cy="-52" r="4" fill="#F2B632" />
      <rect x="62" y="-166" width="106" height="26" rx="6" fill="#fff" /><text x="115" y="-146" textAnchor="middle" fontSize="20" fontWeight="800" fontFamily="Figures, Public Sans, system-ui, sans-serif" fill="#8E241A">SHOP</text>
    </g>
  );
}

export function Basket({ x, y, full = true }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-26 -34 q26 -34 52 0" fill="none" stroke="#8A5A3C" strokeWidth="5" strokeLinecap="round" />
      {full && <><circle cx="-12" cy="-30" r="9" fill="#E0775A" /><circle cx="8" cy="-33" r="9" fill="#6AB023" /><rect x="-2" y="-46" width="12" height="20" rx="4" fill="#F2B632" /></>}
      <path d="M-34 -28 h68 l-8 30 h-52z" fill="#C98F66" />
      <path d="M-30 -18 h60 M-28 -8 h56" stroke="#8A5A3C" strokeWidth="2.5" />
    </g>
  );
}

export function Parliament({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-110" y="-70" width="220" height="70" fill="#E7D9B0" />
      {Array.from({ length: 11 }, (_, i) => <rect key={i} x={-102 + i * 19} y="-60" width="8" height="46" rx="4" fill="#C9B77F" />)}
      <rect x="-118" y="-78" width="236" height="12" rx="3" fill="#D6C48E" />
      <rect x="60" y="-196" width="40" height="126" fill="#E7D9B0" />
      <rect x="55" y="-216" width="50" height="26" fill="#D6C48E" />
      <path d="M55 -216 l25 -34 l25 34z" fill="#8FA39A" />
      <circle cx="80" cy="-166" r="13" fill="#fff" stroke="#8A7A44" strokeWidth="3" />
      <path d="M80 -166 v-8 M80 -166 l6 4" stroke="#8A7A44" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="-88" y="-110" width="26" height="42" fill="#D6C48E" /><path d="M-92 -110 l17 -26 l17 26z" fill="#8FA39A" />
      <rect x="-30" y="-100" width="26" height="32" fill="#D6C48E" /><path d="M-34 -100 l17 -22 l17 22z" fill="#8FA39A" />
    </g>
  );
}

export function BallotBox({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-42" y="-78" width="84" height="78" rx="8" fill="#1E4FB8" />
      <rect x="-42" y="-78" width="84" height="16" rx="6" fill="#16398A" />
      <rect x="-22" y="-71" width="44" height="6" rx="3" fill="#0B1B33" />
      <path d="M-14 -44 l9 9 l17 -19" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

export function Paper({ x, y, rot = 0 }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x="-14" y="-18" width="28" height="36" rx="3" fill="#fff" stroke="#CBD3E2" strokeWidth="2" />
      <path d="M-8 -8 h16 M-8 0 h16 M-8 8 h10" stroke="#CBD3E2" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

export function Hospital({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="100" cy="4" rx="115" ry="9" fill="#000" opacity="0.09" />
      <rect x="0" y="-170" width="200" height="170" rx="8" fill="#EAF2FA" />
      <rect x="70" y="-215" width="60" height="50" rx="6" fill="#fff" stroke="#D3DEEA" strokeWidth="3" />
      <rect x="94" y="-206" width="12" height="32" fill="#E0365B" /><rect x="84" y="-196" width="32" height="12" fill="#E0365B" />
      {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => <rect key={`${r}${c}`} x={20 + c * 42} y={-150 + r * 38} width="26" height="24" rx="4" fill="#BFE0F5" />))}
      <rect x="82" y="-40" width="36" height="40" rx="5" fill="#8EA6C0" />
    </g>
  );
}

export function Calendar({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-48" y="-56" width="96" height="104" rx="12" fill="#fff" stroke="#CBD3E2" strokeWidth="3" />
      <rect x="-48" y="-56" width="96" height="26" rx="12" fill="#E0365B" />
      <rect x="-48" y="-44" width="96" height="14" fill="#E0365B" />
      {[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => <circle key={`${r}${c}`} cx={-30 + c * 20} cy={-12 + r * 17} r="4.5" fill={r === 3 && c === 3 ? "#E0365B" : "#CBD3E2"} />))}
    </g>
  );
}

// The hands turn clockwise by an animation written into the picture itself, so they always start from the top and turn the right way round
// whichever browser draws them. For anyone who has asked for less motion they stand still.
const stillMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function Clock({ x, y }) {
  const still = stillMotion();
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="34" fill="#fff" stroke="#CBD3E2" strokeWidth="4" />
      {[0, 90, 180, 270].map((a) => <path key={a} d="M0 -29 v5" stroke="#CBD3E2" strokeWidth="3" strokeLinecap="round" transform={`rotate(${a})`} />)}
      <path d="M0 0 v-14" stroke={INK} strokeWidth="4.5" strokeLinecap="round" transform="rotate(300)">
        {!still && <animateTransform attributeName="transform" type="rotate" from="300 0 0" to="660 0 0" dur="96s" repeatCount="indefinite" />}
      </path>
      <path d="M0 0 v-23" stroke={INK} strokeWidth="3.2" strokeLinecap="round">
        {!still && <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="8s" repeatCount="indefinite" />}
      </path>
      <circle r="4" fill={INK} />
    </g>
  );
}

export function School({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="125" cy="4" rx="145" ry="9" fill="#000" opacity="0.09" />
      <rect x="0" y="-130" width="250" height="130" rx="6" fill="#E9B88A" />
      <path d="M-10 -130 l135 -52 l135 52z" fill="#B5533C" />
      <rect x="100" y="-90" width="50" height="90" rx="5" fill="#8A5A3C" />
      {[0, 1].map((i) => <rect key={i} x={20 + i * 160} y="-100" width="46" height="40" rx="4" fill="#BFE0F5" />)}
      {[0, 1].map((i) => <rect key={i} x={26 + i * 160} y="-48" width="34" height="30" rx="4" fill="#BFE0F5" opacity="0.8" />)}
      <rect x="123" y="-232" width="4" height="50" fill="#8A7A74" /><path d="M127 -232 h40 l-10 12 l10 12 h-40z" fill="#1E4FB8" />
    </g>
  );
}

export function Drip({ x, y }) {
  return <ellipse className="t-drip" cx={x} cy={y} rx="4" ry="6" fill="#4DA3E6" />;
}

export function Books({ x, y, few = false }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="0" y="-16" width="62" height="16" rx="3" fill="#7A5AF0" />
      {!few && <rect x="6" y="-32" width="54" height="16" rx="3" fill="#E0365B" />}
      {!few && <rect x="2" y="-48" width="58" height="16" rx="3" fill="#0E9AA7" />}
    </g>
  );
}

export function Letter({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-30" y="-20" width="60" height="40" rx="5" fill="#fff" stroke="#CBD3E2" strokeWidth="2.5" />
      <path d="M-30 -18 l30 24 l30 -24" fill="none" stroke="#CBD3E2" strokeWidth="2.5" strokeLinejoin="round" />
    </g>
  );
}

export function BusStop({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-4" y="-130" width="8" height="130" fill="#6B7A90" />
      <rect x="-30" y="-168" width="60" height="42" rx="8" fill="#E0365B" />
      <text y="-138" textAnchor="middle" fontSize="26" fontWeight="800" fontFamily="Figures, Public Sans, system-ui, sans-serif" fill="#fff">12</text>
    </g>
  );
}

export function Bus({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="0" y="-92" width="250" height="84" rx="16" fill="#E0365B" />
      <rect x="0" y="-48" width="250" height="14" fill="#B52746" />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={20 + i * 52} y="-80" width="40" height="30" rx="6" fill="#BFE0F5" />)}
      <rect x="214" y="-80" width="26" height="62" rx="5" fill="#BFE0F5" />
      <circle cx="56" cy="-6" r="19" fill="#2D3A55" /><circle cx="56" cy="-6" r="8" fill="#9AA6B8" />
      <circle cx="190" cy="-6" r="19" fill="#2D3A55" /><circle cx="190" cy="-6" r="8" fill="#9AA6B8" />
      <text x="125" y="-56" textAnchor="middle" fontSize="0" fill="#fff">12</text>
    </g>
  );
}

export function TownHall({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="110" cy="4" rx="127" ry="9" fill="#000" opacity="0.09" />
      <rect x="0" y="-110" width="220" height="110" fill="#E9D8B6" />
      <path d="M-10 -110 l120 -52 l120 52z" fill="#B58A5A" />
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={16 + i * 40} y="-92" width="14" height="76" rx="4" fill="#CDB892" />)}
      <rect x="92" y="-56" width="36" height="56" rx="4" fill="#8A5A3C" />
      <circle cx="110" cy="-130" r="12" fill="#fff" stroke="#8A7A44" strokeWidth="3" />
    </g>
  );
}

export function Bulb({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="t-glow">
        <circle r="34" fill="#F2B632" opacity="0.28" />
        <path d="M0 -22 a16 16 0 0 1 10 28 v8 h-20 v-8 a16 16 0 0 1 10 -28z" fill="#F7D56B" stroke="#C7871A" strokeWidth="2.5" />
        <rect x="-8" y="16" width="16" height="6" rx="3" fill="#8A7A74" />
      </g>
    </g>
  );
}

export function QuestionMark({ s = 1 }) {
  return <text textAnchor="middle" y={14 * s} fontSize={44 * s} fontWeight="800" fontFamily="Figures, Newsreader, Georgia, serif" fill="#1E4FB8">?</text>;
}

export function Arrow({ x, y, up = true }) {
  return (
    <g transform={`translate(${x} ${y}) ${up ? "" : "rotate(180)"}`}>
      <path d="M0 14 V-12 M-10 -2 L0 -14 L10 -2" fill="none" stroke="#E0365B" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

// A burst of paper confetti that falls once, from the top of the picture. Pieces are fixed, not random, so it looks the same every time.
const CONFETTI = ["#E0367A", "#F2B632", "#1E4FB8", "#16A34A", "#7A5AF0", "#0E9AA7"];
export function Confetti({ x = 400, y = 20, spread = 330, n = 34, delay = 0 }) {
  return (
    <g aria-hidden="true">
      {Array.from({ length: n }, (_, i) => {
        const px = x + (((i * 97) % 100) / 100 - 0.5) * spread * 2;
        const w = 7 + (i % 3) * 3;
        return (
          <rect key={i} className="t-confetti" x={px} y={y} width={w} height={w * 1.7} rx="2" fill={CONFETTI[i % CONFETTI.length]}
            style={{ "--dx": `${(((i * 53) % 60) - 30)}px`, "--r": `${(i % 2 ? 1 : -1) * (240 + (i % 5) * 70)}deg`, animationDelay: `${delay + (i % 9) * 70}ms`, animationDuration: `${1.9 + (i % 4) * 0.25}s` }} />
        );
      })}
    </g>
  );
}

// Lines that fly out from a point, to mark a moment: a stamp coming down, a law passing.
export function Burst({ x, y, r = 56, colour = "#F2B632", delay = 0 }) {
  return (
    <g transform={`translate(${x} ${y})`} aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <line key={i} className="t-ray" x1={Math.cos(a) * r * 0.55} y1={Math.sin(a) * r * 0.55} x2={Math.cos(a) * r} y2={Math.sin(a) * r} stroke={colour} strokeWidth="5" strokeLinecap="round" style={{ "--rx": `${Math.cos(a) * 14}px`, "--ry": `${Math.sin(a) * 14}px`, animationDelay: `${delay}ms` }} />;
      })}
    </g>
  );
}
