/** @jsxImportSource react */
import CountUp from "./CountUp";
import "../areasummary.css";

// The summary beside the seat map: a ring of the House of Commons by party, then four figures each with a picture of themselves, then every party's
// seats. It shows the whole UK, or one region when a region is picked.
const R = 54;
const C = 2 * Math.PI * R;
// The big ring in the banner.
const RD = 62;
const CD = 2 * Math.PI * RD;
const pct1 = (n) => (n == null ? "–" : `${(Math.round(n * 10) / 10).toFixed(1)}%`);

function Ring({ share, colour, children }) {
  return (
    <div className="as-mini">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r={R} className="as-mini-bg" />
        <circle cx="60" cy="60" r={R} className="as-mini-fg" stroke={colour} strokeDasharray={C} style={{ "--c": C, "--to": C * (1 - Math.max(0, Math.min(1, share))) }} transform="rotate(-90 60 60)" />
      </svg>
      <div>{children}</div>
    </div>
  );
}

export default function AreaSummaryCard({ summary, label, hint }) {
  const total = summary.seats || 1;
  const parties = summary.parties.slice(0, 7);
  const shown = parties.reduce((t, p) => t + p.count, 0);
  const rest = Math.max(0, summary.seats - shown);
  const arcs = [...parties.map((p) => ({ name: p.party, count: p.count, colour: p.colour })), ...(rest > 0 ? [{ name: "Others", count: rest, colour: "#9AA6B8" }] : [])];
  let offset = 0;
  const majority = Math.floor(total / 2) + 1;
  const tiles = [
    { key: "marginal", n: summary.marginal, label: "marginal seats", sub: "won by under 5 points", colour: "#E0367A", share: summary.marginal / total },
    { key: "gains", n: summary.gains, label: "changed hands in 2024", sub: "a new party won the seat", colour: "#E8741A", share: summary.gains / total },
    { key: "women", n: summary.women, label: "women MPs", sub: pct1((summary.women / total) * 100) + " of the seats", colour: "#7A5AF0", share: summary.women / total },
    ...(summary.avgTurnout != null ? [{ key: "turnout", n: summary.avgTurnout, label: "average turnout", sub: "of voters took part", colour: "#1FA97C", share: summary.avgTurnout / 100, text: true }] : []),
  ];
  const max = Math.max(1, ...summary.parties.map((p) => p.count));
  return (
    <section className="as" aria-label={label}>
      <div className="as-hero">
        <div className="as-donut" role="img" aria-label={`${total} seats by party`}>
          <svg viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={RD} className="as-donut-bg" />
            {arcs.map((a, n) => {
              const len = (a.count / total) * CD;
              const el = <circle key={a.name} cx="80" cy="80" r={RD} fill="none" stroke={a.colour} strokeWidth="18" strokeDasharray={`${Math.max(0, len - 1.6)} ${CD}`} strokeDashoffset={-offset} transform="rotate(-90 80 80)" className="as-arc" style={{ "--n": n }} />;
              offset += len;
              return el;
            })}
            {/* The halfway mark, where a party has a majority: a short line across the ring at the bottom, since the ring starts at the top. */}
            <line x1="80" y1={80 + RD - 14} x2="80" y2={80 + RD + 14} className="as-majority" />
          </svg>
          <div className="as-donut-mid"><b><CountUp value={summary.seats} /></b><span>seats</span></div>
        </div>
        <div className="as-hero-text">
          <h2>{label}</h2>
          {parties[0] ? (
            <p className="as-lead">
              <span className="as-lead-n" style={{ "--lc": parties[0].colour }}><CountUp value={Math.round((parties[0].count / total) * 100)} format={(n) => `${Math.round(n)}%`} /></span>
              <span>of the seats are held by <strong>{parties[0].party}</strong>{parties[0].count >= majority ? ", a majority" : ""}.</span>
            </p>
          ) : <p>No seats to show.</p>}
          <p className="as-sub"><i aria-hidden="true" />{majority} seats are needed for a majority (the white mark on the ring).</p>
        </div>
      </div>
      <div className="as-tiles">
        {tiles.map((t, n) => (
          <div key={t.key} className="as-tile" style={{ "--tc": t.colour, "--i": n }}>
            <Ring share={t.share} colour={t.colour}><b>{t.text ? pct1(t.n) : <CountUp value={t.n} />}</b></Ring>
            <span className="as-tile-label">{t.label}</span>
            <small>{t.sub}</small>
          </div>
        ))}
      </div>
      <ol className="as-parties">
        {summary.parties.slice(0, 7).map((p, n) => (
          <li key={p.party} style={{ "--pc": p.colour, "--n": n }}>
            <span className="as-dot" aria-hidden="true" />
            <b>{p.party}</b>
            <span className="as-track"><i style={{ "--w": p.count / max }} /></span>
            <span className="as-count">{p.count}<small>{Math.round((p.count / total) * 100)}%</small></span>
          </li>
        ))}
      </ol>
      <p className="as-hint">{hint}</p>
    </section>
  );
}
