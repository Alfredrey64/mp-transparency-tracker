/** @jsxImportSource react */
import { useEffect, useMemo, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import { useGo } from "./useGo";
import AnimatedValue from "./AnimatedValue";
import { squarify } from "../../lib/treemap";
import { fitLabel } from "../../lib/labelFit";
import "../../story.css";
import "../../heroes.css";

// The banner of the Spending by department page: every department drawn as a block whose area is its planned budget, so the size of Health beside the rest is plain at a glance.
// It opens on 2025-26 and, once it scrolls into view, the blocks slide and resize to 2028-29 (a visitor can flip between the years, or press a block to read its numbers). A block's
// colour is how fast that department's budget changes between the two years: teal for growth, coral for a cut. The figures are the Treasury's, passed in from the page.
//   rows    [{ name, short, now, later, r: [day-to-day 2025-26, 2028-29], c: [investment ...] }]   £ billion, current prices
//   total   { r: [..], c: [..] }
const YEARS = ["2025-26", "2028-29"];
const WIDE = { W: 240, H: 100, nameW: 8.2, nameH: 15 };
const NARROW = { W: 100, H: 128, nameW: 28, nameH: 9 };
const bn = (n) => `£${n >= 100 ? Math.round(n) : n.toFixed(1)}bn`;
const growth = (d) => ((d.later - d.now) / d.now) * 100;

function useNarrow(px = 720) {
  const q = `(max-width: ${px}px)`;
  const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.(q).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(q);
    if (!mq) return undefined;
    const on = () => setNarrow(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [q]);
  return narrow;
}

// A number that glides to its new value when it changes.
function useGlide(target, reduce) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (reduce) return undefined;
    const c = animate(from.current, target, { duration: 1.2, ease: "easeInOut", onUpdate: (x) => { from.current = x; setV(x); } });
    return () => c.stop();
  }, [target, reduce]);
  return reduce ? target : v;
}

// How wide the text is, measured with the same fonts the blocks use. Measured on a hidden canvas; the answer is cached.
const FONT = `"Figures", "Public Sans", system-ui, sans-serif`;
let ctx2d;
const widths = new Map();
function measure(text, px, weight) {
  const k = `${weight}|${px}|${text}`;
  if (widths.has(k)) return widths.get(k);
  ctx2d ??= document.createElement("canvas").getContext("2d");
  ctx2d.font = `${weight} ${px}px ${FONT}`;
  const w = ctx2d.measureText(text).width * 1.04;
  widths.set(k, w);
  return w;
}

// The pixel size of the area the blocks fill, kept up to date as the window or the phone turns, and again once the fonts have loaded (text widths change a little).
function useBoxSize(ref) {
  const [size, setSize] = useState(null);
  const [fonts, setFonts] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(() => { const r = el.getBoundingClientRect(); setSize((o) => (o && Math.abs(o.w - r.width) < 0.5 && Math.abs(o.h - r.height) < 0.5 ? o : { w: r.width, h: r.height })); });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => { if (alive) { widths.clear(); setFonts(1); } });
    return () => { alive = false; };
  }, []);
  return [size, fonts];
}

