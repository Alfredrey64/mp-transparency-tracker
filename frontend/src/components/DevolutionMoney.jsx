import { useState } from "react";
import { COLORS, FONT_BODY } from "../theme";
import { pillStyle } from "../lib/onsStyles";
import { BarRows, Caution, PairBars, Panel, Stats, TrendExplorer } from "./insight";
import { SOURCES } from "../data/devolution";
import { F, F_LAST, NAMES, S, S_LAST, fiscalPerHead, fiscalTotal, functionRows, gbp, indexOf, last, perHead, realChange, yearText } from "../lib/devolution";
import { ACCENT } from "../lib/devolutionStyle";
import { para } from "../lib/insightStyle";

// Devolution and the union, the money toggle: what is spent on services in each nation and region per head, what it is spent on, and what each raises and gets.

const line = (name, color, years, values) => ({ name, color, years, values });
const bn = (m) => `£${(Math.abs(m) / 1000).toFixed(1)}bn`;

function Spending() {
  const order = Object.keys(S.perHead).filter((k) => k !== "uk").sort((a, b) => perHead(b) - perHead(a));
  const tone = (k) => (["scotland", "wales", "ni"].includes(k) ? ACCENT : k === "england" ? "#1D4ED8" : "#9CA3AF");
  const yrs = S.years;
  return (
    <Panel id="h-dm-spend" accent={ACCENT} title="What is spent on services in each place" lead={`Public spending on services that can be identified with a place, for each resident, in ${yearText(S_LAST)}. It was ${gbp(perHead("uk"))} across the UK, ${gbp(perHead("ni"))} in Northern Ireland, ${gbp(perHead("scotland"))} in Scotland, ${gbp(perHead("wales"))} in Wales and ${gbp(perHead("england"))} in England. London, at ${gbp(perHead("london"))}, is the highest of England's regions and the South East, at ${gbp(perHead("se"))}, the lowest.`} sources={[SOURCES.cra]}>
      <BarRows
        label={`Identifiable spending on services per person, ${yearText(S_LAST)}`} accent="#9CA3AF" max={perHead(order[0])}
        rows={order.map((k) => ({ label: NAMES[k], note: `UK = 100: ${indexOf(k)}`, value: perHead(k), text: gbp(perHead(k)), tone: tone(k), strong: ["scotland", "wales", "ni", "england"].includes(k) }))}
      />
      <TrendExplorer
        accent={ACCENT}
        options={[
          { key: "cash", label: "At the time", lines: ["england", "scotland", "wales", "ni"].map((k, i) => line(NAMES[k], ["#1D4ED8", ACCENT, "#0F766E", "#C7871A"][i], yrs, S.perHead[k])), offset: 0.5, labelFn: (t) => yearText(Math.floor(t)), yFormat: (v) => `£${(v / 1000).toFixed(1)}k`, captionFormat: (v) => gbp(v), change: "percent", from: yrs[0], to: S_LAST + 1, note: "Identifiable spending on services per resident in each year's own prices. The figures for 2020 to 21 include pandemic spending." },
          { key: "real", label: `In ${yearText(S_LAST)} money`, lines: ["england", "scotland", "wales", "ni"].map((k, i) => line(NAMES[k], ["#1D4ED8", ACCENT, "#0F766E", "#C7871A"][i], yrs, S.real[k])), offset: 0.5, labelFn: (t) => yearText(Math.floor(t)), yFormat: (v) => `£${(v / 1000).toFixed(1)}k`, captionFormat: (v) => gbp(v), change: "percent", from: yrs[0], to: S_LAST + 1, note: `The same spending per resident with the rise in prices taken out. It fell in each nation after the pandemic spending ended: by ${Math.abs(realChange("england"))}% in England, ${Math.abs(realChange("scotland"))}% in Scotland, ${Math.abs(realChange("wales"))}% in Wales and ${Math.abs(realChange("ni"))}% in Northern Ireland over the period.` },
        ]}
      />
      <Caution title="What identifiable spending leaves out">It counts only spending that can be tied to a place. Defence, overseas aid, debt interest and some other items cannot, so the totals are not all that government spends. More spent per person does not mean better services, since places differ in how many older people they have, how spread out people are, and what things cost.</Caution>
    </Panel>
  );
}

