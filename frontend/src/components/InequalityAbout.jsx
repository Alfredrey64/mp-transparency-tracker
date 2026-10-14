import { Caution, Panel } from "./insight";
import { D } from "../lib/inequality";
import { SOURCES } from "../data/inequality";
import { COLORS, FONT_BODY } from "../theme";
import { para, strong } from "../lib/insightStyle";

const li = { margin: "0 0 8px", paddingLeft: 2 };

export default function InequalityAbout() {
  const entries = Object.values(D.sources);
  const extra = [SOURCES.incomeBulletin, SOURCES.wealthBulletin, SOURCES.genderPay, SOURCES.disabilityPay, SOURCES.ethnicityLowIncome, SOURCES.twoChild, SOURCES.deaton];
  return (
    <div>
      <Panel id="h-ab-sources" title="Where the figures come from" lead={`Every chart reads straight from the official tables, saved on ${D.built}. When a new release comes out the page is rebuilt from it.`}>
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          {[...entries, ...extra].map((s) => (
            <li key={s.url} style={li}><a href={s.url} target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontFamily: FONT_BODY, fontWeight: 600 }}>{s.label}<span className="sr-only"> (opens in a new tab)</span></a></li>
          ))}
        </ul>
      </Panel>

      <Panel id="h-ab-limits" title="What to bear in mind">
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          <li style={li}><strong style={strong}>Surveys, not a count.</strong> Income and wealth figures come from surveys of a few thousand households. Small changes from one year to the next can be chance.</li>
          <li style={li}><strong style={strong}>Breaks in the figures.</strong> The poverty figures are produced differently from 2021/22, the income survey now has a smaller sample, and the wealth figures count pensions differently for the latest period. Lines before and after a change are not directly comparable, and the charts mark the change.</li>
          <li style={li}><strong style={strong}>The very top.</strong> Surveys can miss the very richest households, so they may understate the share held by the top.</li>
          <li style={li}><strong style={strong}>Different areas.</strong> Income and poverty figures cover the UK, wealth covers Great Britain, and regional income covers where people live, not where they work.</li>
          <li style={li}><strong style={strong}>Not included.</strong> Comparison with other countries, income and wealth in the top 1% from tax records, how far people move up and down over their lives, and inequality in health and education.</li>
        </ul>
        <Caution title="Housing costs">Poverty and income are shown after housing costs where that is the main measure, because rent and mortgages take very different shares of income for different households.</Caution>
      </Panel>
    </div>
  );
}
