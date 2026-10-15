import { useState } from "react";
import { Caution, Panel, StackBars, Stats, TrendExplorer } from "./insight";
import RegionMetricMap from "./RegionMetricMap";
import { SOURCES, UNPAID } from "../data/care";
import { A, F, LAST_YEAR, MAP_METRICS, bn, bnText, carerYears, cl, grossBn, grossRealBn, last, netBn, netRealBn, netRealChangeSince, realChangeSince, realChangeYear, requestsTotal, round, shares, yearText } from "../lib/care";
import { ACCENT, group, jump } from "../lib/careStyle";
import { para } from "../lib/insightStyle";

// Social care and childcare, the adult social care toggle: what councils spend and on what, who pays, who is helped and where, and carers.

const money = (v) => `£${group(v)}`;
const yt = (t) => yearText(Math.floor(t));

function Spend() {
  const s = shares();
  const line = (name, color, series, years) => ({ name, color, years, values: series });
  const gy = F.gross.years;
  const ny = F.net.years;
  return (
    <Panel id="h-ca-spend" accent={ACCENT} title="What councils spend" lead={`Councils in England spent ${bnText(last(F.gross.cash))} on adult social care in ${yearText(LAST_YEAR)}, before people's own contributions, and ${bnText(last(F.net.cash))} after them. Adult social care means help with washing, dressing, eating and getting around for older people and for adults with disabilities or mental health needs, at home or in a care home.`} sources={[SOURCES.finance]}>
      <Stats
        accent={ACCENT}
        items={[
          { value: bnText(last(F.gross.cash)), label: `Gross spending, ${yearText(LAST_YEAR)}`, note: `Up ${realChangeYear()}% on the year after inflation. ${bnText(F.gross.cash[0])} in ${yearText(gy[0])}`, spark: grossBn },
          { value: bnText(last(F.net.cash)), label: "After people's own contributions", note: `Up ${netRealChangeSince(ny[0])}% since ${yearText(ny[0])}, after inflation`, spark: netBn },
          { value: money(F.regions.england.perAdult), label: "Spent for each adult in England", note: `${money(F.regions.england.perAdultBefore)} the year before` },
          { value: `${realChangeSince(gy[0])}%`, label: `Rise since ${yearText(gy[0])}, after inflation`, note: `Spending was flat in real terms until about 2018, then rose` },
        ]}
      />
      <TrendExplorer
        accent={ACCENT}
        options={[
          { key: "cash", label: "Gross, at the time", governments: true, lines: [line("Gross spending", ACCENT, grossBn, gy), line("After people's contributions", "#C0561F", netBn, ny)], offset: 0.5, labelFn: yt, yFormat: (v) => `£${Math.round(v)}bn`, captionFormat: (v) => `£${v.toFixed(1)} billion`, change: "percent", from: gy[0], to: LAST_YEAR + 1, note: "Billions of pounds in each year's own prices. The finance return has been collected from councils since 2005 to 2006." },
          { key: "real", label: `In ${yearText(LAST_YEAR)} money`, governments: true, lines: [line("Gross spending", ACCENT, grossRealBn, gy), line("After people's contributions", "#C0561F", netRealBn, ny)], offset: 0.5, labelFn: yt, yFormat: (v) => `£${Math.round(v)}bn`, captionFormat: (v) => `£${v.toFixed(1)} billion`, change: "percent", from: gy[0], to: LAST_YEAR + 1, note: "The same spending with the general rise in prices taken out, using the Treasury's GDP deflators, so a rise is a real increase. Shading shows who was in government, not what caused a change." },
        ]}
      />
      <p style={para}>
        After inflation, spending was £{grossRealBn[0].toFixed(1)} billion in {yearText(gy[0])} and was still close to that in {yearText(2018)}, then rose. The figures do not show how much of the rise is more people being helped, higher pay or higher prices. Of what was spent in {yearText(LAST_YEAR)}, {s.long}% was long-term care, {s.short}% short-term care and {s.other}% other support.
      </p>
    </Panel>
  );
}

function Who() {
  const f = F.flows;
  const net = last(F.net.cash);
  const gross = last(F.gross.cash);
  return (
    <Panel id="h-ca-pay" title="Who pays" lead="Some people pay towards their own care after a means test. The rest is paid for by the council, with money from council tax, the government and the NHS." sources={[SOURCES.finance]}>
      <StackBars
        rows={[{ label: `Where the £${bn(gross).toFixed(1)}bn came from, ${yearText(LAST_YEAR)}`, text: bnText(gross), parts: [{ name: "Council funded", value: round(net / 1e6, 1), colour: ACCENT }, { name: "People's own contributions", value: round(f.clients / 1e6, 1), colour: "#C7871A" }] }]}
        label="Where adult social care spending comes from, pounds billion" format={(v) => `£${v.toFixed(1)}bn`}
        legend={[{ name: "Council funded", colour: ACCENT }, { name: "People's own contributions", colour: "#C7871A" }]}
      />
      <p style={para}>People paid {bnText(f.clients)} towards their own care, {shares().clients}% of the gross spending. The finance return also records {bnText(f.nhs)} of income from the NHS, which is part of what pays for the council-funded share.</p>
      <Caution title="Care that is not in these figures">The figures count care that councils arrange or pay for. People who arrange and pay for their own care, which includes some people in care homes, are not counted, and neither is what the NHS spends itself on continuing healthcare. They also leave out unpaid care by family and friends, which is described under Carers below.</Caution>
    </Panel>
  );
}