function Functions() {
  const [place, setPlace] = useState("scotland");
  const rows = functionRows(place);
  return (
    <Panel id="h-dm-func" title="What it is spent on" lead={`Identifiable spending per person in ${yearText(S.functionsYear)}, by what it is spent on, in the chosen place against England.`} sources={[SOURCES.cra]}>
      <div role="group" aria-label="Place" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {["scotland", "wales", "ni", "london", "ne", "se"].map((k) => <button key={k} type="button" aria-pressed={k === place} onClick={() => setPlace(k)} style={pillStyle(k === place)}>{NAMES[k]}</button>)}
      </div>
      <PairBars
        label={`Spending per person by function, ${NAMES[place]} and England, pounds`}
        legend={[{ name: NAMES[place], colour: ACCENT }, { name: "England", colour: "#1D4ED8" }]}
        rows={rows.map((r) => ({ label: r.name, note: r.place > r.england ? `${gbp(r.place - r.england)} more than England` : `${gbp(r.england - r.place)} less than England`, bars: [{ name: NAMES[place], value: r.place, text: gbp(r.place), colour: ACCENT }, { name: "England", value: r.england, text: gbp(r.england), colour: "#1D4ED8" }] }))}
      />
      <p style={para}>Health and social protection (mostly pensions and benefits, which are reserved to Westminster except where a nation pays some itself) are the largest items everywhere. Spending on health, education and housing is what the devolved governments mostly decide.</p>
    </Panel>
  );
}

function Fiscal() {
  const places = Object.keys(F.places).filter((k) => !["uk", "england"].includes(k)).sort((a, b) => fiscalPerHead(b) - fiscalPerHead(a));
  const max = Math.max(...places.map((k) => Math.abs(fiscalPerHead(k))));
  const surplus = places.filter((k) => last(F.places[k].balance) < 0);
  return (
    <Panel id="h-dm-fiscal" title="What each place raises and receives" lead={`The ONS adds up what the public sector spends in each place and the revenue raised there. In ${yearText(F_LAST)} the UK as a whole ran a deficit of ${bn(fiscalTotal("uk"))}. ${surplus.length ? `${surplus.map((k) => NAMES[k]).join(" and ")} ${surplus.length === 1 ? "was" : "were"} in surplus` : "No place was in surplus"}, and every other nation and region was in deficit, which means the public sector spent more there than was raised there.`} sources={[SOURCES.fiscal]}>
      <Stats
        accent={ACCENT}
        items={["scotland", "wales", "ni", "london"].map((k) => ({ value: `${fiscalTotal(k) < 0 ? "Surplus " : "Deficit "}${bn(fiscalTotal(k))}`, label: NAMES[k], note: `${gbp(Math.abs(fiscalPerHead(k)))} per person${fiscalTotal(k) < 0 ? " in surplus" : ""}. Revenue ${bn(last(F.places[k].receipts))}, spending ${bn(last(F.places[k].expenditure))}` }))}
      />
      <BarRows
        label={`Public sector deficit per person by place, ${yearText(F_LAST)}, pounds (a surplus is shown as a negative)`} accent="#9CA3AF" max={max}
        rows={places.map((k) => ({ label: NAMES[k], note: fiscalTotal(k) < 0 ? "Surplus" : "Deficit", value: Math.abs(fiscalPerHead(k)), text: `${fiscalPerHead(k) < 0 ? "-" : ""}${gbp(Math.abs(fiscalPerHead(k)))}`, tone: fiscalTotal(k) < 0 ? "#0F766E" : ["scotland", "wales", "ni"].includes(k) ? ACCENT : "#9CA3AF", strong: ["scotland", "wales", "ni"].includes(k) }))}
      />
      <Caution title="How to read this">A deficit does not mean a place is a burden: it reflects how much the public sector spends there, including on pensions, health and benefits, and how much tax is raised on the incomes and spending of the people who live and work there, which is lower where wages and employment are lower. Some revenue is allocated by rules, not by where it is actually paid. North Sea oil and gas revenue is counted where the fields are, which gives Scotland a smaller deficit than if it were shared by population: the ONS gives both, and on the population-share method Scotland's deficit in {yearText(F_LAST)} was {bn(last(F.places.scotland.balancePop))}, against {bn(last(F.places.scotland.balance))} on the geographic method.</Caution>
      <p style={{ ...para, fontFamily: FONT_BODY, color: COLORS.inkSoft }}>The ONS estimates carry a margin of error, and comparing places with small differences should be done with care.</p>
    </Panel>
  );
}

export default function DevolutionMoney() {
  return (
    <div>
      <Spending />
      <Functions />
      <Fiscal />
    </div>
  );
}
