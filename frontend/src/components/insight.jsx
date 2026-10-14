import { COLORS, FONT_BODY, FONT_DISPLAY, numeric, solid } from "../theme";
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

// Headline figures. Up to three in a row on a wide screen, two on a phone, never a lone box.
export function Stats({ items, accent }) {
  return (
    <div className="box-row" style={{ "--n": items.length <= 4 ? Math.max(items.length, 1) : 3, "--min": "150px", "--gap": "10px" }}>
      {items.map((s) => (
        <div key={s.label} style={{ padding: "14px 16px", borderRadius: 16, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderTop: `4px solid ${s.accent ?? accent}`, minWidth: 0 }}>
          <div style={{ ...numeric, fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.02em", color: COLORS.ink }}>{s.value}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: COLORS.ink, marginTop: 6, lineHeight: 1.35 }}>{s.label}</div>
          {s.note && <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 3, lineHeight: 1.4 }}>{s.note}</div>}
        </div>
      ))}
    </div>
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
export function TimeChart({ lines, from, to, yFormat, ariaLabel, accent, governments = false, breaks = [], height = 250 }) {
  const bands = [
    ...(governments ? bandsBetween(from, to, to).map((b) => ({ ...b, color: PARTY_COLOURS[b.party] })) : []),
    ...breaks.map((x) => ({ pm: `break-${x}`, start: x, end: x + 0.05, color: COLORS.ink, short: "" })),
  ];
  return (
    <div>
      {lines.length > 1 && <Legend items={lines.map((l) => ({ name: l.name, colour: l.color }))} />}
      <LineChart lines={lines} xTicks={yearTicks(from, to)} yFormat={yFormat} accent={accent} ariaLabel={ariaLabel} bands={bands} domainX={[from, to]} height={height} />
    </div>
  );
}
