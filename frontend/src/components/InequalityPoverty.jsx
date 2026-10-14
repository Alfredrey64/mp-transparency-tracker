import { useState } from "react";
import { pillStyle } from "../lib/onsStyles";
import { BarRows, Caution, Legend, Panel, Stats, SubTitle, TimeChart } from "./insight";
import { D, last, povertyFacts } from "../lib/inequality";
import { SOURCES, TWO_CHILD_LIMIT } from "../data/inequality";
import { financialYear, para, strong, toPoints } from "../lib/insightStyle";

const ACCENT = "#D6455D";
const COLOURS = { all: "#1c1b22", children: "#D6455D", workingAge: "#0E9AA7", pensioners: "#C7871A" };
const NAMES = { all: "Everyone", children: "Children", workingAge: "Working-age adults", pensioners: "Pensioners" };

export default function InequalityPoverty() {
  const [basis, setBasis] = useState("ahc");
  const [governments, setGovernments] = useState(false);
  const p = D.poverty;
  const f = povertyFacts();
  const years = p.years;
  const yr = last(years);
  const line = (key) => ({ name: NAMES[key], color: COLOURS[key], points: toPoints(years, p[key][basis], financialYear, 0.25) });
  const ws = p.workStatus;
  const dis = p.disability;
  const deep = p.deepMaterialChildren;
  const since06 = p.children.ahc.filter((_, i) => years[i] >= 2006);
  return (
    <div>
      <Panel
        id="h-pov-now" accent={ACCENT} title="How many people are in poverty?"
        lead="Relative poverty means living in a household with income below 60% of the typical household's income in that year. The line moves when the middle moves, as well as the bottom."
        sources={[SOURCES.hbai]}
      >
        <Stats
          accent={ACCENT}
          items={[
            { value: `${f.all.millions.ahc} million`, label: "People in relative poverty after housing costs", note: `${Math.round(f.all.ahc)}% of the UK. Before housing costs ${f.all.millions.bhc} million (${Math.round(f.all.bhc)}%)` },
            { value: `${f.children.millions.ahc} million`, label: "Children", note: `${Math.round(f.children.ahc)}% of children after housing costs` },
            { value: `${f.workingAge.millions.ahc} million`, label: "Working-age adults", note: `${Math.round(f.workingAge.ahc)}% of working-age adults` },
            { value: `${f.pensioners.millions.ahc} million`, label: "Pensioners", note: `${Math.round(f.pensioners.ahc)}% of pensioners, up from ${Math.round(p.pensioners.ahc.at(-2))}% the year before` },
          ]}
        />
      </Panel>

      <Panel
        id="h-pov-time" title="Poverty since 1994/95"
        lead={`Share of people in relative low income, ${financialYear(years[0])} to ${financialYear(yr)}.`}
        sources={[SOURCES.hbai]}
      >
        <div role="group" aria-label="Chart options" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          <button type="button" aria-pressed={basis === "ahc"} onClick={() => setBasis("ahc")} style={pillStyle(basis === "ahc")}>After housing costs</button>
          <button type="button" aria-pressed={basis === "bhc"} onClick={() => setBasis("bhc")} style={pillStyle(basis === "bhc")}>Before housing costs</button>
          <button type="button" aria-pressed={governments} onClick={() => setGovernments((v) => !v)} style={pillStyle(governments)}>Show who was in government</button>
        </div>
        <TimeChart
          key={basis} governments={governments} from={years[0]} to={yr + 1} yFormat={(v) => `${Math.round(v)}%`} accent={ACCENT} height={290}
          lines={["children", "all", "workingAge", "pensioners"].map(line)} breaks={[2021]}
          ariaLabel={`Share of people in relative low income ${basis === "ahc" ? "after" : "before"} housing costs, ${financialYear(years[0])} to ${financialYear(yr)}. In ${financialYear(yr)}: children ${Math.round(f.children[basis])}%, everyone ${Math.round(f.all[basis])}%, working-age adults ${Math.round(f.workingAge[basis])}%, pensioners ${Math.round(f.pensioners[basis])}%.`}
        />
        <p style={para}>
          The biggest change is for pensioners. After housing costs {Math.round(f.pensioners.ahcFirst)}% of pensioners were in relative poverty in {financialYear(years[0])} and {Math.round(f.pensioners.ahc)}% are now. For children it was {Math.round(f.children.ahcFirst)}% and is now {Math.round(f.children.ahc)}%, and in every year since 2006 it has stayed between {Math.round(Math.min(...since06))}% and {Math.round(Math.max(...since06))}%. The thin vertical line marks a change in how the figures are produced in {financialYear(2021)}.
        </p>
        <Caution title="A break in the figures">From {financialYear(2021)} the survey is combined with tax and benefit records, which gives better figures but means those before and after the line are not directly comparable. Year-to-year changes are small enough that many are within the margin of error.</Caution>
      </Panel>

      <Panel
        id="h-pov-work" title="Does work protect against poverty?"
        lead="Share in relative poverty before housing costs, by whether anyone in the family is in work."
        sources={[SOURCES.hbai]}
      >
        <Legend items={[{ name: "Working family", colour: "#0E9AA7" }, { name: "Workless family", colour: ACCENT }]} />
        <BarRows
          label="Share in relative poverty by family work status, latest year" accent={ACCENT} max={60}
          rows={[
            { label: "Children in working families", value: last(ws.childrenWorking), text: `${Math.round(last(ws.childrenWorking))}%`, tone: "#0E9AA7" },
            { label: "Children in workless families", value: last(ws.childrenWorkless), text: `${Math.round(last(ws.childrenWorkless))}%` },
            { label: "Working-age adults in working families", value: last(ws.adultsWorking), text: `${Math.round(last(ws.adultsWorking))}%`, tone: "#0E9AA7" },
            { label: "Working-age adults in workless families", value: last(ws.adultsWorkless), text: `${Math.round(last(ws.adultsWorkless))}%` },
          ]}
        />
        <p style={para}>Being in a workless family brings a much higher risk of poverty, but because most families have someone in work, {Math.round(last(ws.childrenWorking))}% of children in working families are still in relative poverty before housing costs.</p>
      </Panel>

      <Panel
        id="h-pov-more" title="Disability and the poorest children"
        lead="Two more cuts from the same survey."
        sources={[SOURCES.hbai]}
      >
        <SubTitle>Disability</SubTitle>
        <p style={{ ...para, marginTop: 0 }}>
          After housing costs, <strong style={strong}>{Math.round(last(dis.someoneDisabledAhc))}%</strong> of people in families where someone is disabled are in relative poverty, against <strong style={strong}>{Math.round(last(dis.noOneDisabledAhc))}%</strong> in families where no one is disabled. Disability costs money, and this measure does not count those costs, so the true gap in living standards may be larger.
        </p>
        <SubTitle>Deep material poverty among children</SubTitle>
        <p style={{ ...para, marginTop: 0 }}>
          A newer measure looks at what children go without, as well as family income. <strong style={strong}>{deep.millions} million children ({Math.round(deep.percent)}%)</strong> were in deep material poverty in {financialYear(deep.year)}. The measure only has two years of figures so far, so there is no long run to compare.
        </p>
      </Panel>

      <Panel
        id="h-pov-policy" title="What is changing"
        lead="The two-child limit on Universal Credit, which stopped extra support for a third and later child born from April 2017, ended on 6 April 2026."
        sources={[SOURCES.twoChild]}
      >
        <p style={{ ...para, marginTop: 0 }}>
          The government estimates this will mean about <strong style={strong}>{TWO_CHILD_LIMIT.fewerChildren.toLocaleString("en-GB")} fewer children</strong> in relative poverty after housing costs by {TWO_CHILD_LIMIT.year} than if the limit had stayed. Other groups use other figures and time periods, and these are projections, not results, so check the date and the measure when comparing them. The next release of these figures, for 2025/26, is due in March 2027.
        </p>
      </Panel>
    </div>
  );
}
