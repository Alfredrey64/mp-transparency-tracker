import { useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING, numeric } from "../theme";
import { partyColour } from "../lib/format";
import { searchSeats, seatKey, seatSafety } from "../lib/constituency";
import { shortParty } from "../lib/seatElections";
import { PageHeader, LoadFailedNote } from "./shared";
import { IconSeatCompare, IconSearch } from "./icons";
import ShareButton from "./ShareButton";
import { compareSeatsShareSpec } from "../lib/shareSpecs";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";

// Two constituencies side by side: who holds them, how close the result was, past elections, turnout and deprivation. The
// pair is in the address (#/compareSeats/Hackney North and Stoke Newington~Gainsborough) so a comparison can be linked to.

const SEP = "~";
const fmt = (n) => (n == null ? "–" : Math.round(n).toLocaleString("en-GB"));
const pct1 = (n) => (n == null ? "–" : `${(Math.round(n * 10) / 10).toFixed(1)}%`);
// A lead under 1% keeps two decimals, so a 15-vote majority does not read as 0.0%.
const lead1 = (n) => (n == null ? "–" : n > 0 && n < 1 ? `${n.toFixed(2)}%` : pct1(n));
const colour = (hex) => partyColour(hex, COLORS.inkSoft);
const thumb = (id) => `https://members-api.parliament.uk/api/Members/${id}/Thumbnail`;
const goPair = (a, b) => {
  window.location.hash = a || b ? `#/compareSeats/${encodeURIComponent(`${a ?? ""}${SEP}${b ?? ""}`)}` : "#/compareSeats";
};

function Picker({ seats, label, current, onPick, exclude }) {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => searchSeats(seats, query, 6).filter((m) => m.key !== exclude), [seats, query, exclude]);
  return (
    <div style={{ minWidth: 0 }}>
      <label htmlFor={`pick-${label}`} style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.ink, display: "block", marginBottom: 6 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.accent, display: "flex" }}><IconSearch size={16} /></span>
        <input
          id={`pick-${label}`} type="search" className="ons-chip" value={query} autoComplete="off"
          onChange={(e) => setQuery(e.target.value)}
          placeholder={current ? `${current} (change)` : "A constituency or MP"}
          style={{ fontFamily: FONT_BODY, fontSize: 16, padding: "10px 12px 10px 36px", borderRadius: 12, border: `1.5px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, width: "100%", boxSizing: "border-box" }}
        />
      </div>
      {query.trim().length >= 2 && (
        <ul style={{ listStyle: "none", margin: "6px 0 0", padding: 0, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, overflow: "hidden" }}>
          {matches.length === 0 && <li style={{ padding: "10px 14px", fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>No constituency or MP matches that.</li>}
          {matches.map((m) => (
            <li key={m.key} style={{ borderTop: `1px solid ${COLORS.hairline}` }}>
              <button type="button" onClick={() => { onPick(m.name); setQuery(""); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", background: "none", border: "none", padding: "9px 12px", cursor: "pointer", color: COLORS.ink, fontFamily: FONT_BODY, fontSize: 14 }}>
                <img src={thumb(m.mp.memberId)} alt="" width={30} height={30} loading="lazy" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", border: `2px solid ${colour(m.mp.colour)}`, background: COLORS.paper }} />
                <span style={{ fontWeight: 700 }}>{m.name}</span>
                <span style={{ color: COLORS.inkSoft, fontSize: 12.5 }}>{m.mp.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// A pair of cells that line up: a small title above, then the left seat's value and the right seat's.
function Pair({ title, left, right, tall }) {
  return (
    <div style={{ borderTop: `1px solid ${COLORS.hairline}`, padding: "14px 0" }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft, marginBottom: 8 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "8px clamp(10px, 3vw, 28px)", alignItems: tall ? "start" : "end" }}>
        <div style={{ minWidth: 0 }}>{left}</div>
        <div style={{ minWidth: 0 }}>{right}</div>
      </div>
    </div>
  );
}

const Big = ({ children, sub, tint }) => (
  <>
    <div style={{ ...numeric, fontSize: "clamp(24px, 5vw, 38px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, color: tint ?? COLORS.ink }}>{children}</div>
    {sub && <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 3, lineHeight: 1.4 }}>{sub}</div>}
  </>
);

function Header({ rec }) {
  const c = colour(rec.mp.colour);
  return (
    <div style={{ minWidth: 0, borderTop: `4px solid ${c}`, paddingTop: 12 }}>
      <a href={`#/constituency/${encodeURIComponent(rec.name)}`} style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(20px, 4vw, 30px)", lineHeight: 1.1, color: COLORS.ink, textDecoration: "none", letterSpacing: "-0.02em", display: "block", overflowWrap: "anywhere" }}>{rec.name}</a>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
        <img src={thumb(rec.mp.memberId)} alt="" width={44} height={44} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: `2px solid ${c}`, background: COLORS.paper, flexShrink: 0 }} />
        <div style={{ minWidth: 0, fontFamily: FONT_BODY }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink }}>{rec.mp.name}</div>
          <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>{rec.mp.party}</div>
        </div>
      </div>
    </div>
  );
}

