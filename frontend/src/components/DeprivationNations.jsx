import { useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric } from "../theme";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";

// Deprivation in Wales and in Scotland: the Welsh Index of Multiple Deprivation 2025 and the Scottish Index of Multiple
// Deprivation 2020. Each nation ranks only its own neighbourhoods, so every figure here is "compared with the rest of Wales" or
// "of Scotland", never with England. The figures are built by fetch-deprivation-nations.js.

const ACCENT = "#B4432F";
const f1 = (v) => `${(Math.round(v * 10) / 10).toFixed(1)}%`;
const labelStyle = { fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.ink, marginBottom: 6, display: "block" };

const NOTES = {
  wales: {
    place: "Wales",
    intro: "The Welsh Government ranks all 1,917 small neighbourhoods in Wales, each home to about 1,600 people, from the most deprived to the least. The Welsh Index of Multiple Deprivation 2025 combines 54 measures across eight kinds of deprivation, with income and employment counting for the most. Each neighbourhood is placed in one of ten equal steps.",
    kept: "It ranks places against each other, so it says where is relatively worse off than the rest of Wales, not how badly off anyone is. It describes neighbourhoods, not individuals. And the ranking is Wales-only: it is built differently from the English and Scottish indices, so a neighbourhood in the worst tenth of Wales is not the same as one in the worst tenth of England.",
    domains: {
      imd: "A combined score from all eight kinds of deprivation below, weighted by how much each matters. Income counts most (22%), then employment (20%).",
      income: "People on low incomes, including those claiming benefits and tax credits.",
      employment: "People of working age who are out of work through unemployment, sickness, disability or caring.",
      health: "Early death, long-term illness, poor mental health and low birth weight.",
      education: "Low qualifications, school absence and young people not in education, employment or training.",
      access: "How far people live from a GP, a school, a shop, a library and public transport, and the quality of their broadband.",
      housing: "Overcrowding, poor housing conditions and homes without central heating.",
      safety: "Recorded crime and fires.",
      environment: "Air quality, flood risk and access to green space.",
    },
    seatCount: 32,
  },
  scotland: {
    place: "Scotland",
    intro: "The Scottish Government ranks all 6,976 small neighbourhoods in Scotland, called data zones and each home to about 800 people, from the most deprived to the least. The Scottish Index of Multiple Deprivation combines 38 measures across seven kinds of deprivation. Each neighbourhood is placed in one of ten equal steps. This is the 2020 edition (revised in 2020); a new one is planned for late 2026.",
    kept: "It ranks places against each other, so it says where is relatively worse off than the rest of Scotland, not how badly off anyone is. It describes neighbourhoods, not individuals. And the ranking is Scotland-only: it is built differently from the English and Welsh indices, so a data zone in the worst tenth of Scotland is not the same as a neighbourhood in the worst tenth of England.",
    domains: {
      imd: "A combined score from all seven kinds of deprivation below, weighted by how much each matters. Income and employment count most (28% each).",
      income: "People on low incomes, including those claiming benefits and tax credits.",
      employment: "People of working age who are out of work through unemployment, sickness or disability.",
      education: "Low qualifications, school attendance and attainment, and young people who go on to higher education.",
      health: "Early death, hospital stays, prescriptions for anxiety and depression, and low birth weight.",
      access: "How long it takes to drive or take public transport to a GP, a shop, a school and a post office, and broadband.",
      crime: "The rate of recorded crimes of violence, sexual offences, domestic housebreaking, vandalism, drugs and common assault.",
      housing: "Overcrowding and homes without central heating.",
    },
    seatCount: 57,
  },
  northernireland: {
    place: "Northern Ireland",
    intro: "The Northern Ireland Statistics and Research Agency ranks Northern Ireland's 462 electoral wards, each home to about 4,000 people, from the most deprived to the least. The Northern Ireland Multiple Deprivation Measure combines 37 measures across seven kinds of deprivation. This is the 2017 edition, the latest published: it is older than England's, Wales's and Scotland's, and a newer one has not yet appeared. NISRA also ranks 890 smaller areas, but wards are used here so that council areas and constituencies are counted the same way.",
    kept: "It ranks places against each other, so it says where is relatively worse off than the rest of Northern Ireland, not how badly off anyone is. A ward is a big area, so it can hide pockets of deprivation inside it. It describes places, not individuals. And the ranking is Northern Ireland-only: it is built differently from the English, Welsh and Scottish indices, so a ward in the worst tenth here is not the same as a neighbourhood in the worst tenth of England.",
    domains: {
      imd: "A combined score from all seven kinds of deprivation below, weighted by how much each matters. Income and employment count most (25% each).",
      income: "People living in households with an income below 60% of the Northern Ireland median, including those on means-tested benefits.",
      employment: "People of working age who are out of work through unemployment, sickness, disability or caring.",
      health: "Early death, poor physical and mental health, hospital admissions, low birth weight and long-term illness or disability.",
      education: "Special educational needs, school absence, GCSE results, young people not in education or training, and adult qualifications.",
      access: "How far and how long it takes to reach a GP, a school, a shop and other services, and broadband speed.",
      living: "Poor and unfit housing, overcrowding, road defects and collisions, and flood risk.",
      crime: "Rates of violence, burglary, theft, vehicle crime and criminal damage, plus deliberate fires and anti-social behaviour.",
    },
    seatCount: 18,
  },
};

