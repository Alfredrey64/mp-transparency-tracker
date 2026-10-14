import { useRef, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING } from "../theme";
import { pillStyle } from "../lib/onsStyles";
import { PageHeader } from "./shared";
import { IconMortarboard } from "./icons";
import { BarRows, Caution, PageToggles, Panel, RangeField, Stats, Takeaways, TrendExplorer } from "./insight";
import { ATTAINMENT, CHECKED, SCHOOLS, SEND, SOURCES, UNIVERSITY } from "../data/education";
import { AUTUMN, E, academicYear, at, cpiMonth, feeHistory, gap, last, repayments } from "../lib/education";
import { para, strong } from "../lib/insightStyle";

// Education: schools in England, the gap between richer and poorer pupils, special educational needs, and university fees and loans.
// One page with a row of toggles; the address carries the toggle (/education/send).

const ACCENT = "#7A5AF0";
const li = { margin: "0 0 8px", paddingLeft: 2 };
const n = (v) => v.toLocaleString("en-GB");
const money = (v) => `£${n(v)}`;
const pctText = (v) => `${v}%`;
const r1 = (v) => Math.round(v * 10) / 10;
const pctCaption = (v) => `${r1(v)}%`;

const TABS = [
  { key: "overview", label: "Overview", blurb: "The main figures for schools in England, how they have changed, and how to read them.", colour: "#7A5AF0" },
  { key: "gaps", label: "The attainment gap", blurb: "How far behind pupils from poorer families finish school, and whether that has changed.", colour: "#C0561F" },
  { key: "send", label: "Special needs", blurb: "Pupils with special educational needs, and the plans that guarantee support.", colour: "#0F766E" },
  { key: "university", label: "University", blurb: "Tuition fees, student loans, and what a graduate repays at different pay.", colour: "#1D4ED8" },
  { key: "arguments", label: "The arguments", blurb: "What to do about the gap, special needs support and fees, set out fairly.", colour: "#D6455D" },
  { key: "about", label: "Sources", blurb: "Where each figure comes from and what it leaves out.", colour: "#6B7280" },
];
const KEYS = new Set(TABS.map((t) => t.key));
const parse = (param) => { const first = String(param ?? "").split("/")[0]; return KEYS.has(first) ? first : "overview"; };

const A8 = E.ks4;
const lastYear = last(A8.years);
const latest = (series) => at(A8.years, series, lastYear);
const gap8 = gap(A8.notDisadvantaged.attainment8, A8.disadvantaged.attainment8);
const gap8First = gap8[0];
const gap8Last = last(gap8);

