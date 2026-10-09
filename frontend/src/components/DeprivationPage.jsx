import { useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING, numeric } from "../theme";
import { PageHeader } from "./shared";
import RegionCompare from "./RegionCompare";
import DeprivationNations from "./DeprivationNations";
import { rankingShareSpec } from "../lib/shareSpecs";
import { IconDeprivation } from "./icons";
import { REGIONS, inSentence } from "../data/regionMetrics";
import data from "../data/deprivation.json";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";

// Deprivation: the English Indices of Deprivation 2025, by region and by local authority, plus Wales and Scotland's own indices
// (DeprivationNations.jsx). Each nation's index is built differently and cannot be compared with the others.

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

// One council or constituency in the ranked list. Press it for the breakdown by kind of deprivation.
function AreaRow({ area, kind, total, measure }) {
  const [open, setOpen] = useState(false);
  const seat = kind === "constituencies";
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
          <span style={{ ...numeric, display: "block", fontSize: 15, fontWeight: 600, color: COLORS.ink }}>{f1(area.value)}</span>
          <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>{seat ? "of people" : "of areas"} in worst tenth</span>
        </span>
      </button>
      {open && (
        <div style={{ padding: "2px 4px 14px 46px" }}>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.55, color: COLORS.ink, margin: "0 0 8px" }}>
            Number <strong>{area.rank}</strong> of {total} {seat ? "constituencies" : "local authorities"} in England for {measure.toLowerCase()}, where 1 is the most deprived. {f1(area.value)}% of its {seat ? "residents live in neighbourhoods" : "neighbourhoods are"} among the most deprived tenth in England. Overall, {f1(area.imd)}%. The share in the worst tenth, by kind of deprivation:
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
            {data.domains.slice(1).map((d) => (
              <li key={d.id} style={{ display: "grid", gridTemplateColumns: "minmax(0, 170px) minmax(0, 1fr) 52px", gap: 10, alignItems: "center", fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink }}>
                <span>{d.label}</span>
                <span aria-hidden="true" style={{ height: 8, borderRadius: 4, background: `${ACCENT}18`, overflow: "hidden" }}><span style={{ display: "block", height: "100%", width: `${Math.min(100, area.domains[d.id] ?? 0)}%`, background: ACCENT }} /></span>
                <span style={{ ...numeric, textAlign: "right" }}>{f1(area.domains[d.id] ?? 0)}</span>
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
      <h2 id="h-dep-areas" style={cardTitle}>Council by council, or seat by seat</h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.inkSoft, margin: "6px 0 14px", maxWidth: 800 }}>
        Every local authority and every parliamentary constituency in England, ranked on <strong style={{ color: COLORS.ink }}>{domainLabel.toLowerCase()}</strong> (change it with the buttons above). Rank 1 is the most deprived. The figure on the right is the share in the most deprived tenth of neighbourhoods in England. Tap one for the detail.
      </p>
      <div role="radiogroup" aria-label="What to rank" style={{ display: "inline-flex", gap: 6, marginBottom: 14 }}>
        {[["councils", "Councils (296)"], ["constituencies", "Constituencies (543)"]].map(([id, label]) => (
          <button key={id} type="button" role="radio" aria-checked={kind === id} className="ons-chip" onClick={() => { setKind(id); setShowAll(false); }} style={pillStyle(kind === id)}>{label}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: "10px 16px", marginBottom: 8 }}>
        <div>
          <label htmlFor="dep-search" style={labelStyle}>Find your {noun}</label>
          <input id="dep-search" type="search" className="ons-chip" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={kind === "councils" ? "Type a name, such as Leeds" : "Type a name, such as Hackney North"} autoComplete="off"
            style={{ fontFamily: FONT_BODY, fontSize: 16, padding: "9px 12px", borderRadius: 10, border: `1px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, width: "100%", boxSizing: "border-box" }} />
        </div>
        <div>
          <label htmlFor="dep-region" style={labelStyle}>Region</label>
          <select id="dep-region" className="ons-chip" value={region} onChange={(e) => setRegion(e.target.value)}
            style={{ fontFamily: FONT_BODY, fontSize: 16, padding: "9px 10px", borderRadius: 10, border: `1px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, width: "100%", boxSizing: "border-box" }}>
            <option value="all">All of England</option>
            {Object.keys(data.regions).map((k) => <option key={k} value={k}>{nameOf(k)}</option>)}
          </select>
        </div>
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

const NATIONS = [["england", "England"], ["wales", "Wales"], ["scotland", "Scotland"], ["northernireland", "Northern Ireland"]];

export default function DeprivationPage() {
  const [nation, setNation] = useState("england");
  const [domain, setDomain] = useState("imd");
  const [endId, setEndId] = useState("most10");
  const [regionKey, setRegionKey] = useState(() => Object.entries(data.regions).sort((a, b) => b[1].score - a[1].score)[0][0]);

  const end = ENDS.find((e) => e.id === endId);
  const domainLabel = data.domains.find((d) => d.id === domain).label;
  const values = useMemo(() => {
    const v = Object.fromEntries(REGIONS.map((r) => [r.key, null]));
    for (const [k, region] of Object.entries(data.regions)) v[k] = end.pick(region.deciles[domain]);
    return v;
  }, [domain, end]);

  const regionData = data.regions[regionKey];
  const sorted = Object.entries(values).filter(([, v]) => v !== null).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={IconDeprivation} title="Deprivation" subtitle="Which parts of England, Wales, Scotland and Northern Ireland are most and least deprived, and which constituencies, from each nation's official index of deprivation."
        share={nation === "england" ? () => rankingShareSpec({
          kicker: "Deprivation", title: `${domainLabel}: the regions of England`, subtitle: `Share of people who ${end.phrase}`, accent: ACCENT,
          rows: sorted.map(([k, v]) => ({ label: nameOf(k), valueText: f1(v), fraction: v })),
          note: `If deprivation were spread evenly it would be ${end.fair}% everywhere.`, footer: "UK Parliament Tracker · Indices of Deprivation 2025", link: window.location.href,
        }) : undefined}
      />

      <div role="radiogroup" aria-label="Nation" style={{ display: "inline-flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
        {NATIONS.map(([id, label]) => (
          <button key={id} type="button" role="radio" aria-checked={nation === id} className="ons-chip" onClick={() => setNation(id)} style={pillStyle(nation === id)}>{label}</button>
        ))}
      </div>

      {nation !== "england" ? <DeprivationNations key={nation} nation={nation} /> : (
        <>

      <section aria-labelledby="h-dep-what" style={{ ...card, marginTop: 24, position: "relative", overflow: "hidden" }}>
        <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: `linear-gradient(180deg, ${ACCENT}, ${ACCENT}22)` }} />
        <h2 id="h-dep-what" style={cardTitle}>What this measures</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.6, color: COLORS.ink, margin: "10px 0 8px", maxWidth: 800 }}>
          The government ranks all 33,755 small neighbourhoods in England, each home to about 1,500 people, from the most deprived to the least. Deprivation here means more than low income: it covers being out of work, poor health, few qualifications, crime, the cost and quality of housing, and the quality of the local environment. Each neighbourhood is placed in one of ten equal steps, called deciles.
        </p>
        <details className="dep-more" style={{ maxWidth: 800 }}>
          <summary className="ons-tap" style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink, cursor: "pointer", padding: "6px 0" }}>Three things to keep in mind</summary>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.6, color: COLORS.inkSoft, margin: "4px 0 0" }}>
            It ranks places against each other, so it says where is relatively worse off, not how badly off anyone is. It describes neighbourhoods, not individuals: poorer people live in every area. And it covers England only: Wales, Scotland and Northern Ireland have their own indices, built differently, so they cannot be compared with these. Pick one of them above to see theirs.
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

      <AreaList domain={domain} domainLabel={domainLabel} />

      <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.6, color: COLORS.inkSoft, marginTop: 24, maxWidth: 800 }}>
        Source: <a href={data.source.url} style={{ color: "inherit" }}>{data.source.name}</a>, published in November 2025. Regions are worked out here by adding up the people in each region&apos;s neighbourhoods (mid-2022 population estimates), so a region&apos;s figure means the share of its people, not of its neighbourhoods. Council rankings are the Ministry&apos;s own, for the 2024 local authority districts. Contains public sector information licensed under the Open Government Licence v3.0.
      </p>
        </>
      )}
    </div>
  );
}
