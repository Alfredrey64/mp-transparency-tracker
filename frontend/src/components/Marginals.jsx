import { useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING, numeric } from "../theme";
import { partyColour } from "../lib/format";
import { seatRows, seatsByParty, uniformSwing, swingCurve, challengers } from "../lib/swing";
import { PageHeader, LoadFailedNote } from "./shared";
import { IconSwing } from "./icons";
import ShareButton from "./ShareButton";
import { swingShareSpec } from "../lib/shareSpecs";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";

// Marginal seats and swing: which seats are on a knife-edge, how far the vote would have to move to change them, and what a
// uniform shift in support between two parties would do. Everything comes from each seat's 2024 result; lib/swing.js has
// the arithmetic.

const labelStyle = { fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.ink, marginBottom: 6, display: "block" };
const field = { fontFamily: FONT_BODY, fontSize: 16, padding: "9px 10px", borderRadius: 10, border: `1px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, width: "100%", boxSizing: "border-box" };
const colour = (hex) => partyColour(hex, COLORS.inkSoft);
const fmt = (n) => Math.round(n).toLocaleString("en-GB");
const pts = (n) => (n > 0 && n < 0.1 ? "under 0.1" : (Math.round(n * 10) / 10).toFixed(1));
const seatHref = (name) => `#/constituency/${encodeURIComponent(name)}`;

function Chip({ party, colourHex }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink }}>
      <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: "50%", background: colour(colourHex), flexShrink: 0 }} />
      {party}
    </span>
  );
}

// How many seats are within each stretch of swing, split by the party that holds them.
const BANDS = [
  { max: 2, label: "Under 2 points" },
  { max: 5, label: "2 to 5" },
  { max: 10, label: "5 to 10" },
  { max: 20, label: "10 to 20" },
  { max: Infinity, label: "20 or more" },
];

function Bands({ rows, parties }) {
  const top = parties.slice(0, 5);
  const topNames = new Set(top.map((p) => p.party));
  const data = BANDS.map((b, i) => {
    const lo = i ? BANDS[i - 1].max : 0;
    const inBand = rows.filter((r) => r.swing >= lo && r.swing < b.max);
    const segs = top.map((p) => ({ party: p.party, colour: p.colour, n: inBand.filter((r) => r.winner === p.party).length }));
    const other = inBand.filter((r) => !topNames.has(r.winner)).length;
    return { ...b, total: inBand.length, segs, other };
  });
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <div>
      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
        {data.map((d) => (
          <li key={d.label} style={{ display: "grid", gridTemplateColumns: "minmax(88px, 120px) minmax(0, 1fr) 44px", gap: 12, alignItems: "center", fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink }}>
            <span>{d.label}</span>
            <span role="img" aria-label={`${d.total} seats: ${d.segs.filter((s) => s.n).map((s) => `${s.party} ${s.n}`).join(", ")}${d.other ? `, others ${d.other}` : ""}`} style={{ display: "flex", height: 16, width: `${Math.max(2, (d.total / max) * 100)}%`, borderRadius: 4, overflow: "hidden", gap: 2 }}>
              {d.segs.filter((s) => s.n).map((s) => <span key={s.party} style={{ flex: s.n, background: colour(s.colour) }} />)}
              {d.other > 0 && <span style={{ flex: d.other, background: COLORS.inkSoft, opacity: 0.6 }} />}
            </span>
            <span style={{ ...numeric, textAlign: "right" }}>{d.total}</span>
          </li>
        ))}
      </ol>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginTop: 12 }}>
        {top.map((p) => <Chip key={p.party} party={p.party} colourHex={p.colour} />)}
      </div>
    </div>
  );
}

