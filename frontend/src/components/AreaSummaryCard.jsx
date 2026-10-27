/** @jsxImportSource react */
import CountUp from "./CountUp";
import "../areasummary.css";

// The summary beside the seat map: a ring of the House of Commons by party, then four figures each with a picture of themselves, then every party's
// seats. It shows the whole UK, or one region when a region is picked.
const R = 54;
const C = 2 * Math.PI * R;
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
          <svg viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={R + 6} className="as-donut-bg" />
            {arcs.map((a, n) => {
              const len = (a.count / total) * 2 * Math.PI * (R + 6);
              const el = <circle key={a.name} cx="70" cy="70" r={R + 6} fill="none" stroke={a.colour} strokeWidth="16" strokeDasharray={`${Math.max(0, len - 1.5)} ${2 * Math.PI * (R + 6)}`} strokeDashoffset={-offset} transform="rotate(-90 70 70)" className="as-arc" style={{ "--n": n }} />;
              offset += len;
              return el;
            })}
          </svg>
          <div><b><CountUp value={summary.seats} /></b><span>seats</span></div>
        </div>
        <div className="as-hero-text">
          <h3>{label}</h3>
          <p>{parties[0] ? <><strong>{parties[0].party}</strong> hold {Math.round((parties[0].count / total) * 100)}% of the seats{parties[0].count >= majority ? ", a majority" : ""}.</> : "No seats to show."}</p>
          <p className="as-sub">{majority} seats are needed for a majority.</p>
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
