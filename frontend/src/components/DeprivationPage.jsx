import { useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING, numeric } from "../theme";
import { PageHeader } from "./shared";
import RegionCompare from "./RegionCompare";
import DeprivationNations from "./DeprivationNations";
import DeprivationUK from "./DeprivationUK";
import { ControlBar, HowToRead, Row, Segmented, SelectField } from "./DeprivationControls";
import { rankingShareSpec } from "../lib/shareSpecs";
import { oneIn, oneInShort, againstFair } from "../lib/deprivationPlain";
import { NATIONS, KINDS, kindFor } from "../data/deprivationKinds";
import { IconDeprivation } from "./icons";
import { REGIONS, inSentence } from "../data/regionMetrics";
import data from "../data/deprivation.json";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";

// Deprivation: the English Indices of Deprivation 2025, by region and by local authority, plus Wales, Scotland and Northern
// Ireland's own indices (DeprivationNations.jsx) and a map of every constituency in the UK (DeprivationUK.jsx). Each nation's
// index is built differently and cannot be compared with the others.

const ACCENT = "#B4432F";
const nameOf = (key) => REGIONS.find((r) => r.key === key)?.name ?? key;

// What to show on the map for each region: the share of its people living in the neighbourhoods at one end of the ranking.
const ENDS = [
  { id: "most10", label: "Most deprived tenth", short: "Worst tenth", pick: (d) => d[0], phrase: "live in the most deprived tenth of neighbourhoods in England", fair: 10 },
  { id: "most20", label: "Most deprived fifth", short: "Worst fifth", pick: (d) => d[0] + d[1], phrase: "live in the most deprived fifth of neighbourhoods in England", fair: 20 },
  { id: "least10", label: "Least deprived tenth", short: "Best tenth", pick: (d) => d[9], phrase: "live in the least deprived tenth of neighbourhoods in England", fair: 10 },
];

const f1 = (v) => `${(Math.round(v * 10) / 10).toFixed(1)}%`;
const labelStyle = { fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.ink, marginBottom: 6, display: "block" };
const para = { fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.6, color: COLORS.ink, margin: "10px 0 0", maxWidth: 780 };

// How the people of one region are spread across the ten steps of the ranking, against an even spread.
function Deciles({ regionKey, domain, accent }) {
  const list = (regionKey === "england" ? data.england : data.regions[regionKey]).deciles[domain];
  const max = Math.max(...list, 10);
  return (
    <div>
      <div role="img" aria-label={`Share of people in each tenth of neighbourhoods, from most to least deprived: ${list.map((v, i) => `tenth ${i + 1}, ${f1(v)}`).join("; ")}`}
        style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 6, alignItems: "end", height: 170, padding: "0 2px" }}>
        <span aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, bottom: `${(10 / max) * 82}%`, borderTop: `2px dashed ${COLORS.inkSoft}`, opacity: 0.7 }} />
        {list.map((v, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", minWidth: 0 }}>
            <span style={{ ...numeric, fontSize: 11.5, textAlign: "center", color: COLORS.ink, marginBottom: 3 }}>{Math.round(v)}%</span>
            <span aria-hidden="true" style={{ display: "block", height: `${(v / max) * 82}%`, minHeight: 2, borderRadius: "5px 5px 2px 2px", background: `color-mix(in oklab, ${accent} ${Math.round(100 - i * 9)}%, ${COLORS.hairline})` }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 6 }}>
        <span>Most deprived tenth</span>
        <span>- - - fair share (10% in each)</span>
        <span>Least deprived tenth</span>
      </div>
    </div>
  );
}

