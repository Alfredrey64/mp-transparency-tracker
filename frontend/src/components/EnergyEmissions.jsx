import { useState } from "react";
import { pillStyle } from "../lib/onsStyles";
import { BarRows, Caution, PairBars, Panel, Stats, TrendExplorer } from "./insight";
import RegionMetricMap from "./RegionMetricMap";
import { SOURCES, TARGETS } from "../data/energy";
import { BASE, BUDGETS, COMPARE_MEASURES, EM, FIRST_YEAR, LAST_YEAR, LATEST, MAP_METRICS, NEWEST, PROVISIONAL, REGION_FIRST, REGION_YEAR, cb4, compareRanking, emittingSectors, last, pace, peakYear, regionFacts, round, ukRegional } from "../lib/energy";
import { ACCENT, group, jump } from "../lib/energyStyle";
import { REGIONS } from "../data/regionMetrics";
import { para } from "../lib/insightStyle";
import { ordinal } from "../lib/regionData";

// Net zero and energy bills, the emissions toggle: how much the UK releases and from what, whether the carbon budgets and the 2030 and 2035 targets are on
// course, where emissions are highest per person, and how the UK compares.

const SECTOR_COLOURS = { power: "#C7871A", fuel: "#8B5E3C", transport: "#1D4ED8", buildings: "#C0561F", industry: "#7A5AF0", agriculture: "#6F8F2B", waste: "#9D174D", land: "#9CA3AF" };
const mtText = (v) => `${group(v)} million tonnes`;
const years = (extra) => (PROVISIONAL ? [...EM.years, PROVISIONAL.year] : EM.years).concat(extra ?? []);
const withProv = (values, prov) => (PROVISIONAL ? [...values, prov] : values);

function Trends() {
  const provNote = PROVISIONAL ? ` The ${PROVISIONAL.year} figure is a provisional estimate, published in ${new Date(PROVISIONAL.updated).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}; the final figure can differ.` : "";
  const sector = (k) => ({ name: EM.sectors[k].name, color: SECTOR_COLOURS[k], years: years(), values: withProv(EM.sectors[k].values, PROVISIONAL?.sectors[k]) });
  return (
    <Panel id="h-ne-trend" accent={ACCENT} title="How emissions have changed" lead="All the greenhouse gases the UK releases, added up in million tonnes of carbon dioxide equivalent, which puts methane and the other gases on the same scale as carbon dioxide. The dashed lines are the 2030 and 2035 targets." sources={[SOURCES.ghg, SOURCES.ghgProv]}>
      <TrendExplorer
        accent={ACCENT}
        options={[
          { key: "total", label: "All emissions", governments: true, lines: [{ name: "Greenhouse gases", color: ACCENT, years: years(), values: withProv(EM.total, PROVISIONAL?.total) }], offset: 0, yFormat: (v) => `${Math.round(v)}`, captionFormat: mtText, change: "percent", from: FIRST_YEAR, to: NEWEST.year + 1, refLines: [{ value: pace("ndc2030").target, label: `${TARGETS.ndc2030.cut}% cut by 2030` }, { value: pace("ndc2035").target, label: `${TARGETS.ndc2035.cut}% cut by 2035` }], note: `Territorial emissions: what is released inside the UK, excluding international flights and shipping.${provNote}` },
          { key: "sector", label: "By sector", lines: ["power", "transport", "buildings", "industry", "agriculture", "waste"].map(sector), offset: 0, yFormat: (v) => `${Math.round(v)}`, captionFormat: mtText, change: "percent", from: FIRST_YEAR, to: NEWEST.year + 1, note: `Electricity supply fell furthest, as coal was replaced. Transport has fallen least. Buildings means heating homes and workplaces.${provNote}` },
          { key: "gas", label: "By gas", lines: [{ name: "Carbon dioxide", color: "#4B5563", years: EM.years, values: EM.gases.co2 }, { name: "Methane", color: "#C0561F", years: EM.years, values: EM.gases.ch4 }, { name: "Nitrous oxide", color: "#6F8F2B", years: EM.years, values: EM.gases.n2o }, { name: "F-gases", color: "#7A5AF0", years: EM.years, values: EM.gases.fgas }], offset: 0, yFormat: (v) => `${Math.round(v)}`, captionFormat: mtText, change: "percent", from: FIRST_YEAR, to: LAST_YEAR + 1, note: "Carbon dioxide is most of the total, from burning fuels. Methane comes mostly from farming and waste, nitrous oxide from farming, and F-gases from cooling and other industrial uses." },
        ]}
      />
    </Panel>
  );
}

