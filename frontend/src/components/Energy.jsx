import { useRef, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconBolt } from "./icons";
import EnergyEmissions from "./EnergyEmissions";
import EnergyPower from "./EnergyPower";
import EnergyBills from "./EnergyBills";
import { BarRows, PageToggles, Panel, Stats, Takeaways, TrendExplorer } from "./insight";
import { CAP_NOW, CHECKED, FACTS, SOURCES, TARGETS } from "../data/energy";
import { BASE, BILL_LAST, BILL_YEARS, BL, CAP_LAST, E, EM, EU_LAST, FP, LAST_YEAR, NEWEST, POWER_LAST, PW, capShare, dual, emittingSectors, euLatest, groupShare, lowCarbonShare, pace, realSeries, round } from "../lib/energy";
import { ACCENT, group, jump, li } from "../lib/energyStyle";
import { para, strong } from "../lib/insightStyle";
import { ordinal } from "../lib/regionData";

// Net zero and energy bills: how much the UK releases, where from and whether it is on course; where its electricity comes from; what households pay for
// energy and why; and the arguments. One page with a row of toggles; the address carries the toggle (/energy/bills).


const TABS = [
  { key: "overview", label: "Overview", blurb: "The main figures, how they have changed, and where the UK stands against its goals.", colour: "#1F7A4D" },
  { key: "emissions", label: "Emissions", blurb: "How much the UK releases, from what, where it is highest, and whether the carbon budgets and targets are on course.", colour: "#C0561F" },
  { key: "power", label: "Electricity", blurb: "Where the UK's electricity comes from, how that has changed since 1998, and the 2030 clean power goal.", colour: "#0E7490" },
  { key: "bills", label: "Energy bills", blurb: "What households pay, what the price cap is made of, how it varies by area, how the UK compares with Europe, and fuel poverty.", colour: "#C7871A" },
  { key: "arguments", label: "The arguments", blurb: "The cost of net zero, what it means for bills, and how fast the electricity system can change, set out fairly.", colour: "#7A5AF0" },
  { key: "about", label: "Sources", blurb: "Where each figure comes from and what it leaves out.", colour: "#6B7280" },
];
const KEYS = new Set(TABS.map((t) => t.key));
const parse = (param) => { const first = String(param ?? "").split("/")[0]; return KEYS.has(first) ? first : "overview"; };
const money = (v) => `£${group(v)}`;

