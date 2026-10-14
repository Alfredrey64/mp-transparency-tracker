import { useRef, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconMortarboard } from "./icons";
import { BarRows, Caution, PageToggles, Panel, Stats } from "./insight";
import { ATTAINMENT, CHECKED, SCHOOLS, SEND, SOURCES, UNIVERSITY } from "../data/education";
import { para, strong } from "../lib/insightStyle";

// Education: schools in England, the gap between richer and poorer pupils, special educational needs, and university fees and loans.
// One page with a row of toggles; the address carries the toggle (/education/send).

const ACCENT = "#7A5AF0";
const li = { margin: "0 0 8px", paddingLeft: 2 };
const n = (v) => v.toLocaleString("en-GB");
const money = (v) => `£${n(v)}`;

const TABS = [
  { key: "overview", label: "Overview", blurb: "The main figures for schools in England, and how to read them.", colour: "#7A5AF0" },
  { key: "gaps", label: "The attainment gap", blurb: "How far behind pupils from poorer families finish school.", colour: "#C0561F" },
  { key: "send", label: "Special needs", blurb: "Pupils with special educational needs, and the plans that guarantee support.", colour: "#0F766E" },
  { key: "university", label: "University", blurb: "Tuition fees, student loans, and when graduates repay.", colour: "#1D4ED8" },
  { key: "arguments", label: "The arguments", blurb: "What to do about the gap, special needs support and fees, set out fairly.", colour: "#D6455D" },
  { key: "about", label: "Sources", blurb: "Where each figure comes from and what it leaves out.", colour: "#6B7280" },
];
const KEYS = new Set(TABS.map((t) => t.key));
const parse = (param) => { const first = String(param ?? "").split("/")[0]; return KEYS.has(first) ? first : "overview"; };

function Overview({ onPick }) {
  const s = SCHOOLS;
  const link = { marginTop: 12, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink, background: "transparent", border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: "8px 16px", cursor: "pointer" };
  return (
    <div>
      <Panel
        id="h-edu-main" accent={ACCENT} title="Schools in England"
        lead={`Education is devolved, so Scotland, Wales and Northern Ireland run their own schools. These figures are for England, from the Department for Education, for ${s.year}.`}
        sources={[SOURCES.pupils, SOURCES.workforce]}
      >
        <Stats
          accent={ACCENT}
          items={[
            { value: `${s.pupils} million`, label: "Pupils in schools", note: `${n(-s.pupilsChange)} fewer than a year earlier` },
            { value: `${s.freeMeals}%`, label: "Pupils eligible for free school meals", note: "A common measure of low family income" },
            { value: n(s.teachers), label: "Full-time equivalent teachers", note: `${n(-s.teachersChange)} fewer than the year before` },
            { value: `${s.ratio}`, label: "Pupils for each teacher", note: "Across all state-funded schools" },
          ]}
        />
        <p style={para}>{s.englishExtra}% of pupils have a first language other than English, and {s.independentPct}% ({n(s.independent)}) go to independent schools, {Math.abs(s.independentChangePct)}% fewer than a year earlier. The number of children in the country is projected to keep falling, and school rolls have started to fall with it.</p>
      </Panel>

      <Panel
        id="h-edu-teachers" title="Teachers"
        lead={`${n(s.leavers)} teachers left the state-funded sector in the latest year. There were ${n(s.vacancies)} vacancies, about ${s.vacanciesPer1000} in every 1,000 posts.`}
        sources={[SOURCES.workforce]}
      >
        <p style={para}>Vacancies are posts that are advertised and not filled. They do not show posts filled by someone teaching outside their subject, or by a supply teacher, which the Department counts separately.</p>
      </Panel>

      <Panel id="h-edu-where" title="Where to look next">
        <p style={para}>The gap between poorer and better-off pupils is the most argued-over result in the figures. Special educational needs support is where spending and demand have risen fastest. University fees affect every graduate's pay for decades.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={() => onPick("gaps")} style={link}>The attainment gap</button>
          <button type="button" onClick={() => onPick("send")} style={link}>Special needs</button>
          <button type="button" onClick={() => onPick("university")} style={link}>University fees and loans</button>
        </div>
      </Panel>
    </div>
  );
}

function Gaps() {
  const a = ATTAINMENT;
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
            { value: `${a.attainment8Gap} points`, label: "Gap in average Attainment 8 score", note: `Between disadvantaged pupils and the rest, ${a.year}` },
            { value: `${a.englishMathsGap} points`, label: "Gap in pupils getting grade 5 or above in English and maths", note: "Percentage points, same two groups" },
            { value: a.gapIndex.toFixed(2), label: "Disadvantage gap index", note: "A measure that stays comparable as grading changes" },
          ]}
        />
        <BarRows
          label="Gap in Attainment 8 score, disadvantaged pupils against the rest" accent={ACCENT} max={20}
          rows={[
            { label: "2018/19", value: a.attainment8Gap201819, text: `${a.attainment8Gap201819}` },
            { label: "2023/24", value: a.attainment8GapLast, text: `${a.attainment8GapLast}` },
            { label: a.year, value: a.attainment8Gap, text: `${a.attainment8Gap}` },
          ]}
        />
        <p style={para}>Attainment 8 adds up a pupil's best results across eight subjects. The gap was {a.attainment8Gap201819} points before the pandemic and is {a.attainment8Gap} now, so it is wider than it was in 2018/19, and has hardly changed since the year before.</p>
        <Caution title="Why 2018/19">Exams were cancelled in 2020 and 2021 and marked differently in 2022, so the department compares recent years with 2018/19 rather than with the years between.</Caution>
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
            { value: n(e.ehcInSchools), label: "Pupils with an education, health and care plan", note: `${e.ehcShare}% of pupils. A plan is a legal document that sets out the support a child must get` },
            { value: n(e.support), label: "Pupils on SEN support", note: `${e.supportShare}% of pupils. Help given by the school without a plan` },
          ]}
        />
      </Panel>

      <Panel
        id="h-edus-plans" title="Plans are rising quickly"
        lead={`There were ${n(e.plans)} education, health and care plans in January 2026, ${e.plansChangePct}% more than a year earlier. That is the biggest yearly rise since 2014.`}
        sources={[SOURCES.ehc]}
      >
        <Stats
          accent="#0F766E"
          items={[
            { value: n(e.newPlans2025), label: "New plans issued in 2025", note: `${e.newPlansChangePct}% more than in 2024` },
            { value: `${e.within20Weeks}%`, label: "Issued within the 20-week legal limit", note: "Of new plans, excluding exceptions" },
          ]}
        />
        <p style={para}>Councils must decide whether to issue a plan within 20 weeks of a request. Fewer than half were issued in time, which is one reason parents can wait a long time for support. </p>
      </Panel>
    </div>
  );
}

