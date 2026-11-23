/** @jsxImportSource react */
import { useEffect, useMemo, useState } from "react";
import { useGo } from "./story/useGo";
import { API, BANDS, FUELS, clock, groups, nowSentence, parseDay, parseMix, parseNow } from "../lib/gridLive";
import "../gridlive.css";

// "The grid right now": a live dial for how much carbon each unit of Great Britain's electricity carries, the mix of what is generating it, and the day so far against the forecast.
// It asks the Carbon Intensity API directly from the visitor's browser (so it is always current, and the site has no copy of it to go stale) every five minutes while the tab is open.
// If the service does not answer, the panel says so in one line and the rest of the page is untouched. Nothing here is estimated by this site.

const REFRESH_MS = 5 * 60 * 1000;
const MAX_G = 400;
const SWEEP = 180; // degrees the needle travels across the dial
const BAND_ORDER = ["very low", "low", "moderate", "high", "very high"];

async function get(path, signal) {
  const res = await fetch(`${API}${path}`, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

function useGrid() {
  const [state, setState] = useState({ status: "loading" });
  useEffect(() => {
    let alive = true;
    let ctl = new AbortController();
    const load = async () => {
      ctl.abort();
      ctl = new AbortController();
      try {
        const [n, m, d] = await Promise.all([get("/intensity", ctl.signal), get("/generation", ctl.signal), get("/intensity/date", ctl.signal)]);
        const now = parseNow(n); const mix = parseMix(m); const day = parseDay(d);
        if (!alive) return;
        if (!now || !mix) { setState((s) => (s.status === "ok" ? s : { status: "failed" })); return; }
        setState({ status: "ok", now, mix, day });
      } catch (e) {
        if (alive && e?.name !== "AbortError") setState((s) => (s.status === "ok" ? s : { status: "failed" }));
      }
    };
    load();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") load(); }, REFRESH_MS);
    return () => { alive = false; ctl.abort(); window.clearInterval(timer); };
  }, []);
  return state;
}

// A semicircular dial, needle and all. The arc is five equal steps of colour from cleaner to dirtier; the needle points at the live figure.
function Dial({ now, go }) {
  const R = 92; const C = 110; const stroke = 16;
  const arc = (a0, a1) => {
    const p = (a) => [C + R * Math.cos(Math.PI * (1 - a)), C - R * Math.sin(Math.PI * (1 - a))];
    const [x0, y0] = p(a0); const [x1, y1] = p(a1);
    return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  };
  const frac = Math.min(1, Math.max(0, now.value / MAX_G));
  return (
    <figure className="gl-dial" data-index={now.index} style={{ "--needle": `${(frac * SWEEP - SWEEP / 2).toFixed(1)}deg` }}>
      <div className="gl-face"><svg viewBox="0 0 220 138" role="img" aria-label={`Dial reading ${Math.round(now.value)} grams of carbon dioxide per unit of electricity, ${BANDS[now.index].words}.`}>
        {BAND_ORDER.map((b, i) => <path key={b} d={arc(i / 5 + 0.006, (i + 1) / 5 - 0.006)} className="gl-arc" style={{ stroke: BANDS[b].colour, "--i": i }} strokeWidth={stroke} fill="none" strokeLinecap="butt" />)}
        <g className="gl-needle" aria-hidden="true">
          <line x1={C} y1={C} x2={C} y2={C - R + 4} />
          <circle cx={C} cy={C} r="7" />
        </g>
      </svg>
      <div className="gl-ends" aria-hidden="true"><span>Cleaner</span><span>Dirtier</span></div></div>
      <figcaption>
        <b data-go={go}>{Math.round(now.value)}</b>
        <span>grams of CO₂ per unit of electricity</span>
        <em style={{ background: BANDS[now.index].colour }}>{BANDS[now.index].words}</em>
      </figcaption>
    </figure>
  );
}

function Mix({ mix, go }) {
  const g = groups(mix);
  const total = mix.rows.reduce((s, r) => s + r.perc, 0);
  return (
    <div className="gl-mix">
      <h3 className="gl-h">Where the power is coming from right now</h3>
      <div className="gl-bar" role="img" aria-label={`Generation mix: ${mix.rows.map((r) => `${FUELS[r.fuel].name} ${Math.round(r.perc)} percent`).join(", ")}.`}>
        {mix.rows.map((r, i) => (
          <i key={r.fuel} className="gl-seg" style={{ flexGrow: r.perc / total, background: FUELS[r.fuel].colour, "--i": i }} data-fuel={r.fuel}>
            {r.perc / total > 0.085 && <span>{Math.round(r.perc)}%</span>}
          </i>
        ))}
      </div>
      <ul className="gl-legend">
        {mix.rows.map((r) => (
          <li key={r.fuel}><i style={{ background: FUELS[r.fuel].colour }} aria-hidden="true" /><span>{FUELS[r.fuel].name}</span><b>{r.perc.toFixed(1)}%</b></li>
        ))}
      </ul>
      <p className="gl-sum" data-go={go}>
        <strong>{Math.round(g.low)}%</strong> from wind, solar, hydro and nuclear, <strong>{Math.round(g.fossil)}%</strong> from gas and coal{g.biomass >= 0.5 && <>, <strong>{Math.round(g.biomass)}%</strong> from biomass</>}{g.imports >= 0.5 && <> and <strong>{Math.round(g.imports)}%</strong> imported</>}.
      </p>
    </div>
  );
}

// The day so far: the operator's forecast for every half hour (dashed) and the measured figure up to now (solid), with a dot where "now" is.
function Day({ day, now }) {
  const view = useMemo(() => {
    const vals = day.flatMap((r) => [r.forecast, r.actual]).filter((v) => v !== null);
    const top = Math.max(100, Math.ceil(Math.max(...vals) / 50) * 50);
    const x = (i) => ((i + 0.5) / day.length) * 100;
    const y = (v) => 100 - (v / top) * 100;
    const line = (key) => {
      let d = "";
      day.forEach((r, i) => { if (r[key] !== null) d += `${d && day[i - 1]?.[key] !== null ? "L" : "M"}${x(i).toFixed(2)} ${y(r[key]).toFixed(2)}`; });
      return d;
    };
    // "Now" is the half hour the dial is showing, at the dial's own value, so the dot and the dial always agree.
    let last = day.findIndex((r) => r.from === now.from);
    if (last < 0) day.forEach((r, i) => { if (r.actual !== null) last = i; });
    const nowValue = last >= 0 && day[last].from === now.from ? now.value : day[last].actual;
    const lo = day.reduce((b, r, i) => (r.actual !== null && (b < 0 || r.actual < day[b].actual) ? i : b), -1);
    const hi = day.reduce((b, r, i) => (r.actual !== null && (b < 0 || r.actual > day[b].actual) ? i : b), -1);
    return { top, forecast: line("forecast"), actual: line("actual"), last, nowValue, lo, hi, x, y };
  }, [day, now]);
  const at = (i) => `${view.x(i)}%`;
  return (
    <div className="gl-day">
      <h3 className="gl-h">Today so far, against the forecast</h3>
      <div className="gl-plot" role="img" aria-label={`Carbon intensity through today. Lowest so far ${Math.round(day[view.lo].actual)} at ${clock(day[view.lo].from)}, highest ${Math.round(day[view.hi].actual)} at ${clock(day[view.hi].from)}.`}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {[0, 50, 100].map((p) => <line key={p} x1="0" x2="100" y1={p} y2={p} className="gl-grid" />)}
          <path d={view.forecast} className="gl-forecast" />
          <path d={view.actual} className="gl-actual" />
        </svg>
        <span className="gl-yt" style={{ top: 0 }}>{view.top}</span>
        <span className="gl-yt" style={{ top: "50%" }}>{view.top / 2}</span>
        <span className="gl-yt" style={{ top: "100%" }}>0</span>
        <i className="gl-now" style={{ left: at(view.last), top: `${view.y(view.nowValue)}%` }} aria-hidden="true" />
        {[view.lo, view.hi].filter((v, k, a) => a.indexOf(v) === k).map((i) => (
          <b key={i} className="gl-mark" style={{ left: at(i), top: `${view.y(day[i].actual)}%` }} data-edge={i < 6 ? "l" : i > 41 ? "r" : ""} aria-hidden="true">{Math.round(day[i].actual)}</b>
        ))}
      </div>
      <div className="gl-xt" aria-hidden="true">
        {[0, 12, 24, 36].map((i) => <span key={i} style={{ left: at(i) }}>{clock(day[i].from)}</span>)}
      </div>
      <p className="gl-key"><i className="gl-k1" /> measured <i className="gl-k2" /> forecast, grams of CO₂ per unit</p>
    </div>
  );
}

export default function GridLive() {
  const grid = useGrid();
  const [ref, inView] = useGo(0.15);
  const ok = grid.status === "ok";
  const go = ok ? inView : "0";
  return (
    <div ref={ref} className="gl" data-go={go} data-status={grid.status}>
      {grid.status === "failed" && (
        <p className="gl-note" role="status">The live figures are not available from the Carbon Intensity service just now. The yearly figures below are not affected.</p>
      )}
      {grid.status === "loading" && <div className="gl-skel" aria-hidden="true" />}
      {ok && (
        <>
          <div className="gl-top">
            <Dial now={grid.now} go={go} />
            <Mix mix={grid.mix} go={go} />
          </div>
          {grid.day && <Day day={grid.day} now={grid.now} />}
          <p className="gl-foot">{nowSentence(grid.now)} Half hour from {clock(grid.now.from)} to {clock(grid.now.to)} UK time, for Great Britain only (not Northern Ireland). Refreshes every five minutes while this page is open. Both the "measured" figure and the forecast are the operator&apos;s own estimates from generation data, not meter readings at your socket.</p>
        </>
      )}
    </div>
  );
}
