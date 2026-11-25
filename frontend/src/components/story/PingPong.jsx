/** @jsxImportSource react */
import { useReducedMotion } from "motion/react";
import { useGo } from "./useGo";
import { lowData } from "../../lib/lowData";
import { usePhone } from "../../lib/usePhone";
import "../../pingpong.css";

// "Ping pong" drawn as a rally: the bill is lobbed from one House to the other each time one of them has changed it, until both agree and it lands on the gold seal of Royal Assent. The landings are
// the real dates of the Act the page follows, taken from Parliament's bills database, so a different Act gives a different rally. It plays once when it scrolls into view and ends on the seal; with
// calmer motion it is simply shown finished. The stops are spaced evenly: the gaps between dates (a weekend, say) are not drawn to scale.
//   start  { house, label, short }   where the rally begins: the last stage before the Houses start to trade changes
//   rounds [{ house, short, long }]  each time a House considers the other's changes, in order
//   end    { label, short }          Royal Assent

const COLOUR = { Commons: "#2F7D52", Lords: "#A8323E" };
const GOLD = "#B8862B";
const HOP = 1.0; // seconds a lob takes
const DWELL = 0.4; // seconds the bill rests at each landing

// On the tall picture a label has under 100px beside its dot, so it is broken into lines of at most 16 characters.
function wrap(text, max = 16) {
  const lines = [];
  text.split(" ").forEach((w) => {
    const last = lines[lines.length - 1];
    if (last !== undefined && `${last} ${w}`.length <= max) lines[lines.length - 1] = `${last} ${w}`; else lines.push(w);
  });
  return lines;
}

function arc(p, q, lift, k = 9) {
  const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2 - lift];
  return Array.from({ length: k }, (_, s) => {
    const t = (s + 1) / k;
    return [(1 - t) ** 2 * p[0] + 2 * (1 - t) * t * m[0] + t ** 2 * q[0], (1 - t) ** 2 * p[1] + 2 * (1 - t) * t * m[1] + t ** 2 * q[1]];
  });
}

