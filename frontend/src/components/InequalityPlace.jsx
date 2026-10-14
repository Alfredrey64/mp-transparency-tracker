import { lazy, Suspense, useState } from "react";
import { COLORS, FONT_BODY } from "../theme";
import { pillStyle } from "../lib/onsStyles";
import { REGIONS } from "../data/regionMetrics";
import { BarRows, Caution, PairBars, Panel, SpanRows, Takeaways, TrendExplorer } from "./insight";
import InequalityRegionMap from "./InequalityRegionMap";
import { D, last } from "../lib/inequality";
import { P, gbp, latestPeriod, localAreas, periodText, regionName, regionSpan } from "../lib/inequalityPlace";
import { SOURCES } from "../data/inequality";
import { para, strong } from "../lib/insightStyle";

const HexMap = lazy(() => import("./InequalityHexMap"));

// Place: how income, poverty and wealth differ across the regions and nations, inside them and between kinds of area.

const ACCENT = "#0E7490";
const UK_GREY = "#6B7280";
const REGION_ORDER = [...REGIONS].sort((a, b) => a.name.localeCompare(b.name));

// Income per head each year as a share of the UK's, from the ONS series the page already holds (names there are the ONS's).
const gdhiIndex = (key) => { const name = regionName(key).toLowerCase(); return D.regions.index.find((r) => r.name.toLowerCase() === name); };

