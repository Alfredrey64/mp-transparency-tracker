/** @jsxImportSource react */
import { CountUp } from "./Motion";
import "../areaviz.css";

// The pictures used by the cards of Your area's "In numbers" view. Each one is plain HTML or SVG that draws itself once its card scrolls into view: the card sets data-in="true" and the
// rules in areaviz.css (the same pattern as the other cards) hold everything at its starting position until then. Nothing here fetches or computes data; the cards pass in numbers.

const r1 = (v) => Math.round(v * 10) / 10;

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// A row of figures on one scale: a hollow marker for the comparison (England) and a solid dot for the area, joined by a bar that shows the gap. The dot slides out from the
// comparison to its own place when the card appears. `rows` are { label, value, vs, refLabel, note }.
export function Dumbbell({ rows, unit = "years", colour, aria }) {
  const all = rows.flatMap((x) => [x.value, x.vs]).filter((v) => v != null);
  const lo = Math.floor(Math.min(...all) - 2);
  const hi = Math.ceil(Math.max(...all) + 2);
  const at = (v) => (v - lo) / (hi - lo);
  return (
    <ul className="av-dumb" aria-label={aria} style={colour ? { "--mc": colour } : undefined}>
      {rows.map((x) => {
        const a = at(x.value);
        const b = at(x.vs ?? x.value);
        const diff = x.vs == null ? null : r1(x.value - x.vs);
        return (
          <li key={x.label} style={{ "--a": a, "--b": b, "--lo": Math.min(a, b), "--w": Math.abs(a - b), "--o": a > b ? "0%" : "100%" }}>
            <span className="av-dumb-label">{x.label}</span>
            <span className="av-dumb-track" aria-hidden="true">
              <i className="av-dumb-bar" />
              {x.vs != null && <u className="av-dumb-ref" />}
              <b className="av-dumb-dot" />
              <em className="av-dumb-val">{x.value.toFixed(1)}</em>
            </span>
            <span className="av-dumb-note">
              {diff == null ? x.note : <><strong data-tone={diff > 0 ? "up" : diff < 0 ? "down" : "same"}>{diff === 0 ? "Same as" : `${diff > 0 ? "+" : "−"}${Math.abs(diff).toFixed(1)} ${unit}`}</strong> {diff === 0 ? "" : "vs "}{x.refLabel}{x.vs != null ? ` (${x.vs.toFixed(1)})` : ""}</>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// "N in every 100": a hundred small figures, N of them filled. With a comparison, the figures up to the comparison are tinted, any above it stand out in full colour, and any the area
// falls short by are dashed, so the gap can be seen as well as read. Rounded to whole people because a hundred figures cannot show a fraction; the exact number is always in the text.
function Person({ x, y, k, kind }) {
  return (
    <g className="av-person" data-kind={kind} style={{ "--k": k }} transform={`translate(${x} ${y})`}>
      <circle cx="5" cy="2.6" r="2.1" />
      <path d="M1.7 9.4v-2.2c0-1.5 1.5-2.6 3.3-2.6s3.3 1.1 3.3 2.6v2.2z" />
    </g>
  );
}
export function PeopleGrid({ value, compare: refValue, colour, label, caption, total = 100 }) {
  const n = Math.max(0, Math.min(total, Math.round(value)));
  const m = refValue == null ? null : Math.max(0, Math.min(total, Math.round(refValue)));
  const cells = Array.from({ length: total }, (_, k) => {
    let kind = k < n ? "on" : "off";
    if (m != null) {
      if (k < Math.min(n, m)) kind = "on";
      else if (k < n && k >= m) kind = "extra";
      else if (k >= n && k < m) kind = "short";
    }
    // Fill from the bottom left, row by row, so the picture reads like a bar chart that wraps.
    const row = 9 - Math.floor(k / 10);
    const col = k % 10;
    return <Person key={k} x={col * 11} y={row * 11} k={k} kind={kind} />;
  });
  return (
    <figure className="av-people" style={colour ? { "--mc": colour } : undefined}>
      <svg viewBox="0 0 108 108" role="img" aria-label={`${label}: about ${n} in every ${total}${m != null ? `, against ${m} for the comparison` : ""}`}>{cells}</svg>
      <figcaption>
        <strong><CountUp value={value} decimals={1} suffix="%" /></strong>
        <span>{label}</span>
        {caption && <small>{caption}</small>}
      </figcaption>
    </figure>
  );
}
export function PeopleKey({ above = "Above the comparison", below = "Below the comparison", same = "Up to the comparison" }) {
  return (
    <p className="av-key" aria-hidden="true">
      <span><i data-kind="on" />{same}</span>
      <span><i data-kind="extra" />{above}</span>
      <span><i data-kind="short" />{below}</span>
    </p>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// A ring that fills to a share of 100%, with a tick where the comparison sits. The number in the middle counts up.
export function Ring({ value, compare: refValue, colour, label, caption, decimals = 0 }) {
  const R = 46;
  const C = 2 * Math.PI * R;
  const frac = Math.max(0, Math.min(1, value / 100));
  const tick = refValue == null ? null : (Math.max(0, Math.min(1, refValue / 100)) * 360 - 90) * (Math.PI / 180);
  return (
    <figure className="av-ring" style={{ "--mc": colour, "--C": C, "--off": C * (1 - frac) }}>
      <svg viewBox="0 0 120 120" role="img" aria-label={`${label}: ${value.toFixed(decimals)}%${refValue != null ? `, against ${refValue.toFixed(decimals)}% for the comparison` : ""}`}>
        <circle className="av-ring-track" cx="60" cy="60" r={R} />
        <circle className="av-ring-fg" cx="60" cy="60" r={R} transform="rotate(-90 60 60)" strokeDasharray={C} />
        {tick != null && <line className="av-ring-tick" x1={60 + Math.cos(tick) * (R - 9)} y1={60 + Math.sin(tick) * (R - 9)} x2={60 + Math.cos(tick) * (R + 9)} y2={60 + Math.sin(tick) * (R + 9)} />}
      </svg>
      <span className="av-ring-num"><CountUp value={value} decimals={decimals} suffix="%" /></span>
      <figcaption><span>{label}</span>{caption && <small>{caption}</small>}</figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// A line over time that draws left to right, with the area under it fading in and a dot at each reading. `points` are { label, value }. The vertical scale runs from just under the lowest
// reading to just over the highest, so the shape is readable; the lowest and highest readings are printed on it so nobody mistakes the scale for starting at zero.
export function TrendArea({ points, colour, format = (v) => String(v), aria, labelEvery = 1 }) {
  const W = 640;
  const H = 210;
  const pad = { l: 14, r: 14, t: 30, b: 14 };
  const vals = points.map((p) => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || Math.max(Math.abs(max) * 0.1, 1);
  const y0 = min - span * 0.18;
  const y1 = max + span * 0.12;
  const x = (k) => pad.l + (points.length === 1 ? (W - pad.l - pad.r) / 2 : (k / (points.length - 1)) * (W - pad.l - pad.r));
  const y = (v) => pad.t + (1 - (v - y0) / (y1 - y0)) * (H - pad.t - pad.b);
  // A smooth curve that never overshoots a reading (monotone cubic), so a dip cannot be drawn as a bump.
  const xs = points.map((_, k) => x(k));
  const ys = vals.map(y);
  const dx = xs.slice(1).map((v, k) => v - xs[k]);
  const slope = ys.slice(1).map((v, k) => (v - ys[k]) / dx[k]);
  const tan = ys.map((_, k) => (k === 0 ? slope[0] : k === ys.length - 1 ? slope[k - 1] : slope[k - 1] * slope[k] <= 0 ? 0 : (slope[k - 1] + slope[k]) / 2));
  let d = `M${xs[0]} ${ys[0]}`;
  for (let k = 0; k < xs.length - 1; k++) { const h = dx[k] / 3; d += ` C${xs[k] + h} ${ys[k] + tan[k] * h} ${xs[k + 1] - h} ${ys[k + 1] - tan[k + 1] * h} ${xs[k + 1]} ${ys[k + 1]}`; }
  const area = `${d} L${xs.at(-1)} ${H - pad.b} L${xs[0]} ${H - pad.b} Z`;
  const iMin = vals.indexOf(min);
  const iMax = vals.indexOf(max);
  const flat = max === min;
  const gid = `av-g-${Math.round(vals.reduce((s, v) => s + v, 0)) % 100000}-${points.length}`;
  return (
    <figure className="av-trend" style={{ "--mc": colour }}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria}>
        <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--mc)" stopOpacity="0.38" /><stop offset="1" stopColor="var(--mc)" stopOpacity="0.02" /></linearGradient></defs>
        <line className="av-trend-grid" x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} />
        <path className="av-trend-area" d={area} fill={`url(#${gid})`} />
        <path className="av-trend-line" d={d} pathLength="1" />
        {points.map((p, k) => (
          <g key={p.label} className="av-trend-pt" style={{ "--k": k }} tabIndex={0}>
            <circle cx={xs[k]} cy={ys[k]} r="12" className="av-trend-hit" />
            <circle cx={xs[k]} cy={ys[k]} r={k === points.length - 1 ? 6 : 4} className="av-trend-dot" />
            <title>{`${p.label}: ${format(p.value)}`}</title>
          </g>
        ))}
        {!flat && <text className="av-trend-low" x={xs[iMin]} y={ys[iMin] + 20} textAnchor={iMin === 0 ? "start" : iMin === points.length - 1 ? "end" : "middle"}>{format(min)}</text>}
        <text className="av-trend-high" x={xs[flat ? points.length - 1 : iMax]} y={ys[flat ? points.length - 1 : iMax] - 12} textAnchor={(flat ? points.length - 1 : iMax) === 0 ? "start" : (flat ? points.length - 1 : iMax) === points.length - 1 ? "end" : "middle"}>{format(flat ? vals.at(-1) : max)}</text>
      </svg>
      <ol className="av-trend-x" aria-hidden="true">{points.map((p, k) => <li key={p.label} style={k % labelEvery ? { visibility: "hidden" } : undefined}>{p.label}</li>)}</ol>
    </figure>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// One headline number that counts up, with a label and an optional chip (up, down or level against a comparison).
export function StatTile({ value, decimals = 0, prefix = "", suffix = "", label, hint, colour, chip, tone }) {
  return (
    <div className="av-stat" style={{ "--mc": colour }}>
      <span className="av-stat-num"><CountUp value={value} decimals={decimals} prefix={prefix} suffix={suffix} /></span>
      <span className="av-stat-label">{label}</span>
      {chip && <span className="av-stat-chip" data-tone={tone}>{chip}</span>}
      {hint && <small>{hint}</small>}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// One bar split into coloured parts, each with its share, and a key under it that names every part and its count. `parts` are { label, value, colour }.
export function StackBar({ parts, aria }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  return (
    <figure className="av-stack">
      <div className="av-stack-bar" role="img" aria-label={aria}>
        {parts.map((p, k) => <i key={p.label} style={{ "--w": p.value / total, "--c": p.colour, "--k": k }} title={`${p.label}: ${p.value.toLocaleString("en-GB")}`} />)}
      </div>
      <ul className="av-stack-key">
        {parts.map((p) => <li key={p.label}><i style={{ background: p.colour }} aria-hidden="true" />{p.label}<b>{Math.round((p.value / total) * 100)}%</b></li>)}
      </ul>
    </figure>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Columns that rise from a common floor, one per category, each coloured for what it means. `cols` are { key, label, value, colour, sub }.
export function RatingColumns({ cols, aria }) {
  const top = Math.max(...cols.map((c) => c.value), 1);
  return (
    <ol className="av-cols" aria-label={aria}>
      {cols.map((c, k) => (
        <li key={c.key} style={{ "--h": c.value / top, "--c": c.colour, "--k": k }}>
          <span className="av-col"><b><CountUp value={c.value} /></b><i aria-hidden="true" /></span>
          <span className="av-col-label">{c.label}</span>
          {c.sub && <small>{c.sub}</small>}
        </li>
      ))}
    </ol>
  );
}
