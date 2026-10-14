import { useRef, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING } from "../theme";
import { pillStyle } from "../lib/onsStyles";
import { PageHeader } from "./shared";
import { IconDefence } from "./icons";
import { BarRows, Caution, PageToggles, Panel, Stats, TimeChart } from "./insight";
import { CHECKED, FORCES, NATO_COUNT, PROMISES, RANKING, SOURCES } from "../data/defence";
import { D, at, last, stayedUnder } from "../lib/defence";
import { para, strong, toPoints, yearLabel } from "../lib/insightStyle";

// Defence: how much the UK spends compared with the past and with others, what it has promised, the armed forces' numbers, and the arguments.
// One page with a row of toggles; the address carries the toggle (/defence/spending).

const ACCENT = "#0F766E";
const li = { margin: "0 0 8px", paddingLeft: 2 };
const n = (v) => v.toLocaleString("en-GB");

const TABS = [
  { key: "overview", label: "Overview", blurb: "The main figures, the promises, and how to read them.", colour: "#0F766E" },
  { key: "spending", label: "Spending", blurb: "Defence spending since 1950, against France, Germany and the United States, and what each person pays.", colour: "#1D4ED8" },
  { key: "people", label: "The armed forces", blurb: "How many people serve, who is joining and leaving.", colour: "#C0561F" },
  { key: "arguments", label: "The arguments", blurb: "Whether to spend more, and what on, set out fairly.", colour: "#D6455D" },
  { key: "about", label: "Sources", blurb: "Where each figure comes from and why the totals differ.", colour: "#6B7280" },
];
const KEYS = new Set(TABS.map((t) => t.key));
const parse = (param) => { const first = String(param ?? "").split("/")[0]; return KEYS.has(first) ? first : "overview"; };

