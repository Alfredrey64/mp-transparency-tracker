import { useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric } from "../theme";
import { pillStyle } from "../lib/onsStyles";
import { BarRows, Caution, Panel, RangeField, StackBars, Stats, TrendExplorer } from "./insight";
import { CAP_NOW, FACTS, SOURCES } from "../data/energy";
import { BILL_AREAS, BILL_LAST, BILL_YEARS, BL, CAP, CAP_LAST, EU, EU_LAST, FP, INF, SPEND, STANDARD, UK_AREA, areaBill, billAt, capAt, capByLabel, capPeak, capShare, cpiOf, dual, euLatest, euSeries, hasGas, inTodaysMoney, infPeak, last, monthLabelAt, monthText, realSeries, } from "../lib/energy";
import { ACCENT, group } from "../lib/energyStyle";
import { para } from "../lib/insightStyle";

// Net zero and energy bills, the bills toggle: what households pay for electricity and gas, what the price cap is made of, how much it depends on where you
// live, how Britain compares with Europe, and fuel poverty.

const money = (v) => `£${group(v)}`;
const PARTS = [
  { key: "wholesale", name: "Wholesale energy", colour: "#C0561F" },
  { key: "network", name: "Networks (pipes and wires)", colour: "#1D4ED8" },
  { key: "policy", name: "Government schemes", colour: "#6F8F2B" },
  { key: "operating", name: "Supplier running costs", colour: "#7A5AF0" },
  { key: "margin", name: "Profit and risk allowance", colour: "#9CA3AF" },
];

function Average() {
  const e = billAt("electricity", BILL_LAST);
  const g = billAt("gas", BILL_LAST);
  const d = billAt("dual", BILL_LAST);
  const pre = billAt("dual", 2021);
  const peakI = dual.indexOf(Math.max(...dual));
  const peakYear = BILL_YEARS[peakI];
  return (
    <Panel id="h-nb-main" accent={ACCENT} title="What a typical household pays" lead={`The average annual bill for a household using the standard amount of electricity (${group(STANDARD.electricity)} kWh) and gas (${group(STANDARD.gas)} kWh) in ${BILL_LAST}, across all tariffs and payment types, from DESNZ.`} sources={[SOURCES.bills, SOURCES.cpi]}>
      <Stats
        accent={ACCENT}
        items={[
          { value: money(d), label: `Gas and electricity together, ${BILL_LAST}`, note: `${money(pre)} in 2021. Peak ${money(dual[peakI])} in ${peakYear}`, spark: dual },
          { value: money(e), label: `Electricity, ${BILL_LAST}`, note: `${money(BL.electricity[BILL_YEARS.indexOf(2021)])} in 2021`, spark: BL.electricity },
          { value: money(g), label: `Gas, ${BILL_LAST}`, note: `${money(BL.gas[BILL_YEARS.indexOf(2021)])} in 2021`, spark: BL.gas },
          { value: money(inTodaysMoney(dual[0], BILL_YEARS[0])), label: `The ${BILL_YEARS[0]} bill in ${BILL_LAST} money`, note: `${money(dual[0])} at the time. Prices up ${Math.round((cpiOf(BILL_LAST) / cpiOf(BILL_YEARS[0]) - 1) * 100)}% since` },
        ]}
      />
      <p style={para}>
        The latest price cap, the limit on what suppliers can charge per unit, is {money(CAP_NOW.value)} a year for a typical household from {CAP_NOW.from}, up {CAP_NOW.pct}% from {money(CAP_NOW.previous)} (Ofgem, {CAP_NOW.announced}). That is a different measure from the averages above: the cap is for a stated typical use and applies to standard tariffs, while the averages count what households actually paid on every kind of tariff, including fixed deals.
      </p>
    </Panel>
  );
}

