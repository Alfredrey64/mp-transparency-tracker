import { useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric, solid } from "../theme";
import { pillStyle } from "../lib/onsStyles";
import { card, cardTitle } from "../lib/onsStyles";
import { bandsBetween, PARTY_COLOURS } from "../lib/governments";
import { yearTicks } from "../lib/onsChart";
import LineChart from "./LineChart";
import { para, strong } from "../lib/insightStyle";

// Building blocks shared by the issue pages (Inequality, Brexit, and the others): the row of toggles at the top, a card with a title and its source,
// headline figures, bars for comparing a handful of things, a note about a limit of the figures, and a time chart with who was in government behind it.

// A row of toggles with a line under it saying what the chosen one shows.
export function PageToggles({ tabs, current, onPick, label, idPrefix }) {
  const active = tabs.find((t) => t.key === current) ?? tabs[0];
  return (
    <div style={{ scrollMarginTop: 12 }}>
      <div role="tablist" aria-label={label} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {tabs.map((t) => {
          const on = t.key === active.key;
          return (
            <button
              key={t.key} role="tab" id={`${idPrefix}-tab-${t.key}`} aria-selected={on} aria-controls={`${idPrefix}-panel`} type="button" onClick={() => onPick(t.key)}
              style={{ minHeight: 44, padding: "9px 16px", borderRadius: 999, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, lineHeight: 1.2, border: `1.5px solid ${on ? solid(t.colour) : COLORS.hairline}`, background: on ? solid(t.colour) : COLORS.paperCard, color: on ? "#fff" : COLORS.ink, boxShadow: on ? `0 8px 18px -12px ${t.colour}` : "none", transition: "background 0.2s, color 0.2s, border-color 0.2s" }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <p style={{ fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.55, color: COLORS.inkSoft, margin: "12px 2px 0", maxWidth: 780 }}>{active.blurb}</p>
    </div>
  );
}

// A card with a title, an optional one-line lead, and where the figures come from.
export function Panel({ title, lead, children, sources, accent, id, style }) {
  return (
    <section aria-labelledby={id} style={{ ...card, marginTop: 18, ...(accent ? { borderTop: `5px solid ${accent}` } : null), ...style }}>
      <h2 id={id} style={{ ...cardTitle, fontSize: 19 }}>{title}</h2>
      {lead && <p style={{ ...para, marginTop: 4 }}>{lead}</p>}
      <div style={{ marginTop: 14 }}>{children}</div>
      {sources?.length > 0 && <SourceLine sources={sources} />}
    </section>
  );
}

export function SourceLine({ sources }) {
  return (
    <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "14px 0 0" }}>
      Source:{" "}
      {sources.map((s, i) => (
        <span key={s.url}>
          {i > 0 && "; "}
          <a href={s.url} target="_blank" rel="noreferrer" style={{ color: COLORS.inkSoft }}>{s.label}<span className="sr-only"> (opens in a new tab)</span></a>
        </span>
      ))}
      .
    </p>
  );
}

// A tiny line with no axes, to show the direction of a headline figure at a glance.
function Spark({ values, colour }) {
  const v = values.filter((x) => x !== null && x !== undefined);
  if (v.length < 2) return null;
  const lo = Math.min(...v);
  const hi = Math.max(...v);
  const W = 120;
  const H = 30;
  const pts = v.map((y, i) => `${((i / (v.length - 1)) * (W - 6) + 3).toFixed(1)},${(H - 4 - ((y - lo) / (hi - lo || 1)) * (H - 8)).toFixed(1)}`);
  const end = pts[pts.length - 1].split(",");
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: "block", marginTop: 10, maxWidth: 140, overflow: "visible" }}>
      <polyline points={pts.join(" ")} fill="none" stroke={colour} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={end[0]} cy={end[1]} r="3" fill={colour} />
    </svg>
  );
}

