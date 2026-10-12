import { useCallback, useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric } from "../theme";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";
import { partyColourByName } from "../lib/careerTimeline";
import { summarise2024, resultRows, seats2019, seatChanges, REPLACED_SEAT_WINNERS } from "../lib/generalElection";
import { GE2024, turnoutPct } from "../data/generalElection2024";
import { LoadFailedNote } from "./MpCards";
import Loading from "./Loading";
import ElectionMap from "./ElectionMap";
import Hemicycle from "./Hemicycle";
import hexes2024 from "../data/seatHexes.json";
import { GROUPS, NO_MATCH, groupOf2024, seatResults2024, shadeFor } from "../lib/electionHistory";

// The 2024 general election: who won how many seats, how many votes that took, and why the two do not line up. Seats are counted from each
// seat's own result; votes are the published national figures (data/generalElection2024.js). lib/generalElection.js does the arithmetic.

const para = { fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.65, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 760 };
const fmt = (n) => Math.round(n).toLocaleString("en-GB");
const pct = (n) => (n >= 10 ? Math.round(n) : Math.round(n * 10) / 10).toString();
const millions = (n) => `${(n / 1e6).toFixed(1)} million`;
const seatHref = (name) => `#/constituency/${encodeURIComponent(name)}`;
const shortName = (p) => ({ "Scottish National Party": "SNP", "Social Democratic & Labour Party": "SDLP", "Democratic Unionist Party": "DUP", "Traditional Unionist Voice": "TUV", "Ulster Unionist Party": "Ulster Unionists", "Workers Party of Britain": "Workers Party" }[p] ?? p);

