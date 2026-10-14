import { useState } from "react";
import { COLORS, FONT_BODY } from "../theme";
import { pillStyle } from "../lib/onsStyles";
import { BarRows, Caution, Panel, Stats, SubTitle, TimeChart } from "./insight";
import { D, incomeFacts, last } from "../lib/inequality";
import { SOURCES } from "../data/inequality";
import { financialYear, money, para, strong, toPoints } from "../lib/insightStyle";

const ACCENT = "#7A5AF0";
const BEFORE = "#C0561F";
const AFTER = "#0E9AA7";
const MIDDLE = "#7A5AF0";

export default function InequalityIncome() {
  const [governments, setGovernments] = useState(false);
  const inc = incomeFacts();
  const g = D.income.gini;
  const m = D.income.measures;
  const q = D.income.quintiles;
  const dec = D.income.deciles;
  const age = D.income.age;
  const yearNow = last(g.years);
  const gini = (key) => toPoints(g.years, g[key], financialYear, 0.25);
  const decileNames = ["Poorest tenth", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "Richest tenth"];
  const topMax = Math.max(...dec.disposable);
  const ageRows = age.bands.map((band, i) => {
    const series = age.median[i];
    const first = series[0];
    const now = last(series);
    const change = Math.round(((now - first) / first) * 100);
    return { label: band.replace(" to ", " to "), value: now, text: money(now), note: `${change >= 0 ? "Up" : "Down"} ${Math.abs(change)}% since ${financialYear(age.years[0])}` };
  });
  const gained = age.bands.map((band, i) => ({ label: band, change: (last(age.median[i]) - age.median[i][0]) / age.median[i][0] })).sort((a, b) => b.change - a.change);
  const tenure = D.income.tenure;
  return (
    <div>
      <Panel
        id="h-inc-gini" accent={ACCENT} title="How unequal is income?"
        lead="Three measures of the same incomes: before tax and benefits, after benefits are added, and after tax is taken off. The lower line shows what the tax and benefit system does."
        sources={[SOURCES.hdii]}
      >
        <div role="group" aria-label="Chart options" style={{ marginBottom: 10 }}>
          <button type="button" aria-pressed={governments} onClick={() => setGovernments((v) => !v)} style={pillStyle(governments)}>Show who was in government</button>
        </div>
        <TimeChart
          governments={governments} from={1977} to={yearNow + 1} yFormat={(v) => `${v}%`} accent={BEFORE} height={290}
          lines={[
            { name: "Before tax and benefits", color: BEFORE, points: gini("original") },
            { name: "After benefits", color: MIDDLE, points: gini("gross") },
            { name: "After tax and benefits", color: AFTER, points: gini("disposable") },
          ]}
          ariaLabel={`Gini of household income, ${g.years[0]} to ${yearNow}. Before tax and benefits ${inc.latest.original}%, after benefits ${inc.latest.gross}%, after tax and benefits ${inc.latest.gini}% in ${financialYear(yearNow)}.`}
        />
        <p style={para}>
          Before tax and benefits the Gini is <strong style={strong}>{inc.latest.original.toFixed(1)}%</strong>, partly because some households, such as retired people and people out of work, have little income apart from the state pension and benefits. Benefits bring it down to {inc.latest.gross.toFixed(1)}% and tax to <strong style={strong}>{inc.latest.gini.toFixed(1)}%</strong>. The shading shows who was in government, not what caused a change. Many things move these figures, from the economy to pensions and the make-up of households.
        </p>
        <Caution title="A smaller sample">The survey behind these figures now covers about 8,000 households, down from 11,300 a year earlier. Small changes from one year to the next, such as the 0.2 point fall in the latest year, may be within the margin of error.</Caution>
      </Panel>

      <Panel
        id="h-inc-fifth" title="The richest fifth against the poorest"
        lead={`Average income after tax of the richest fifth was ${inc.s80s20.toFixed(1)} times that of the poorest fifth in ${financialYear(yearNow)}. In ${inc.first.year} it was ${inc.s80s20First.toFixed(1)} times.`}
        sources={[SOURCES.hdii]}
      >
        <TimeChart
          governments={governments} from={1977} to={yearNow + 1} yFormat={(v) => `${v.toFixed(1)}`} accent={ACCENT}
          lines={[{ name: "Richest fifth against poorest fifth", color: ACCENT, points: toPoints(m.years, m.s80s20, financialYear, 0.25) }]}
          ariaLabel={`How many times more the richest fifth have than the poorest fifth, ${m.years[0]} to ${yearNow}: ${inc.s80s20First} times in ${m.years[0]}, ${inc.s80s20} times in ${financialYear(yearNow)}.`}
        />
        <Stats
          accent={ACCENT}
          items={[
            { value: `${inc.top1.toFixed(1)}%`, label: "Of all income after tax goes to the top 1% of people", note: inc.top1Peak ? `The highest was ${inc.top1Peak.value}% in ${financialYear(inc.top1Peak.year)}` : undefined },
            { value: `${inc.p90p10.toFixed(1)} times`, label: "Income of a person near the top against one near the bottom", note: "The 90th against the 10th percentile" },
          ]}
        />
        <Caution>Household surveys can miss the very highest incomes, so the share of the top 1% here may be lower than the share measured from tax records, which count income before tax in a different way.</Caution>
      </Panel>

      <Panel
        id="h-inc-tax" title="What tax and benefits do to each fifth of people"
        lead={`Average for each person in each fifth, in pounds a year, in 2024/25. Benefits make up ${Math.round((q.cashBenefits[0] / q.gross[0]) * 100)}% of the poorest fifth's income before tax and ${Math.round((q.cashBenefits[4] / q.gross[4]) * 100)}% of the richest fifth's. The richest fifth pay about ${Math.round(q.directTaxes[4] / q.directTaxes[0])} times as much direct tax as the poorest.`}
        sources={[SOURCES.hdii]}
      >
        {q.groups.map((name, i) => (
          <div key={name} style={{ padding: "12px 0", borderTop: i ? `1px solid ${COLORS.hairline}` : "none" }}>
            <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 14.5, color: COLORS.ink }}>{name}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 18px", fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 4 }}>
              <span>Earned and other income <strong style={strong}>{money(q.original[i])}</strong></span>
              <span>plus benefits <strong style={strong}>{money(q.cashBenefits[i])}</strong></span>
              <span>less tax <strong style={strong}>{money(q.directTaxes[i])}</strong></span>
              <span>leaves <strong style={strong}>{money(q.disposable[i])}</strong></span>
            </div>
          </div>
        ))}
        <SubTitle>What is left after tax and benefits</SubTitle>
        <BarRows
          label="Income after tax and benefits for each fifth" accent={AFTER}
          rows={q.groups.map((name, i) => ({ label: name, value: q.disposable[i], text: money(q.disposable[i]) }))}
        />
        <p style={para}>Direct taxes here are income tax, National Insurance, student loan repayments and council tax. Taxes on spending, such as VAT and fuel duty, are not counted in these figures.</p>
      </Panel>

      <Panel
        id="h-inc-decile" title="Income by tenth of people"
        lead="Take everyone in the UK, line them up from lowest to highest income and cut into ten equal groups. Income here is adjusted for household size, in pounds a year."
        sources={[SOURCES.hdii]}
      >
        <BarRows
          label="Income after tax and benefits by tenth of people" accent={AFTER} max={topMax}
          rows={decileNames.map((name, i) => ({ label: name, value: dec.disposable[i], text: money(dec.disposable[i]), note: `${money(dec.original[i])} before tax and benefits` }))}
        />
        <p style={para}>The richest tenth have about {(dec.disposable[9] / dec.disposable[0]).toFixed(0)} times the income after tax of the poorest tenth, and about {(dec.original[9] / dec.original[0]).toFixed(0)} times before tax and benefits.</p>
      </Panel>

      <Panel
        id="h-inc-age" title="Income by age"
        lead={`The typical income after tax for people of each age, adjusted for household size, in 2024/25 prices. The change shown is in real terms since ${financialYear(age.years[0])}.`}
        sources={[SOURCES.hdii]}
      >
        <BarRows label="Typical income after tax by age" accent={ACCENT} rows={ageRows} />
        <p style={para}>People aged {ageRows.reduce((a, b) => (b.value > a.value ? b : a)).label.replace("Aged ", "")} have the highest typical income of any age group. Since {financialYear(age.years[0])} it has risen most, in real terms, for people aged {gained.slice(0, 3).map((r) => r.label).join(", ")} and least for people aged {gained.slice(-2).map((r) => r.label).join(" and ")}.</p>
      </Panel>

      <Panel
        id="h-inc-tenure" title="Income by how people live"
        lead="Average income of households in 2024/25, a year. These are households, not people, and are not adjusted for how many live in them."
        sources={[SOURCES.hdii]}
      >
        <BarRows
          label="Average household income by tenure" accent={ACCENT}
          rows={tenure.map((t) => ({ label: t.name, value: t.disposable, text: money(t.disposable), note: `${money(t.gross)} before tax` }))}
        />
        <p style={para}>Owners with a mortgage have the highest incomes of these groups. Many people who own their home outright are retired, which helps to explain why their incomes are lower than those of people still paying a mortgage.</p>
      </Panel>
    </div>
  );
}
