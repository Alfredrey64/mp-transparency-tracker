import { COLORS, FONT_BODY } from "../theme";
import { Caution, Panel, Stats, TimeChart } from "./insight";
import { D, incomeFacts, last, povertyFacts, regionIndex, wealthFacts } from "../lib/inequality";
import { INCOME_HEADLINES, SOURCES } from "../data/inequality";
import { financialYear, money, para, strong, toPoints } from "../lib/insightStyle";

const ACCENT = "#7A5AF0";

const li = { margin: "0 0 8px", paddingLeft: 2 };

export default function InequalityOverview({ onPick }) {
  const inc = incomeFacts();
  const pov = povertyFacts();
  const w = wealthFacts();
  const london = regionIndex("London");
  const northEast = regionIndex("North East");
  const g = D.income.gini;
  const latestYear = last(g.years);
  return (
    <div>
      <Panel
        id="h-ineq-main" accent={ACCENT} title="The main figures"
        lead="Inequality means how unevenly something is shared out. Income is what people earn and receive each year. Wealth is what they own. Both differ a lot between people and between places."
        sources={[SOURCES.incomeBulletin, SOURCES.hbai, SOURCES.wealthBulletin]}
      >
        <Stats
          accent={ACCENT}
          items={[
            { value: money(INCOME_HEADLINES.medianDisposable), label: "Income of the typical household", note: `A year, after tax, ${financialYear(latestYear)}. Poorest fifth ${money(INCOME_HEADLINES.poorestFifthMedian)}, richest fifth ${money(INCOME_HEADLINES.richestFifthMedian)}` },
            { value: `${inc.s80s20.toFixed(1)} times`, label: "Richest fifth against poorest fifth", note: "Average income after tax" },
            { value: `${inc.latest.gini.toFixed(1)}%`, label: "Income inequality (Gini)", note: `${inc.first.gini.toFixed(1)}% in ${inc.first.year}. Higher means less equal` },
            { value: `${Math.round(pov.all.ahc)}%`, label: "In relative poverty after housing costs", note: `${pov.all.millions.ahc} million people. Children ${Math.round(pov.children.ahc)}%, pensioners ${Math.round(pov.pensioners.ahc)}%` },
            { value: `${Math.round(w.top10)}%`, label: "Of all wealth held by the richest tenth of households", note: `The poorest half hold ${Math.round(w.bottom50)}%` },
            { value: `${(london.values.at(-1) / 100).toFixed(2)} times`, label: "London's income per head against the UK average", note: `The North East is ${(northEast.values.at(-1) / 100).toFixed(2)} times` },
          ]}
        />
      </Panel>

      <Panel id="h-ineq-read" title="How to read these figures" lead="A few measures do most of the work on this page. None is perfect, and they can tell different stories.">
        <ul style={{ ...para, margin: 0, paddingLeft: 20, maxWidth: 780 }}>
          <li style={li}><strong style={strong}>Gini.</strong> A score from 0 to 100. At 0 everyone has the same. At 100 one person has everything. It is one number for the whole spread, so it can hide what happens at the very top or bottom.</li>
          <li style={li}><strong style={strong}>Richest fifth against poorest fifth.</strong> Line everyone up by income and split them into five equal groups. This is the average income of the top group divided by the average of the bottom group.</li>
          <li style={li}><strong style={strong}>Relative poverty.</strong> Living in a household with income below 60% of the typical household's income that year. It rises and falls with how the middle is doing, not only the bottom. "Before housing costs" and "after housing costs" show how much rent and mortgages take.</li>
          <li style={li}><strong style={strong}>Equivalised.</strong> Adjusted for the size of the household, so a couple with two children and a single person can be compared.</li>
          <li style={li}><strong style={strong}>Disposable income.</strong> What a household has after income tax, National Insurance and council tax, and after benefits are added.</li>
        </ul>
      </Panel>

      <Panel
        id="h-ineq-time" title="Income inequality since 1977"
        lead={`The Gini of income after tax and benefits rose from ${inc.first.gini.toFixed(1)}% in ${inc.first.year} to a high of ${inc.peak.value.toFixed(1)}% in ${inc.peak.year}. It was ${inc.latest.gini.toFixed(1)}% in ${financialYear(latestYear)}.`}
        sources={[SOURCES.hdii]}
      >
        <TimeChart
          lines={[{ name: "Income after tax and benefits", color: ACCENT, points: toPoints(g.years, g.disposable, financialYear, 0.25) }]}
          from={1977} to={latestYear + 1} yFormat={(v) => `${v}%`} accent={ACCENT}
          ariaLabel={`Gini of household income after tax and benefits, ${g.years[0]} to ${latestYear}: ${inc.first.gini}% in ${g.years[0]}, a high of ${inc.peak.value}% in ${inc.peak.year}, ${inc.latest.gini}% in ${financialYear(latestYear)}.`}
        />
        <button type="button" onClick={() => onPick("income")} style={{ marginTop: 12, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink, background: "transparent", border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}>
          See who gains and who pays
        </button>
      </Panel>

      <Panel id="h-ineq-stands" title="What stands out" sources={[SOURCES.hdii, SOURCES.hbai, SOURCES.wealthTables, SOURCES.gdhi]}>
        <ul style={{ ...para, margin: 0, paddingLeft: 20, maxWidth: 780 }}>
          <li style={li}>Taxes and benefits do a great deal. Before them, income inequality is {inc.latest.original.toFixed(1)} on the Gini scale. After them it is {inc.latest.gini.toFixed(1)}.</li>
          <li style={li}>Wealth is shared far less evenly than income. The Gini for household wealth is {Math.round(w.gini * 100)}, against {inc.latest.gini.toFixed(0)} for income, though the two come from different surveys and are not strictly comparable.</li>
          <li style={li}>Housing costs matter. {Math.round(pov.all.bhc)}% of people are in relative poverty before housing costs and {Math.round(pov.all.ahc)}% after.</li>
          <li style={li}>Children are more likely to be in poverty than pensioners: {Math.round(pov.children.ahc)}% against {Math.round(pov.pensioners.ahc)}% after housing costs. In 1994/95 it was {Math.round(pov.children.ahcFirst)}% against {Math.round(pov.pensioners.ahcFirst)}%.</li>
          <li style={li}>Where you live matters. Income per head in London is about {(london.values.at(-1) / 100).toFixed(1)} times the UK average, and in the North East about {(northEast.values.at(-1) / 100).toFixed(1)} times.</li>
        </ul>
        <Caution>These are measures of how things are spread, not of whether any of it is fair or right. People disagree about that, and the Debate section sets out the main arguments.</Caution>
      </Panel>
    </div>
  );
}