function Overview({ onPick }) {
  const s = D.shareOfGdp;
  const now = last(s.uk);
  const under3 = stayedUnder(s.years, s.uk, 3);
  const nato = NATO_COUNT.find((r) => r.year === 2025);
  return (
    <div>
      <Panel
        id="h-def-main" accent={ACCENT} title="The main figures"
        lead="Defence spending pays for the armed forces, their equipment and bases, the nuclear deterrent, and support for allies. Countries count it a little differently, so the page says whose count each figure is."
        sources={[SOURCES.nato, SOURCES.modBulletin, SOURCES.personnel]}
      >
        <Stats
          accent={ACCENT}
          items={[
            { value: `${nato.value}%`, label: "Of the economy spent on defence in 2025", note: "On NATO's count. The government has promised 2.5% by 2027" },
            { value: "3.5%", label: "NATO's target for 2035", note: "On core defence, plus up to 1.5% more on wider security" },
            { value: RANKING.natoBySpending, label: "Largest spender in NATO in 2024", note: `$${RANKING.natoSpendingBn} billion, behind the United States and Germany` },
            { value: n(FORCES.total), label: "People in the armed forces", note: `${FORCES.date}. ${n(FORCES.trained)} are fully trained` },
          ]}
        />
      </Panel>

      <Panel
        id="h-def-long" title="Defence spending since 1950"
        lead={`Defence took ${s.uk[0].toFixed(1)}% of the UK economy in ${s.years[0]}. It has been below ${3}% since ${under3} and was ${now.toFixed(2)}% in ${last(s.years)}.`}
        sources={[SOURCES.sipri]}
      >
        <TimeChart
          from={1950} to={last(s.years) + 1} yFormat={(v) => `${v}%`} accent={ACCENT}
          lines={[{ name: "UK defence spending", color: ACCENT, points: toPoints(s.years, s.uk, yearLabel) }]}
          ariaLabel={`UK military spending as a share of the economy, ${s.years[0]} to ${last(s.years)}: ${s.uk[0]}% in ${s.years[0]}, ${now}% in ${last(s.years)}.`}
        />
        <button type="button" onClick={() => onPick("spending")} style={{ marginTop: 12, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink, background: "transparent", border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}>
          Compare with other countries
        </button>
      </Panel>

      <Panel id="h-def-promises" title="What has been promised" sources={[SOURCES.commonsLibrary, SOURCES.investmentPlan]}>
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
          {PROMISES.map((p) => (
            <li key={p.when} style={{ padding: "12px 16px", borderRadius: 14, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${ACCENT}` }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15.5, fontWeight: 700, color: COLORS.ink }}>{p.when}</div>
              <p style={{ ...para, marginTop: 3, fontSize: 14.5 }}>{p.text}</p>
            </li>
          ))}
        </ol>
        <p style={{ ...para, fontSize: 13 }}>Checked on {CHECKED}. Targets and plans can change at each Budget and spending review.</p>
      </Panel>
    </div>
  );
}

function Spending() {
  const [governments, setGovernments] = useState(false);
  const s = D.shareOfGdp;
  const yr = last(s.years);
  const real = D.ukRealBillions;
  const gov = D.ukShareOfGovernmentSpending;
  const head = D.ukPerHeadUsd;
  const peakReal = real.values.reduce((a, v, i) => (v > a.v ? { v, y: real.years[i] } : a), { v: 0, y: 0 });
  const line = (key, name, color) => ({ name, color, points: toPoints(s.years, s[key], yearLabel) });
  return (
    <div>
      <Panel
        id="h-defs-compare" accent={ACCENT} title="The UK against France, Germany and the United States"
        lead="Military spending as a share of each country's economy, as SIPRI counts it. Spending was far higher in the Cold War everywhere, and fell after it ended."
        sources={[SOURCES.sipri]}
      >
        <div role="group" aria-label="Chart options" style={{ marginBottom: 10 }}>
          <button type="button" aria-pressed={governments} onClick={() => setGovernments((v) => !v)} style={pillStyle(governments)}>Show who was in government</button>
        </div>
        <TimeChart
          governments={governments} from={1950} to={yr + 1} yFormat={(v) => `${v}%`} accent={ACCENT} height={290}
          lines={[line("uk", "United Kingdom", ACCENT), line("france", "France", "#1D4ED8"), line("germany", "Germany", "#C7871A"), line("usa", "United States", "#D6455D")]}
          ariaLabel={`Military spending as a share of the economy, ${s.years[0]} to ${yr}. In ${yr}: UK ${at({ years: s.years, values: s.uk }, yr)}%, France ${last(s.france)}%, Germany ${last(s.germany)}%, United States ${last(s.usa)}%.`}
        />
        <p style={para}>In {yr} the UK spent <strong style={strong}>{last(s.uk).toFixed(1)}%</strong> of its economy on defence, France {last(s.france).toFixed(1)}%, Germany {last(s.germany).toFixed(1)}% and the United States {last(s.usa).toFixed(1)}%. Germany's spending has risen fastest in recent years. The shading shows who was in government, not what caused a change.</p>
        <Caution title="Different counts">SIPRI's figures differ a little from NATO's and the Ministry of Defence's, which use their own definitions. SIPRI has the UK at {last(s.uk).toFixed(2)}% in {yr}, NATO at about 2.3%. All three agree on the direction.</Caution>
      </Panel>

      <Panel
        id="h-defs-real" title="In pounds and dollars, not shares"
        lead="A share of the economy can fall while spending rises, if the economy grows. This is UK military spending in dollars at 2024 prices, so inflation is taken out."
        sources={[SOURCES.sipri]}
      >
        <TimeChart
          from={1950} to={yr + 1} yFormat={(v) => `$${Math.round(v)}bn`} accent="#1D4ED8"
          lines={[{ name: "UK military spending, billions of dollars at 2024 prices", color: "#1D4ED8", points: toPoints(real.years, real.values, yearLabel) }]}
          ariaLabel={`UK military spending in billions of US dollars at 2024 prices, ${real.years[0]} to ${yr}: ${real.values[0]} in ${real.years[0]}, ${last(real.values)} in ${yr}.`}
        />
        <p style={para}>Spending in real terms was ${peakReal.v}bn in {peakReal.y}, and ${last(real.values)}bn in {yr}. Its share of government spending has fallen from {gov.values[0]}% in {gov.years[0]} to {last(gov.values)}% in {last(gov.years)}, so other things have grown faster.</p>
      </Panel>

      <Panel
        id="h-defs-head" title="What it comes to for each person"
        lead={`SIPRI puts UK military spending at about $${n(last(head.values))} for every person in ${last(head.years)}, in that year's dollars. The Ministry of Defence says its own figure for ${RANKING.year}, $${n(RANKING.perHeadUsd)}, was the highest since 1987.`}
        sources={[SOURCES.sipri, SOURCES.modBulletin]}
      >
        <BarRows
          label="UK military spending per person" accent={ACCENT} max={Math.max(...head.values)}
          rows={[1990, 2000, 2010, 2020, last(head.years)].map((y) => ({ label: String(y), value: at(head, y), text: `$${n(at(head, y))}` }))}
        />
        <p style={para}>These are current dollars, so they are not adjusted for inflation. Poland spends a higher share of its economy than any other NATO member ({RANKING.poland}%), and {RANKING.countriesMeetingGuideline} members met NATO's 2% guideline in {RANKING.year}.</p>
      </Panel>
    </div>
  );
}

function People() {
  const f = FORCES;
  return (
    <div>
      <Panel
        id="h-defp-now" accent={ACCENT} title="Who serves"
        lead={`UK Armed Forces on ${f.date}. Fully trained strength counts people who have finished their training; the rest are still training or are not yet ready to deploy.`}
        sources={[SOURCES.personnel]}
      >
        <Stats
          accent={ACCENT}
          items={[
            { value: n(f.total), label: "All service personnel", note: `Up ${n(f.totalChange)} (1%) in a year, including those in training and reserves` },
            { value: n(f.trained), label: "Fully trained, full-time", note: `Up ${n(f.trainedChange)} (1%) in a year` },
            { value: n(f.reserves), label: "Trained reservists", note: "Part-time, called up when needed" },
          ]}
        />
        <BarRows
          label="Fully trained full-time strength by service" accent={ACCENT} max={80000}
          rows={[
            { label: "Army", value: f.army, text: n(f.army) },
            { label: "Royal Navy and Royal Marines", value: f.navy, text: n(f.navy), tone: "#1D4ED8" },
            { label: "Royal Air Force", value: f.airForce, text: n(f.airForce), tone: "#7A5AF0" },
          ]}
        />
      </Panel>

      <Panel
        id="h-defp-flow" title="Joining and leaving"
        lead="For the 12 months to 30 June 2026, the Ministry of Defence's figures show more people joining the regular forces than leaving."
        sources={[SOURCES.personnel]}
      >
        <Stats
          accent={ACCENT}
          items={[
            { value: n(f.intake), label: "Joined the regular forces", note: "Up 7% on the year before" },
            { value: n(f.outflow), label: "Left the regular forces", note: "Down 7% on the year before" },
            { value: `+${n(f.intake - f.outflow)}`, label: "Joined more than left", note: "Intake has been higher than outflow since late 2025" },
          ]}
        />
        <p style={para}>Recruiting and keeping people has been one of the main concerns about the armed forces in recent years. The latest figures are better than the year before, and the Army is still smaller than it was a decade ago. Whether the improvement lasts is not yet clear.</p>
      </Panel>
    </div>
  );
}

function Arg({ id, title, shows, supporters, critics, sources }) {
  return (
    <Panel id={id} title={title} sources={sources}>
      <div style={{ padding: "10px 14px", borderRadius: 12, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.ink }}>
        <strong>What the figures show.</strong> {shows}
      </div>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 14.5, fontWeight: 700, color: COLORS.ink, margin: "12px 0 4px" }}>People who want more spending say</h3>
      {supporters.map((t) => <p key={t} style={{ ...para, marginTop: 0, fontSize: 14.5 }}>{t}</p>)}
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 14.5, fontWeight: 700, color: COLORS.ink, margin: "12px 0 4px" }}>People who are more cautious say</h3>
      {critics.map((t) => <p key={t} style={{ ...para, marginTop: 0, fontSize: 14.5 }}>{t}</p>)}
    </Panel>
  );
}

function Arguments() {
  const s = D.shareOfGdp;
  return (
    <div>
      <Panel id="h-defa-intro" accent={ACCENT} title="The arguments" lead="Figures can show how much is spent and on what. They cannot say how much is enough, which depends on how dangerous the world is judged to be and what else the money could do. These are the arguments people make, not our view." />
      <Arg
        id="h-defa-more" title="Should the UK spend more?"
        shows={`The UK spent ${last(s.uk).toFixed(1)}% of its economy on defence in ${last(s.years)}, against ${s.uk[s.years.indexOf(1990)].toFixed(1)}% in 1990 and ${s.uk[s.years.indexOf(1980)].toFixed(1)}% in 1980. NATO has agreed 3.5% by 2035.`}
        supporters={[
          "Europe's security has become less certain, the UK's allies expect it to carry its share, and spending was cut a long way after the Cold War. Forces and stocks that took years to run down take years to rebuild.",
          "A stronger defence industry also supports skilled jobs and exports.",
        ]}
        critics={[
          "Every pound spent on defence is a pound not spent on health, schools or welfare, or has to be raised in tax or borrowing, and it is not yet clear how the 3.5% target will be paid for.",
          "The size of a budget is not the same as the strength of the forces. What matters is whether the money is spent well on the right things.",
        ]}
        sources={[SOURCES.sipri, SOURCES.nato, SOURCES.commonsLibrary]}
      />
      <Arg
        id="h-defa-count" title="What counts as defence?"
        shows="NATO's new target has two parts: 3.5% on core defence and up to 1.5% on wider security and resilience. Whether spending on the nuclear deterrent, intelligence, cyber, pensions and aid to Ukraine counts differs between measures."
        supporters={[
          "A broad count is realistic, because modern threats include cyber attacks and attacks on pipelines, cables and power, so resilience is part of defence.",
        ]}
        critics={[
          "A broad count lets governments reach a target by relabelling spending, and it is harder to see whether the armed forces themselves are getting stronger. It matters which count a promise uses.",
        ]}
        sources={[SOURCES.modBulletin, SOURCES.commonsLibrary]}
      />
      <Arg
        id="h-defa-people" title="People and equipment"
        shows={`${n(FORCES.trained)} people are fully trained and serving full-time. More people have joined than left over the last year.`}
        supporters={[
          "A bigger army, navy and air force cannot be bought quickly. Pay, housing and conditions need to improve so that people stay, and equipment programmes need to be delivered on time.",
        ]}
        critics={[
          "Smaller, better-equipped forces and new technology such as drones may give more for the money than larger numbers, and there is a long record of equipment projects that ran late and over budget.",
        ]}
        sources={[SOURCES.personnel]}
      />
    </div>
  );
}

function About() {
  return (
    <div>
      <Panel id="h-defx-src" title="Where the figures come from" lead={`Checked on ${CHECKED}.`}>
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          {Object.values(SOURCES).map((s) => (
            <li key={s.url} style={li}><a href={s.url} target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontFamily: FONT_BODY, fontWeight: 600 }}>{s.label}<span className="sr-only"> (opens in a new tab)</span></a></li>
          ))}
        </ul>
        <p style={para}>The long-run charts read straight from the SIPRI database (saved on {D.built}).</p>
      </Panel>
      <Panel id="h-defx-limits" title="What to bear in mind">
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          <li style={li}><strong style={strong}>Three ways of counting.</strong> SIPRI, NATO and the Ministry of Defence each define defence spending a little differently, so their figures for the same year differ by a tenth or two of a percentage point of GDP.</li>
          <li style={li}><strong style={strong}>Estimates.</strong> The latest year and the next are estimates and are revised. The promises are targets, not spending.</li>
          <li style={li}><strong style={strong}>Not covered.</strong> What the money is spent on in detail, equipment programmes and their costs, the nuclear deterrent, support to Ukraine, and comparisons of capability, which spending alone does not show.</li>
        </ul>
      </Panel>
    </div>
  );
}

