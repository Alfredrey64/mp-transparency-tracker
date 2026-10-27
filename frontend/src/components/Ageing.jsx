import { useRef, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING } from "../theme";
import { pillStyle } from "../lib/onsStyles";
import { PageHeader } from "./shared";
import { IconPension } from "./icons";
import { BarRows, Caution, Legend, PageToggles, Panel, StackBars, Stats, Takeaways, TrendExplorer } from "./insight";
import { CHECKED, LIFE_STAGES, OBR_LONG_RUN, PENSION_AGE, PENSION_RATES, POPULATION, SET_BY, SOURCES, STATE_PENSION } from "../data/ageing";
import { A, countSetBy, indexed, rises, shareOfEarnings, whatIf } from "../lib/ageing";
import { D as INEQ, financial, povertyFacts } from "../lib/inequality";
import { ageText, formatDate, statePensionAge } from "../lib/pensionAge";
import { financialYear, para, strong } from "../lib/insightStyle";

// Ageing and pensions: the State Pension and who gets it, what it costs, how the population is ageing, and the arguments.
// One page with a row of toggles; the address carries the toggle (/ageing/cost).

const ACCENT = "#C0561F";
const BLUE = "#1D4ED8";
const li = { margin: "0 0 8px", paddingLeft: 2 };
const n = (v) => v.toLocaleString("en-GB");
const gbp = (v) => `£${v.toFixed(2)}`;

const TABS = [
  { key: "overview", label: "Overview", blurb: "The main figures, how they have changed, and how to read them.", colour: "#C0561F" },
  { key: "pension", label: "The State Pension", blurb: "What it pays, how it went up, whether it kept pace, and when you can claim it.", colour: "#1D4ED8" },
  { key: "cost", label: "What it costs", blurb: "How much the State Pension takes from public spending, now and in the future.", colour: "#0F766E" },
  { key: "people", label: "An ageing population", blurb: "How many older people there are, what that means for the workforce, and pensioner poverty.", colour: "#7A5AF0" },
  { key: "arguments", label: "The arguments", blurb: "The triple lock, the pension age and who pays, set out fairly.", colour: "#D6455D" },
  { key: "about", label: "Sources", blurb: "Where each figure comes from and what it leaves out.", colour: "#6B7280" },
];
const KEYS = new Set(TABS.map((t) => t.key));
const parse = (param) => { const first = String(param ?? "").split("/")[0]; return KEYS.has(first) ? first : "overview"; };

const yearly = Math.round(STATE_PENSION.fullNewWeekly * 52);
const growth = (a) => Math.round((a[a.length - 1] / a[0] - 1) * 100);

