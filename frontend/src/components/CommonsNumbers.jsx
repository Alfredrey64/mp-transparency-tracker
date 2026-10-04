import { useState, useEffect, useMemo } from "react";
import ShareButton from "./ShareButton";
import { chamberShareSpec } from "../lib/shareSpecs";
import { motion, useReducedMotion } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_BODY, numeric } from "../theme";
import { partyColour, formatDate } from "../lib/format";
import { computeParliamentStats, GENERAL_ELECTION_2024 } from "../lib/parliamentStats";
import { computeCareerStats, cohortKey, ELECTED_BANDS } from "../lib/careerStats";
import { LoadFailedNote } from "./shared";
import { PartyHemicycle } from "./PartyHemicycle";
import BarRow from "./BarRow";
import CountUp from "./CountUp";
import MembersModal from "./MembersModal";
import DownloadCsvButton from "./DownloadCsvButton";
import { SEATS_COLUMNS } from "../lib/exportColumns";
import { fmt, pct1, pct0, joinNames, family, byName, YEAR_MS, leadText, goMp, goSeat } from "../lib/numbersFormat";
import { Tile, Figure, SeatsChart, SeatsTable, WomenWaffle, CohortChart, Switches } from "./NumbersKit";

// ---- Safe seats ------------------------------------------------------------
function SafetyHistogram({ summary, onOpen }) {
  const reduce = useReducedMotion();
  const max = Math.max(1, ...summary.histogram.map((h) => h.count));
  const HEIGHT = 150;
  const band = (from) => (from < 5 ? 0 : from < 20 ? 1 : 2);
  const counts = [0, 0, 0];
  summary.histogram.forEach((h) => {
    counts[band(h.from)] += h.count;
  });
  const labels = ["Marginal", "Fairly safe", "Safe"];
  const shade = [0.4, 0.7, 1];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: HEIGHT }}>
        {summary.histogram.map((h, i) => (
          <button type="button" key={h.from} className="nclick" onClick={(e) => onOpen(h, e)} aria-label={`${h.to == null ? `${h.from}% or more` : `${h.from} to ${h.to}%`} majority: ${h.count} seats. See the MPs`} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", alignItems: "center", background: "none", border: "none", padding: 0, color: "inherit" }} title={`${h.to == null ? `${h.from}% or more` : `${h.from}–${h.to}%`}: ${h.count} seats`}>
            <div style={{ ...numeric, fontSize: 12.5, fontWeight: 600, color: COLORS.ink, marginBottom: 3 }}>{h.count}</div>
            <motion.div
              initial={reduce ? false : { height: 0 }}
              whileInView={{ height: `${(h.count / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: "100%", minHeight: h.count ? 3 : 0, background: COLORS.accent, opacity: shade[band(h.from)], borderRadius: "5px 5px 0 0" }}
            />
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
        {summary.histogram.map((h) => (
          <div key={h.from} style={{ flex: 1, textAlign: "center", fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft }}>
            {h.from}
            {h.to == null ? "+" : ""}
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>Winner's majority, % of votes cast</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 22px", marginTop: 14 }}>
        {labels.map((l, i) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: COLORS.accent, opacity: shade[i] }} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink }}>
              {l} <strong style={{ ...numeric, fontWeight: 700 }}>{fmt(counts[i])}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeatList({ title, seats }) {
  return (
    <div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft, marginBottom: 2 }}>{title}</div>
      {seats.map((s, i) => (
        <button key={s.name} type="button" onClick={() => goSeat(s.name)} style={{ display: "grid", gridTemplateColumns: "20px minmax(0, 1fr) auto", gap: 8, alignItems: "center", width: "100%", textAlign: "left", background: "none", border: "none", borderTop: `1px solid ${COLORS.hairline}`, padding: "7px 0", cursor: "pointer" }}>
          <span style={{ ...numeric, fontSize: 12, color: COLORS.inkSoft }}>{i + 1}</span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: partyColour(s.colour, COLORS.inkSoft), flexShrink: 0 }} />
              {s.mp}
            </span>
          </span>
          <span style={{ textAlign: "right" }}>
            <span style={{ display: "block", ...numeric, fontSize: 15, fontWeight: 700, color: COLORS.ink }}>{fmt(s.majority)}</span>
            {s.majorityPct != null && <span style={{ display: "block", ...numeric, fontSize: 11, color: COLORS.inkSoft }}>{leadText(s.majorityPct)}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

// ---- Careers ---------------------------------------------------------------
function TermsBands({ bands, total, average, onOpen }) {
  const max = Math.max(1, ...bands.map((b) => b.count));
  return (
    <div>
      {bands.map((b, i) => (
        <BarRow key={b.key} label={b.label} color={COLORS.accent} fraction={b.count / max} valueText={fmt(b.count)} detail={pct0((b.count / total) * 100)} labelWidth={120} valueWidth={96} delay={i * 0.05} onClick={(e) => onOpen(b, e)} />
      ))}
      <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 8 }}>
        On average, MPs have won <strong style={{ ...numeric, color: COLORS.ink }}>{(Math.round(average * 10) / 10).toFixed(1)}</strong> elections, including by-elections.
      </div>
    </div>
  );
}

export default function CommonsNumbers({ onNavigate }) {
  const [rows, setRows] = useState(null);
  const [byElections, setByElections] = useState([]);
  const [summary, setSummary] = useState(null);
  const [careers, setCareers] = useState(null);
  const [failed, setFailed] = useState(false);
  const [showTable, setShowTable] = useState(false);
  // The pop-up list of MPs behind a figure the visitor tapped.
  const [panel, setPanel] = useState(null);

  useEffect(() => {
    supabase
      .from("politicians")
      .select("id, name, party, party_colour, gender, membership_start_date, parliament_member_id, constituency, thumbnail_url")
      .then(({ data, error }) => {
        setFailed(Boolean(error));
        setRows(data ?? []);
      });
    supabase.from("by_elections").select("status, result").then(({ data }) => setByElections(data ?? []));
    import("../data/constituencySummary.json").then((m) => setSummary(m.default)).catch(() => setSummary(null));
    import("../data/mpCareers.json").then((m) => setCareers(m.default)).catch(() => setCareers(null));
  }, []);

  const stats = useMemo(() => (rows ? computeParliamentStats(rows, byElections) : null), [rows, byElections]);
  const career = useMemo(() => (rows && careers ? computeCareerStats(careers.mps, rows) : null), [rows, careers]);
  const labour = stats?.seatsByParty.find((r) => r.party === "Labour");
  const sinn = stats?.seatsByParty.find((r) => r.party === "Sinn Féin");

  // Every MP as a flat record, with their career facts when those have
  // loaded, so any figure on the page can be turned into "who is this?".
  const members = useMemo(
    () =>
      (rows ?? []).map((p) => ({
        id: p.id,
        mid: p.parliament_member_id,
        name: p.name,
        party: p.party,
        colour: p.party_colour,
        constituency: p.constituency,
        thumbnail: p.thumbnail_url,
        gender: p.gender,
        start: p.membership_start_date,
        c: careers?.mps?.[p.parliament_member_id] ?? null,
      })),
    [rows, careers]
  );
  const partyOf = (m) => family(m.party) || "Unknown";

  // Opens the list for whichever MPs `pick` selects. The clicked element is
  // passed on so focus goes back to it when the pop-up closes.
  function see(e, title, note, pick, { sort = byName, badge } = {}) {
    setPanel({ title, note, list: members.filter(pick).sort(sort), badge, opener: e?.currentTarget ?? null });
  }

  // The same, for figures about seats (the 2024 result), which come from the
  // constituency file: loaded the first time one is tapped.
  async function seeSeats(e, title, note, pick) {
    const opener = e?.currentTarget ?? null;
    const m = await import("../data/constituencies.json");
    const seatOf = new Map(Object.values(m.default.constituencies).filter((s) => s.result && pick(s)).map((s) => [s.mp?.memberId, s]));
    const list = members.filter((x) => seatOf.has(x.mid)).sort((a, b) => seatOf.get(a.mid).result.majorityPct - seatOf.get(b.mid).result.majorityPct);
    setPanel({ title, note, list, opener, badge: (x) => leadText(seatOf.get(x.mid).result.majorityPct) });
  }
  const goMember = (memberId) => {
    const id = members.find((x) => x.mid === memberId)?.id;
    if (id != null) goMp(id);
  };
  const ids = (list) => new Set(list);

  return (
    <div>
      {rows !== null && !failed && (
        <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, margin: "0" }}>
          <strong style={{ color: COLORS.accent }}>Tap any bar, party or figure marked “See who”</strong> to list the MPs behind it. Each name opens that MP's profile.
        </p>
      )}
      {rows !== null && !failed && stats && (
        <div style={{ marginTop: 12 }}>
          <ShareButton filename="house-of-commons-by-the-numbers" label="Share the chamber as an image" getSpec={() => chamberShareSpec({ house: "commons", stats, link: window.location.href })} />
        </div>
      )}

      {rows === null && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>Loading…</div>}
      {rows !== null && failed && <div style={{ marginTop: 24 }}><LoadFailedNote item="the list of MPs" /></div>}

      {stats && !failed && stats.total > 0 && (
        <div className="bento" style={{ marginTop: 26 }}>
          <div className="bento-grid">
            <Tile span="s8" edge="people" title="The chamber" note={`${labour ? `Labour holds ${fmt(labour.count)} of the seats (${pct1(labour.pct)}). ` : ""}${stats.majorityLine} are enough to win any vote outright.`}>
              <PartyHemicycle
                politicians={rows}
                legendCount={6}
                onSelectParty={(name, e) => see(e, name, "Every MP currently sitting for this party.", (m) => (m.party ?? "Independent") === name)}
                centre={
                  <div>
                    <div style={{ ...numeric, fontSize: "clamp(17px, 4cqw, 34px)", fontWeight: 700, lineHeight: 1, color: COLORS.ink, letterSpacing: "-0.03em" }}>
                      <CountUp value={stats.total} duration={1.3} />
                    </div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 2 }}>MPs</div>
                  </div>
                }
              />
            </Tile>

            <Tile span="s4" edge="people" title="At a glance" delay={0.05}>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <Figure value={stats.womenPct} format={(n) => pct1(n)} label="are women" note={`${fmt(stats.women)} of ${fmt(stats.total)}`} onOpen={(e) => see(e, "Women in the Commons", "Every woman currently sitting as an MP.", (m) => m.gender === "F")} />
                <Figure value={stats.newMps} format={(n) => fmt(Math.round(n))} label="new since July 2024" note="Including by-election winners" onOpen={(e) => see(e, "New MPs since July 2024", "Elected at the 2024 general election or a by-election since.", (m) => m.start && m.start >= GENERAL_ELECTION_2024, { sort: (a, b) => byName(a, b), badge: (m) => `Since ${formatDate(m.start)}` })} />
                <Figure value={stats.medianTenure} format={(n) => `${(Math.round(n * 10) / 10).toFixed(1)} yrs`} label="typical time as an MP" note={`The median: half have served less. The average is ${(Math.round(stats.averageTenure * 10) / 10).toFixed(1)} years.`} onOpen={(e) => see(e, "Every MP, longest-serving first", "Time since their current run in the Commons began.", (m) => m.start, { sort: (a, b) => String(a.start).localeCompare(String(b.start)), badge: (m) => `${Math.floor((Date.now() - new Date(m.start).getTime()) / YEAR_MS)} yrs` })} />
              </div>
            </Tile>

            <Tile span="s7" edge="seats" title="Seats by party" note={`Every bar is on the same 0 to 650 scale. The dashed line marks ${stats.majorityLine} seats, more than half the House.${sinn ? ` Sinn Féin's ${sinn.count} MPs don't take their seats, so in practice slightly fewer votes are needed.` : ""}`}>
              <SeatsChart
                stats={stats}
                onOpen={(r, e) => see(e, r.key === "others" ? "The smaller parties" : r.label, r.key === "others" ? "MPs from parties with only one or two seats." : "Every MP currently sitting for this party.", (m) => r.parties.includes(partyOf(m)))}
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 22px", marginTop: 12 }}>
                <button type="button" onClick={() => setShowTable((v) => !v)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.accent }}>
                  {showTable ? "Hide the table" : "View every party as a table"}
                </button>
                <DownloadCsvButton label="Download (CSV)" slug="seats-by-party" columns={SEATS_COLUMNS} rows={stats.seatsByParty} />
              </div>
              {showTable && <div style={{ marginTop: 10 }}><SeatsTable stats={stats} /></div>}
            </Tile>

            <Tile span="s5" edge="people" title="Women in the Commons" note="Each dot is one MP. The coloured ones are women." delay={0.05}>
              <WomenWaffle women={stats.women} total={stats.total} />
              <div style={{ marginTop: 16 }}>
                {stats.womenByParty.slice(0, 5).map((r, i) => (
                  <BarRow key={r.party} label={r.party} color={COLORS.accent} fraction={r.womenPct / 100} valueText={pct0(r.womenPct)} detail={`${r.women}/${r.count}`} labelWidth={130} valueWidth={96} delay={i * 0.04} onClick={(e) => see(e, `Women MPs: ${r.party}`, "The women currently sitting for this party.", (m) => m.gender === "F" && partyOf(m) === r.party)} />
                ))}
                <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, marginTop: 4 }}>Share of each party who are women (the five largest to rank).</div>
              </div>
            </Tile>

            {career && (
              <>
                <Tile span="s12" edge="careers" title="Who arrived when" note={`MPs grouped by the general election they first came in on, so by-election winners sit with the intake before them.${career.cohorts.find((c) => c.key === 2024) ? ` The 2024 intake is ${pct0((career.cohorts.find((c) => c.key === 2024).count / career.total) * 100)} of the House.` : ""}`}>
                  <CohortChart
                    cohorts={career.cohorts}
                    onOpen={(c, e) => see(e, c.label === "Before 1997" ? "MPs first elected before 1997" : c.key === 2024 ? "The 2024 intake and since" : `The ${c.key} intake`, "Grouped by the general election they first came in on.", (m) => m.c && cohortKey(m.c[0]) === c.key, { badge: (m) => `First elected ${m.c[0]}` })}
                  />
                </Tile>

                <Tile span="s5" edge="careers" title="How many elections they have won" note="Each win is one term, by-elections included. A first-term MP has won once.">
                  <TermsBands
                    bands={career.electedBands}
                    total={career.total}
                    average={career.averageElected}
                    onOpen={(b, e) => {
                      const test = ELECTED_BANDS.find((x) => x.key === b.key).test;
                      see(e, b.label, "Elections each MP has won, by-elections included.", (m) => m.c && test(m.c[1]), { sort: (x, y) => y.c[1] - x.c[1] || byName(x, y), badge: (m) => `${m.c[1]} won` });
                    }}
                  />
                </Tile>

                <Tile span="s7" edge="careers" title="Who has held office" delay={0.05} note="Ministers are MPs given a government job. Shadow ministers do the same job for the opposition. Counts include any past Parliament.">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "14px 30px", marginBottom: 14 }}>
                    <Figure value={career.government.everMinister} format={(n) => fmt(Math.round(n))} label="have been ministers" note={`${pct0(career.government.everMinisterPct)} of MPs`} size={32} onOpen={(e) => see(e, "MPs who have been ministers", "Anyone who has held a government post, now or in a past Parliament.", (m) => m.c && m.c[2] > 0, { sort: (a, b) => b.c[2] - a.c[2] || byName(a, b), badge: (m) => `${m.c[2]} post${m.c[2] === 1 ? "" : "s"}` })} />
                    <Figure value={career.government.inGovernmentNow} format={(n) => fmt(Math.round(n))} label="are in government now" size={32} onOpen={(e) => see(e, "MPs in government now", "Currently holding a government post.", (m) => m.c && m.c[3] === 1)} />
                    <Figure value={career.government.shadowEver} format={(n) => fmt(Math.round(n))} label="have been shadow ministers" size={32} onOpen={(e) => see(e, "MPs who have been shadow ministers", "Have held a post in an opposition front bench team.", (m) => m.c && m.c[4] > 0, { sort: (a, b) => b.c[4] - a.c[4] || byName(a, b), badge: (m) => `${m.c[4]} post${m.c[4] === 1 ? "" : "s"}` })} />
                  </div>
                  {career.government.byParty.slice(0, 5).map((r, i) => (
                    <BarRow key={r.party} label={r.party} color={partyColour(r.colour, COLORS.inkSoft)} fraction={r.pct / 100} valueText={pct0(r.pct)} detail={`${r.everMinister}/${r.count}`} labelWidth={150} valueWidth={110} delay={i * 0.04} onClick={(e) => see(e, `${r.party} ministers`, "Have held a government post, now or before.", (m) => m.c && m.c[2] > 0 && partyOf(m) === r.party, { sort: (a, b) => b.c[2] - a.c[2] || byName(a, b), badge: (m) => `${m.c[2]} post${m.c[2] === 1 ? "" : "s"}` })} />
                  ))}
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, marginTop: 4 }}>Share of each party's MPs who have ever held a government post.</div>
                </Tile>

                <Tile span="s7" edge="change" title="Changing sides" note={`${career.switchers.switched} MPs now sit for a different party from the one they belonged to before, and ${career.switchers.nowIndependent} sit as independents having left one. A spell as an independent that ended back in the same party isn't counted.`}>
                  <Switches
                    switchers={career.switchers}
                    onOpen={(t, e) => {
                      const set = ids(t.memberIds);
                      see(e, `${t.from} → ${t.to}`, "Current MPs who left one party and now sit with another, or as an independent.", (m) => set.has(m.mid));
                    }}
                  />
                </Tile>

                <Tile span="s5" edge="change" title="Lost before they won" delay={0.05} note="Parliament records the elections each MP stood in without winning. Many of today's MPs tried and failed before getting in.">
                  <Figure value={career.persistence.lostBeforePct} format={(n) => pct0(n)} label="lost at least one election first" note={`${career.persistence.lostBefore} of ${career.total} current MPs`} size={42} onOpen={(e) => see(e, "MPs who lost an election before winning one", "Counted from the elections each MP contested without winning.", (m) => m.c && m.c[7] > 0, { sort: (a, b) => b.c[7] - a.c[7] || byName(a, b), badge: (m) => `${m.c[7]} defeat${m.c[7] === 1 ? "" : "s"}` })} />
                  <div style={{ marginTop: 16, fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, lineHeight: 1.7 }}>
                    {career.persistence.mostLost.map((m) => (
                      <button type="button" className="nclick" onClick={() => goMember(m.memberId)} key={m.name} style={{ display: "flex", justifyContent: "space-between", gap: 12, width: "100%", textAlign: "left", background: "none", border: "none", borderTop: `1px solid ${COLORS.hairline}`, borderRadius: 0, padding: "6px 4px", font: "inherit", color: "inherit" }}>
                        <span>{m.name}</span>
                        <span><strong style={{ ...numeric }}>{m.times}</strong> <span style={{ color: COLORS.inkSoft }}>defeats before winning</span></span>
                      </button>
                    ))}
                    {career.mostElected[0] && (
                      <button type="button" className="nclick" onClick={() => goMember(career.mostElected[0].memberId)} style={{ display: "flex", justifyContent: "space-between", gap: 12, width: "100%", textAlign: "left", background: "none", border: "none", borderTop: `1px solid ${COLORS.hairline}`, borderRadius: 0, padding: "6px 4px", font: "inherit", color: "inherit" }}>
                        <span>{career.mostElected[0].name}</span>
                        <span><strong style={{ ...numeric }}>{career.mostElected[0].times}</strong> <span style={{ color: COLORS.inkSoft }}>elections won, the most</span></span>
                      </button>
                    )}
                  </div>
                </Tile>
              </>
            )}

            {summary && (
              <>
                <Tile span="s7" edge="seats" title="How safe are the seats?" note={`The winner's lead in each of ${fmt(summary.total)} seats at the last election. A small lead means a seat could change hands; a big one almost never does.`}>
                  <SafetyHistogram
                    summary={summary}
                    onOpen={(h, e) => seeSeats(e, h.to == null ? `Winning by ${h.from}% or more` : `Winning by ${h.from} to ${h.to}%`, "MPs whose lead over the runner-up, as a share of votes cast, falls in this range. Smallest lead first.", (s) => s.result.majorityPct >= h.from && (h.to == null || s.result.majorityPct < h.to))}
                  />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "14px 30px", marginTop: 20, paddingTop: 16, borderTop: `1px solid ${COLORS.hairline}` }}>
                    <Figure value={summary.wonWithUnderHalf} format={(n) => fmt(Math.round(n))} label="MPs won with under half the vote" size={32} onOpen={(e) => seeSeats(e, "MPs elected on under half the vote", "Smallest lead first.", (s) => typeof s.result.candidates?.[0]?.share === "number" && s.result.candidates[0].share < 0.5)} />
                    <Figure value={summary.changedHandsAtGeneralElection} format={(n) => fmt(Math.round(n))} label="seats changed party in 2024" size={32} onOpen={(e) => seeSeats(e, "Seats that changed party in 2024", "A party took the seat from another at the general election. Smallest lead first.", (s) => s.result.isGeneralElection && /gain/i.test(s.result.outcome ?? ""))} />
                    <Figure value={summary.turnout.median} format={(n) => pct1(n)} label="median turnout" size={32} />
                  </div>
                </Tile>
                <Tile span="s5" edge="seats" title="Closest and biggest" delay={0.05} note="Ranked by the winner's lead as a share of votes cast. Tap a seat to see its full result.">
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    <SeatList title="Closest results" seats={summary.narrowest.slice(0, 5)} />
                    <SeatList title="Biggest majorities" seats={summary.biggest.slice(0, 5)} />
                  </div>
                </Tile>
              </>
            )}

            <Tile span="s5" edge="change" title="Seats that changed hands" note="Elections held since the general election, to fill seats that fell vacant.">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "14px 30px" }}>
                <Figure value={stats.byElections.total} format={(n) => fmt(Math.round(n))} label={`by-election${stats.byElections.total === 1 ? "" : "s"}`} size={34} />
                <Figure value={stats.byElections.gains} format={(n) => fmt(Math.round(n))} label="changed hands" note={`${fmt(stats.byElections.holds)} held`} size={34} />
              </div>
              {onNavigate && (
                <button type="button" onClick={() => onNavigate("byElections")} style={{ marginTop: 14, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.accent }}>
                  See each by-election →
                </button>
              )}
            </Tile>

            <Tile span="s7" edge="people" title="What isn't here, and why" delay={0.05}>
              <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.7, color: COLORS.inkSoft, margin: 0 }}>
                Parliament's official records for MPs cover name, party, gender, constituency, elections, posts and committees, but not ethnicity, age or education. Without
                an official source, this page won't guess at people's identities. The House of Commons Library publishes research on the make-up of the Commons, drawing
                on its own surveys:{" "}
                <a href="https://commonslibrary.parliament.uk/" target="_blank" rel="noreferrer" style={{ color: COLORS.accent, fontWeight: 600 }}>commonslibrary.parliament.uk ↗</a>
              </p>
            </Tile>
          </div>

          <p style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.55, marginTop: 22 }}>
            Sources: Parliament's Members API (current Commons members, their biographies and the 2024 election results) and the by-elections record on this site. The
            Speaker is counted as an MP but listed under their own heading rather than a party. Figures change whenever an MP is elected, resigns or changes party.
            {stats.longest && ` The longest-serving ${stats.longest.names.length > 1 ? "are" : "is"} ${joinNames(stats.longest.names)}, at ${Math.floor(stats.longest.years)} years.`}
          </p>
        </div>
      )}
      {panel && <MembersModal title={panel.title} note={panel.note} members={panel.list} badge={panel.badge} returnFocusTo={panel.opener} onClose={() => setPanel(null)} />}
    </div>
  );
}