// One council or constituency in the ranked list. Press it for the breakdown by kind of deprivation.
function AreaRow({ area, kind, total, measure }) {
  const [open, setOpen] = useState(false);
  const seat = kind === "constituencies";
  const fair = againstFair(area.value);
  return (
    <li style={{ borderTop: `1px solid ${COLORS.hairline}` }}>
      <button type="button" className="ons-tap" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        style={{ display: "grid", gridTemplateColumns: "34px minmax(0, 1fr) auto", gap: "2px 12px", alignItems: "center", width: "100%", textAlign: "left", font: "inherit", background: "none", border: "none", padding: "10px 4px", cursor: "pointer" }}>
        <span style={{ ...numeric, fontSize: 14, color: COLORS.inkSoft }}>{area.rank}</span>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 14.5, fontWeight: 700, color: COLORS.ink }}>{area.name}</span>
          <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>{nameOf(area.region)}</span>
        </span>
        <span style={{ textAlign: "right" }}>
          <span style={{ ...numeric, display: "block", fontSize: 16, fontWeight: 600, color: COLORS.ink }}>{oneInShort(area.value)}</span>
          <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>{f1(area.value)}{fair.ratio >= 1.12 ? ` · ${fair.text} a fair share` : ""}</span>
        </span>
      </button>
      {open && (
        <div style={{ padding: "2px 4px 14px 46px" }}>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.55, color: COLORS.ink, margin: "0 0 8px" }}>
            {area.name} is number <strong>{area.rank}</strong> of {total} {seat ? "constituencies" : "councils"} in England for {measure.toLowerCase()}, where 1 is the most deprived. {seat ? "Of its residents" : "Of its neighbourhoods"}, <strong>{oneIn(area.value)}</strong> ({f1(area.value)}) {seat ? "live in neighbourhoods" : "are"} in the most deprived tenth in England. On overall deprivation it is {oneIn(area.imd)}. Here is how that splits by kind of deprivation:
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
            {KINDS.england.slice(1).map((d) => (
              <li key={d.id} style={{ display: "grid", gridTemplateColumns: "minmax(0, 170px) minmax(0, 1fr) 84px", gap: 10, alignItems: "center", fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink }}>
                <span>{d.label}</span>
                <span aria-hidden="true" style={{ height: 8, borderRadius: 4, background: `${ACCENT}18`, overflow: "hidden" }}><span style={{ display: "block", height: "100%", width: `${Math.min(100, area.domains[d.id] ?? 0)}%`, background: ACCENT }} /></span>
                <span style={{ ...numeric, textAlign: "right" }}>{oneInShort(area.domains[d.id] ?? 0)}</span>
              </li>
            ))}
          </ul>
          {seat && <a href={`#/constituency/${encodeURIComponent(area.name)}`} className="ons-tap" style={{ display: "inline-block", marginTop: 10, fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700, color: COLORS.ink }}>See this constituency, its MP and its results</a>}
        </div>
      )}
    </li>
  );
}

