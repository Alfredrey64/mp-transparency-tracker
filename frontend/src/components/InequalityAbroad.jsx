import { useState } from "react";
import { COLORS, FONT_BODY } from "../theme";
import { pillStyle } from "../lib/onsStyles";
import { BarRows, Caution, PairBars, Panel, Stats, Takeaways, TimeChart } from "./insight";
import { A, MEASURES, RECENT_FROM, UK, mean, pickable, ranking, redistribution, redistributionRanking } from "../lib/inequalityAbroad";
import { D, last } from "../lib/inequality";
import { SOURCES } from "../data/inequality";
import { para, strong, toPoints, yearLabel } from "../lib/insightStyle";

// The UK against other countries: how unequal incomes are after and before tax and benefits, how much tax and benefits do, and how it has changed.
// Every figure is the OECD's, which measures every country the same way, so countries can be compared with each other (and the UK with them).

const ACCENT = "#7A5AF0";
const PALETTE = ["#0F766E", "#1D4ED8", "#C7871A", "#D6455D", "#7A5AF0", "#C0561F", "#0E9AA7", "#9D174D", "#4D7C0F", "#6B7280", "#B45309", "#374151", "#BE185D", "#047857", "#4338CA"];
const DEFAULT_PICK = ["GBR", "DEU", "ITA", "USA"];
const MAX_PICKED = 6;
const ordinal = (n) => { const s = ["th", "st", "nd", "rd"]; const v = n % 100; return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`; };

const OPTIONS = pickable();
const colourOf = (code) => PALETTE[Math.max(0, OPTIONS.findIndex((o) => o.code === code)) % PALETTE.length];

function Ranking() {
  const [measure, setMeasure] = useState("gini");
  const [membersOnly, setMembersOnly] = useState(true);
  const m = MEASURES[measure];
  const rows = ranking(measure, { membersOnly });
  const ukIndex = rows.findIndex((r) => r.code === UK);
  const top = rows[0];
  return (
    <Panel
      id="h-abroad-rank" accent={ACCENT} title="How the UK compares"
      lead={`${m.blurb} Countries are in order, most unequal first, and only countries with a figure from ${RECENT_FROM} or later are shown.`}
      sources={[SOURCES.oecd]}
    >
      <div role="group" aria-label="Measure" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        {Object.entries(MEASURES).map(([k, x]) => <button key={k} type="button" aria-pressed={k === measure} onClick={() => setMeasure(k)} style={pillStyle(k === measure)}>{x.label}</button>)}
      </div>
      <div role="group" aria-label="Which countries" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        <button type="button" aria-pressed={membersOnly} onClick={() => setMembersOnly(true)} style={pillStyle(membersOnly)}>OECD members</button>
        <button type="button" aria-pressed={!membersOnly} onClick={() => setMembersOnly(false)} style={pillStyle(!membersOnly)}>Also Brazil, China, India and others</button>
      </div>
      <BarRows
        label={`${m.label}, ${m.unit}, by country`} accent="#9CA3AF" max={top.value}
        rows={rows.map((r) => ({ label: r.name, note: r.year === 2023 ? undefined : String(r.year), value: r.value, text: m.format(r.value), tone: r.code === UK ? ACCENT : "#9CA3AF", strong: r.code === UK }))}
      />
      <p style={para}>
        On this measure the UK is the <strong style={strong}>{ordinal(ukIndex + 1)} most unequal</strong> of {rows.length} countries, with {m.format(rows[ukIndex].value)} in {rows[ukIndex].year}. {measure === "poverty" ? "" : `The most equal is ${rows.at(-1).name}, with ${m.format(rows.at(-1).value)}.`} Most figures are for 2023. Where a country's latest is older, the year is shown under its name.
      </p>
    </Panel>
  );
}

const FAMILIAR = ["GBR", "FRA", "DEU", "ITA", "ESP", "NLD", "SWE", "DNK", "FIN", "IRL", "POL", "USA", "CAN", "JPN"];

function Redistribution() {
  const [showAll, setShowAll] = useState(false);
  const everyone = redistributionRanking();
  const rows = showAll ? everyone : everyone.filter((r) => FAMILIAR.includes(r.code));
  const uk = redistribution(UK);
  const others = everyone.filter((r) => r.code !== UK);
  const avgCut = mean(others.map((r) => r.cut));
  const avgMarket = mean(others.map((r) => r.market));
  const ukRank = everyone.findIndex((r) => r.code === UK) + 1;
  const byMarket = [...everyone].sort((a, b) => b.market - a.market);
  const marketRank = byMarket.findIndex((r) => r.code === UK) + 1;
  return (
    <Panel
      id="h-abroad-redist" title="How much do tax and benefits narrow the gap?"
      lead="Inequality of market income, before any tax or benefits, depends on wages, savings and who has them. What a government then does with tax and benefits changes it. Here is each country before and after."
      sources={[SOURCES.oecd]}
    >
      <div role="group" aria-label="Which countries" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        <button type="button" aria-pressed={!showAll} onClick={() => setShowAll(false)} style={pillStyle(!showAll)}>The UK and well-known comparisons</button>
        <button type="button" aria-pressed={showAll} onClick={() => setShowAll(true)} style={pillStyle(showAll)}>All {everyone.length} OECD members</button>
      </div>
      <PairBars
        label="Gini before and after tax and benefits, by country" max={65}
        legend={[{ name: "Before tax and benefits", colour: "#C4B5FD" }, { name: "After tax and benefits", colour: ACCENT }]}
        rows={rows.map((r) => ({ label: r.name, note: `Taken off: ${r.cut.toFixed(1)} points`, strong: r.code === UK, bars: [{ name: "Before tax and benefits", value: r.market, text: r.market.toFixed(1), colour: "#C4B5FD" }, { name: "After tax and benefits", value: r.disposable, text: r.disposable.toFixed(1), colour: r.code === UK ? ACCENT : "#6D5BC9" }] }))}
      />
      <p style={para}>
        Before tax and benefits the UK Gini is {uk.market.toFixed(1)}, the {ordinal(marketRank)} highest of {everyone.length} OECD members with figures, against an average of {avgMarket.toFixed(1)} for the others. After them it is {uk.disposable.toFixed(1)}. Taxes and benefits take {uk.cut.toFixed(1)} points off in the UK, against {avgCut.toFixed(1)} on average elsewhere, which puts the UK {ordinal(ukRank)} of {everyone.length} for how much they take off. Countries differ both in how much they redistribute and in what they raise and spend it on, so a smaller cut is not by itself a judgement.
      </p>
      <Caution title="Why not the same as the UK's own figures">Market income here is for all people, including pensioners, whose income is mostly state and workplace pensions. Different countries treat pensions differently, which affects this comparison.</Caution>
    </Panel>
  );
}

function OverTime() {
  const [picked, setPicked] = useState(DEFAULT_PICK);
  const toggle = (code) => setPicked((p) => (p.includes(code) ? (p.length > 1 ? p.filter((x) => x !== code) : p) : p.length < MAX_PICKED ? [...p, code] : p));
  const lines = picked.map((code) => ({ name: A.countries[code].name, color: colourOf(code), points: toPoints(A.countries[code].gini.years, A.countries[code].gini.values, yearLabel) }));
  const years = picked.flatMap((c) => A.countries[c].gini.years);
  const from = Math.min(...years);
  const to = Math.max(...years) + 1;
  const summary = picked.map((c) => { const g = A.countries[c].gini; return `${A.countries[c].name} ${g.values.at(-1).toFixed(1)} in ${g.years.at(-1)}`; }).join(", ");
  const ukG = A.countries[UK].gini;
  const ukPeak = ukG.values.reduce((a, v, i) => (v > a.v ? { v, y: ukG.years[i] } : a), { v: 0, y: 0 });
  return (
    <Panel id="h-abroad-time" title="Has it changed?" lead={`Gini after tax and benefits each year, from the OECD. Choose up to ${MAX_PICKED} countries; each line starts when the OECD's series for that country does.`} sources={[SOURCES.oecd]}>
      <div role="group" aria-label="Countries" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {OPTIONS.map((o) => (
          <button key={o.code} type="button" aria-pressed={picked.includes(o.code)} onClick={() => toggle(o.code)} style={{ ...pillStyle(picked.includes(o.code)), display: "inline-flex", alignItems: "center", gap: 7 }}>
            <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 5, background: colourOf(o.code), boxShadow: picked.includes(o.code) ? "0 0 0 2px #fff" : "none", opacity: picked.includes(o.code) ? 1 : 0.55 }} />{o.name}
          </button>
        ))}
      </div>
      <TimeChart from={from} to={to} yFormat={(v) => `${Math.round(v)}`} accent={ACCENT} height={300} lines={lines} ariaLabel={`Gini coefficient after tax and benefits. Latest: ${summary}.`} />
      <p style={para}>Latest: {summary}. The UK series runs from {ukG.years[0]}, and its highest was {ukPeak.v.toFixed(1)} in {ukPeak.y}, against {ukG.values.at(-1).toFixed(1)} in {ukG.years.at(-1)}. Gaps in a line mean the OECD has no figure for those years.</p>
    </Panel>
  );
}