function Overview({ onPick }) {
  const s = SCHOOLS;
  const pupils = E.sen.pupils;
  const peak = Math.max(...pupils);
  const peakYear = E.sen.years[pupils.indexOf(peak)];
  const fsm = E.freeMeals;
  const abs = E.absence;
  const absLast = last(abs.persistentPct);
  const absPeak = Math.max(...abs.persistentPct);
  const absPeakYear = abs.years[abs.persistentPct.indexOf(absPeak)];
  const absBefore = at(abs.years, abs.persistentPct, 2018);
  const fsmFirst = at(fsm.years, fsm.pct, 2017);
  const link = { marginTop: 12, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink, background: "transparent", border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: "8px 16px", cursor: "pointer" };
  return (
    <div>
      <Takeaways
        accent={ACCENT}
        items={[
          `There are ${s.pupils} million pupils in England's schools, about ${n(Math.round((peak - last(pupils)) / 10000) * 10000)} fewer than the peak in ${academicYear(peakYear)}. Falling numbers of children are working their way through the system.`,
          `${r1(fsm.pct.at(-1))}% of pupils are now eligible for free school meals, up from ${r1(fsmFirst)}% in 2017/18. Part of the rise comes from changed rules when Universal Credit arrived, so it is not only a measure of low incomes.`,
          `${r1(absLast)}% of pupils missed at least a tenth of their school sessions in ${academicYear(last(abs.years))}. That is down from ${r1(absPeak)}% in ${academicYear(absPeakYear)} but well above the ${r1(absBefore)}% before the pandemic.`,
          `Pupils from poorer families score ${gap8Last} points lower on the main GCSE measure than other pupils, against ${gap8First} points in 2018/19.`,
          `Education, health and care plans for children with special needs have risen by ${SEND.plansChangePct}% in a year, the biggest rise since 2014.`,
        ]}
      />

      <Panel
        id="h-edu-main" accent={ACCENT} title="Schools in England"
        lead={`Education is devolved, so Scotland, Wales and Northern Ireland run their own schools. These figures are for England, from the Department for Education, for ${s.year}.`}
        sources={[SOURCES.pupils, SOURCES.workforce, SOURCES.declining]}
      >
        <Stats
          accent={ACCENT}
          items={[
            { value: `${s.pupils} million`, label: "Pupils in schools", note: `${n(-s.pupilsChange)} fewer than a year earlier`, spark: pupils },
            { value: `${s.freeMeals}%`, label: "Pupils eligible for free school meals", note: "A common measure of low family income", spark: fsm.pct },
            { value: n(s.teachers), label: "Full-time equivalent teachers", note: `${n(-s.teachersChange)} fewer than the year before` },
            { value: `${s.ratio}`, label: "Pupils for each teacher", note: "Across all state-funded schools" },
          ]}
        />
        <p style={para}>{s.englishExtra}% of pupils have a first language other than English, and {s.independentPct}% ({n(s.independent)}) go to independent schools, {Math.abs(s.independentChangePct)}% fewer than a year earlier.</p>
      </Panel>

      <Panel id="h-edu-trends" title="How things have changed" lead="Pick a measure. Each is from the Department for Education's own series for England." accent={ACCENT}>
        <TrendExplorer
          accent={ACCENT}
          options={[
            { key: "pupils", label: "Number of pupils", lines: [{ name: "Pupils in all schools", years: E.sen.years, values: pupils }], offset: AUTUMN, labelFn: academicYear, yFormat: (v) => `${(v / 1e6).toFixed(1)}m`, change: "percent", note: "All pupils in state-funded and independent schools at the January census." },
            { key: "meals", label: "Free school meals", lines: [{ name: "Share of pupils eligible", years: fsm.years, values: fsm.pct }], offset: AUTUMN, labelFn: academicYear, yFormat: pctText, captionFormat: pctCaption, change: "pp", breaks: [2018.3], note: "The faint line marks April 2018, when eligibility rules changed for Universal Credit. Children who already qualified kept their meals, so the rise since then reflects rules as well as incomes.", sources: [SOURCES.freeMeals] },
            { key: "absence", label: "Absence", lines: [{ name: "Missed at least 10% of sessions", years: abs.years, values: abs.persistentPct }, { name: "Missed at least half", color: "#D6455D", years: abs.years, values: abs.severePct }], offset: AUTUMN, labelFn: academicYear, yFormat: pctText, captionFormat: pctCaption, change: "pp", breaks: [2019.67], note: "There is no figure for 2019/20 because absence was not collected during the first lockdown." },
            { key: "ks2", label: "Reading, writing and maths at 11", lines: [{ name: "Reaching the expected standard in all three", years: E.keyStage2.years, values: E.keyStage2.readingWritingMaths }], offset: AUTUMN, labelFn: academicYear, yFormat: pctText, captionFormat: pctCaption, change: "pp", breaks: [2019.67], note: `Key stage 2 tests were cancelled in 2020 and 2021. The figure for ${academicYear(last(E.keyStage2.years))} is provisional.` },
          ]}
          sources={[SOURCES.pupils, SOURCES.absence, SOURCES.ks2]}
        />
      </Panel>

      <Panel
        id="h-edu-teachers" title="Teachers"
        lead={`${n(s.leavers)} teachers left the state-funded sector in the latest year. There were ${n(s.vacancies)} vacancies, about ${s.vacanciesPer1000} in every 1,000 posts.`}
        sources={[SOURCES.workforce]}
      >
        <p style={para}>Vacancies are posts that are advertised and not filled. They do not show posts filled by someone teaching outside their subject, or by a supply teacher, which the Department counts separately.</p>
      </Panel>

      <Panel id="h-edu-where" title="Where to look next">
        <p style={para}>The gap between poorer and better-off pupils is the most argued-over result in the figures. Special educational needs support is where demand has risen fastest. University fees affect every graduate's pay for decades.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={() => onPick("gaps")} style={link}>The attainment gap</button>
          <button type="button" onClick={() => onPick("send")} style={link}>Special needs</button>
          <button type="button" onClick={() => onPick("university")} style={link}>University fees and loans</button>
        </div>
      </Panel>
    </div>
  );
}

