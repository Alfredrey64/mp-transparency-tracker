import { useRef, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconHeart } from "./icons";
import { PageToggles, Panel, Stats, Takeaways, TrendExplorer } from "./insight";
import CareAdult from "./CareAdult";
import CareWorkforce from "./CareWorkforce";
import CareChildcare from "./CareChildcare";
import { CHECKED, PARENTS, SOURCES, UNPAID } from "../data/care";
import { A, C, F, K, KYEAR, LAST_YEAR, W, WYEAR, bnText, cl, grossRealBn, kAt, kLast, last, peakAt, premium, realChangeSince, realChangeYear, requestsTotal, yearText } from "../lib/care";
import { ACCENT, group, jump, li } from "../lib/careStyle";
import { para, strong } from "../lib/insightStyle";

// Social care and childcare: what councils spend on adult social care and who gets it, the people who provide it and the carers who do the rest, and the
// funded childcare and early education for young children, with the arguments. One page with a row of toggles; the address carries the toggle (/care/workers).

const TABS = [
  { key: "overview", label: "Overview", blurb: "The main figures for adult social care and for funded childcare, and how they have changed.", colour: "#7A5AF0" },
  { key: "adult", label: "Adult social care", blurb: "What councils spend, who pays, who gets help and where it differs, and how carers are doing.", colour: "#C0561F" },
  { key: "workers", label: "Care workers", blurb: "How many people work in adult social care, vacancies, who leaves, pay, and how many more will be needed.", colour: "#1D4ED8" },
  { key: "childcare", label: "Childcare", blurb: "Funded early education and childcare: who gets it, how many take it up, where, and what parents say.", colour: "#0F766E" },
  { key: "arguments", label: "The arguments", blurb: "Who should pay for care, how care workers should be paid, and whether funded childcare is working, set out fairly.", colour: "#C7871A" },
  { key: "about", label: "Sources", blurb: "Where each figure comes from and what it leaves out.", colour: "#6B7280" },
];
const KEYS = new Set(TABS.map((t) => t.key));
const parse = (param) => { const first = String(param ?? "").split("/")[0]; return KEYS.has(first) ? first : "overview"; };
const money = (v) => `£${v.toFixed(2)}`;
const wy = (y) => `${y} to ${String(y + 1).slice(2)}`;
const yt = (t) => yearText(Math.floor(t));
const lbl = (t) => `January ${Math.floor(t)}`;