export default function Defence({ param }) {
  const [tab, setTab] = useState(() => parse(param));
  const [seen, setSeen] = useState(param);
  const ref = useRef(null);
  if (param !== seen) { setSeen(param); setTab(parse(param)); }
  function go(next) {
    const moved = next !== tab;
    setTab(next);
    window.history.replaceState(null, "", next === "overview" ? "#/defence" : `#/defence/${next}`);
    if (moved && ref.current && ref.current.getBoundingClientRect().top < 0) ref.current.scrollIntoView({ block: "start" });
  }
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={IconDefence} kicker="Britain in numbers" title="Defence" subtitle="How much the UK spends on defence, how that compares with the past and with other countries, what has been promised, and the arguments about it." />
      <div ref={ref} style={{ scrollMarginTop: 12 }}>
        <PageToggles tabs={TABS} current={tab} onPick={go} label="What to look at" idPrefix="def" />
      </div>
      <div key={tab} className="ge-fade" role="tabpanel" id="def-panel" aria-labelledby={`def-tab-${tab}`}>
        {tab === "overview" && <Overview onPick={go} />}
        {tab === "spending" && <Spending />}
        {tab === "people" && <People />}
        {tab === "arguments" && <Arguments />}
        {tab === "about" && <About />}
      </div>
    </div>
  );
}
