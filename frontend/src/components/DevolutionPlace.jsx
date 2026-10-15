import { useState } from "react";
import { Caution, Panel } from "./insight";
import RegionMetricMap from "./RegionMetricMap";
import { SOURCES } from "../data/devolution";
import { F_LAST, G_LAST, MAP_METRICS, S_LAST, yearText } from "../lib/devolution";
import { para } from "../lib/insightStyle";

// Devolution and the union, the place toggle: spending, what is raised and the economy in each nation and region on one map.

export default function DevolutionPlace() {
  const [selected, setSelected] = useState(null);
  const sources = { spend: SOURCES.cra, spendIndex: SOURCES.cra, spendReal: SOURCES.cra, balance: SOURCES.fiscal, receipts: SOURCES.fiscal, gdp: SOURCES.gdp, gdpGrowth: SOURCES.gdp };
  return (
    <div>
      <RegionMetricMap
        id="h-dp-map" title="Money and the economy by place" lead="Spending on services, what each place raises and receives, and what it produces, for each resident of each nation and region. Pick a measure, and tap a place to see it on all of them."
        metrics={MAP_METRICS.map((m) => ({ ...m, source: sources[m.id] }))} defaultMetric="spend" selected={selected} onSelect={setSelected}
        tapNote="Tap a place on the map, or a name in the list below, to see it on every measure."
      />
      <Panel id="h-dp-notes" title="Reading the place figures">
        <p style={{ ...para, marginTop: 0 }}>Spending is for {yearText(S_LAST)}, revenue and deficits for {yearText(F_LAST)} and output for {G_LAST}. Each figure is for a place as a whole, using the Office for National Statistics' population estimates. Different surveys and statistics, from different departments, cover different years, so a place's figures are not strictly comparable.</p>
        <Caution title="Averages hide the differences inside a place">Scotland, for example, contains Edinburgh and the Highlands and Islands, and Wales its cities and its sparsely populated west. Within each nation and region the differences between local areas can be as large as those between places.</Caution>
      </Panel>
    </div>
  );
}