function Overview({ onPick }) {
  const f = W.filled;
  const vacPeak = peakAt(W.vacancy.all);
  const p = premium();
  const uni = K.universal;
  const wp = K.working;
  const ldn = K.regional.universal.london;
  return (
    <div>
      <Takeaways
        accent={ACCENT}
        items={[
          `Councils in England spent ${bnText(last(F.gross.cash))} on adult social care in ${yearText(LAST_YEAR)}, ${bnText(last(F.net.cash))} after people's own contributions. After inflation that is ${realChangeSince(F.gross.years[0])}% more than in ${yearText(F.gross.years[0])}, and ${realChangeYear()}% more than the year before. ${group(A.duringTotal)} people received long-term support during the year.`,
          `About ${(f.all / 1e6).toFixed(2)} million people hold paid posts in adult social care. ${last(W.vacancy.all.values)}% of posts were vacant in ${wy(WYEAR)}, down from ${vacPeak.value}% in ${wy(vacPeak.year)}, and ${last(W.turnover.all.values)}% of staff left their job in the year. Care workers in the independent sector were paid ${money(last(W.pay.independentCare))} an hour, ${p.pence}p above the legal minimum.`,
          `The 2021 Census counted ${UNPAID.people.toFixed(1)} million unpaid carers in England and Wales. In the latest survey of carers known to their councils, ${last(cl.noSupport)}% got no support or services, against ${cl.noSupport[0]}% in ${yearText(cl.years[0])}, and ${last(cl.satisfied)}% of those who did were satisfied, against ${cl.satisfied[0]}%.`,
          `${(kLast(K.registered) / 1e6).toFixed(2)} million children had a funded early education or childcare place in January ${KYEAR}. ${group(kLast(wp.registered))} were children of working parents, ${kLast(wp.takeUp)}% of those estimated to be eligible, after the offer was extended to children under 3.`,
          `Take-up of the universal 15 hours for 3 and 4 year olds fell from ${kAt(uni.takeUp, 2018)}% in 2018 to ${kLast(uni.takeUp)}% in ${KYEAR}, and was ${ldn}% in London.`,
          `Parents of children aged 0 to 2 paid a median of £${PARENTS.weeklyPaidAge02} a week to formal providers in 2025, against £${PARENTS.weeklyPaidAge02Before} in 2024, and ${PARENTS.affordabilityGood}% of parents of children aged 0 to 4 rated local affordability as good, against ${PARENTS.affordabilityGoodBefore}%.`,
        ]}
      />

      <Panel id="h-co-main" accent={ACCENT} title="The main figures" lead="The latest year for each, with its trend. Adult social care and childcare figures are for England." sources={[SOURCES.finance, SOURCES.activity, SOURCES.workforce, SOURCES.funded]}>
        <Stats
          accent={ACCENT}
          items={[
            { value: bnText(last(F.gross.cash)), label: `Council spending on adult social care, ${yearText(LAST_YEAR)}`, note: `${realChangeYear()}% up on the year after inflation`, spark: C.finance.gross.cash },
            { value: group(A.duringTotal), label: "People who received long-term support", note: `${group(requestsTotal())} new requests for support in the year` },
            { value: `${(f.all / 1e6).toFixed(2)} million`, label: "Paid posts in adult social care", note: `${last(W.vacancy.all.values)}% vacant. ${last(W.turnover.all.values)}% left in the year`, spark: W.vacancy.all.values },
            { value: `${last(cl.noSupport)}%`, label: "Of carers got no support from social services", note: `${cl.noSupport[0]}% in ${yearText(cl.years[0])}`, spark: cl.noSupport },
            { value: `${(kLast(K.registered) / 1e6).toFixed(2)} million`, label: "Children with a funded place", note: `January ${KYEAR}. ${kLast(K.shareOfAll)}% of children aged 9 months to 4 years` },
            { value: `${kLast(wp.takeUp)}%`, label: "Take-up of the working parents' offer", note: `${group(kLast(wp.registered))} children in January ${KYEAR}` },
          ]}
        />
      </Panel>

      <Panel id="h-co-trends" title="How things have changed" lead="Pick a measure. Each is on its own tab in more detail." accent={ACCENT} sources={[SOURCES.finance, SOURCES.workforce, SOURCES.funded]}>
        <TrendExplorer
          accent={ACCENT}
          options={[
            { key: "spend", label: "Adult social care spending", governments: true, lines: [{ name: "Gross spending, after inflation", color: ACCENT, years: F.gross.years, values: grossRealBn }], offset: 0.5, labelFn: yt, yFormat: (v) => `£${Math.round(v)}bn`, captionFormat: (v) => `£${v.toFixed(1)} billion`, change: "percent", from: F.gross.years[0], to: LAST_YEAR + 1, note: `Billions of pounds in ${yearText(LAST_YEAR)} prices.` },
            { key: "vacancy", label: "Care worker vacancies", governments: true, lines: [{ name: "Vacancy rate", color: "#C0561F", years: W.vacancy.all.years, values: W.vacancy.all.values }], offset: 0.5, labelFn: (x) => wy(Math.floor(x)), yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: W.vacancy.all.years[0], to: last(W.vacancy.all.years) + 1, note: "The share of adult social care posts that were vacant." },
            { key: "carers", label: "Carers' satisfaction", lines: [{ name: "Satisfied with the support they got", color: "#1D4ED8", years: cl.years, values: cl.satisfied }], offset: 0.5, labelFn: yt, yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: cl.years[0], to: last(cl.years) + 1, note: "Of carers who received support or services, the share who were satisfied." },
            { key: "childcare", label: "Children of working parents", lines: [{ name: "Registered for the working parents' offer", color: "#0F766E", years: K.years.slice(K.years.indexOf(2018)), values: wp.registered.slice(K.years.indexOf(2018)).map((v) => v / 1e6) }], offset: 0, labelFn: lbl, yFormat: (v) => `${v.toFixed(1)}m`, captionFormat: (v) => `${v.toFixed(2)} million`, change: "percent", from: 2018, to: KYEAR + 1, note: "Children registered for the entitlement for children of working parents in January. It covered 3 and 4 year olds until 2024, then children from 9 months." },
          ]}
        />
      </Panel>

      <Panel id="h-co-go" title="Where to look next" lead="Adult care, then the people who provide it, then childcare.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button type="button" onClick={() => onPick("adult")} style={jump}>What councils spend, and who gets help</button>
          <button type="button" onClick={() => onPick("workers")} style={jump}>Care workers: vacancies and pay</button>
          <button type="button" onClick={() => onPick("childcare")} style={jump}>Funded childcare and take-up</button>
        </div>
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
  const f = W.filled;
  const p = premium();
  const wp = K.working;
  const uni = K.universal;
  return (
    <div>
      <Panel id="h-ac-intro" accent={ACCENT} title="The arguments" lead="Figures show what is spent, who is helped and what people say. They cannot settle how much should be spent or who should pay, which depends on values as well as evidence. These are the arguments people make, not our view." />
      <Arg
        id="h-ac-pay" title="Who should pay for adult social care, and how much?"
        shows={`Councils spent ${bnText(last(F.gross.cash))} in ${yearText(LAST_YEAR)}, ${bnText(last(F.net.cash))} after people's contributions of ${bnText(F.flows.clients)}. After inflation that is ${realChangeSince(F.gross.years[0])}% above ${yearText(F.gross.years[0])}. ${group(requestsTotal())} requests for support were received from new clients, and ${group(A.duringTotal)} people received long-term support. The number of people aged 65 and over is projected to rise by ${Math.round(((last(W.over65.values) - W.over65.values[0]) / W.over65.values[0]) * 100)}% between ${W.over65.years[0]} and ${last(W.over65.years)}. ${last(cl.noSupport)}% of carers known to councils said they got no support.`}
        sLabel="People who want more public money say" cLabel="People who want a different balance say"
        supporters={["Demand is growing as the population ages, and the carers' survey suggests that more carers than before are getting nothing, and fewer are satisfied. They argue that care is as much a public service as health, that waiting for council help leaves families to cope or pushes people into hospital, and that taxes should pay more of it, with less means-testing."]}
        critics={["Spending has already risen after inflation, and tax money is limited, so more for care means more tax or less for something else. Some argue people who can afford it should pay more towards their own care, or that families have always done much of it and should be helped to do so, with money going to the people with the greatest need. Others say reform of how care is organised should come before more money."]}
        sources={[SOURCES.finance, SOURCES.activity, SOURCES.carers]}
      />
      <Arg
        id="h-ac-workers" title="How should care workers be paid and recruited?"
        shows={`${last(W.vacancy.all.values)}% of adult social care posts were vacant in ${wy(WYEAR)}, down from ${peakAt(W.vacancy.all).value}% in ${wy(peakAt(W.vacancy.all).year)}, and ${last(W.turnover.all.values)}% of staff left their job in the year. Care workers in the independent sector, which employs ${Math.round((f.independent / f.all) * 100)}% of the workforce, were paid ${money(last(W.pay.independentCare))} an hour against a legal minimum of ${money(last(W.pay.minimum))}, a gap of ${p.pence}p. Skills for Care estimates ${group(W.projection.extra2040)} more posts would be needed by 2040.`}
        sLabel="People who want higher, nationally set pay say" cLabel="People who are cautious about it say"
        supporters={["Pay for care work is close to the legal minimum, and the work is demanding and skilled. They argue that a higher, agreed wage would keep staff, cut vacancies and improve care, and that the public sector already pays direct care workers more than the independent sector does."]}
        critics={["Most of the money comes from councils, which have a fixed budget, so a pay rise paid by providers means either higher fees from councils and people paying for themselves or fewer places. Some say recruiting from abroad or raising productivity with technology is also needed, and that pay alone does not fix hard working conditions."]}
        sources={[SOURCES.workforce]}
      />
      <Arg
        id="h-ac-childcare" title="Is funded childcare working?"
        shows={`${(kLast(K.registered) / 1e6).toFixed(2)} million children had a funded place in January ${KYEAR}, and ${kLast(wp.takeUp)}% of children estimated to be eligible for the working parents' offer were registered. Take-up of the universal hours for 3 and 4 year olds was ${kLast(uni.takeUp)}%, down from ${kAt(uni.takeUp, 2018)}% in 2018. Parents of children aged 0 to 2 paid a median of £${PARENTS.weeklyPaidAge02} a week to providers, against £${PARENTS.weeklyPaidAge02Before} in 2024. ${PARENTS.extrasStoppedApply}% of parents aware of the offers said charges for extras had stopped them applying to a provider.`}
        sLabel="People who support the expansion say" cLabel="People with concerns say"
        supporters={["The offer lets more parents work or work longer: in the department's survey, 40% of working parents of children from 9 months up to 2 said they would work fewer hours without it, and what parents pay each week fell. Take-up of the working parents' offer is high among those eligible, and more of the youngest children now use formal childcare."]}
        critics={["Providers and their representatives argue that the money paid for each funded hour does not cover what it costs, so providers charge for extras such as meals and nappies, which parents say can put them off, and some have closed or cut places. Others point out that the offer helps only working parents who earn enough and less than the upper limit, and that take-up of the universal hours for 3 and 4 year olds has fallen, especially in London, while the places for children under 3 have to be found."]}
        sources={[SOURCES.funded, SOURCES.parents, SOURCES.workingParents]}
      />
    </div>
  );
}

function About() {
  return (
    <div>
      <Panel id="h-cs-src" title="Where the figures come from" lead={`Checked on ${CHECKED}. The charts read from government and Skills for Care data saved on ${C.built}.`}>
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          {Object.values(SOURCES).map((s) => (
            <li key={s.url} style={li}><a href={s.url} target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontFamily: FONT_BODY, fontWeight: 600 }}>{s.label}<span className="sr-only"> (opens in a new tab)</span></a></li>
          ))}
        </ul>
      </Panel>
      <Panel id="h-cs-limits" title="What to bear in mind">
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          <li style={li}><strong style={strong}>England.</strong> Social care and childcare are run separately in England, Scotland, Wales and Northern Ireland, and are counted differently, so the figures here are for England. The Census figure on unpaid carers is for England and Wales.</li>
          <li style={li}><strong style={strong}>Council-arranged care only.</strong> The spending and activity figures count care that councils arrange or pay for. People who pay for their own care, the NHS's own continuing healthcare, and unpaid care are not in them.</li>
          <li style={li}><strong style={strong}>Real terms.</strong> After-inflation figures use the Treasury's GDP deflators, in the prices of the latest year.</li>
          <li style={li}><strong style={strong}>Posts, not people.</strong> The workforce figures count filled posts, and one person can hold more than one. They are Skills for Care's estimates from a sample of employers.</li>
          <li style={li}><strong style={strong}>Funded places.</strong> The childcare counts are children registered for a funded place in the week of the January census. Take-up uses the department's estimates of how many are eligible, which are rounded for working parents. The counts changed in 2025 when the entitlement was extended to younger children, so years before and after are not like for like.</li>
          <li style={li}><strong style={strong}>Surveys.</strong> The carers' survey and the parents' survey are samples, and each figure has a margin of error. The parents' survey figures are those the department reports in its text.</li>
          <li style={li}><strong style={strong}>Not covered.</strong> Children's social care and children in care, the quality of care homes and nurseries, what people pay in care homes themselves, and mental health services.</li>
        </ul>
      </Panel>
    </div>
  );
}

