import { useState } from "react";
import { pillStyle } from "../lib/onsStyles";
import { BarRows, Caution, Panel, Stats, TimeChart } from "./insight";
import { D, last, regionIndex, regionTable } from "../lib/inequality";
import { LOCAL_AREAS, SOURCES } from "../data/inequality";
import { money, para, strong, toPoints, yearLabel } from "../lib/insightStyle";

const ACCENT = "#0E9AA7";

export default function InequalityPlace({ onPick }) {
  const [governments, setGovernments] = useState(false);
  const table = regionTable();
  const years = D.regions.years;
  const yr = last(years);
  const uk = D.regions.perHead.find((r) => r.name === "United Kingdom");
  const ukNow = last(uk.values);
  const top = table[0];
  const bottom = table.at(-1);
  const idx = (name) => regionIndex(name);
  const london = idx("London");
  const south = idx("South East");
  const ne = idx("North East");
  const wales = idx("Wales");
  const ratio = LOCAL_AREAS.highest.value / LOCAL_AREAS.lowest.value;
  const above = table.filter((r) => r.index > 100).map((r) => r.name);
  return (
    <div>
      <Panel
        id="h-place-head" accent={ACCENT} title="Income per head, by region and nation"
        lead={`The money households have to spend or save each year, per person, in ${yr}. This counts wages, pensions, benefits and income from property and savings, after tax and National Insurance.`}
        sources={[SOURCES.gdhi]}
      >
        <BarRows
          label="Income per head by region and nation" accent={ACCENT}
          rows={[{ label: "United Kingdom", value: ukNow, text: money(ukNow), strong: true, tone: "#1c1b22" }, ...table.map((r) => ({ label: r.name, value: r.value, text: money(r.value), note: `${(r.index / 100).toFixed(2)} times the UK average` }))]}
        />
        <p style={para}>
          People in {top.name} have {money(top.value - ukNow)} more than the UK average each year and people in the {bottom.name} {money(ukNow - bottom.value)} less. Only {above.length === 1 ? above[0] : `${above.slice(0, -1).join(", ")} and ${above.at(-1)}`} {above.length === 1 ? "is" : "are"} above the UK average.
        </p>
      </Panel>

      <Panel
        id="h-place-time" title="Have the gaps closed?"
        lead="Income per head in each place as a share of the UK average, which is 100 each year. A line going down means falling behind the rest of the UK."
        sources={[SOURCES.gdhi]}
      >
        <div role="group" aria-label="Chart options" style={{ marginBottom: 10 }}>
          <button type="button" aria-pressed={governments} onClick={() => setGovernments((v) => !v)} style={pillStyle(governments)}>Show who was in government</button>
        </div>
        <TimeChart
          governments={governments} from={years[0]} to={yr} yFormat={(v) => `${Math.round(v)}`} accent="#7A5AF0" height={280}
          lines={[
            { name: "London", color: "#7A5AF0", points: toPoints(london.years, london.values, yearLabel) },
            { name: "South East", color: "#0E9AA7", points: toPoints(south.years, south.values, yearLabel) },
            { name: "Wales", color: "#C7871A", points: toPoints(wales.years, wales.values, yearLabel) },
            { name: "North East", color: "#D6455D", points: toPoints(ne.years, ne.values, yearLabel) },
          ]}
          ariaLabel={`Income per head as a share of the UK average, ${years[0]} to ${yr}. London ${london.values[0]} in ${years[0]} and ${last(london.values)} in ${yr}. North East ${ne.values[0]} and ${last(ne.values)}.`}
        />
        <p style={para}>
          London was at <strong style={strong}>{london.values[0]}</strong> in {years[0]} and is at <strong style={strong}>{last(london.values)}</strong>. The North East was at {ne.values[0]} and is at <strong style={strong}>{last(ne.values)}</strong>. London has pulled further ahead of the rest of the UK, while the South East has slipped back and the North East and Wales (from {wales.values[0]} to {last(wales.values)}) have fallen further behind.
        </p>
        <Caution title="What this does not show">These figures are where people live, not where they work, and do not take account of local prices, so a pound goes further in some places than others. Housing is a large part of the difference, and income here is before housing costs.</Caution>
      </Panel>

      <Panel
        id="h-place-local" title="The most and least well-off local areas"
        lead={`Income per head in ${LOCAL_AREAS.year} for the highest and lowest of the local areas the ONS reports, which are smaller than regions.`}
        sources={[SOURCES.gdhi]}
      >
        <Stats
          accent={ACCENT}
          items={[
            { value: money(LOCAL_AREAS.highest.value), label: LOCAL_AREAS.highest.name, note: "The highest. More than three times the UK average" },
            { value: money(LOCAL_AREAS.lowest.value), label: LOCAL_AREAS.lowest.name, note: "The lowest" },
            { value: `${ratio.toFixed(1)} times`, label: "The gap between them", note: "Between the highest and lowest area" },
          ]}
        />
        <p style={para}>The gap between the highest and lowest local areas ({ratio.toFixed(1)} times) is much wider than the gap between the highest and lowest regions ({(top.value / bottom.value).toFixed(1)} times). The highest areas are in central London, and the five lowest are Leicester, Sandwell, Nottingham, Blackburn with Darwen and Hull.</p>
      </Panel>

      <Panel id="h-place-more" title="More about place" lead="Wealth also differs a lot by region, and so does the gender pay gap.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button type="button" style={pillStyle(false)} onClick={() => onPick("wealth")}>Wealth by region</button>
          <button type="button" style={pillStyle(false)} onClick={() => onPick("groups")}>Pay gaps by nation and age</button>
        </div>
      </Panel>
    </div>
  );
}
