import { useState } from "react";
import { Caution, PairBars, Panel, Stats, TrendExplorer } from "./insight";
import RegionMetricMap from "./RegionMetricMap";
import { ENTITLEMENT, PARENTS, SOURCES } from "../data/care";
import { CHILD_MAP_METRICS, K, KYEAR, kAt, kLast } from "../lib/care";
import { ACCENT, group } from "../lib/careStyle";
import { para } from "../lib/insightStyle";

// Social care and childcare, the childcare toggle: how many children have funded early education and childcare, how many take it up and where, what parents
// say about use, cost and quality, and the providers.

const wp = K.working;
const line = (name, color, years, values) => ({ name, color, years, values });
const idxFrom = (y) => K.years.indexOf(y);
const from = (series, y) => series.slice(idxFrom(y));
const yearsFrom = (y) => K.years.slice(idxFrom(y));
const labelOf = (t) => `January ${Math.floor(t)}`;

function Funded() {
  const uni = K.universal;
  const two = K.twoYearOlds;
  return (
    <Panel id="h-cc-main" accent={ACCENT} title="Funded early education and childcare" lead={`In England, working parents of children from ${ENTITLEMENT.from} up to the age of school can get up to ${ENTITLEMENT.hours} hours a week, for ${ENTITLEMENT.weeks} weeks a year, of funded childcare, if they are working and earning above a minimum amount, and neither earns over £${group(ENTITLEMENT.maxIncome)} a year. All 3 and 4 year olds get 15 hours, and some 2 year olds from families on low incomes do too. These are the children registered for those places in January ${KYEAR}.`} sources={[SOURCES.funded, SOURCES.workingParents]}>
      <Stats
        accent={ACCENT}
        items={[
          { value: `${(kLast(K.registered) / 1e6).toFixed(2)} million`, label: "Children with a funded place, January", note: `${kLast(K.shareOfAll)}% of all children aged 9 months to 4 years. ${(kAt(K.registered, 2024) / 1e6).toFixed(2)} million in January 2024` },
          { value: group(kLast(wp.registered)), label: "Children of working parents", note: `${kLast(wp.takeUp)}% of the ${group(kLast(wp.eligible))} estimated to be eligible. ${group(kAt(wp.registered, 2024))} in January 2024 when only 3 and 4 year olds were covered`, spark: from(wp.registered, 2018) },
          { value: `${kLast(uni.takeUp)}%`, label: "Of 3 and 4 year olds take their universal hours", note: `${kAt(uni.takeUp, 2018)}% in 2018`, spark: from(uni.takeUp, 2012) },
          { value: `${kLast(two.takeUp)}%`, label: "Of eligible 2 year olds on low incomes take the hours", note: `${kAt(two.takeUp, 2015)}% in 2015. ${group(kLast(two.registered))} children`, spark: from(two.takeUp, 2015) },
        ]}
      />
      <TrendExplorer
        accent={ACCENT}
        options={[
          { key: "children", label: "Children with funded places", lines: [line("3 and 4 year olds, universal hours", ACCENT, yearsFrom(2012), from(uni.registered, 2012).map((v) => v / 1e6)), line("Children of working parents", "#C0561F", yearsFrom(2018), from(wp.registered, 2018).map((v) => v / 1e6)), line("2 year olds on low incomes", "#1D4ED8", yearsFrom(2015), from(two.registered, 2015).map((v) => v / 1e6))], offset: 0, labelFn: labelOf, yFormat: (v) => `${v.toFixed(1)}m`, captionFormat: (v) => `${v.toFixed(2)} million`, change: "percent", from: 2012, to: KYEAR + 1, note: "Children registered for each kind of funded place in January. A child can be in more than one group, so the groups cannot be added up. The jump in children of working parents in 2025 is when the offer was extended to children under 3." },
          { key: "takeup", label: "Take-up", lines: [line("3 and 4 year olds, universal hours", ACCENT, yearsFrom(2012), from(uni.takeUp, 2012)), line("Children of working parents", "#C0561F", yearsFrom(2018), from(wp.takeUp, 2018)), line("2 year olds on low incomes", "#1D4ED8", yearsFrom(2015), from(two.takeUp, 2015))], offset: 0, labelFn: labelOf, yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: 2012, to: KYEAR + 1, note: "The share of children estimated to be eligible who are registered for the place, in January. Eligible numbers for working parents are rounded estimates by the department." },
          { key: "providers", label: "Providers", lines: [line("Providers delivering funded places", ACCENT, yearsFrom(2018), from(K.providers, 2018))], offset: 0, labelFn: labelOf, yFormat: (v) => `${Math.round(v / 1000)}k`, captionFormat: (v) => group(v), change: "percent", from: 2018, to: KYEAR + 1, note: "Nurseries, schools, childminders and other providers that deliver funded places. Childminders delivering them rose in 2025 with the new entitlements." },
          { key: "staff", label: "Staff", lines: [line("Staff", "#7A5AF0", yearsFrom(2018), from(K.staff, 2018))], offset: 0, labelFn: labelOf, yFormat: (v) => `${Math.round(v / 1000)}k`, captionFormat: (v) => group(v), change: "percent", from: 2018, to: KYEAR + 1, note: "Staff working in the early years settings that took part in the department's count, which covers providers delivering funded places." },
        ]}
      />
    </Panel>
  );
}

