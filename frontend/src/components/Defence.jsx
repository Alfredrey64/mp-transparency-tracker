import { useRef, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING } from "../theme";
import { pillStyle } from "../lib/onsStyles";
import { PageHeader } from "./shared";
import { IconDefence } from "./icons";
import { BarRows, Caution, PageToggles, Panel, RangeField, Stats, Takeaways, TimeChart, TrendExplorer } from "./insight";
import { CHECKED, FORCES, MOMENTS, NATO_COUNT, PROMISES, RANKING, SOURCES, TARGETS } from "../data/defence";
import { D, at, last, lastNonNull, stayedUnder } from "../lib/defence";
import { para, strong, toPoints, yearLabel } from "../lib/insightStyle";

// Defence: how much the UK spends compared with the past and with others, what it has promised, the armed forces' numbers, and the arguments.
// One page with a row of toggles; the address carries the toggle (/defence/spending).

const ACCENT = "#0F766E";
const li = { margin: "0 0 8px", paddingLeft: 2 };
const n = (v) => v.toLocaleString("en-GB");

const SIPRI_COLOURS = { uk: "#0F766E", france: "#1D4ED8", germany: "#C7871A", usa: "#D6455D", italy: "#7A5AF0", spain: "#C0561F", poland: "#0E9AA7", canada: "#9D174D", netherlands: "#4D7C0F", norway: "#6B7280", turkey: "#B45309", russia: "#7F1D1D", china: "#374151" };
const COMPARE = Object.keys(SIPRI_COLOURS);
const MAX_PICKED = 6;
const timeLabel = (t) => `${["1 January", "1 April", "1 July", "1 October"][Math.round((t % 1) * 4)]} ${Math.floor(t)}`;

const TABS = [
  { key: "overview", label: "Overview", blurb: "The main figures, the promises, and how to read them.", colour: "#0F766E" },
  { key: "spending", label: "Spending", blurb: "Defence spending since 1950, compared with other countries you can choose, and what each person pays.", colour: "#1D4ED8" },
  { key: "people", label: "The armed forces", blurb: "How many people serve, who is joining and leaving.", colour: "#C0561F" },
  { key: "arguments", label: "The arguments", blurb: "Whether to spend more, and what on, set out fairly.", colour: "#D6455D" },
  { key: "about", label: "Sources", blurb: "Where each figure comes from and why the totals differ.", colour: "#6B7280" },
];
const KEYS = new Set(TABS.map((t) => t.key));
const parse = (param) => { const first = String(param ?? "").split("/")[0]; return KEYS.has(first) ? first : "overview"; };