const GROUP_METRICS = {
  attainment8: { label: "Average Attainment 8 score", max: 60, text: (v) => `${v}`, note: "Out of a possible 90. It adds up a pupil's best eight GCSE-level results." },
  grade5: { label: "English and maths at grade 5 or above", max: 70, text: (v) => `${v}%`, note: "The share of pupils getting grade 5 or above in both subjects." },
};

function GroupBars({ metric, groups }) {
  const m = GROUP_METRICS[metric];
  return (
    <BarRows
      label={`${m.label}, ${academicYear(lastYear)}`} accent={ACCENT} max={m.max}
      rows={groups.map((g) => ({ label: g.label, value: latest(g.series[metric]), text: m.text(latest(g.series[metric])), tone: g.tone }))}
    />
  );
}

function Gaps() {
  const a = ATTAINMENT;
  const [metric, setMetric] = useState("attainment8");
  const gi = E.gapIndex;
  const giMin = Math.min(...gi.values);
  const giMinYears = gi.years.filter((_, i) => gi.values[i] === giMin).map(academicYear);
  const gapEm = gap(A8.notDisadvantaged.grade5, A8.disadvantaged.grade5);
  const bothMetric = [
    { label: "Not disadvantaged", series: A8.notDisadvantaged, tone: ACCENT },
    { label: "Disadvantaged", series: A8.disadvantaged, tone: "#C0561F" },
  ];
  const bySex = [
    { label: "Girls", series: A8.girls, tone: "#7A5AF0" },
    { label: "Boys", series: A8.boys, tone: "#1D4ED8" },
  ];
  return (
    <div>
      <Panel
        id="h-edug-gap" accent={ACCENT} title="Results at 16"
        lead={`Pupils who have been eligible for free school meals in the last six years are counted as disadvantaged by the Department for Education. They were ${a.disadvantagedShare}% of pupils at the end of key stage 4 (GCSEs) in ${a.year}.`}
        sources={[SOURCES.ks4]}
      >
        <Stats
          accent={ACCENT}
          items={[
            { value: `${gap8Last} points`, label: "Gap in average Attainment 8 score", note: `Between disadvantaged pupils and the rest, ${a.year}`, spark: gap8.filter((v) => v !== null) },
            { value: `${a.englishMathsGap} points`, label: "Gap in pupils getting grade 5 or above in English and maths", note: "Percentage points, same two groups", spark: gapEm.filter((v) => v !== null) },
            { value: a.gapIndex.toFixed(2), label: "Disadvantage gap index", note: "A measure that stays comparable as grading changes", spark: gi.values },
          ]}
        />
      </Panel>

      <Panel id="h-edug-trend" title="Is the gap closing?" lead="Pick a measure. The gap index goes back to 2010/11, the other two to 2018/19." sources={[SOURCES.ks4]}>
        <TrendExplorer
          accent={ACCENT}
          options={[
            { key: "a8", label: "GCSE score", lines: [{ name: "Disadvantaged pupils", color: "#C0561F", years: A8.years, values: A8.disadvantaged.attainment8 }, { name: "Other pupils", color: ACCENT, years: A8.years, values: A8.notDisadvantaged.attainment8 }], offset: AUTUMN, labelFn: academicYear, yFormat: (v) => `${v}`, change: "points", breaks: [2019.67, 2021.67], note: `The gap was ${gap8First} points in 2018/19 and ${gap8Last} in ${academicYear(lastYear)}. In 2019/20 and 2020/21 grades were set by teachers instead of exams and were higher for everyone, so those two years, between the faint lines, are not comparable with the others.` },
            { key: "em", label: "English and maths", lines: [{ name: "Disadvantaged pupils", color: "#C0561F", years: A8.years, values: A8.disadvantaged.grade5 }, { name: "Other pupils", color: ACCENT, years: A8.years, values: A8.notDisadvantaged.grade5 }], offset: AUTUMN, labelFn: academicYear, yFormat: pctText, captionFormat: pctCaption, change: "pp", breaks: [2019.67, 2021.67], note: `The share getting grade 5 or above in both subjects. The gap was ${gapEm[0]} percentage points in 2018/19 and ${last(gapEm)} in ${academicYear(lastYear)}. Teacher-assessed years are marked as above.` },
            { key: "index", label: "Gap index since 2010", governments: true, lines: [{ name: "Disadvantage gap index", years: gi.years, values: gi.values }], offset: AUTUMN, labelFn: academicYear, yFormat: (v) => v.toFixed(2), change: "index", note: `A bigger number means a wider gap. The index fell from ${gi.values[0].toFixed(2)} in 2010/11, so the gap narrowed, to its lowest, ${giMin.toFixed(2)}, in ${giMinYears.join(" and ")}. It has risen since, to ${last(gi.values).toFixed(2)}. The shading shows who was in government, not what caused a change.` },
          ]}
        />
      </Panel>

      <Panel id="h-edug-groups" title="How groups of pupils compare" lead={`Results for the ${academicYear(lastYear)} school year, for pupils in state-funded schools in England.`} sources={[SOURCES.ks4]}>
        <div role="group" aria-label="Measure" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {Object.entries(GROUP_METRICS).map(([k, m]) => <button key={k} type="button" aria-pressed={metric === k} onClick={() => setMetric(k)} style={pillStyle(metric === k)}>{m.label}</button>)}
        </div>
        <GroupBars metric={metric} groups={[...bothMetric, ...bySex, { label: "All pupils", series: A8.all, tone: COLORS.inkSoft }]} />
        <p style={para}>{GROUP_METRICS[metric].note} Girls have scored higher than boys in every year since 2018/19, and the gap between disadvantaged pupils and others is larger than the gap between girls and boys.</p>
      </Panel>

      <Panel id="h-edug-read" title="How to read the gap">
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          <li style={li}><strong style={strong}>An average, not a person.</strong> Many disadvantaged pupils do very well, and many others do not. The gap compares two groups' averages.</li>
          <li style={li}><strong style={strong}>Who counts.</strong> The measure counts pupils who have been on free school meals in the past six years, so it follows low income over time but not every poor household, since some do not qualify.</li>
          <li style={li}><strong style={strong}>Causes are contested.</strong> Home, health, housing, school quality and local jobs all play a part, and the figures cannot say how much each matters.</li>
        </ul>
      </Panel>
    </div>
  );
}

