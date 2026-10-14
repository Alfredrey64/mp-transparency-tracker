import { useRef, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconPension } from "./icons";
import { BarRows, Caution, PageToggles, Panel, Stats } from "./insight";
import { CHECKED, OBR_LONG_RUN, PENSION_AGE, POPULATION, SOURCES, STATE_PENSION } from "../data/ageing";
import { financial, povertyFacts } from "../lib/inequality";
import { para, strong } from "../lib/insightStyle";

// Ageing and pensions: the State Pension and who gets it, what it costs, how the population is ageing, and the arguments.
// One page with a row of toggles; the address carries the toggle (/ageing/cost).

const ACCENT = "#C0561F";
const li = { margin: "0 0 8px", paddingLeft: 2 };
const n = (v) => v.toLocaleString("en-GB");

const TABS = [
  { key: "overview", label: "Overview", blurb: "The main figures and how to read them.", colour: "#C0561F" },
  { key: "pension", label: "The State Pension", blurb: "What it pays, how it goes up, and when you can claim it.", colour: "#1D4ED8" },
  { key: "cost", label: "What it costs", blurb: "How much the State Pension takes from public spending, now and in the future.", colour: "#0F766E" },
  { key: "people", label: "An ageing population", blurb: "How many older people there are, and what that means for the workforce.", colour: "#7A5AF0" },
  { key: "arguments", label: "The arguments", blurb: "The triple lock, the pension age and who pays, set out fairly.", colour: "#D6455D" },
  { key: "about", label: "Sources", blurb: "Where each figure comes from and what it leaves out.", colour: "#6B7280" },
];
const KEYS = new Set(TABS.map((t) => t.key));
const parse = (param) => { const first = String(param ?? "").split("/")[0]; return KEYS.has(first) ? first : "overview"; };

const yearly = Math.round(STATE_PENSION.fullNewWeekly * 52);

function Overview({ onPick }) {
  const pov = povertyFacts();
  const link = { marginTop: 12, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink, background: "transparent", border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: "8px 16px", cursor: "pointer" };
  return (
    <div>
      <Panel
        id="h-age-main" accent={ACCENT} title="The main figures"
        lead="The State Pension is one of the largest items of government spending. These are the figures that matter most, with where each comes from."
        sources={[SOURCES.newPension, SOURCES.obrFrs2025, SOURCES.onsProjections, SOURCES.hbai]}
      >
        <Stats
          accent={ACCENT}
          items={[
            { value: `£${STATE_PENSION.fullNewWeekly.toFixed(2)}`, label: "A week, the full new State Pension", note: `About £${n(yearly)} a year. Not everyone gets the full amount` },
            { value: `£${STATE_PENSION.spending2425Bn}bn`, label: "Spent on the State Pension in 2024-25", note: `About ${STATE_PENSION.spending2425PctGdp}% of the economy` },
            { value: `${Math.round(pov.pensioners.ahc)}%`, label: "Of pensioners in relative poverty after housing costs", note: `${pov.pensioners.millions.ahc} million people, in ${financial(pov.latest)}` },
            { value: `${POPULATION.dependency.y2047}`, label: "People over pension age for every 1,000 of working age", note: `Projected for 2047, against ${POPULATION.dependency.y2022} in 2022` },
          ]}
        />
      </Panel>
      <Panel id="h-age-where" title="Where to look next">
        <p style={para}>People argue about three things in particular: how fast the pension should rise, how old you should be to claim it, and how a smaller working-age population will pay for it.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={() => onPick("pension")} style={link}>The State Pension</button>
          <button type="button" onClick={() => onPick("cost")} style={link}>What it costs</button>
          <button type="button" onClick={() => onPick("people")} style={link}>An ageing population</button>
        </div>
      </Panel>
    </div>
  );
}

