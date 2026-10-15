import { useRef, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING } from "../theme";
import { pillStyle } from "../lib/onsStyles";
import { PageHeader } from "./shared";
import { IconPulse } from "./icons";
import { BarRows, Caution, PageToggles, PairBars, Panel, Stats, Takeaways, TrendExplorer } from "./insight";
import RegionMetricMap from "./RegionMetricMap";
import { CHECKED, SOURCES, STANDARDS } from "../data/health";
import { CATEGORIES, TOTAL_BN } from "../data/publicSpending";
import { COMPARE_MEASURES, H, MAP_METRICS, NATIONAL, NHS_KEYS, NOW, SNAPSHOTS, YEAR_AGO, compareRanking, last, latest, low, nationalNow, nhsRegionName, peak, peakSince, periodText, regionStats, timeText } from "../lib/health";
import { para, strong } from "../lib/insightStyle";
import { ordinal } from "../lib/regionData";

// The NHS: how long people wait for hospital treatment and emergency care, where, what the NHS is staffed and paid for, how the UK
// compares, and the arguments. One page with a row of toggles; the address carries the toggle (/nhs/waiting).

const ACCENT = "#0F766E";
const li = { margin: "0 0 8px", paddingLeft: 2 };
const n = (v) => Math.round(v).toLocaleString("en-GB");
const millions = (v) => `${(v / 1e6).toFixed(2)} million`;

const TABS = [
  { key: "overview", label: "Overview", blurb: "The main figures, how they have changed, and how they compare with what the NHS aims for.", colour: "#0F766E" },
  { key: "waiting", label: "Waiting for treatment", blurb: "How many people wait for hospital treatment, how long, and how that differs across England.", colour: "#C0561F" },
  { key: "emergency", label: "Emergency and cancer care", blurb: "A&E, ambulances and cancer waits, against the standards the NHS sets itself.", colour: "#D6455D" },
  { key: "money", label: "People and money", blurb: "How many people work in the NHS, what is spent on health, and how the UK compares with other countries.", colour: "#1D4ED8" },
  { key: "arguments", label: "The arguments", blurb: "Funding, reform, the independent sector and prevention, set out fairly.", colour: "#C7871A" },
  { key: "about", label: "Sources", blurb: "Where each figure comes from and what it leaves out.", colour: "#6B7280" },
];
const KEYS = new Set(TABS.map((t) => t.key));
const parse = (param) => { const first = String(param ?? "").split("/")[0]; return KEYS.has(first) ? first : "overview"; };

const series = (key, scale = 1) => NATIONAL[key].values.map((v) => v / scale);
const line = (name, key, color, scale = 1) => ({ name, color, years: NATIONAL[key].times, values: series(key, scale) });
const base = (key) => ({ offset: 0, labelFn: timeText(key) });
const ref = (value, label) => [{ value, label }];

const monthsFrom = (key) => Math.floor(NATIONAL[key].times[0]);

