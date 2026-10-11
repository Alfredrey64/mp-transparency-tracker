import { memo, useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric } from "../theme";
import { card, cardTitle } from "../lib/onsStyles";
import { Segmented, HowToRead } from "./DeprivationControls";
import { KINDS } from "../data/deprivationKinds";
import { oneIn, oneInShort, againstFair } from "../lib/deprivationPlain";
import { hexPosition, hexPoints, boundsOf, normSeat } from "../lib/seatMap";
import { classColour, classOf } from "../lib/regionData";
import hexData from "../data/seatHexes.json";

// Deprivation across the whole UK on one map: every Westminster constituency as a hexagon, coloured by the share of its
// area that is in the most deprived tenth of its OWN nation. England, Wales, Scotland and Northern Ireland each rank only
// themselves, so a nation as a whole is 10% by definition: the map shows where inside each nation the deprivation is, and
// colours are not a ranking of one nation against another. The nation buttons dim the rest so one can be looked at alone.

const ACCENT = "#B4432F";
const BOUNDS = [0, 5, 10, 20, 30, 40, 100];
const NATIONS = [
  { id: "england", name: "England", region: /^E/ },
  { id: "wales", name: "Wales", region: /^W/ },
  { id: "scotland", name: "Scotland", region: /^S/ },
  { id: "northernireland", name: "Northern Ireland", region: /^N/ },
];
const KEY_IN = { wales: { crime: "safety" } };
const f1 = (v) => `${(Math.round(v * 10) / 10).toFixed(1)}%`;
const SIZE = 1;

// A seat's share in its nation's most deprived tenth, overall or for one kind of deprivation.
function valueIn(c, kind) {
  const s = c.seat;
  if (!s) return null;
  if (kind === "imd") return s.worst10;
  return s.domains?.[KEY_IN[c.nation]?.[kind] ?? kind] ?? null;
}

const Hexes = memo(function Hexes({ cells, colourOf, dimmedOf, onPick, onHover }) {
  return (
    <g>
      {cells.map((c) => (
        <polygon
          key={c.code} points={hexPoints(c.x, c.y, SIZE * 0.96)} fill={colourOf(c)}
          style={{ opacity: dimmedOf(c) ? 0.12 : 1, transition: "fill 0.3s, opacity 0.2s", cursor: "pointer" }}
          onPointerEnter={() => onHover(c.code)} onPointerLeave={() => onHover(null)} onClick={() => onPick(c.code)}
        />
      ))}
    </g>
  );
});