function Pension() {
  return (
    <div>
      <Panel
        id="h-agep-amount" accent="#1D4ED8" title="What it pays"
        lead={`The full new State Pension is £${STATE_PENSION.fullNewWeekly.toFixed(2)} a week. It is for people who reach State Pension age on or after 6 April 2016, and what a person gets depends on how many years of National Insurance contributions or credits they have.`}
        sources={[SOURCES.newPension, SOURCES.taxes]}
      >
        <p style={para}>That comes to about £{n(yearly)} a year, just under the £{n(STATE_PENSION.personalAllowance)} a person can receive before paying Income Tax. The pension counts as income for tax, so someone with a small pension from work as well can start to pay.</p>
      </Panel>
      <Panel
        id="h-agep-triple" title="The triple lock"
        lead={`Each April the State Pension goes up by the highest of three things: average earnings growth, price inflation, or ${STATE_PENSION.upratingFloor}%. This is known as the triple lock.`}
        sources={[SOURCES.newPension]}
      >
        <p style={para}>Because it always takes the highest, the pension can rise faster than earnings over time, and it cannot fall behind prices. Its supporters see that as protection. Its critics see a cost that keeps growing. The arguments tab sets out both.</p>
      </Panel>
      <Panel
        id="h-agep-age" title="When you can claim"
        lead="The State Pension age is rising. These are the dates in current law."
        sources={[SOURCES.spaTimetable]}
      >
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
          {PENSION_AGE.map((p) => (
            <li key={p.when} style={{ padding: "12px 16px", borderRadius: 14, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: "4px solid #1D4ED8" }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15.5, fontWeight: 700, color: COLORS.ink }}>{p.when}</div>
              <p style={{ ...para, marginTop: 3, fontSize: 14.5 }}>{p.text}</p>
            </li>
          ))}
        </ol>
        <Caution title="A reported change that is not confirmed">In July 2026 there were reports that the Treasury was assuming a pension age of 68 sooner, between 2037 and 2039. The Department for Work and Pensions said it had not announced any change of policy, so the dates above are the ones in law.</Caution>
      </Panel>
    </div>
  );
}

function Cost() {
  const o = OBR_LONG_RUN;
  return (
    <div>
      <Panel
        id="h-agec-now" accent="#0F766E" title="What it costs now"
        lead={`The State Pension cost £${STATE_PENSION.spending2425Bn} billion in 2024-25, about ${STATE_PENSION.spending2425PctGdp}% of the economy. It is paid for by taxes and National Insurance from people who are working now, not from a pot of savings.`}
        sources={[SOURCES.obrFrs2025]}
      />
      <Panel
        id="h-agec-future" title="What it could cost"
        lead="The Office for Budget Responsibility, which makes the official forecasts, publishes a long-run projection each summer. The answer depends heavily on how the pension is uprated."
        sources={[SOURCES.obrFrs2025, SOURCES.obrFrs2026]}
      >
        <BarRows
          label="State Pension spending as a share of the economy, OBR projections" accent="#0F766E" max={10}
          rows={[
            { label: "Today", value: o.now, text: `about ${o.now}%` },
            { label: `If it rose with earnings, ${o.reportDate}`, value: o.withEarnings, text: `about ${o.withEarnings}%`, tone: "#1D4ED8" },
            { label: `With the triple lock, ${o.reportDate}`, value: o.withTripleLock, text: `about ${o.withTripleLock}%`, tone: ACCENT },
          ]}
        />
        <p style={para}>These are projections over around fifty years, not forecasts of what will happen. In July 2025 the OBR put the figure at 7.7% by the early 2070s, and said the triple lock explained 1.6 points of the 2.7 point rise. Its July 2026 baseline was higher, at about 9%.</p>
        <Caution title="Long projections move">Small changes to assumptions about births, migration, earnings or health move a fifty-year figure a long way. The numbers are revised every year.</Caution>
      </Panel>
    </div>
  );
}