// Councils and constituencies ranked on the kind of deprivation picked above, searchable, with the most and least deprived up front.
function AreaList({ domain, domainLabel }) {
  const [kind, setKind] = useState("councils");
  const [seats, setSeats] = useState(null);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (kind !== "constituencies" || seats) return undefined;
    let alive = true;
    import("../data/deprivationConstituencies.json").then((m) => alive && setSeats(m.default.seats)).catch(() => {});
    return () => { alive = false; };
  }, [kind, seats]);

  const ranked = useMemo(() => {
    const raw = kind === "councils" ? data.areas : seats ?? [];
    const withValue = raw.map((a) => ({ ...a, imd: a.worst10, value: domain === "imd" ? a.worst10 : a.domains[domain] ?? 0 }));
    withValue.sort((x, y) => y.value - x.value || y.score - x.score);
    return withValue.map((a, i) => ({ ...a, rank: i + 1 }));
  }, [kind, seats, domain]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => ranked.filter((a) => (region === "all" || a.region === region) && (!q || a.name.toLowerCase().includes(q))), [ranked, region, q]);
  const front = !q && !showAll && region === "all";
  const noun = kind === "councils" ? "council" : "constituency";
  const plural = kind === "councils" ? "councils" : "constituencies";
  const loading = kind === "constituencies" && !seats;

  return (
    <section aria-labelledby="h-dep-areas" className="regions-wrap" style={{ ...card, marginTop: 20 }}>
      <h2 id="h-dep-areas" style={cardTitle}>Find your council or constituency</h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.6, color: COLORS.inkSoft, margin: "6px 0 14px", maxWidth: 780 }}>
        Every council and every parliamentary constituency in England, from the most deprived to the least, for <strong style={{ color: COLORS.ink }}>{domainLabel.toLowerCase()}</strong>. The big figure says roughly how many people (or neighbourhoods) are in the most deprived tenth of England: 1 in 10 would be a fair share. Tap a place to see more.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: "12px 16px", marginBottom: 8, alignItems: "end" }}>
        <Row label="Show">
          <Segmented label="What to rank" value={kind} onChange={(v) => { setKind(v); setShowAll(false); }} small options={[{ id: "councils", label: "Councils (296)", short: "Councils" }, { id: "constituencies", label: "Constituencies (543)", short: "Constituencies" }]} />
        </Row>
        <div>
          <label htmlFor="dep-search" style={labelStyle}>Search by name</label>
          <input id="dep-search" type="search" className="ons-chip" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={kind === "councils" ? "Such as Leeds" : "Such as Hackney North"} autoComplete="off"
            style={{ fontFamily: FONT_BODY, fontSize: 16, padding: "10px 12px", borderRadius: 12, border: `1.5px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, width: "100%", boxSizing: "border-box" }} />
        </div>
        <SelectField id="dep-region" label="Region" value={region} onChange={setRegion} options={[{ id: "all", label: "All of England" }, ...Object.keys(data.regions).map((k) => ({ id: k, label: nameOf(k) }))]} />
      </div>
      {loading && <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Loading the constituencies…</p>}
      {!loading && front && (
        <div className="dep-two">
          <div>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: COLORS.ink, margin: "12px 0 0" }}>The 10 most deprived</h3>
            <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>{ranked.slice(0, 10).map((a) => <AreaRow key={a.code} area={a} kind={kind} total={ranked.length} measure={domainLabel} />)}</ol>
          </div>
          <div>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: COLORS.ink, margin: "12px 0 0" }}>The 10 least deprived</h3>
            <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>{ranked.slice(-10).map((a) => <AreaRow key={a.code} area={a} kind={kind} total={ranked.length} measure={domainLabel} />)}</ol>
          </div>
        </div>
      )}
      {!loading && front && <button type="button" className="ons-tap" onClick={() => setShowAll(true)} style={{ ...pillStyle(false), marginTop: 14, cursor: "pointer" }}>Show all {ranked.length} {plural}</button>}
      {!loading && !front && (
        <>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, margin: "10px 0 0" }} aria-live="polite">{filtered.length === 0 ? `No ${noun} matches that name.` : `${filtered.length} ${filtered.length === 1 ? noun : plural}${q ? ` matching "${query.trim()}"` : ""}${region !== "all" ? ` in ${inSentence(region)}` : ""}.`}</p>
          <ol style={{ listStyle: "none", margin: "4px 0 0", padding: 0 }}>{filtered.slice(0, showAll || region !== "all" ? 600 : 25).map((a) => <AreaRow key={a.code} area={a} kind={kind} total={ranked.length} measure={domainLabel} />)}</ol>
        </>
      )}
      {kind === "constituencies" && (
        <p style={{ fontFamily: FONT_BODY, fontSize: 12, lineHeight: 1.55, color: COLORS.inkSoft, margin: "14px 0 0" }}>
          Constituency figures are worked out here: each neighbourhood is matched to the July 2024 constituency it best fits (ONS lookup) and its people are added up. Neighbourhoods on a boundary are counted wholly in one seat, so treat small differences as rough.
        </p>
      )}
    </section>
  );
}

export default function DeprivationPage() {
  const [nation, setNation] = useState("uk");
  const [kindId, setKindId] = useState("imd");
  const [endId, setEndId] = useState("most10");
  const [regionKey, setRegionKey] = useState(() => Object.entries(data.regions).sort((a, b) => b[1].score - a[1].score)[0][0]);

  const kind = kindFor(nation, kindId);
  const kinds = KINDS[nation];
  const kindInfo = kinds.find((k) => k.id === kind);
  const end = ENDS.find((e) => e.id === endId);
  const domain = kind;
  const domainLabel = kindInfo.label;
  const values = useMemo(() => {
    const v = Object.fromEntries(REGIONS.map((r) => [r.key, null]));
    for (const [k, region] of Object.entries(data.regions)) v[k] = end.pick(region.deciles[domain]);
    return v;
  }, [domain, end]);

  const regionData = data.regions[regionKey];
  const sorted = Object.entries(values).filter(([, v]) => v !== null).sort((a, b) => b[1] - a[1]);
  const fairWord = `1 in ${Math.round(100 / end.fair)}`;
  const topFair = againstFair(sorted[0][1], end.fair);

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={IconDeprivation} title="Deprivation" subtitle="Which parts of the UK are struggling most, and which least: every council and every constituency in England, Wales, Scotland and Northern Ireland, from each nation's official figures."
        share={nation === "england" ? () => rankingShareSpec({
          kicker: "Deprivation", title: `${domainLabel}: the regions of England`, subtitle: `Share of people who ${end.phrase}`, accent: ACCENT,
          rows: sorted.map(([k, v]) => ({ label: nameOf(k), valueText: `${oneInShort(v)} (${f1(v)})`, fraction: v })),
          note: `A fair share would be ${fairWord}, ${end.fair}%, in every region.`, footer: "UK Parliament Tracker · Indices of Deprivation 2025", link: window.location.href,
        }) : undefined}
      />

      <ControlBar>
        <Row label="Where" wide>
          <Segmented label="Nation" value={nation} onChange={setNation} options={NATIONS.map(([id, label, short]) => ({ id, label, short }))} />
        </Row>
        <SelectField id="dep-kind" label="What kind of hardship" value={kind} onChange={setKindId} options={kinds} />
        {nation === "england" && (
          <Row label="Show the people who live in the">
            <Segmented label="Which end of the ranking" value={endId} onChange={setEndId} small options={ENDS.map((e) => ({ id: e.id, label: e.label, short: e.short }))} />
          </Row>
        )}
      </ControlBar>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.inkSoft, margin: "12px 0 0", maxWidth: 800 }}>
        <strong style={{ color: COLORS.ink }}>{kindInfo.label}:</strong> {kindInfo.note}
      </p>

      {nation === "uk" ? <DeprivationUK kind={kind} /> : nation !== "england" ? <DeprivationNations key={nation} nation={nation} kind={kind} /> : (
        <>
          <section aria-labelledby="h-dep-what" style={{ ...card, marginTop: 20, position: "relative", overflow: "hidden" }}>
            <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: `linear-gradient(180deg, ${ACCENT}, ${ACCENT}22)` }} />
            <h2 id="h-dep-what" style={cardTitle}>What this shows</h2>
            <p style={para}>
              The government has ranked every small neighbourhood in England (about 33,000 of them, each with around 1,500 people) from the most deprived to the least. &ldquo;Deprived&rdquo; means more than being short of money. It also covers being out of work, poor health, few qualifications, crime, housing problems and a run-down local area.
            </p>
            <HowToRead place="England" />
            <details className="dep-more" style={{ maxWidth: 780, marginTop: 10 }}>
              <summary className="ons-tap" style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink, cursor: "pointer", padding: "6px 0" }}>Three things to keep in mind</summary>
              <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.6, color: COLORS.inkSoft, margin: "4px 0 0" }}>
                It compares places with each other, so it shows where is worse off than elsewhere, not how badly off anyone is. It describes neighbourhoods, not individuals: poorer people live in every area. And it covers England only: Wales, Scotland and Northern Ireland have their own versions, built differently, so they can&apos;t be compared with these. Use the buttons at the top to see them.
              </p>
            </details>
          </section>

          <section aria-label="Map of deprivation by region" style={{ ...card, marginTop: 20, background: `radial-gradient(560px 340px at 50% 0%, ${ACCENT}1a, transparent 70%), ${COLORS.paperCard}` }}>
            <h2 style={cardTitle}>Region by region</h2>
            <p style={{ ...para, fontSize: 16 }} aria-live="polite">
              <strong>{domainLabel}:</strong> in <strong>{inSentence(sorted[0][0])}</strong>, {oneIn(sorted[0][1])} people ({f1(sorted[0][1])}) {end.phrase}. That is {topFair.text} what an even spread would give ({fairWord}), and the highest of any region. In <strong>{inSentence(sorted.at(-1)[0])}</strong> it is {oneIn(sorted.at(-1)[1])} ({f1(sorted.at(-1)[1])}).
            </p>
            <RegionCompare
              key={`${domain}-${endId}`}
              values={values} format="pct" accent={ACCENT} noun={`people who ${end.phrase}`} ukValue={end.fair} ukLabel={`an even spread across England (${fairWord})`}
              caption={`Round-number steps. The marker shows an even spread: ${fairWord}.`}
              note="England's nine regions only. The map shows percentages; the sentence above puts them as '1 in …'."
            />
          </section>

          <section aria-labelledby="h-dep-region" style={{ ...card, marginTop: 20 }}>
            <h2 id="h-dep-region" style={cardTitle}>Rich and poor side by side in one region</h2>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.6, color: COLORS.inkSoft, margin: "6px 0 14px", maxWidth: 780 }}>
              Every region has some of the most and some of the least deprived neighbourhoods. Each bar is one of the ten equal groups, from the most deprived (left) to the least (right), and shows how much of the region&apos;s population lives in it, for <strong style={{ color: COLORS.ink }}>{domainLabel.toLowerCase()}</strong>.
            </p>
            <div style={{ maxWidth: 320, marginBottom: 14 }}>
              <SelectField id="dep-pick-region" label="Region" value={regionKey} onChange={setRegionKey} options={Object.keys(data.regions).map((k) => ({ id: k, label: nameOf(k) }))} />
            </div>
            <p style={{ fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.6, color: COLORS.ink, margin: "0 0 14px", maxWidth: 780 }}>
              In <strong>{inSentence(regionKey)}</strong>, {oneIn(ENDS[0].pick(regionData.deciles[domain]))} people ({f1(ENDS[0].pick(regionData.deciles[domain]))}) live in the most deprived tenth of neighbourhoods, and {oneIn(ENDS[2].pick(regionData.deciles[domain]))} ({f1(ENDS[2].pick(regionData.deciles[domain]))}) in the least deprived tenth.
            </p>
            <Deciles regionKey={regionKey} domain={domain} accent={ACCENT} />
          </section>

          <AreaList domain={domain} domainLabel={domainLabel} />

          <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.6, color: COLORS.inkSoft, marginTop: 24, maxWidth: 800 }}>
            Source: <a href={data.source.url} style={{ color: "inherit" }}>{data.source.name}</a>, published in November 2025. Regions are worked out here by adding up the people in each region&apos;s neighbourhoods (mid-2022 population estimates), so a region&apos;s figure means the share of its people, not of its neighbourhoods. Council rankings are the Ministry&apos;s own, for the 2024 local authority districts. Contains public sector information licensed under the Open Government Licence v3.0.
          </p>
        </>
      )}
    </div>
  );
}
