import { useCallback, useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric } from "../theme";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";
import { scrollRegion } from "../lib/a11y";
import history from "../data/electionsHistory.json";
import hexes2019 from "../data/seatHexes2019.json";
import hexes2024 from "../data/seatHexes.json";
import { REPLACED_SEAT_WINNERS } from "../lib/generalElection";
import { GROUPS, GROUP_ORDER, NO_MATCH, election2024, outcome, electionLabel, electionShort, seatTimeline, seatResults2024, shadeFor } from "../lib/electionHistory";
import { GOVERNMENTS } from "../data/governments";
import { normSeat, REGIONS } from "../lib/seatMap";
import ElectionMap from "./ElectionMap";
import Hemicycle from "./Hemicycle";
import Loading from "./Loading";

// The past elections tab: pick any general election since 1945 to see the balance of seats and votes, the government that followed, and a map
// of who won where. Results are from Parliament's constituency data (see scripts/build-election-history.mjs).

// Left to right on the half-circle: from the left of politics to the right, then the rest.
const ORDER = ["g", "l", "p", "s", "d", "x", "n", "k", "c", "u"];

const ELECTIONS = [...history.elections, election2024()].map((e) => ({ ...e, ...outcome(e) }));
const para = { fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.65, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 760 };
const pctText = (v) => (v == null ? "n/a" : v > 0 && v < 0.5 ? "<1%" : `${Math.round(v)}%`);
const dateText = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

const governmentFor = (id) => GOVERNMENTS.find((g) => g.elections.includes(id));

function headline(e) {
  const lead = GROUPS[e.leader].label;
  if (e.majority) return `${lead} won a majority`;
  return `No party won a majority. ${lead} came first with ${e.leaderSeats} seats`;
}

function Stack({ e, kind }) {
  const total = kind === "seats" ? e.seats : 100;
  const data = kind === "seats" ? e.seatsWon : e.voteShare;
  const parts = GROUP_ORDER.filter((k) => (data[k] ?? 0) > 0).map((k) => ({ k, v: data[k] }));
  const sum = parts.reduce((n, p) => n + p.v, 0);
  return (
    <div role="img" aria-label={`${kind === "seats" ? "Seats" : "Share of the vote"}: ${parts.map((p) => `${GROUPS[p.k].label} ${kind === "seats" ? p.v : `${Math.round(p.v)}%`}`).join(", ")}`} style={{ display: "flex", gap: 2, height: 22, borderRadius: 11, overflow: "hidden", background: COLORS.paper }}>
      {parts.map((p) => (
        <span key={p.k} title={`${GROUPS[p.k].label}: ${kind === "seats" ? p.v : `${p.v}%`}`} style={{ flex: `${p.v / (sum || total)} 1 0`, background: GROUPS[p.k].colour, minWidth: 2 }} />
      ))}
    </div>
  );
}