function Overview({ onPick }) {
  const s = D.shareOfGdp;
  const now = last(s.uk);
  const under3 = stayedUnder(s.years, s.uk, 3);
  const nato = NATO_COUNT.find((r) => r.year === 2025);
  const f = D.forces;
  const trained = f.all;
  const first = trained[0];
  const lowest = Math.min(...trained);
  const lowestAt = f.times[trained.indexOf(lowest)];
  const gdp = D.economy.gdpBillions;
  const billions = (share) => Math.round((share / 100) * gdp);
  return (
    <div>
      <Takeaways
        accent={ACCENT}
        items={[
          `The UK spent ${now.toFixed(1)}% of its economy on defence in ${last(s.years)} on SIPRI's count, and about ${nato.value}% on NATO's. It was ${at({ years: s.years, values: s.uk }, 1990).toFixed(1)}% in 1990 and has been under 3% since ${under3}.`,
          `The government has promised 2.5% by 2027 and 3% in the next Parliament. NATO allies have agreed 3.5% of the economy on core defence by 2035. On today's economy, 3.5% would be about £${billions(3.5)} billion a year, against about £${billions(nato.value)} billion now.`,
          `${n(FORCES.trained)} people are fully trained and serving full-time, ${Math.round((1 - FORCES.trained / first) * 100)}% fewer than in April 2012. The low point was ${n(lowest)} in ${timeLabel(lowestAt)}, and the number has risen since.`,
          `More people joined the regular forces than left in the last 12 months, ${n(FORCES.intake)} against ${n(FORCES.outflow)}.`,
          `In real terms, after inflation, UK military spending was $${last(D.ukRealBillions.values)} billion in ${last(D.ukRealBillions.years)}, near its highest since 1950.`,
        ]}
      />

      <Panel
        id="h-def-main" accent={ACCENT} title="The main figures"
        lead="Defence spending pays for the armed forces, their equipment and bases, the nuclear deterrent, and support for allies. Countries count it a little differently, so the page says whose count each figure is."
        sources={[SOURCES.nato, SOURCES.modBulletin, SOURCES.personnel]}
      >
        <Stats
          accent={ACCENT}
          items={[
            { value: `${nato.value}%`, label: "Of the economy spent on defence in 2025", note: "On NATO's count. The government has promised 2.5% by 2027", spark: s.uk },
            { value: "3.5%", label: "NATO's target for 2035", note: "On core defence, plus up to 1.5% more on wider security" },
            { value: RANKING.natoBySpending, label: "Largest spender in NATO in 2024", note: `$${RANKING.natoSpendingBn} billion, behind the United States and Germany` },
            { value: n(FORCES.total), label: "People in the armed forces", note: `${FORCES.date}. ${n(FORCES.trained)} are fully trained`, spark: trained },
          ]}
        />
      </Panel>

      <Panel id="h-def-trends" accent={ACCENT} title="How things have changed" lead="Pick a measure. The spending figures are SIPRI's, the forces' numbers are the Ministry of Defence's." sources={[SOURCES.sipri, SOURCES.personnel]}>
        <TrendExplorer
          accent={ACCENT}
          options={[
            { key: "share", label: "Share of the economy", governments: true, lines: [{ name: "UK defence spending", years: s.years, values: s.uk }], labelFn: yearLabel, yFormat: (v) => `${v}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: 1950, to: last(s.years) + 1, note: `Defence took ${s.uk[0].toFixed(1)}% of the UK economy in ${s.years[0]}. It has been below 3% since ${under3} and was ${now.toFixed(2)}% in ${last(s.years)}. The shading shows who was in government, not what caused a change.` },
            { key: "real", label: "In pounds, not shares", lines: [{ name: "UK military spending, billions of dollars at 2024 prices", years: D.ukRealBillions.years, values: D.ukRealBillions.values }], labelFn: yearLabel, yFormat: (v) => `$${Math.round(v)}bn`, captionFormat: (v) => `$${v}bn`, change: "percent", from: 1950, to: last(s.years) + 1, note: "A share of the economy can fall while spending rises, if the economy grows. This is UK military spending in US dollars at 2024 prices, so inflation is taken out." },
            { key: "forces", label: "Fully trained forces", lines: [{ name: "Fully trained, full-time", years: f.times, values: f.all }], labelFn: timeLabel, yFormat: (v) => `${Math.round(v / 1000)}k`, captionFormat: n, change: "percent", from: 2012, to: 2027, breaks: [2020.6, 2020.85], note: "Each quarter from April 2012. The Ministry of Defence marks two breaks in this series in 2020, where its counting changed, shown by the faint lines. The Army counts \"trade trained\" and the others \"trained\"." },
          ]}
        />
      </Panel>

      <Panel id="h-def-promises" title="What has been promised" sources={[SOURCES.commonsLibrary, SOURCES.investmentPlan]}>
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
          {PROMISES.map((p) => (
            <li key={p.when} style={{ padding: "12px 16px", borderRadius: 14, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${ACCENT}` }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15.5, fontWeight: 700, color: COLORS.ink }}>{p.when}</div>
              <p style={{ ...para, marginTop: 3, fontSize: 14.5 }}>{p.text}</p>
            </li>
          ))}
        </ol>
        <p style={{ ...para, fontSize: 13 }}>Checked on {CHECKED}. Targets and plans can change at each Budget and spending review.</p>
        <button type="button" onClick={() => onPick("spending")} style={{ marginTop: 12, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink, background: "transparent", border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}>
          Compare with other countries
        </button>
      </Panel>

      <CostPanel />
    </div>
  );
}

