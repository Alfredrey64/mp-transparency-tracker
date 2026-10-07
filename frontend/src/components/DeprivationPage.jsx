import { useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING, numeric } from "../theme";
import { PageHeader } from "./shared";
import RegionCompare from "./RegionCompare";
import { IconDeprivation } from "./icons";
import { REGIONS, inSentence } from "../data/regionMetrics";
import data from "../data/deprivation.json";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";

// Deprivation: the English Indices of Deprivation 2025, by region and by local authority. England only: Scotland, Wales and
// Northern Ireland publish their own indices, built differently, which cannot be compared with these.

const ACCENT = "#B4432F";
const nameOf = (key) => REGIONS.find((r) => r.key === key)?.name ?? key;

// What to show on the map for each region: the share of its people living in the neighbourhoods at one end of the ranking.
const ENDS = [
  { id: "most10", label: "Most deprived tenth", pick: (d) => d[0], phrase: "live in the most deprived tenth of neighbourhoods in England", fair: 10 },
  { id: "most20", label: "Most deprived fifth", pick: (d) => d[0] + d[1], phrase: "live in the most deprived fifth of neighbourhoods in England", fair: 20 },
  { id: "least10", label: "Least deprived tenth", pick: (d) => d[9], phrase: "live in the least deprived tenth of neighbourhoods in England", fair: 10 },
];

const DOMAIN_NOTES = {
  imd: "A combined score from all seven kinds of deprivation below, weighted by how much each matters.",
  income: "People on low incomes, including those on means-tested benefits and tax credits.",
  employment: "People who want to work but cannot because of unemployment, sickness, disability or caring.",
  education: "Low qualifications and poor school results among children, and low skills among adults.",
  health: "Early death and poor health, including mental health, and disability limiting daily life.",
  crime: "The risk of being a victim of violence, burglary, theft and criminal damage.",
  barriers: "How hard it is to get housing, and how far away basic services such as a GP and a school are.",
  living: "The quality of homes (such as disrepair and no central heating) and of the air and roads outside.",
};

const f1 = (v) => `${(Math.round(v * 10) / 10).toFixed(1)}%`;
const labelStyle = { fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.ink, marginBottom: 6, display: "block" };

// How the people of one region are spread across the ten steps of the ranking, against an even spread.
function Deciles({ regionKey, domain, accent }) {
  const list = (regionKey === "england" ? data.england : data.regions[regionKey]).deciles[domain];
  const max = Math.max(...list, 10);
  return (
    <div>
      <div role="img" aria-label={`Share of people in each tenth of neighbourhoods, from most to least deprived: ${list.map((v, i) => `tenth ${i + 1}, ${f1(v)}`).join("; ")}`}
        style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 6, alignItems: "end", height: 170, padding: "0 2px" }}>
        <span aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, bottom: `${(10 / max) * 100}%`, borderTop: `2px dashed ${COLORS.inkSoft}`, opacity: 0.7 }} />
        {list.map((v, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", minWidth: 0 }}>
            <span style={{ ...numeric, fontSize: 11.5, textAlign: "center", color: COLORS.ink, marginBottom: 3 }}>{Math.round(v)}%</span>
            <span aria-hidden="true" style={{ display: "block", height: `${(v / max) * 82}%`, minHeight: 2, borderRadius: "5px 5px 2px 2px", background: `color-mix(in oklab, ${accent} ${Math.round(100 - i * 9)}%, ${COLORS.hairline})` }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 6 }}>
        <span>Most deprived tenth</span>
        <span>- - - an even spread (10% in each)</span>
        <span>Least deprived tenth</span>
      </div>
    </div>
  );
}