function Trends() {
  const bill = (key, name, color) => ({ name, color, years: BILL_YEARS, values: key === "dual" ? dual : BL[key] });
  const real = (key, name, color) => ({ name, color, years: BILL_YEARS, values: realSeries(key === "dual" ? dual : BL[key]) });
  const peak = infPeak();
  return (
    <Panel id="h-nb-trend" title="How bills have changed" lead="Pick a view. Bills in today's money take out the general rise in prices, which is the fairer way to compare years." accent={ACCENT} sources={[SOURCES.bills, SOURCES.cpi, SOURCES.cpiEnergy]}>
      <TrendExplorer
        accent={ACCENT}
        options={[
          { key: "cash", label: "Bills at the time", governments: true, lines: [bill("dual", "Gas and electricity", ACCENT), bill("electricity", "Electricity", "#C7871A"), bill("gas", "Gas", "#C0561F")], offset: 0, yFormat: (v) => money(v), captionFormat: money, change: "percent", from: BILL_YEARS[0], to: BILL_LAST + 1, note: "A year's bill for the standard amount of gas and electricity. Bills include the Energy Price Guarantee from October 2022. The Energy Bills Support Scheme payments are not taken off." },
          { key: "real", label: `In ${BILL_LAST} money`, lines: [real("dual", "Gas and electricity", ACCENT), real("electricity", "Electricity", "#C7871A"), real("gas", "Gas", "#C0561F")], offset: 0, yFormat: (v) => money(v), captionFormat: money, change: "percent", from: BILL_YEARS[0], to: BILL_LAST + 1, note: `Each year's bill raised by the rise in consumer prices to ${BILL_LAST} money, using the ONS consumer price index.` },
          { key: "inflation", label: "Price rise, month by month", lines: [{ name: "Electricity, gas and other fuels", color: "#C0561F", years: INF.times, values: INF.rate }, { name: "All prices", color: "#6B7280", years: INF.times, values: INF.all }], offset: 0, labelFn: monthLabelAt, yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: 2015, to: 2027, note: `How much more than a year earlier. Household energy prices rose at their fastest in ${monthText(peak.month)}, ${peak.rate}% up on the year.` },
          { key: "spend", label: "Total household spending", lines: [{ name: "Gas", color: "#C0561F", years: SPEND.years, values: SPEND.gas.map((v) => v / 1000) }, { name: "Electricity", color: "#C7871A", years: SPEND.years, values: SPEND.electricity.map((v) => v / 1000) }], offset: 0, yFormat: (v) => `£${Math.round(v)}bn`, captionFormat: (v) => `£${v.toFixed(1)} billion`, change: "percent", from: SPEND.years[0], to: last(SPEND.years) + 1, note: "All spending by UK households on each fuel, in £ billion at the prices of each year (ONS Consumer Trends, via DESNZ)." },
        ]}
      />
    </Panel>
  );
}