function Bar({ label, value, max, colour, strong }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "54px 1fr 52px", alignItems: "center", gap: 10, fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>
      <span>{label}</span>
      <span aria-hidden="true" style={{ display: "block", height: strong ? 12 : 8, borderRadius: 6, background: `color-mix(in srgb, ${colour} 14%, transparent)`, overflow: "hidden" }}>
        <span style={{ display: "block", height: "100%", width: `${Math.max(0.8, (value / max) * 100)}%`, borderRadius: 6, background: strong ? colour : `color-mix(in srgb, ${colour} 55%, transparent)` }} />
      </span>
      <strong style={{ color: COLORS.ink, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{pct(value)}%</strong>
    </div>
  );
}

function PartyRow({ row, max }) {
  const colour = row.other ? "#8A8A96" : partyColourByName(row.party);
  return (
    <li style={{ padding: "14px 0", borderTop: `1px solid ${COLORS.hairline}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: COLORS.ink }}>
          <span aria-hidden="true" style={{ width: 11, height: 11, borderRadius: "50%", background: colour, flexShrink: 0 }} />
          {row.other ? row.party : shortName(row.party)}
        </span>
        <span style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>
          <strong style={{ ...numeric, fontSize: 18, color: COLORS.ink }}>{row.seats}</strong> {row.seats === 1 ? "seat" : "seats"}, {millions(row.votes)} votes
        </span>
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        <Bar label="Votes" value={row.voteShare} max={max} colour={colour} />
        <Bar label="Seats" value={row.seatShare} max={max} colour={colour} strong />
      </div>
      {row.votesPerSeat && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 7 }}>One seat for every {fmt(row.votesPerSeat)} votes</div>
      )}
    </li>
  );
}

export default function GeneralElection2024() {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [mode, setMode] = useState("winner");
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all([import("../data/constituencies.json"), import("../data/electionHistory.json")])
      .then(([c, h]) => alive && setData({ constituencies: c.default.constituencies, history: h.default.bySeat }))
      .catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, []);

  const view = useMemo(() => {
    if (!data) return null;
    const summary = summarise2024(data.constituencies);
    const rows = resultRows(summary.seats, GE2024);
    const lead = rows[0];
    const changes = seatChanges(seats2019(data.history), summary.seats).filter((r) => r.before > 0 || r.after > 0);
    const replaced = Object.keys(REPLACED_SEAT_WINNERS).map((k) => data.constituencies[k]?.name).filter(Boolean);
    const biggest = rows.reduce((m, r) => Math.max(m, r.voteShare, r.seatShare), 0);
    const reform = rows.find((r) => r.party === "Reform UK");
    const results = seatResults2024(hexes2024.hexes, data.constituencies, REPLACED_SEAT_WINNERS);
    const fought = results.filter((x) => x && !x.byElection);
    const second = {};
    for (const x of fought) if (x.runnerUp) second[x.runnerUp] = (second[x.runnerUp] ?? 0) + 1;
    const secondPlaces = Object.entries(second).sort((a, b) => b[1] - a[1]);
    const insights = {
      fought: fought.length,
      marginal: fought.filter((x) => x.lead < 5).length,
      safe: fought.filter((x) => x.lead >= 30).length,
      under40: fought.filter((x) => x.share != null && x.share < 0.4).length,
      gains: fought.filter((x) => x.gain).length,
    };
    const parties = ["g", "l", "p", "s", "d", "x", "n", "k", "c", "u"].map((k) => ({ key: k, colour: GROUPS[k].colour, count: 0 }));
    for (const x of results) if (x) parties.find((p) => p.key === x.group).count += 1;
    return { summary, rows, lead, changes, replaced, max: Math.ceil(biggest / 10) * 10, reform, results, secondPlaces, insights, parties: parties.filter((p) => p.count > 0) };
  }, [data]);

  const paint = useCallback((i) => {
    const r = view?.results[i];
    if (!r) return { fill: NO_MATCH, swatch: NO_MATCH, note: "" };
    const colour = GROUPS[r.group].colour;
    const lead = r.lead != null ? ` · ahead by ${r.lead.toFixed(1)} points` : "";
    if (mode === "second") {
      const g = r.runnerUp ? groupOf2024(r.runnerUp) : null;
      return { fill: g ? GROUPS[g].colour : NO_MATCH, swatch: colour, note: `${GROUPS[r.group].label} won${r.runnerUp ? `, ${r.runnerUp} second` : ""}` };
    }
    if (mode === "gains") return { fill: colour, swatch: colour, dim: !r.gain, note: `${GROUPS[r.group].label}${r.gain ? " (gained)" : " (held)"}` };
    return { fill: mode === "lead" ? shadeFor(colour, r.band) : colour, swatch: colour, note: `${GROUPS[r.group].label}${lead}${r.byElection ? " (won in 2024; by-election since)" : ""}` };
  }, [view, mode]);

  return (
    <div>
      {failed && <LoadFailedNote item="the election results" />}
      {!data && !failed && <Loading />}

      {view && (
        <>
          <section aria-labelledby="h-ge-headline" style={{ ...card, marginTop: 8 }}>
            <h2 id="h-ge-headline" style={{ ...cardTitle, fontSize: "clamp(22px, 4.2vw, 32px)", lineHeight: 1.2 }}>
              {view.lead.party} won {pct(view.lead.seatShare)}% of the seats with {pct(view.lead.voteShare)}% of the votes
            </h2>
            <p style={para}>
              The UK has 650 seats, each with its own election. {view.lead.party} won {view.lead.seats} of them, with about {millions(view.lead.votes)} votes out of {millions(GE2024.validVotes)} cast across the country. In the 2024 election {pct(turnoutPct())}% of registered voters took part.
            </p>
            <div style={{ marginTop: 18 }}>
              <Hemicycle parties={view.parties} label={`The 650 seats after the 2024 election: ${view.parties.map((p) => `${GROUPS[p.key].label} ${p.count}`).join(", ")}`} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 18 }}>
              {[
                [fmt(view.summary.totalSeats), "seats, each its own contest"],
                [`${pct(view.lead.voteShare)}%`, `of votes for ${view.lead.party}`],
                [`${pct(turnoutPct())}%`, "of voters turned out"],
              ].map(([n, label]) => (
                <div key={label} style={{ padding: "12px 14px", borderRadius: 14, background: COLORS.paper, border: `1px solid ${COLORS.hairline}` }}>
                  <div style={{ ...numeric, fontSize: 28, fontWeight: 600, color: COLORS.ink, letterSpacing: "-0.02em" }}>{n}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="h-ge-parties" style={{ ...card, marginTop: 18 }}>
            <h2 id="h-ge-parties" style={cardTitle}>Votes and seats, party by party</h2>
            <p style={para}>Each party has two bars: the share of all votes it won across the country, and the share of the 650 seats it ended up with. A party whose seats bar is much longer than its votes bar was helped by the system. One whose seats bar is much shorter was held back by it.</p>
            <ul style={{ listStyle: "none", margin: "14px 0 0", padding: 0 }}>
              {view.rows.map((row) => <PartyRow key={row.party} row={row} max={view.max} />)}
            </ul>
            <p style={{ ...para, fontSize: 12.5 }}>
              Votes are the published national totals for each party (the Workers Party of Britain, with no seats, is shown because it took over 200,000 votes). Independents, the Speaker and the smallest parties are in the last row, with the votes that are left. Source:{" "}
              <a href={GE2024.sourceUrl} target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontWeight: 600 }}>UK Parliament election results</a>.
            </p>
          </section>

          <section aria-labelledby="h-ge-map" style={{ ...card, marginTop: 18 }}>
            <h2 id="h-ge-map" style={cardTitle}>Who won where</h2>
            <p style={para}>One hexagon for each of the 650 seats, all the same size so a crowded city counts as much as a whole Highland county. Tap a seat to see how it voted.</p>
            <div role="group" aria-label="What the map shows" style={{ display: "flex", gap: 8, margin: "14px 0", flexWrap: "wrap" }}>
              {[["winner", "Winner"], ["lead", "How big the lead was"], ["second", "Who came second"], ["gains", "Seats that changed hands"]].map(([k, label]) => (
                <button key={k} type="button" aria-pressed={mode === k} onClick={() => setMode(k)} style={pillStyle(mode === k)}>{label}</button>
              ))}
            </div>
            <ElectionMap seats={hexes2024.hexes} flat={false} paint={paint} selected={picked} onSelect={setPicked} label={`Hexagon map of the 650 seats at the 2024 election. Showing: ${mode === "lead" ? "how big the winner's lead was" : mode === "second" ? "the party that came second" : mode === "gains" ? "which seats changed hands" : "the winning party"}.`} />
            <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "flex", gap: "6px 16px", flexWrap: "wrap", fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>
              {view.parties.map((p) => (
                <li key={p.key} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span aria-hidden="true" style={{ width: 11, height: 11, borderRadius: 3, background: p.colour }} />{GROUPS[p.key].label}
                </li>
              ))}
            </ul>
            {mode === "gains" && <p style={{ ...para, fontSize: 13, marginTop: 8 }}>{fmt(view.insights.gains)} of the {fmt(view.insights.fought)} seats with a full 2024 result changed hands. Faded seats were held by the party that already had them. Parliament counts a gain against how the seat would have voted in 2019, estimated where boundaries were redrawn.</p>}
            {picked != null && view.results[picked] && (
              <p aria-live="polite" style={{ ...para, marginTop: 14, color: COLORS.ink }}>
                <strong>{hexes2024.hexes[picked][1]}</strong>: {GROUPS[view.results[picked].group].label} won{view.results[picked].lead != null ? `, ahead by ${view.results[picked].lead.toFixed(1)} points` : ""}{view.results[picked].runnerUp ? `, with ${view.results[picked].runnerUp} second` : ""}. <a href={seatHref(hexes2024.hexes[picked][1])} style={{ color: COLORS.ink, fontWeight: 700 }}>See this seat in full</a>
              </p>
            )}
          </section>

          <section aria-labelledby="h-ge-second" style={{ ...card, marginTop: 18 }}>
            <h2 id="h-ge-second" style={cardTitle}>Second places, and how safe the seats are</h2>
            <p style={para}>Coming second in a seat earns nothing under first past the post, but it shows where a party is the main challenger. Of the {fmt(view.insights.fought)} seats with a full result:</p>
            <ul style={{ listStyle: "none", margin: "14px 0 0", padding: 0 }}>
              {view.secondPlaces.slice(0, 6).map(([party, n]) => (
                <li key={party} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, padding: "9px 0", borderTop: `1px solid ${COLORS.hairline}`, fontFamily: FONT_BODY, fontSize: 14.5 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: COLORS.ink, fontWeight: 600 }}>
                    <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: "50%", background: partyColourByName(party), flexShrink: 0 }} />
                    {shortName(party)} came second
                  </span>
                  <strong style={{ ...numeric, color: COLORS.ink }}>{n} {n === 1 ? "seat" : "seats"}</strong>
                </li>
              ))}
            </ul>
            <p style={{ ...para, marginTop: 14 }}>
              {fmt(view.insights.marginal)} seats were won by fewer than five points, and {fmt(view.insights.safe)} were won by thirty points or more. {fmt(view.insights.under40)} winners had less than 40% of the votes in their seat.
            </p>
          </section>

          <section aria-labelledby="h-ge-why" style={{ ...card, marginTop: 18 }}>
            <h2 id="h-ge-why" style={cardTitle}>Why seats and votes do not match</h2>
            <p style={para}>The UK uses a system called first past the post. It has three features that explain the gap.</p>
            <ol style={{ margin: "14px 0 0", paddingLeft: 22, display: "grid", gap: 14, fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.65, color: COLORS.inkSoft }}>
              <li>
                <strong style={{ color: COLORS.ink }}>Every seat is a separate election.</strong> There is no national count that decides who governs. What matters is how many of the 650 local contests a party wins.
              </li>
              <li>
                <strong style={{ color: COLORS.ink }}>You need the most votes, not half.</strong> In {fmt(view.summary.underHalf)} of the {fmt(view.summary.counted)} seats where we hold the full 2024 result, the winner had less than half of the votes in that seat.
              </li>
              <li>
                <strong style={{ color: COLORS.ink }}>Votes for anyone who does not win do not add up to anything.</strong> In those {fmt(view.summary.counted)} seats, {pct(view.summary.shareNotForWinner)}% of votes went to a candidate who did not win. Votes a winner gets beyond what they needed to win do not count for more.
              </li>
            </ol>
            {view.reform && (
              <p style={{ ...para, marginTop: 16 }}>
                The effect is clearest for parties whose support is spread evenly across the country. Reform UK got {millions(view.reform.votes)} votes and won {view.reform.seats} seats, one for every {fmt(view.reform.votesPerSeat)} votes. Labour needed {fmt(view.lead.votesPerSeat)} votes for each seat it won. A party whose voters are concentrated in particular places can win seats with far fewer votes.
              </p>
            )}
            <p style={para}>Supporters of first past the post say it gives clear results, one local MP for each area and usually a government that can act. Critics say it leaves many votes without a voice and rewards where voters live more than how many there are. Other countries, and the Scottish Parliament and Welsh Senedd, use systems where seats follow votes more closely.</p>
          </section>

          <section aria-labelledby="h-ge-2019" style={{ ...card, marginTop: 18 }}>
            <h2 id="h-ge-2019" style={cardTitle}>Compared with 2019</h2>
            <p style={para}>Seats won by each party at the two elections. The 2019 figures use the seat boundaries of the time. The boundaries were redrawn for 2024, so a few seats are not exactly like for like.</p>
            <ul style={{ listStyle: "none", margin: "14px 0 0", padding: 0 }}>
              {view.changes.map((r) => (
                <li key={r.party} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", alignItems: "baseline", gap: "4px 16px", padding: "10px 0", borderTop: `1px solid ${COLORS.hairline}`, fontFamily: FONT_BODY, fontSize: 14 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: COLORS.ink, fontWeight: 600 }}>
                    <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: "50%", background: partyColourByName(r.party), flexShrink: 0 }} />
                    {shortName(r.party)}
                  </span>
                  <span style={{ color: COLORS.inkSoft }}>2019: <strong style={{ color: COLORS.ink }}>{r.before}</strong></span>
                  <span style={{ color: COLORS.inkSoft }}>2024: <strong style={{ color: COLORS.ink }}>{r.after}</strong></span>
                  <strong style={{ minWidth: 46, textAlign: "right", color: r.change > 0 ? "color-mix(in srgb, #14603A 60%, var(--c-ink))" : r.change < 0 ? "color-mix(in srgb, #9E2F27 60%, var(--c-ink))" : COLORS.inkSoft }}>
                    {r.change > 0 ? `+${r.change}` : r.change === 0 ? "no change" : `${r.change}`}
                  </strong>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="h-ge-close" style={{ ...card, marginTop: 18 }}>
            <h2 id="h-ge-close" style={cardTitle}>The closest results</h2>
            <p style={para}>A handful of seats were decided by a few dozen votes. Each of these would have gone the other way if a small number of voters had chosen differently.</p>
            <ol style={{ listStyle: "none", margin: "14px 0 0", padding: 0 }}>
              {view.summary.closest.map((s) => (
                <li key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap", padding: "10px 0", borderTop: `1px solid ${COLORS.hairline}`, fontFamily: FONT_BODY, fontSize: 14.5 }}>
                  <a href={seatHref(s.name)} style={{ color: COLORS.ink, fontWeight: 700, textUnderlineOffset: 3 }}>{s.name}</a>
                  <span style={{ color: COLORS.inkSoft }}>{shortName(s.party)} won by <strong style={{ color: COLORS.ink }}>{fmt(s.majority)}</strong> {s.majority === 1 ? "vote" : "votes"}</span>
                </li>
              ))}
            </ol>
            <p style={{ ...para, marginTop: 12 }}>
              {view.replaced.length > 0 && <>Seven seats have held by-elections since July 2024 ({view.replaced.join(", ")}), so they are not in the list above or in the figures on this page that come from each seat's own result. See <a href="#/byElections" style={{ color: COLORS.ink, fontWeight: 600 }}>By-elections</a> for what happened there. </>}
              For how close every seat was, and what it would take to flip each one, see <a href="#/marginals" style={{ color: COLORS.ink, fontWeight: 600 }}>Marginal seats</a>.
            </p>
          </section>

          <nav aria-label="More about elections" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
            {[["#/constituency", "Look up your constituency"], ["#/howtovote", "How to vote"], ["#/localElections", "When your council next votes"], ["#/byElections", "By-elections"]].map(([href, label]) => (
              <a key={href} className="ons-tap" href={href} style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: COLORS.ink, textDecoration: "none", padding: "10px 16px", borderRadius: 999, border: `1px solid ${COLORS.hairline}`, background: COLORS.paperCard }}>{label}</a>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