function OverTime({ regionKey, onPick }) {
  const key = regionKey;
  const name = regionName(key);
  const years = P.periods.map((p) => p.from + 1);
  const label = (y) => periodText(y - 1);
  const pair = (series, ukSeries) => [{ name, color: ACCENT, years, values: series }, { name: "United Kingdom", color: UK_GREY, years, values: ukSeries }];
  const pov = (group) => pair(P.poverty[group].ahc[key], P.poverty[group].ahc.uk);
  const idx = gdhiIndex(key);
  const base = { offset: 0.25, labelFn: label, breaks: [2021.25], from: 1995, to: 2025 };
  const options = [
    { key: "all", label: "People in poverty", lines: pov("all"), yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", ...base, note: "Share of people below 60% of typical income after housing costs, three-year averages. The faint line marks a change in how the figures are produced from 2021/22, so the two sides are not directly comparable. One three-year average around the pandemic has no figure." },
    { key: "children", label: "Children", lines: pov("children"), yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", ...base, note: "Share of children below 60% of typical income after housing costs, three-year averages. Regional samples are small, so a point or two of change may be noise." },
    { key: "pensioners", label: "Pensioners", lines: pov("pensioners"), yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", ...base, note: "Share of pensioners below 60% of typical income after housing costs, three-year averages." },
    { key: "median", label: "Typical income", lines: pair(P.median.ahc[key], P.median.ahc.uk), yFormat: (v) => `£${Math.round(v)}`, captionFormat: (v) => `£${Math.round(v)}`, change: "percent", ...base, note: "The middle household's weekly income after housing costs, adjusted for household size, in 2024/25 prices, three-year averages." },
    ...(idx ? [{ key: "gdhi", label: "Income per head against the UK", lines: [{ name, color: ACCENT, years: D.regions.years, values: idx.values }, { name: "United Kingdom", color: UK_GREY, years: D.regions.years, values: D.regions.years.map(() => 100) }], offset: 0, labelFn: String, yFormat: (v) => `${Math.round(v)}`, captionFormat: (v) => `${Math.round(v)}`, change: "points", from: D.regions.years[0], to: last(D.regions.years) + 1, governments: true, note: "Income per head after tax and benefits, as a share of the UK's, which is 100 each year. A line going down means falling behind the rest of the UK. The shading shows who was in government, not what caused a change." }] : []),
  ];
  return (
    <Panel id="h-place-time" title="Has it been getting better or worse there?" lead="Choose a region, then a measure. Each chart sets the place against the UK as a whole." sources={[SOURCES.hbaiPlace, SOURCES.gdhi]}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <label htmlFor="ineq-place-region" style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink }}>Region or nation</label>
        <select id="ineq-place-region" value={key} onChange={(e) => onPick(e.target.value)} style={{ minHeight: 40, padding: "6px 10px", borderRadius: 10, border: `1.5px solid ${COLORS.hairline}`, background: COLORS.paperCard, color: COLORS.ink, fontFamily: FONT_BODY, fontSize: 15 }}>
          {REGION_ORDER.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
        </select>
      </div>
      <TrendExplorer key={key} accent={ACCENT} options={options} height={270} />
    </Panel>
  );
}

function Within() {
  const spans = REGIONS.map((r) => ({ r, ...regionSpan(r.key) })).filter((x) => x.low);
  const top = spans.reduce((a, s) => (s.high.value / s.low.value > a.high.value / a.low.value ? s : a));
  const [filter, setFilter] = useState("");
  const [end, setEnd] = useState("highest");
  const all = localAreas(filter || null);
  const rows = end === "highest" ? all.slice(0, 8) : all.slice(-8).reverse();
  const min = 10000;
  const max = 90000;
  const ukValue = P.income.uk.perHead;
  const betweenRegions = Math.max(...P.income.regions.map((r) => r.perHead)) / Math.min(...P.income.regions.map((r) => r.perHead));
  return (
    <Panel
      id="h-place-within" title="Inside the regions" lead={`Each region is a mix of rich and poor places. This shows, for each, the local area with the lowest and the highest income per head in ${P.income.year}, with a mark for the region as a whole. Local areas are the ${P.income.local.length} smaller areas, ITL3, the ONS reports, such as a county, a city or part of London.`}
      sources={[SOURCES.gdhi]}
    >
      <SpanRows
        label="Lowest to highest local area income per head, by region" accent={ACCENT} min={min} max={max} format={gbp}
        rows={spans.map((s) => ({ label: s.r.name, low: s.low.value, high: s.high.value, mid: s.mid, note: `Lowest ${s.low.name} ${gbp(s.low.value)}. Highest ${s.high.name} ${gbp(s.high.value)}. The dark mark is the region as a whole, ${gbp(s.mid)}.` }))}
      />
      <p style={para}>
        The widest gap is inside <strong style={strong}>{top.r.name}</strong>, where income per head runs from {gbp(top.low.value)} in {top.low.name} to {gbp(top.high.value)} in {top.high.name}, {(top.high.value / top.low.value).toFixed(1)} times as much. That is bigger than the gap between the highest and lowest regions, {betweenRegions.toFixed(1)} times. The UK average is {gbp(ukValue)}. Regions hide a lot: a place with a high regional average can have poor areas in it, and the reverse.
      </p>

      <h3 style={{ fontSize: 16.5, margin: "22px 0 8px", color: COLORS.ink }}>Ranked</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <label htmlFor="ineq-local-region" style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink }}>Look in</label>
        <select id="ineq-local-region" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ minHeight: 40, padding: "6px 10px", borderRadius: 10, border: `1.5px solid ${COLORS.hairline}`, background: COLORS.paperCard, color: COLORS.ink, fontFamily: FONT_BODY, fontSize: 15 }}>
          <option value="">The whole UK</option>
          {REGION_ORDER.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
        </select>
        <div role="group" aria-label="Which end" style={{ display: "flex", gap: 8 }}>
          <button type="button" aria-pressed={end === "highest"} onClick={() => setEnd("highest")} style={pillStyle(end === "highest")}>Highest</button>
          <button type="button" aria-pressed={end === "lowest"} onClick={() => setEnd("lowest")} style={pillStyle(end === "lowest")}>Lowest</button>
        </div>
      </div>
      <BarRows
        label={`Local areas with the ${end} income per head`} accent={ACCENT} max={Math.max(...all.map((a) => a.value))}
        rows={rows.map((a) => ({ label: a.name, note: regionName(a.region), value: a.value, text: gbp(a.value), tone: a.value >= ukValue ? ACCENT : "#9CA3AF" }))}
      />
      <p style={{ ...para, fontSize: 13 }}>Teal bars are at or above the UK average, grey bars below it. Income here is where people live, not where they work, and before housing costs.</p>
    </Panel>
  );
}