function Overview({ onPick }) {
  const pov = povertyFacts();
  const idx = indexed();
  const share = shareOfEarnings();
  const first = PENSION_RATES[0];
  const povSeries = INEQ.poverty.pensioners.ahc;
  const link = { marginTop: 12, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink, background: "transparent", border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: "8px 16px", cursor: "pointer" };
  return (
    <div>
      <Takeaways
        accent={ACCENT}
        items={[
          `The full new State Pension is ${gbp(STATE_PENSION.fullNewWeekly)} a week, about £${n(yearly)} a year. It was ${gbp(first.weekly)} when it started in 2016, a rise of ${growth(A.pension)}%.`,
          `Over the same years prices rose ${growth(A.pricesIndex)}% and average weekly earnings ${growth(A.earningsWeekly)}%, on our calculation, so the pension has kept ahead of both.`,
          `It cost £${STATE_PENSION.spending2425Bn} billion in 2024-25, about ${STATE_PENSION.spending2425PctGdp}% of the economy. The Office for Budget Responsibility's July 2026 baseline has that rising to about ${OBR_LONG_RUN.withTripleLock}% over the long run with the triple lock, or about ${OBR_LONG_RUN.withEarnings}% if it rose with earnings.`,
          "Under current law the State Pension age rises to 67 between 2026 and 2028 and to 68 between 2044 and 2046.",
          `For every 1,000 people of working age there were ${POPULATION.dependency.y2022} of pension age in 2022. The ONS projects ${POPULATION.dependency.y2047} by 2047.`,
        ]}
      />

      <Panel
        id="h-age-main" accent={ACCENT} title="The main figures"
        lead="The State Pension is one of the largest items of government spending. These are the figures that matter most, with where each comes from."
        sources={[SOURCES.newPension, SOURCES.obrFrs2025, SOURCES.onsProjections, SOURCES.hbai]}
      >
        <Stats
          accent={ACCENT}
          items={[
            { value: gbp(STATE_PENSION.fullNewWeekly), label: "A week, the full new State Pension", note: `About £${n(yearly)} a year. Not everyone gets the full amount`, spark: A.pension },
            { value: `£${STATE_PENSION.spending2425Bn}bn`, label: "Spent on the State Pension in 2024-25", note: `About ${STATE_PENSION.spending2425PctGdp}% of the economy` },
            { value: `${Math.round(pov.pensioners.ahc)}%`, label: "Of pensioners in relative poverty after housing costs", note: `${pov.pensioners.millions.ahc} million people, in ${financial(pov.latest)}`, spark: povSeries },
            { value: `${POPULATION.dependency.y2047}`, label: "People over pension age for every 1,000 of working age", note: `Projected for 2047, against ${POPULATION.dependency.y2022} in 2022` },
          ]}
        />
      </Panel>

      <Panel id="h-age-trends" accent={ACCENT} title="How the pension has changed" lead="Pick a view. The pension is the full new State Pension each April, from its start in 2016." sources={[SOURCES.rates, SOURCES.onsPrices]}>
        <TrendExplorer
          accent={ACCENT}
          options={[
            { key: "weekly", label: "Pounds a week", lines: [{ name: "Full new State Pension", years: A.years, values: A.pension }], offset: 0.25, labelFn: (y) => `April ${y}`, yFormat: (v) => `£${Math.round(v)}`, captionFormat: gbp, change: "percent", from: 2016, to: 2027 },
            { key: "kept", label: "Against prices and earnings", lines: [{ name: "State Pension", color: ACCENT, years: idx.years, values: idx.pension }, { name: "Average weekly earnings", color: BLUE, years: idx.years, values: idx.earnings }, { name: "Consumer prices", color: "#6B7280", years: idx.years, values: idx.prices }], offset: 0.25, labelFn: (y) => `April ${y}`, yFormat: (v) => `${Math.round(v)}`, change: "points", from: 2016, to: 2027, note: "April 2016 = 100. Our calculation from ONS prices and earnings and the State Pension rates, so each line shows growth since the start." },
            { key: "share", label: "Share of average earnings", lines: [{ name: "Pension as a share of average weekly earnings", years: A.years, values: share }], offset: 0.25, labelFn: (y) => `April ${y}`, yFormat: (v) => `${v}%`, change: "pp", from: 2016, to: 2027, note: "The full weekly pension divided by average weekly earnings of all employees, including part-timers, so it is lower than the pension as a share of a full-time wage would suggest. Our calculation." },
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

// "When can I claim?": a date of birth in, the State Pension age and date out, under current law.
function ClaimDate() {
  const [value, setValue] = useState("");
  const [today] = useState(() => new Date());
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const dob = parts ? { year: Number(parts[1]), month: Number(parts[2]), day: Number(parts[3]) } : null;
  const valid = dob && dob.year >= 1900 && dob.year <= today.getFullYear();
  const result = valid ? statePensionAge(dob) : null;
  let message = "Enter a date of birth to see when the State Pension age is reached.";
  if (result?.kind === "earlier") message = "That date of birth is before October 1954. The State Pension age has already been reached, at 60 to 65 depending on the year and sex.";
  if (result?.kind === "date") {
    const d = result.date;
    const reached = new Date(d.year, d.month - 1, d.day) <= today;
    const yearsAway = d.year - today.getFullYear();
    message = `${reached ? "State Pension age was reached on" : "State Pension age is reached on"} ${formatDate(d)}, at ${ageText(result)}${reached ? "." : yearsAway > 0 ? `, about ${yearsAway} year${yearsAway === 1 ? "" : "s"} from now.` : ", later this year or next."}`;
  }
  return (
    <div>
      <label htmlFor="age-dob" style={{ display: "block", fontFamily: FONT_BODY, fontSize: 14.5, fontWeight: 700, color: COLORS.ink }}>Date of birth</label>
      <input id="age-dob" type="date" value={value} min="1900-01-01" max={today.toISOString().slice(0, 10)} onChange={(e) => setValue(e.target.value)} style={{ marginTop: 6, minHeight: 44, padding: "8px 12px", borderRadius: 12, border: `1.5px solid ${COLORS.hairline}`, background: COLORS.paperCard, color: COLORS.ink, fontFamily: FONT_BODY, fontSize: 16, maxWidth: "100%" }} />
      <p role="status" style={{ ...para, marginTop: 12, fontSize: 16, color: COLORS.ink }}>{message}</p>
      <p style={{ ...para, fontSize: 13 }}>This follows the dates in current law, the same for men and women. The date for those born from April 1977 could change after a future review, and the official <a href={SOURCES.spaCalculator.url} target="_blank" rel="noreferrer" style={{ color: COLORS.inkSoft }}>GOV.UK calculator<span className="sr-only"> (opens in a new tab)</span></a> is the one to check before you plan.</p>
    </div>
  );
}

function Pension() {
  const r = rises();
  const counts = countSetBy();
  const w = whatIf();
  const first = PENSION_RATES[0];
  return (
    <div>
      <Panel
        id="h-agep-amount" accent={BLUE} title="What it pays"
        lead={`The full new State Pension is ${gbp(STATE_PENSION.fullNewWeekly)} a week. It is for people who reach State Pension age on or after 6 April 2016, and what a person gets depends on how many years of National Insurance contributions or credits they have.`}
        sources={[SOURCES.newPension, SOURCES.taxes]}
      >
        <p style={para}>That comes to about £{n(yearly)} a year, just under the £{n(STATE_PENSION.personalAllowance)} a person can receive before paying Income Tax. The pension counts as income for tax, so someone with a small pension from work as well can start to pay.</p>
      </Panel>

      <Panel
        id="h-agep-triple" title="The triple lock: what decided each rise"
        lead={`Each April the State Pension goes up by the highest of three things: average earnings growth, price inflation, or ${STATE_PENSION.upratingFloor}%. Here is each rise since the start, and which measure was highest.`}
        sources={[SOURCES.rates, SOURCES.newPension]}
      >
        <Legend items={Object.values(SET_BY).map((s) => ({ name: s.label, colour: s.colour }))} />
        <BarRows
          label="Rise in the full new State Pension each April, and what set it" accent={BLUE} max={12}
          rows={r.map((x) => ({ label: `April ${x.year}`, note: `${SET_BY[x.setBy].label}, ${gbp(x.weekly)} a week`, value: x.rise, text: `${x.rise.toFixed(1)}%`, tone: SET_BY[x.setBy].colour }))}
        />
        <p style={para}>Earnings set {counts.earnings} of the {r.length} rises, prices {counts.prices} and the {STATE_PENSION.upratingFloor}% minimum {counts.minimum}. In April 2022 the earnings figure was set aside because pay was distorted by the pandemic, so prices decided. In April 2023 prices rose 10.1% and so did the pension, its biggest rise.</p>
      </Panel>

      <Panel
        id="h-agep-whatif" title="What if it had followed something else?"
        lead={`The full pension was ${gbp(first.weekly)} in 2016. This is what it would be now if it had instead risen only with prices, only with earnings, or by the ${STATE_PENSION.upratingFloor}% minimum every year.`}
        sources={[SOURCES.rates, SOURCES.onsPrices]}
      >
        <BarRows
          label="The full State Pension in 2026 under different rules, pounds a week" accent={BLUE} max={260}
          rows={[
            { label: "What it is (triple lock)", value: w.actual, text: gbp(w.actual), tone: ACCENT, strong: true },
            { label: "If it had followed earnings", value: w.earnings, text: gbp(w.earnings), tone: BLUE },
            { label: "If it had followed prices", value: w.prices, text: gbp(w.prices), tone: "#6B7280" },
            { label: `If it had risen ${STATE_PENSION.upratingFloor}% a year`, value: w.minimum, text: gbp(w.minimum), tone: "#9CA3AF" },
          ]}
        />
        <p style={para}>The triple lock has added {gbp(w.actual - w.earnings)} a week more than earnings alone would have, and {gbp(w.actual - w.prices)} more than prices alone, since 2016.</p>
        <Caution title="Our calculation, not an official one">The lock itself uses September's inflation and earnings growth over May to July, so these figures are close but not exact. Prices are the ONS consumer price index for April, and earnings are average weekly earnings over February to April.</Caution>
      </Panel>

      <Panel
        id="h-agep-age" title="When can you claim?"
        lead="The State Pension age is rising. Enter a date of birth to see when it is reached under current law."
        sources={[SOURCES.spaTimetable, SOURCES.spaCalculator]}
      >
        <ClaimDate />
        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 15.5, fontWeight: 700, color: COLORS.ink, margin: "20px 0 8px" }}>The timetable</h3>
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
          {PENSION_AGE.map((p) => (
            <li key={p.when} style={{ padding: "12px 16px", borderRadius: 14, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${BLUE}` }}>
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
            { label: `If it rose with earnings, ${o.reportDate}`, value: o.withEarnings, text: `about ${o.withEarnings}%`, tone: BLUE },
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
  const [mode, setMode] = useState("numbers");
  const pov = povertyFacts();
  const years = Object.keys(LIFE_STAGES).map(Number);
  const colours = { children: "#C7871A", working: "#0F766E", pensionable: ACCENT };
  const names = { children: "Under 16", working: "Working age", pensionable: "State Pension age and over" };
  const rows = years.map((y) => {
    const s = LIFE_STAGES[y];
    const total = s.children + s.working + s.pensionable;
    const val = (v) => (mode === "numbers" ? Math.round(v * 10) / 10 : Math.round((v / total) * 1000) / 10);
    return { label: `Mid-${y}`, text: `${Math.round(total * 10) / 10} million people`, parts: Object.keys(colours).map((k) => ({ name: names[k], value: val(s[k]), colour: colours[k] })) };
  });
  const povOpts = ["ahc", "bhc"].map((basis) => ({
    key: basis, label: basis === "ahc" ? "After housing costs" : "Before housing costs",
    lines: [
      { name: "Pensioners", color: "#C7871A", years: INEQ.poverty.years, values: INEQ.poverty.pensioners[basis] },
      { name: "Working-age adults", color: "#0E9AA7", years: INEQ.poverty.years, values: INEQ.poverty.workingAge[basis] },
      { name: "Children", color: "#D6455D", years: INEQ.poverty.years, values: INEQ.poverty.children[basis] },
    ],
    offset: 0.25, labelFn: financialYear, yFormat: (v) => `${Math.round(v)}%`, change: "pp", breaks: [2021], governments: true,
  }));
  return (
    <div>
      <Panel
        id="h-agepo-stages" accent="#7A5AF0" title="Who is of working age, and who is not"
        lead="The ONS projects the UK population by age. The number of people of State Pension age grows faster than any other group, even after allowing for the pension age rising."
        sources={[SOURCES.onsProjections]}
      >
        <div role="group" aria-label="Show as" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          <button type="button" aria-pressed={mode === "numbers"} onClick={() => setMode("numbers")} style={pillStyle(mode === "numbers")}>Millions of people</button>
          <button type="button" aria-pressed={mode === "share"} onClick={() => setMode("share")} style={pillStyle(mode === "share")}>Share of the population</button>
        </div>
        <StackBars
          rows={rows} label="UK population by life stage, projected" format={(v) => (mode === "numbers" ? `${v}m` : `${v}%`)}
          legend={Object.keys(colours).map((k) => ({ name: names[k], colour: colours[k] }))}
        />
        <p style={para}>Pensionable age is State Pension age and over, and it takes the planned rises to 67 and 68 into account. The number of children in 2047 is the total of {p.total2047} million less the other two groups, as the ONS says it stays close to its 2032 level.</p>
      </Panel>

      <Panel
        id="h-agepo-dep" title="More older people for every worker"
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
        <p style={para}>The number of people aged 85 and over is projected to rise from {p.over85.y2022} million in 2022 ({p.over85.share2022}% of the population) to {p.over85.y2047} million by 2047 ({p.over85.share2047}%), while the number of children falls from {p.children.y2022} million to {p.children.y2032} million by 2032.</p>
      </Panel>

      <Panel id="h-agepo-pov" title="Older people and poverty" lead={`${Math.round(pov.pensioners.ahc)}% of pensioners were in relative poverty after housing costs in ${financial(pov.latest)}, against ${Math.round(pov.pensioners.ahcFirst)}% in the first year of the series.`} sources={[SOURCES.hbai]}>
        <TrendExplorer accent="#C7871A" options={povOpts} height={280} />
        <Caution title="A break in the figures">From 2021/22 the survey is combined with tax and benefit records, so figures before and after the thin line are not directly comparable.</Caution>
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
  const w = whatIf();
  return (
    <div>
      <Panel id="h-agea-intro" accent={ACCENT} title="The arguments" lead="Figures can show what the pension costs and who relies on it. They cannot say what is fair between older and younger people, which depends on what people value. These are the arguments people make, not our view." />
      <Arg
        id="h-agea-lock" title="Should the triple lock stay?"
        shows={`The pension rises each year by the highest of earnings, prices or ${STATE_PENSION.upratingFloor}%. Since 2016 it has risen ${growth(A.pension)}%, against ${growth(A.earningsWeekly)}% for earnings and ${growth(A.pricesIndex)}% for prices on our calculation, about ${gbp(w.actual - w.earnings)} a week more than earnings alone. The OBR's July 2026 baseline, with the triple lock, is about ${OBR_LONG_RUN.withTripleLock}% of the economy in the long run, against about ${OBR_LONG_RUN.withEarnings}% if it rose with earnings.`}
        sLabel="People who want it kept say" cLabel="People who want it changed say"
        supporters={["Older people have little way to earn more, and many rely on the State Pension for most of their income. The lock stops it falling behind prices or wages, and gives people a guarantee they can plan around."]}
        critics={["A rule that always picks the highest figure means the pension can grow faster than the wages that pay for it, and the extra cost falls on younger workers. Some would link it to earnings alone, or replace it with a different guarantee."]}
        sources={[SOURCES.obrFrs2025, SOURCES.obrFrs2026, SOURCES.newPension, SOURCES.rates]}
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
      <Panel id="h-agex-src" title="Where the figures come from" lead={`Checked on ${CHECKED}. The comparison with prices and earnings reads from ONS data saved on ${A.built}.`}>
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          {Object.values(SOURCES).map((s) => (
            <li key={s.url} style={li}><a href={s.url} target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontFamily: FONT_BODY, fontWeight: 600 }}>{s.label}<span className="sr-only"> (opens in a new tab)</span></a></li>
          ))}
        </ul>
      </Panel>
      <Panel id="h-agex-limits" title="What to bear in mind">
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          <li style={li}><strong style={strong}>Projections are not forecasts.</strong> They show what would happen on stated assumptions and are revised every year.</li>
          <li style={li}><strong style={strong}>Our own calculations.</strong> The comparison with prices and earnings, the share of earnings and the "what if" bars are worked out here from the pension rates and ONS figures. They are close to, but not exactly, how the triple lock is set.</li>
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
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: PAGE_PADDING }}>
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