function Overview({ onPick }) {
  const wl = latest("waitingList");
  const wlPeak = peak("waitingList");
  const w18 = latest("within18");
  const o52 = latest("over52");
  const o52Peak = peakSince("over52", 2020);
  const ae = latest("ae4h");
  const aeMajor = latest("ae4hMajor");
  const amb = latest("ambCat2");
  const c62 = latest("cancer62");
  const staff = latest("staff");
  const staffFirst = NATIONAL.staff.values[0];
  const regionPct = NHS_KEYS.map((k) => ({ name: nhsRegionName(k), v: regionStats(NOW, k).pct18 }));
  const hi = regionPct.reduce((a, r) => (r.v > a.v ? r : a));
  const lo = regionPct.reduce((a, r) => (r.v < a.v ? r : a));
  const improved = NHS_KEYS.filter((k) => regionStats(NOW, k).pct18 > regionStats(YEAR_AGO, k).pct18).length;
  const aeFirst = NATIONAL.ae4h.values[0];
  const link = { marginTop: 12, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink, background: "transparent", border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: "8px 16px", cursor: "pointer" };
  return (
    <div>
      <Takeaways
        accent={ACCENT}
        items={[
          `${millions(wl.value)} of waits for hospital treatment were open in ${periodText(wl.label)}, down from a peak of ${millions(wlPeak.value)} in ${periodText(wlPeak.label)}. ${w18.value}% of people waiting had waited less than 18 weeks, against a standard of ${STANDARDS.rtt18.value}%.`,
          `${n(o52.value)} people had waited over a year, down from ${n(o52Peak.value)} at the highest since the pandemic began, in ${periodText(o52Peak.label)}.`,
          `Waits differ across England. The share within 18 weeks was ${hi.v.toFixed(1)}% in ${hi.name} and ${lo.v.toFixed(1)}% in ${lo.name} in ${NOW.label}. It improved in ${improved} of the 7 NHS regions over the year.`,
          `In ${periodText(ae.label)}, ${ae.value.toFixed(1)}% of A&E patients were seen within four hours (standard ${STANDARDS.ae4.value}%), and ${aeMajor.value.toFixed(1)}% at major A&E departments. It was ${aeFirst.toFixed(0)}% in ${periodText(NATIONAL.ae4h.labels[0])}.`,
          `The average ambulance response to emergency calls was ${amb.value.toFixed(1)} minutes against a standard of ${STANDARDS.ambCat2.value}, and ${c62.value.toFixed(1)}% of cancer patients started treatment within 62 days of an urgent referral against a standard of ${STANDARDS.cancer62.value}%.`,
          `The NHS has ${(staff.value / 1000).toFixed(2)} million full-time equivalent staff, up from ${Math.round(staffFirst)} thousand in ${periodText(NATIONAL.staff.labels[0])}.`,
        ]}
      />

      <Panel id="h-hl-main" accent={ACCENT} title="The main figures" lead="The most recent month or quarter for each, with its trend. Waiting figures count people waiting for consultant-led hospital treatment in England. Other nations of the UK have their own health services." sources={[SOURCES.rtt, SOURCES.ae, SOURCES.ambulance, SOURCES.cancer]}>
        <Stats
          accent={ACCENT}
          items={[
            { value: millions(wl.value), label: "People waiting for hospital treatment", note: `${periodText(wl.label)}. Peak ${millions(wlPeak.value)}`, spark: NATIONAL.waitingList.values.slice(-120) },
            { value: `${w18.value}%`, label: "Waiting less than 18 weeks", note: `Standard ${STANDARDS.rtt18.value}%`, spark: NATIONAL.within18.values.slice(-120) },
            { value: `${ae.value.toFixed(1)}%`, label: "Seen in A&E within four hours", note: `Standard ${STANDARDS.ae4.value}%. ${periodText(ae.label)}`, spark: NATIONAL.ae4h.values.slice(-120) },
            { value: `${amb.value.toFixed(1)} min`, label: "Average ambulance response, emergencies", note: `Standard ${STANDARDS.ambCat2.value} minutes. ${periodText(amb.label)}`, spark: NATIONAL.ambCat2.values },
            { value: `${c62.value.toFixed(1)}%`, label: "Cancer treated within 62 days of urgent referral", note: `Standard ${STANDARDS.cancer62.value}%. ${periodText(c62.label)}`, spark: NATIONAL.cancer62.values },
            { value: `${(staff.value / 1000).toFixed(2)}m`, label: "Full-time equivalent NHS staff", note: periodText(staff.label), spark: NATIONAL.staff.values },
          ]}
        />
      </Panel>

      <Panel id="h-hl-trends" title="How things have changed" lead="Pick a measure. The shading on the longer ones shows who was in government, not what caused a change. The dashed line is the NHS standard." accent={ACCENT} sources={[SOURCES.rtt, SOURCES.ae, SOURCES.ambulance, SOURCES.cancer]}>
        <TrendExplorer
          accent={ACCENT}
          options={[
            { key: "list", label: "Waiting list", governments: true, lines: [line("People waiting", "waitingList", ACCENT, 1e6)], ...base("waitingList"), yFormat: (v) => `${v.toFixed(1)}m`, captionFormat: (v) => `${v.toFixed(2)} million`, change: "percent", from: monthsFrom("waitingList"), to: 2027, note: "Pathways waiting for consultant-led treatment in England at the end of each month, including estimates for trusts that did not report." },
            { key: "w18", label: "Within 18 weeks", governments: true, lines: [line("Share waiting less than 18 weeks", "within18", "#C0561F")], ...base("within18"), yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: monthsFrom("within18"), to: 2027, refLines: ref(STANDARDS.rtt18.value, `Standard ${STANDARDS.rtt18.value}%`), note: STANDARDS.rtt18.note },
            { key: "ae", label: "A&E four-hour wait", governments: true, lines: [line("All A&E", "ae4h", "#D6455D"), line("Major A&E departments", "ae4hMajor", "#7A5AF0")], ...base("ae4h"), yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: monthsFrom("ae4h"), to: 2027, refLines: ref(STANDARDS.ae4.value, `Standard ${STANDARDS.ae4.value}%`), note: STANDARDS.ae4.note },
            { key: "amb", label: "Ambulance response", lines: [line("Emergency calls (category 2)", "ambCat2", "#1D4ED8"), line("Life-threatening calls (category 1)", "ambCat1", "#C7871A")], ...base("ambCat2"), yFormat: (v) => `${Math.round(v)} min`, captionFormat: (v) => `${v.toFixed(1)} minutes`, change: "percent", from: 2017, to: 2027, refLines: ref(STANDARDS.ambCat2.value, `Standard ${STANDARDS.ambCat2.value} min`), note: STANDARDS.ambCat2.note },
            { key: "cancer", label: "Cancer treatment", lines: [line("Within 62 days of urgent referral", "cancer62", "#9D174D")], ...base("cancer62"), yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: 2022, to: 2027, refLines: ref(STANDARDS.cancer62.value, `Standard ${STANDARDS.cancer62.value}%`), note: STANDARDS.cancer62.note },
          ]}
        />
      </Panel>

      <Panel id="h-hl-standards" title="Where the NHS is against its standards" lead="Each bar pair is the latest figure and the standard the NHS works to. Closer is better. Some standards are far off, and a few are close." sources={[SOURCES.rtt, SOURCES.ae, SOURCES.cancer]}>
        <PairBars
          label="Latest figure against the NHS standard, percent" max={100}
          legend={[{ name: "Latest", colour: ACCENT }, { name: "Standard", colour: "#9CA3AF" }]}
          rows={[
            ["rtt18", "within18"], ["ae4", "ae4h"], ["cancer62", "cancer62"], ["cancer31", "cancer31"], ["cancer28", "cancer28"],
          ].map(([std, key]) => { const v = last(NATIONAL[key].values); const s = STANDARDS[std]; return { label: s.label, note: `${periodText(last(NATIONAL[key].labels))}. ${(s.value - v).toFixed(1)} points short`, bars: [{ name: "Latest", value: v, text: `${v.toFixed(1)}%`, colour: ACCENT }, { name: "Standard", value: s.value, text: `${s.value}%`, colour: "#9CA3AF" }] }; })}
        />
        <p style={para}>The ambulance standards are in minutes, not percentages: emergencies (category 2) average {amb.value.toFixed(1)} against {STANDARDS.ambCat2.value}, and life-threatening calls (category 1) {last(NATIONAL.ambCat1.values).toFixed(1)} against {STANDARDS.ambCat1.value}.</p>
        <button type="button" onClick={() => onPick("waiting")} style={link}>See waits by region</button>
      </Panel>
    </div>
  );
}