function Cap() {
  const picks = [capAt("Oct 2021"), capAt("Oct 2022"), capPeak(), capAt("Jul 2024"), capAt("Oct 2025"), capAt("Apr 2026"), CAP_LAST].filter((p, i, a) => p && a.indexOf(p) === i);
  const rows = picks.map((p) => ({ label: p.label.replace(" - ", " to "), text: money(p.exVat), parts: PARTS.map((x) => ({ name: x.name, value: p[x.key], colour: x.colour })) }));
  const policyDrop = CAP[CAP.findIndex((p) => p.label.startsWith("Apr 2026"))];
  const policyBefore = CAP[CAP.indexOf(policyDrop) - 1];
  const line = (key, name, color) => ({ name, color, years: CAP.map((p) => p.time), values: CAP.map((p) => p[key]) });
  const gap = Math.abs(CAP_NOW.value - CAP_LAST.incVat);
  return (
    <Panel id="h-nb-cap" title="What the price cap is made of" lead="The cap is built up from the costs an efficient supplier faces. The biggest part is the wholesale price of gas and electricity. This is Ofgem's own breakdown of a typical household's annual cost, before VAT." sources={[SOURCES.cap, SOURCES.capNews, SOURCES.budget2025]}>
      <TrendExplorer
        accent={ACCENT}
        options={[
          { key: "all", label: "All the parts", lines: [line("wholesale", "Wholesale energy", "#C0561F"), line("network", "Networks", "#1D4ED8"), line("policy", "Government schemes", "#6F8F2B"), line("operating", "Supplier running costs", "#7A5AF0")], offset: 0, labelFn: capByLabel, yFormat: (v) => money(v), captionFormat: money, change: "percent", from: 2017, to: 2027, note: `Wholesale costs rose to ${money(capPeak().wholesale)} a year in ${capPeak().label.replace(" - ", " to ")}, then fell back. The other parts moved much less.` },
          { key: "other", label: "Networks and schemes", lines: [line("network", "Networks (pipes and wires)", "#1D4ED8"), line("policy", "Government schemes", "#6F8F2B")], offset: 0, labelFn: capByLabel, yFormat: (v) => money(v), captionFormat: money, change: "percent", from: 2017, to: 2027, note: `The cost of government schemes (mainly support for renewables and home insulation) fell from ${money(policyBefore.policy)} to ${money(policyDrop.policy)} in ${policyDrop.label.replace(" - ", " to ")}. ${FACTS.billCuts} The cost of the networks, the pipes and wires that carry energy, rose over the same period.` },
        ]}
      />
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: COLORS.ink, margin: "18px 0 8px" }}>What is in it, period by period</h3>
      <StackBars rows={rows} label="What the price cap was made of in seven periods, pounds a year before VAT" format={money} legend={PARTS.map((x) => ({ name: x.name, colour: x.colour }))} />
      <p style={para}>In {CAP_LAST.label.replace(" - ", " to ")} wholesale energy is {capShare(CAP_LAST, "wholesale")}% of the cap before VAT, networks {capShare(CAP_LAST, "network")}% and government schemes {capShare(CAP_LAST, "policy")}%. {FACTS.vatRelief}</p>
      <Caution title="How this relates to the headline cap">
        These are Ofgem&apos;s figures for a typical household, worked out for each past period with the same method, so they can differ slightly from the amount announced at the time. For {CAP_LAST.label.replace(" - ", " to ")} the table gives {money(CAP_LAST.incVat)} with VAT, against {money(CAP_NOW.value)} announced, a difference of {money(gap)}. The cap also covers only standard tariffs, and many households are on fixed deals.
      </Caution>
    </Panel>
  );
}

