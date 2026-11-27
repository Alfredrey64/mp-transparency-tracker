/** @jsxImportSource react */
import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useGo } from "./useGo";
import "../../advisers.css";

// The three pictures inside the figures at the top of the Special advisers page. Each is drawn from the same numbers the figure above it states, plays once when it scrolls into view,
// and is hidden from screen readers, because the number and the line under it already say the same in words.
//   AdviserDots  159 dots that fly in from all over and settle into a grid; the ones on the Prime Minister's team light up gold (and can be pointed at in the key).
//   PayCoins     the pay bill as coins dropping into two piles, last year's and this year's; the extra coins in this year's pile are gold, which is the rise.
//   BandScrub    the four pay bands as ranges on one pound scale with a marker that sweeps across, then follows the pointer: which bands could pay that salary?
const n = (v) => Number(v ?? 0).toLocaleString("en-GB");
const BAND = ["#7B5BD6", "#2C7DA0", "#3F7D5C", "#B7791F"];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const calmNow = () => typeof document !== "undefined" && document.documentElement.hasAttribute("data-calm");

// A repeatable number from 0 to 1 for an index, so each dot starts from the same scattered place every time instead of a different one on each draw.
const scatter = (i, salt) => { const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453; return x - Math.floor(x); };

export function AdviserDots({ count, team = 0 }) {
  const [ref, go] = useGo(0.3);
  const [pointed, setPointed] = useState(null);
  const pm = clamp(team, 0, count);
  const point = (g) => ({ onPointerEnter: () => setPointed(g), onPointerLeave: () => setPointed(null) });
  return (
    <div ref={ref} className="av-art av-crowd" data-go={go} data-hl={pointed ?? undefined}>
      <div className="av-dotgrid">
        {Array.from({ length: count }, (_, i) => (
          <i key={i} className={i < pm ? "pm" : undefined} style={{ "--k": i, "--dx": `${Math.round((scatter(i, 1) - 0.5) * 230)}px`, "--dy": `${Math.round((scatter(i, 2) - 0.5) * 170)}px` }} />
        ))}
      </div>
      {pm > 0 ? (
        <p className="av-legend">
          <span data-g="pm" {...point("pm")}><strong>{pm}</strong> in the Prime Minister's team</span>
          <span data-g="rest" {...point("rest")}><strong>{count - pm}</strong> across other ministers</span>
        </p>
      ) : <p>One dot for each adviser</p>}
    </div>
  );
}

// Each coin is worth a round number of £ million, chosen so the bigger pile is about 36 coins.
const STEPS = [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100];
const COLS = 6;

function pileOf(total, kept, unit, rows, extra) {
  const coins = [];
  for (let k = 0; k * unit < total; k++) {
    const whole = clamp(total / unit - k, 0, 1), blue = clamp(kept / unit - k, 0, 1);
    coins.push({ k, col: (k % COLS) + 1, up: Math.floor(k / COLS), have: whole, blue, gold: whole - blue > 0.001, delay: extra + k * 26 });
  }
  return { coins, rows };
}

export function PayCoins({ now, before }) {
  const [ref, go] = useGo(0.3);
  const top = Math.max(now.value, before.value);
  const unit = STEPS.find((s) => s >= top / 40) ?? STEPS[STEPS.length - 1];
  const rows = Math.ceil(top / unit / COLS);
  const kept = Math.min(now.value, before.value);
  const diff = Math.round((now.value - before.value) * 10) / 10;
  const piles = [
    { label: before.label, text: before.text, ...pileOf(before.value, before.value, unit, rows, 150), then: true },
    { label: now.label, text: now.text, ...pileOf(now.value, kept, unit, rows, 1050), then: false },
  ];
  const last = piles[1].coins.at(-1)?.delay ?? 0;
  return (
    <div ref={ref} className="av-art av-coins" data-go={go}>
      <div className="av-piles">
        {piles.map((p) => (
          <div key={p.label} className="av-pilecol">
            <div className="av-pile" style={{ "--rows": p.rows }}>
              {p.coins.map((c) => (
                <i
                  key={c.k}
                  className={`${p.then ? "then" : "now"}${c.gold && diff > 0 ? " gold" : ""}`}
                  style={{ "--c": c.col, "--r": p.rows - c.up, "--up": c.up, "--n": `${c.have * 100}%`, "--b": `${(c.gold && diff > 0 ? c.blue : c.have) * 100}%`, "--d": `${c.delay + (c.gold && diff > 0 ? 350 : 0)}ms` }}
                />
              ))}
            </div>
            <div className="av-cap"><em>{p.label}</em><strong>{p.text}</strong></div>
          </div>
        ))}
      </div>
      {diff !== 0 && <p className="av-gain" style={{ "--d": `${last + 1100}ms` }}>{diff > 0 ? "Up" : "Down"} £{Math.abs(diff).toFixed(1)}m on the year before</p>}
      <p className="av-coinkey">Each coin is £{unit}m</p>
    </div>
  );
}