const MAP_SOURCES = { source: SOURCES.rtt };
const METRICS = MAP_METRICS.map((m) => ({ ...m, ...MAP_SOURCES }));

function Waiting() {
  const [selected, setSelected] = useState(null);
  const nat = nationalNow();
  const rows = NHS_KEYS.map((k) => ({ k, name: nhsRegionName(k), now: regionStats(NOW, k), ago: regionStats(YEAR_AGO, k) }));
  const byPct = [...rows].sort((a, b) => b.now.pct18 - a.now.pct18);
  const colours = ["#C4B5FD", "#A78BFA", "#7C5CE0", "#0F766E"];
  return (
    <div>
      <RegionMetricMap
        id="h-hw-map" title="Where the waits are" lead={`Waits for consultant-led treatment in each of the seven NHS England regions in ${NOW.label}. Pick a measure, and tap a place to see it on all of them. Scotland, Wales and Northern Ireland run their own services and count waits differently, so they are left blank.`}
        metrics={METRICS} defaultMetric="within18" selected={selected} onSelect={setSelected}
        tapNote="Tap a place on the map, or a name in the list below, to see its waits on every measure. NHS England regions join some regions of the map, so places in the same NHS region show the same figure."
      />

      <Panel id="h-hw-change" title="Has it improved where you live?" lead={`The share of people waiting who have waited less than 18 weeks, in the same month of each year, for each NHS region. Longer bars are better; the standard is ${STANDARDS.rtt18.value}%.`} sources={[SOURCES.rtt]}>
        <PairBars
          label="Share within 18 weeks, by NHS region, in August of each year" max={100}
          legend={SNAPSHOTS.map((s, i) => ({ name: `August ${s.year}`, colour: colours[i] }))}
          rows={byPct.map((r) => ({ label: r.name, note: `${(r.now.pct18 - r.ago.pct18 >= 0 ? "Up " : "Down ")}${Math.abs(r.now.pct18 - r.ago.pct18).toFixed(1)} points on a year`, bars: SNAPSHOTS.map((s, i) => { const v = regionStats(s, r.k).pct18; return { name: `August ${s.year}`, value: v, text: `${v.toFixed(1)}%`, colour: colours[i] }; }) }))}
        />
        <p style={para}>
          Across England {nat.pct18}% had waited less than 18 weeks in {NOW.label}, {nat.pct18 - SNAPSHOTS[0].national.within18 / SNAPSHOTS[0].national.pathways * 100 > 0 ? "up" : "down"} from {(SNAPSHOTS[0].national.within18 / SNAPSHOTS[0].national.pathways * 100).toFixed(1)}% in August {SNAPSHOTS[0].year}. People waiting over a year fell from {n(SNAPSHOTS[0].national.over52)} to {n(nat.over52)} over the same three years.
        </p>
        <Caution title="What the regional figures are">These are the waiting lists as hospitals reported them, in the NHS England regions, so they leave out the estimates NHS England adds for trusts that did not report. That is why England's total here ({n(nat.pathways)}) is a little lower than the headline figure of {millions(latest("waitingList").value)} elsewhere on this page. A small number of pathways are not assigned to a region, so the seven regions add up to a little less than England, and a region with a large specialist hospital can see patients from elsewhere.</Caution>
      </Panel>

      <Panel id="h-hw-long" title="The longer story" lead="The waiting list in England since 2007, and how long people have waited. Shading shows who was in government, not what caused a change." sources={[SOURCES.rtt]}>
        <TrendExplorer
          accent={ACCENT}
          options={[
            { key: "list", label: "People waiting", governments: true, lines: [line("People waiting", "waitingList", ACCENT, 1e6)], ...base("waitingList"), yFormat: (v) => `${v.toFixed(1)}m`, captionFormat: (v) => `${v.toFixed(2)} million`, change: "percent", from: monthsFrom("waitingList"), to: 2027, note: `The list fell to a low of ${(low("waitingList").value / 1e6).toFixed(2)} million in ${periodText(low("waitingList").label)}, then rose, climbing fastest after 2020 when routine care was disrupted by the pandemic, to a peak of ${(peak("waitingList").value / 1e6).toFixed(2)} million in ${periodText(peak("waitingList").label)}.` },
            { key: "over52", label: "Waiting over a year", governments: true, lines: [line("Waiting more than 52 weeks", "over52", "#D6455D", 1000)], ...base("over52"), yFormat: (v) => `${Math.round(v)}k`, captionFormat: (v) => `${Math.round(v)},000`, change: "percent", from: monthsFrom("over52"), to: 2027, note: "People who have waited more than 52 weeks, in thousands." },
            { key: "median", label: "Typical wait", governments: true, lines: [line("Median wait so far, weeks", "median", "#1D4ED8")], ...base("median"), yFormat: (v) => `${Math.round(v)}`, captionFormat: (v) => `${v.toFixed(1)} weeks`, change: "percent", from: monthsFrom("median"), to: 2027, note: "The middle wait so far of people still on the list, in weeks." },
          ]}
        />
      </Panel>
    </div>
  );
}