// Headline figures. Up to three in a row on a wide screen, two on a phone, never a lone box. An item can carry `spark`, a list of values over time.
export function Stats({ items, accent }) {
  return (
    <div className="box-row" style={{ "--n": items.length <= 4 ? Math.max(items.length, 1) : 3, "--min": "150px", "--gap": "10px" }}>
      {items.map((s) => (
        <div key={s.label} style={{ padding: "14px 16px", borderRadius: 16, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderTop: `4px solid ${s.accent ?? accent}`, minWidth: 0 }}>
          <div style={{ ...numeric, fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.02em", color: COLORS.ink }}>{s.value}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: COLORS.ink, marginTop: 6, lineHeight: 1.35 }}>{s.label}</div>
          {s.note && <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 3, lineHeight: 1.4 }}>{s.note}</div>}
          {s.spark && <Spark values={s.spark} colour={s.accent ?? accent} />}
        </div>
      ))}
    </div>
  );
}

// "The short version": a few plain sentences that sum up a page, set apart from the cards.
export function Takeaways({ title = "The short version", items, accent }) {
  return (
    <aside aria-label={title} style={{ marginTop: 18, padding: "16px 20px 14px", borderRadius: 18, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderLeft: `6px solid ${accent}` }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: COLORS.ink, margin: 0 }}>{title}</h2>
      <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
        {items.map((t, i) => (
          <li key={i} style={{ display: "grid", gridTemplateColumns: "10px minmax(0, 1fr)", gap: 10, fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.55, color: COLORS.ink }}>
            <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 4, background: accent, marginTop: 8 }} />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

// Horizontal bars for comparing a handful of things. Each row is { label, value, text, note, tone } and `max` is the length of a full bar.
export function BarRows({ rows, max, accent, label }) {
  const top = max ?? Math.max(...rows.map((r) => Math.abs(r.value)), 1);
  return (
    <ul aria-label={label} style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 9 }}>
      {rows.map((r) => (
        <li key={r.label} style={{ display: "grid", gridTemplateColumns: "minmax(0, 11rem) minmax(0, 1fr) auto", gap: "4px 12px", alignItems: "center", fontFamily: FONT_BODY, fontSize: 13.5 }} className="bar-row">
          <span style={{ color: COLORS.ink, fontWeight: r.strong ? 700 : 500, lineHeight: 1.3 }}>{r.label}{r.note && <span style={{ display: "block", color: COLORS.inkSoft, fontWeight: 400, fontSize: 12 }}>{r.note}</span>}</span>
          <span aria-hidden="true" style={{ height: 14, borderRadius: 7, background: COLORS.hairline, overflow: "hidden", display: "block" }}>
            <span style={{ display: "block", height: "100%", width: `${Math.max(1.5, (Math.abs(r.value) / top) * 100)}%`, borderRadius: 7, background: r.tone ?? accent }} />
          </span>
          <span style={{ ...numeric, fontSize: 14, fontWeight: 600, color: COLORS.ink, textAlign: "right", minWidth: "4.5ch" }}>{r.text}</span>
        </li>
      ))}
      <style>{`@media (max-width: 520px) { .bar-row { grid-template-columns: minmax(0, 1fr) auto !important; } .bar-row > span:nth-child(2) { grid-column: 1 / -1; grid-row: 2; } }`}</style>
    </ul>
  );
}

// Ranges on a line that runs from a loss to a gain. Each row is { label, note, low, high } in percent; a bar starts at `low` and ends at `high`.
export function RangeRows({ rows, min = -10, max = 10, label, lossColour = "#D6455D", gainColour = "#1FA97C" }) {
  const span = max - min;
  const x = (v) => `${((v - min) / span) * 100}%`;
  return (
    <ul aria-label={label} style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 14 }}>
      {rows.map((r) => (
        <li key={r.label} style={{ fontFamily: FONT_BODY, fontSize: 13.5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
            <span style={{ color: COLORS.ink, fontWeight: 700 }}>{r.label}</span>
            <span style={{ ...numeric, fontWeight: 600, color: COLORS.ink }}>{r.text}</span>
          </div>
          <div aria-hidden="true" style={{ position: "relative", height: 16, margin: "6px 0 4px", borderRadius: 8, background: COLORS.hairline }}>
            <span style={{ position: "absolute", left: x(0), top: -3, bottom: -3, width: 2, marginLeft: -1, background: COLORS.inkSoft, opacity: 0.7 }} />
            <span style={{ position: "absolute", top: 0, bottom: 0, left: x(Math.min(r.low, r.high)), width: `${(Math.abs(r.high - r.low) / span) * 100}%`, minWidth: 6, borderRadius: 8, background: r.high <= 0 ? lossColour : r.low >= 0 ? gainColour : COLORS.inkSoft }} />
          </div>
          {r.note && <div style={{ color: COLORS.inkSoft, fontSize: 12.5, lineHeight: 1.45 }}>{r.note}</div>}
        </li>
      ))}
    </ul>
  );
}

