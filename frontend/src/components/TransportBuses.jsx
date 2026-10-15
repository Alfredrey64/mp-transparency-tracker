import { Caution, Panel, Stats, TrendExplorer } from "./insight";
import { BUS_ACT, SOURCES } from "../data/transport";
import { B, B_LAST, busAt, busChange, busPeak, last } from "../lib/transport";
import { ACCENT, group } from "../lib/transportStyle";
import { para } from "../lib/insightStyle";

// Transport, the buses toggle: how many bus journeys, where, what fares have done, what the government pays, and who decides.

const line = (name, color, years, values) => ({ name, color, years, values });
const yLabel = (t) => `year to March ${Math.floor(t)}`;
const bn = (m) => `£${(m / 1000).toFixed(1)}bn`;

export default function TransportBuses() {
  const eng = B.journeys.england;
  const peak = busPeak("england");
  const London = last(B.journeys.london);
  const outside = last(B.journeys.outsideLondon);
  const supYears = B.support.years;
  const share = Math.round((London / last(eng)) * 100);
  const lastFares = B.fares.labels.at(-1);
  return (
    <div>
      <Panel id="h-tb-main" accent={ACCENT} title="Buses in numbers" lead={`There were ${(last(eng) / 1000).toFixed(2)} billion local bus journeys in England in the year to March ${B_LAST}, ${Math.abs(busChange("england", 2020))}% fewer than in the year to March 2020 and ${Math.round(((peak.value - last(eng)) / peak.value) * 100)}% below the peak of ${(peak.value / 1000).toFixed(2)} billion in the year to March ${peak.year}. London has ${share}% of them.`} sources={[SOURCES.buses]}>
        <Stats
          accent={ACCENT}
          items={[
            { value: `${(last(eng) / 1000).toFixed(2)}bn`, label: `Bus journeys in England, year to March ${B_LAST}`, note: `${(busAt("england", 2020) / 1000).toFixed(2)}bn in the year to March 2020`, spark: eng },
            { value: `${(London / 1000).toFixed(2)}bn`, label: "In London", note: `${busChange("london", 2020)}% on the year to March 2020`, spark: B.journeys.london },
            { value: `${(outside / 1000).toFixed(2)}bn`, label: "In England outside London", note: `${busChange("outsideLondon", 2020)}% on the year to March 2020`, spark: B.journeys.outsideLondon },
            { value: bn(last(B.support.england)), label: `Government support, year to March ${last(supYears)}`, note: `${bn(B.support.england[0])} in ${supYears[0]}. In ${last(supYears)} prices`, spark: B.support.england },
          ]}
        />
        <TrendExplorer
          accent={ACCENT}
          options={[
            { key: "journeys", label: "Journeys", governments: true, lines: [line("London", "#C0561F", B.journeys.years, B.journeys.london), line("England outside London", ACCENT, B.journeys.years, B.journeys.outsideLondon), line("Scotland", "#0F766E", B.journeys.years, B.journeys.scotland), line("Wales", "#7A5AF0", B.journeys.years, B.journeys.wales)], offset: 0, labelFn: yLabel, yFormat: (v) => `${Math.round(v)}m`, captionFormat: (v) => `${group(v)} million`, change: "percent", from: B.journeys.years[0], to: B_LAST + 1, note: "Millions of local bus journeys in each year to March. The fall in 2021 was the pandemic. London is far ahead of the rest. The shading shows who was in government, not what caused a change." },
            { key: "perHead", label: "Journeys per person", lines: [line("London", "#C0561F", B.perHead.years, B.perHead.london), line("North East", ACCENT, B.perHead.years, B.perHead.ne), line("West Midlands", "#7A5AF0", B.perHead.years, B.perHead.wm), line("South East", "#0F766E", B.perHead.years, B.perHead.se), line("East of England", "#C7871A", B.perHead.years, B.perHead.east)], offset: 0, labelFn: yLabel, yFormat: (v) => `${Math.round(v)}`, captionFormat: (v) => `${v.toFixed(0)} a person`, change: "percent", from: B.perHead.years[0], to: B_LAST + 1, note: "Local bus journeys for each resident in each year to March, for five regions. The Place toggle shows every region." },
            { key: "fares", label: "Fares", lines: [line("London", "#C0561F", B.fares.times, B.fares.london), line("England outside London", ACCENT, B.fares.times, B.fares.outsideLondon), line("Scotland", "#0F766E", B.fares.times, B.fares.scotland), line("Wales", "#7A5AF0", B.fares.times, B.fares.wales)], offset: 0, labelFn: (t) => B.fares.labels[B.fares.times.indexOf(t)] ?? String(t), yFormat: (v) => `${Math.round(v)}`, captionFormat: (v) => v.toFixed(1), change: "percent", from: 2005, to: 2027, note: `The cost of a bus fare after the general rise in prices is taken out, with March 2005 as 100. A figure above 100 means fares have risen faster than prices. The latest is ${lastFares}.` },
            { key: "support", label: "Government support", governments: true, lines: [line("England", ACCENT, supYears, B.support.england), line("England outside London", "#C0561F", supYears, B.support.outsideLondon), line("London", "#0F766E", supYears, B.support.london)], offset: 0, labelFn: yLabel, yFormat: (v) => `£${Math.round(v)}m`, captionFormat: (v) => `£${group(v)} million`, change: "percent", from: supYears[0], to: last(supYears) + 1, note: `Net support from central and local government for local bus services, in millions of pounds at the prices of the year to March ${last(supYears)}. It includes the cost of free travel for older and disabled people, and funding during the pandemic.` },
          ]}
        />
      </Panel>

      <Panel id="h-tb-law" title="Who decides how buses run" lead={`Outside London, private companies run most local buses, mainly on routes and at fares they choose, with councils able to agree partnerships. London's buses are run for Transport for London on contracts, so it sets routes and fares. The ${BUS_ACT.name}, which received Royal Assent on ${BUS_ACT.assent}, makes it easier for councils in England to take control in the same way (franchising). The main franchising powers came into force on ${BUS_ACT.franchising}.`} sources={[SOURCES.busAct]}>
        <p style={{ ...para, marginTop: 0 }}>The Act also lets councils set up their own bus companies and changes how schemes are assessed. It applies to England only.</p>
        <Caution title="What the figures cannot say">England's bus journeys fell for most of the decade before the pandemic, from a peak in the year to March {peak.year}, while London's peaked in the year to March {busPeak("london").year}. The figures do not show why, and people disagree about whether the cause is who runs the buses, the cost of running them, traffic, home working or the rise of car ownership.</Caution>
      </Panel>
    </div>
  );
}
