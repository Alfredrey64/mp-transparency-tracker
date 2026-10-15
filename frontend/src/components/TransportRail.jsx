import { Caution, Panel, Stats, TrendExplorer } from "./insight";
import { RAIL_OWNERSHIP, SOURCES } from "../data/transport";
import { PERF, R, RJ_LAST, SUP_LAST, faresVsRpi, last, lastFullYear, ordinalYear, perfAt, railPeakBefore, supportAt } from "../lib/transport";
import { ACCENT, group } from "../lib/transportStyle";
import { para } from "../lib/insightStyle";

// Transport, the rail toggle: how many journeys, what the government pays, fares against prices, how punctual trains are, and who runs them.

const line = (name, color, years, values) => ({ name, color, years, values });
const fyLabel = (t) => ordinalYear(Math.floor(t));
const bn = (m) => `£${(m / 1000).toFixed(1)}bn`;

export default function TransportRail() {
  const j = R.journeys;
  const pre = railPeakBefore();
  const lowIdx = j.millions.indexOf(Math.min(...j.millions.filter((_, i) => j.years[i] >= 2000)));
  const full = lastFullYear();
  const p = perfAt(full);
  const cIdx = PERF.cancelledYears.indexOf(full);
  const ratio = faresVsRpi();
  const latestFares = last(R.fares.allTickets);
  const latestRpi = last(R.fares.rpi);
  const prov = last(j.provisional);
  const o = RAIL_OWNERSHIP;
  return (
    <div>
      <Panel id="h-tt-rail" accent={ACCENT} title="Rail in numbers" lead={`Passengers made ${group(last(j.millions))} million journeys by rail in Great Britain in ${ordinalYear(RJ_LAST)}${prov ? " (provisional)" : ""}, more than the ${group(pre.value)} million in ${ordinalYear(pre.year)}, the year before the pandemic. They fell to ${group(j.millions[lowIdx])} million in ${ordinalYear(j.years[lowIdx])}.`} sources={[SOURCES.railUsage, SOURCES.railFinance, SOURCES.railFares, SOURCES.railPerformance]}>
        <Stats
          accent={ACCENT}
          items={[
            { value: `${(last(j.millions) / 1000).toFixed(2)}bn`, label: `Journeys, ${ordinalYear(RJ_LAST)}`, note: `${(pre.value / 1000).toFixed(2)}bn in ${ordinalYear(pre.year)}. ${group(j.millions[0])} million in ${ordinalYear(j.years[0])}`, spark: j.millions },
            { value: bn(supportAt(SUP_LAST)), label: `Government support, ${ordinalYear(SUP_LAST)}`, note: `${bn(supportAt(2019))} in ${ordinalYear(2019)}, in ${ordinalYear(SUP_LAST)} prices`, spark: R.support.total },
            { value: `${p.timeTo3}%`, label: `Trains on time (within 3 minutes), ${ordinalYear(full)}`, note: `${p.onTime}% within 1 minute. ${PERF.timeTo3[0]}% in ${ordinalYear(PERF.years[0])}`, spark: PERF.timeTo3 },
            { value: `${PERF.cancelled[cIdx]}%`, label: `Trains cancelled, ${ordinalYear(full)}`, note: `${PERF.cancelled[PERF.cancelledYears.indexOf(2019)]}% in ${ordinalYear(2019)}. A part cancellation counts as half` },
          ]}
        />
        <TrendExplorer
          accent={ACCENT}
          options={[
            { key: "journeys", label: "Journeys", governments: true, lines: [line("Passenger journeys", ACCENT, j.years, j.millions.map((v) => v / 1000))], offset: 0.5, labelFn: fyLabel, yFormat: (v) => `${v.toFixed(1)}bn`, captionFormat: (v) => `${v.toFixed(2)} billion`, change: "percent", from: j.years[0], to: RJ_LAST + 1, note: `Billions of passenger journeys in Great Britain each financial year. The figure for ${ordinalYear(RJ_LAST)} is provisional. Shading shows who was in government, not what caused a change.` },
            { key: "support", label: "Government support", governments: true, lines: [line("Total government support", ACCENT, R.support.years, R.support.total.map((v) => v / 1000)), line("Running the railway", "#C0561F", R.support.years, R.support.operational.map((v) => v / 1000)), line("Building and upgrading", "#7A5AF0", R.support.years, R.support.enhancements.map((v) => (v === null ? 0 : v / 1000)))], offset: 0.5, labelFn: fyLabel, yFormat: (v) => `£${Math.round(v)}bn`, captionFormat: (v) => `£${v.toFixed(1)} billion`, change: "percent", from: R.support.years[0], to: SUP_LAST + 1, note: `Billions of pounds in ${ordinalYear(SUP_LAST)} prices. Support to the railway includes payments to Network Rail, and for building and upgrading includes High Speed 2. It was highest during the pandemic, when fares fell away.` },
            { key: "fares", label: "Fares against prices", lines: [line("Rail fares, all tickets", ACCENT, R.fares.years, R.fares.allTickets), line("Retail Prices Index", "#6B7280", R.fares.years, R.fares.rpi)], offset: 0, yFormat: (v) => `${Math.round(v)}`, captionFormat: (v) => `${v.toFixed(0)}`, change: "percent", from: R.fares.years[0], to: last(R.fares.years) + 1, note: `Average fares and the Retail Prices Index, both set to 100 in 1995. Fares are ${latestFares} and prices ${latestRpi}, so fares have risen ${Math.round((ratio.at(-1) - 100))}% more than prices overall.` },
            { key: "performance", label: "Punctuality", lines: [line("Within 3 minutes of the timetable", ACCENT, PERF.years.filter((_, i) => PERF.periods[i] === 13), PERF.timeTo3.filter((_, i) => PERF.periods[i] === 13)), line("Within 1 minute", "#C0561F", PERF.years.filter((_, i) => PERF.periods[i] === 13), PERF.onTime.filter((_, i) => PERF.periods[i] === 13))], offset: 0.5, labelFn: fyLabel, yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: PERF.years[0], to: full + 1, note: "The share of recorded station stops where the train arrived within the time, over each full financial year. The years 2020 and 2021 stand out because there were far fewer trains and passengers." },
            { key: "cancelled", label: "Cancellations", lines: [line("Trains cancelled", "#C0561F", PERF.cancelledYears.filter((_, i) => PERF.cancelledPeriods[i] === 13), PERF.cancelled.filter((_, i) => PERF.cancelledPeriods[i] === 13))], offset: 0.5, labelFn: fyLabel, yFormat: (v) => `${v.toFixed(0)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: PERF.cancelledYears[0], to: full + 1, note: "The share of planned trains cancelled in each full financial year, counting a part cancellation as half." },
          ]}
        />
      </Panel>

      <Panel id="h-tt-rail-owner" title="Who runs the trains" lead={`${o.publicOf} of the ${o.operators} train operators that hold passenger contracts with the Department for Transport in England are now in public ownership, after the transfer of ${o.operator} on ${o.transferred}. The government says the programme is on track to be completed by ${o.completion}.`} sources={[SOURCES.railOwnership]}>
        <p style={{ ...para, marginTop: 0 }}>Train operators were run by private companies under franchises from the 1990s. Under the Passenger Railway Services (Public Ownership) Act 2024, contracts that end are taken over by a public operator instead of being re-let. Network Rail, which owns the track, is already publicly owned. Scotland and Wales have their own arrangements.</p>
        <Caution title="Ownership is one thing, cost and service another">The figures above were mostly collected while operators were under franchise or emergency contracts, so they show how the railway performed under that system, not what public ownership will bring.</Caution>
      </Panel>
    </div>
  );
}