function Regions() {
  const [selected, setSelected] = useState(null);
  return (
    <RegionMetricMap
      id="h-cc-map" title="Where take-up is highest" lead={`How many children take up funded hours in each region of England in January ${KYEAR}. Pick a measure, and tap a region to see it on all of them. Wales, Scotland and Northern Ireland have their own schemes and are not in these figures.`}
      metrics={CHILD_MAP_METRICS.map((m) => ({ ...m, source: SOURCES.funded }))} defaultMetric="universal" selected={selected} onSelect={setSelected}
      tapNote="Tap a region on the map, or a name in the list below, to see it on every measure. Places outside England have no figure."
    />
  );
}

function Parents() {
  const p = PARENTS;
  const rows = [
    ["Children aged 0 to 4 using formal childcare", p.formalUseAge04Before, p.formalUseAge04, "The share of children, in any week of the survey period"],
    ["Children aged 1 using formal childcare", p.formalUseAge1Before, p.formalUseAge1, `The highest since ${p.formalUseAge1EarlierYear} (${p.formalUseAge1Earlier}%)`],
    ["Parents rating local affordability good", p.affordabilityGoodBefore, p.affordabilityGood, "Parents of children aged 0 to 4, rating it very or fairly good"],
    ["Paying parents who find costs easy to meet", p.easyToMeetCostBefore, p.easyToMeetCost, "Families with children aged 0 to 4 who pay for childcare"],
    ["Paying parents who find costs difficult", p.difficultToMeetCostBefore, p.difficultToMeetCost, "The same families, finding it difficult or very difficult"],
  ].map(([label, before, now, note]) => ({ label, note, bars: [{ name: "2024", value: before, text: `${before}%`, colour: "#9CA3AF" }, { name: "2025", value: now, text: `${now}%`, colour: ACCENT }] }));
  return (
    <Panel id="h-cc-parents" title="What parents say" lead={`Interviews with ${group(p.sample)} parents of children aged 0 to 14 in England between April and December 2025, for the Department for Education. The figures are shares of parents or children, with the change on 2024.`} sources={[SOURCES.parents]}>
      <PairBars label="Use of childcare and how parents find the cost, 2024 and 2025, percent" max={100} legend={[{ name: "2024", colour: "#9CA3AF" }, { name: "2025", colour: ACCENT }]} rows={rows} />
      <Stats
        accent={ACCENT}
        items={[
          { value: `£${p.weeklyPaidAge02}`, label: "Median a week paid to formal providers, children aged 0 to 2", note: `£${p.weeklyPaidAge02Before} in 2024, before the new entitlements` },
          { value: `${p.hoursAge2} hours`, label: "Median a week in formal childcare, age 2", note: `${p.hoursAge2Before} hours in 2024. All children aged 0 to 4: ${p.hoursAge04} hours` },
          { value: `${p.qualityGood}%`, label: "Rate the quality of local childcare as good", note: `${p.qualityGoodBefore}% in 2024` },
        ]}
      />
      <p style={para}>
        Among parents who knew about the funded hours, {p.extrasAware}% knew that providers could charge for extra services, and {p.extrasStoppedApply}% said this had stopped them applying to a provider. If the offer for children from 9 months up to 2 did not exist, {p.fewerHoursWithoutUnder2}% of working parents said they would work fewer hours, and if the offer for 2 year olds did not exist, {p.fewerHoursWithoutAge2}% (it was {p.fewerHoursWithoutAge2Before}% in 2024).
      </p>
      <Caution title="A survey, and a year of change">These are answers from a sample of parents, so each figure has a margin of error, and the department says it comments only on changes that are statistically significant. The fall in what parents paid coincides with the new entitlements, but the survey cannot show everything that changed.</Caution>
    </Panel>
  );
}

export default function CareChildcare() {
  return (
    <div>
      <Funded />
      <Regions />
      <Parents />
      <p style={{ ...para, marginTop: 14 }}>Take-up is of places that are funded, not of childcare in general: parents also use care they pay for in full, from relatives, and outside the funded hours.</p>
    </div>
  );
}