// A note about a limit of the figures.
export function Caution({ children, title = "Worth knowing" }) {
  return (
    <div role="note" style={{ marginTop: 14, padding: "11px 14px", borderRadius: 12, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${COLORS.inkSoft}`, fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.6, color: COLORS.inkSoft }}>
      <strong style={strong}>{title}.</strong> {children}
    </div>
  );
}

export function Legend({ items }) {
  return (
    <ul aria-hidden="true" style={{ listStyle: "none", margin: "0 0 8px", padding: 0, display: "flex", flexWrap: "wrap", gap: "4px 16px", fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink }}>
      {items.map((i) => (
        <li key={i.name} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 14, height: 3, borderRadius: 2, background: i.colour }} />
          {i.name}
        </li>
      ))}
    </ul>
  );
}

// A heading inside a card.
export function SubTitle({ children }) {
  return <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 16.5, fontWeight: 700, color: COLORS.ink, margin: "22px 0 8px" }}>{children}</h3>;
}

// A time chart with a legend, and who was in government behind it if asked. `breaks` are years where the method of the figures changed (a faint line).
export function TimeChart({ lines, from, to, yFormat, ariaLabel, accent, governments = false, breaks = [], height = 250, yScale, refLines }) {
  const bands = [
    ...(governments ? bandsBetween(from, to, to).map((b) => ({ ...b, color: PARTY_COLOURS[b.party] })) : []),
    ...breaks.map((x) => ({ pm: `break-${x}`, start: x, end: x + 0.05, color: COLORS.ink, short: "" })),
  ];
  return (
    <div>
      {lines.length > 1 && <Legend items={lines.map((l) => ({ name: l.name, colour: l.color }))} />}
      <LineChart lines={lines} xTicks={yearTicks(from, to)} yFormat={yFormat} accent={accent} ariaLabel={ariaLabel} bands={bands} domainX={[from, to]} height={height} yScale={yScale} refLines={refLines} />
    </div>
  );
}

// One chart that can show several things: buttons pick which. Each option is { key, label, lines: [{ name, color, years, values }], from, to, yFormat,
// offset, labelFn, breaks, change ("points" for percentages, "percent" for amounts), note, governments (can show who was in government) }. Years in
// `lines` are the first calendar year of each period, and `offset` places them within it. A caption under the chart is written from the figures.
export function TrendExplorer({ options, accent, height = 260, sources }) {
  const [key, setKey] = useState(options[0].key);
  const [gov, setGov] = useState(false);
  const opt = options.find((o) => o.key === key) ?? options[0];
  const labelFn = opt.labelFn ?? String;
  const lines = opt.lines.map((l) => ({ name: l.name, color: l.color ?? accent, points: l.years.map((y, i) => ({ x: y + (opt.offset ?? 0), y: l.values[i], label: labelFn(y) })).filter((p) => p.y !== null && p.y !== undefined) }));
  const main = lines[0].points;
  const first = main[0];
  const lastP = main[main.length - 1];
  const peak = main.reduce((a, p) => (p.y > a.y ? p : a), main[0]);
  const low = main.reduce((a, p) => (p.y < a.y ? p : a), main[0]);
  const f = opt.captionFormat ?? opt.yFormat;
  const diff = lastP.y - first.y;
  const dir = diff >= 0 ? "up" : "down";
  const size = Math.abs(diff);
  const change = {
    percent: `${dir} ${Math.round((size / first.y) * 100)}%`,
    pp: `${dir} ${Math.round(size * 10) / 10} percentage points`,
    points: `${dir} ${Math.round(size * 10) / 10} points`,
    index: `${dir} ${Math.round(size * 100) / 100}`,
  }[opt.change ?? "points"];
  const extremes = [peak, low].filter((p) => p !== first && p !== lastP).map((p) => (p === peak ? `The highest was ${f(p.y)} in ${p.label}.` : `The lowest was ${f(p.y)} in ${p.label}.`));
  const caption = `${lines.length > 1 ? `${lines[0].name}: ` : ""}${f(first.y)} in ${first.label}, ${f(lastP.y)} in ${lastP.label}, ${change}. ${extremes.join(" ")}`.trim();
  const from = opt.from ?? Math.floor(first.x);
  const to = opt.to ?? Math.ceil(lastP.x) + 1;
  return (
    <div>
      {options.length > 1 && (
        <div role="group" aria-label="Choose what to chart" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {options.map((o) => (
            <button key={o.key} type="button" aria-pressed={o.key === opt.key} onClick={() => setKey(o.key)} style={pillStyle(o.key === opt.key)}>{o.label}</button>
          ))}
        </div>
      )}
      {opt.governments && (
        <div role="group" aria-label="Chart options" style={{ marginBottom: 10 }}>
          <button type="button" aria-pressed={gov} onClick={() => setGov((v) => !v)} style={pillStyle(gov)}>Show who was in government</button>
        </div>
      )}
      <TimeChart lines={lines} from={from} to={to} yFormat={opt.yFormat} accent={accent} height={height} governments={Boolean(opt.governments && gov)} breaks={opt.breaks ?? []} yScale={opt.yScale} refLines={opt.refLines} ariaLabel={`${opt.label}. ${caption}`} />
      <p style={{ ...para, marginTop: 10 }}>{caption}</p>
      {opt.note && <p style={{ ...para, fontSize: 13.5, marginTop: 6 }}>{opt.note}</p>}
      {(sources?.length > 0 || opt.sources?.length > 0) && <SourceLine sources={[...(sources ?? []), ...(opt.sources ?? [])]} />}
    </div>
  );
}

// Bars cut into parts, for showing how a total divides up. Each row is { label, parts: [{ name, value, colour }], text }. All rows share one scale.
export function StackBars({ rows, label, format = (v) => String(v), legend }) {
  const top = Math.max(...rows.map((r) => r.parts.reduce((a, p) => a + p.value, 0)));
  return (
    <div>
      {legend && <Legend items={legend} />}
      <ul aria-label={label} style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
        {rows.map((r) => (
          <li key={r.label} style={{ fontFamily: FONT_BODY, fontSize: 13.5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
              <span style={{ color: COLORS.ink, fontWeight: 700 }}>{r.label}</span>
              <span style={{ ...numeric, fontWeight: 600, color: COLORS.ink }}>{r.text}</span>
            </div>
            <div aria-hidden="true" style={{ display: "flex", gap: 2, height: 22, marginTop: 5, width: `${(r.parts.reduce((a, p) => a + p.value, 0) / top) * 100}%`, minWidth: 80 }}>
              {r.parts.map((p) => <span key={p.name} title={`${p.name}: ${format(p.value)}`} style={{ flex: `${p.value} 1 0`, background: p.colour, borderRadius: 4, minWidth: 3 }} />)}
            </div>
            <div style={{ color: COLORS.inkSoft, fontSize: 12.5, marginTop: 4, lineHeight: 1.45 }}>{r.parts.map((p) => `${p.name} ${format(p.value)}`).join(", ")}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// A slider with its label and the chosen value shown big, for "what if" tools.
export function RangeField({ id, label, value, min, max, step = 1, onChange, text, hint, accent }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <label htmlFor={id} style={{ fontFamily: FONT_BODY, fontSize: 14.5, fontWeight: 700, color: COLORS.ink }}>{label}</label>
        <output htmlFor={id} style={{ ...numeric, fontSize: 22, fontWeight: 600, color: COLORS.ink }}>{text}</output>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: "100%", height: 32, accentColor: accent, margin: "4px 0 0", cursor: "pointer" }} />
      {hint && <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, lineHeight: 1.45 }}>{hint}</div>}
    </div>
  );
}

// Two or three bars for each row, for comparing the same thing in different ways (before and after tax, three points of a spread). Each row is
// { label, note, bars: [{ name, value, text, colour }] }; `max` is the length of a full bar and `legend` names the colours.
export function PairBars({ rows, max, label, legend }) {
  const top = max ?? Math.max(...rows.flatMap((r) => r.bars.map((b) => Math.abs(b.value))), 1);
  return (
    <div>
      {legend && <Legend items={legend} />}
      <ul aria-label={label} style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 14 }}>
        {rows.map((r) => (
          <li key={r.label} className="pair-row" style={{ display: "grid", gridTemplateColumns: "minmax(0, 11rem) minmax(0, 1fr)", gap: "4px 12px", alignItems: "center", fontFamily: FONT_BODY, fontSize: 13.5 }}>
            <span style={{ color: COLORS.ink, fontWeight: r.strong ? 700 : 500, lineHeight: 1.3 }}>{r.label}{r.note && <span style={{ display: "block", color: COLORS.inkSoft, fontWeight: 400, fontSize: 12 }}>{r.note}</span>}</span>
            <span style={{ display: "grid", gap: 4, minWidth: 0 }}>
              {r.bars.map((b) => (
                <span key={b.name} title={b.name} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 10, alignItems: "center" }}>
                  <span aria-hidden="true" style={{ height: 11, borderRadius: 6, background: COLORS.hairline, overflow: "hidden", display: "block" }}>
                    <span style={{ display: "block", height: "100%", width: `${Math.max(1.5, (Math.abs(b.value) / top) * 100)}%`, borderRadius: 6, background: b.colour }} />
                  </span>
                  <span style={{ ...numeric, fontSize: 13, fontWeight: 600, color: COLORS.ink, textAlign: "right", minWidth: "5ch" }}><span className="sr-only">{b.name}: </span>{b.text}</span>
                </span>
              ))}
            </span>
          </li>
        ))}
        <style>{`@media (max-width: 520px) { .pair-row { grid-template-columns: minmax(0, 1fr) !important; } }`}</style>
      </ul>
    </div>
  );
}

// For each row a stretch from a lowest to a highest value on one scale, with a mark for the middle. Each row is { label, low, high, mid, lowText,
// highText, midText, note }; `min` and `max` are the ends of the scale and `format` writes a value.
export function SpanRows({ rows, min, max, label, format, accent }) {
  const x = (v) => `${((v - min) / (max - min)) * 100}%`;
  return (
    <ul aria-label={label} style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 16 }}>
      {rows.map((r) => (
        <li key={r.label} style={{ fontFamily: FONT_BODY, fontSize: 13.5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
            <span style={{ color: COLORS.ink, fontWeight: 700 }}>{r.label}</span>
            <span style={{ ...numeric, fontWeight: 600, color: COLORS.ink, fontSize: 13 }}>{format(r.low)} to {format(r.high)}</span>
          </div>
          <div aria-hidden="true" style={{ position: "relative", height: 14, margin: "7px 0 5px", borderRadius: 7, background: COLORS.hairline }}>
            <span style={{ position: "absolute", top: 0, bottom: 0, left: x(r.low), width: `${((r.high - r.low) / (max - min)) * 100}%`, minWidth: 6, borderRadius: 7, background: accent, opacity: 0.85 }} />
            {r.mid !== undefined && <span style={{ position: "absolute", top: -3, bottom: -3, left: x(r.mid), width: 3, marginLeft: -1.5, background: COLORS.ink, borderRadius: 2 }} />}
          </div>
          <div style={{ color: COLORS.inkSoft, fontSize: 12.5, lineHeight: 1.45 }}>{r.note}</div>
        </li>
      ))}
    </ul>
  );
}