function Send() {
  const e = SEND;
  const sen = E.sen;
  const [metric, setMetric] = useState("attainment8");
  const groups = [
    { label: "No special needs", series: A8.noSen, tone: ACCENT },
    { label: "SEN support", series: A8.senSupport, tone: "#1D4ED8" },
    { label: "Education, health and care plan", series: A8.ehcPlan, tone: "#0F766E" },
  ];
  return (
    <div>
      <Panel
        id="h-edus-now" accent="#0F766E" title="Pupils with special educational needs"
        lead={`A pupil has special educational needs and disabilities (SEND) if they need more help than most children of their age. In ${e.year}, more than ${e.withSen} million pupils in England, ${e.withSenShare}% of the total, had identified needs.`}
        sources={[SOURCES.sen]}
      >
        <Stats
          accent="#0F766E"
          items={[
            { value: n(e.ehcInSchools), label: "Pupils with an education, health and care plan", note: `${e.ehcShare}% of pupils. A plan is a legal document that sets out the support a child must get`, spark: sen.ehcPlan },
            { value: n(e.support), label: "Pupils on SEN support", note: `${e.supportShare}% of pupils. Help given by the school without a plan`, spark: sen.support },
          ]}
        />
      </Panel>

      <Panel id="h-edus-trend" title="Plans are rising quickly" lead={`There were ${n(e.plans)} education, health and care plans in January 2026, ${e.plansChangePct}% more than a year earlier. That is the biggest yearly rise since 2014.`} sources={[SOURCES.sen, SOURCES.ehc]}>
        <TrendExplorer
          accent="#0F766E"
          options={[
            { key: "share", label: "Share of pupils", lines: [{ name: "On SEN support", color: "#1D4ED8", years: sen.years, values: sen.supportPct }, { name: "With an EHC plan", color: "#0F766E", years: sen.years, values: sen.ehcPlanPct }], offset: AUTUMN, labelFn: academicYear, yFormat: pctText, captionFormat: pctCaption, change: "pp", note: "Both have risen every year since 2016/17, while the number of pupils has fallen since 2023/24." },
            { key: "plans", label: "Plans each January", lines: [{ name: "Education, health and care plans", years: E.ehcPlans.years, values: E.ehcPlans.values }], offset: 1, labelFn: (y) => `January ${y + 1}`, yFormat: (v) => `${Math.round(v / 1000)}k`, change: "percent", note: "Plans for children and young people up to 25, in all settings, so the number is larger than the number in schools." },
          ]}
        />
        <div style={{ height: 18 }} />
        <Stats
          accent="#0F766E"
          items={[
            { value: n(e.newPlans2025), label: "New plans issued in 2025", note: `${e.newPlansChangePct}% more than in 2024` },
            { value: `${e.within20Weeks}%`, label: "Issued within the 20-week legal limit", note: "Of new plans, excluding exceptions" },
          ]}
        />
        <p style={para}>Councils must decide whether to issue a plan within 20 weeks of a request. Fewer than half were issued in time, which is one reason parents can wait a long time for support.</p>
      </Panel>

      <Panel id="h-edus-results" title="Results for pupils with special needs" lead={`Key stage 4 results in ${academicYear(lastYear)}. A pupil's needs differ a great deal, so these are averages across very different children.`} sources={[SOURCES.ks4]}>
        <div role="group" aria-label="Measure" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {Object.entries(GROUP_METRICS).map(([k, m]) => <button key={k} type="button" aria-pressed={metric === k} onClick={() => setMetric(k)} style={pillStyle(metric === k)}>{m.label}</button>)}
        </div>
        <GroupBars metric={metric} groups={groups} />
        <Caution title="Not the same as how well a school does">Pupils with an education, health and care plan often have complex needs and many take different qualifications. The Department's measure of progress, which compares pupils with others who started with the same results, is the fairer way to judge a school.</Caution>
      </Panel>
    </div>
  );
}