export default function BudgetMap({ rows, total, why, figures }) {
  const [ref, go] = useGo(0.2);
  const reduce = useReducedMotion();
  const narrow = useNarrow();
  const dims = narrow ? NARROW : WIDE;
  const order = useMemo(() => [...rows].sort((a, b) => b.later - a.later), [rows]);
  // Anyone who has asked for calmer motion is shown the later year at once, with no slide.
  const [year, setYear] = useState(() => (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 1 : 0));
  const touched = useRef(false);
  const [sel, setSel] = useState(order[0].name);
  // The words in a block are written for the size it is going to be, so they are hidden while the blocks slide and fade back in once they have stopped.
  const tilesRef = useRef(null);
  const [box, fontsReady] = useBoxSize(tilesRef);
  const [settledYear, setSettledYear] = useState(year);
  useEffect(() => {
    if (settledYear === year) return undefined;
    const t = setTimeout(() => setSettledYear(year), reduce ? 0 : 1300);
    return () => clearTimeout(t);
  }, [year, settledYear, reduce]);
  const settling = !reduce && settledYear !== year;

  // Lay the blocks out once for each year, in the same order, so a department keeps its place and only changes size.
  const layouts = useMemo(
    () => [0, 1].map((y) => squarify(order.map((d) => ({ key: d.name, value: y ? d.later : d.now })), dims.W, dims.H)),
    [order, dims.W, dims.H],
  );
  const lay = layouts[year];
  const grows = order.map(growth);
  const maxUp = Math.max(...grows);
  const maxDown = Math.min(...grows, -1);

  useEffect(() => {
    if (reduce || go !== "1") return undefined;
    const t = setTimeout(() => { if (!touched.current) setYear(1); }, 2100);
    return () => clearTimeout(t);
  }, [go, reduce]);

  const fits = useMemo(() => {
    if (!box) return {};
    const out = {};
    for (const d of order) {
      const r = lay[d.name];
      out[d.name] = fitLabel({ name: d.short ?? d.name, value: bn(year ? d.later : d.now), w: (r.w / dims.W) * box.w - 4, h: (r.h / dims.H) * box.h - 4, measure });
    }
    return out;
    // fontsReady makes the widths be measured again once the fonts are in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box, lay, order, year, dims.W, dims.H, fontsReady]);

  const sum = (y) => total.r[y] + total.c[y];
  const shown = useGlide(sum(year), reduce);
  const pick = order.find((d) => d.name === sel) ?? order[0];
  const g = growth(pick);
  const splitTotal = pick.r[1] + pick.c[1];

  const foot = (
      <div className="hx-map-foot">
        <p className="hx-key" aria-hidden="true"><span>Cut</span><i /><span>Grows fastest</span></p>
        <div className="hx-read" aria-live="polite">
          <p className="hx-read-name">{pick.name}</p>
          <p className="hx-read-nums"><span>{bn(pick.now)}</span><svg viewBox="0 0 20 10" width="20" height="10" aria-hidden="true"><path d="M1 5h16M13 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg><span>{bn(pick.later)}</span><em data-dir={g >= 0 ? "up" : "down"}>{g >= 0 ? "up" : "down"} {Math.abs(g).toFixed(1)}%</em></p>
          <div className="hx-split" role="img" aria-label={`In 2028-29: day-to-day ${bn(pick.r[1])}, investment ${bn(pick.c[1])}`}>
            <i style={{ width: `${(pick.r[1] / splitTotal) * 100}%` }} /><i style={{ width: `${(pick.c[1] / splitTotal) * 100}%` }} />
          </div>
          <p className="hx-read-fine"><span className="d" />Day-to-day {bn(pick.r[1])} <span className="c" />Investment {bn(pick.c[1])} <small>(2028-29)</small></p>
        </div>
      </div>
  );

  return (
    <section ref={ref} className="hx hx-map" data-go={go} aria-label="At a glance">
      <p className="hx-why"><strong>Why it matters</strong>{why}</p>

      <div className="hx-map-bar">
        <div className="hx-seg" role="group" aria-label="Year shown">
          {YEARS.map((y, i) => (
            <button key={y} type="button" aria-pressed={year === i} onClick={() => { touched.current = true; setYear(i); }}>{y}</button>
          ))}
        </div>
        <p className="hx-map-total"><span>Planned spending by departments in {YEARS[year]}</span><b aria-hidden="true">£{Math.round(shown)}bn</b><span className="hx-sr">{`£${Math.round(sum(year))} billion`}</span></p>
      </div>

      {narrow && foot}

      <ul ref={tilesRef} className="hx-tiles" style={{ aspectRatio: `${dims.W} / ${dims.H}` }}>
        {order.map((d, i) => {
          const r = lay[d.name];
          const gr = growth(d);
          const up = gr >= 0;
          const t = Math.min(1, Math.abs(gr) / (up ? maxUp : Math.abs(maxDown)));
          const wp = (r.w / dims.W) * 100;
          const hp = (r.h / dims.H) * 100;
          const fit = fits[d.name] ?? { mode: "none" };
          return (
            <li key={d.name} className="hx-tile" data-dir={up ? "up" : "down"} data-on={sel === d.name ? "1" : "0"}
              style={{ left: `${(r.x / dims.W) * 100}%`, top: `${(r.y / dims.H) * 100}%`, width: `${wp}%`, height: `${hp}%`, "--i": i, "--t": t.toFixed(3), "--pad": `${fit.pad ?? 8}px` }}>
              <button type="button" onMouseEnter={() => setSel(d.name)} onFocus={() => setSel(d.name)} onClick={() => setSel(d.name)}
                aria-label={`${d.name}: ${bn(d.now)} in 2025-26, ${bn(d.later)} in 2028-29, ${up ? "up" : "down"} ${Math.abs(gr).toFixed(1)} per cent`}>
                {fit.mode !== "none" && (
                  <span className="hx-tile-label" data-on={settling ? "0" : "1"}>
                    <span className="hx-tile-name" style={{ fontSize: fit.size }}>{d.short ?? d.name}</span>
                    {fit.mode === "full" && <span className="hx-tile-val" style={{ fontSize: fit.valueSize }}>{bn(year ? d.later : d.now)}</span>}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {!narrow && foot}

      {figures && (
        <ul className="vv-figs">
          {figures.map((f, i) => (
            <li key={f.label} style={{ "--i": i }}>
              <b><AnimatedValue text={f.value} /></b>
              <span>{f.label}</span>
              {f.sub && <em>{f.sub}</em>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