function Shares({ candidates }) {
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 7 }}>
      {candidates.slice(0, 5).map((c, i) => (
        <li key={i} style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.party}</span>
            <span style={numeric}>{pct1((c.share ?? 0) * 100)}</span>
          </div>
          <span aria-hidden="true" style={{ display: "block", height: 7, borderRadius: 4, background: `${COLORS.inkSoft}22`, marginTop: 3 }}>
            <span style={{ display: "block", height: "100%", width: `${Math.min(100, (c.share ?? 0) * 100)}%`, borderRadius: 4, background: colour(c.colour) }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

// Who won each general election since 2010, as a row of coloured blocks with the lead underneath.
function History({ rows, parties }) {
  if (!rows?.length) return <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.5 }}>No older result under this name: it may be a new seat or have been renamed in 2024.</div>;
  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", gap: 6 }}>
      {rows.map((e) => (
        <li key={e.y} style={{ flex: 1, minWidth: 0 }}>
          <span title={`${e.c[0]?.[0]} won in ${e.y}`} style={{ display: "block", height: 22, borderRadius: 5, background: colour(parties[e.c[0]?.[0]]) }} />
          <span style={{ ...numeric, display: "block", fontSize: 11.5, color: COLORS.ink, marginTop: 4 }}>{e.y}</span>
          <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shortParty(e.c[0]?.[0])}</span>
          <span style={{ ...numeric, display: "block", fontSize: 11, color: COLORS.inkSoft }}>+{(Math.round((e.p ?? 0) * 10) / 10).toFixed(1)}</span>
        </li>
      ))}
    </ol>
  );
}

function Deprivation({ info }) {
  if (!info) return <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>Not available for this seat.</div>;
  return (
    <>
      <Big sub={`of its ${info.unit} are in the most deprived tenth of ${info.nation}`}>{pct1(info.worst10)}</Big>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink, marginTop: 6 }}>Number <strong>{info.rank}</strong> of {info.of} in {info.nation}</div>
    </>
  );
}

// Each seat's deprivation, from the index of its own nation (England, Wales or Scotland); Northern Ireland has none here.
async function loadDeprivation() {
  const [eng, nations] = await Promise.all([import("../data/deprivationConstituencies.json"), import("../data/deprivationNations.json")]);
  const map = new Map();
  const add = (seats, nation, unit) => {
    // Rank by the share in the worst tenth, the figure shown, so the rank and the number agree.
    const sorted = [...seats].sort((a, b) => b.worst10 - a.worst10 || b.score - a.score);
    sorted.forEach((s, i) => map.set(seatKey(s.name), { worst10: s.worst10, rank: i + 1, of: sorted.length, nation, unit }));
  };
  add(eng.default.seats, "England", "residents");
  add(nations.default.wales.seats, "Wales", "neighbourhoods");
  add(nations.default.scotland.seats, "Scotland", "neighbourhoods");
  add(nations.default.northernireland.seats, "Northern Ireland", "wards");
  return map;
}

function summary(a, b) {
  const part = (r) => {
    const lead = r.result?.majorityPct;
    const s = seatSafety(lead);
    return `${r.name} is ${s ? `a ${s.label.toLowerCase().replace(" seat", "")} seat` : "a seat"} held by ${r.mp.party}${lead != null ? ` by ${lead1(lead)} of the vote` : ""}`;
  };
  return `${part(a)}; ${part(b)}.`;
}