function University() {
  const u = UNIVERSITY;
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

      <Panel
        id="h-eduu-repay" title="When graduates repay"
        lead={`Repayment is ${u.rate}% of income above a threshold, taken through pay, so it works more like a tax than a debt. The threshold depends on which plan a person is on, which depends on when they started.`}
        sources={[SOURCES.repay]}
      >
        <BarRows
          label="Income a person must earn before repaying, by loan plan" accent="#1D4ED8" max={40000}
          rows={u.thresholds.map((t) => ({ label: t.plan, value: t.value, text: `${money(t.value)} a year${t.rate ? ` (${t.rate}%)` : ""}` }))}
        />
        <p style={para}>Plan 1 and Plan 2 are for older loans, Plan 4 is for Scotland, and Plan 5 is for people who started in England from August 2023. Postgraduate loans are repaid at {u.thresholds[4].rate}% above {money(u.thresholds[4].value)}. These are the thresholds GOV.UK lists now and the Government can change them.</p>
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
  return (
    <div>
      <Panel id="h-edua-intro" accent={ACCENT} title="The arguments" lead="Figures can show who does well and where support is stretched. They cannot say how much to spend or who should pay, which depends on what people value. These are the arguments people make, not our view." />
      <Arg
        id="h-edua-gap" title="Closing the attainment gap"
        shows={`The gap in Attainment 8 was ${a.attainment8Gap} points in ${a.year}, against ${a.attainment8Gap201819} in 2018/19.`}
        sLabel="People who want more targeted funding say" cLabel="People who are more cautious say"
        supporters={["Children from poorer homes start school behind and the gap widens, so money that follows disadvantaged pupils, such as the pupil premium, and help with reading and maths early on, does the most good."]}
        critics={["Schools in the same area with similar pupils get quite different results, which suggests teaching and school leadership matter as much as money. Targeting by free school meals also misses poor households that do not claim.", "Results also depend on things schools do not control, such as housing, health and family income, so some say the gap will not close without action outside schools."]}
        sources={[SOURCES.ks4]}
      />
      <Arg
        id="h-edua-send" title="Special needs support"
        shows={`Education, health and care plans rose ${SEND.plansChangePct}% in a year to ${n(SEND.plans)}, and ${SEND.within20Weeks}% of new plans were issued within 20 weeks.`}
        sLabel="People who want the plan system kept say" cLabel="People who want it changed say"
        supporters={["A plan is a legal right to support, and many parents say they only get help after a fight. Weakening it would leave children with fewer protections at a time when need is growing."]}
        critics={["The system is under strain, with long waits and rising costs for councils, so it needs reform, such as more support in ordinary schools earlier. Others fear this could be used to cut support."]}
        sources={[SOURCES.ehc, SOURCES.sen]}
      />
      <Arg
        id="h-edua-fees" title="Fees and loans"
        shows={`Fees are up to ${money(UNIVERSITY.fee2627)} a year in 2026/27, and £${UNIVERSITY.balanceBn}bn is owed on loans in England.`}
        sLabel="People who want fees kept or raised say" cLabel="People who want them cut or ended say"
        supporters={["Graduates earn more on average and repay only when they earn above the threshold, so the cost is shared with people who do not go. Without fees, universities would depend on a government that has many other calls on its money."]}
        critics={["Debt of this size is a heavy burden on young people, the interest adds to it, and some graduates repay for most of their working lives. Others argue that the cost should be met by tax, since the public gains from an educated workforce."]}
        sources={[SOURCES.fees, SOURCES.loans, SOURCES.repay]}
      />
    </div>
  );
}

function About() {
  return (
    <div>
      <Panel id="h-edux-src" title="Where the figures come from" lead={`Checked on ${CHECKED}.`}>
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          {Object.values(SOURCES).map((s) => (
            <li key={s.url} style={li}><a href={s.url} target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontFamily: FONT_BODY, fontWeight: 600 }}>{s.label}<span className="sr-only"> (opens in a new tab)</span></a></li>
          ))}
        </ul>
      </Panel>
      <Panel id="h-edux-limits" title="What to bear in mind">
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          <li style={li}><strong style={strong}>England only.</strong> Scotland, Wales and Northern Ireland set their own exams, funding and fees, so these figures are not for the whole UK.</li>
          <li style={li}><strong style={strong}>Latest releases.</strong> Each figure is from the most recent release of its series, and each series covers a different year.</li>
          <li style={li}><strong style={strong}>Not covered.</strong> School funding per pupil, the early years, further education and apprenticeships, how England compares with other countries, and what happens to graduates after they leave.</li>
        </ul>
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
