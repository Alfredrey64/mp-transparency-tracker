import { useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING, numeric } from "../theme";
import { partyColour } from "../lib/format";
import { seatRows, seatsByParty, uniformSwing, swingCurve, challengers } from "../lib/swing";
import { PageHeader, LoadFailedNote } from "./shared";
import { IconSwing } from "./icons";
import ShareButton from "./ShareButton";
import { swingShareSpec } from "../lib/shareSpecs";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";
import { Segmented } from "./DeprivationControls";

// Marginal seats: how close each seat was at the last election, how many voters would have to change their minds to change who
// wins it, and a tool to try "what if" shifts. Everything comes from each seat's latest result; lib/swing.js has the arithmetic.
// The page talks about votes and "out of every 100 voters" rather than swing, which is explained once and then left alone.

const labelStyle = { fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.ink, marginBottom: 6, display: "block" };
const field = { fontFamily: FONT_BODY, fontSize: 16, padding: "10px 12px", borderRadius: 12, border: `1.5px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, width: "100%", boxSizing: "border-box" };
const para = { fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.6, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 780 };
const colour = (hex) => partyColour(hex, COLORS.inkSoft);
const fmt = (n) => Math.round(n).toLocaleString("en-GB");
const seatHref = (name) => `#/constituency/${encodeURIComponent(name)}`;
const one = (n) => (n > 0 && n < 0.1 ? "under 0.1" : (Math.round(n * 10) / 10).toFixed(1));
const ordinal = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : { 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th"}`;

// Voters who would have to switch from the winner to the runner-up to change the result. Each switch moves the gap by two votes.
const votesToFlip = (r) => Math.floor(r.majority / 2) + 1;
const voters = (n) => `${fmt(n)} ${n === 1 ? "voter" : "voters"}`;

// How safe a seat is, in words, from the winner's lead in points.
// Colours run from hot to cool: the closer the seat, the hotter.
const SAFETY = [
  { max: 5, label: "Marginal", note: "lead under 5 points", hue: "#E5484D" },
  { max: 10, label: "Fairly safe", note: "lead of 5 to 10 points", hue: "#E8A33A" },
  { max: 20, label: "Safe", note: "lead of 10 to 20 points", hue: "#2FA58E" },
  { max: Infinity, label: "Very safe", note: "lead of 20 points or more", hue: "#4F6FD8" },
];
const safetyOf = (lead) => SAFETY.find((b) => lead < b.max);

function Chip({ party, colourHex }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink }}>
      <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: "50%", background: colour(colourHex), flexShrink: 0 }} />
      {party}
    </span>
  );
}