function Calculator() {
  const [pay, setPay] = useState(40000);
  const rows = repayments(pay);
  const top = Math.max(...rows.map((r) => r.yearly), 1);
  const under = rows.filter((r) => r.plan !== "Postgraduate loan").map((r) => r.yearly);
  const lo = Math.min(...under);
  const hi = Math.max(...under);
  return (
    <div>
      <RangeField id="edu-pay" label="Your pay before tax, a year" value={pay} min={15000} max={120000} step={500} onChange={setPay} text={money(pay)} accent="#1D4ED8" hint="Slide to see what is taken from pay on each kind of loan." />
      <BarRows
        label="What is repaid in a year on each loan plan" accent="#1D4ED8" max={top}
        rows={rows.map((r) => ({ label: r.plan, note: `${r.rate}% of pay above ${money(r.threshold)}`, value: r.yearly, text: r.yearly ? `${money(r.yearly)} a year` : "Nothing" }))}
      />
      <p style={para}>At {money(pay)} a year, repayments on an undergraduate loan range from {money(lo)} a year ({money(Math.round(lo / 12))} a month) to {money(hi)} ({money(Math.round(hi / 12))} a month), depending on the plan. For every extra £100 earned above a threshold, £9 goes on the loan, £6 on a postgraduate loan.</p>
      <Caution title="What this leaves out">It shows repayments only, not interest, and what is written off after a set number of years. A person can have an undergraduate and a postgraduate loan at once, and then both repayments apply. Thresholds can change each April.</Caution>
    </div>
  );
}