function AreaRow({ area, accent }) {
  const [open, setOpen] = useState(false);
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
          <span style={{ ...numeric, display: "block", fontSize: 15, fontWeight: 600, color: COLORS.ink }}>{f1(area.worst10)}</span>
          <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>in worst tenth</span>
        </span>
      </button>
      {open && (
        <div style={{ padding: "2px 4px 14px 54px" }}>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.55, color: COLORS.ink, margin: "0 0 8px" }}>
            Ranked <strong>{area.rank}</strong> of 296 local authorities in England for overall deprivation, where 1 is the most deprived. {f1(area.worst10)} of its neighbourhoods are among the most deprived tenth in England. Share of its neighbourhoods in the most deprived tenth, by kind of deprivation:
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
            {data.domains.slice(1).map((d) => (
              <li key={d.id} style={{ display: "grid", gridTemplateColumns: "minmax(0, 190px) minmax(0, 1fr) 52px", gap: 10, alignItems: "center", fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink }}>
                <span>{d.label}</span>
                <span aria-hidden="true" style={{ height: 8, borderRadius: 4, background: `${accent}18`, overflow: "hidden" }}><span style={{ display: "block", height: "100%", width: `${Math.min(100, area.domains[d.id] ?? 0)}%`, background: accent }} /></span>
                <span style={{ ...numeric, textAlign: "right" }}>{f1(area.domains[d.id] ?? 0)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

export default function DeprivationPage() {
  const [domain, setDomain] = useState("imd");
  const [endId, setEndId] = useState("most10");
  const [regionKey, setRegionKey] = useState(() => Object.entries(data.regions).sort((a, b) => b[1].score - a[1].score)[0][0]);
  const [query, setQuery] = useState("");
  const [areaRegion, setAreaRegion] = useState("all");
  const [showAll, setShowAll] = useState(false);

  const end = ENDS.find((e) => e.id === endId);
  const domainLabel = data.domains.find((d) => d.id === domain).label;
  const values = useMemo(() => {
    const v = Object.fromEntries(REGIONS.map((r) => [r.key, null]));
    for (const [k, region] of Object.entries(data.regions)) v[k] = end.pick(region.deciles[domain]);
    return v;
  }, [domain, end]);

  const regionData = data.regions[regionKey];
  const sorted = Object.entries(values).filter(([, v]) => v !== null).sort((a, b) => b[1] - a[1]);
  const q = query.trim().toLowerCase();
  const areas = useMemo(() => {
    let list = data.areas;
    if (areaRegion !== "all") list = list.filter((a) => a.region === areaRegion);
    if (q) list = list.filter((a) => a.name.toLowerCase().includes(q));
    return list;
  }, [q, areaRegion]);
  const shownAreas = q || showAll || areaRegion !== "all" ? areas.slice(0, showAll || areaRegion !== "all" ? 400 : 25) : [...areas.slice(0, 10)];
  const mostLeast = !q && !showAll && areaRegion === "all";

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={IconDeprivation} title="Deprivation" subtitle="Which parts of England are most and least deprived, region by region and council by council, from the official Indices of Deprivation 2025." maxWidth={780} />

      <section aria-labelledby="h-dep-what" style={{ ...card, marginTop: 24, position: "relative", overflow: "hidden" }}>
        <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: `linear-gradient(180deg, ${ACCENT}, ${ACCENT}22)` }} />
        <h2 id="h-dep-what" style={cardTitle}>What this measures</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.6, color: COLORS.ink, margin: "10px 0 8px", maxWidth: 800 }}>
          The government ranks all 33,755 small neighbourhoods in England, each home to about 1,500 people, from the most deprived to the least. Deprivation here means more than low income: it covers being out of work, poor health, few qualifications, crime, the cost and quality of housing, and the quality of the local environment. Each neighbourhood is placed in one of ten equal steps, called deciles.
        </p>
        <details className="dep-more" style={{ maxWidth: 800 }}>
          <summary className="ons-tap" style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink, cursor: "pointer", padding: "6px 0" }}>Three things to keep in mind</summary>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.6, color: COLORS.inkSoft, margin: "4px 0 0" }}>
            It ranks places against each other, so it says where is relatively worse off, not how badly off anyone is. It describes neighbourhoods, not individuals: poorer people live in every area. And it covers England only: Scotland, Wales and Northern Ireland have their own indices, built differently, so they cannot be compared and are greyed out on the map.
          </p>
        </details>
      </section>

      <div role="radiogroup" aria-label="Kind of deprivation" style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "22px 0 8px" }}>
        {data.domains.map((d) => (
          <button key={d.id} type="button" role="radio" aria-checked={domain === d.id} className="ons-chip" onClick={() => setDomain(d.id)}
            style={{ ...pillStyle(domain === d.id), background: domain === d.id ? ACCENT : "transparent", borderColor: domain === d.id ? ACCENT : COLORS.hairline, color: domain === d.id ? "#fff" : COLORS.inkSoft }}>
            {d.label}
          </button>
        ))}
      </div>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.inkSoft, margin: "0 0 14px", maxWidth: 800 }}>{DOMAIN_NOTES[domain]}</p>

      <section aria-label="Map of deprivation by region" style={{ ...card, background: `radial-gradient(560px 340px at 50% 0%, ${ACCENT}1a, transparent 70%), ${COLORS.paperCard}` }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "8px 16px" }}>
          <div>
            <span style={labelStyle} id="dep-end">Show the share of people who</span>
            <div role="radiogroup" aria-labelledby="dep-end" style={{ display: "inline-flex", flexWrap: "wrap", gap: 6 }}>
              {ENDS.map((e) => (
                <button key={e.id} type="button" role="radio" aria-checked={endId === e.id} className="ons-chip" onClick={() => setEndId(e.id)} style={pillStyle(endId === e.id)}>{e.label}</button>
              ))}
            </div>
          </div>
        </div>
        <p style={{ fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.55, color: COLORS.ink, margin: "14px 0 0", maxWidth: 800 }} aria-live="polite">
          <strong>{domainLabel}:</strong> in <strong>{inSentence(sorted[0][0])}</strong>, {f1(sorted[0][1])} of people {end.phrase}, the most of any region. In <strong>{inSentence(sorted.at(-1)[0])}</strong> it is {f1(sorted.at(-1)[1])}. If deprivation were spread evenly across England it would be {end.fair}% everywhere.
        </p>
        <RegionCompare
          key={`${domain}-${endId}`}
          values={values} format="pct" accent={ACCENT} noun={`people who ${end.phrase}`} ukValue={end.fair} ukLabel="an even spread across England"
          caption="Round-number steps. The marker shows what an even spread would be."
          note="England's nine regions only."
        />
      </section>

      <section aria-labelledby="h-dep-region" style={{ ...card, marginTop: 20 }}>
        <h2 id="h-dep-region" style={cardTitle}>How one region is spread</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.inkSoft, margin: "6px 0 12px", maxWidth: 800 }}>
          Every region has some of the most and some of the least deprived neighbourhoods. The bars show what share of a region&apos;s people live in each of the ten steps for <strong style={{ color: COLORS.ink }}>{domainLabel.toLowerCase()}</strong>, against an even spread.
        </p>
        <div role="radiogroup" aria-label="Region" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {Object.keys(data.regions).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={regionKey === k} className="ons-chip" onClick={() => setRegionKey(k)} style={pillStyle(regionKey === k)}>{nameOf(k)}</button>
          ))}
        </div>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.55, color: COLORS.ink, margin: "0 0 14px" }}>
          In <strong>{inSentence(regionKey)}</strong>, {f1(ENDS[0].pick(regionData.deciles[domain]))} of people live in the most deprived tenth of neighbourhoods, and {f1(ENDS[2].pick(regionData.deciles[domain]))} in the least deprived tenth.
        </p>
        <Deciles regionKey={regionKey} domain={domain} accent={ACCENT} />
      </section>

      <section aria-labelledby="h-dep-areas" style={{ ...card, marginTop: 20 }}>
        <h2 id="h-dep-areas" style={cardTitle}>Council by council</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.inkSoft, margin: "6px 0 14px", maxWidth: 800 }}>
          All 296 local authorities in England, ranked by overall deprivation, where 1 is the most deprived. The figure on the right is the share of each council&apos;s neighbourhoods that are in the most deprived tenth in England. Tap one for the detail.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: "10px 16px", marginBottom: 8 }}>
          <div>
            <label htmlFor="dep-search" style={labelStyle}>Find your council</label>
            <input id="dep-search" type="search" className="ons-chip" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type a name, such as Leeds" autoComplete="off"
              style={{ fontFamily: FONT_BODY, fontSize: 16, padding: "9px 12px", borderRadius: 10, border: `1px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, width: "100%", boxSizing: "border-box" }} />
          </div>
          <div>
            <label htmlFor="dep-region" style={labelStyle}>Region</label>
            <select id="dep-region" className="ons-chip" value={areaRegion} onChange={(e) => setAreaRegion(e.target.value)}
              style={{ fontFamily: FONT_BODY, fontSize: 16, padding: "9px 10px", borderRadius: 10, border: `1px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, width: "100%", boxSizing: "border-box" }}>
              <option value="all">All of England</option>
              {Object.keys(data.regions).map((k) => <option key={k} value={k}>{nameOf(k)}</option>)}
            </select>
          </div>
        </div>
        {mostLeast && (
          <>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: COLORS.ink, margin: "12px 0 0" }}>The 10 most deprived</h3>
            <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>{data.areas.slice(0, 10).map((a) => <AreaRow key={a.code} area={a} accent={ACCENT} />)}</ol>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: COLORS.ink, margin: "18px 0 0" }}>The 10 least deprived</h3>
            <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>{data.areas.slice(-10).map((a) => <AreaRow key={a.code} area={a} accent={ACCENT} />)}</ol>
            <button type="button" className="ons-tap" onClick={() => setShowAll(true)} style={{ ...pillStyle(false), marginTop: 14, cursor: "pointer" }}>Show all 296 councils</button>
          </>
        )}
        {!mostLeast && (
          <>
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, margin: "10px 0 0" }} aria-live="polite">{areas.length === 0 ? "No council matches that name." : `${areas.length} ${areas.length === 1 ? "council" : "councils"}${q ? ` matching "${query.trim()}"` : ""}${areaRegion !== "all" ? ` in ${inSentence(areaRegion)}` : ""}.`}</p>
            <ol style={{ listStyle: "none", margin: "4px 0 0", padding: 0 }}>{shownAreas.map((a) => <AreaRow key={a.code} area={a} accent={ACCENT} />)}</ol>
          </>
        )}
      </section>

      <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.6, color: COLORS.inkSoft, marginTop: 24, maxWidth: 800 }}>
        Source: <a href={data.source.url} style={{ color: "inherit" }}>{data.source.name}</a>, published in November 2025. Regions are worked out here by adding up the people in each region&apos;s neighbourhoods (mid-2022 population estimates), so a region&apos;s figure means the share of its people, not of its neighbourhoods. Council rankings are the Ministry&apos;s own, for the 2024 local authority districts. Contains public sector information licensed under the Open Government Licence v3.0.
      </p>
    </div>
  );
}
