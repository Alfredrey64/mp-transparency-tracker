import { COLORS, FONT_BODY, FONT_DISPLAY } from "../theme";
import { Caution, Panel, Stats, Takeaways, TrendExplorer } from "./insight";
import { CHECKED, MIGRATION, OPINION, REFERENDUM, SOURCES, TIMELINE, TRADE_Q4_2025 } from "../data/brexit";
import { para, strong } from "../lib/insightStyle";
import { B, EVENT_LINES, EVENT_NOTE, euShare, last, monthLabel, quarterLabel, tradeBn, yearAverage } from "../lib/brexit";
import { VOTE_BY_REGION } from "../data/brexit";
import { REGIONS } from "../data/regionMetrics";

const ACCENT = "#1D4ED8";
const li = { margin: "0 0 8px", paddingLeft: 2 };

const PICKS = ["GBR", "G7", "EU", "USA"];
const GDP_COLOURS = { GBR: ACCENT, G7: "#6B7280", EU: "#C0561F", USA: "#D6455D" };

export default function BrexitOverview({ onPick }) {
  const g = B.gdp;
  const share = euShare("exports");
  const shareAtVote = share[B.trade.quarters.indexOf("2016-Q2")];
  const shareLatest = last(share);
  const tb = tradeBn();
  const regionLeave = REGIONS.map((r) => ({ name: r.name, v: (VOTE_BY_REGION[r.key].leave / (VOTE_BY_REGION[r.key].leave + VOTE_BY_REGION[r.key].remain)) * 100 }));
  const leaveHigh = regionLeave.reduce((a, r) => (r.v > a.v ? r : a));
  const leaveLow = regionLeave.reduce((a, r) => (r.v < a.v ? r : a));
  const euShareExports = Math.round((TRADE_Q4_2025.exportsEu / (TRADE_Q4_2025.exportsEu + TRADE_Q4_2025.exportsNonEu)) * 100);
  return (
    <div>
      <Takeaways
        accent={ACCENT}
        items={[
          `In June 2016 ${REFERENDUM.leavePct}% voted to leave the EU, on a turnout of ${REFERENDUM.turnoutPct}%. Leave won from ${leaveLow.v.toFixed(0)}% in ${leaveLow.name} to ${leaveHigh.v.toFixed(0)}% in the ${leaveHigh.name}. In September 2026 YouGov found ${OPINION.wrong}% saying it was wrong to leave and ${OPINION.right}% right.`,
          "Researchers broadly agree the economy is smaller than it would have been, by 2% to 6% in a June 2026 review of the research, and one 2025 study puts it at 6% to 8%. How much is the main dispute. One model says leaving could add to the economy, if the UK cut tariffs on its own.",
          `Real income per head has grown by ${(last(g.series.GBR) - 100).toFixed(1)}% since the quarter of the referendum, against ${(last(g.series.G7) - 100).toFixed(1)}% for the G7 and ${(last(g.series.EU) - 100).toFixed(1)}% for the EU. Germany and Canada have done no better than the UK. The pandemic and the energy price rise hit every country, so the gap is not all down to Brexit.`,
          `The EU took ${shareAtVote.toFixed(0)}% of UK goods exports in the quarter of the referendum and ${shareLatest.toFixed(0)}% in the latest quarter. It dipped to about 41% in 2019. Trade with the EU was not lost, but customs checks and paperwork returned, and what the figures mean is argued about.`,
          `Net migration was ${MIGRATION.net.toLocaleString("en-GB")} in the ${MIGRATION.period}, down from ${MIGRATION.netPeak.toLocaleString("en-GB")}. Among EU nationals more left than arrived (${MIGRATION.euNet.toLocaleString("en-GB")}), and among non-EU nationals net migration was about ${MIGRATION.nonEuNet.toLocaleString("en-GB")}.`,
        ]}
      />

      <Panel
        id="h-bx-main" accent={ACCENT} title="Ten years on"
        lead="In June 2016 the UK voted to leave the European Union. It left in January 2020, and the new trade rules began in January 2021. This page sets out what experts and the figures say it has done to the economy, to trade, to people and to politics, and the arguments on each side."
        sources={[SOURCES.referendum, SOURCES.yougov, SOURCES.ukiceTenYears, SOURCES.onsTrade]}
      >
        <Stats
          accent={ACCENT}
          items={[
            { value: `${REFERENDUM.leavePct}%`, label: "Voted Leave in 2016", note: `${REFERENDUM.remainPct}% voted Remain. Turnout ${REFERENDUM.turnoutPct}%` },
            { value: `${OPINION.wrong}%`, label: "Now say it was wrong to leave", note: `${OPINION.right}% say it was right. YouGov, ${OPINION.fieldwork}` },
            { value: "2% to 6%", label: "How much smaller researchers say the economy is", note: "Compared with how it would have been. Estimates differ, and some go higher" },
            { value: `${euShareExports}%`, label: "Of UK goods exports still go to the EU", note: `${TRADE_Q4_2025.period}. Imports from the EU are 53%`, spark: share.slice(-40) },
            { value: MIGRATION.net.toLocaleString("en-GB"), label: "Net migration to the UK", note: `${MIGRATION.period}, down from ${MIGRATION.netPeak.toLocaleString("en-GB")} at the peak`, spark: B.migration.net },
            { value: "2038", label: "Fishing access agreed to", note: "EU and UK boats keep access to each other's waters until 30 June 2038" },
          ]}
        />
        <button type="button" onClick={() => onPick("arguments")} style={{ marginTop: 14, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink, background: "transparent", border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}>
          Go straight to the arguments
        </button>
      </Panel>

      <Panel id="h-bx-trends" accent={ACCENT} title="How things have changed" lead="Pick a measure. Each chart marks the referendum, the UK leaving and the trade deal beginning. A line moving at the same time as an event is not proof the event caused it." sources={[SOURCES.oecdGdp, SOURCES.onsTradeSeries, SOURCES.onsMigration]}>
        <TrendExplorer
          accent={ACCENT}
          options={[
            { key: "gdp", label: "Income per head", lines: PICKS.map((c) => ({ name: g.names[c], color: GDP_COLOURS[c], years: g.times, values: g.series[c] })), offset: 0, labelFn: quarterLabel, yFormat: (v) => `${Math.round(v)}`, captionFormat: (v) => v.toFixed(1), change: "points", breaks: EVENT_LINES, from: 2014, to: 2027, note: `Real GDP per head in US dollars at constant prices and purchasing power, set to 100 in the quarter of the referendum (2016 Q2), to ${quarterLabel(g.times.at(-1))}. ${EVENT_NOTE}` },
            { key: "exports", label: "Goods exports", lines: [{ name: "To the EU", color: ACCENT, years: tb.times, values: tb.euExports }, { name: "To the rest of the world", color: "#0E9AA7", years: tb.times, values: tb.nonEuExports }], offset: 0, labelFn: quarterLabel, yFormat: (v) => `£${Math.round(v)}bn`, captionFormat: (v) => `£${v.toFixed(1)}bn`, change: "percent", breaks: EVENT_LINES, from: 2010, to: 2027, note: `UK goods exports each quarter in pounds at the prices of the time, seasonally adjusted, including precious metals, which can swing the figures. ${EVENT_NOTE}` },
            { key: "share", label: "EU share of goods exports", lines: [{ name: "Share going to the EU", years: tb.times, values: share }], offset: 0, labelFn: quarterLabel, yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", breaks: EVENT_LINES, from: 2010, to: 2027, note: `The share of UK goods exports that go to the EU each quarter. It averaged ${yearAverage(B.trade.times, share, 2015).toFixed(0)}% in 2015 and ${yearAverage(B.trade.times, share, 2025).toFixed(0)}% in 2025. ${EVENT_NOTE}` },
            { key: "migration", label: "Net migration", lines: [{ name: "Net migration", years: B.migration.times, values: B.migration.net.map((v) => Math.round(v / 1000)) }], offset: 0, labelFn: monthLabel, yFormat: (v) => `${Math.round(v)}k`, captionFormat: (v) => `${Math.round(v)},000`, change: "percent", breaks: EVENT_LINES, from: 2012, to: 2027, note: `People arriving to live in the UK less those leaving, over the 12 months to each month, in thousands. ONS provisional figures. ${EVENT_NOTE}` },
          ]}
        />
      </Panel>

      <Panel id="h-bx-read" title="How to read this page" lead="Brexit is argued about on economic grounds, and also on grounds that figures cannot settle. It helps to keep the two apart.">
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          <li style={li}><strong style={strong}>What can be measured.</strong> Trade, investment, migration and prices can be counted. Where this page gives a count, it says where it comes from.</li>
          <li style={li}><strong style={strong}>What has to be estimated.</strong> Nobody can see the UK that stayed in the EU. The size of the effect on the economy is a comparison with a model or with similar countries, so it comes as a range, and different researchers get different ranges.</li>
          <li style={li}><strong style={strong}>What is a matter of values.</strong> Whether it matters more to make the UK's laws at home, to control who can come, or to have a bigger economy cannot be answered by figures. People weigh these differently.</li>
          <li style={li}><strong style={strong}>Mixed with other events.</strong> Covid, the energy price rise and the war in Ukraine happened at the same time, so researchers have to separate Brexit from them. That is the main reason estimates differ.</li>
        </ul>
        <Caution title="Not our view">We set out the evidence and the arguments and do not say whether Brexit was right. Where experts disagree, the page says who thinks what.</Caution>
      </Panel>

      <Panel id="h-bx-time" title="The main dates" sources={[SOURCES.commonUnderstanding, SOURCES.windsor]}>
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
          {TIMELINE.map((t) => (
            <li key={t.date} style={{ padding: "12px 16px", borderRadius: 14, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${ACCENT}` }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>{t.date}</div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: COLORS.ink, marginTop: 2 }}>{t.title}</div>
              <p style={{ ...para, marginTop: 4, fontSize: 14.5 }}>{t.text}</p>
            </li>
          ))}
        </ol>
        <p style={{ ...para, fontSize: 13 }}>Checked on {CHECKED}. Talks on the 2025 reset were still going on, so this part may have moved on.</p>
      </Panel>

      <Panel id="h-bx-agree" title="Where experts agree and disagree" sources={[SOURCES.ukiceTenYears, SOURCES.ukiceEconomy, SOURCES.iea]}>
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          <li style={li}><strong style={strong}>Broadly agreed.</strong> UK in a Changing Europe's June 2026 review of the research says there is a broad consensus that Brexit has made the UK economy smaller than it would otherwise have been, by 2% to 6%, and that the effect has built up gradually, not as a sudden fall.</li>
          <li style={li}><strong style={strong}>Disputed.</strong> The size of the effect, how much of it is lasting, and what has happened to trade and investment. A 2025 working paper by economists including Bank of England staff finds a bigger effect (6% to 8% of GDP). The Institute of Economic Affairs and others argue that trade figures do not show the harm that official forecasts assume.</li>
          <li style={li}><strong style={strong}>Smaller than hoped.</strong> Government assessments put the gains from the main new trade deals at well under 1% of GDP, and the Institute for Government finds that the UK has so far changed little of the EU rules it inherited.</li>
          <li style={li}><strong style={strong}>Not an economic question.</strong> The vote also raised matters of democracy, borders and national identity, where the evidence is about what people think and what has changed, not about whether it was right.</li>
        </ul>
      </Panel>
    </div>
  );
}