export default function Care({ param }) {
  const [tab, setTab] = useState(() => parse(param));
  const [seen, setSeen] = useState(param);
  const ref = useRef(null);
  if (param !== seen) { setSeen(param); setTab(parse(param)); }
  function go(next) {
    const moved = next !== tab;
    setTab(next);
    window.history.replaceState(null, "", next === "overview" ? "#/care" : `#/care/${next}`);
    if (moved && ref.current && ref.current.getBoundingClientRect().top < 0) ref.current.scrollIntoView({ block: "start" });
  }
  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={IconHeart} kicker="Britain in numbers" title="Social care and childcare" subtitle="What councils spend on adult social care and who gets help, the people who provide it and the carers who do the rest, funded childcare for young children, and the arguments." />
      <div ref={ref} style={{ scrollMarginTop: 12 }}>
        <PageToggles tabs={TABS} current={tab} onPick={go} label="What to look at" idPrefix="co" />
      </div>
      <div key={tab} className="ge-fade" role="tabpanel" id="co-panel" aria-labelledby={`co-tab-${tab}`}>
        {tab === "overview" && <Overview onPick={go} />}
        {tab === "adult" && <CareAdult onPick={go} />}
        {tab === "workers" && <CareWorkforce />}
        {tab === "childcare" && <CareChildcare />}
        {tab === "arguments" && <Arguments />}
        {tab === "about" && <About />}
      </div>
    </div>
  );
}
