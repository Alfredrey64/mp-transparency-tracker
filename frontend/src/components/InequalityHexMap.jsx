import { memo, useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric } from "../theme";
import { pillStyle } from "../lib/onsStyles";
import { boundsOf, hexPoints, hexPosition } from "../lib/seatMap";
import { classColour, classOf } from "../lib/regionData";
import { REGIONS } from "../data/regionMetrics";
import hexes from "../data/seatHexes.json";
import deprivation from "../data/deprivationConstituencies.json";
import ColourKey from "./RegionKey";
import { para } from "../lib/insightStyle";

// A hexagon map of England's Westminster seats (one equal hexagon each, so a crowded city is as easy to see as a county), painted by the share of
// the seat's people who live in the most income-deprived tenth of neighbourhoods in England. The other nations are drawn in grey for the shape.
// This file is loaded only when the map is asked for, because the deprivation figures are large.

const ACCENT = "#C0561F";
const BOUNDS = [0, 1, 5, 15, 30, 70];
const N = BOUNDS.length - 1;
const seats = new Map(deprivation.seats.map((s) => [s.code, s]));
const cells = hexes.hexes.map(([code, name, q, r]) => ({ code, name, ...hexPosition(q, r, 1), seat: seats.get(code) ?? null }));
const bounds = boundsOf(cells, 1);
const income = (c) => c.seat.domains.income;
const ranked = cells.filter((c) => c.seat).sort((a, b) => income(b) - income(a));
const regionKeyOf = (c) => c.seat?.region ?? null;

const Layer = memo(function Layer({ colourOf, dimmed }) {
  return (
    <g>
      {cells.map((c) => (
        <polygon key={c.code} data-code={c.code} points={hexPoints(c.x, c.y, 0.97)} fill={colourOf(c)} style={{ opacity: dimmed(c) ? 0.12 : c.seat ? 1 : 0.55, transition: "opacity 0.2s", cursor: c.seat ? "pointer" : "default" }} />
      ))}
    </g>
  );
});

function Card({ cell }) {
  if (!cell?.seat) return null;
  const s = cell.seat;
  return (
    <div style={{ padding: "10px 14px", borderRadius: 12, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${classColour(ACCENT, classOf(income(cell), BOUNDS), N)}`, fontFamily: FONT_BODY }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: COLORS.ink }}>{s.name}</div>
      <div style={{ fontSize: 13, color: COLORS.inkSoft }}>{REGIONS.find((r) => r.key === s.region)?.name}. {income(cell)}% of people live in the most income-deprived tenth of neighbourhoods in England, ranked {ranked.indexOf(cell) + 1} of {ranked.length} seats.</div>
    </div>
  );
}

function Rows({ rows, colourOf }) {
  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 3 }}>
      {rows.map(({ c, v }) => (
        <li key={c.code} style={{ display: "grid", gridTemplateColumns: "14px minmax(0, 1fr) auto", gap: 8, alignItems: "center", fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink }}>
          <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 3, background: colourOf(c), boxShadow: `0 0 0 1px ${COLORS.hairline}` }} />
          <span>{c.seat.name}</span>
          <span style={{ ...numeric, fontWeight: 600 }}>{v}%</span>
        </li>
      ))}
    </ol>
  );
}

export default function InequalityHexMap() {
  const [region, setRegion] = useState("");
  const [hover, setHover] = useState(null);
  const [pinned, setPinned] = useState(null);
  const colourOf = useMemo(() => (c) => (c.seat ? classColour(ACCENT, classOf(income(c), BOUNDS), N) : COLORS.hairline), []);
  const dimmed = useMemo(() => (c) => Boolean(region) && regionKeyOf(c) !== region, [region]);
  const byCode = useMemo(() => new Map(cells.map((c) => [c.code, c])), []);
  const read = (e) => byCode.get(e.target?.dataset?.code) ?? null;
  const shown = hover ?? pinned;
  const list = (items) => items.map((c) => ({ c, v: income(c) }));
  const pool = region ? ranked.filter((c) => regionKeyOf(c) === region) : ranked;
  const top = list(pool.slice(0, 8));
  const zeros = pool.filter((c) => income(c) === 0);
  const bottom = list(pool.filter((c) => income(c) > 0).slice(-8).reverse());
  const regionsInData = REGIONS.filter((r) => deprivation.seats.some((s) => s.region === r.key));
  const share = (rows, test) => rows.filter(test).length;
  const over30 = share(ranked, (c) => income(c) >= 30);
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 10 }}>
        <label htmlFor="ineq-hex-region" style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink }}>Highlight a region</label>
        <select id="ineq-hex-region" value={region} onChange={(e) => { setRegion(e.target.value); setPinned(null); }} style={{ minHeight: 40, padding: "6px 10px", borderRadius: 10, border: `1.5px solid ${COLORS.hairline}`, background: COLORS.paperCard, color: COLORS.ink, fontFamily: FONT_BODY, fontSize: 15 }}>
          <option value="">All of England</option>
          {regionsInData.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
        </select>
      </div>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <svg
          viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`} width="100%" role="img" style={{ display: "block", touchAction: "pan-y" }}
          aria-label={`Hexagon map of England's ${ranked.length} Westminster seats painted by the share of people in the most income-deprived tenth of neighbourhoods. ${over30} seats have 30% or more. Use the lists below for the highest and lowest.`}
          onPointerMove={(e) => setHover(read(e))} onPointerLeave={() => setHover(null)}
          onPointerDown={(e) => { const c = read(e); if (c?.seat) setPinned(pinned === c ? null : c); }}
        >
          <Layer colourOf={colourOf} dimmed={dimmed} />
        </svg>
      </div>
      <ColourKey bounds={BOUNDS} accent={ACCENT} format="pct" uk={null} caption="Share of the seat's people in the most deprived tenth" />
      <div aria-live="polite" style={{ minHeight: 66, marginTop: 12 }}>
        {shown?.seat ? <Card cell={shown} /> : <p style={{ ...para, fontSize: 13.5, margin: 0 }}>Hover over a seat, or tap one, to see its figure. Grey hexagons are Scotland, Wales and Northern Ireland, which have their own measures.</p>}
      </div>
      <div className="hex-lists" style={{ display: "grid", gap: 18, marginTop: 8 }}>
        <div>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700, color: COLORS.ink, margin: "0 0 6px" }}>Most income-deprived seats{region ? ` in ${REGIONS.find((r) => r.key === region).name}` : ""}</h3>
          <Rows rows={top} colourOf={colourOf} />
        </div>
        <div>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700, color: COLORS.ink, margin: "0 0 6px" }}>At the other end</h3>
          <p style={{ ...para, fontSize: 13.5, margin: "0 0 8px" }}><strong style={{ color: COLORS.ink }}>{zeros.length} of {pool.length} seats</strong> ({Math.round((zeros.length / pool.length) * 100)}%) have none of their people in the most income-deprived tenth of neighbourhoods. The lowest figures above zero:</p>
          <Rows rows={bottom} colourOf={colourOf} />
        </div>
      </div>
      <style>{`.hex-lists { grid-template-columns: repeat(2, minmax(0, 1fr)); } @media (max-width: 640px) { .hex-lists { grid-template-columns: minmax(0, 1fr); } }`}</style>
      <button type="button" onClick={() => { setRegion(""); setPinned(null); }} style={{ ...pillStyle(false), marginTop: 12, display: region || pinned ? "inline-block" : "none" }}>Reset</button>
    </div>
  );
}