// Seats a party would win, by size of swing, with the chosen swing marked.
function Curve({ curve, points, fromColour, toColour, max }) {
  const W = 560, H = 190, L = 34, B = 26, T = 10, R = 10;
  const top = Math.max(...curve.map((c) => c.seats), 5);
  const x = (p) => L + (p / max) * (W - L - R);
  const y = (n) => H - B - (n / top) * (H - B - T);
  const path = curve.map((c, i) => `${i ? "L" : "M"}${x(c.points).toFixed(1)} ${y(c.seats).toFixed(1)}`).join("");
  const at = curve[Math.min(max, Math.max(0, Math.round(points)))];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Seats won by swing: ${at.seats} at a ${points}-point swing`} style={{ width: "100%", height: "auto", display: "block", maxWidth: 640 }}>
      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(top * t)} y2={y(top * t)} stroke={COLORS.hairline} strokeWidth="1" />
          <text x={L - 6} y={y(top * t) + 4} textAnchor="end" fontFamily={FONT_BODY} fontSize="11" fill={COLORS.inkSoft}>{Math.round(top * t)}</text>
        </g>
      ))}
      {[0, 5, 10, 15, 20].filter((p) => p <= max).map((p) => (
        <text key={p} x={x(p)} y={H - 6} textAnchor="middle" fontFamily={FONT_BODY} fontSize="11" fill={COLORS.inkSoft}>{p}</text>
      ))}
      <path d={path} fill="none" stroke={toColour} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      <line x1={x(points)} x2={x(points)} y1={T} y2={H - B} stroke={fromColour} strokeWidth="2" strokeDasharray="4 4" />
      <circle cx={x(points)} cy={y(at.seats)} r="5.5" fill={toColour} stroke={COLORS.paperCard} strokeWidth="2" />
    </svg>
  );
}

function SwingTool({ rows, parties }) {
  // Every party that holds a seat, plus any that come second in at least five: no joke or one-off candidates.
  const names = useMemo(() => {
    const seconds = new Map();
    for (const r of rows) seconds.set(r.second, (seconds.get(r.second) ?? 0) + 1);
    const held = new Set(rows.map((r) => r.winner));
    return [...new Set([...held, ...[...seconds].filter(([, n]) => n >= 5).map(([p]) => p)])].sort();
  }, [rows]);
  const [from, setFrom] = useState(parties[0]?.party ?? "");
  const [to, setTo] = useState(() => challengers(rows, parties[0]?.party)[0]?.name ?? "");
  const [points, setPoints] = useState(5);
  const [showAll, setShowAll] = useState(false);
  const max = 20;

  const fromRows = useMemo(() => rows.filter((r) => r.winner === from), [rows, from]);
  const flips = useMemo(() => uniformSwing(rows, from, to, points), [rows, from, to, points]);
  const curve = useMemo(() => swingCurve(rows, from, to, max), [rows, from, to]);
  const colourOf = useMemo(() => {
    const m = new Map();
    for (const r of rows) { m.set(r.winner, r.winnerColour); if (!m.has(r.second)) m.set(r.second, r.secondColour); }
    return m;
  }, [rows]);
  const fromColour = colour(colourOf.get(from));
  const toColour = colour(colourOf.get(to));
  const fromTotal = fromRows.length;
  const toTotal = rows.filter((r) => r.winner === to).length;
  const changeFrom = (v) => { setFrom(v); setTo(challengers(rows, v)[0]?.name ?? ""); setShowAll(false); };
  const lone = from === to;

  return (
    <section aria-labelledby="h-swing-tool" className="regions-wrap" style={{ ...card, marginTop: 24, background: `radial-gradient(560px 300px at 85% 0%, ${toColour}22, transparent 70%), ${COLORS.paperCard}` }}>
      <h2 id="h-swing-tool" style={cardTitle}>What if the vote moved?</h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.inkSoft, margin: "6px 0 16px", maxWidth: 780 }}>
        Pick two parties and a swing: the points of the vote that move from one to the other in every seat. The page counts the seats that would change hands, using each seat&apos;s 2024 result. It is a simple model, a guide and not a forecast: it ignores every other party and assumes every seat moves the same.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(210px, 100%), 1fr))", gap: "12px 18px", marginBottom: 14 }}>
        <div>
          <label htmlFor="swing-from" style={labelStyle}>Votes move away from</label>
          <select id="swing-from" className="ons-chip" value={from} onChange={(e) => changeFrom(e.target.value)} style={field}>
            {parties.map((p) => <option key={p.party} value={p.party}>{p.party} ({p.count} {p.count === 1 ? "seat" : "seats"})</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="swing-to" style={labelStyle}>and towards</label>
          <select id="swing-to" className="ons-chip" value={to} onChange={(e) => { setTo(e.target.value); setShowAll(false); }} style={field}>
            {names.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="swing-pts" style={labelStyle}>The swing: <span style={numeric}>{pts(points)}</span> {points === 1 ? "point" : "points"}</label>
          <input id="swing-pts" type="range" min="0" max={max} step="0.5" value={points} onChange={(e) => { setPoints(Number(e.target.value)); setShowAll(false); }} style={{ width: "100%", height: 34, accentColor: toColour }} />
        </div>
      </div>

      {lone ? (
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft }}>Pick two different parties.</p>
      ) : (
        <>
          <p aria-live="polite" style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(20px, 3.4vw, 28px)", lineHeight: 1.25, color: COLORS.ink, margin: "6px 0 4px", maxWidth: 780 }}>
            A {pts(points)}-point swing from {from} to {to} would change <strong style={{ ...numeric, color: toColour }}>{flips.length}</strong> {flips.length === 1 ? "seat" : "seats"}.
          </p>
          <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, margin: "0 0 14px" }}>
            {from} would fall from {fromTotal} to {fromTotal - flips.length} of these seats, and {to} would rise from {toTotal} to {toTotal + flips.length}.
          </p>
          <Curve curve={curve} points={points} fromColour={fromColour} toColour={toColour} max={max} />
          <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, margin: "4px 0 14px" }}>Seats {to} would win from {from}, by size of swing (points). The dashed line is the swing picked above.</p>
          {flips.length > 0 && (
            <>
              <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: COLORS.ink, margin: "6px 0 4px" }}>The seats that would change</h3>
              <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))", gap: "0 24px" }}>
                {flips.slice(0, showAll ? 400 : 12).map((r) => (
                  <li key={r.key} style={{ borderTop: `1px solid ${COLORS.hairline}` }}>
                    <a href={seatHref(r.name)} className="ons-tap" style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", padding: "9px 2px", textDecoration: "none", color: COLORS.ink, fontFamily: FONT_BODY, fontSize: 14 }}>
                      <span style={{ fontWeight: 700 }}>{r.name}</span>
                      <span style={{ ...numeric, fontSize: 13, color: COLORS.inkSoft, whiteSpace: "nowrap" }}>needs {pts(r.swing)}</span>
                    </a>
                  </li>
                ))}
              </ol>
              {flips.length > 12 && <button type="button" className="ons-tap" onClick={() => setShowAll((v) => !v)} style={{ ...pillStyle(false), marginTop: 12 }}>{showAll ? "Show fewer" : `Show all ${flips.length}`}</button>}
            </>
          )}
          <div style={{ marginTop: 16 }}>
            <ShareButton filename="what-if-the-vote-moved" label="Share this as an image" getSpec={() => swingShareSpec({ from, to, points, flips, fromTotal, toTotal, fromColour, toColour, link: window.location.href })} />
          </div>
        </>
      )}
    </section>
  );
}

function SeatList({ rows, parties }) {
  const [end, setEnd] = useState("closest");
  const [party, setParty] = useState("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(25);
  const ordered = useMemo(() => (end === "closest" ? rows : [...rows].reverse()), [rows, end]);
  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => ordered.filter((r) => (party === "all" || r.winner === party) && (!q || r.name.toLowerCase().includes(q) || r.mp?.name?.toLowerCase().includes(q))), [ordered, party, q]);

  return (
    <section aria-labelledby="h-seat-list" style={{ ...card, marginTop: 20 }}>
      <h2 id="h-seat-list" style={cardTitle}>Every seat, closest first</h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.inkSoft, margin: "6px 0 14px", maxWidth: 780 }}>
        The swing a seat needs is half the winner&apos;s lead over the runner-up: a 4-point lead falls to nothing on a 2-point swing. There is no official line between marginal and safe; this site calls a seat marginal when the lead is under 5 points (a swing under 2.5).
      </p>
      <div role="radiogroup" aria-label="Which seats first" style={{ display: "inline-flex", gap: 6, marginBottom: 12 }}>
        {[["closest", "Closest first"], ["safest", "Safest first"]].map(([id, label]) => (
          <button key={id} type="button" role="radio" aria-checked={end === id} className="ons-chip" onClick={() => { setEnd(id); setLimit(25); }} style={pillStyle(end === id)}>{label}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: "10px 16px", marginBottom: 6 }}>
        <div>
          <label htmlFor="seat-q" style={labelStyle}>Find a seat or MP</label>
          <input id="seat-q" type="search" className="ons-chip" value={query} onChange={(e) => { setQuery(e.target.value); setLimit(25); }} placeholder="Type a name" autoComplete="off" style={field} />
        </div>
        <div>
          <label htmlFor="seat-party" style={labelStyle}>Held by</label>
          <select id="seat-party" className="ons-chip" value={party} onChange={(e) => { setParty(e.target.value); setLimit(25); }} style={field}>
            <option value="all">Any party</option>
            {parties.map((p) => <option key={p.party} value={p.party}>{p.party} ({p.count})</option>)}
          </select>
        </div>
      </div>
      <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, margin: "8px 0 0" }} aria-live="polite">{filtered.length} {filtered.length === 1 ? "seat" : "seats"}.</p>
      <ol style={{ listStyle: "none", margin: "4px 0 0", padding: 0 }}>
        {filtered.slice(0, limit).map((r, i) => (
          <li key={r.key} style={{ borderTop: `1px solid ${COLORS.hairline}` }}>
            <a href={seatHref(r.name)} className="ons-tap" style={{ display: "grid", gridTemplateColumns: "34px minmax(0, 1fr) auto", gap: "2px 12px", alignItems: "center", padding: "10px 4px", textDecoration: "none", color: COLORS.ink }}>
              <span style={{ ...numeric, fontSize: 13.5, color: COLORS.inkSoft }}>{i + 1}</span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 14.5, fontWeight: 700 }}>{r.name}</span>
                <span style={{ display: "flex", flexWrap: "wrap", gap: "2px 14px", marginTop: 2 }}>
                  <Chip party={r.winner} colourHex={r.winnerColour} />
                  <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>then</span>
                  <Chip party={r.second} colourHex={r.secondColour} />
                </span>
              </span>
              <span style={{ textAlign: "right" }}>
                <span style={{ ...numeric, display: "block", fontSize: 15, fontWeight: 600 }}>{pts(r.swing)}</span>
                <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>swing needed · {fmt(r.majority)} votes</span>
              </span>
            </a>
          </li>
        ))}
      </ol>
      {filtered.length > limit && <button type="button" className="ons-tap" onClick={() => setLimit((n) => n + 50)} style={{ ...pillStyle(false), marginTop: 14 }}>Show 50 more</button>}
    </section>
  );
}

export default function Marginals() {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    import("../data/constituencies.json").then((m) => alive && setData(m.default)).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, []);
  const rows = useMemo(() => (data ? seatRows(data.constituencies) : []), [data]);
  const parties = useMemo(() => seatsByParty(rows), [rows]);
  const marginal = rows.filter((r) => r.lead < 5).length;
  const tiny = rows.filter((r) => r.majority < 1000).length;

  return (
    <div className="regions-wrap" style={{ maxWidth: 1240, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={IconSwing} title="Marginal seats and swing" subtitle="Which seats could change hands, how far the vote would have to move to do it, and what happens if it does." />
      {failed && <LoadFailedNote item="the election results" />}
      {!failed && !data && <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft }}>Loading the results…</p>}
      {data && rows.length > 0 && (
        <>
          <div className="box-row" style={{ "--n": 3, "--min": "200px", "--gap": "14px" }}>
            {[
              [marginal, "marginal seats", "won by under 5 points of the vote"],
              [tiny, "seats won by under 1,000 votes", `The closest was ${rows[0].name}, by ${fmt(rows[0].majority)}`],
              [rows.filter((r) => r.lead >= 20).length, "very safe seats", "won by 20 points or more"],
            ].map(([n, label, note]) => (
              <div key={label} style={{ ...card, padding: "16px 18px" }}>
                <div style={{ ...numeric, fontSize: 38, fontWeight: 700, letterSpacing: "-0.03em", color: COLORS.ink, lineHeight: 1 }}>{n}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 14.5, fontWeight: 700, color: COLORS.ink, marginTop: 6 }}>{label}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 2 }}>{note}</div>
              </div>
            ))}
          </div>

          <SwingTool rows={rows} parties={parties} />

          <section aria-labelledby="h-swing-bands" className="regions-wrap" style={{ ...card, marginTop: 20 }}>
            <h2 id="h-swing-bands" style={cardTitle}>How safe is each party&apos;s hold?</h2>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.inkSoft, margin: "6px 0 14px", maxWidth: 780 }}>
              Seats grouped by the swing it would take to lose them, coloured by the party that holds them now.
            </p>
            <Bands rows={rows} parties={parties} />
          </section>

          <SeatList rows={rows} parties={parties} />

          <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.6, color: COLORS.inkSoft, marginTop: 24, maxWidth: 800 }}>
            Results are from Parliament&apos;s Members API for each seat&apos;s latest election, mostly the 2024 general election (a few seats have since had a by-election). The seats counted are the {rows.length} with a full result. The two-party swing used here is half the winner&apos;s lead; real elections do not move evenly, and several parties compete in most seats.
          </p>
        </>
      )}
    </div>
  );
}