export default function DeprivationUK({ kind = "imd" }) {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [nation, setNation] = useState("all");
  const [picked, setPicked] = useState(null);
  const [hover, setHover] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    Promise.all([import("../data/deprivationConstituencies.json"), import("../data/deprivationNations.json")])
      .then(([eng, nat]) => alive && setData({ england: eng.default.seats, ...nat.default }))
      .catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, []);

  // Every hexagon with its nation and, once the figures are in, each kind of deprivation's share for that seat.
  const cells = useMemo(() => {
    if (!data) return [];
    const byName = new Map();
    for (const n of NATIONS) {
      const seats = n.id === "england" ? data.england : data[n.id].seats;
      const rank = (list, key) => [...list].sort((a, b) => b[key] - a[key]);
      const order = new Map(rank(seats, "worst10").map((s, i) => [s.name, i + 1]));
      for (const s of seats) byName.set(normSeat(s.name), { ...s, nation: n.id, rankOverall: order.get(s.name), of: seats.length });
    }
    return hexData.hexes.map(([code, name, q, r]) => {
      const pos = hexPosition(q, r, SIZE);
      const nat = NATIONS.find((n) => n.region.test(code))?.id ?? "england";
      return { code, name, ...pos, nation: nat, seat: byName.get(normSeat(name)) ?? null };
    });
  }, [data]);

  const valueOf = (c) => valueIn(c, kind);
  const colourOf = (c) => {
    const v = valueOf(c);
    return v == null ? COLORS.hairline : classColour(ACCENT, classOf(v, BOUNDS), BOUNDS.length - 1);
  };
  const dimmedOf = (c) => nation !== "all" && c.nation !== nation;
  const bounds = useMemo(() => boundsOf(cells, SIZE), [cells]);
  const shown = cells.find((c) => c.code === (hover ?? picked));
  const selected = cells.find((c) => c.code === picked);

  // The most deprived seat of each nation for the chosen kind: the callouts under the map.
  const callouts = useMemo(() => NATIONS.map((n) => {
    const list = cells.filter((c) => c.nation === n.id && valueIn(c, kind) != null).sort((a, b) => valueIn(b, kind) - valueIn(a, kind));
    return { ...n, top: list[0] ?? null, topValue: list[0] ? valueIn(list[0], kind) : null };
  }), [cells, kind]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q.length < 2 ? [] : cells.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 6);
  }, [cells, query]);

  if (failed) return <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, marginTop: 24 }}>The map could not be loaded. Refresh the page to try again.</p>;
  if (!data) return <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, marginTop: 24 }}>Loading the map…</p>;

  const kindLabel = KINDS.uk.find((k) => k.id === kind)?.label ?? "Overall deprivation";
  const card2 = shown?.seat;

  return (
    <>
      <section aria-labelledby="h-dep-uk-what" style={{ ...card, marginTop: 24, position: "relative", overflow: "hidden" }}>
        <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: `linear-gradient(180deg, ${ACCENT}, ${ACCENT}22)` }} />
        <h2 id="h-dep-uk-what" style={cardTitle}>All four nations on one map</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.6, color: COLORS.ink, margin: "10px 0 0", maxWidth: 780 }}>
          Each hexagon is one of the 650 Westminster constituencies, all drawn the same size so every seat counts equally. The darker the hexagon, the more of that area is among the most deprived in <strong>its own nation</strong>.
        </p>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: COLORS.inkSoft, margin: "10px 0 0", maxWidth: 780 }}>
          England, Wales, Scotland and Northern Ireland each publish their own measure and each ranks only itself. So a dark seat in Wales and a dark seat in England are both badly off compared with the rest of their own country, but the two measures are built differently. Read the colours as &ldquo;hardest hit within its nation&rdquo;, not as one nation against another.
        </p>
        <HowToRead place="its nation" counts="areas" unit="area" />
      </section>

      <section aria-labelledby="h-dep-uk-map" className="regions-wrap" style={{ ...card, background: `radial-gradient(560px 340px at 50% 0%, ${ACCENT}1a, transparent 70%), ${COLORS.paperCard}` }}>
        <h2 id="h-dep-uk-map" style={cardTitle}>{kindLabel}, seat by seat</h2>
        <div style={{ margin: "12px 0 12px" }}>
          <Segmented label="Show which nation" value={nation} onChange={setNation} small options={[{ id: "all", label: "All of the UK", short: "All UK" }, ...NATIONS.map((n) => ({ id: n.id, label: n.name, short: n.id === "northernireland" ? "N. Ireland" : n.name }))]} accent={ACCENT} />
        </div>

        <div className="dep-uk-grid">
          <div style={{ position: "relative", minWidth: 0 }}>
            <svg viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`} role="group" aria-label="Hexagon map of the UK's constituencies, coloured by deprivation" style={{ width: "100%", height: "auto", maxHeight: "min(760px, 80vh)", display: "block" }}>
              <Hexes cells={cells} colourOf={colourOf} dimmedOf={dimmedOf} onPick={(code) => setPicked((cur) => (cur === code ? null : code))} onHover={setHover} />
              {selected && <polygon points={hexPoints(selected.x, selected.y, SIZE * 1.15)} fill="none" stroke={COLORS.ink} strokeWidth="0.35" pointerEvents="none" />}
            </svg>
            {card2 && (
              <div aria-hidden="true" style={{ position: "absolute", left: 6, bottom: 6, maxWidth: "calc(100% - 12px)", background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${ACCENT}`, borderRadius: 12, padding: "8px 12px", boxShadow: "0 8px 24px rgba(0,0,0,0.35)", pointerEvents: "none" }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: COLORS.ink, lineHeight: 1.2 }}>{shown.name}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>{NATIONS.find((n) => n.id === shown.nation).name}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink, marginTop: 2 }}><span style={{ ...numeric, fontWeight: 700 }}>{valueOf(shown) == null ? "n/a" : oneInShort(valueOf(shown))}</span> ({valueOf(shown) == null ? "" : f1(valueOf(shown))}) in its nation&apos;s worst tenth</div>
              </div>
            )}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.ink, marginBottom: 6 }}>How much of the seat is in the most deprived tenth of its own nation</div>
            <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4 }}>
              {BOUNDS.slice(0, -1).map((lo, i) => (
                <li key={lo} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink }}>
                  <span aria-hidden="true" style={{ width: 22, height: 14, borderRadius: 4, background: classColour(ACCENT, i, BOUNDS.length - 1), flexShrink: 0 }} />
                  {i === BOUNDS.length - 2 ? `${lo}% or more` : `${lo}% to ${BOUNDS[i + 1]}%`}{lo === 10 ? " (a fair share is 10%)" : ""}
                </li>
              ))}
            </ol>

            <div style={{ marginTop: 18 }}>
              <label htmlFor="uk-seat" style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.ink, display: "block", marginBottom: 6 }}>Find a seat</label>
              <input id="uk-seat" type="search" className="ons-chip" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type a constituency" autoComplete="off"
                style={{ fontFamily: FONT_BODY, fontSize: 16, padding: "9px 12px", borderRadius: 10, border: `1px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, width: "100%", boxSizing: "border-box" }} />
              {matches.length > 0 && (
                <ul style={{ listStyle: "none", margin: "6px 0 0", padding: 0, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, overflow: "hidden" }}>
                  {matches.map((m) => (
                    <li key={m.code} style={{ borderTop: `1px solid ${COLORS.hairline}` }}>
                      <button type="button" onClick={() => { setPicked(m.code); setQuery(""); }} style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "9px 12px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink }}>{m.name}</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {selected?.seat && (
              <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 12, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.5, color: COLORS.ink }} aria-live="polite">
                <strong>{selected.name}</strong> ({NATIONS.find((n) => n.id === selected.nation).name}): {valueOf(selected) == null ? "no figure" : <>{oneIn(valueOf(selected))} of it ({f1(valueOf(selected))}) is in its nation&apos;s most deprived tenth for {kindLabel.toLowerCase()}, {againstFair(valueOf(selected)).text} a fair share</>}. Number {selected.seat.rankOverall} of {selected.seat.of} seats in its nation overall, where 1 is the most deprived.
                <div style={{ marginTop: 8 }}><a href={`#/constituency/${encodeURIComponent(selected.name)}`} className="ons-tap" style={{ fontWeight: 700, color: COLORS.ink }}>See this constituency, its MP and its results</a></div>
              </div>
            )}
          </div>
        </div>

        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: COLORS.ink, margin: "20px 0 8px" }}>The most deprived seat in each nation for {kindLabel.toLowerCase()}</h3>
        <ul className="box-row" style={{ listStyle: "none", margin: 0, padding: 0, "--n": 4, "--min": "190px", "--gap": "10px" }}>
          {callouts.map((c) => (
            <li key={c.id} style={{ border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: "10px 12px", opacity: nation !== "all" && nation !== c.id ? 0.5 : 1 }}>
              <button type="button" disabled={!c.top} onClick={() => { setPicked(c.top.code); setNation(c.id); }} className="ons-tap" style={{ all: "unset", position: "relative", cursor: "pointer", display: "block", width: "100%" }}>
                <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft }}>{c.name}</span>
                <span style={{ display: "block", fontFamily: FONT_DISPLAY, fontSize: 16, color: COLORS.ink, marginTop: 2 }}>{c.top?.name ?? "n/a"}</span>
                <span style={{ ...numeric, display: "block", fontSize: 13, color: COLORS.inkSoft }}>{c.topValue == null ? "" : `${oneInShort(c.topValue)} (${f1(c.topValue)})`}</span>
              </button>
            </li>
          ))}
        </ul>
        <p style={{ fontFamily: FONT_BODY, fontSize: 12, lineHeight: 1.55, color: COLORS.inkSoft, margin: "14px 0 0", maxWidth: 800 }}>
          How to read the figures: England&apos;s are the share of a seat&apos;s residents; Wales&apos;s and Scotland&apos;s are the share of its neighbourhoods and Northern Ireland&apos;s of its wards, as each nation publishes them. Each index is from a different year (England 2025, Wales 2025, Scotland 2020, Northern Ireland 2017), and constituencies are matched to neighbourhoods by best fit. The hexagon layout is an outline of the UK, not to scale.
        </p>
      </section>
    </>
  );
}