function Three() {
  const ons = last(D.income.gini.disposable);
  const onsYear = last(D.income.gini.years);
  const hbBhc = last(D.poverty.gini.bhc);
  const hbAhc = last(D.poverty.gini.ahc);
  const hbYear = last(D.poverty.gini.years);
  const oecd = A.countries[UK].latest.gini;
  return (
    <Panel
      id="h-abroad-three" title="Why the UK has more than one Gini" lead="This page and the Income page quote different figures for the UK because each comes from a different measure. All are right for what they measure, but they should not be mixed up."
      sources={[SOURCES.hdii, SOURCES.hbai, SOURCES.oecd]}
    >
      <Stats
        accent={ACCENT}
        items={[
          { value: `${ons.toFixed(1)}`, label: "ONS, after tax and benefits", note: `${onsYear}/${String(onsYear + 1).slice(2)}. Used on the Income page and by the Office for National Statistics` },
          { value: `${hbBhc.toFixed(1)} and ${hbAhc.toFixed(1)}`, label: "DWP, before and after housing costs", note: `${hbYear}/${String(hbYear + 1).slice(2)}. From the same survey, counting rent and mortgage costs as spending in the second` },
          { value: `${oecd.value.toFixed(1)}`, label: "OECD, after tax and benefits", note: `${oecd.year}. Built the same way for every country, which is why it is used to compare countries` },
        ]}
      />
      <p style={para}>The OECD's figure for the UK is higher than the ONS's. Measures of the same thing can differ in what counts as income, how households of different sizes are compared, how the very highest incomes are treated and which year they cover, and the OECD applies one definition to every country so that countries can be compared with each other. Compare the OECD's figures with each other, and the ONS's with the ONS's own earlier years, but do not set one beside the other.</p>
    </Panel>
  );
}