function Emergency() {
  return (
    <div>
      <Panel id="h-he-ae" accent="#D6455D" title="A&E" lead="The share of people at A&E who are admitted, transferred or discharged within four hours of arriving. Major A&E departments are the large, 24-hour units, which have the longest waits." sources={[SOURCES.ae]}>
        <TrendExplorer
          accent="#D6455D"
          options={[
            { key: "ae", label: "Within four hours", governments: true, lines: [line("All A&E", "ae4h", "#D6455D"), line("Major A&E departments", "ae4hMajor", "#7A5AF0")], ...base("ae4h"), yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: monthsFrom("ae4h"), to: 2027, refLines: ref(STANDARDS.ae4.value, `Standard ${STANDARDS.ae4.value}%`), note: `${STANDARDS.ae4.note} The shading shows who was in government, not what caused a change.` },
          ]}
        />
      </Panel>

      <Panel id="h-he-amb" title="Ambulances" lead="The average time for an ambulance to reach people in each category of call. Category 1 is life-threatening injuries and illnesses. Category 2 is emergencies such as stroke and chest pain." sources={[SOURCES.ambulance]}>
        <TrendExplorer
          accent="#1D4ED8"
          options={[
            { key: "c2", label: "Emergency calls (category 2)", lines: [line("Average response, minutes", "ambCat2", "#1D4ED8")], ...base("ambCat2"), yFormat: (v) => `${Math.round(v)} min`, captionFormat: (v) => `${v.toFixed(1)} minutes`, change: "percent", from: 2017, to: 2027, refLines: ref(STANDARDS.ambCat2.value, `Standard ${STANDARDS.ambCat2.value} min`), note: STANDARDS.ambCat2.note },
            { key: "c1", label: "Life-threatening calls (category 1)", lines: [line("Average response, minutes", "ambCat1", "#C7871A")], ...base("ambCat1"), yFormat: (v) => `${Math.round(v)} min`, captionFormat: (v) => `${v.toFixed(1)} minutes`, change: "percent", from: 2017, to: 2027, refLines: ref(STANDARDS.ambCat1.value, `Standard ${STANDARDS.ambCat1.value} min`), note: STANDARDS.ambCat1.note },
          ]}
        />
      </Panel>

      <Panel id="h-he-cancer" title="Cancer" lead="Three measures of how quickly cancer is diagnosed and treated in England. The figures start in 2021 and 2022, when NHS England changed how it reports them." sources={[SOURCES.cancer]}>
        <TrendExplorer
          accent="#9D174D"
          options={[
            { key: "c62", label: "Treatment within 62 days", lines: [line("Within 62 days of urgent referral", "cancer62", "#9D174D")], ...base("cancer62"), yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: 2022, to: 2027, refLines: ref(STANDARDS.cancer62.value, `Standard ${STANDARDS.cancer62.value}%`), note: `${STANDARDS.cancer62.label}. ${STANDARDS.cancer62.note}` },
            { key: "c31", label: "Treatment within 31 days", lines: [line("Within 31 days of the decision to treat", "cancer31", "#0F766E")], ...base("cancer31"), yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: 2022, to: 2027, refLines: ref(STANDARDS.cancer31.value, `Standard ${STANDARDS.cancer31.value}%`), note: `${STANDARDS.cancer31.label}. ${STANDARDS.cancer31.note}` },
            { key: "c28", label: "Diagnosis within 28 days", lines: [line("Diagnosed or ruled out within 28 days", "cancer28", "#C0561F")], ...base("cancer28"), yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: 2021, to: 2027, refLines: ref(STANDARDS.cancer28.value, `Target ${STANDARDS.cancer28.value}%`), note: `${STANDARDS.cancer28.label}. ${STANDARDS.cancer28.note}` },
          ]}
        />
        <Caution title="What these cannot show">Waiting times measure speed, not the quality of care or whether people survive. Cancer survival is measured separately, and a speedy diagnosis helps but is not the only thing that matters.</Caution>
      </Panel>
    </div>
  );
}

