/** @jsxImportSource react */
import "../../samedata.css";

// The same numbers drawn more than once, so the choice behind a chart can be seen. Each panel is a small picture with its own caption saying what was chosen. Nothing moves: the
// point is to compare the pictures side by side.
//   panels  [{ kind: "line", title, from: "1977", to: "2024", values: [..], unit, caption, colour }]
//           [{ kind: "bars", title, bars: [{ label, value }], axisMin, axisMax, caption, colour }]
//   note    the line of small print under the figure
const W = 220;
const H = 120;

function Line({ values, from, to, unit, colour }) {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const x = (i) => 14 + (i / (values.length - 1)) * (W - 28);
  const y = (v) => 14 + (1 - (v - lo) / span) * (H - 44);
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const first = values[0];
  const last = values[values.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`A line from ${first}${unit} in ${from} to ${last}${unit} in ${to}`} className="sd-svg">
      <polyline points={pts} fill="none" stroke={colour} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(0)} cy={y(first)} r="3.6" fill={colour} />
      <circle cx={x(values.length - 1)} cy={y(last)} r="3.6" fill={colour} />
      <text x={x(0)} y={H - 6} className="sd-t" textAnchor="start">{from}: {first}{unit}</text>
      <text x={x(values.length - 1)} y={H - 6} className="sd-t" textAnchor="end">{to}: {last}{unit}</text>
    </svg>
  );
}

function Bars({ bars, axisMin, axisMax, colour }) {
  const bw = 54;
  const gap = 36;
  const left = (W - (bars.length * bw + (bars.length - 1) * gap)) / 2;
  const top = 18;
  const base = H - 26;
  const h = (v) => Math.max(0, ((v - axisMin) / (axisMax - axisMin)) * (base - top));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Bars: ${bars.map((b) => `${b.label} ${b.value}`).join(", ")}, on an axis that starts at ${axisMin}`} className="sd-svg">
      <line x1="8" x2={W - 8} y1={base} y2={base} className="sd-axis" />
      {bars.map((b, i) => {
        const bx = left + i * (bw + gap);
        return (
          <g key={b.label}>
            <rect x={bx} y={base - h(b.value)} width={bw} height={h(b.value)} rx="4" fill={colour} opacity={i === bars.length - 1 ? 1 : 0.55} />
            <text x={bx + bw / 2} y={base - h(b.value) - 5} className="sd-v" textAnchor="middle">{b.value}%</text>
            <text x={bx + bw / 2} y={H - 8} className="sd-t" textAnchor="middle">{b.label}</text>
          </g>
        );
      })}
      <text x="8" y="12" className="sd-t" textAnchor="start">{axisMin === 0 ? "" : `axis starts at ${axisMin}`}</text>
    </svg>
  );
}

export default function SameData({ panels, note }) {
  return (
    <figure className="sd">
      <ul className="sd-grid" style={{ "--n": panels.length }}>
        {panels.map((p) => (
          <li key={p.title} className="sd-panel" style={{ "--tc": p.colour }}>
            <h4>{p.title}</h4>
            {p.kind === "bars" ? <Bars {...p} /> : <Line {...p} />}
            <p>{p.caption}</p>
          </li>
        ))}
      </ul>
      {note && <figcaption>{note}</figcaption>}
    </figure>
  );
}