// One bar for each council area, in the order of the kind of deprivation picked, against an even spread.
function CouncilBars({ areas, domain, place }) {
  const rows = areas.map((a) => ({ ...a, value: domain === "imd" ? a.worst10 : a.domains[domain] ?? 0 })).sort((x, y) => y.value - x.value || y.score - x.score);
  const max = Math.max(...rows.map((r) => r.value), 10);
  return (
    <div>
      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 5 }}>
        {rows.map((r) => (
          <li key={r.code} style={{ display: "grid", gridTemplateColumns: "minmax(110px, 190px) minmax(0, 1fr) 54px", gap: 10, alignItems: "center", fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
            <span aria-hidden="true" style={{ position: "relative", height: 10, borderRadius: 5, background: `${ACCENT}16` }}>
              <span style={{ display: "block", height: "100%", width: `${(r.value / max) * 100}%`, minWidth: r.value > 0 ? 3 : 0, borderRadius: 5, background: ACCENT }} />
              <span style={{ position: "absolute", top: -3, bottom: -3, left: `${(10 / max) * 100}%`, borderLeft: `2px dashed ${COLORS.inkSoft}`, opacity: 0.7 }} />
            </span>
            <span style={{ ...numeric, textAlign: "right", fontSize: 13 }}>{f1(r.value)}</span>
          </li>
        ))}
      </ol>
      <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, margin: "10px 0 0" }}>
        The dashed line marks 10%, what every area would have if deprivation were spread evenly across {place}.
      </p>
    </div>
  );
}