function BeforeAfter() {
  const regions = [...P.income.regions].sort((a, b) => b.primary - a.primary);
  const uk = P.income.uk;
  const lo = (key) => regions.reduce((a, r) => (r[key] < a[key] ? r : a));
  const hi = (key) => regions.reduce((a, r) => (r[key] > a[key] ? r : a));
  const beforeGap = hi("primary").primary / lo("primary").primary;
  const afterGap = hi("perHead").perHead / lo("perHead").perHead;
  return (
    <Panel
      id="h-place-redist" title="What tax and benefits do to the map" lead={`Income per head in ${P.income.year} before and after tax, National Insurance and benefits. The difference is what the system takes from a place or adds to it, on average, for each person.`}
      sources={[SOURCES.gdhi]}
    >
      <PairBars
        label="Income per head before and after tax and benefits, by region" max={Math.max(...regions.map((r) => r.primary))}
        legend={[{ name: "Before tax and benefits", colour: "#7A5AF0" }, { name: "After tax and benefits", colour: ACCENT }]}
        rows={regions.map((r) => ({ label: r.name, note: `Net ${r.net < 0 ? "taken" : "added"}: ${gbp(Math.abs(r.net))} a head`, bars: [{ name: "Before tax and benefits", value: r.primary, text: gbp(r.primary), colour: "#7A5AF0" }, { name: "After tax and benefits", value: r.perHead, text: gbp(r.perHead), colour: ACCENT }] }))}
      />
      <p style={para}>
        Before tax and benefits, {hi("primary").name} has {beforeGap.toFixed(1)} times the income per head of {lo("primary").name}. After them the gap is {afterGap.toFixed(1)} times. The system takes {gbp(Math.abs(hi("primary").net))} per head from {hi("primary").name} and {gbp(Math.abs(lo("primary").net))} from {lo("primary").name}, against {gbp(Math.abs(uk.net))} across the UK. It narrows the gap between places but leaves a large one.
      </p>
      <Caution title="Net, not just benefits">The ONS counts the balance of everything that moves between households and government and other sectors: income tax, National Insurance, council tax, social contributions and benefits and pensions received. A place with many pensioners or workers in high-paying jobs shows up differently for reasons that have little to do with fairness between places.</Caution>
    </Panel>
  );
}