function People() {
  const p = POPULATION;
  const pov = povertyFacts().pensioners;
  return (
    <div>
      <Panel
        id="h-agepo-dep" accent="#7A5AF0" title="More older people for every worker"
        lead="The old-age dependency ratio is the number of people over State Pension age for every 1,000 people of working age. The Office for National Statistics projects it to keep rising."
        sources={[SOURCES.onsProjections]}
      >
        <BarRows
          label="People over State Pension age per 1,000 people of working age" accent="#7A5AF0" max={320}
          rows={[
            { label: "2022", value: p.dependency.y2022, text: `${p.dependency.y2022}` },
            { label: "2032", value: p.dependency.y2032, text: `${p.dependency.y2032}` },
            { label: "2047", value: p.dependency.y2047, text: `${p.dependency.y2047}` },
          ]}
        />
        <p style={para}>The number of people aged 85 and over is projected to rise from {p.over85.y2022} million in 2022 to {p.over85.y2047} million by 2047, while the number of children falls from {p.children.y2022} million to {p.children.y2032} million by 2032.</p>
      </Panel>
      <Panel id="h-agepo-pov" title="Older people and poverty" sources={[SOURCES.hbai]}>
        <p style={para}>{Math.round(pov.ahc)}% of pensioners were in relative poverty after housing costs in {financial(povertyFacts().latest)}, against {Math.round(pov.ahcFirst)}% in the first year of the series. The Inequality page shows it by year, next to children and working-age adults.</p>
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
  return (
    <div>
      <Panel id="h-agea-intro" accent={ACCENT} title="The arguments" lead="Figures can show what the pension costs and who relies on it. They cannot say what is fair between older and younger people, which depends on what people value. These are the arguments people make, not our view." />
      <Arg
        id="h-agea-lock" title="Should the triple lock stay?"
        shows={`The pension rises each year by the highest of earnings, prices or ${STATE_PENSION.upratingFloor}%. The OBR's July 2026 baseline, with the triple lock, is about ${OBR_LONG_RUN.withTripleLock}% of the economy in the long run, against about ${OBR_LONG_RUN.withEarnings}% if it rose with earnings.`}
        sLabel="People who want it kept say" cLabel="People who want it changed say"
        supporters={["Older people have little way to earn more, and many rely on the State Pension for most of their income. The lock stops it falling behind prices or wages, and gives people a guarantee they can plan around."]}
        critics={["A rule that always picks the highest figure means the pension can grow faster than the wages that pay for it, and the extra cost falls on younger workers. Some would link it to earnings alone, or replace it with a different guarantee."]}
        sources={[SOURCES.obrFrs2025, SOURCES.obrFrs2026, SOURCES.newPension]}
      />
      <Arg
        id="h-agea-age" title="Should the pension age rise further?"
        shows="Under current law the age rises to 67 between 2026 and 2028 and to 68 between 2044 and 2046."
        sLabel="People who want it to rise say" cLabel="People who want it held say"
        supporters={["People are living longer, so the number of years spent on a pension has grown. A higher age is one way of sharing the cost, as an alternative to higher taxes or a smaller pension."]}
        critics={["Life expectancy has not risen equally. People in poorer areas, and in physical jobs, tend to live fewer years and have fewer years in good health, so a higher age asks the most of people with the least time."]}
        sources={[SOURCES.spaTimetable, SOURCES.onsProjections]}
      />
      <Arg
        id="h-agea-fair" title="Who should pay?"
        shows={`The old-age dependency ratio is projected to rise from ${POPULATION.dependency.y2022} to ${POPULATION.dependency.y2047} per 1,000 working-age people by 2047.`}
        sLabel="People who stress fairness to younger people say" cLabel="People who stress older people's claim say"
        supporters={["Younger workers face high housing costs and student debt, and they also pay for today's pensions. Some point to the wealth held by older households and say pensions should be taxed more, or that the better off should receive less."]}
        critics={["People who retire now paid National Insurance for decades on the understanding that it would fund their pension, and the State Pension itself is not large. Means-testing would penalise people who saved."]}
        sources={[SOURCES.onsProjections, SOURCES.obrFrs2025]}
      />
    </div>
  );
}

function About() {
  return (
    <div>
      <Panel id="h-agex-src" title="Where the figures come from" lead={`Checked on ${CHECKED}.`}>
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          {Object.values(SOURCES).map((s) => (
            <li key={s.url} style={li}><a href={s.url} target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontFamily: FONT_BODY, fontWeight: 600 }}>{s.label}<span className="sr-only"> (opens in a new tab)</span></a></li>
          ))}
        </ul>
      </Panel>
      <Panel id="h-agex-limits" title="What to bear in mind">
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          <li style={li}><strong style={strong}>Projections are not forecasts.</strong> They show what would happen on stated assumptions and are revised every year.</li>
          <li style={li}><strong style={strong}>Not covered.</strong> Workplace and private pensions, the older State Pension, Pension Credit and other benefits for older people, social care, and health spending, which rises with age.</li>
        </ul>
      </Panel>
    </div>
  );
}

export default function Ageing({ param }) {
  const [tab, setTab] = useState(() => parse(param));
  const [seen, setSeen] = useState(param);
  const ref = useRef(null);
  if (param !== seen) { setSeen(param); setTab(parse(param)); }
  function go(next) {
    const moved = next !== tab;
    setTab(next);
    window.history.replaceState(null, "", next === "overview" ? "#/ageing" : `#/ageing/${next}`);
    if (moved && ref.current && ref.current.getBoundingClientRect().top < 0) ref.current.scrollIntoView({ block: "start" });
  }
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={IconPension} kicker="Britain in numbers" title="Ageing and pensions" subtitle="What the State Pension pays and costs, when you can claim it, how the population is ageing, and the arguments about the triple lock, the pension age and who pays." />
      <div ref={ref} style={{ scrollMarginTop: 12 }}>
        <PageToggles tabs={TABS} current={tab} onPick={go} label="What to look at" idPrefix="age" />
      </div>
      <div key={tab} className="ge-fade" role="tabpanel" id="age-panel" aria-labelledby={`age-tab-${tab}`}>
        {tab === "overview" && <Overview onPick={go} />}
        {tab === "pension" && <Pension />}
        {tab === "cost" && <Cost />}
        {tab === "people" && <People />}
        {tab === "arguments" && <Arguments />}
        {tab === "about" && <About />}
      </div>
    </div>
  );
}