export default function PingPong({ start, rounds, end }) {
  const [ref, go] = useGo(0.3);
  const phone = usePhone();
  const still = useReducedMotion() || lowData();
  const tall = phone;
  const events = [{ ...start, kind: "start" }, ...rounds.map((r) => ({ ...r, kind: "round" }))];
  const W = tall ? 340 : 760;
  const lane = tall ? { Commons: 116, Lords: 226 } : { Commons: 64, Lords: 176 };
  const gap = tall ? 74 : 92;
  const first = tall ? 86 : 150;
  // The position of each landing, and of the seal at the end.
  const pos = events.map((e, i) => (tall ? [lane[e.house], first + i * gap] : [first + i * gap, lane[e.house]]));
  const seal = tall ? [W / 2, first + events.length * gap + 36] : [first + events.length * gap + 38, (lane.Commons + lane.Lords) / 2];
  const H = tall ? seal[1] + 74 : 240;
  const sr = tall ? 44 : 46;

  // The bill's flight: along each arc in turn, resting a moment at each landing.
  const path = [...pos, seal];
  const hops = path.length - 1;
  const total = hops * (HOP + DWELL);
  const lift = tall ? 0 : 44; // how high a lob rises on the wide picture; on the tall one the bill goes straight down the page
  const stops = [[0, path[0]]];
  for (let h = 0; h < hops; h++) {
    const t0 = h * (HOP + DWELL);
    const pts = arc(path[h], path[h + 1], lift, 10);
    pts.forEach((pt, s) => stops.push([((t0 + HOP * ((s + 1) / pts.length)) / total) * 100, pt]));
    if (h < hops - 1) stops.push([((t0 + HOP + DWELL) / total) * 100, path[h + 1]]);
  }
  // The last frame is explicit: the bill settles into the seal and fades, and does not snap back to where it started.
  stops.push([100, path[hops]]);
  const frames = stops.map(([p, [x, y]], i) => `${p.toFixed(2)}% { transform: translate(${x.toFixed(1)}px, ${y.toFixed(1)}px); opacity: ${i === stops.length - 1 ? 0 : 1}; }`).join(" ");
  // When the bill reaches landing i, in seconds after the picture is drawn; the seal is landing number `hops`.
  const arriveAt = (i) => (i === 0 ? 0.2 : 0.5 + (i - 1) * (HOP + DWELL) + HOP);
  const label = (e, i) => {
    const [x, y] = pos[i];
    const side = tall ? (e.house === "Commons" ? "left" : "right") : e.house === "Commons" ? "above" : "below";
    const lx = tall ? (side === "left" ? x - 20 : x + 20) : x;
    const ly = tall ? y - 3 : side === "above" ? y - 30 : y + 36;
    const anchor = tall ? (side === "left" ? "end" : "start") : "middle";
    return { lx, ly, anchor };
  };

  return (
    <figure ref={ref} className="lwp" data-go={go} data-still={still ? "1" : "0"} data-tall={tall ? "1" : "0"} style={{ "--end": `${(0.5 + total).toFixed(2)}s` }}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`The bill passes between the two Houses ${rounds.length} times, on ${rounds.map((r) => r.long).join(", ")}, then receives Royal Assent on ${end.long}.`}>
        <style>{`.lwp[data-go="1"][data-still="0"] .lwp-ball { animation: lwpFly ${total.toFixed(2)}s linear 0.5s both; } @keyframes lwpFly { ${frames} }`}</style>

        {/* the two lanes */}
        {["Commons", "Lords"].map((h) => (
          <g key={h} className="lwp-lane" style={{ "--c": COLOUR[h] }}>
            {tall
              ? <><rect x={lane[h] - 38} y={6} width={76} height={28} rx={14} fill={COLOUR[h]} /><text x={lane[h]} y={25} textAnchor="middle" className="lwp-hd">{h}</text><line x1={lane[h]} x2={lane[h]} y1={40} y2={seal[1] - sr - 10} className="lwp-line" stroke={COLOUR[h]} /></>
              : <><rect x={2} y={lane[h] - 14} width={96} height={28} rx={14} fill={COLOUR[h]} /><text x={50} y={lane[h] + 5} textAnchor="middle" className="lwp-hd">{h}</text><line x1={108} x2={seal[0] - sr - 18} y1={lane[h]} y2={lane[h]} className="lwp-line" stroke={COLOUR[h]} /></>}
          </g>
        ))}

        {/* the path the bill took, drawn faintly so the rally can be read even when nothing moves */}
        <path className="lwp-trail" d={path.map((q, i) => (i === 0 ? `M${q[0]} ${q[1]}` : `Q${(path[i - 1][0] + q[0]) / 2} ${(path[i - 1][1] + q[1]) / 2 - lift} ${q[0]} ${q[1]}`)).join(" ")} fill="none" />

        {/* the landings */}
        {events.map((e, i) => {
          const [x, y] = pos[i];
          const { lx, ly, anchor } = label(e, i);
          return (
            <g key={i} className="lwp-node" style={{ "--c": COLOUR[e.house], "--at": `${arriveAt(i).toFixed(2)}s` }}>
              <circle className="lwp-ring" cx={x} cy={y} r={20} fill="none" stroke={COLOUR[e.house]} strokeWidth="3" />
              <circle cx={x} cy={y} r={12} fill={COLOUR[e.house]} stroke="#fff" strokeWidth="3" />
              <text x={x} y={y + 4.5} textAnchor="middle" className="lwp-n">{i === 0 ? "" : i}</text>
              <text x={lx} y={ly} textAnchor={anchor} className="lwp-d">{e.short}</text>
              <text x={lx} y={ly + 14} textAnchor={anchor} className="lwp-w">{tall ? wrap(e.label).map((t, k) => <tspan key={k} x={lx} dy={k === 0 ? 0 : 13}>{t}</tspan>) : e.label}</text>
            </g>
          );
        })}

        {/* the seal */}
        <g className="lwp-seal" style={{ "--at": `${arriveAt(hops).toFixed(2)}s` }}>
          <circle className="lwp-halo" cx={seal[0]} cy={seal[1]} r={sr + 12} fill="none" stroke={GOLD} strokeWidth="2.5" strokeDasharray="3 7" />
          <circle cx={seal[0]} cy={seal[1]} r={sr} fill={GOLD} />
          <circle cx={seal[0]} cy={seal[1]} r={sr - 9} fill="none" stroke="#FFF6DC" strokeWidth="2" />
          <text x={seal[0]} y={seal[1] - 3} textAnchor="middle" className="lwp-s1">Royal</text>
          <text x={seal[0]} y={seal[1] + 19} textAnchor="middle" className="lwp-s1">Assent</text>
          <text x={seal[0]} y={seal[1] + sr + 32} textAnchor="middle" className="lwp-d">{end.short}</text>
        </g>

        <g className="lwp-ball"><g transform="translate(-14 -16)"><path d="M3 1h14l7 7v21H3z" fill="#fff" stroke="#1B2A44" strokeWidth="2" strokeLinejoin="round" /><path d="M17 1v7h7" fill="#E8EDF6" stroke="#1B2A44" strokeWidth="2" strokeLinejoin="round" /><path d="M7 14h13M7 19h13M7 24h8" stroke="#1B2A44" strokeWidth="2" strokeLinecap="round" /></g></g>
      </svg>
      <figcaption>
        {rounds.length === 1 ? "Once" : `${rounds.length} times`}, one House changed the bill and sent it back. Each dot is a House considering the other&apos;s changes, on the day it did. When both agree, the King gives Royal Assent.
        <span className="sr-only"> The rally begins with {start.label} on {start.long}.</span>
      </figcaption>
    </figure>
  );
}
