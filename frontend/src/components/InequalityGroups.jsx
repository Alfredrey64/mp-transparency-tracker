import { BarRows, Caution, Panel, Stats } from "./insight";
import { DISABILITY_PAY_GAP, GENDER_PAY_GAP, PERSISTENT_LOW_INCOME_BY_ETHNICITY, SOURCES } from "../data/inequality";
import { money, para, strong } from "../lib/insightStyle";
import { D } from "../lib/inequality";

const ACCENT = "#1FA97C";

export default function InequalityGroups() {
  const g = GENDER_PAY_GAP;
  const d = DISABILITY_PAY_GAP;
  const e = PERSISTENT_LOW_INCOME_BY_ETHNICITY;
  const type = (name) => D.wealth.householdTypes.find((t) => t.name === name).median;
  const lone = type("Lone parent, dependent children");
  const couple = type("Couple both over SPA, no children");
  return (
    <div>
      <Panel
        id="h-grp-gender" accent={ACCENT} title="The gender pay gap"
        lead={`The difference between the typical hourly pay of men and women, as a share of men's pay, in April ${g.year}. It compares all jobs, not men and women in the same job.`}
        sources={[SOURCES.genderPay]}
      >
        <Stats
          accent={ACCENT}
          items={[
            { value: `${g.fullTime.gap}%`, label: "Full-time employees", note: `Men £${g.fullTime.men.toFixed(2)} an hour, women £${g.fullTime.women.toFixed(2)}. It was ${g.fullTime.last}% a year earlier` },
            { value: `${g.allEmployees.gap}%`, label: "All employees", note: `It was ${g.allEmployees.last}% a year earlier` },
            { value: `${g.partTime.gap}%`, label: "Part-time employees", note: "Below zero means women earn more, on average, than men in part-time jobs" },
          ]}
        />
        <p style={para}>The full-time gap has narrowed by {g.changeSince1997} percentage points since 1997. The gap for all employees is wider than for full-time because women are more likely to work part-time, and part-time jobs tend to pay less per hour than full-time ones.</p>
        <h3 style={{ margin: "20px 0 8px", fontSize: 16 }}>By age, full-time employees</h3>
        <BarRows label="Gender pay gap by age" accent={ACCENT} max={15} rows={g.byAge.map((r) => ({ label: r.band, value: r.gap, text: `${r.gap}%` }))} />
        <p style={para}>The gap is small for people under 40 and much wider from 40 on. It also differs by place: {g.byNation.map((n) => `${n.name} ${n.gap}%`).join(", ")}. Every English region has a bigger gap than these three nations, and London and the South East have the biggest.</p>
        <Caution>The gap is not the same as unequal pay for equal work, which is against the law. It reflects differences in the jobs, hours and careers of men and women. All 2025 figures are provisional.</Caution>
      </Panel>

      <Panel
        id="h-grp-disability" title="Disability"
        lead={`Median hourly pay in ${d.year}: disabled employees earned £${d.disabled.toFixed(2)} and non-disabled employees £${d.nonDisabled.toFixed(2)}, a gap of ${d.gap}%.`}
        sources={[SOURCES.disabilityPay]}
      >
        <BarRows
          label="Disability pay gap" accent={ACCENT} max={20}
          rows={[
            { label: "All employees", value: d.gap, text: `${d.gap}%`, strong: true },
            { label: "Men", value: d.men, text: `${d.men}%` },
            { label: "Women", value: d.women, text: `${d.women}%` },
          ]}
        />
        <p style={para}>The gap was relatively stable between 2014 and 2023. The poverty figures on the Poverty page also show a higher rate for people in families where someone is disabled. The latest ONS release we have used is from October 2024.</p>
      </Panel>

      <Panel
        id="h-grp-ethnicity" title="Ethnic groups and lasting low income"
        lead={`The share of people in low income after housing costs in at least three of four years, ${e.period}. This is a measure of staying poor, not of being poor in one year.`}
        sources={[SOURCES.ethnicityLowIncome]}
      >
        <BarRows
          label="Persistent low income by ethnic group" accent={ACCENT} max={40}
          rows={[...e.rows, { label: "Everyone", value: e.all, text: `${e.all}%`, strong: true, tone: "#1c1b22" }].map((r) => (r.group ? { label: r.group, value: r.value, text: `${r.value}%` } : r))}
        />
        <p style={para}>Rates are well above the average for people in the Asian, Black and Other groups. The figures for the Mixed and Other groups come from small samples and are less reliable. The same source shows that for the Black group the rate is {e.blackBeforeHousing}% before housing costs and {e.rows.find((r) => r.group === "Black").value}% after, the widest gap between the two of any group.</p>
        <Caution>These are averages for large groups. Within every group some people are doing well and some badly, and the groups differ in age, where they live and how long they have been in the UK, all of which affect incomes.</Caution>
      </Panel>

      <Panel id="h-grp-more" title="Other groups on this page" lead="Age, housing and household type are covered elsewhere.">
        <p style={{ ...para, marginTop: 0 }}>Income by <strong style={strong}>age</strong> and by <strong style={strong}>housing</strong> is on the Income page, and wealth by <strong style={strong}>kind of household</strong>, such as lone parents and retired couples, is on the Wealth page. For example the typical lone parent with dependent children has {money(lone)} of wealth, and the typical couple both over State Pension age {money(couple)}.</p>
      </Panel>
    </div>
  );
}