function Area() {
  const [area, setArea] = useState("London");
  const [fuel, setFuel] = useState("electricity");
  const [elec, setElec] = useState(STANDARD.electricity);
  const [gas, setGas] = useState(STANDARD.gas);
  const chosen = areaBill("electricity", area);
  const chosenGas = hasGas(area) ? areaBill("gas", area) : null;
  const ukE = areaBill("electricity", UK_AREA);
  const ukG = areaBill("gas", UK_AREA);
  const eCost = (chosen.bill / STANDARD.electricity) * elec;
  const gCost = chosenGas ? (chosenGas.bill / STANDARD.gas) * gas : null;
  const eUk = (ukE.bill / STANDARD.electricity) * elec;
  const gUk = (ukG.bill / STANDARD.gas) * gas;
  const total = eCost + (gCost ?? 0);
  const totalUk = eUk + (gCost === null ? 0 : gUk);
  const rowsFor = (f) => BILL_AREAS.filter((a) => f === "electricity" || hasGas(a)).map((a) => ({ a, v: areaBill(f, a).bill, u: areaBill(f, a).unit })).sort((x, y) => y.v - x.v);
  const rows = rowsFor(fuel);
  const top = rows[0];
  const bottom = rows.at(-1);
  return (
    <Panel id="h-nb-area" title="Where you live and how much you use" lead={`Pick the area and how much you use. The estimate takes the average cost per unit in that area in ${BILL_LAST}, including standing charges, and multiplies it by your use.`} sources={[SOURCES.bills]}>
      <div style={{ display: "grid", gap: 14 }}>
        <label style={{ fontFamily: FONT_BODY, fontSize: 14.5, fontWeight: 700, color: COLORS.ink, display: "grid", gap: 6, maxWidth: 360 }}>
          Area
          <select value={area} onChange={(e) => setArea(e.target.value)} style={{ fontFamily: FONT_BODY, fontSize: 16, padding: "10px 12px", borderRadius: 10, border: `1px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, minHeight: 44 }}>
            {BILL_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <RangeField id="nb-elec" label="Electricity used in a year" value={elec} min={1500} max={7000} step={100} onChange={setElec} text={`${group(elec)} kWh`} hint={`The standard amount is ${group(STANDARD.electricity)} kWh. A flat or a home with gas heating often uses less; an electrically heated home, much more.`} accent={ACCENT} />
        <RangeField id="nb-gas" label="Gas used in a year" value={gas} min={0} max={25000} step={500} onChange={setGas} text={`${group(gas)} kWh`} hint={`The standard amount is ${group(STANDARD.gas)} kWh. Set it to 0 if you do not use gas.`} accent={ACCENT} />
      </div>
      <div aria-live="polite" style={{ marginTop: 14, padding: "14px 16px", borderRadius: 16, background: COLORS.paper, border: `1px solid ${COLORS.hairline}` }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700, color: COLORS.inkSoft }}>Estimated yearly bill in {area}</div>
        <div style={{ ...numeric, fontSize: 30, fontWeight: 600, color: COLORS.ink, lineHeight: 1.2 }}>{money(total)}</div>
        <p style={{ ...para, marginTop: 4, fontSize: 14 }}>
          Electricity {money(eCost)}{chosenGas ? `, gas ${money(gCost)}` : ", no gas figure for this area"}. At the UK average price per unit the same use would cost {money(totalUk)}, so {area} is {total > totalUk ? `${money(total - totalUk)} above` : total < totalUk ? `${money(totalUk - total)} below` : "level with"} the average.
        </p>
      </div>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: COLORS.ink, margin: "20px 0 8px" }}>Standard annual bill by area</h3>
      <div role="group" aria-label="Fuel" style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {["electricity", "gas"].map((f) => <button key={f} type="button" aria-pressed={f === fuel} onClick={() => setFuel(f)} style={pillStyle(f === fuel)}>{f === "electricity" ? "Electricity" : "Gas"}</button>)}
      </div>
      <BarRows label={`${fuel === "gas" ? "Gas" : "Electricity"} bill by area, ${BILL_LAST}`} accent="#9CA3AF" max={top.v} rows={rows.map((r) => ({ label: r.a, note: `${r.u.toFixed(1)}p per kWh`, value: r.v, text: money(r.v), tone: r.a === area ? ACCENT : "#9CA3AF", strong: r.a === area }))} />
      <p style={para}>The {fuel} bill ranges from {money(bottom.v)} in {bottom.a} to {money(top.v)} in {top.a} for the standard amount, a gap of {money(top.v - bottom.v)} a year. {fuel === "gas" ? "These are Great Britain's areas; Northern Ireland has a separate gas market." : "The areas are the former electricity board regions, not the map regions used elsewhere on this page."}</p>
      <Caution title="An estimate, not a quote">The average cost per unit includes the standing charge spread over a standard year, so it understates what a very low user pays per unit and overstates it for a heavy user. Your own tariff, payment type and any fixed deal will differ. Use it to see the pattern, not to predict your bill.</Caution>
    </Panel>
  );
}

function Europe() {
  const rows = euLatest();
  const ukRow = rows.find((r) => r.uk);
  const ukRank = rows.indexOf(ukRow) + 1;
  const median = last(EU.median);
  const line = (name, label, color) => ({ name: label, color, years: EU.years, values: euSeries(name) });
  return (
    <Panel id="h-nb-europe" title="How UK electricity prices compare with Europe" lead={`The price of a unit of electricity for a medium-sized household in ${EU_LAST}, including all taxes and levies, in pence per kWh. Prices are converted at the exchange rate when each was published.`} sources={[SOURCES.euPrices]}>
      <TrendExplorer
        accent={ACCENT}
        options={[
          { key: "uk", label: "UK against others", lines: [line("UK", "United Kingdom", ACCENT), { name: "Median of EU countries and the UK", color: "#6B7280", years: EU.years, values: EU.median }, line("Germany", "Germany", "#C0561F"), line("France", "France", "#1D4ED8")], offset: 0, yFormat: (v) => `${Math.round(v)}p`, captionFormat: (v) => `${v.toFixed(1)}p`, change: "percent", from: EU.years[0], to: EU_LAST + 1, note: `The UK was ${euSeries("UK")[0].toFixed(1)}p in ${EU.years[0]} and ${last(euSeries("UK")).toFixed(1)}p in ${EU_LAST}. Prices include taxes and levies, which differ a lot by country.` },
        ]}
      />
      <BarRows label={`Electricity price by country, ${EU_LAST}, pence per kWh`} accent="#9CA3AF" max={rows[0].value} rows={rows.map((r) => ({ label: r.name, value: r.value, text: `${r.value.toFixed(1)}p`, tone: r.uk ? ACCENT : "#9CA3AF", strong: r.uk }))} />
      <p style={para}>The UK is {ukRank === 1 ? "the highest" : `${ukRank === 2 ? "second" : ukRank === 3 ? "third" : `${ukRank}th`} highest`} of {rows.length} countries, at {ukRow.value.toFixed(1)}p, against a median of {median.toFixed(1)}p. {rows.slice(0, ukRank - 1).length ? `${rows.slice(0, ukRank - 1).map((r) => r.name).join(", ")} ${ukRank === 2 ? "is" : "are"} higher.` : ""}</p>
      <Caution title="Prices and bills are not the same">A high price per unit does not by itself mean a high bill, since homes differ in how much energy they use and how well they are insulated. Taxes, networks and subsidies are counted differently across countries, and exchange rates move. The medium size here is 2,500 to 4,999 kWh a year, close to a typical UK home&apos;s electricity use.</Caution>
    </Panel>
  );
}

function FuelPoverty() {
  const f = FP;
  const i = f.years.length - 1;
  const peak = f.share.indexOf(Math.max(...f.share));
  return (
    <Panel id="h-nb-poor" title="Fuel poverty in England" lead="A household counts as fuel poor in England if its home is rated band D or below for energy efficiency and, after paying for housing and fuel, its income would leave it below the poverty line. It is about the home and the income as well as the price." sources={[SOURCES.fuelPoverty]}>
      <Stats
        accent={ACCENT}
        items={[
          { value: `${(f.households[i] / 1000).toFixed(2)} million`, label: `Households in fuel poverty, ${f.years[i]}`, note: `${f.share[i]}% of English households. ${(f.households[peak] / 1000).toFixed(2)} million in ${f.years[peak]}`, spark: f.households },
          { value: `£${group(f.gap[i])}`, label: "Average fuel poverty gap", note: "How much the household's fuel costs would have to fall for it to be out of fuel poverty", spark: f.gap },
        ]}
      />
      <TrendExplorer
        accent={ACCENT}
        options={[
          { key: "number", label: "Households", lines: [{ name: "Households in fuel poverty", color: ACCENT, years: f.years, values: f.households.map((v) => v / 1000) }], offset: 0, yFormat: (v) => `${v.toFixed(1)}m`, captionFormat: (v) => `${v.toFixed(2)} million`, change: "percent", from: f.years[0], to: last(f.years) + 1, note: "Millions of households in England. A change in how homes are rated by energy efficiency around 2018 lowered the figures a little from that point." },
          { key: "share", label: "Share of households", lines: [{ name: "Share of households", color: "#C0561F", years: f.years, values: f.share }], offset: 0, yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: f.years[0], to: last(f.years) + 1, note: "The share of all households in England." },
          { key: "gap", label: "Average gap", lines: [{ name: "Average fuel poverty gap", color: "#7A5AF0", years: f.years, values: f.gap }], offset: 0, yFormat: (v) => `£${Math.round(v)}`, captionFormat: (v) => `£${Math.round(v)}`, change: "percent", from: f.years[0], to: last(f.years) + 1, note: "The average amount, at the prices of each year, by which fuel costs would have to fall." },
        ]}
      />
      <Caution title="What this measure leaves out">The number of households fell from {(f.households[0] / 1000).toFixed(2)} million in {f.years[0]} and kept falling in 2022 and 2023, even though bills jumped. The average gap did rise, from £{group(f.gap[f.years.indexOf(2021)])} in 2021 to £{group(f.gap[f.years.indexOf(2023)])} in 2023, so those who were fuel poor were further behind. The measure responds to how well homes are insulated and to household incomes, not only to prices. Scotland, Wales and Northern Ireland define fuel poverty differently and are not included.</Caution>
    </Panel>
  );
}

export default function EnergyBills() {
  return (
    <div>
      <Average />
      <Trends />
      <Cap />
      <Area />
      <Europe />
      <FuelPoverty />
    </div>
  );
}
