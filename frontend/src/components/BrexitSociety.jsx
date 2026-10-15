import { useState } from "react";
import { BarRows, Caution, Panel, Stats, TrendExplorer } from "./insight";
import RegionMetricMap from "./RegionMetricMap";
import { MIGRATION, OPINION, REFERENDUM, SOURCES } from "../data/brexit";
import { B, EVENT_LINES, EVENT_NOTE, MAP_METRICS, monthLabel } from "../lib/brexit";
import { para, strong } from "../lib/insightStyle";

const ACCENT = "#1D4ED8";
const li = { margin: "0 0 8px", paddingLeft: 2 };
const n = (v) => v.toLocaleString("en-GB");

const METRICS = MAP_METRICS.map((x) => ({ ...x, source: x.id === "leave" ? SOURCES.referendum : SOURCES.onsPopulation }));

export default function BrexitSociety() {
  const [selected, setSelected] = useState(null);
  const m = MIGRATION;
  const mig = B.migration;
  const thousands = (a) => a.map((v) => Math.round(v / 1000));
  const other = 100 - OPINION.wrong - OPINION.right;
  return (
    <div>
      <RegionMetricMap
        id="h-bxs-vote" title="Where the country voted, and where people have come to live"
        lead={`${n(REFERENDUM.leave)} people voted Leave and ${n(REFERENDUM.remain)} voted Remain. Pick the vote or one of two measures of migration, and tap a region to see it on all three.`}
        metrics={METRICS} defaultMetric="leave" selected={selected} onSelect={setSelected}
        tapNote="Tap a place on the map, or a name in the list below, to see its vote and its migration side by side."
      />
      <Panel id="h-bxs-vote-note" title="Reading the map" sources={[SOURCES.referendum, SOURCES.onsPopulation]}>
        <p style={{ ...para, marginTop: 0 }}>England and Wales voted to leave, and Scotland and Northern Ireland to remain. Within each nation there were large differences between places and between age groups, which the voting results by area on the Elections pages show. London voted to remain and has the most arrivals from abroad for its size. The West Midlands voted most strongly to leave and also has among the highest net migration. So the places that voted most for Leave are not simply the places with the least migration.</p>
        <Caution title="Different kinds of figure">The vote is from June 2016. The migration figures are the ONS's mid-year population estimates for the year to mid-2025 (to June), which count people who changed their country of residence. They differ from the calendar-year net migration figure below, which is a separate ONS series with a different method, so the two are not directly comparable.</Caution>
      </Panel>
      <Panel
        id="h-bxs-opinion" title="What people think now"
        lead={`YouGov asked in hindsight whether Britain was right or wrong to vote to leave (${OPINION.fieldwork}).`}
        sources={[SOURCES.yougovTracker, SOURCES.yougov]}
      >
        <BarRows
          label="Was Britain right or wrong to vote to leave" accent={ACCENT} max={100}
          rows={[
            { label: "Wrong to leave", value: OPINION.wrong, text: `${OPINION.wrong}%`, tone: "#D6455D" },
            { label: "Right to leave", value: OPINION.right, text: `${OPINION.right}%`, tone: ACCENT },
            { label: "Don't know", value: other, text: `${other}%`, tone: "#9CA3AF" },
          ]}
        />
        <p style={para}>Among people who voted Leave in 2016, {OPINION.leaveVotersStandBy}% still stood by their vote in {OPINION.leaveVotersDate} and {OPINION.leaveVotersNowWrong}% said Britain was now wrong to leave. A poll in hindsight is not the same as a vote, and people who say it was wrong do not all want the same thing to happen next.</p>
      </Panel>

      <Panel
        id="h-bxs-mig" title="Migration"
        lead="Ending free movement meant the UK took control of who can come to live and work. What happened next depends on which group you look at."
        sources={[SOURCES.onsMigration, SOURCES.ukiceEconomy]}
      >
        <Stats
          accent={ACCENT}
          items={[
            { value: n(m.net), label: "Net migration", note: `${m.period}. The peak was ${n(m.netPeak)}, in the ${m.netPeakPeriod}` },
            { value: n(m.euNet), label: "Net migration of EU and similar nationals", note: "More left than arrived" },
            { value: n(m.nonEuNet), label: "Net migration of non-EU nationals", note: "Mostly people coming to work, study and join family" },
            { value: n(m.britishNet), label: "Net migration of British nationals", note: "More left than returned" },
          ]}
        />
        <TrendExplorer
          accent={ACCENT}
          options={[
            { key: "net", label: "Net migration", lines: [{ name: "Net migration", years: mig.times, values: thousands(mig.net) }], offset: 0, labelFn: monthLabel, yFormat: (v) => `${Math.round(v)}k`, captionFormat: (v) => `${Math.round(v)},000`, change: "percent", breaks: EVENT_LINES, from: 2012, to: 2027, note: `People arriving to live in the UK less people leaving, over the 12 months to each month, in thousands. ONS provisional figures. ${EVENT_NOTE}` },
            { key: "flows", label: "Arriving and leaving", lines: [{ name: "Arriving", color: ACCENT, years: mig.times, values: thousands(mig.arrivals) }, { name: "Leaving", color: "#C0561F", years: mig.times, values: thousands(mig.departures) }], offset: 0, labelFn: monthLabel, yFormat: (v) => `${Math.round(v)}k`, captionFormat: (v) => `${Math.round(v)},000`, change: "percent", breaks: EVENT_LINES, from: 2012, to: 2027, note: `Over the 12 months to each month. ${EVENT_NOTE}` },
            { key: "noneu", label: "Arrivals from outside Europe", lines: [{ name: "Arrivals from outside Europe", years: mig.times, values: thousands(mig.nonEuArrivals) }], offset: 0, labelFn: monthLabel, yFormat: (v) => `${Math.round(v)}k`, captionFormat: (v) => `${Math.round(v)},000`, change: "percent", breaks: EVENT_LINES, from: 2012, to: 2027, note: `People arriving to live in the UK from countries outside Europe, over the 12 months to each month. ${EVENT_NOTE}` },
          ]}
        />
        <p style={para}>Net migration from the EU has fallen from over 300,000 in 2016 to below zero, and in total UK in a Changing Europe finds that higher migration from outside the EU more than made up for it, so the economy probably has more workers than under a lower-migration path, though the effect on income per person is smaller and harder to measure. The figures are provisional and use a method the ONS is still developing. See also the <a href="#/immigration" style={{ color: "inherit" }}>Immigration page</a>.</p>
        <Caution title="Cause and effect">Changes to visas, the pandemic, wars and the job market all moved migration in these years, so not all of the change is down to leaving the EU.</Caution>
      </Panel>

      <Panel id="h-bxs-study" title="Study, research and travel" sources={[SOURCES.commonUnderstanding]}>
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          <li style={li}><strong style={strong}>Research.</strong> The UK was outside the EU's research programme, Horizon Europe, from 2021 and became an associated country again on 1 January 2024.</li>
          <li style={li}><strong style={strong}>Students.</strong> The UK left Erasmus+ and set up its own Turing scheme. In December 2025 the UK and the European Commission agreed that the UK will take part in Erasmus+ again from 2027, at a cost of about £570 million in that year.</li>
          <li style={li}><strong style={strong}>Travel.</strong> British travellers are now treated as visitors from outside the EU, and when the EU's entry and exit system is in place they will face new checks. The 2025 reset says there will be no legal barriers to British citizens using automatic passport gates.</li>
          <li style={li}><strong style={strong}>Young people.</strong> A youth experience scheme was still being negotiated in October 2026, including how many young people could take part.</li>
        </ul>
      </Panel>
    </div>
  );
}