// Where on the scale the most bands overlap: the middle of the first stretch covered by the most bands.
function busiest(bands, lo, hi) {
  const edges = [...new Set(bands.flatMap((b) => [b.from, b.to]))].sort((a, b) => a - b);
  let best = { count: -1, at: (lo + hi) / 2 };
  for (let i = 0; i < edges.length - 1; i++) {
    const mid = (edges[i] + edges[i + 1]) / 2;
    const count = bands.filter((b) => b.from <= mid && mid <= b.to).length;
    if (count > best.count) best = { count, at: mid };
  }
  return (best.at - lo) / (hi - lo);
}

const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function BandScrub({ bands, counts }) {
  const [ref, go] = useGo(0.3);
  const still = useReducedMotion();
  const lo = Math.min(...bands.map((b) => b.from)), hi = Math.max(...bands.map((b) => b.to));
  const at = (v) => ((v - lo) / (hi - lo)) * 100;
  const rest = useMemo(() => busiest(bands, lo, hi), [bands, lo, hi]);
  const [x, setX] = useState(rest);
  const [done, setDone] = useState(false);
  const calm = still || calmNow();
  const played = calm || done;
  const stop = useRef(() => {});
  const area = useRef(null);

  // The marker sweeps from the lowest pay to the highest once the bars are in, then settles where most bands overlap. Anyone who has asked for calmer motion gets it at rest.
  useEffect(() => {
    if (go !== "1") return undefined;
    if (calm) return undefined;
    let frame = 0, live = true;
    const start = performance.now() + 1000, sweep = 2800, settle = 900;
    const tick = (t) => {
      if (!live) return;
      const e = t - start;
      if (e < 0) setX(0);
      else if (e < sweep) setX(ease(e / sweep));
      else if (e < sweep + settle) setX(1 + (rest - 1) * ease((e - sweep) / settle));
      else { setX(rest); setDone(true); return; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    stop.current = () => { live = false; cancelAnimationFrame(frame); };
    return () => { live = false; cancelAnimationFrame(frame); };
  }, [go, calm, rest]);

  // Moving a mouse or a finger across the bands tries a salary.
  const scrub = (e) => {
    const track = area.current?.querySelector(".av-track");
    if (!track) return;
    stop.current();
    const r = track.getBoundingClientRect();
    setX(clamp((e.clientX - r.left) / r.width, 0, 1));
    setDone(true);
  };

  const pay = clamp(Math.round((lo + x * (hi - lo)) / 500) * 500, lo, hi);
  const lit = bands.filter((b) => b.from <= pay && pay <= b.to).length;
  return (
    <div ref={ref} className="av-art av-bands" data-go={go} data-played={played ? "1" : "0"}>
      <div className="av-read"><strong>£{n(pay)}</strong><span>{lit} of {bands.length} bands could pay this</span></div>
      <ul ref={area} style={{ "--x": x }} onPointerMove={scrub} onPointerDown={scrub}>
        {bands.map((b, i) => (
          <li key={b.band} data-lit={b.from <= pay && pay <= b.to ? "1" : "0"} style={{ "--k": i, "--c": BAND[i % BAND.length] }}>
            <em>Band {b.band}</em>
            <span className="av-track"><i style={{ marginLeft: `${at(b.from)}%`, width: `${at(b.to) - at(b.from)}%` }} /></span>
            <b>{n(counts.get(b.band) ?? 0)}</b>
          </li>
        ))}
        <li className="av-mark" aria-hidden="true" />
      </ul>
      <p className="av-axis"><span>£{n(lo)}</span><span>£{n(hi)}</span></p>
      <p className="av-hint">Move across the bands to try a salary</p>
    </div>
  );
}
