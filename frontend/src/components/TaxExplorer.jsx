import { useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric, readable, solid } from "../theme";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";
import { scrollRegion } from "../lib/a11y";
import { GROUPS } from "../data/taxCatalogue";
import { allTaxes, comingUp, fmt, getTax, nowSummary, pastChanges, toT, whenText } from "../lib/taxRates";
import { Reveal } from "./Motion";
import TaxStepChart from "./TaxStepChart";
import ChangeList, { ChangeRow } from "./TaxChangeList";

// Pick a tax and see how its rates have moved, with who was in government behind the line and a list of every change.

const para = { fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.65, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 780 };

const RANGES = [
  { key: "all", label: "Everything we have" },
  { key: "1979", label: "Since 1979", from: 1979 },
  { key: "1997", label: "Since 1997", from: 1997 },
  { key: "2010", label: "Since 2010", from: 2010 },
  { key: "recent", label: "Last 10 years", back: 10 },
];

function lineSummary(panel) {
  return panel.lines.map((l) => {
    const last = l.points[l.points.length - 1];
    return `${l.label} ${fmt(l.unit, last.value)}`;
  }).join(", ");
}

function PanelView({ tax, panel, range, now, nowT }) {
  const [off, setOff] = useState([]);
  const first = Math.min(...panel.lines.map((l) => l.points[0].t));
  const startT = range.from ?? (range.back ? nowT - range.back : first);
  // A tax that began recently still gets a few years of axis, so a single step is not squeezed against the edge.
  const from = Math.min(Math.max(Math.floor(startT), 1900), Math.floor(nowT) - 2);
  const shown = panel.lines.filter((l) => !off.includes(l.key));
  const inRange = shown.filter((l) => l.points[l.points.length - 1].t >= from - 100);
  const isoNow = new Date(now).toISOString().slice(0, 10);
  const label = `${tax.name}: ${panel.title.toLowerCase()}, ${from} to now. ${lineSummary(panel)}.`;
  return (
    <div style={{ marginTop: 22 }}>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: COLORS.ink, margin: 0 }}>{panel.title}</h3>
      {panel.lines.length > 1 && (
        <div role="group" aria-label={`Lines on the chart: ${panel.title}`} style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0 6px" }}>
          {panel.lines.map((l) => {
            const on = !off.includes(l.key);
            return (
              <button
                key={l.key} type="button" aria-pressed={on}
                onClick={() => setOff((o) => (on ? (o.length + 1 >= panel.lines.length ? o : [...o, l.key]) : o.filter((k) => k !== l.key)))}
                style={{ ...pillStyle(false), display: "inline-flex", alignItems: "center", gap: 8, textAlign: "left", opacity: on ? 1 : 0.55, borderColor: on ? l.colour : COLORS.hairline }}
              >
                <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: "50%", background: on ? l.colour : "transparent", border: `2px solid ${l.colour}`, flexShrink: 0 }} />
                {l.label}
              </button>
            );
          })}
        </div>
      )}
      <div style={{ marginTop: 10 }}>
        <TaxStepChart lines={inRange.length ? inRange : shown} unit={panel.unit} from={from} to={nowT} ariaLabel={label} />
      </div>
      <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, margin: "6px 0 0" }}>
        {panel.lines.length === 1 ? `Today: ${fmt(panel.unit, panel.lines[0].points.filter((p) => p.date <= isoNow).at(-1)?.value)}. ` : ""}Shaded bands show who was in government. Touch or hover for the rate on any day.
      </p>
    </div>
  );
}

