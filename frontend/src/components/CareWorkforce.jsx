import { BarRows, Caution, Panel, StackBars, Stats, TrendExplorer } from "./insight";
import { SOURCES } from "../data/care";
import { A, W, WYEAR, last, over65Rise, peakAt, premium, round } from "../lib/care";
import { ACCENT, group } from "../lib/careStyle";
import { para } from "../lib/insightStyle";

// Social care and childcare, the care workers toggle: how many people work in adult social care in England, how many posts are empty, how many leave,
// what they are paid, and how many more will be needed.

const wy = (y) => `${y} to ${String(y + 1).slice(2)}`;
const money = (v) => `£${v.toFixed(2)}`;

function Staff() {
  const f = W.filled;
  const vacPeak = peakAt(W.vacancy.all);
  const turnPeak = peakAt(W.turnover.all);
  const p = premium();
  return (
    <Panel id="h-cw-main" accent={ACCENT} title="Who provides the care" lead={`About ${(f.all / 1e6).toFixed(2)} million people hold paid posts in adult social care in England, in ${wy(WYEAR)}. Most work for private and voluntary providers that councils and individuals pay, not for councils themselves.`} sources={[SOURCES.workforce]}>
      <Stats
        accent={ACCENT}
        items={[
          { value: `${(f.all / 1e6).toFixed(2)} million`, label: "Filled posts", note: `${Math.round((f.independent / f.all) * 100)}% in the independent sector, ${Math.round((f.localAuthority / f.all) * 100)}% in councils, ${Math.round((f.directPayments / f.all) * 100)}% employed directly by people with direct payments` },
          { value: `${last(W.vacancy.all.values)}%`, label: "Of posts vacant", note: `${vacPeak.value}% at the highest, in ${wy(vacPeak.year)}`, spark: W.vacancy.all.values },
          { value: `${last(W.turnover.all.values)}%`, label: "Of staff left their job in the year", note: `${turnPeak.value}% in ${wy(turnPeak.year)}`, spark: W.turnover.all.values },
          { value: money(last(W.pay.independentCare)), label: "An hour for a care worker in the independent sector", note: `${p.pence}p (${p.pct}%) above the legal minimum of ${money(last(W.pay.minimum))}`, spark: W.pay.independentCare },
        ]}
      />
      <StackBars
        rows={[{ label: "Filled posts by type of service", text: `${(f.all / 1e6).toFixed(2)} million`, parts: [{ name: "Care at home", value: f.domiciliary, colour: ACCENT }, { name: "Care homes", value: f.residential, colour: "#C0561F" }, { name: "Community care", value: f.community, colour: "#1D4ED8" }, { name: "Day services", value: f.day, colour: "#9CA3AF" }] }]}
        label="Filled posts by service" format={(v) => `${Math.round(v / 1000)}k`}
        legend={[{ name: "Care at home", colour: ACCENT }, { name: "Care homes", colour: "#C0561F" }, { name: "Community care", colour: "#1D4ED8" }, { name: "Day services", colour: "#9CA3AF" }]}
      />
      <p style={para}>Care homes employ {group(f.residential)} people, care at home {group(f.domiciliary)}, community care services {group(f.community)}, and day services {group(f.day)}. The total counts posts, not people, and one person can hold more than one.</p>
    </Panel>
  );
}

function Trends() {
  const v = W.vacancy;
  const t = W.turnover;
  const pay = W.pay;
  return (
    <Panel id="h-cw-trend" title="Vacancies, leavers and pay" lead="Pick a measure. The shading on the charts shows who was in government, not what caused a change." accent={ACCENT} sources={[SOURCES.workforce]}>
      <TrendExplorer
        accent={ACCENT}
        options={[
          { key: "vacancy", label: "Vacancy rate", governments: true, lines: [{ name: "All posts", color: ACCENT, years: v.all.years, values: v.all.values }, { name: "Direct care workers", color: "#C0561F", years: v.care.years, values: v.care.values }], offset: 0.5, labelFn: (x) => wy(Math.floor(x)), yFormat: (n) => `${Math.round(n)}%`, captionFormat: (n) => `${n.toFixed(1)}%`, change: "pp", from: v.all.years[0], to: last(v.all.years) + 1, note: "The share of posts that were vacant at the time of the survey. It rose in 2021 to 2022 and has fallen since. Direct care workers do the hands-on caring." },
          { key: "turnover", label: "Leavers", governments: true, lines: [{ name: "All posts", color: ACCENT, years: t.all.years, values: t.all.values }, { name: "Direct care workers", color: "#C0561F", years: t.care.years, values: t.care.values }], offset: 0.5, labelFn: (x) => wy(Math.floor(x)), yFormat: (n) => `${Math.round(n)}%`, captionFormat: (n) => `${n.toFixed(1)}%`, change: "pp", from: t.all.years[0], to: last(t.all.years) + 1, note: "The share of staff who left their job in the year. It includes people who moved to another care job, so it is not the same as leaving the sector." },
          { key: "pay", label: "Pay against the minimum wage", governments: true, lines: [{ name: "Care worker in the independent sector", color: ACCENT, years: pay.years, values: pay.independentCare }, { name: "National Minimum or Living Wage", color: "#6B7280", years: pay.years, values: pay.minimum }], offset: 0.5, labelFn: (x) => wy(Math.floor(x)), yFormat: (n) => `£${n.toFixed(0)}`, captionFormat: (n) => `£${n.toFixed(2)}`, change: "percent", from: pay.years[0], to: last(pay.years) + 1, note: `The average hourly pay of direct care workers in the independent sector, against the legal minimum, in each year from April. The gap was ${Math.round((pay.independentCare[0] - pay.minimum[0]) * 100)}p in ${wy(pay.years[0])} and ${premium().pence}p in ${wy(last(pay.years))}.` },
        ]}
      />
    </Panel>
  );
}

function Demand() {
  const o = W.over65;
  const pr = W.projection;
  return (
    <Panel id="h-cw-need" title="How many more will be needed" lead={`More people will be aged 65 and over. People aged 65 and over are ${Math.round((A.during65 / A.duringTotal) * 100)}% of those who received long-term support from councils in the latest year.`} sources={[SOURCES.workforce]}>
      <BarRows
        label="People aged 65 and over in England, millions" accent={ACCENT} max={Math.max(...o.values)}
        rows={o.years.map((y, i) => ({ label: String(y), value: o.values[i], text: `${(o.values[i] / 1e6).toFixed(1)}m`, tone: i === 0 ? "#9CA3AF" : ACCENT }))}
      />
      <p style={para}>The number of people aged 65 and over in England is projected to rise by {over65Rise()}% between {o.years[0]} and {last(o.years)}. If the number of posts for each older person stayed as it is ({pr.olderPerPost} older people for each post), Skills for Care estimates the sector would need {group(pr.extra2040)} more posts by 2040, from {(pr.posts / 1e6).toFixed(2)} million to {(pr.y2040 / 1e6).toFixed(2)} million, a rise of {round((pr.extra2040 / pr.posts) * 100, 0)}%.</p>
      <Caution title="A projection, not a forecast">The estimate assumes that need and the way care is provided stay as they are, and counts posts for all adult social care, not just older people. Better health in later life, new technology, or a change in who is paid to care would change it.</Caution>
    </Panel>
  );
}

export default function CareWorkforce() {
  return (
    <div>
      <Staff />
      <Trends />
      <Demand />
    </div>
  );
}