function Money() {
  const [measure, setMeasure] = useState("spendGdp");
  const m = COMPARE_MEASURES[measure];
  const rows = compareRanking(measure);
  const ukRank = rows.findIndex((r) => r.code === "GBR") + 1;
  const staff = latest("staff");
  const sick = latest("longTermSick");
  const healthCat = CATEGORIES.find((c) => c.key === "health");
  const uk = H.compare.GBR;
  const de = H.compare.DEU;
  return (
    <div>
      <Panel id="h-hm-staff" accent="#1D4ED8" title="Who works in the NHS" lead="Full-time equivalent staff across the NHS in the UK, each quarter. Part-time staff count as part of a full-time job." sources={[SOURCES.staff]}>
        <TrendExplorer
          accent="#1D4ED8"
          options={[
            { key: "staff", label: "NHS staff", governments: true, lines: [line("Full-time equivalent staff, thousands", "staff", "#1D4ED8")], ...base("staff"), yFormat: (v) => `${Math.round(v / 100) / 10}m`, captionFormat: (v) => `${Math.round(v).toLocaleString("en-GB")},000`, change: "percent", from: 1999, to: 2027, note: "The count rose in the 2000s, was roughly flat between 2010 and 2014 and has risen every year since. It includes all NHS staff in the UK, clinical and support. The shading shows who was in government, not what caused a change." },
            { key: "sick", label: "Long-term sickness", lines: [line("Share of the economically inactive who are long-term sick", "longTermSick", "#C0561F")], ...base("longTermSick"), yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: 1993, to: 2027, note: "Of people aged 16 to 64 who are not working and not looking for work, the share who say it is because of long-term sickness. A rise means more people out of work for health reasons." },
          ]}
        />
        <p style={para}>There are {(staff.value / 1000).toFixed(2)} million full-time equivalent staff in {periodText(staff.label)}. {sick.value}% of working-age adults who are out of the workforce say it is because of long-term sickness, as of {periodText(sick.label)}.</p>
      </Panel>

      <Panel id="h-hm-money" title="What the country spends on health" lead="Health was the second-largest item of the government's planned spending in 2025-26, after welfare and pensions. This is a count of the government's spending, in the Office for Budget Responsibility's guide to the public finances." sources={[SOURCES.obr]}>
        <Stats
          accent="#1D4ED8"
          items={[
            { value: `£${healthCat.amountBn}bn`, label: "Planned health spending in 2025-26", note: `${Math.round((healthCat.amountBn / TOTAL_BN) * 100)}% of the £${TOTAL_BN.toLocaleString("en-GB")}bn the government planned to spend` },
            { value: `${uk.spendGdp.value}%`, label: "Of the economy, all health spending", note: `${uk.spendGdp.year}, public and private together, from the WHO` },
            { value: `$${Math.round(uk.spendPerHead.value).toLocaleString("en-GB")}`, label: "Per person, in international dollars", note: `${uk.spendPerHead.year}. Germany $${Math.round(de.spendPerHead.value).toLocaleString("en-GB")}` },
          ]}
        />
        <p style={para}>The first figure is government spending alone, from the OBR. The other two count all spending on health in the UK, public and private, and come from the World Health Organization, so they are not the same thing.</p>
      </Panel>

      <Panel id="h-hm-compare" title="How the UK compares" lead={`${m.blurb} The countries are in order, highest first, with the latest year the World Bank has for each.`} sources={[SOURCES.worldBank]}>
        <div role="group" aria-label="Measure" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {Object.entries(COMPARE_MEASURES).map(([k, x]) => <button key={k} type="button" aria-pressed={k === measure} onClick={() => setMeasure(k)} style={pillStyle(k === measure)}>{x.label}</button>)}
        </div>
        <BarRows
          label={`${m.label}, by country`} accent="#9CA3AF" max={rows[0].value}
          rows={rows.map((r) => ({ label: r.name, note: String(r.year), value: r.value, text: m.format(r.value), tone: r.code === "GBR" ? ACCENT : "#9CA3AF", strong: r.code === "GBR" }))}
        />
        <p style={para}>The UK is {ordinal(ukRank)} of {rows.length} countries on this measure, at {m.format(rows.find((r) => r.code === "GBR").value)}. The highest is {rows[0].name} ({m.format(rows[0].value)}) and the lowest {rows.at(-1).name} ({m.format(rows.at(-1).value)}).</p>
        <Caution title="Different years and definitions">Each figure is the latest the World Bank holds, which is not the same year for every country. Health spending counts private spending as well as public, so a high figure can reflect people paying for care as well as a well-funded service. Countries also count doctors, nurses and beds a little differently, and having more of something is not the same as better care.</Caution>
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
  const rankOf = (m) => { const r = compareRanking(m); return { rank: r.findIndex((x) => x.code === "GBR") + 1, of: r.length }; };
  const uk = H.compare.GBR;
  const others = ["FRA", "DEU", "CAN"].map((c) => H.compare[c]);
  const wl = latest("waitingList");
  const wl07 = NATIONAL.waitingList.values[0];
  const staffNow = latest("staff").value;
  const staffFirst = NATIONAL.staff.values[0];
  return (
    <div>
      <Panel id="h-ha-intro" accent={ACCENT} title="The arguments" lead="Figures show how long people wait and how much is spent. They cannot settle how much the NHS should cost or who should provide care, which depends on values as well as evidence. These are the arguments people make, not our view." />
      <Arg
        id="h-ha-money" title="Does the NHS need more money?"
        shows={`The UK spent ${uk.spendGdp.value}% of its economy on health in ${uk.spendGdp.year}, against ${others.map((o) => `${o.spendGdp.value}% in ${o.name}`).join(", ")}. Per person it was $${Math.round(uk.spendPerHead.value).toLocaleString("en-GB")} against $${Math.round(others[1].spendPerHead.value).toLocaleString("en-GB")} in Germany. Among ${rankOf("beds").of} countries the UK is ${ordinal(rankOf("beds").rank)} for hospital beds per person (${uk.beds.value}), ${ordinal(rankOf("doctors").rank)} of ${rankOf("doctors").of} for doctors (${uk.doctors.value} per 1,000) and ${ordinal(rankOf("nurses").rank)} of ${rankOf("nurses").of} for nurses and midwives (${uk.nurses.value}), counting from the highest.`}
        sLabel="People who want more money say" cLabel="People who want it spent differently say"
        supporters={["An older population and more people with long-term conditions need more care, and the UK has fewer hospital beds and doctors for its size than most comparable countries. They say the NHS also needs investment in its buildings and equipment, which they argue holds back how many patients it can treat."]}
        critics={["More has been spent each year, and the NHS has more staff than ever, yet waits are longer than in 2007. So they argue the main problem is how the money is used, such as how many patients each hospital treats, rather than the amount. Spending more without change, they say, buys less than it should."]}
        sources={[SOURCES.worldBank, SOURCES.obr]}
      />
      <Arg
        id="h-ha-reform" title="Is the problem the size of the service or how it works?"
        shows={`NHS staff rose from ${Math.round(staffFirst)},000 to ${Math.round(staffNow).toLocaleString("en-GB")},000 full-time equivalents since ${periodText(NATIONAL.staff.labels[0])}. The waiting list was ${millions(wl07)} in ${periodText(NATIONAL.waitingList.labels[0])} and ${millions(wl.value)} in ${periodText(wl.label)}.`}
        sLabel="People who want reform say" cLabel="People who want it protected as it is say"
        supporters={["Technology, shorter stays, treating more people in the community, and spreading out the work between hospitals could deliver more care with the same staff. Waiting lists are partly about how patients move through the hospital, not only about how many beds there are."]}
        critics={["Staff are stretched, and many leave. Cutting cost or changing structures again, after past reorganisations, takes years and can reduce care. The pandemic left a backlog that takes time to clear, and the way to reduce it is to train and keep staff and open more capacity."]}
        sources={[SOURCES.rtt, SOURCES.staff]}
      />
      <Arg
        id="h-ha-private" title="What role should independent providers have?"
        shows="The waiting-list figures count people waiting for NHS-funded treatment, whether it is carried out in an NHS hospital or by an independent provider paid by the NHS. They do not count people who pay for private treatment themselves."
        sLabel="People who want more use of independent providers say" cLabel="People who are wary of it say"
        supporters={["Using spare capacity in independent hospitals can cut waits quickly, and patients are still treated free at the point of use. Competition and choice can push up quality."]}
        critics={["Independent providers tend to take simpler, more profitable cases and rely on NHS staff trained at public expense, which can leave the NHS with the harder, costlier work. Money spent there is not spent building NHS capacity."]}
        sources={[SOURCES.rtt]}
      />
      <Arg
        id="h-ha-prevention" title="Should more go on prevention and social care?"
        shows={`${latest("longTermSick").value}% of working-age adults who are out of the workforce say it is because of long-term sickness (${periodText(latest("longTermSick").label)}), up from ${low("longTermSick").value}% in ${periodText(low("longTermSick").label)}.`}
        sLabel="People who want a shift towards prevention say" cLabel="People who want the focus on treatment say"
        supporters={["Stopping illness is cheaper than treating it, and people stuck in hospital for want of social care or home support take up beds that others need. Public health and care in the community should be funded more."]}
        critics={["Prevention pays back over decades, while people are waiting now, so the money has to go to treatment first. Some preventive programmes have weak evidence of savings, and funding them from the NHS budget could leave less for care."]}
        sources={[SOURCES.sick]}
      />
    </div>
  );
}

function About() {
  return (
    <div>
      <Panel id="h-hx-src" title="Where the figures come from" lead={`Checked on ${CHECKED}. The charts read from NHS England, ONS and World Bank data saved on ${H.built}.`}>
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          {Object.values(SOURCES).map((s) => (
            <li key={s.url} style={li}><a href={s.url} target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontFamily: FONT_BODY, fontWeight: 600 }}>{s.label}<span className="sr-only"> (opens in a new tab)</span></a></li>
          ))}
        </ul>
      </Panel>
      <Panel id="h-hx-limits" title="What to bear in mind">
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          <li style={li}><strong style={strong}>England.</strong> Waiting-time, A&E, ambulance and cancer figures are for England. Scotland, Wales and Northern Ireland run their own health services and measure waits differently, so they cannot be set side by side. NHS staff figures are for the UK.</li>
          <li style={li}><strong style={strong}>Pathways, not people.</strong> A waiting list counts open pathways, and one person can have more than one. The headline list includes estimates for trusts that did not report. The regional figures do not, so they are a little lower.</li>
          <li style={li}><strong style={strong}>Measures of speed.</strong> Waiting times say nothing about the quality of care or outcomes such as survival.</li>
          <li style={li}><strong style={strong}>International comparisons.</strong> Health spending counts public and private spending, and the latest year differs by country. More doctors or beds is not by itself better care.</li>
          <li style={li}><strong style={strong}>Standards change.</strong> The targets shown, such as the 65% interim target for March 2026, are as NHS England set them and can be revised.</li>
          <li style={li}><strong style={strong}>Not covered.</strong> Social care, mental health waits in detail, GP appointments, dentistry, and the quality and safety of care.</li>
        </ul>
      </Panel>
    </div>
  );
}