function Overview({ onPick }) {
  const p30 = pace("ndc2030");
  const sectors = emittingSectors().sort((a, b) => a.pct - b.pct);
  const biggestCut = sectors[0];
  const smallestCut = sectors.at(-1);
  const g = groupShare(POWER_LAST);
  const g0 = groupShare(PW.years[0]);
  const lc = lowCarbonShare(POWER_LAST);
  const d = dual.at(-1);
  const d21 = dual[BILL_YEARS.indexOf(2021)];
  const peak = Math.max(...dual);
  const peakYear = BILL_YEARS[dual.indexOf(peak)];
  const eu = euLatest();
  const ukRank = eu.findIndex((r) => r.uk) + 1;
  const fpI = FP.years.length - 1;
  const provNote = NEWEST.provisional ? ", a provisional estimate" : "";
  const ladder = [
    { label: `Cut so far (${NEWEST.year}${NEWEST.provisional ? ", provisional" : ""})`, v: NEWEST.cut, tone: ACCENT, strong: true },
    { label: "2030 pledge", v: TARGETS.ndc2030.cut, tone: "#9CA3AF" },
    { label: "2035 pledge", v: TARGETS.ndc2035.cut, tone: "#9CA3AF" },
    { label: "2040 (seventh carbon budget)", v: 87, tone: "#9CA3AF", note: "Includes international aviation and shipping" },
    { label: "2050 net zero", v: TARGETS.netZero.cut, tone: "#9CA3AF", note: "Any emissions left must be balanced by removals" },
  ];
  return (
    <div>
      <Takeaways
        accent={ACCENT}
        items={[
          `The UK released ${group(NEWEST.total)} million tonnes of greenhouse gases in ${NEWEST.year}${provNote}, ${NEWEST.cut}% below 1990. Electricity supply fell by ${Math.abs(biggestCut.pct)}% and transport by ${Math.abs(smallestCut.pct)}%.`,
          `To reach a ${TARGETS.ndc2030.cut}% cut by 2030 emissions must fall by about ${p30.needed} million tonnes a year, ${p30.ratio} times the average of the last ${p30.recentYears} years (${p30.recent}). The first three carbon budgets were met.`,
          `${lc}% of the UK's electricity came from renewables and nuclear in ${POWER_LAST}, against ${round(g0.renewables + g0.nuclear, 0)}% in ${PW.years[0]}. Fossil fuels made ${g.fossil}%, almost all of it gas.`,
          `A typical household's gas and electricity cost ${money(d)} in ${BILL_LAST}, against ${money(d21)} in 2021 and a high of ${money(peak)} in ${peakYear}. The price cap is ${money(CAP_NOW.value)} a year from ${CAP_NOW.from}, ${CAP_NOW.pct}% up.`,
          `Wholesale energy is ${capShare(CAP_LAST, "wholesale")}% of the price cap and government schemes ${capShare(CAP_LAST, "policy")}%. UK electricity is the ${ordinal(ukRank)} dearest per unit of ${eu.length} European countries.`,
          `${(FP.households[fpI] / 1000).toFixed(2)} million English households, ${FP.share[fpI]}%, were in fuel poverty in ${FP.years[fpI]}, down from ${(FP.households[0] / 1000).toFixed(2)} million in ${FP.years[0]}.`,
        ]}
      />

      <Panel id="h-no-main" accent={ACCENT} title="The main figures" lead="The latest year for each, with its trend. Emissions are for the UK. Bills are for a household using the standard amount. The fuel poverty figure is for England." sources={[SOURCES.ghg, SOURCES.electricity, SOURCES.bills, SOURCES.fuelPoverty]}>
        <Stats
          accent={ACCENT}
          items={[
            { value: `${NEWEST.cut}%`, label: `Emissions cut since 1990${NEWEST.provisional ? ", provisional" : ""}`, note: `${group(NEWEST.total)} million tonnes in ${NEWEST.year}. Peak ${group(Math.max(...EM.total))} in 1991`, spark: EM.total },
            { value: `${lc}%`, label: "Electricity from renewables and nuclear", note: `${POWER_LAST}. Fossil fuels ${g.fossil}%`, spark: PW.years.map((y) => lowCarbonShare(y)) },
            { value: money(d), label: `Gas and electricity bills, ${BILL_LAST}`, note: `Standard use. ${money(peak)} at the peak in ${peakYear}`, spark: dual },
            { value: money(CAP_NOW.value), label: "Price cap for a typical household", note: `From ${CAP_NOW.from}. ${CAP_NOW.pct}% up on ${money(CAP_NOW.previous)}` },
            { value: `${FP.share[fpI]}%`, label: "English households in fuel poverty", note: `${FP.years[fpI]}. ${(FP.households[fpI] / 1000).toFixed(2)} million households`, spark: FP.share },
            { value: `${ordinal(ukRank)} dearest`, label: "UK electricity price in Europe", note: `Of ${eu.length} countries, ${EU_LAST}. ${eu[0].name} is highest` },
          ]}
        />
      </Panel>

      <Panel id="h-no-trends" title="How things have changed" lead="Pick a measure. Each is on its own tab in more detail." accent={ACCENT} sources={[SOURCES.ghg, SOURCES.electricity, SOURCES.bills, SOURCES.fuelPoverty]}>
        <TrendExplorer
          accent={ACCENT}
          options={[
            { key: "emissions", label: "Emissions", governments: true, lines: [{ name: "Greenhouse gases", color: ACCENT, years: EM.years, values: EM.total }], offset: 0, yFormat: (v) => `${Math.round(v)}`, captionFormat: (v) => `${Math.round(v)} million tonnes`, change: "percent", from: EM.years[0], to: LAST_YEAR + 1, note: "Million tonnes of carbon dioxide equivalent released in the UK each year, final figures." },
            { key: "fossil", label: "Fossil fuels in electricity", governments: true, lines: [{ name: "Gas, coal and oil", color: "#C0561F", years: PW.years, values: PW.years.map((y) => groupShare(y).fossil) }, { name: "Renewables and nuclear", color: "#0E7490", years: PW.years, values: PW.years.map((y) => lowCarbonShare(y)) }], offset: 0, yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: PW.years[0], to: POWER_LAST + 1, note: "The share of the electricity generated in the UK from each group of sources." },
            { key: "bills", label: `Bills in ${BILL_LAST} money`, lines: [{ name: "Gas and electricity", color: "#C7871A", years: BILL_YEARS, values: realSeries(dual) }], offset: 0, yFormat: (v) => money(v), captionFormat: money, change: "percent", from: BILL_YEARS[0], to: BILL_LAST + 1, note: `The average yearly bill for the standard amount of gas and electricity, in ${BILL_LAST} prices.` },
            { key: "poverty", label: "Fuel poverty", lines: [{ name: "Share of English households", color: "#7A5AF0", years: FP.years, values: FP.share }], offset: 0, yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: FP.years[0], to: FP.years.at(-1) + 1, note: "The share of households in England that are fuel poor on the official measure." },
          ]}
        />
      </Panel>

      <Panel id="h-no-goals" title="Where the UK stands against its goals" lead="How far emissions have fallen from 1990, and how far the targets ask them to fall." sources={[SOURCES.ghg, SOURCES.ghgProv, SOURCES.ccc7, SOURCES.cb7News]}>
        <BarRows label="Cut in emissions from 1990, so far and as targeted, percent" accent={ACCENT} max={100} rows={ladder.map((r) => ({ label: r.label, note: r.note, value: r.v, text: `${r.v}%`, tone: r.tone, strong: r.strong }))} />
        <p style={para}>The 2030 and 2035 targets are the UK&apos;s Paris Agreement pledges. The 2040 figure is the cut implied by the seventh carbon budget, which the House of Commons approved on 24 June 2026. Net zero by 2050 is required by the Climate Change Act. About {group(BASE)} million tonnes were released in 1990.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button type="button" onClick={() => onPick("emissions")} style={jump}>See the emissions in detail</button>
          <button type="button" onClick={() => onPick("bills")} style={jump}>See what bills are made of</button>
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
  const wld = E.compare.WLD.ghgTotal;
  const gbr = E.compare.GBR.ghgTotal;
  const share = round((gbr.value / wld.value) * 100, 1);
  const eUnit = BL.electricity.at(-1) / 3400 * 100;
  const gUnit = BL.gas.at(-1) / 11200 * 100;
  const policyRow = (label) => E.cap.periods.find((p) => p.label.startsWith(label));
  const lc = lowCarbonShare(POWER_LAST);
  const lc5 = lowCarbonShare(POWER_LAST - 5);
  return (
    <div>
      <Panel id="h-na-intro" accent={ACCENT} title="The arguments" lead="Figures show how much is released, generated and paid. They cannot settle how fast to cut emissions or who should pay, which depends on values as well as evidence. These are the arguments people make, not our view." />
      <Arg
        id="h-na-cost" title="What does net zero cost, and is it worth it?"
        shows={`${FACTS.ccc7NetCost} The House of Commons approved the seventh carbon budget on 24 June 2026, by 238 votes to 94. Reform UK's 2024 manifesto pledged to scrap net zero and related subsidies, and in October 2025 the Conservative Party leader, Kemi Badenoch, said the party would repeal the Climate Change Act. The UK released ${share}% of the world's greenhouse gases in ${gbr.year}, on the World Bank's figures.`}
        sLabel="People who back the targets say" cLabel="People who want them dropped or slowed say"
        supporters={["The Climate Change Committee argues that the net cost is small against the size of the economy, that most of the investment will come from private companies, and that being less exposed to fossil fuel prices protects the country: it says price shocks in oil and gas have caused around half of the UK's recessions since 1970. Supporters add that cleaner air, new jobs in industries such as heat pump installation, and the example set for other countries are further gains."]}
        critics={[`Critics say the estimate depends on assumptions about how far the cost of new technology will fall and what fossil fuels would cost otherwise, and that the cost arrives early while the savings come later. They point out that the UK is a small part of world emissions (${share}%), so its cuts matter only if others follow, and that costs fall on households, taxpayers and industry now. Some would rather spend the money on other things, such as the NHS or lower taxes, or on adapting to climate change.`]}
        sources={[SOURCES.ccc7, SOURCES.cb7News, SOURCES.reform, SOURCES.grantham, SOURCES.worldBank]}
      />
      <Arg
        id="h-na-bills" title="Does clean energy push bills up or down?"
        shows={`Wholesale energy is ${capShare(CAP_LAST, "wholesale")}% of the price cap, networks ${capShare(CAP_LAST, "network")}% and government schemes ${capShare(CAP_LAST, "policy")}%. The cost of government schemes in the cap fell from £${policyRow("Jan 2026").policy} to £${policyRow("Apr 2026").policy} a year in April 2026 as costs moved to taxpayers, while the network share rose from £${policyRow("Jan 2026").network} to £${policyRow("Apr 2026").network}. A unit of electricity costs about ${(eUnit / gUnit).toFixed(1)} times a unit of gas (${eUnit.toFixed(1)}p against ${gUnit.toFixed(1)}p, on DESNZ's standard bills for ${BILL_LAST}).`}
        sLabel="People who say clean energy brings bills down say" cLabel="People who say it puts bills up say"
        supporters={["Wind and solar have no fuel to buy, and gas is the fuel whose price jumped in 2022, when the typical bill rose from £1,213 in 2021 to £2,307 in 2023. The more power comes from home-grown clean sources, the less bills depend on the gas price. The Climate Change Committee says clean, efficient, electric technologies should mean lower energy bills than continued reliance on fossil fuels, and that removing policy levies from electricity would help."]}
        critics={["Critics say the schemes, the extra pipes and wires, and the back-up needed for still, dark days are paid for through bills or taxes. UK electricity is among the dearest in Europe, which they say shows that the cost of the system is already high, and the extra cost of electricity next to gas makes switching to heat pumps and electric cars less attractive. Moving some costs from bills to taxpayers, they add, hides the cost rather than removes it."]}
        sources={[SOURCES.cap, SOURCES.budget2025, SOURCES.bills, SOURCES.euPrices, SOURCES.ccc7]}
      />
      <Arg
        id="h-na-speed" title="Can the electricity system change fast enough?"
        shows={`Renewables and nuclear made ${lc}% of UK electricity in ${POWER_LAST}, up from ${lc5}% in ${POWER_LAST - 5}. ${FACTS.cleanPower} Gas still made ${PW.years.includes(POWER_LAST) ? round((PW.fuels.gas.at(-1) / PW.total.at(-1)) * 100, 0) : 0}% of electricity in ${POWER_LAST}.`}
        sLabel="People who think the goal can be met say" cLabel="People who doubt it say"
        supporters={[`Wind and solar have grown fast: renewables went from ${groupShare(POWER_LAST - 10).renewables}% of UK electricity in ${POWER_LAST - 10} to ${groupShare(POWER_LAST).renewables}% in ${POWER_LAST}. The government's plan includes a delivery unit and reforms to planning and grid connection, and supporters say the cost of new wind and solar projects has fallen.`]}
        critics={["Critics say the goal needs very large increases in wind, solar and storage in five years, with planning, grid connection and supply chain delays already holding projects back, and that the cost of the networks and back-up will be high. Relying on weather-dependent power, they argue, makes the UK more dependent on imports through cables and on gas when the wind drops, and new nuclear plants take far longer to build than the target allows."]}
        sources={[SOURCES.cleanPower, SOURCES.electricity]}
      />
    </div>
  );
}

function About() {
  return (
    <div>
      <Panel id="h-nx-src" title="Where the figures come from" lead={`Checked on ${CHECKED}. The charts read from government and international data saved on ${E.built}.`}>
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          {Object.values(SOURCES).map((s) => (
            <li key={s.url} style={li}><a href={s.url} target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontFamily: FONT_BODY, fontWeight: 600 }}>{s.label}<span className="sr-only"> (opens in a new tab)</span></a></li>
          ))}
        </ul>
      </Panel>
      <Panel id="h-nx-limits" title="What to bear in mind">
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          <li style={li}><strong style={strong}>Territorial emissions.</strong> The emissions figures count what is released inside the UK, excluding international flights and shipping and the emissions abroad from making things the UK buys. The seventh carbon budget does include flights and shipping.</li>
          <li style={li}><strong style={strong}>Final and provisional.</strong> The final emissions figures run to {LAST_YEAR}. A provisional estimate for {NEWEST.year} is used where it is marked and can change when the final figures are published.</li>
          <li style={li}><strong style={strong}>Different targets, different yardsticks.</strong> The Paris pledges, the carbon budgets and net zero are measured slightly differently, and none is exactly the same as the totals shown here.</li>
          <li style={li}><strong style={strong}>Bills.</strong> The averages are for a standard amount of energy over all tariffs, and the price cap is for a typical household on standard tariffs. Neither is a quote for your own home. The cap breakdown is Ofgem&apos;s re-worked figures for past periods and can differ a little from the cap announced at the time.</li>
          <li style={li}><strong style={strong}>Regions.</strong> Regional emissions are released in each place, not caused by its residents, and a few large sites can dominate a small region.</li>
          <li style={li}><strong style={strong}>Fuel poverty.</strong> The figures are for England only and use an official definition that the other nations do not share.</li>
          <li style={li}><strong style={strong}>Not covered.</strong> The cost of Great Britain&apos;s grid in detail, heating and transport technology, North Sea oil and gas, industrial energy prices, and the effect of climate change itself.</li>
        </ul>
      </Panel>
    </div>
  );
}