function Wealth() {
  const regions = [...P.wealth.regions].sort((a, b) => b.median - a.median);
  const spreads = regions.map((r) => ({ ...r, ratio: r.p75 / r.p25 }));
  const widest = spreads.reduce((a, r) => (r.ratio > a.ratio ? r : a));
  const narrowest = spreads.reduce((a, r) => (r.ratio < a.ratio ? r : a));
  const top = regions[0];
  const bottom = regions.at(-1);
  return (
    <Panel
      id="h-place-wealth" title="Wealth by region, and the gap inside each" lead={`The wealth of households, counting property, savings, pensions and belongings after debts, April 2020 to March 2022. For each region, the household a quarter of the way up the wealth ladder, the middle one, and the one three quarters of the way up.`}
      sources={[SOURCES.wealthTables]}
    >
      <PairBars
        label="Household wealth by region: 25th percentile, median, 75th percentile" max={Math.max(...regions.map((r) => r.p75))}
        legend={[{ name: "A quarter up", colour: "#C4B5FD" }, { name: "Middle (median)", colour: "#7A5AF0" }, { name: "Three quarters up", colour: "#4C1D95" }]}
        rows={spreads.map((r) => ({ label: r.name, note: `${r.ratio.toFixed(0)} times between the top and bottom marks`, bars: [{ name: "25th percentile", value: r.p25, text: gbp(r.p25), colour: "#C4B5FD" }, { name: "Median", value: r.median, text: gbp(r.median), colour: "#7A5AF0" }, { name: "75th percentile", value: r.p75, text: gbp(r.p75), colour: "#4C1D95" }] }))}
      />
      <p style={para}>
        The typical household in <strong style={strong}>{top.name}</strong> has {gbp(top.median)}, {(top.median / bottom.median).toFixed(1)} times the {gbp(bottom.median)} in the {bottom.name}. The spread inside a place can be wider than the gap between places: in <strong style={strong}>{widest.name}</strong> the household three quarters of the way up has {widest.ratio.toFixed(0)} times the wealth of the one a quarter of the way up, against {narrowest.ratio.toFixed(0)} times in the {narrowest.name}.
      </p>
      <h3 style={{ fontSize: 16.5, margin: "22px 0 8px", color: COLORS.ink }}>Typical and average</h3>
      <BarRows
        label="Average (mean) household wealth by region" accent="#9D174D" max={Math.max(...regions.map((r) => r.mean))}
        rows={[...regions].sort((a, b) => b.mean - a.mean).map((r) => ({ label: r.name, note: `Median ${gbp(r.median)}. The average is ${(r.mean / r.median).toFixed(1)} times the median`, value: r.mean, text: gbp(r.mean) }))}
      />
      <p style={{ ...para, fontSize: 13 }}>The average is the total wealth divided by the number of households, our calculation from the ONS totals. It is pulled up by a few very wealthy households, so it is well above the median everywhere, most of all in {[...regions].sort((a, b) => b.mean / b.median - a.mean / a.median)[0].name}.</p>
      <Caution title="Great Britain only">The Wealth and Assets Survey does not cover Northern Ireland, and it is a sample survey, so regional figures, especially for the quarter and three-quarter marks, carry a margin of error.</Caution>
    </Panel>
  );
}

function Areas() {
  const a = P.areas;
  const types = [...a.types].sort((x, y) => y.disposable - x.disposable);
  const rich = types[0];
  const poor = types.at(-1);
  const [urban, rural] = a.urbanRural;
  return (
    <Panel
      id="h-place-kinds" title="Kinds of neighbourhood" lead="The ONS sorts every neighbourhood into eight kinds, by the age, work, housing and background of the people who live there. This is a typical household's income in each kind in 2024/25."
      sources={[SOURCES.hdii]}
    >
      <BarRows
        label="Disposable household income by kind of neighbourhood" accent={ACCENT} max={Math.max(...types.map((t) => t.disposable))}
        rows={types.map((t) => ({ label: t.name, note: `${(t.people / 1e6).toFixed(1)} million people`, value: t.disposable, text: gbp(t.disposable), tone: t.disposable < a.all.disposable ? "#C0561F" : ACCENT }))}
      />
      <p style={para}>The average household has {gbp(a.all.disposable)} a year to spend after tax and benefits. In {rich.name.toLowerCase()} areas it is {gbp(rich.disposable)}; in {poor.name.toLowerCase()} areas {gbp(poor.disposable)}, {(rich.disposable / poor.disposable).toFixed(1)} times less. Orange bars are below the UK average. These are household totals, not adjusted for how many people live in each.</p>
      <p style={para}>Town against country matters less than it might seem: the average household in urban Great Britain has {gbp(urban.disposable)} and in rural areas {gbp(rural.disposable)}. Rural households get more from pensions and investments and less from wages.</p>
    </Panel>
  );
}