export default function CompareSeats({ param }) {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [history, setHistory] = useState(null);
  const [dep, setDep] = useState(null);

  useEffect(() => {
    let alive = true;
    import("../data/constituencies.json").then((m) => alive && setData(m.default)).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, []);

  const [nameA, nameB] = useMemo(() => {
    const [a, b] = String(param ?? "").split(SEP);
    return [a?.trim() || null, b?.trim() || null];
  }, [param]);
  const a = data && nameA ? data.constituencies[seatKey(nameA)] : null;
  const b = data && nameB ? data.constituencies[seatKey(nameB)] : null;
  const both = a && b;

  // Each is loaded once, the first time two seats are chosen.
  useEffect(() => {
    if (!both || history) return undefined;
    let alive = true;
    import("../data/electionHistory.json").then((m) => alive && setHistory(m.default)).catch(() => alive && setHistory({ bySeat: {}, parties: {} }));
    return () => { alive = false; };
  }, [both, history]);
  useEffect(() => {
    if (!both || dep) return undefined;
    let alive = true;
    loadDeprivation().then((m) => alive && setDep(m)).catch(() => alive && setDep(new Map()));
    return () => { alive = false; };
  }, [both, dep]);

  const swap = () => goPair(nameB, nameA);
  const colourFor = (r) => colour(r.mp.colour);

  return (
    <div className="regions-wrap" style={{ maxWidth: 1100, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={IconSeatCompare} title="Compare constituencies" subtitle="Pick any two seats to see who holds them, how close the results were, how they have voted before and how deprived each area is." share={false} />
      {failed && <LoadFailedNote item="the constituency data" />}
      {!failed && !data && <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft }}>Loading the constituencies…</p>}
      {data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: "14px 20px", alignItems: "end" }}>
            <Picker seats={data.constituencies} label="First seat" current={a?.name} exclude={b ? seatKey(b.name) : null} onPick={(n) => goPair(n, nameB)} />
            <Picker seats={data.constituencies} label="Second seat" current={b?.name} exclude={a ? seatKey(a.name) : null} onPick={(n) => goPair(nameA, n)} />
          </div>
          {(nameA && !a) || (nameB && !b) ? <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 12 }}>We could not find {nameA && !a ? `"${nameA}"` : `"${nameB}"`}. Search for it above.</p> : null}

          {!both && (
            <section style={{ ...card, marginTop: 24 }}>
              <h2 style={cardTitle}>Pick two seats to begin</h2>
              <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.inkSoft, margin: "8px 0 14px", maxWidth: 640 }}>Search for a constituency or its MP in each box. Or start from a pair that is worth a look:</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[["Blackpool South", "Chelsea and Fulham"], ["Hackney North and Stoke Newington", "Gainsborough"], ["Glasgow North East", "East Renfrewshire"]].map(([x, y]) => (
                  <button key={x} type="button" className="ons-chip" onClick={() => goPair(x, y)} style={pillStyle(false)}>{x} and {y}</button>
                ))}
              </div>
            </section>
          )}

          {both && (
            <section aria-label={`${a.name} compared with ${b.name}`} style={{ ...card, marginTop: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "8px clamp(10px, 3vw, 28px)" }}>
                <Header rec={a} />
                <Header rec={b} />
              </div>
              <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.ink, margin: "16px 0 4px" }}>{summary(a, b)}</p>

              <Pair title="Winner's lead at the last election" left={<Big tint={colourFor(a)} sub={`${fmt(a.result?.majority)} votes · ${seatSafety(a.result?.majorityPct)?.label ?? ""}`}>{lead1(a.result?.majorityPct)}</Big>} right={<Big tint={colourFor(b)} sub={`${fmt(b.result?.majority)} votes · ${seatSafety(b.result?.majorityPct)?.label ?? ""}`}>{lead1(b.result?.majorityPct)}</Big>} />
              <Pair title="Turnout" left={<Big sub={`${fmt(a.result?.turnout)} of ${fmt(a.result?.electorate)} voters`}>{pct1(a.result?.turnoutPct)}</Big>} right={<Big sub={`${fmt(b.result?.turnout)} of ${fmt(b.result?.electorate)} voters`}>{pct1(b.result?.turnoutPct)}</Big>} />
              <Pair title="Share of the vote" tall left={a.result ? <Shares candidates={a.result.candidates} /> : null} right={b.result ? <Shares candidates={b.result.candidates} /> : null} />
              <Pair title="Who won each general election since 2010" tall left={history ? <History rows={history.bySeat[seatKey(a.name)]} parties={history.parties} /> : "Loading…"} right={history ? <History rows={history.bySeat[seatKey(b.name)]} parties={history.parties} /> : "Loading…"} />
              <Pair title="Deprivation" tall left={dep ? <Deprivation info={dep.get(seatKey(a.name))} /> : "Loading…"} right={dep ? <Deprivation info={dep.get(seatKey(b.name))} /> : "Loading…"} />
              {dep && dep.get(seatKey(a.name))?.nation !== dep.get(seatKey(b.name))?.nation && dep.get(seatKey(a.name)) && dep.get(seatKey(b.name)) && (
                <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "0 0 4px" }}>These seats are in different nations, whose deprivation indices are built differently. Each figure is compared with the rest of its own nation, so do not read them against each other.</p>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14, alignItems: "center" }}>
                <button type="button" className="ons-chip" onClick={swap} style={pillStyle(false)}>Swap the two</button>
                <ShareButton filename={`${a.name}-vs-${b.name}`} label="Share this comparison" getSpec={() => compareSeatsShareSpec({ a, b, link: window.location.href })} />
              </div>
            </section>
          )}

          <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.6, color: COLORS.inkSoft, marginTop: 22, maxWidth: 760 }}>
            Results come from Parliament&apos;s Members API. Boundaries changed in 2024, so each earlier general election is for the old seat of the same name, which may cover different ground. Deprivation comes from the English Indices of Deprivation 2025, the Welsh Index of Multiple Deprivation 2025 the Scottish Index of Multiple Deprivation 2020 and the Northern Ireland Multiple Deprivation Measure 2017.
          </p>
        </>
      )}
    </div>
  );
}