export default function Energy({ param }) {
  const [tab, setTab] = useState(() => parse(param));
  const [seen, setSeen] = useState(param);
  const ref = useRef(null);
  if (param !== seen) { setSeen(param); setTab(parse(param)); }
  function go(next) {
    const moved = next !== tab;
    setTab(next);
    window.history.replaceState(null, "", next === "overview" ? "#/energy" : `#/energy/${next}`);
    if (moved && ref.current && ref.current.getBoundingClientRect().top < 0) ref.current.scrollIntoView({ block: "start" });
  }
  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={IconBolt} kicker="Britain in numbers" title="Net zero and energy bills" subtitle="How much the UK releases and whether it is on course, where its electricity comes from, what households pay for energy and why, where it is dearest, and the arguments." />
      <div ref={ref} style={{ scrollMarginTop: 12 }}>
        <PageToggles tabs={TABS} current={tab} onPick={go} label="What to look at" idPrefix="ne" />
      </div>
      <div key={tab} className="ge-fade" role="tabpanel" id="ne-panel" aria-labelledby={`ne-tab-${tab}`}>
        {tab === "overview" && <Overview onPick={go} />}
        {tab === "emissions" && <EnergyEmissions onPick={go} />}
        {tab === "power" && <EnergyPower />}
        {tab === "bills" && <EnergyBills />}
        {tab === "arguments" && <Arguments />}
        {tab === "about" && <About />}
      </div>
    </div>
  );
}