function University() {
  const u = UNIVERSITY;
  const fees = feeHistory();
  const f0 = fees[0];
  const fl = last(fees);
  return (
    <div>
      <Panel
        id="h-eduu-fees" accent="#1D4ED8" title="Fees and loans"
        lead={`Students from England pay up to ${money(u.fee2627)} a year in tuition fees for 2026/27, up from ${money(u.fee2526)}. They can borrow the fee, and a separate loan for living costs.`}
        sources={[SOURCES.fees, SOURCES.loans]}
      >
        <Stats
          accent="#1D4ED8"
          items={[
            { value: `£${u.balanceBn}bn`, label: "Owed on student loans in England", note: "At the end of March 2026" },
            { value: `£${u.issuedBn}bn`, label: "Lent in the 2025/26 financial year", note: `£${u.repaidBn}bn was repaid in the same year` },
            { value: `${u.paying} million`, label: "People making repayments", note: "Borrowers who are currently repaying" },
            { value: money(u.averageOnEntry), label: "Average owed when repayment starts", note: "For those who have just started to repay" },
          ]}
        />
      </Panel>

      <Panel id="h-eduu-history" title="What the fee cap has been worth" lead="The most a university can charge was set at £9,000 in 2012, raised to £9,250 in 2017 and held there until 2024/25. Prices went on rising, so the same fee bought less." sources={[SOURCES.feeHistory, SOURCES.fees, SOURCES.cpi]}>
        <TrendExplorer
          accent="#1D4ED8"
          options={[
            { key: "fee", label: "Fee cap and its value today", lines: [{ name: "In the prices of the time", color: "#1D4ED8", years: fees.map((f) => f.year), values: fees.map((f) => f.fee) }, { name: `In prices of ${cpiMonth.slice(0, 4)}`, color: "#C0561F", years: fees.map((f) => f.year), values: fees.map((f) => f.real) }], offset: AUTUMN, labelFn: academicYear, yFormat: money, change: "percent", note: `Our calculation using the ONS consumer price index, with each year's fee brought up to ${cpiMonth.slice(0, 4)} prices. The cap was ${money(f0.fee)} in ${academicYear(f0.year)}, worth about ${money(f0.real)} in today's prices, and is ${money(fl.fee)} in ${academicYear(fl.year)}.` },
          ]}
        />
      </Panel>

      <Panel
        id="h-eduu-repay" title="What graduates repay"
        lead={`Repayment is ${u.rate}% of income above a threshold, taken through pay, so it works more like a tax than a debt. The threshold depends on which plan a person is on, which depends on when they started.`}
        sources={[SOURCES.repay]}
      >
        <Calculator />
        <p style={para}>Plan 1 and Plan 2 are for older loans, Plan 4 is for Scotland, and Plan 5 is for people who started in England from August 2023. These are the thresholds GOV.UK lists now and the Government can change them.</p>
        <Caution title="Debt is not like a bank loan">Because repayment is a share of income, a graduate who earns less pays back less each month. Most of the balance on the loans is not expected to be repaid in full, which is why the government's own accounts treat part of every loan as spending.</Caution>
      </Panel>
    </div>
  );
}

function Arg({ id, title, shows, supporters, critics, sources, sLabel, cLabel }) {
  return (
    <Panel id={id} title={title} sources={sources}>
      <div style={{ padding: "10px 14px", borderRadius: 12, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.ink }}>
        <strong>What the figures show.</strong> {shows}
      </div>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 14.5, fontWeight: 700, color: COLORS.ink, margin: "12px 0 4px" }}>{sLabel}</h3>
      {supporters.map((t) => <p key={t} style={{ ...para, marginTop: 0, fontSize: 14.5 }}>{t}</p>)}
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 14.5, fontWeight: 700, color: COLORS.ink, margin: "12px 0 4px" }}>{cLabel}</h3>
      {critics.map((t) => <p key={t} style={{ ...para, marginTop: 0, fontSize: 14.5 }}>{t}</p>)}
    </Panel>
  );
}

function Arguments() {
  const a = ATTAINMENT;
  const fees = feeHistory();
  const gi = E.gapIndex;
  return (
    <div>
      <Panel id="h-edua-intro" accent={ACCENT} title="The arguments" lead="Figures can show who does well and where support is stretched. They cannot say how much to spend or who should pay, which depends on what people value. These are the arguments people make, not our view." />
      <Arg
        id="h-edua-gap" title="Closing the attainment gap"
        shows={`The gap in Attainment 8 was ${a.attainment8Gap} points in ${a.year}, against ${a.attainment8Gap201819} in 2018/19. The gap index fell from ${gi.values[0].toFixed(2)} in 2010/11 to ${Math.min(...gi.values).toFixed(2)} and has risen to ${last(gi.values).toFixed(2)}.`}
        sLabel="People who want more targeted funding say" cLabel="People who are more cautious say"
        supporters={["Children from poorer homes start school behind and the gap widens, so money that follows disadvantaged pupils, such as the pupil premium, and help with reading and maths early on, does the most good."]}
        critics={["Schools in the same area with similar pupils get quite different results, which suggests teaching and school leadership matter as much as money. Targeting by free school meals also misses poor households that do not claim.", "Results also depend on things schools do not control, such as housing, health and family income, so some say the gap will not close without action outside schools."]}
        sources={[SOURCES.ks4]}
      />
      <Arg
        id="h-edua-send" title="Special needs support"
        shows={`Education, health and care plans rose ${SEND.plansChangePct}% in a year to ${n(SEND.plans)}, and ${SEND.within20Weeks}% of new plans were issued within 20 weeks. The share of pupils with a plan has more than doubled, from ${E.sen.ehcPlanPct[0]}% in 2015/16 to ${last(E.sen.ehcPlanPct)}%.`}
        sLabel="People who want the plan system kept say" cLabel="People who want it changed say"
        supporters={["A plan is a legal right to support, and many parents say they only get help after a fight. Weakening it would leave children with fewer protections at a time when need is growing."]}
        critics={["The system is under strain, with long waits and rising costs for councils, so it needs reform, such as more support in ordinary schools earlier. Others fear this could be used to cut support."]}
        sources={[SOURCES.ehc, SOURCES.sen]}
      />
      <Arg
        id="h-edua-fees" title="Fees and loans"
        shows={`Fees are up to ${money(UNIVERSITY.fee2627)} a year in 2026/27, and £${UNIVERSITY.balanceBn}bn is owed on loans in England. In today's prices the 2012 cap of ${money(fees[0].fee)} is about ${money(fees[0].real)}, so the cap is worth less now than then.`}
        sLabel="People who want fees kept or raised say" cLabel="People who want them cut or ended say"
        supporters={["Graduates earn more on average and repay only when they earn above the threshold, so the cost is shared with people who do not go. Without fees, universities would depend on a government that has many other calls on its money."]}
        critics={["Debt of this size is a heavy burden on young people, the interest adds to it, and some graduates repay for most of their working lives. Others argue that the cost should be met by tax, since the public gains from an educated workforce."]}
        sources={[SOURCES.fees, SOURCES.loans, SOURCES.repay, SOURCES.feeHistory]}
      />
    </div>
  );
}