// "What would it cost?": a share of the economy in, pounds a year out, on the size of the economy over the latest four quarters.
function CostPanel() {
  const [share, setShare] = useState(3.5);
  const { gdpBillions: gdp, gdpQuarters, populationMillions: pop } = D.economy;
  const lastQuarter = gdpQuarters.split(" to ")[1];
  const quarterText = `${lastQuarter.slice(5)} ${lastQuarter.slice(0, 4)}`;
  const base = TARGETS[0].share;
  const pounds = (v) => Math.round((v / 100) * gdp);
  const extra = pounds(share) - pounds(base);
  const perPerson = Math.round((extra * 1000) / pop);
  return (
    <Panel
      id="h-def-cost" title="What would a target cost?"
      lead={`Try a share of the economy. The sums use the size of the UK economy over the four quarters to ${quarterText}, £${n(gdp)} billion in the prices of the time.`}
      sources={[SOURCES.nato, SOURCES.onsGdp]}
    >
      <div role="group" aria-label="Targets" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {TARGETS.map((t) => <button key={t.share} type="button" aria-pressed={share === t.share} onClick={() => setShare(t.share)} style={pillStyle(share === t.share)}>{t.share}%: {t.label}</button>)}
      </div>
      <RangeField id="def-share" label="Defence spending as a share of the economy" value={share} min={1.5} max={5} step={0.1} onChange={(v) => setShare(Math.round(v * 10) / 10)} text={`${share.toFixed(1)}%`} accent={ACCENT} />
      <Stats
        accent={ACCENT}
        items={[
          { value: `£${n(pounds(share))}bn`, label: `A year at ${share.toFixed(1)}%`, note: `Today's economy, £${n(gdp)}bn` },
          { value: `${extra >= 0 ? "+" : "-"}£${n(Math.abs(extra))}bn`, label: `Against about ${base}% now`, note: `About £${n(pounds(base))}bn a year now on NATO's count` },
          { value: `${extra >= 0 ? "+" : "-"}£${n(Math.abs(perPerson))}`, label: "For each person in the UK", note: `A year, spread over ${pop} million people` },
        ]}
      />
      <Caution title="A rough guide">This applies each share to the economy as it is now. By 2035 the economy will be bigger, so the pounds would be more. NATO's count includes some spending outside the Ministry of Defence's own budget, so the Ministry's figure can differ. Who pays, in tax, borrowing or other cuts, is a separate question.</Caution>
    </Panel>
  );
}