function ResultTable({ e }) {
  const rows = GROUP_ORDER.filter((k) => (e.seatsWon[k] ?? 0) > 0 || (e.voteShare[k] ?? 0) >= 1);
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_BODY, fontSize: 14, marginTop: 14 }}>
      <caption style={{ position: "absolute", left: -9999 }}>Seats and share of the vote by party, {electionLabel(e)}</caption>
      <thead>
        <tr style={{ color: COLORS.inkSoft, textAlign: "right", fontSize: 12.5 }}>
          <th scope="col" style={{ textAlign: "left", fontWeight: 600, padding: "6px 0" }}>Party</th>
          <th scope="col" style={{ fontWeight: 600, padding: "6px 0" }}>Seats</th>
          <th scope="col" style={{ fontWeight: 600, padding: "6px 0 6px 14px" }}>Votes</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((k) => (
          <tr key={k} style={{ borderTop: `1px solid ${COLORS.hairline}` }}>
            <th scope="row" style={{ textAlign: "left", fontWeight: 600, color: COLORS.ink, padding: "8px 0" }}>
              <span aria-hidden="true" style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: GROUPS[k].colour, marginRight: 8 }} />
              {GROUPS[k].label}
            </th>
            <td style={{ ...numeric, textAlign: "right", color: COLORS.ink, fontWeight: 700 }}>{e.seatsWon[k] ?? 0}</td>
            <td style={{ ...numeric, textAlign: "right", color: COLORS.inkSoft, paddingLeft: 14 }}>{pctText(e.voteShare[k])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SeatHistory({ index, elections, name }) {
  const line = seatTimeline(index, elections, history.maps).filter((t) => t.group);
  const all = [...line];
  if (!all.length) return null;
  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, margin: 0, color: COLORS.ink }}>{name}, election by election</h3>
      <p style={{ ...para, fontSize: 13.5, marginTop: 4 }}>The party that won a seat with this name at each election it appears in. Boundaries change over time, so an old result may cover a different area from today's seat.</p>
      <ul {...scrollRegion("Winners by election")} style={{ listStyle: "none", margin: "10px 0 0", padding: "2px 0 6px", display: "flex", gap: 8, overflowX: "auto" }}>
        {all.map((t) => (
          <li key={t.id} style={{ flexShrink: 0, textAlign: "center", minWidth: 58 }}>
            <span title={GROUPS[t.group].label} style={{ display: "block", height: 28, borderRadius: 8, background: shadeFor(GROUPS[t.group].colour, t.band), border: `1px solid ${COLORS.hairline}` }} />
            <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 4 }}>{electionShort(elections.find((e) => e.id === t.id))}</span>
            <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.ink, fontWeight: 600 }}>{GROUPS[t.group].short ?? GROUPS[t.group].label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

let constituenciesPromise = null;
const loadConstituencies = () => (constituenciesPromise ??= import("../data/constituencies.json").then((m) => m.default.constituencies));

export default function ElectionHistory({ electionId, onPick }) {
  const e = ELECTIONS.find((x) => x.id === electionId) ?? ELECTIONS[ELECTIONS.length - 1];
  const is2024 = e.id === "2024";
  const [mode, setMode] = useState("winner");
  // The chosen seat belongs to the election it was chosen in, so changing election clears it without an effect.
  const [sel, setSel] = useState({ id: null, i: null });
  const picked = sel.id === e.id ? sel.i : null;
  const setPicked = (i) => setSel({ id: e.id, i });
  const [query, setQuery] = useState("");
  const [constituencies, setConstituencies] = useState(null);

  useEffect(() => {
    if (!is2024 || constituencies) return undefined;
    let alive = true;
    loadConstituencies().then((c) => alive && setConstituencies(c));
    return () => { alive = false; };
  }, [is2024, constituencies]);

  const hexes = is2024 ? hexes2024.hexes : hexes2019.hexes;
  const flat = !is2024;

  // What each hexagon shows for this election.
  const results = useMemo(() => {
    if (is2024) return constituencies ? seatResults2024(hexes2024.hexes, constituencies, REPLACED_SEAT_WINNERS) : null;
    const entry = history.maps[e.id];
    if (!entry) return null;
    return hexes2019.hexes.map((_, i) => (entry.w[i] === "." ? null : { group: entry.w[i], band: Number(entry.b[i]) }));
  }, [e.id, is2024, constituencies]);

  const paint = useCallback((i) => {
    const r = results?.[i];
    if (!r) return { fill: NO_MATCH, swatch: NO_MATCH, note: results ? "No seat of this name at this election" : "Loading" };
    const colour = GROUPS[r.group].colour;
    const fill = mode === "lead" ? shadeFor(colour, r.band) : colour;
    const leadText = r.lead != null ? ` · ${r.lead.toFixed(1)} point lead` : r.band != null && !is2024 ? ` · lead of ${r.band * 5} to ${r.band === 9 ? "50+" : r.band * 5 + 5} points` : "";
    return { fill, swatch: colour, note: `${GROUPS[r.group].label}${leadText}` };
  }, [results, mode, is2024]);

  const matches = useMemo(() => {
    const q = normSeat(query);
    if (q.length < 2) return [];
    return hexes.map((h, i) => ({ i, name: h[1] })).filter((h) => normSeat(h.name).includes(q)).slice(0, 8);
  }, [query, hexes]);

  const gov = governmentFor(e.id);
  const coverage = !is2024 && results ? results.filter(Boolean).length : null;
  const present = results ? GROUP_ORDER.filter((k) => results.some((r) => r?.group === k)) : [];
  const parties = GROUP_ORDER.filter((k) => (e.seatsWon[k] ?? 0) > 0).map((k) => ({ key: k, colour: GROUPS[k].colour, count: e.seatsWon[k] })).sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key));
  const pickedName = picked != null ? hexes[picked]?.[1] : null;
  const pickedResult = picked != null ? results?.[picked] : null;

  return (
    <div>
      <div {...scrollRegion("Elections")} style={{ display: "flex", gap: 8, overflowX: "auto", padding: "4px 2px 10px", marginTop: 4 }}>
        {ELECTIONS.map((x) => (
          <button key={x.id} type="button" aria-pressed={x.id === e.id} onClick={() => onPick(x.id)} style={{ ...pillStyle(x.id === e.id), flexShrink: 0, fontWeight: 600 }}>
            {electionShort(x)}
          </button>
        ))}
      </div>

      <section aria-labelledby="h-eh-result" style={{ ...card, marginTop: 8 }}>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, margin: 0 }}>{dateText(e.date)}</p>
        <h2 id="h-eh-result" style={{ ...cardTitle, fontSize: "clamp(22px, 4.2vw, 32px)", lineHeight: 1.2, marginTop: 4 }}>
          {electionLabel(e)}: {headline(e)}
        </h2>
        <p style={para}>
          {e.majority
            ? `${GROUPS[e.leader].label} won ${e.leaderSeats} of the ${e.seats} seats, with ${Math.round(e.voteShare[e.leader] ?? 0)}% of the votes. ${e.needed} were needed for a majority.`
            : `${e.needed} of the ${e.seats} seats were needed for a majority. ${GROUPS[e.leader].label} won ${e.leaderSeats} (${Math.round(e.voteShare[e.leader] ?? 0)}% of the votes), ${e.shortBy} short.`}{" "}
          {e.moreVotesFewerSeats && `${GROUPS[e.moreVotesFewerSeats].label} won more votes (${Math.round(e.voteShare[e.moreVotesFewerSeats])}%) but fewer seats. `}
          {`Turnout was ${e.turnout}%.`}
        </p>
        <div style={{ marginTop: 16 }}>
          <Hemicycle parties={parties} label={`The ${e.seats} seats after the ${electionLabel(e)} election: ${parties.map((p) => `${GROUPS[p.key].label} ${p.count}`).join(", ")}`} />
        </div>
        <div style={{ display: "grid", gap: 10, marginTop: 6 }}>
          <div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, color: COLORS.inkSoft, marginBottom: 4 }}>Seats</div>
            <Stack e={e} kind="seats" />
          </div>
          <div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, color: COLORS.inkSoft, marginBottom: 4 }}>Votes</div>
            <Stack e={e} kind="votes" />
          </div>
        </div>
        <ResultTable e={e} />
        {gov && (
          <p style={{ ...para, marginTop: 16 }}>
            Government that followed: <a href={`#/generalElection/governments/${gov.id}`} style={{ color: COLORS.ink, fontWeight: 700 }}>{gov.pm}</a>, {GROUPS[gov.party]?.label ?? "Conservative and Liberal Democrat coalition"}.
          </p>
        )}
        <p style={{ ...para, fontSize: 12.5, marginTop: 12 }}>
          Seats are as won on election day and the Speaker is counted on their own, so some published tables are one seat different for the Speaker's old party. Shares of the vote are rounded to whole numbers.
          {e.id === "1945" && " The 1945 figures are the published totals: the 1945 data lists two-member and university seats by votes, not winners, so there is no seat map."}
          {" "}Conservative includes allied parties (the Scottish Unionists and National Liberals, and the Ulster Unionists until 1970). Liberal Democrat includes the Liberals, the SDP and the Alliance. Source: UK Parliament election results; House of Commons Library.
        </p>
      </section>

      {e.id !== "1945" && (
        <section aria-labelledby="h-eh-map" style={{ ...card, marginTop: 18 }}>
          <h2 id="h-eh-map" style={cardTitle}>Who won where</h2>
          <p style={para}>
            {is2024
              ? "One hexagon for each of the 650 seats, shaped so that every seat is the same size."
              : e.matchedSeats >= 650
                ? "One hexagon for each of the 650 seats on the boundaries used from 2010 to 2019, all the same size."
                : `One hexagon for each of today's seats on the 2010 map that kept its name from ${e.id === "1974a" ? "February 1974" : e.id === "1974b" ? "October 1974" : e.id}: ${coverage ?? e.matchedSeats} of 650. The grey ones had a different name or did not exist yet. Boundaries were redrawn many times, so a seat with the same name may cover a different area.`}
          </p>
          <div role="group" aria-label="What the map shows" style={{ display: "flex", gap: 8, margin: "14px 0", flexWrap: "wrap" }}>
            {[["winner", "Winner"], ["lead", "How big the lead was"]].map(([k, label]) => (
              <button key={k} type="button" aria-pressed={mode === k} onClick={() => setMode(k)} style={pillStyle(mode === k)}>{label}</button>
            ))}
          </div>
          {results ? (
            <ElectionMap
              seats={hexes}
              flat={flat}
              paint={paint}
              selected={picked}
              onSelect={(i) => setPicked(i)}
              label={`Hexagon map of the seats at the ${electionLabel(e)} election, coloured by ${mode === "lead" ? "how big the winner's lead was" : "the winning party"}. Use the search box to look up a seat.`}
            />
          ) : <Loading />}
          <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "flex", gap: "6px 16px", flexWrap: "wrap", fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>
            {present.map((k) => (
              <li key={k} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span aria-hidden="true" style={{ width: 11, height: 11, borderRadius: 3, background: GROUPS[k].colour }} />
                {GROUPS[k].label}
              </li>
            ))}
            {coverage != null && coverage < 650 && (
              <li style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span aria-hidden="true" style={{ width: 11, height: 11, borderRadius: 3, background: NO_MATCH, border: `1px solid ${COLORS.hairline}` }} />
                No seat of that name
              </li>
            )}
          </ul>
          {mode === "lead" && <p style={{ ...para, fontSize: 13, marginTop: 8 }}>Pale seats were close contests. Deep colour means the winner was well ahead: the colour deepens with each five points of lead, up to 45 or more.</p>}

          <div style={{ marginTop: 18 }}>
            <label htmlFor="eh-seat" style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: COLORS.ink }}>Look up a seat</label>
            <input
              id="eh-seat"
              type="search"
              value={query}
              onChange={(ev) => setQuery(ev.target.value)}
              placeholder="For example Huddersfield"
              autoComplete="off"
              style={{ display: "block", width: "100%", maxWidth: 420, marginTop: 6, padding: "10px 14px", borderRadius: 12, border: `1px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, fontFamily: FONT_BODY, fontSize: 15, boxSizing: "border-box" }}
            />
            {matches.length > 0 && (
              <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {matches.map((m) => (
                  <li key={m.i}><button type="button" onClick={() => { setPicked(m.i); setQuery(""); }} style={{ ...pillStyle(false), fontSize: 13 }}>{m.name}</button></li>
                ))}
              </ul>
            )}
          </div>

          {pickedName && (
            <div aria-live="polite" style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${COLORS.hairline}` }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, margin: 0, color: COLORS.ink }}>{pickedName}</h3>
                <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>{REGIONS[hexes[picked][4]] ?? ""}</span>
              </div>
              <p style={{ ...para, marginTop: 6 }}>
                {pickedResult
                  ? `${electionLabel(e)}: ${GROUPS[pickedResult.group].label}${pickedResult.lead != null ? `, ahead by ${pickedResult.lead.toFixed(1)} points${pickedResult.runnerUp ? ` of ${pickedResult.runnerUp === "Independent" ? "an independent" : pickedResult.runnerUp} in second place` : ""}` : ""}${pickedResult.byElection ? ". There has been a by-election here since" : ""}.`
                  : `No seat with this name at the ${electionLabel(e)} election.`}
              </p>
              {is2024 ? (
                <p style={{ ...para, fontSize: 13.5 }}>
                  <a href={`#/constituency/${encodeURIComponent(pickedName)}`} style={{ color: COLORS.ink, fontWeight: 700 }}>See this seat in full</a>
                </p>
              ) : (
                <SeatHistory index={picked} elections={ELECTIONS} name={pickedName} />
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