function TaxDetail({ tax, now, nowT }) {
  const [rangeKey, setRangeKey] = useState("all");
  const [lineKey, setLineKey] = useState("all");
  const range = RANGES.find((r) => r.key === rangeKey);
  const summary = nowSummary(tax, now);
  const upcoming = useMemo(() => comingUp(tax, now), [tax, now]);
  const past = useMemo(() => pastChanges(tax, now), [tax, now]);
  const filtered = lineKey === "all" ? past : past.filter((c) => c.line.key === lineKey);
  const accent = tax.group.accent;
  const value = summary.value;
  return (
    <Reveal as="section" aria-labelledby="h-tax-detail" key={tax.id} style={{ ...card, marginTop: 14, borderTop: `5px solid ${accent}` }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: readable(accent) }}>{tax.group.label}</div>
      <h2 id="h-tax-detail" style={{ ...cardTitle, fontSize: "clamp(24px, 4.4vw, 32px)", marginTop: 2 }}>{tax.name}</h2>
      <p style={para}>{tax.about}</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16 }}>
        <div style={{ padding: "12px 16px", borderRadius: 15, background: solid(accent), color: "#fff", minWidth: 150 }}>
          <div style={{ ...numeric, fontSize: "clamp(28px, 7vw, 38px)", fontWeight: 600, lineHeight: 1, letterSpacing: "-0.02em" }}>{fmt(summary.line.unit, value)}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, marginTop: 5 }}>{summary.line.label}, now</div>
        </div>
        <div style={{ padding: "12px 16px", borderRadius: 15, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${accent}`, minWidth: 150 }}>
          <div style={{ ...numeric, fontSize: "clamp(20px, 5vw, 26px)", fontWeight: 600, lineHeight: 1.1, color: COLORS.ink }}>{summary.since ? whenText({ date: summary.since }) : "unknown"}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, marginTop: 5, color: COLORS.inkSoft }}>when it last changed</div>
        </div>
        <div style={{ padding: "12px 16px", borderRadius: 15, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${accent}`, minWidth: 150 }}>
          <div style={{ ...numeric, fontSize: "clamp(20px, 5vw, 26px)", fontWeight: 600, lineHeight: 1.1, color: COLORS.ink }}>{past.length}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, marginTop: 5, color: COLORS.inkSoft }}>changes in our record</div>
        </div>
      </div>

      <div role="group" aria-label="Time range" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 20 }}>
        {RANGES.map((r) => <button key={r.key} type="button" aria-pressed={rangeKey === r.key} onClick={() => setRangeKey(r.key)} style={pillStyle(rangeKey === r.key)}>{r.label}</button>)}
      </div>

      {tax.panels.map((panel) => <PanelView key={panel.title} tax={tax} panel={panel} range={range} now={now} nowT={nowT} />)}

      {upcoming.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: COLORS.ink, margin: 0 }}>Already decided, not yet in force</h3>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {upcoming.map((c) => <ChangeRow key={`${c.line.key}-${c.date}`} c={c} future />)}
          </ul>
        </div>
      )}

      <div style={{ marginTop: 26 }}>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: COLORS.ink, margin: 0 }}>Every change, and who set it</h3>
        {tax.lines.length > 1 && (
          <div role="group" aria-label="Show changes to" style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0 4px" }}>
            <button type="button" aria-pressed={lineKey === "all"} onClick={() => setLineKey("all")} style={pillStyle(lineKey === "all")}>All</button>
            {tax.lines.map((l) => <button key={l.key} type="button" aria-pressed={lineKey === l.key} onClick={() => setLineKey(l.key)} style={pillStyle(lineKey === l.key)}>{l.label}</button>)}
          </div>
        )}
        <ChangeList changes={filtered} initial={8} empty="No changes recorded for this line." />
      </div>

      {tax.notes.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: COLORS.ink, margin: 0 }}>Worth knowing</h3>
          <ul style={{ margin: "8px 0 0", paddingLeft: 20, display: "grid", gap: 8, fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.6, color: COLORS.inkSoft, maxWidth: 780 }}>
            {tax.notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </div>
      )}

      <div style={{ marginTop: 22 }}>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: COLORS.ink, margin: 0 }}>Where the figures come from</h3>
        <ul style={{ margin: "8px 0 0", paddingLeft: 20, display: "grid", gap: 6, fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.55, color: COLORS.inkSoft }}>
          {tax.sources.map(([label, url]) => (
            <li key={url}><a href={url} target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontWeight: 600 }}>{label}<span className="sr-only"> (opens in a new tab)</span></a></li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}

export default function TaxExplorer({ taxId, onPick }) {
  const [now] = useState(() => Date.now());
  const nowT = toT(new Date(now).toISOString().slice(0, 10));
  const tax = getTax(taxId) ?? getTax("income-tax");
  const taxes = useMemo(() => allTaxes(), []);
  const group = tax.group;
  const inGroup = taxes.filter((t) => t.group.key === group.key);

  return (
    <div>
      <div role="group" aria-label="Kinds of tax" {...scrollRegion("Kinds of tax, scrollable")} style={{ display: "flex", gap: 8, overflowX: "auto", padding: "10px 2px 4px", marginTop: 6 }}>
        {GROUPS.map((g) => {
          const on = g.key === group.key;
          return (
            <button
              key={g.key} type="button" aria-pressed={on}
              onClick={() => { const first = taxes.find((t) => t.group.key === g.key); if (first && g.key !== group.key) onPick(first.id); }}
              style={{ ...pillStyle(false), flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 8, background: on ? solid(g.accent) : "transparent", borderColor: on ? solid(g.accent) : COLORS.hairline, color: on ? "#fff" : COLORS.ink }}
            >
              <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: "50%", background: on ? "#fff" : g.accent }} />
              {g.label}
            </button>
          );
        })}
      </div>
      <p style={{ ...para, margin: "8px 2px 0", fontSize: 14 }}>{group.blurb}.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 230px), 1fr))", gap: 10, marginTop: 12 }}>
        {inGroup.map((t, i) => {
          const on = t.id === tax.id;
          const s = nowSummary(t, now);
          return (
            <button
              key={t.id} type="button" aria-pressed={on} onClick={() => onPick(t.id)} className="ge-tab ge-fadein"
              style={{ animationDelay: `${i * 40}ms`, textAlign: "left", cursor: "pointer", padding: "13px 15px", borderRadius: 16, border: `1.5px solid ${on ? group.accent : COLORS.hairline}`, background: on ? `color-mix(in srgb, ${group.accent} 12%, ${COLORS.paperCard})` : COLORS.paperCard, color: COLORS.ink, display: "block" }}
            >
              <span style={{ display: "block", fontFamily: FONT_DISPLAY, fontSize: 16.5, fontWeight: 700, lineHeight: 1.2 }}>{t.name}</span>
              <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginTop: 3, lineHeight: 1.4 }}>{t.summary}</span>
              <span style={{ display: "block", marginTop: 9, fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>
                <span style={{ ...numeric, fontSize: 20, fontWeight: 600, color: COLORS.ink }}>{fmt(s.line.unit, s.value)}</span> {s.line.label.toLowerCase()}
              </span>
            </button>
          );
        })}
      </div>

      <TaxDetail tax={tax} now={now} nowT={nowT} />
    </div>
  );
}