// One council area or constituency in the ranked list. Press it for the breakdown by kind of deprivation.
function Row({ area, kind, total, measure, domains, place, unit }) {
  const [open, setOpen] = useState(false);
  const seat = kind === "constituencies";
  return (
    <li style={{ borderTop: `1px solid ${COLORS.hairline}` }}>
      <button type="button" className="ons-tap" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        style={{ display: "grid", gridTemplateColumns: "34px minmax(0, 1fr) auto", gap: "2px 12px", alignItems: "center", width: "100%", textAlign: "left", font: "inherit", background: "none", border: "none", padding: "10px 4px", cursor: "pointer" }}>
        <span style={{ ...numeric, fontSize: 14, color: COLORS.inkSoft }}>{area.rank}</span>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 14.5, fontWeight: 700, color: COLORS.ink }}>{area.name}</span>
          {seat && area.place && <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>Mostly in {area.place}</span>}
        </span>
        <span style={{ textAlign: "right" }}>
          <span style={{ ...numeric, display: "block", fontSize: 15, fontWeight: 600, color: COLORS.ink }}>{f1(area.value)}</span>
          <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>of {unit} in worst tenth</span>
        </span>
      </button>
      {open && (
        <div style={{ padding: "2px 4px 14px 46px" }}>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.55, color: COLORS.ink, margin: "0 0 8px" }}>
            Number <strong>{area.rank}</strong> of {total} {seat ? "constituencies" : "council areas"} in {place} for {measure.toLowerCase()}, where 1 is the most deprived. {f1(area.value)} of its {unit} are among the most deprived tenth in {place} ({Math.round(area.n)} {unit} in all). Overall, {f1(area.worst10)}; {f1(area.worst20)} are in the worst fifth and {f1(area.best10)} in the least deprived tenth. The share in the worst tenth, by kind of deprivation:
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
            {domains.slice(1).map((d) => (
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

function List({ nation, data, domain, domainLabel }) {
  const note = NOTES[nation];
  const [kind, setKind] = useState("constituencies");
  const [query, setQuery] = useState("");
  const [council, setCouncil] = useState("all");
  const [showAll, setShowAll] = useState(false);

  const ranked = useMemo(() => {
    const raw = kind === "councils" ? data.areas : data.seats;
    const withValue = raw.map((a) => ({ ...a, value: domain === "imd" ? a.worst10 : a.domains[domain] ?? 0 }));
    withValue.sort((x, y) => y.value - x.value || y.score - x.score);
    return withValue.map((a, i) => ({ ...a, rank: i + 1 }));
  }, [kind, data, domain]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => ranked.filter((a) => (council === "all" || kind === "councils" || a.place === council) && (!q || a.name.toLowerCase().includes(q))), [ranked, council, q, kind]);
  const front = !q && !showAll && council === "all";
  const noun = kind === "councils" ? "council area" : "constituency";
  const plural = kind === "councils" ? "council areas" : "constituencies";
  const names = useMemo(() => data.areas.map((a) => a.name).sort(), [data]);
  const idBase = `dep-${nation}`;

  return (
    <section aria-labelledby={`h-${idBase}-areas`} className="regions-wrap" style={{ ...card, marginTop: 20 }}>
      <h2 id={`h-${idBase}-areas`} style={cardTitle}>Council by council, or seat by seat</h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.inkSoft, margin: "6px 0 14px", maxWidth: 800 }}>
        Every council area and every Westminster constituency in {note.place}, ranked on <strong style={{ color: COLORS.ink }}>{domainLabel.toLowerCase()}</strong> (change it with the buttons above). Rank 1 is the most deprived. The figure on the right is the share of its {data.unit ?? "neighbourhoods"} in the most deprived tenth of {note.place}. Tap one for the detail.
      </p>
      <div role="radiogroup" aria-label="What to rank" style={{ display: "inline-flex", gap: 6, marginBottom: 14 }}>
        {[["constituencies", `Constituencies (${data.seats.length})`], ["councils", `Council areas (${data.areas.length})`]].map(([id, label]) => (
          <button key={id} type="button" role="radio" aria-checked={kind === id} className="ons-chip" onClick={() => { setKind(id); setShowAll(false); }} style={pillStyle(kind === id)}>{label}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: "10px 16px", marginBottom: 8 }}>
        <div>
          <label htmlFor={`${idBase}-search`} style={labelStyle}>Find your {noun}</label>
          <input id={`${idBase}-search`} type="search" className="ons-chip" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={kind === "councils" ? "Type a name" : "Type a constituency"} autoComplete="off"
            style={{ fontFamily: FONT_BODY, fontSize: 16, padding: "9px 12px", borderRadius: 10, border: `1px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, width: "100%", boxSizing: "border-box" }} />
        </div>
        {kind === "constituencies" && (
          <div>
            <label htmlFor={`${idBase}-council`} style={labelStyle}>Council area</label>
            <select id={`${idBase}-council`} className="ons-chip" value={council} onChange={(e) => setCouncil(e.target.value)}
              style={{ fontFamily: FONT_BODY, fontSize: 16, padding: "9px 10px", borderRadius: 10, border: `1px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, width: "100%", boxSizing: "border-box" }}>
              <option value="all">All of {note.place}</option>
              {names.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}
      </div>
      {front && (
        <div className="dep-two">
          <div>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: COLORS.ink, margin: "12px 0 0" }}>The 10 most deprived</h3>
            <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>{ranked.slice(0, 10).map((a) => <Row key={a.code} area={a} kind={kind} total={ranked.length} measure={domainLabel} domains={data.domains} place={note.place} unit={data.unit ?? "neighbourhoods"} />)}</ol>
          </div>
          <div>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: COLORS.ink, margin: "12px 0 0" }}>The 10 least deprived</h3>
            <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>{ranked.slice(-10).map((a) => <Row key={a.code} area={a} kind={kind} total={ranked.length} measure={domainLabel} domains={data.domains} place={note.place} unit={data.unit ?? "neighbourhoods"} />)}</ol>
          </div>
        </div>
      )}
      {front && <button type="button" className="ons-tap" onClick={() => setShowAll(true)} style={{ ...pillStyle(false), marginTop: 14, cursor: "pointer" }}>Show all {ranked.length} {plural}</button>}
      {!front && (
        <>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, margin: "10px 0 0" }} aria-live="polite">{filtered.length === 0 ? `No ${noun} matches that name.` : `${filtered.length} ${filtered.length === 1 ? noun : plural}${q ? ` matching "${query.trim()}"` : ""}${council !== "all" && kind === "constituencies" ? ` mostly in ${council}` : ""}.`}</p>
          <ol style={{ listStyle: "none", margin: "4px 0 0", padding: 0 }}>{filtered.map((a) => <Row key={a.code} area={a} kind={kind} total={ranked.length} measure={domainLabel} domains={data.domains} place={note.place} unit={data.unit ?? "neighbourhoods"} />)}</ol>
        </>
      )}
      {kind === "constituencies" && <p style={{ fontFamily: FONT_BODY, fontSize: 12, lineHeight: 1.55, color: COLORS.inkSoft, margin: "14px 0 0" }}>{data.boundaries} Treat small differences as rough.</p>}
    </section>
  );
}

