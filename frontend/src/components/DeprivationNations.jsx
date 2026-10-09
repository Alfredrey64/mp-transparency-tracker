import { useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric } from "../theme";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";
import { HowToRead, Row as Field, Segmented, SelectField } from "./DeprivationControls";
import { KINDS } from "../data/deprivationKinds";
import { oneIn, oneInShort, againstFair } from "../lib/deprivationPlain";

// Deprivation in Wales and in Scotland: the Welsh Index of Multiple Deprivation 2025 and the Scottish Index of Multiple
// Deprivation 2020. Each nation ranks only its own neighbourhoods, so every figure here is "compared with the rest of Wales" or
// "of Scotland", never with England. The figures are built by fetch-deprivation-nations.js.

const ACCENT = "#B4432F";
const f1 = (v) => `${(Math.round(v * 10) / 10).toFixed(1)}%`;
const labelStyle = { fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.ink, marginBottom: 6, display: "block" };

const NOTES = {
  wales: {
    place: "Wales",
    intro: "The Welsh Government has ranked all 1,917 small neighbourhoods in Wales (each with about 1,600 people) from the most deprived to the least. The Welsh Index of Multiple Deprivation 2025 pulls together 54 measures across eight kinds of hardship, and income and employment count for the most.",
    kept: "It compares places with each other, so it shows where is worse off than the rest of Wales, not how badly off anyone is. It describes neighbourhoods, not individuals. And it is a Welsh measure only: it is built differently from the English, Scottish and Northern Irish ones, so being in the worst tenth of Wales is not the same as being in the worst tenth of England.",
    counts: "neighbourhoods",
  },
  scotland: {
    place: "Scotland",
    intro: "The Scottish Government has ranked all 6,976 small neighbourhoods in Scotland, called data zones (each with about 800 people), from the most deprived to the least. The Scottish Index of Multiple Deprivation pulls together 38 measures across seven kinds of hardship. This is the 2020 edition, revised later that year; a new one is planned for late 2026.",
    kept: "It compares places with each other, so it shows where is worse off than the rest of Scotland, not how badly off anyone is. It describes neighbourhoods, not individuals. And it is a Scottish measure only: it is built differently from the English, Welsh and Northern Irish ones, so being in the worst tenth of Scotland is not the same as being in the worst tenth of England.",
    counts: "neighbourhoods",
  },
  northernireland: {
    place: "Northern Ireland",
    intro: "The Northern Ireland Statistics and Research Agency has ranked Northern Ireland's 462 electoral wards (each with about 4,000 people) from the most deprived to the least. The Northern Ireland Multiple Deprivation Measure pulls together 37 measures across seven kinds of hardship. This is the 2017 edition, the latest published, so it is the oldest of the four. Wards are big areas, so they can hide small pockets of hardship.",
    kept: "It compares places with each other, so it shows where is worse off than the rest of Northern Ireland, not how badly off anyone is. It describes places, not individuals. And it is a Northern Irish measure only: it is built differently from the English, Welsh and Scottish ones, so being in the worst tenth here is not the same as being in the worst tenth of England.",
    counts: "wards",
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
          <li key={r.code} style={{ display: "grid", gridTemplateColumns: "minmax(110px, 190px) minmax(0, 1fr) 92px", gap: 10, alignItems: "center", fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
            <span aria-hidden="true" style={{ position: "relative", height: 10, borderRadius: 5, background: `${ACCENT}16` }}>
              <span style={{ display: "block", height: "100%", width: `${(r.value / max) * 100}%`, minWidth: r.value > 0 ? 3 : 0, borderRadius: 5, background: ACCENT }} />
              <span style={{ position: "absolute", top: -3, bottom: -3, left: `${(10 / max) * 100}%`, borderLeft: `2px dashed ${COLORS.inkSoft}`, opacity: 0.7 }} />
            </span>
            <span style={{ ...numeric, textAlign: "right", fontSize: 13 }} title={f1(r.value)}>{oneInShort(r.value)}</span>
          </li>
        ))}
      </ol>
      <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, margin: "10px 0 0" }}>
        The dashed line marks a fair share, 1 in 10 (10%): what every area would have if hardship were spread evenly across {place}.
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
          <span style={{ ...numeric, display: "block", fontSize: 16, fontWeight: 600, color: COLORS.ink }}>{oneInShort(area.value)}</span>
          <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>{f1(area.value)}{againstFair(area.value).ratio >= 1.12 ? ` · ${againstFair(area.value).text} a fair share` : ""}</span>
        </span>
      </button>
      {open && (
        <div style={{ padding: "2px 4px 14px 46px" }}>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.55, color: COLORS.ink, margin: "0 0 8px" }}>
            {area.name} is number <strong>{area.rank}</strong> of {total} {seat ? "constituencies" : "council areas"} in {place} for {measure.toLowerCase()}, where 1 is the most deprived. <strong>{oneIn(area.value)}</strong> of its {Math.round(area.n)} {unit} ({f1(area.value)}) are in the most deprived tenth of {place}. Overall, {oneIn(area.worst10)} are in the worst tenth, {oneIn(area.worst20)} in the worst fifth and {oneIn(area.best10)} in the least deprived tenth. Here is how it splits by kind of hardship, as the share in the worst tenth:
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
            {domains.slice(1).map((d) => (
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
      <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.6, color: COLORS.inkSoft, margin: "6px 0 14px", maxWidth: 780 }}>
        Every council area and every Westminster constituency in {note.place}, from the most deprived to the least, for <strong style={{ color: COLORS.ink }}>{domainLabel.toLowerCase()}</strong>. The big figure says roughly how many of its {data.unit ?? "neighbourhoods"} are in the most deprived tenth of {note.place}: 1 in 10 would be a fair share. Tap one to see more.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: "12px 16px", marginBottom: 8, alignItems: "end" }}>
        <Field label="Show">
          <Segmented label="What to rank" value={kind} onChange={(v) => { setKind(v); setShowAll(false); }} small options={[{ id: "constituencies", label: `Constituencies (${data.seats.length})`, short: "Constituencies" }, { id: "councils", label: `Council areas (${data.areas.length})`, short: "Councils" }]} />
        </Field>
        <div>
          <label htmlFor={`${idBase}-search`} style={labelStyle}>Search by name</label>
          <input id={`${idBase}-search`} type="search" className="ons-chip" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={kind === "councils" ? "Type a name" : "Type a constituency"} autoComplete="off"
            style={{ fontFamily: FONT_BODY, fontSize: 16, padding: "10px 12px", borderRadius: 12, border: `1.5px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, width: "100%", boxSizing: "border-box" }} />
        </div>
        {kind === "constituencies" && <SelectField id={`${idBase}-council`} label="Council area" value={council} onChange={setCouncil} options={[{ id: "all", label: `All of ${note.place}` }, ...names.map((n) => ({ id: n, label: n }))]} />}
      </div>
      {front && (
        <div className="dep-two">
          <div>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: COLORS.ink, margin: "12px 0 0" }}>The 10 most deprived</h3>
            <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>{ranked.slice(0, 10).map((a) => <Row key={a.code} area={a} kind={kind} total={ranked.length} measure={domainLabel} domains={KINDS[nation]} place={note.place} unit={data.unit ?? "neighbourhoods"} />)}</ol>
          </div>
          <div>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: COLORS.ink, margin: "12px 0 0" }}>The 10 least deprived</h3>
            <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>{ranked.slice(-10).map((a) => <Row key={a.code} area={a} kind={kind} total={ranked.length} measure={domainLabel} domains={KINDS[nation]} place={note.place} unit={data.unit ?? "neighbourhoods"} />)}</ol>
          </div>
        </div>
      )}
      {front && <button type="button" className="ons-tap" onClick={() => setShowAll(true)} style={{ ...pillStyle(false), marginTop: 14, cursor: "pointer" }}>Show all {ranked.length} {plural}</button>}
      {!front && (
        <>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, margin: "10px 0 0" }} aria-live="polite">{filtered.length === 0 ? `No ${noun} matches that name.` : `${filtered.length} ${filtered.length === 1 ? noun : plural}${q ? ` matching "${query.trim()}"` : ""}${council !== "all" && kind === "constituencies" ? ` mostly in ${council}` : ""}.`}</p>
          <ol style={{ listStyle: "none", margin: "4px 0 0", padding: 0 }}>{filtered.map((a) => <Row key={a.code} area={a} kind={kind} total={ranked.length} measure={domainLabel} domains={KINDS[nation]} place={note.place} unit={data.unit ?? "neighbourhoods"} />)}</ol>
        </>
      )}
      {kind === "constituencies" && <p style={{ fontFamily: FONT_BODY, fontSize: 12, lineHeight: 1.55, color: COLORS.inkSoft, margin: "14px 0 0" }}>{data.boundaries} Treat small differences as rough.</p>}
    </section>
  );
}

export default function DeprivationNations({ nation, kind: domain = "imd" }) {
  const [all, setAll] = useState(null);
  const [failed, setFailed] = useState(false);
  const note = NOTES[nation];

  useEffect(() => {
    let alive = true;
    import("../data/deprivationNations.json").then((m) => alive && setAll(m.default)).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, []);

  const data = all?.[nation];
  const domainLabel = KINDS[nation].find((d) => d.id === domain)?.label ?? "Overall deprivation";
  const ordered = useMemo(() => (data ? [...data.areas].map((a) => ({ ...a, value: domain === "imd" ? a.worst10 : a.domains[domain] ?? 0 })).sort((x, y) => y.value - x.value) : []), [data, domain]);

  if (failed) return <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, marginTop: 24 }}>The {note.place} figures could not be loaded. Refresh the page to try again.</p>;
  if (!data) return <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, marginTop: 24 }}>Loading the {note.place} figures…</p>;

  return (
    <>
      <section aria-labelledby={`h-dep-${nation}-what`} style={{ ...card, marginTop: 20, position: "relative", overflow: "hidden" }}>
        <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: `linear-gradient(180deg, ${ACCENT}, ${ACCENT}22)` }} />
        <h2 id={`h-dep-${nation}-what`} style={cardTitle}>What this shows for {note.place}</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.6, color: COLORS.ink, margin: "10px 0 0", maxWidth: 780 }}>{note.intro}</p>
        <HowToRead place={note.place} counts={note.counts} unit={note.counts === "wards" ? "ward" : "neighbourhood"} />
        <details className="dep-more" style={{ maxWidth: 780, marginTop: 10 }}>
          <summary className="ons-tap" style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink, cursor: "pointer", padding: "6px 0" }}>Three things to keep in mind</summary>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.6, color: COLORS.inkSoft, margin: "4px 0 0" }}>{note.kept}</p>
        </details>
      </section>

      <section aria-labelledby={`h-dep-${nation}-bars`} className="regions-wrap" style={{ ...card, marginTop: 20, background: `radial-gradient(560px 340px at 50% 0%, ${ACCENT}1a, transparent 70%), ${COLORS.paperCard}` }}>
        <h2 id={`h-dep-${nation}-bars`} style={cardTitle}>Where it is worst</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.55, color: COLORS.ink, margin: "8px 0 16px", maxWidth: 800 }} aria-live="polite">
          <strong>{domainLabel}:</strong> in <strong>{ordered[0].name}</strong>, {oneIn(ordered[0].value)} of its {data.unit ?? "neighbourhoods"} ({f1(ordered[0].value)}) are in the most deprived tenth of {note.place}. That is {againstFair(ordered[0].value).text} a fair share (1 in 10), and the most of any council area. In <strong>{ordered.at(-1).name}</strong> it is {oneIn(ordered.at(-1).value)} ({f1(ordered.at(-1).value)}).
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
