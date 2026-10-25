import { useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric, readable, solid } from "../theme";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";
import { GROUPS } from "../data/taxCatalogue";
import { allTaxes, comingUp, fmt, getTax, nowSummary, pastChanges, toT, valueOn, whenText } from "../lib/taxRates";
import { Reveal } from "./Motion";
import TaxStepChart from "./TaxStepChart";
import TaxSpark from "./TaxSpark";
import TaxTake from "./TaxTake";
import EmbedButton from "./EmbedButton";
import TaxStories from "./TaxStories";
import CouncilTaxLookup from "./CouncilTaxLookup";
import { loadPriceIndex, priceLabel, realLine } from "../lib/priceIndex";
import { scrollRegion } from "../lib/a11y";
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
  const [real, setReal] = useState(false);
  const [asTable, setAsTable] = useState(false);
  const [index, setIndex] = useState(null);
  useEffect(() => {
    if (!real || index) return undefined;
    let alive = true;
    loadPriceIndex().then((i) => { if (alive) setIndex(i); }).catch(() => { if (alive) setReal(false); });
    return () => { alive = false; };
  }, [real, index]);
  const isoNow = new Date(now).toISOString().slice(0, 10);
  const adjusted = real && index;
  const lines = adjusted ? panel.lines.map((l) => realLine(l, index, isoNow)) : panel.lines;
  const first = Math.min(...lines.map((l) => l.points[0]?.t ?? Infinity));
  const startT = range.from ?? (range.back ? nowT - range.back : first);
  // A tax that began recently still gets a few years of axis, so a single step is not squeezed against the edge.
  const from = Math.min(Math.max(Math.floor(startT), 1900), Math.floor(nowT) - 2);
  const shown = lines.filter((l) => !off.includes(l.key));
  const inRange = shown.filter((l) => l.points.length && l.points[l.points.length - 1].t >= from - 100);
  const label = `${tax.name}: ${panel.title.toLowerCase()}${adjusted ? ", in today's money" : ""}, ${from} to now. ${lineSummary(panel)}.`;
  return (
    <div style={{ marginTop: 18, padding: "16px clamp(12px, 3vw, 18px) 12px", borderRadius: 14, background: COLORS.paper, border: `1px solid ${COLORS.hairline}` }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: COLORS.ink, margin: 0 }}>{panel.title}{adjusted ? ", in today's money" : ""}</h3>
        {panel.real && (
          <div role="group" aria-label="Prices" style={{ display: "inline-flex", padding: 3, gap: 2, borderRadius: 12, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}` }}>
            {[[false, "As set"], [true, "In today's money"]].map(([v, text]) => (
              <button key={text} type="button" aria-pressed={real === v} onClick={() => setReal(v)} style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: real === v ? 700 : 600, padding: "6px 12px", borderRadius: 9, border: "none", cursor: "pointer", background: real === v ? COLORS.ink : "transparent", color: real === v ? COLORS.paper : COLORS.inkSoft }}>{text}</button>
            ))}
          </div>
        )}
      </div>
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
      {asTable ? (
        <div {...scrollRegion(`${panel.title} as a table, scrollable`)} style={{ overflowX: "auto", marginTop: 10, maxHeight: 420, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_BODY, fontSize: 13.5 }}>
            <caption style={{ position: "absolute", left: -9999 }}>{label}</caption>
            <thead><tr style={{ textAlign: "left", color: COLORS.inkSoft, fontSize: 12.5 }}>
              <th scope="col" style={{ padding: "6px 8px 6px 0", position: "sticky", top: 0, background: COLORS.paper }}>{adjusted ? "Year" : "From"}</th>
              {shown.map((l) => <th key={l.key} scope="col" style={{ padding: "6px 8px", fontWeight: 600, position: "sticky", top: 0, background: COLORS.paper }}>{l.label}</th>)}
            </tr></thead>
            <tbody>
              {tableDates(shown, from, nowT, adjusted).map((d) => (
                <tr key={d} style={{ borderTop: `1px solid ${COLORS.hairline}` }}>
                  <th scope="row" style={{ textAlign: "left", fontWeight: 600, color: COLORS.ink, padding: "7px 8px 7px 0", whiteSpace: "nowrap" }}>{adjusted ? d.slice(0, 4) : whenText({ date: d })}</th>
                  {shown.map((l) => { const v = l.valueAt ? l.valueAt(d) : valueOn(l, d); return <td key={l.key} style={{ ...numeric, padding: "7px 8px", color: COLORS.ink }}>{v === undefined ? "" : v === null ? "none" : fmt(panel.unit, v)}</td>; })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ marginTop: 10 }}>
          <TaxStepChart lines={inRange.length ? inRange : shown} unit={panel.unit} from={from} to={nowT} ariaLabel={label} />
        </div>
      )}
      <button type="button" aria-pressed={asTable} onClick={() => setAsTable((v) => !v)} style={{ ...pillStyle(false), marginTop: 8, fontSize: 12.5 }}>{asTable ? "Show the chart" : "Show as a table"}</button>
      <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, margin: "6px 0 0" }}>
        {adjusted
          ? `Adjusted for rising prices to ${priceLabel(index)} prices, using the Retail Prices Index before 1988 and the Consumer Prices Index since, both from the ONS. A figure that stays the same on paper falls in real terms. `
          : panel.lines.length === 1 ? `Today: ${fmt(panel.unit, panel.lines[0].points.filter((p) => p.date <= isoNow).at(-1)?.value)}. ` : ""}
        Shaded bands show who was in government. Touch or hover for the rate on any day, or tab to the chart and use the left and right arrow keys.
      </p>
      {real && !index && <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, margin: "4px 0 0" }}>Loading prices...</p>}
    </div>
  );
}

// The dates to list in a table: every date any shown line changes (or a point in each year when adjusted for prices), within the range.
function tableDates(lines, fromT, toT, yearly) {
  const dates = new Set();
  if (yearly) { for (let y = Math.ceil(fromT); y <= Math.floor(toT); y += 1) dates.add(`${y}-04-15`); return [...dates].reverse(); }
  const fromIso = `${Math.floor(fromT)}-01-01`;
  for (const l of lines) {
    let before = null;
    for (const p of l.points) { if (p.t > toT) break; if (p.date < fromIso) before = p.date; else dates.add(p.date); }
    if (before) dates.add(fromIso);
  }
  return [...dates].sort().reverse();
}

const sectionTitle = { fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: COLORS.ink, margin: 0 };

function Stat({ children, label, accent, solidFill }) {
  return (
    <div style={{ padding: "13px 16px", borderRadius: 16, background: solidFill ? solid(accent) : COLORS.paper, border: solidFill ? "none" : `1px solid ${COLORS.hairline}`, borderLeft: solidFill ? "none" : `4px solid ${accent}`, color: solidFill ? "#fff" : COLORS.ink, minWidth: 0 }}>
      <div style={{ ...numeric, fontSize: solidFill ? "clamp(28px, 7vw, 38px)" : "clamp(20px, 5vw, 26px)", fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.02em" }}>{children}</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, marginTop: 6, color: solidFill ? "#fff" : COLORS.inkSoft }}>{label}</div>
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
  return (
    <Reveal as="section" aria-labelledby="h-tax-detail" key={tax.id} style={{ ...card, marginTop: 16, boxShadow: `var(--shadow-1), inset 0 5px 0 ${accent}`, background: `color-mix(in srgb, ${accent} 6%, ${COLORS.paperCard})` }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: readable(accent) }}>{tax.group.label}</div>
      <h2 id="h-tax-detail" style={{ ...cardTitle, fontSize: "clamp(24px, 4.4vw, 34px)", marginTop: 2 }}>{tax.name}</h2>
      <p style={para}>{tax.about}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))", gap: 10, marginTop: 18 }}>
        <Stat accent={accent} solidFill label={`${summary.line.label}, now`}>{fmt(summary.line.unit, summary.value)}</Stat>
        <Stat accent={accent} label="when it last changed">{summary.since ? whenText({ date: summary.since }) : "unknown"}</Stat>
        <Stat accent={accent} label="changes in our record">{past.length}</Stat>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 20 }}>
        <div role="group" aria-label="Time range" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {RANGES.map((r) => <button key={r.key} type="button" aria-pressed={rangeKey === r.key} onClick={() => setRangeKey(r.key)} style={pillStyle(rangeKey === r.key)}>{r.label}</button>)}
        </div>
        <EmbedButton spec={{ kind: "tax", id: tax.id }} title={`${tax.name}: tax rates over time`} />
      </div>

      {tax.panels.map((panel) => <PanelView key={panel.title} tax={tax} panel={panel} range={range} now={now} nowT={nowT} />)}
      <TaxTake key={tax.id} taxId={tax.id} nowT={nowT} fromYear={range.from ?? (range.back ? Math.floor(nowT - range.back) : 1960)} accent={accent} />

      {tax.id === "council-tax" && <CouncilTaxLookup accent={accent} />}

      <TaxStories taxId={tax.id} accent={accent} />

      <a
        href={`#/taxRates/compare/${tax.headline.key}/growth`}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 16, padding: "14px 18px", borderRadius: 16, textDecoration: "none", background: solid(accent), color: "#fff", fontFamily: FONT_BODY }}
      >
        <span>
          <span style={{ display: "block", fontFamily: FONT_DISPLAY, fontSize: 16.5, fontWeight: 700 }}>Compare this with growth, jobs, prices and more</span>
          <span style={{ display: "block", fontSize: 13.5, marginTop: 2 }}>Put {tax.headline.label.toLowerCase()} beside any of 13 national figures, with the governments of the day.</span>
        </span>
        <span aria-hidden="true" style={{ fontSize: 22, fontWeight: 700 }}>+</span>
      </a>

      {upcoming.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={sectionTitle}>Already decided, not yet in force</h3>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {upcoming.map((c) => <ChangeRow key={`${c.line.key}-${c.date}`} c={c} future />)}
          </ul>
        </div>
      )}

      <div style={{ marginTop: 28 }}>
        <h3 style={sectionTitle}>Every change, and who set it</h3>
        {tax.lines.length > 1 && (
          <div role="group" aria-label="Show changes to" style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0 4px" }}>
            <button type="button" aria-pressed={lineKey === "all"} onClick={() => setLineKey("all")} style={pillStyle(lineKey === "all")}>All</button>
            {tax.lines.map((l) => <button key={l.key} type="button" aria-pressed={lineKey === l.key} onClick={() => setLineKey(l.key)} style={pillStyle(lineKey === l.key)}>{l.label}</button>)}
          </div>
        )}
        <ChangeList changes={filtered} initial={8} empty="No changes recorded for this line." />
      </div>

      {tax.notes.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={sectionTitle}>Worth knowing</h3>
          <ul style={{ margin: "10px 0 0", paddingLeft: 20, display: "grid", gap: 8, fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.6, color: COLORS.inkSoft, maxWidth: 780 }}>
            {tax.notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <h3 style={sectionTitle}>Where the figures come from</h3>
        <ul style={{ margin: "10px 0 0", paddingLeft: 20, display: "grid", gap: 6, fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.55, color: COLORS.inkSoft }}>
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
      <h2 style={{ ...sectionTitle, fontSize: 19, marginTop: 22 }}>Pick a tax</h2>
      <p style={{ ...para, margin: "4px 0 0", fontSize: 14.5 }}>Choose a kind of tax, then one tax. Its chart appears below. A line stays flat until a government changes the rate, and the coloured bands behind it show who was in power.</p>
      <div role="group" aria-label="Kinds of tax" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        {GROUPS.map((g) => {
          const on = g.key === group.key;
          return (
            <button
              key={g.key} type="button" aria-pressed={on}
              onClick={() => { const first = taxes.find((t) => t.group.key === g.key); if (first && g.key !== group.key) onPick(first.id); }}
              style={{ ...pillStyle(false), display: "inline-flex", alignItems: "center", gap: 8, background: on ? solid(g.accent) : COLORS.paperCard, borderColor: on ? solid(g.accent) : COLORS.hairline, color: on ? "#fff" : COLORS.ink }}
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
              style={{ animationDelay: `${i * 40}ms`, textAlign: "left", cursor: "pointer", padding: "14px 15px 10px", borderRadius: 18, borderStyle: "solid", borderWidth: "4px 1.5px 1.5px", borderColor: `${group.accent} ${on ? group.accent : COLORS.hairline} ${on ? group.accent : COLORS.hairline} ${on ? group.accent : COLORS.hairline}`, background: on ? `color-mix(in srgb, ${group.accent} 13%, ${COLORS.paperCard})` : COLORS.paperCard, boxShadow: on ? `0 12px 26px -16px ${group.accent}` : "none", color: COLORS.ink, display: "block" }}
            >
              <span style={{ display: "block", fontFamily: FONT_DISPLAY, fontSize: 16.5, fontWeight: 700, lineHeight: 1.2 }}>{t.name}</span>
              <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginTop: 3, lineHeight: 1.4 }}>{t.summary}</span>
              <span style={{ display: "block", marginTop: 9, fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>
                <span style={{ ...numeric, fontSize: 21, fontWeight: 600, color: COLORS.ink }}>{fmt(s.line.unit, s.value)}</span> {s.line.label.toLowerCase()}
              </span>
              <TaxSpark line={s.line} colour={group.accent} nowT={nowT} />
            </button>
          );
        })}
      </div>

      <TaxDetail tax={tax} now={now} nowT={nowT} />
    </div>
  );
}