export default function DeprivationNations({ nation }) {
  const [all, setAll] = useState(null);
  const [failed, setFailed] = useState(false);
  const [domain, setDomain] = useState("imd");
  const note = NOTES[nation];

  useEffect(() => {
    let alive = true;
    import("../data/deprivationNations.json").then((m) => alive && setAll(m.default)).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, []);

  const data = all?.[nation];
  const domainLabel = data?.domains.find((d) => d.id === domain)?.label ?? "Overall deprivation";
  const ordered = useMemo(() => (data ? [...data.areas].map((a) => ({ ...a, value: domain === "imd" ? a.worst10 : a.domains[domain] ?? 0 })).sort((x, y) => y.value - x.value) : []), [data, domain]);

  if (failed) return <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, marginTop: 24 }}>The {note.place} figures could not be loaded. Refresh the page to try again.</p>;
  if (!data) return <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, marginTop: 24 }}>Loading the {note.place} figures…</p>;

  return (
    <>
      <section aria-labelledby={`h-dep-${nation}-what`} style={{ ...card, marginTop: 24, position: "relative", overflow: "hidden" }}>
        <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: `linear-gradient(180deg, ${ACCENT}, ${ACCENT}22)` }} />
        <h2 id={`h-dep-${nation}-what`} style={cardTitle}>What this measures in {note.place}</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.6, color: COLORS.ink, margin: "10px 0 8px", maxWidth: 800 }}>{note.intro}</p>
        <details className="dep-more" style={{ maxWidth: 800 }}>
          <summary className="ons-tap" style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink, cursor: "pointer", padding: "6px 0" }}>Three things to keep in mind</summary>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.6, color: COLORS.inkSoft, margin: "4px 0 0" }}>{note.kept}</p>
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
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.inkSoft, margin: "0 0 14px", maxWidth: 800 }}>{note.domains[domain]}</p>

      <section aria-labelledby={`h-dep-${nation}-bars`} className="regions-wrap" style={{ ...card, background: `radial-gradient(560px 340px at 50% 0%, ${ACCENT}1a, transparent 70%), ${COLORS.paperCard}` }}>
        <h2 id={`h-dep-${nation}-bars`} style={cardTitle}>Where it is concentrated</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.55, color: COLORS.ink, margin: "8px 0 16px", maxWidth: 800 }} aria-live="polite">
          <strong>{domainLabel}:</strong> in <strong>{ordered[0].name}</strong>, {f1(ordered[0].value)} of {data.unit ?? "neighbourhoods"} are in the most deprived tenth of {note.place}, the most of any council area. In <strong>{ordered.at(-1).name}</strong> it is {f1(ordered.at(-1).value)}. If deprivation were spread evenly it would be 10% everywhere.
        </p>
        <CouncilBars areas={data.areas} domain={domain} place={note.place} />
      </section>

      <List nation={nation} data={data} domain={domain} domainLabel={domainLabel} />

      <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.6, color: COLORS.inkSoft, marginTop: 24, maxWidth: 800 }}>
        Source: <a href={data.source.url} style={{ color: "inherit" }}>{data.source.name}</a>, published {data.source.published}. Shares are counted by {data.unit === "wards" ? "ward" : "neighbourhood"}, not by population. Contains public sector information licensed under the Open Government Licence v3.0.
      </p>
    </>
  );
}