function People() {
  const total = requestsTotal();
  return (
    <Panel id="h-ca-people" title="Who gets help" lead={`In ${yearText(LAST_YEAR)} councils in England received ${group(total)} requests for support from people who were not already known to them. ${group(A.duringTotal)} people received long-term support during the year.`} sources={[SOURCES.activity]}>
      <Stats
        accent={ACCENT}
        items={[
          { value: group(A.duringTotal), label: "People who received long-term support in the year", note: `${group(A.during65)} aged 65 and over, ${group(A.during18)} aged 18 to 64` },
          { value: group(A.endTotal), label: "Still receiving it on 31 March", note: `${Math.round((A.endTotal / A.duringTotal) * 100)}% of those helped during the year` },
          { value: group(total), label: "Requests for support from new clients", note: `${group(A.requests65)} aged 65 and over, ${group(A.requests1864)} aged 18 to 64` },
          { value: group(A.clientsPer100k65), label: "Per 100,000 aged 65 and over in long-term support", note: `${group(A.clientsPer100k1864)} per 100,000 aged 18 to 64` },
        ]}
      />
      <p style={para}>A request does not always lead to long-term support: some end in advice, a short-term service or no service. Long-term support means care that lasts, such as a place in a care home or regular care at home.</p>
    </Panel>
  );
}

function Regions() {
  const [selected, setSelected] = useState(null);
  return (
    <RegionMetricMap
      id="h-ca-map" title="Where it differs" lead={`How much councils spend, how many people they help and what care costs in each region of England in ${yearText(LAST_YEAR)}. Pick a measure, and tap a region to see it on all of them. Wales, Scotland and Northern Ireland run their own systems and are not in these figures.`}
      metrics={MAP_METRICS.map((m) => ({ ...m, source: m.group === "People helped" ? SOURCES.activity : SOURCES.finance }))} defaultMetric="perAdult" selected={selected} onSelect={setSelected}
      tapNote="Tap a region on the map, or a name in the list below, to see it on every measure. Places outside England have no figure."
    />
  );
}

function Carers() {
  const y = carerYears;
  const l = (name, color, key) => ({ name, color, years: y, values: cl[key] });
  return (
    <Panel id="h-ca-carers" title="Carers" lead={`A carer is someone who looks after a relative or friend who needs help because of illness, disability or old age, without being paid. The 2021 Census counted ${UNPAID.people.toFixed(1)} million people in England and Wales who gave some unpaid care, and ${UNPAID.hours50.toFixed(1)} million of them gave 50 hours or more a week. Every two years the NHS surveys carers who are known to their council.`} sources={[SOURCES.carers, SOURCES.census]}>
      <Stats
        accent={ACCENT}
        items={[
          { value: `${last(cl.satisfied)}%`, label: "Of carers who got support are satisfied with it", note: `${cl.satisfied[0]}% in ${yearText(y[0])}. ${last(cl.dissatisfied)}% are dissatisfied`, spark: cl.satisfied },
          { value: `${last(cl.noSupport)}%`, label: "Got no support or services from social services", note: `${cl.noSupport[0]}% in ${yearText(y[0])}`, spark: cl.noSupport },
          { value: `${last(cl.moneyTrouble)}%`, label: "Say caring has caused them money difficulties", note: `${cl.moneyTrouble.find((v) => v !== null)}% in ${yearText(y[cl.moneyTrouble.findIndex((v) => v !== null)])}` },
        ]}
      />
      <TrendExplorer
        accent={ACCENT}
        options={[
          { key: "sat", label: "Satisfaction with support", lines: [l("Satisfied", ACCENT, "satisfied"), l("Dissatisfied", "#C0561F", "dissatisfied")], offset: 0.5, labelFn: yt, yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: y[0], to: last(y) + 1, note: "Of carers who received support or services from social services in the last 12 months, the share who were extremely, very or quite satisfied or dissatisfied. The rest were neither." },
          { key: "none", label: "No support received", lines: [l("Got no support or services", "#7A5AF0", "noSupport")], offset: 0.5, labelFn: yt, yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: y[0], to: last(y) + 1, note: "The share of all carers who said they had not received any support or services from social services in the last 12 months." },
          { key: "life", label: "How carers are doing", lines: [l("Have little social contact", "#1D4ED8", "littleSocial"), l("Neglect themselves", "#C7871A", "neglecting"), l("Often or always lonely", "#9D174D", "lonely")], offset: 0.5, labelFn: yt, yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: y[0], to: last(y) + 1, note: "The share of carers who gave each answer. Loneliness was first asked in 2023 to 2024." },
        ]}
      />
      <Caution title="Who answers">The survey asks carers whom the council knows about, so it leaves out the many carers who have never been in touch with the council. The Census counts everyone who gives unpaid care, and found fewer carers in 2021 than in 2011 ({UNPAID.share}% of people against {UNPAID.shareBefore}%), which the ONS says may reflect changes during the pandemic and how the question was asked.</Caution>
    </Panel>
  );
}

export default function CareAdult({ onPick }) {
  return (
    <div>
      <Spend />
      <Who />
      <People />
      <Regions />
      <Carers />
      <p style={{ ...para, marginTop: 14 }}>See <button type="button" onClick={() => onPick("workers")} style={{ ...jump, marginTop: 0, padding: "4px 12px", fontSize: 13.5 }}>Care workers</button> for who provides the care, and what they are paid.</p>
    </div>
  );
}