export default function Nhs({ param }) {
  const [tab, setTab] = useState(() => parse(param));
  const [seen, setSeen] = useState(param);
  const ref = useRef(null);
  if (param !== seen) { setSeen(param); setTab(parse(param)); }
  function go(next) {
    const moved = next !== tab;
    setTab(next);
    window.history.replaceState(null, "", next === "overview" ? "#/nhs" : `#/nhs/${next}`);
    if (moved && ref.current && ref.current.getBoundingClientRect().top < 0) ref.current.scrollIntoView({ block: "start" });
  }
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={IconPulse} kicker="Britain in numbers" title="The NHS" subtitle="How long people wait for hospital treatment, emergency and cancer care, where waits are longest, who works in the NHS and what the country spends, how the UK compares, and the arguments about it." />
      <div ref={ref} style={{ scrollMarginTop: 12 }}>
        <PageToggles tabs={TABS} current={tab} onPick={go} label="What to look at" idPrefix="hl" />
      </div>
      <div key={tab} className="ge-fade" role="tabpanel" id="hl-panel" aria-labelledby={`hl-tab-${tab}`}>
        {tab === "overview" && <Overview onPick={go} />}
        {tab === "waiting" && <Waiting />}
        {tab === "emergency" && <Emergency />}
        {tab === "money" && <Money />}
        {tab === "arguments" && <Arguments />}
        {tab === "about" && <About />}
      </div>
    </div>
  );
}