export default function InequalityPlace({ onPick }) {
  const [selected, setSelected] = useState(null);
  const key = selected ?? "ne";
  const pov = (g) => P.poverty[g].ahc;
  const povLatest = (k) => pov("all")[k].at(-1);
  const regionVals = P.regions.map((r) => ({ ...r, pov: povLatest(r.key) })).filter((r) => r.pov !== null);
  const povHigh = regionVals.reduce((a, r) => (r.pov > a.pov ? r : a));
  const povLow = regionVals.reduce((a, r) => (r.pov < a.pov ? r : a));
  const incomeRegions = P.income.regions;
  const inc = (f) => incomeRegions.reduce((a, r) => (f(r) > f(a) ? r : a));
  const incLow = incomeRegions.reduce((a, r) => (r.perHead < a.perHead ? r : a));
  const incHigh = inc((r) => r.perHead);
  const primaryGap = inc((r) => r.primary).primary / incomeRegions.reduce((a, r) => (r.primary < a.primary ? r : a)).primary;
  const afterGap = incHigh.perHead / incLow.perHead;
  const spans = REGIONS.map((r) => ({ r, ...regionSpan(r.key) })).filter((x) => x.low);
  const widest = spans.reduce((a, s) => (s.high.value / s.low.value > a.high.value / a.low.value ? s : a));
  const wealthRegions = P.wealth.regions;
  const wHigh = wealthRegions.reduce((a, r) => (r.median > a.median ? r : a));
  const wLow = wealthRegions.reduce((a, r) => (r.median < a.median ? r : a));
  return (
    <div>
      <Takeaways
        accent={ACCENT}
        items={[
          `${povHigh.name} has the highest share of people in poverty after housing costs, ${povHigh.pov.toFixed(1)}%, and ${povLow.name} the lowest, ${povLow.pov.toFixed(1)}% (three-year average to ${latestPeriod.slice(-7)}).`,
          `Income per head after tax and benefits is ${gbp(incHigh.perHead)} in ${incHigh.name} and ${gbp(incLow.perHead)} in ${incLow.name}, ${afterGap.toFixed(1)} times as much. Before tax and benefits the gap is ${primaryGap.toFixed(1)} times.`,
          `The widest gap is not between regions but inside ${widest.r.name}: from ${gbp(widest.low.value)} per head in ${widest.low.name} to ${gbp(widest.high.value)} in ${widest.high.name}.`,
          `The typical household in ${wHigh.name} has ${gbp(wHigh.median)} of wealth and in the ${wLow.name} ${gbp(wLow.median)}.`,
        ]}
      />

      <InequalityRegionMap selected={selected} onSelect={setSelected} />

      <OverTime regionKey={key} onPick={setSelected} />

      <BeforeAfter />

      <Within />

      <Panel
        id="h-place-seats" title="Inside England, seat by seat" lead="One hexagon for each of England's 543 constituencies, painted by how many of its people live in the most income-deprived tenth of neighbourhoods in England. Hexagons are equal in size, so a crowded city is as easy to see as a rural county."
        sources={[SOURCES.imd]}
      >
        <Suspense fallback={<p style={para}>Loading the map.</p>}>
          <HexMap />
        </Suspense>
        <Caution title="How to read it">By definition one tenth of England's neighbourhoods are in the most deprived tenth, so a seat with 10% has its fair share. Seats with 30% or more have three times that. The measure is relative: it ranks neighbourhoods against each other, so it shows where the poorest areas are, not how poor they are. It covers England only, from the 2025 English Indices of Deprivation, with neighbourhoods matched to the constituency they best fit.</Caution>
      </Panel>

      <Wealth />

      <Areas />

      <Panel id="h-place-more" title="More about place" lead="Wealth and income also differ by age and by group, and by country.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button type="button" style={pillStyle(false)} onClick={() => onPick("wealth")}>Wealth by age and kind of household</button>
          <button type="button" style={pillStyle(false)} onClick={() => onPick("groups")}>Pay gaps by nation and age</button>
          <button type="button" style={pillStyle(false)} onClick={() => onPick("abroad")}>The UK against other countries</button>
        </div>
      </Panel>
    </div>
  );
}