export default function InequalityAbroad({ onPick }) {
  const rows = ranking("gini", { membersOnly: true });
  const uk = rows.find((r) => r.code === UK);
  const ukRank = rows.findIndex((r) => r.code === UK) + 1;
  const get = (code) => rows.find((r) => r.code === code);
  const fr = get("FRA");
  const de = get("DEU");
  const it = get("ITA");
  const us = get("USA");
  const ca = get("CAN");
  const red = redistributionRanking();
  const ukR = red.find((r) => r.code === UK);
  const ukRedRank = red.findIndex((r) => r.code === UK) + 1;
  const equalest = rows.at(-1);
  const marketRank = [...red].sort((a, b) => b.market - a.market).findIndex((r) => r.code === UK) + 1;
  return (
    <div>
      <Takeaways
        accent={ACCENT}
        items={[
          `On the OECD's measure the UK's Gini coefficient after tax and benefits is ${uk.value.toFixed(1)} (${uk.year}), the ${ordinal(ukRank)} highest of ${rows.length} OECD members with recent figures. The most equal is ${equalest.name} at ${equalest.value.toFixed(1)}.`,
          `It is higher than France (${fr.value.toFixed(1)}), Germany (${de.value.toFixed(1)}), Italy (${it.value.toFixed(1)}) and Canada (${ca.value.toFixed(1)}), and lower than the United States (${us.value.toFixed(1)}).`,
          `Before tax and benefits the UK's Gini is ${ukR.market.toFixed(1)}, the ${ordinal(marketRank)} highest of ${red.length} OECD members shown. Taxes and benefits take ${ukR.cut.toFixed(1)} points off, which is ${ordinal(ukRedRank)} biggest of ${red.length}.`,
          "The OECD's figure for the UK is higher than the ONS's own, which the page explains. Use each source on its own terms.",
        ]}
      />
      <Ranking />
      <Redistribution />
      <OverTime />
      <Three />
      <Panel id="h-abroad-more" title="More about the UK">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button type="button" style={pillStyle(false)} onClick={() => onPick("income")}>Income inequality in the UK</button>
          <button type="button" style={pillStyle(false)} onClick={() => onPick("place")}>Where in the UK</button>
          <button type="button" style={pillStyle(false)} onClick={() => onPick("debate")}>The arguments</button>
        </div>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.55, color: COLORS.inkSoft, margin: "10px 0 0" }}>Figures checked {A.built}. The OECD adds new countries and years as they are published, so the order can change.</p>
      </Panel>
    </div>
  );
}
