import { Caution, Panel } from "./insight";
import { CHECKED, SOURCES } from "../data/brexit";
import { COLORS, FONT_BODY } from "../theme";
import { para, strong } from "../lib/insightStyle";

const li = { margin: "0 0 8px", paddingLeft: 2 };

export default function BrexitAbout() {
  return (
    <div>
      <Panel id="h-bxab-src" title="Where the figures come from" lead={`Checked on ${CHECKED}. Each figure is from the source named beside it. Expert estimates are from the named authors.`}>
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          {Object.values(SOURCES).map((s) => (
            <li key={s.url} style={li}><a href={s.url} target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontFamily: FONT_BODY, fontWeight: 600 }}>{s.label}<span className="sr-only"> (opens in a new tab)</span></a></li>
          ))}
        </ul>
      </Panel>
      <Panel id="h-bxab-limits" title="What to bear in mind">
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          <li style={li}><strong style={strong}>Estimates, not counts.</strong> The size of the effect on the economy depends on a comparison with a UK that never left. Treat every figure as one estimate in a range.</li>
          <li style={li}><strong style={strong}>Recent figures can change.</strong> Migration figures are provisional and are revised. Trade figures are revised too.</li>
          <li style={li}><strong style={strong}>A fast-moving story.</strong> Talks between the UK and EU on the 2025 reset were still going on when this was last checked. New agreements could change what the page says.</li>
          <li style={li}><strong style={strong}>Who made the estimate.</strong> Researchers at universities and think tanks, the government's forecasters and campaign groups all take part in this debate, and they do not all start from the same place. The page names who said what.</li>
          <li style={li}><strong style={strong}>Not covered.</strong> Effects on particular industries and regions in detail, the effect on public finances, the cost of leaving, and what has happened to the rights of EU citizens living in the UK and British citizens living in the EU.</li>
        </ul>
        <Caution title="If you think something is wrong">The figures are checked against the sources, but a source may have been updated since. The link beside each figure goes to the original.</Caution>
      </Panel>
    </div>
  );
}