function Spending() {
  const [picked, setPicked] = useState(["uk", "france", "germany", "usa"]);
  const [metric, setMetric] = useState("share");
  const [governments, setGovernments] = useState(false);
  const [rankMetric, setRankMetric] = useState("share");
  const s = D.shareOfGdp;
  const r = D.realBillions;
  const yr = last(s.years);
  const real = D.ukRealBillions;
  const gov = D.ukShareOfGovernmentSpending;
  const head = D.ukPerHeadUsd;
  const names = D.countries;
  const toggle = (k) => setPicked((p) => (p.includes(k) ? (p.length > 1 ? p.filter((x) => x !== k) : p) : p.length < MAX_PICKED ? [...p, k] : p));
  const src = metric === "share" ? s : r;
  const line = (k) => ({ name: names[k], color: SIPRI_COLOURS[k], points: toPoints(s.years, src[k], yearLabel) });
  const unit = metric === "share" ? (v) => `${v}%` : (v) => `$${Math.round(v)}bn`;
  const latestOf = (k) => lastNonNull(src[k]);
  const readout = picked.map((k) => `${names[k]} ${metric === "share" ? `${latestOf(k).toFixed(1)}%` : `$${Math.round(latestOf(k))} billion`}`).join(", ");
  const rank = COMPARE.map((k) => ({ k, v: lastNonNull((rankMetric === "share" ? s : r)[k]) })).sort((a, b) => b.v - a.v);
  const top = rank[0].v;
  const ukRank = rank.findIndex((x) => x.k === "uk") + 1;
  const ukraine = last(s.ukraine);
  const peakReal = real.values.reduce((a, v, i) => (v > a.v ? { v, y: real.years[i] } : a), { v: 0, y: 0 });
  return (
    <div>
      <Panel
        id="h-defs-compare" accent={ACCENT} title="Compare countries"
        lead={`Choose up to ${MAX_PICKED} countries. Spending is as SIPRI counts it, the same way for every country. The UK is shown first; tap a name to add or remove it.`}
        sources={[SOURCES.sipri]}
      >
        <div role="group" aria-label="Countries" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          {COMPARE.map((k) => (
            <button key={k} type="button" aria-pressed={picked.includes(k)} onClick={() => toggle(k)} style={{ ...pillStyle(picked.includes(k)), display: "inline-flex", alignItems: "center", gap: 7 }}><span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 5, background: SIPRI_COLOURS[k], boxShadow: picked.includes(k) ? "0 0 0 2px #fff" : "none", opacity: picked.includes(k) ? 1 : 0.55 }} />{names[k]}</button>
          ))}
        </div>
        <div role="group" aria-label="Chart options" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          <button type="button" aria-pressed={metric === "share"} onClick={() => setMetric("share")} style={pillStyle(metric === "share")}>Share of the economy</button>
          <button type="button" aria-pressed={metric === "real"} onClick={() => setMetric("real")} style={pillStyle(metric === "real")}>Real-terms spending</button>
          <button type="button" aria-pressed={governments} onClick={() => setGovernments((v) => !v)} style={pillStyle(governments)}>Show who was in UK government</button>
        </div>
        <TimeChart
          key={metric} governments={governments} from={1950} to={yr + 1} yFormat={unit} accent={ACCENT} height={300} yScale={metric === "real" ? "squash" : undefined}
          lines={picked.map(line)}
          ariaLabel={`${metric === "share" ? "Military spending as a share of the economy" : "Military spending in billions of US dollars at 2024 prices"}, ${s.years[0]} to ${yr}. Latest: ${readout}.`}
        />
        <p style={para}>In {yr}: {readout}. {metric === "share" ? "Spending was far higher in the Cold War everywhere, and fell after it ended." : "The scale bends so that very large values do not flatten the rest; the labels are the real figures."} The shading shows who was in UK government, not what caused a change.</p>
        <Caution title="Different counts">SIPRI's figures differ a little from NATO's and the Ministry of Defence's, which use their own definitions. SIPRI has the UK at {last(s.uk).toFixed(2)}% in {yr}, NATO at about 2.3%. All three agree on the direction. Series start where a country's data does.</Caution>
      </Panel>

      <Panel
        id="h-defs-rank" title={`Where the UK stands in ${yr}`}
        lead={`Thirteen countries side by side. By this count the UK is ${ukRank}${["st", "nd", "rd"][ukRank - 1] ?? "th"} of the thirteen on ${rankMetric === "share" ? "share of the economy" : "real-terms spending"}.`}
        sources={[SOURCES.sipri]}
      >
        <div role="group" aria-label="Rank by" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          <button type="button" aria-pressed={rankMetric === "share"} onClick={() => setRankMetric("share")} style={pillStyle(rankMetric === "share")}>Share of the economy</button>
          <button type="button" aria-pressed={rankMetric === "real"} onClick={() => setRankMetric("real")} style={pillStyle(rankMetric === "real")}>Real-terms spending</button>
        </div>
        <BarRows
          label={`Military spending in ${yr}`} accent={ACCENT} max={top}
          rows={rank.map((x) => ({ label: names[x.k], value: x.v, text: rankMetric === "share" ? `${x.v.toFixed(1)}%` : `$${Math.round(x.v)}bn`, tone: x.k === "uk" ? ACCENT : "#9CA3AF", strong: x.k === "uk" }))}
        />
        <p style={para}>Ukraine is not shown. It is at war and spent {ukraine.toFixed(1)}% of its economy on defence in {yr}, which would flatten the rest. Russia spent {last(s.russia).toFixed(1)}% and China {last(s.china).toFixed(1)}%, though SIPRI notes China and Russia are estimates with more uncertainty.</p>
      </Panel>

      <Panel
        id="h-defs-real" title="In pounds and dollars, not shares"
        lead="A share of the economy can fall while spending rises, if the economy grows. UK military spending in dollars at 2024 prices takes inflation out."
        sources={[SOURCES.sipri]}
      >
        <p style={para}>Spending in real terms was ${peakReal.v}bn in {peakReal.y}, and ${last(real.values)}bn in {yr}. Its share of government spending has fallen from {gov.values[0]}% in {gov.years[0]} to {last(gov.values)}% in {last(gov.years)}, so other things have grown faster.</p>
      </Panel>

      <Panel
        id="h-defs-head" title="What it comes to for each person"
        lead={`SIPRI puts UK military spending at about $${n(last(head.values))} for every person in ${last(head.years)}, in that year's dollars. The Ministry of Defence says its own figure for ${RANKING.year}, $${n(RANKING.perHeadUsd)}, was the highest since 1987.`}
        sources={[SOURCES.sipri, SOURCES.modBulletin]}
      >
        <BarRows
          label="UK military spending per person" accent={ACCENT} max={Math.max(...head.values)}
          rows={[1990, 2000, 2010, 2020, last(head.years)].map((y) => ({ label: String(y), value: at(head, y), text: `$${n(at(head, y))}` }))}
        />
        <p style={para}>These are current dollars, so they are not adjusted for inflation. Poland spends a higher share of its economy than any other NATO member ({RANKING.poland}%), and {RANKING.countriesMeetingGuideline} members met NATO's 2% guideline in {RANKING.year}.</p>
      </Panel>

      <Panel id="h-defs-moments" title="Moments behind the line" lead="What was happening in some of the years that stand out, with the UK's share of its economy in that year." sources={[SOURCES.commonsLibrary, SOURCES.sipri]}>
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
          {MOMENTS.map((m) => (
            <li key={m.year} style={{ padding: "12px 16px", borderRadius: 14, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${ACCENT}` }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15.5, fontWeight: 700, color: COLORS.ink }}>{m.year}<span style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 500, color: COLORS.inkSoft }}>, {at({ years: s.years, values: s.uk }, m.year).toFixed(1)}% of the economy</span></div>
              <p style={{ ...para, marginTop: 3, fontSize: 14.5 }}>{m.text}</p>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}

function People() {
  const f = FORCES;
  const t = D.forces;
  const [view, setView] = useState("total");
  const first = t.all[0];
  return (
    <div>
      <Panel
        id="h-defp-now" accent={ACCENT} title="Who serves"
        lead={`UK Armed Forces on ${f.date}. Fully trained strength counts people who have finished their training; the rest are still training or are not yet ready to deploy.`}
        sources={[SOURCES.personnel]}
      >
        <Stats
          accent={ACCENT}
          items={[
            { value: n(f.total), label: "All service personnel", note: `Up ${n(f.totalChange)} (1%) in a year, including those in training and reserves` },
            { value: n(f.trained), label: "Fully trained, full-time", note: `Up ${n(f.trainedChange)} (1%) in a year`, spark: t.all },
            { value: n(f.reserves), label: "Trained reservists", note: "Part-time, called up when needed" },
          ]}
        />
        <div style={{ height: 16 }} />
        <BarRows
          label="Fully trained full-time strength by service" accent={ACCENT} max={80000}
          rows={[
            { label: "Army", value: f.army, text: n(f.army) },
            { label: "Royal Navy and Royal Marines", value: f.navy, text: n(f.navy), tone: "#1D4ED8" },
            { label: "Royal Air Force", value: f.airForce, text: n(f.airForce), tone: "#7A5AF0" },
          ]}
        />
      </Panel>

      <Panel
        id="h-defp-time" title="How the forces have changed since 2012"
        lead={`Fully trained, full-time strength each quarter. It fell from ${n(first)} in April 2012 to ${n(Math.min(...t.all))} in October 2025, and has risen a little since.`}
        sources={[SOURCES.personnel]}
      >
        <div role="group" aria-label="Show" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          <button type="button" aria-pressed={view === "total"} onClick={() => setView("total")} style={pillStyle(view === "total")}>All services</button>
          <button type="button" aria-pressed={view === "services"} onClick={() => setView("services")} style={pillStyle(view === "services")}>By service</button>
        </div>
        <TimeChart
          key={view} from={2012} to={2027} yFormat={(v) => `${Math.round(v / 1000)}k`} accent={ACCENT} height={280} breaks={[2020.6, 2020.85]}
          lines={view === "total"
            ? [{ name: "Fully trained, full-time", color: ACCENT, points: toPoints(t.times, t.all, timeLabel) }]
            : [{ name: "Army", color: ACCENT, points: toPoints(t.times, t.army, timeLabel) }, { name: "Royal Navy and Royal Marines", color: "#1D4ED8", points: toPoints(t.times, t.navy, timeLabel) }, { name: "Royal Air Force", color: "#7A5AF0", points: toPoints(t.times, t.airForce, timeLabel) }]}
          ariaLabel={`Fully trained full-time armed forces, April 2012 to July 2026. Army ${n(t.army[0])} to ${n(last(t.army))}, Navy and Marines ${n(t.navy[0])} to ${n(last(t.navy))}, Royal Air Force ${n(t.airForce[0])} to ${n(last(t.airForce))}.`}
        />
        <p style={para}>The Army has shrunk the most in numbers, from {n(t.army[0])} to {n(last(t.army))}. The Royal Navy and Royal Marines went from {n(t.navy[0])} to {n(last(t.navy))} and the Royal Air Force from {n(t.airForce[0])} to {n(last(t.airForce))}. The faint lines mark two breaks in the Ministry of Defence's series in 2020, where its counting changed. The Army counts "trade trained" and the others "trained".</p>
      </Panel>

      <Panel
        id="h-defp-flow" title="Joining and leaving"
        lead="For the 12 months to 30 June 2026, the Ministry of Defence's figures show more people joining the regular forces than leaving."
        sources={[SOURCES.personnel]}
      >
        <Stats
          accent={ACCENT}
          items={[
            { value: n(f.intake), label: "Joined the regular forces", note: "Up 7% on the year before" },
            { value: n(f.outflow), label: "Left the regular forces", note: "Down 7% on the year before" },
            { value: `+${n(f.intake - f.outflow)}`, label: "Joined more than left", note: "Intake has been higher than outflow since late 2025" },
          ]}
        />
        <p style={para}>Recruiting and keeping people has been one of the main concerns about the armed forces in recent years. The latest figures are better than the year before, and the Army is still smaller than it was a decade ago. Whether the improvement lasts is not yet clear.</p>
      </Panel>
    </div>
  );
}

function Arg({ id, title, shows, supporters, critics, sources }) {
  return (
    <Panel id={id} title={title} sources={sources}>
      <div style={{ padding: "10px 14px", borderRadius: 12, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.ink }}>
        <strong>What the figures show.</strong> {shows}
      </div>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 14.5, fontWeight: 700, color: COLORS.ink, margin: "12px 0 4px" }}>People who want more spending say</h3>
      {supporters.map((t) => <p key={t} style={{ ...para, marginTop: 0, fontSize: 14.5 }}>{t}</p>)}
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 14.5, fontWeight: 700, color: COLORS.ink, margin: "12px 0 4px" }}>People who are more cautious say</h3>
      {critics.map((t) => <p key={t} style={{ ...para, marginTop: 0, fontSize: 14.5 }}>{t}</p>)}
    </Panel>
  );
}

function Arguments() {
  const s = D.shareOfGdp;
  return (
    <div>
      <Panel id="h-defa-intro" accent={ACCENT} title="The arguments" lead="Figures can show how much is spent and on what. They cannot say how much is enough, which depends on how dangerous the world is judged to be and what else the money could do. These are the arguments people make, not our view." />
      <Arg
        id="h-defa-more" title="Should the UK spend more?"
        shows={`The UK spent ${last(s.uk).toFixed(1)}% of its economy on defence in ${last(s.years)}, against ${s.uk[s.years.indexOf(1990)].toFixed(1)}% in 1990 and ${s.uk[s.years.indexOf(1980)].toFixed(1)}% in 1980. NATO has agreed 3.5% by 2035.`}
        supporters={[
          "Europe's security has become less certain, the UK's allies expect it to carry its share, and spending was cut a long way after the Cold War. Forces and stocks that took years to run down take years to rebuild.",
          "A stronger defence industry also supports skilled jobs and exports.",
        ]}
        critics={[
          "Every pound spent on defence is a pound not spent on health, schools or welfare, or has to be raised in tax or borrowing, and it is not yet clear how the 3.5% target will be paid for.",
          "The size of a budget is not the same as the strength of the forces. What matters is whether the money is spent well on the right things.",
        ]}
        sources={[SOURCES.sipri, SOURCES.nato, SOURCES.commonsLibrary]}
      />
      <Arg
        id="h-defa-count" title="What counts as defence?"
        shows="NATO's new target has two parts: 3.5% on core defence and up to 1.5% on wider security and resilience. Whether spending on the nuclear deterrent, intelligence, cyber, pensions and aid to Ukraine counts differs between measures."
        supporters={[
          "A broad count is realistic, because modern threats include cyber attacks and attacks on pipelines, cables and power, so resilience is part of defence.",
        ]}
        critics={[
          "A broad count lets governments reach a target by relabelling spending, and it is harder to see whether the armed forces themselves are getting stronger. It matters which count a promise uses.",
        ]}
        sources={[SOURCES.modBulletin, SOURCES.commonsLibrary]}
      />
      <Arg
        id="h-defa-people" title="People and equipment"
        shows={`${n(FORCES.trained)} people are fully trained and serving full-time. More people have joined than left over the last year.`}
        supporters={[
          "A bigger army, navy and air force cannot be bought quickly. Pay, housing and conditions need to improve so that people stay, and equipment programmes need to be delivered on time.",
        ]}
        critics={[
          "Smaller, better-equipped forces and new technology such as drones may give more for the money than larger numbers, and there is a long record of equipment projects that ran late and over budget.",
        ]}
        sources={[SOURCES.personnel]}
      />
    </div>
  );
}

function About() {
  return (
    <div>
      <Panel id="h-defx-src" title="Where the figures come from" lead={`Checked on ${CHECKED}.`}>
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          {Object.values(SOURCES).map((s) => (
            <li key={s.url} style={li}><a href={s.url} target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontFamily: FONT_BODY, fontWeight: 600 }}>{s.label}<span className="sr-only"> (opens in a new tab)</span></a></li>
          ))}
        </ul>
        <p style={para}>The long-run charts read straight from the SIPRI database (saved on {D.built}).</p>
      </Panel>
      <Panel id="h-defx-limits" title="What to bear in mind">
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          <li style={li}><strong style={strong}>Three ways of counting.</strong> SIPRI, NATO and the Ministry of Defence each define defence spending a little differently, so their figures for the same year differ by a tenth or two of a percentage point of GDP.</li>
          <li style={li}><strong style={strong}>Estimates.</strong> The latest year and the next are estimates and are revised. The promises are targets, not spending.</li>
          <li style={li}><strong style={strong}>Not covered.</strong> What the money is spent on in detail, equipment programmes and their costs, the nuclear deterrent, support to Ukraine, and comparisons of capability, which spending alone does not show.</li>
        </ul>
      </Panel>
    </div>
  );
}

export default function Defence({ param }) {
  const [tab, setTab] = useState(() => parse(param));
  const [seen, setSeen] = useState(param);
  const ref = useRef(null);
  if (param !== seen) { setSeen(param); setTab(parse(param)); }
  function go(next) {
    const moved = next !== tab;
    setTab(next);
    window.history.replaceState(null, "", next === "overview" ? "#/defence" : `#/defence/${next}`);
    if (moved && ref.current && ref.current.getBoundingClientRect().top < 0) ref.current.scrollIntoView({ block: "start" });
  }
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={IconDefence} kicker="Britain in numbers" title="Defence" subtitle="How much the UK spends on defence, how that compares with the past and with other countries, what has been promised, and the arguments about it." />
      <div ref={ref} style={{ scrollMarginTop: 12 }}>
        <PageToggles tabs={TABS} current={tab} onPick={go} label="What to look at" idPrefix="def" />
      </div>
      <div key={tab} className="ge-fade" role="tabpanel" id="def-panel" aria-labelledby={`def-tab-${tab}`}>
        {tab === "overview" && <Overview onPick={go} />}
        {tab === "spending" && <Spending />}
        {tab === "people" && <People />}
        {tab === "arguments" && <Arguments />}
        {tab === "about" && <About />}
      </div>
    </div>
  );
}