function Sectors() {
  const rows = emittingSectors().sort((a, b) => b.last - a.last);
  return (
    <Panel id="h-ne-sectors" title="Where emissions come from" lead={`The sectors that release the most in ${LAST_YEAR}, against 1990. Transport and buildings are now the largest, because the others have cut so much.`} sources={[SOURCES.ghg]}>
      <PairBars
        label={`Emissions by sector, 1990 and ${LAST_YEAR}, million tonnes`}
        legend={[{ name: "1990", colour: "#9CA3AF" }, { name: String(LAST_YEAR), colour: ACCENT }]}
        rows={rows.map((r) => ({ label: r.name, note: `${r.pct}% since 1990. ${r.share}% of the total`, bars: [{ name: "1990", value: r.first, text: group(r.first), colour: "#9CA3AF" }, { name: String(LAST_YEAR), value: r.last, text: group(r.last), colour: ACCENT }] }))}
      />
      <p style={para}>
        Land use and forestry is left out because it can be a small net figure either way, as trees take in carbon and soils give it out.
        {" "}Electricity supply produced {group(EM.sectors.power.values[0])} million tonnes in 1990 and {group(EM.sectors.power.values.at(-1))} in {LAST_YEAR}.
        {" "}Domestic transport has changed least: {group(EM.sectors.transport.values[0])} to {group(EM.sectors.transport.values.at(-1))}.
      </p>
    </Panel>
  );
}

function OnTrack() {
  const p30 = pace("ndc2030");
  const p35 = pace("ndc2035");
  const old = round(p30.recent, 1);
  return (
    <Panel id="h-ne-pace" accent={ACCENT} title="Is the UK on course?" lead="Targets say where emissions must be. The pace says how fast they have to fall to get there, set against how fast they have fallen." sources={[SOURCES.ghg, SOURCES.ghgProv]}>
      <Stats
        accent={ACCENT}
        items={[
          { value: `${NEWEST.cut}%`, label: `Cut since 1990${NEWEST.provisional ? ", provisional" : ""}`, note: `${NEWEST.year}: ${group(NEWEST.total)} million tonnes against ${group(BASE)} in 1990`, spark: EM.total },
          { value: `${p30.needed} million`, label: `Tonnes a year to fall to hit ${TARGETS.ndc2030.cut}% by 2030`, note: `From ${NEWEST.year} to 2030 the total must reach about ${group(p30.target)} million tonnes` },
          { value: `${old} million`, label: `Tonnes a year it has fallen, on average`, note: `${p30.startYear} to ${LAST_YEAR}, the last ${p30.recentYears} years` },
        ]}
      />
      <PairBars
        label="Fall needed each year against the recent average fall, million tonnes a year"
        legend={[{ name: "Needed", colour: "#C0561F" }, { name: `Average, last ${p30.recentYears} years`, colour: ACCENT }]}
        rows={[p30, p35].map((p) => ({ label: `To ${p.cut}% by ${p.year}`, note: `${p.ratio} times the recent pace`, bars: [{ name: "Needed", value: p.needed, text: `${p.needed}`, colour: "#C0561F" }, { name: "Recent", value: p.recent, text: `${p.recent}`, colour: ACCENT }] }))}
      />
      <p style={para}>
        To reach a {TARGETS.ndc2030.cut}% cut by 2030 emissions would have to fall by about {p30.needed} million tonnes a year, {p30.ratio} times the average of the last {p30.recentYears} years. For {TARGETS.ndc2035.cut}% by 2035 the figure is {p35.needed} a year. Much of the recent fall came from ending coal power: coal-fired power stations released {group(EM.powerCoal[EM.years.indexOf(p30.startYear)])} million tonnes in {p30.startYear} and {group(last(EM.powerCoal))} in {LAST_YEAR}. That can be done only once.
      </p>
      <Caution title="How the targets are measured">
        These levels apply the percentage cut to the 1990 total above, which gives about {group(p30.target)} million tonnes for 2030. The UK&apos;s Paris Agreement pledge is measured on a slightly wider base that includes the Crown Dependencies, so the government&apos;s own figure for the same target is a little different (about 255 million tonnes for 2030). The pledges are the UK&apos;s own and are not the same as the legal carbon budgets, shown next. Net zero by 2050 is a legal requirement under the Climate Change Act, as amended in 2019.
      </Caution>
    </Panel>
  );
}

function Budgets() {
  const c = cb4();
  const rows = BUDGETS.map((b) => {
    let note = `${b.from} to ${b.to}.`;
    if (b.result !== null) note += ` Result ${group(b.result)}, ${group(b.target - b.result)} under.`;
    else if (b.id === "CB4") note += ` ${group(c.used)} used in ${c.years[0]} to ${c.years.at(-1)}${c.provisional ? ", counting a provisional last year" : ""}; ${group(c.target - c.used)} left for ${c.left} years.`;
    else if (b.note) note += ` ${b.note}`;
    return { label: b.id, note, value: b.target, text: group(b.target), tone: b.result !== null ? ACCENT : b.id === "CB4" ? "#C7871A" : "#9CA3AF", strong: b.id === "CB4" };
  });
  return (
    <Panel id="h-ne-budgets" title="Carbon budgets" lead="The law sets a limit on emissions for each five-year period, in million tonnes of carbon dioxide equivalent. The first three have ended and were met. The fourth is under way, and three more are set." sources={[SOURCES.ghg, SOURCES.cb5, SOURCES.cb6, SOURCES.ccc7, SOURCES.cb7News]}>
      <BarRows label="Carbon budgets, million tonnes of carbon dioxide equivalent" accent={ACCENT} max={BUDGETS[0].target} rows={rows} />
      <p style={para}>
        The budgets shrink. The fourth, for 2023 to 2027, allows {group(c.target)} and the sixth, for 2033 to 2037, allows 965. Emissions in {NEWEST.year} were {group(NEWEST.total)}, and the {c.left} years left in the fourth budget can average {group(c.perYear)} a year, which is {NEWEST.total <= c.perYear ? "above" : "below"} that level. The fifth and sixth are the harder tests.
      </p>
      <Caution>The first four results use the &quot;UK Net Carbon Account&quot; (emissions, adjusted for the EU emissions trading scheme while the UK took part). The fourth is not final until 2029 and later years of data can change earlier estimates. The seventh, 2038 to 2042, follows advice from the Climate Change Committee published in February 2025 and was approved by the House of Commons on 24 June 2026.</Caution>
    </Panel>
  );
}