// All the seats in one picture: a bar for each, closest on the left, safest on the right, coloured by the party that won it.
function Spectrum({ rows }) {
  const [at, setAt] = useState(0);
  const W = 1000, H = 210, CAP = 40;
  const n = rows.length;
  const bw = W / n;
  const edges = SAFETY.slice(0, -1).map((b) => rows.findIndex((r) => r.lead >= b.max));
  const bounds = [0, ...edges.map((e) => (e < 0 ? n : e)), n];
  const counts = SAFETY.map((_, i) => bounds[i + 1] - bounds[i]);
  const r = rows[at] ?? rows[0];
  const band = safetyOf(r.lead);
  const pick = (e) => {
    const box = e.currentTarget.getBoundingClientRect();
    setAt(Math.max(0, Math.min(n - 1, Math.floor(((e.clientX - box.left) / box.width) * n))));
  };
  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`} role="img" tabIndex={0} preserveAspectRatio="none"
        aria-label={`All ${n} seats as bars from the closest on the left to the safest on the right. Use the left and right arrow keys to move along them.`}
        style={{ width: "100%", height: "clamp(130px, 22vw, 210px)", display: "block", touchAction: "pan-y", cursor: "crosshair", outline: "none", borderRadius: 10 }}
        onPointerDown={pick} onPointerMove={(e) => { if (e.pointerType === "mouse" || e.buttons) pick(e); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") { e.preventDefault(); setAt((v) => Math.min(n - 1, v + (e.shiftKey ? 10 : 1))); }
          if (e.key === "ArrowLeft") { e.preventDefault(); setAt((v) => Math.max(0, v - (e.shiftKey ? 10 : 1))); }
        }}
      >
        {SAFETY.map((b, i) => (
          <rect key={b.label} x={bounds[i] * bw} y={0} width={counts[i] * bw} height={H} fill={b.hue} opacity="0.1" />
        ))}
        {rows.map((row, i) => {
          const h = Math.max(4, (Math.min(row.lead, CAP) / CAP) * (H - 8));
          return <rect key={row.key} x={i * bw + 0.25} y={H - h} width={Math.max(0.6, bw - 0.5)} height={h} fill={colour(row.winnerColour)} opacity={i === at ? 1 : 0.88} />;
        })}
        <rect x={at * bw - 1.5} y={0} width={bw + 3} height={H} fill="none" stroke={COLORS.ink} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div aria-hidden="true" style={{ display: "flex", height: 7, borderRadius: 4, overflow: "hidden", gap: 2, marginTop: 6 }}>
        {SAFETY.map((b, i) => <span key={b.label} style={{ flex: counts[i], background: b.hue }} />)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 6 }}>
        <span>Closest result</span>
        <span>Safest seat</span>
      </div>

      <div aria-live="polite" style={{ marginTop: 14, padding: "14px 16px", borderRadius: 14, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: `5px solid ${colour(r.winnerColour)}`, display: "flex", flexWrap: "wrap", gap: "8px 18px", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>Seat {at + 1} of {n}, from the closest</div>
          <a href={seatHref(r.name)} style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 700, color: COLORS.ink, textDecoration: "none" }}>{r.name}</a>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 2 }}>
            <strong style={{ color: COLORS.ink }}>{r.winner}</strong> won by {fmt(r.majority)} {r.majority === 1 ? "vote" : "votes"}, ahead of {r.second}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ display: "inline-block", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: "#fff", background: band.hue, borderRadius: 999, padding: "3px 11px" }}>{band.label}</span>
          <div style={{ ...numeric, fontSize: 13.5, color: COLORS.ink, marginTop: 5 }}>{voters(votesToFlip(r))} to flip it</div>
        </div>
      </div>
      <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, margin: "10px 0 0" }}>Each bar is one seat. The taller the bar, the further ahead the winner finished. Move across the bars, or tap one, to see the seat.</p>
    </div>
  );
}

// The closest results as head-to-head cards: a tug of war between the winner and the runner-up.
function Tightest({ rows }) {
  const top = rows.slice(0, 6);
  return (
    <section aria-labelledby="h-tight" style={{ marginTop: 28 }}>
      <h2 id="h-tight" style={{ ...cardTitle, fontSize: 24 }}>The six closest races</h2>
      <p style={para}>Each of these seats was decided by {fmt(top.at(-1).majority)} votes or fewer. A busy bus, a wet afternoon or a few postal votes going astray could have changed who won them.</p>
      <ol style={{ listStyle: "none", margin: "16px 0 0", padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))", gap: 14 }}>
        {top.map((r, i) => {
          const win = 50 + r.lead / 2;
          return (
            <li key={r.key}>
              <a href={seatHref(r.name)} className="ons-tap" style={{ display: "block", height: "100%", boxSizing: "border-box", textDecoration: "none", color: COLORS.ink, background: `linear-gradient(160deg, ${colour(r.winnerColour)}1c, ${COLORS.paperCard} 55%)`, border: `1px solid ${COLORS.hairline}`, borderRadius: 20, padding: "16px 18px 18px", boxShadow: "0 18px 40px -30px rgba(0,0,0,0.6)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                  <span style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>{r.name}</span>
                  <span style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, flexShrink: 0 }}>No. {i + 1}</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 10 }}>
                  <span style={{ ...numeric, fontSize: 44, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1 }}>{fmt(r.majority)}</span>
                  <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft }}>{r.majority === 1 ? "vote" : "votes"} in it</span>
                </div>
                <div role="img" aria-label={`${r.winner} narrowly ahead of ${r.second}`} style={{ position: "relative", display: "flex", height: 14, borderRadius: 7, overflow: "hidden", gap: 2, margin: "14px 0 8px" }}>
                  <span style={{ width: `${win}%`, background: colour(r.winnerColour) }} />
                  <span style={{ flex: 1, background: colour(r.secondColour) }} />
                  <span aria-hidden="true" style={{ position: "absolute", left: "50%", top: -2, bottom: -2, width: 2, background: COLORS.ink, opacity: 0.55 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontFamily: FONT_BODY, fontSize: 13 }}>
                  <span style={{ minWidth: 0 }}><strong>{r.winner}</strong> won</span>
                  <span style={{ color: COLORS.inkSoft, textAlign: "right", minWidth: 0 }}>{r.second} second</span>
                </div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 8 }}>{voters(votesToFlip(r))} switching would flip it</div>
              </a>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// "Find your seat": how close it was, in plain words.
function Finder({ rows }) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(null);
  const q = query.trim().toLowerCase();
  const matches = useMemo(() => (q.length < 2 ? [] : rows.filter((r) => r.name.toLowerCase().includes(q) || r.mp?.name?.toLowerCase().includes(q)).slice(0, 6)), [rows, q]);
  const r = picked ? rows.find((x) => x.key === picked) : null;
  const rank = r ? rows.findIndex((x) => x.key === r.key) + 1 : null;
  return (
    <section aria-labelledby="h-finder" style={{ ...card, marginTop: 24 }}>
      <h2 id="h-finder" style={cardTitle}>How close was your seat?</h2>
      <label htmlFor="finder-q" style={{ ...labelStyle, marginTop: 12 }}>Type your constituency or your MP</label>
      <input id="finder-q" type="search" className="ons-chip" value={query} onChange={(e) => { setQuery(e.target.value); setPicked(null); }} placeholder="For example Gosport" autoComplete="off" style={{ ...field, maxWidth: 440 }} />
      {matches.length > 0 && !r && (
        <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0, maxWidth: 440, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, overflow: "hidden" }}>
          {matches.map((m) => (
            <li key={m.key} style={{ borderTop: `1px solid ${COLORS.hairline}` }}>
              <button type="button" onClick={() => { setPicked(m.key); setQuery(m.name); }} style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "10px 14px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 14.5, color: COLORS.ink }}>
                <strong>{m.name}</strong> <span style={{ color: COLORS.inkSoft }}>{m.mp?.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {r && (
        <div aria-live="polite" style={{ marginTop: 16, padding: "16px 18px", borderRadius: 14, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: `5px solid ${colour(r.winnerColour)}` }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: COLORS.ink }}>{r.name}</div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.65, color: COLORS.ink, margin: "8px 0 0", maxWidth: 680 }}>
            <strong>{r.winner}</strong> won it by <strong>{fmt(r.majority)} {r.majority === 1 ? "vote" : "votes"}</strong>, ahead of <strong>{r.second}</strong>. That is a lead of {one(r.lead)} points, which makes it <strong>{safetyOf(r.lead).label.toLowerCase()}</strong>.
            If just <strong>{voters(votesToFlip(r))}</strong> had switched from {r.winner} to {r.second}, {r.second} would have won.
            It is the <strong>{ordinal(rank)} closest</strong> of {rows.length} seats.
          </p>
          <a href={seatHref(r.name)} className="ons-tap" style={{ display: "inline-block", marginTop: 8, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink }}>See the full result for this seat</a>
        </div>
      )}
    </section>
  );
}

function Explainer() {
  const items = [
    ["Lead", "How far ahead the winner finished, as a share of all the votes. A lead of 4 points means the winner had 4 more votes in every 100 than the runner-up."],
    ["Switching voters", "If a voter changes from the winner to the runner-up, the gap shrinks by two votes. So a seat flips once about half the winner's majority has changed sides."],
    ["Marginal", "There is no official line. This page calls a seat marginal when the lead was under 5 points."],
  ];
  return (
    <section aria-labelledby="h-explainer" style={{ ...card, marginTop: 20, background: COLORS.paper }}>
      <h2 id="h-explainer" style={{ ...cardTitle, fontSize: 18 }}>Three words used on this page</h2>
      <dl style={{ margin: "12px 0 0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: "12px 22px" }}>
        {items.map(([t, d]) => (
          <div key={t}>
            <dt style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink }}>{t}</dt>
            <dd style={{ margin: "3px 0 0", fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.55, color: COLORS.inkSoft }}>{d}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// How many seats are in each band of safety, split by the party that holds them.
function Bands({ rows, parties }) {
  const top = parties.slice(0, 5);
  const topNames = new Set(top.map((p) => p.party));
  const data = SAFETY.map((b, i) => {
    const lo = i ? SAFETY[i - 1].max : 0;
    const inBand = rows.filter((r) => r.lead >= lo && r.lead < b.max);
    return { ...b, total: inBand.length, segs: top.map((p) => ({ party: p.party, colour: p.colour, n: inBand.filter((r) => r.winner === p.party).length })), other: inBand.filter((r) => !topNames.has(r.winner)).length };
  });
  return (
    <div>
      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(210px, 100%), 1fr))", gap: 12 }}>
        {data.map((d) => (
          <li key={d.label} style={{ background: `linear-gradient(170deg, ${d.hue}26, ${COLORS.paper} 70%)`, border: `1px solid ${d.hue}55`, borderTop: `5px solid ${d.hue}`, borderRadius: 16, padding: "14px 16px 16px" }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink }}>{d.label}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>{d.note}</div>
            <div style={{ ...numeric, fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, color: COLORS.ink, margin: "8px 0 10px" }}>{d.total}<span style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: COLORS.inkSoft, letterSpacing: 0 }}> seats</span></div>
            <span role="img" aria-label={`${d.total} seats: ${d.segs.filter((s) => s.n).map((s) => `${s.party} ${s.n}`).join(", ")}${d.other ? `, others ${d.other}` : ""}`} style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden", gap: 2 }}>
              {d.segs.filter((s) => s.n).map((s) => <span key={s.party} style={{ flex: s.n, background: colour(s.colour) }} />)}
              {d.other > 0 && <span style={{ flex: d.other, background: COLORS.inkSoft, opacity: 0.6 }} />}
            </span>
          </li>
        ))}
      </ol>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginTop: 14 }}>
        {top.map((p) => <Chip key={p.party} party={p.party} colourHex={p.colour} />)}
      </div>
    </div>
  );
}

// Seats a party would win as more voters switch, with the chosen number marked.
function Curve({ curve, points, fromColour, toColour, max }) {
  const W = 460, H = 220, L = 34, B = 40, T = 10, R = 10;
  const top = Math.max(...curve.map((c) => c.seats), 5);
  const x = (p) => L + (p / max) * (W - L - R);
  const y = (n) => H - B - (n / top) * (H - B - T);
  const path = curve.map((c, i) => `${i ? "L" : "M"}${x(c.points).toFixed(1)} ${y(c.seats).toFixed(1)}`).join("");
  const at = curve[Math.min(max, Math.max(0, Math.round(points)))];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Seats won as more voters switch: ${at.seats} seats when ${points} in every 100 switch`} style={{ width: "100%", height: "auto", display: "block", maxWidth: 520 }}>
      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(top * t)} y2={y(top * t)} stroke={COLORS.hairline} strokeWidth="1" />
          <text x={L - 6} y={y(top * t) + 5} textAnchor="end" fontFamily={FONT_BODY} fontSize="14" fill={COLORS.inkSoft}>{Math.round(top * t)}</text>
        </g>
      ))}
      {[0, 5, 10, 15, 20].filter((p) => p <= max).map((p) => (
        <text key={p} x={x(p)} y={H - 20} textAnchor="middle" fontFamily={FONT_BODY} fontSize="14" fill={COLORS.inkSoft}>{p}</text>
      ))}
      <text x={(L + W - R) / 2} y={H - 2} textAnchor="middle" fontFamily={FONT_BODY} fontSize="14" fill={COLORS.inkSoft}>voters switching, out of every 100</text>
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

  return (
    <section aria-labelledby="h-swing-tool" className="regions-wrap" style={{ ...card, marginTop: 20, background: `radial-gradient(560px 300px at 85% 0%, ${toColour}22, transparent 70%), ${COLORS.paperCard}` }}>
      <h2 id="h-swing-tool" style={cardTitle}>What if voters changed their minds?</h2>
      <p style={para}>
        Try it. Pick a party that loses voters, a party that gains them, and how many voters switch. The page applies the same switch to every seat and counts how many would change hands. It uses the last election&apos;s results and is a rough guide, not a forecast: real elections do not move evenly, and other parties matter too.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: "14px 20px", margin: "18px 0 14px" }}>
        <div>
          <label htmlFor="swing-from" style={labelStyle}>1. Voters leave</label>
          <select id="swing-from" className="ons-chip" value={from} onChange={(e) => changeFrom(e.target.value)} style={field}>
            {parties.map((p) => <option key={p.party} value={p.party}>{p.party} (holds {p.count})</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="swing-to" style={labelStyle}>2. and move to</label>
          <select id="swing-to" className="ons-chip" value={to} onChange={(e) => { setTo(e.target.value); setShowAll(false); }} style={field}>
            {names.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="swing-pts" style={labelStyle}>3. How many switch: <span style={{ ...numeric, fontSize: 15 }}>{one(points)}</span> in every 100</label>
          <input id="swing-pts" type="range" min="0" max={max} step="0.5" value={points} onChange={(e) => { setPoints(Number(e.target.value)); setShowAll(false); }} style={{ width: "100%", height: 36, accentColor: toColour }} />
        </div>
      </div>

      {from === to ? (
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft }}>Pick two different parties.</p>
      ) : (
        <>
          <p aria-live="polite" style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(20px, 3.4vw, 28px)", lineHeight: 1.25, color: COLORS.ink, margin: "6px 0 4px", maxWidth: 780 }}>
            If {one(points)} in every 100 voters moved from {from} to {to}, <strong style={{ ...numeric, color: toColour }}>{flips.length}</strong> {flips.length === 1 ? "seat" : "seats"} would change hands.
          </p>
          <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, color: COLORS.inkSoft, margin: "0 0 14px" }}>
            {from} would go from {fromTotal} to {fromTotal - flips.length} of its seats, and {to} from {toTotal} to {toTotal + flips.length}.
          </p>
          <Curve curve={curve} points={points} fromColour={fromColour} toColour={toColour} max={max} />
          <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, margin: "4px 0 14px" }}>Seats {to} would win from {from} as more voters switch. The dashed line shows the number picked above.</p>
          {flips.length > 0 && (
            <>
              <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: COLORS.ink, margin: "6px 0 4px" }}>The seats that would change, easiest first</h3>
              <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(290px, 100%), 1fr))", gap: "0 24px" }}>
                {flips.slice(0, showAll ? 400 : 12).map((r) => (
                  <li key={r.key} style={{ borderTop: `1px solid ${COLORS.hairline}` }}>
                    <a href={seatHref(r.name)} className="ons-tap" style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", padding: "9px 2px", textDecoration: "none", color: COLORS.ink, fontFamily: FONT_BODY, fontSize: 14 }}>
                      <span style={{ fontWeight: 700 }}>{r.name}</span>
                      <span style={{ ...numeric, fontSize: 13, color: COLORS.inkSoft, whiteSpace: "nowrap" }}>{voters(votesToFlip(r))}</span>
                    </a>
                  </li>
                ))}
              </ol>
              {flips.length > 12 && <button type="button" className="ons-tap" onClick={() => setShowAll((v) => !v)} style={{ ...pillStyle(false), marginTop: 12 }}>{showAll ? "Show fewer" : `Show all ${flips.length}`}</button>}
            </>
          )}
          <div style={{ marginTop: 16 }}>
            <ShareButton filename="what-if-voters-changed-their-minds" label="Share this as an image" getSpec={() => swingShareSpec({ from, to, points, flips, fromTotal, toTotal, fromColour, toColour, link: window.location.href })} />
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
  const [limit, setLimit] = useState(20);
  const ordered = useMemo(() => (end === "closest" ? rows : [...rows].reverse()), [rows, end]);
  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => ordered.filter((r) => (party === "all" || r.winner === party) && (!q || r.name.toLowerCase().includes(q) || r.mp?.name?.toLowerCase().includes(q))), [ordered, party, q]);

  return (
    <section aria-labelledby="h-seat-list" style={{ ...card, marginTop: 20 }}>
      <h2 id="h-seat-list" style={cardTitle}>Every seat, from the closest to the safest</h2>
      <p style={para}>The bigger the number of voters, the safer the seat. A seat that 8 voters could change is on a knife edge; one that would need 20,000 is out of reach.</p>
      <div style={{ margin: "14px 0 8px" }}>
        <Segmented label="Which seats first" value={end} onChange={(v) => { setEnd(v); setLimit(20); }} small options={[{ id: "closest", label: "Closest first" }, { id: "safest", label: "Safest first" }]} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: "10px 16px", marginBottom: 6 }}>
        <div>
          <label htmlFor="seat-q" style={labelStyle}>Search a seat or an MP</label>
          <input id="seat-q" type="search" className="ons-chip" value={query} onChange={(e) => { setQuery(e.target.value); setLimit(20); }} placeholder="Type a name" autoComplete="off" style={field} />
        </div>
        <div>
          <label htmlFor="seat-party" style={labelStyle}>Held by</label>
          <select id="seat-party" className="ons-chip" value={party} onChange={(e) => { setParty(e.target.value); setLimit(20); }} style={field}>
            <option value="all">Any party</option>
            {parties.map((p) => <option key={p.party} value={p.party}>{p.party} ({p.count})</option>)}
          </select>
        </div>
      </div>
      <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, margin: "8px 0 0" }} aria-live="polite">{filtered.length} {filtered.length === 1 ? "seat" : "seats"}.</p>
      <ol style={{ listStyle: "none", margin: "6px 0 0", padding: 0 }}>
        {filtered.slice(0, limit).map((r, i) => {
          const s = safetyOf(r.lead);
          return (
            <li key={r.key} style={{ borderTop: `1px solid ${COLORS.hairline}` }}>
              <a href={seatHref(r.name)} className="ons-tap" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "4px 14px", alignItems: "center", padding: "11px 4px 11px 12px", borderLeft: `4px solid ${s.hue}`, textDecoration: "none", color: COLORS.ink }}>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700 }}>{i + 1}. {r.name}</span>
                  <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "2px 8px", marginTop: 3 }}>
                    <Chip party={r.winner} colourHex={r.winnerColour} />
                    <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>won it, ahead of</span>
                    <Chip party={r.second} colourHex={r.secondColour} />
                  </span>
                </span>
                <span style={{ textAlign: "right" }}>
                  <span style={{ ...numeric, display: "block", fontSize: 17, fontWeight: 700 }}>{voters(votesToFlip(r))}</span>
                  <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>to flip it</span>
                  <span style={{ display: "inline-block", marginTop: 3, fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: "#fff", background: s.hue, borderRadius: 999, padding: "1px 9px" }}>{s.label}</span>
                </span>
              </a>
            </li>
          );
        })}
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
  const safe = rows.filter((r) => r.lead >= 20).length;

  return (
    <div className="regions-wrap" style={{ maxWidth: 1240, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={IconSwing} title="Marginal seats" subtitle="Some seats are won by thousands of votes, others by a handful. See how close your seat was, which ones could change hands next time, and try your own what-if." />
      {failed && <LoadFailedNote item="the election results" />}
      {!failed && !data && <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft }}>Loading the results…</p>}
      {data && rows.length > 0 && (
        <>
          <section aria-labelledby="h-spectrum" className="regions-wrap" style={{ ...card, marginTop: 4, padding: "clamp(18px, 3.5vw, 30px)", background: `radial-gradient(700px 320px at 100% 0%, ${SAFETY[0].hue}26, transparent 65%), radial-gradient(600px 300px at 0% 100%, ${SAFETY[3].hue}22, transparent 65%), ${COLORS.paperCard}` }}>
            <h2 id="h-spectrum" style={{ ...cardTitle, fontSize: "clamp(20px, 3vw, 26px)" }}>{rows.length} seats, from the closest to the safest</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px 34px", margin: "16px 0 22px" }}>
              {[
                [tiny, "seats won by fewer than 1,000 votes", SAFETY[0].hue],
                [marginal, "marginal seats, with a lead under 5 points", SAFETY[1].hue],
                [safe, "very safe seats, with a lead of 20 points or more", SAFETY[3].hue],
              ].map(([n, label, hue]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ ...numeric, fontSize: "clamp(36px, 7vw, 54px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, color: hue }}>{n}</span>
                  <span style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.35, color: COLORS.ink, maxWidth: 170 }}>{label}</span>
                </div>
              ))}
            </div>
            <Spectrum rows={rows} />
          </section>

          <Tightest rows={rows} />

          <Finder rows={rows} />
          <Explainer />
          <SwingTool rows={rows} parties={parties} />

          <section aria-labelledby="h-swing-bands" className="regions-wrap" style={{ ...card, marginTop: 20 }}>
            <h2 id="h-swing-bands" style={cardTitle}>How safe is each party&apos;s hold?</h2>
            <p style={{ ...para, marginBottom: 14 }}>Every seat sorted by how far ahead the winner finished, coloured by the party that holds it.</p>
            <Bands rows={rows} parties={parties} />
          </section>

          <SeatList rows={rows} parties={parties} />

          <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.6, color: COLORS.inkSoft, marginTop: 24, maxWidth: 800 }}>
            Results come from Parliament&apos;s Members API for each seat&apos;s latest election, mostly the 2024 general election (a few seats have had a by-election since). {rows.length} seats have a full result. The what-if tool moves the same share of voters from one party to another in every seat and ignores everyone else, so treat it as a guide.
          </p>
        </>
      )}
    </div>
  );
}