function About() {
  return (
    <div>
      <Panel id="h-edux-src" title="Where the figures come from" lead={`Checked on ${CHECKED}. The charts read straight from the Department for Education's open statistics (saved on ${E.built}).`}>
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          {Object.values(SOURCES).map((s) => (
            <li key={s.url} style={li}><a href={s.url} target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontFamily: FONT_BODY, fontWeight: 600 }}>{s.label}<span className="sr-only"> (opens in a new tab)</span></a></li>
          ))}
        </ul>
      </Panel>
      <Panel id="h-edux-limits" title="What to bear in mind">
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          <li style={li}><strong style={strong}>England only.</strong> Scotland, Wales and Northern Ireland set their own exams, funding and fees, so these figures are not for the whole UK.</li>
          <li style={li}><strong style={strong}>Academic years.</strong> A year such as 2024/25 runs from September to August. Pupil, special needs and meals figures are taken in January of the school year, plans each January.</li>
          <li style={li}><strong style={strong}>Breaks and gaps.</strong> Exams and tests were cancelled in 2020 and 2021, absence was not collected in 2019/20, and the department revises recent years. The charts mark each of these.</li>
          <li style={li}><strong style={strong}>Not covered.</strong> School funding per pupil, the early years, further education and apprenticeships, how England compares with other countries, and what happens to graduates after they leave.</li>
        </ul>
        <p style={{ ...para, fontSize: 13 }}>The fee chart is our own calculation from the fee caps and the ONS consumer price index. Everything else is the Department's own figure.</p>
      </Panel>
    </div>
  );
}

export default function Education({ param }) {
  const [tab, setTab] = useState(() => parse(param));
  const [seen, setSeen] = useState(param);
  const ref = useRef(null);
  if (param !== seen) { setSeen(param); setTab(parse(param)); }
  function go(next) {
    const moved = next !== tab;
    setTab(next);
    window.history.replaceState(null, "", next === "overview" ? "#/education" : `#/education/${next}`);
    if (moved && ref.current && ref.current.getBoundingClientRect().top < 0) ref.current.scrollIntoView({ block: "start" });
  }
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={IconMortarboard} kicker="Britain in numbers" title="Education" subtitle="How schools in England are doing, the gap between richer and poorer pupils, special needs support, university fees and loans, and the arguments about each." />
      <div ref={ref} style={{ scrollMarginTop: 12 }}>
        <PageToggles tabs={TABS} current={tab} onPick={go} label="What to look at" idPrefix="edu" />
      </div>
      <div key={tab} className="ge-fade" role="tabpanel" id="edu-panel" aria-labelledby={`edu-tab-${tab}`}>
        {tab === "overview" && <Overview onPick={go} />}
        {tab === "gaps" && <Gaps />}
        {tab === "send" && <Send />}
        {tab === "university" && <University />}
        {tab === "arguments" && <Arguments />}
        {tab === "about" && <About />}
      </div>
    </div>
  );
}