function Regions() {
  const [selected, setSelected] = useState(null);
  const uk = ukRegional();
  const facts = REGIONS.map((r) => ({ ...r, ...regionFacts(r.key) })).sort((a, b) => b.total - a.total);
  return (
    <>
      <RegionMetricMap
        id="h-ne-map" title="Where emissions are highest" lead={`Emissions released inside each region and nation in ${REGION_YEAR}, per resident. Pick a measure, and tap a place to see it on all of them.`}
        metrics={MAP_METRICS.map((m) => ({ ...m, source: SOURCES.ghgLocal }))} defaultMetric="total" selected={selected} onSelect={setSelected}
        tapNote="Tap a place on the map, or a name in the list below, to see its emissions on every measure."
      />
      <Panel id="h-ne-map-note" title="Reading the regional figures" sources={[SOURCES.ghgLocal]}>
        <p style={{ ...para, marginTop: 0 }}>
          Per person, {facts[0].name} releases the most ({facts[0].total} tonnes in {REGION_YEAR}) and {facts.at(-1).name} the least ({facts.at(-1).total}). The twelve places add up to {uk.total} tonnes per person, down from {uk.totalThen} in {REGION_FIRST}, a fall of {Math.abs(uk.change)}%.
        </p>
        <Caution title="What these figures count">
          They count emissions released in a place, not those its people cause through what they buy, so a region with a power station, steelworks, refinery or large farms looks high, and a city looks low even if its residents fly and consume a lot. Land use is a net figure, and a small amount is not assigned to any region, so the twelve places add up to a little less than the UK total.
        </Caution>
      </Panel>
    </>
  );
}

function Abroad() {
  const [measure, setMeasure] = useState("ghgPerHead");
  const m = COMPARE_MEASURES[measure];
  const rows = compareRanking(measure);
  const ukRank = rows.findIndex((r) => r.code === "GBR") + 1;
  return (
    <Panel id="h-ne-compare" title="How the UK compares" lead={`${m.blurb} Countries are in order, highest first, with the latest year the World Bank has for each.`} sources={[SOURCES.worldBank]}>
      <div role="group" aria-label="Measure" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {["ghgPerHead", "energyPerHead"].map((k) => <button key={k} type="button" aria-pressed={k === measure} onClick={() => setMeasure(k)} style={pillStyle(k === measure)}>{COMPARE_MEASURES[k].label}</button>)}
      </div>
      <BarRows
        label={`${m.label}, by country`} accent="#9CA3AF" max={rows[0].value}
        rows={rows.map((r) => ({ label: r.name, note: String(r.year), value: r.value, text: m.format(r.value), tone: r.code === "GBR" ? ACCENT : "#9CA3AF", strong: r.code === "GBR" }))}
      />
      <p style={para}>The UK is {ordinal(ukRank)} highest of {rows.length} countries here, at {m.format(rows.find((r) => r.code === "GBR").value)}. The highest is {rows[0].name} ({m.format(rows[0].value)}) and the lowest {rows.at(-1).name} ({m.format(rows.at(-1).value)}).</p>
      <Caution title="Territory, not consumption">These count emissions released inside each country. They do not count the emissions abroad from making goods a country buys, which are counted separately. A country that has moved heavy industry overseas can look cleaner on this measure. The World Bank&apos;s figures use a different method from the UK government&apos;s, so the UK figure here is a little higher than the {group(LATEST.total)} million tonnes above would give.</Caution>
    </Panel>
  );
}

export default function EnergyEmissions({ onPick }) {
  const peak = peakYear();
  return (
    <div>
      <Trends />
      <Sectors />
      <OnTrack />
      <Budgets />
      <Regions />
      <Abroad />
      <p style={{ ...para, marginTop: 14 }}>
        Emissions peaked in {peak.year} at {group(peak.value)} million tonnes. For the electricity behind the biggest fall, see <button type="button" onClick={() => onPick("power")} style={{ ...jump, marginTop: 0, padding: "4px 12px", fontSize: 13.5 }}>Electricity</button>.
      </p>
    </div>
  );
}
