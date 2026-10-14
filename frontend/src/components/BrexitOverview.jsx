import { COLORS, FONT_BODY, FONT_DISPLAY } from "../theme";
import { Caution, Panel, Stats } from "./insight";
import { CHECKED, MIGRATION, OPINION, REFERENDUM, SOURCES, TIMELINE, TRADE_Q4_2025 } from "../data/brexit";
import { para, strong } from "../lib/insightStyle";

const ACCENT = "#1D4ED8";
const li = { margin: "0 0 8px", paddingLeft: 2 };

export default function BrexitOverview({ onPick }) {
  const euShareExports = Math.round((TRADE_Q4_2025.exportsEu / (TRADE_Q4_2025.exportsEu + TRADE_Q4_2025.exportsNonEu)) * 100);
  return (
    <div>
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
            { value: `${euShareExports}%`, label: "Of UK goods exports still go to the EU", note: `${TRADE_Q4_2025.period}. Imports from the EU are 53%` },
            { value: MIGRATION.net.toLocaleString("en-GB"), label: "Net migration to the UK", note: `${MIGRATION.period}, down from ${MIGRATION.netPeak.toLocaleString("en-GB")} at the peak` },
            { value: "2038", label: "Fishing access agreed to", note: "EU and UK boats keep access to each other's waters until 30 June 2038" },
          ]}
        />
        <button type="button" onClick={() => onPick("arguments")} style={{ marginTop: 14, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink, background: "transparent", border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}>
          Go straight to the arguments
        </button>
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
