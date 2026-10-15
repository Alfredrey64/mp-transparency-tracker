import { BarRows, Caution, Panel, TrendExplorer } from "./insight";
import { SOURCES } from "../data/devolution";
import { G, G_LAST, NAMES, gbp, gdpPerHead, realGrowthSince } from "../lib/devolution";
import { ACCENT } from "../lib/devolutionStyle";
import { para } from "../lib/insightStyle";

// Devolution and the union, the economy toggle: how much each nation and region produces for each resident, and how that has changed.

const line = (name, color, series) => ({ name, color, years: G.years, values: series });
const COLOURS = { england: "#1D4ED8", scotland: ACCENT, wales: "#0F766E", ni: "#C7871A", london: "#C0561F", ne: "#7A5AF0" };

export default function DevolutionEconomy() {
  const order = Object.keys(G.perHead).filter((k) => k !== "uk").sort((a, b) => gdpPerHead(b) - gdpPerHead(a));
  const tone = (k) => (["scotland", "wales", "ni"].includes(k) ? ACCENT : k === "england" ? "#1D4ED8" : "#9CA3AF");
  const low = order.filter((k) => k !== "england").at(-1);
  const keys = ["england", "scotland", "wales", "ni", "london", "ne"];
  return (
    <div>
      <Panel id="h-de-gdp" accent={ACCENT} title="How much each place produces" lead={`Gross domestic product, the value of what an economy produces, for each resident in ${G_LAST}. It was ${gbp(gdpPerHead("uk"))} across the UK, ${gbp(gdpPerHead("london"))} in London, which is the highest, and ${gbp(gdpPerHead(low))} in ${NAMES[low]}, which is the lowest. Scotland was ${gbp(gdpPerHead("scotland"))}, Northern Ireland ${gbp(gdpPerHead("ni"))} and Wales ${gbp(gdpPerHead("wales"))}.`} sources={[SOURCES.gdp]}>
        <BarRows
          label={`GDP per person at current prices, ${G_LAST}`} accent="#9CA3AF" max={gdpPerHead(order[0])}
          rows={order.map((k) => ({ label: NAMES[k], note: `${Math.round((gdpPerHead(k) / gdpPerHead("uk")) * 100)}% of the UK`, value: gdpPerHead(k), text: gbp(gdpPerHead(k)), tone: tone(k), strong: ["scotland", "wales", "ni", "england"].includes(k) }))}
        />
        <p style={para}>The UK figure is {gbp(gdpPerHead("uk"))} and England's is {gbp(gdpPerHead("england"))}. Outside London the figures are much closer together: {NAMES[order[1]]} and {NAMES[order[2]]} come next, and {NAMES[order.at(-1)]}, {NAMES[order.at(-2)]} and {NAMES[order.at(-3)]} are lowest.</p>
      </Panel>

      <Panel id="h-de-trend" title="How output per person has grown" lead="Pick a view. After inflation, output per person has grown faster in some places than in others since 1998 and since 2010." sources={[SOURCES.gdp]}>
        <TrendExplorer
          accent={ACCENT}
          options={[
            { key: "real", label: "After inflation", lines: keys.map((k) => line(NAMES[k], COLOURS[k], G.realPerHead[k])), offset: 0, yFormat: (v) => `£${Math.round(v / 1000)}k`, captionFormat: (v) => gbp(v), change: "percent", from: G.years[0], to: G_LAST + 1, note: `GDP per resident in ${G_LAST - 1} prices, for the nations and for the highest (London) and lowest (North East) regions in England.` },
            { key: "cash", label: "At the time", lines: keys.map((k) => line(NAMES[k], COLOURS[k], G.perHead[k])), offset: 0, yFormat: (v) => `£${Math.round(v / 1000)}k`, captionFormat: (v) => gbp(v), change: "percent", from: G.years[0], to: G_LAST + 1, note: "GDP per resident in each year's own prices, so it rises with inflation as well as with output." },
          ]}
        />
        <p style={para}>Since 2010, after inflation, output per person has grown {realGrowthSince("uk", 2010)}% across the UK: {realGrowthSince("england", 2010)}% in England, {realGrowthSince("scotland", 2010)}% in Scotland, {realGrowthSince("wales", 2010)}% in Wales and {realGrowthSince("ni", 2010)}% in Northern Ireland. In London it was {realGrowthSince("london", 2010)}% and in the North East {realGrowthSince("ne", 2010)}%.</p>
        <Caution title="Output is counted where the work is done">GDP per head counts the value produced in a place, whoever lives there, so a place that many people commute into, such as London, looks richer than its residents are, and a place people commute out of looks poorer. It is not the same as income, which the Inequality page covers.</Caution>
      </Panel>
    </div>
  );
}
