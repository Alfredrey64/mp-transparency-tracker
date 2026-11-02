import { useState, useEffect, useMemo } from "react";
import { m as motion, AnimatePresence } from "motion/react";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING, readable } from "../theme";
import { partyColour, formatDate } from "../lib/format";
import { PageHeader } from "./shared";
import { LoadFailedNote } from "./MpCards";
import { GlossaryTerm } from "./GlossaryTerm";
import { IconByElection } from "./icons";
import { withScrollPreserved } from "../lib/preserveScroll";
import Loading from "./Loading";
import { GlanceCard, StackBar } from "./Glance";
import ByElectionBoard from "./ByElectionBoard";
import { outcomeOf, movesBetweenParties, strip, byYear } from "../lib/byElectionView";

function daysAgo(dateStr) {
  if (!dateStr) return null;
  const days = Math.round((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.round(days / 30.44);
  if (months < 24) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.round(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

export default function ByElections() {
  const [elections, setElections] = useState(null);
  const [formerMps, setFormerMps] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function load() {
      const [{ data: byElections, error }, { data: former }] = await Promise.all([
        supabase.from("by_elections").select("*").order("election_date", { ascending: false }),
        supabase.from("former_mps").select("name, constituency, party, party_colour, membership_end_date, membership_end_reason"),
      ]);
      if (error) { setFailed(true); return; }
      setElections(byElections ?? []);
      setFormerMps(former ?? []);
    }
    load().catch(() => setFailed(true));
  }, []);

  const predecessorFor = useMemo(() => {
    const byConstituency = new Map();
    for (const m of formerMps) {
      if (!byConstituency.has(m.constituency)) byConstituency.set(m.constituency, []);
      byConstituency.get(m.constituency).push(m);
    }
    return (constituencyName, electionDate) => {
      const candidates = (byConstituency.get(constituencyName) ?? [])
        .filter((m) => !electionDate || m.membership_end_date <= electionDate)
        .sort((a, b) => (b.membership_end_date ?? "").localeCompare(a.membership_end_date ?? ""));
      return candidates[0] ?? null;
    };
  }, [formerMps]);

  const vacantSeats = useMemo(() => (elections ?? []).filter((e) => e.status === "vacant"), [elections]);
  const completed = useMemo(() => (elections ?? []).filter((e) => e.status !== "vacant"), [elections]);

  const stats = useMemo(() => {
    let gains = 0;
    let holds = 0;
    for (const e of completed) {
      const outcome = outcomeOf(e.result);
      if (outcome === "gain") gains++;
      else if (outcome === "hold") holds++;
    }
    return { gains, holds };
  }, [completed]);

  const moves = useMemo(() => movesBetweenParties(completed, predecessorFor), [completed, predecessorFor]);
  const stripItems = useMemo(() => strip(completed), [completed]);
  const groups = useMemo(() => byYear(completed, filter), [completed, filter]);

  const winners = useMemo(() => {
    const by = new Map();
    for (const e of completed) {
      if (!e.winning_party) continue;
      const row = by.get(e.winning_party) ?? { label: e.winning_party, value: 0, colour: partyColour(e.winning_party_colour, "#8A93A6") };
      row.value += 1;
      by.set(e.winning_party, row);
    }
    return [...by.values()].sort((a, b) => b.value - a.value);
  }, [completed]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconByElection}
        kicker="Elections"
        title="By-elections"
        subtitle={
          <>
            A <GlossaryTerm term="By-election">by-election</GlossaryTerm> is held when a seat falls vacant between{" "}
            <GlossaryTerm term="General Election">general elections</GlossaryTerm>, usually after a resignation, a
            death or an expulsion. This page shows seats that have changed hands this way, plus any seat waiting for
            one. They are often read as an early sign of how the governing party is doing.
          </>
        }
      />

      {elections !== null && (completed.length > 0 || vacantSeats.length > 0) && (
        <GlanceCard id="h-be-glance" title="By-elections at a glance" lead="Since the last general election. A seat counts as a gain when a different party wins it than held it before.">
          <ByElectionBoard total={completed.length} gains={stats.gains} holds={stats.holds} vacant={vacantSeats.length} strip={stripItems} moves={moves} winners={winners} StackBar={StackBar} />
        </GlanceCard>
      )}

      {elections === null && !failed && <Loading />}
      {failed && <LoadFailedNote item="the by-elections" />}
      {elections !== null && completed.length === 0 && vacantSeats.length === 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>
          No by-elections recorded since the last general election yet.
        </div>
      )}

      {vacantSeats.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: COLORS.ink, marginBottom: 4 }}>Upcoming elections</h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginTop: 0, marginBottom: 14 }}>
            A seat with no sitting MP right now: a by-election to fill it is expected, though Parliament doesn't
            always announce a date immediately.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {vacantSeats.map((v, i) => {
              const predecessor = predecessorFor(v.constituency_name, v.vacancy_since);
              const predecessorColor = predecessor ? partyColour(predecessor.party_colour, COLORS.inkSoft) : COLORS.inkSoft;
              return (
                <motion.div
                  key={v.election_id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.04 }}
                  style={{ background: COLORS.paperCard, border: "1px solid #B0473E40", borderLeft: "5px solid #B0473E", borderRadius: 12, padding: 18 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                    <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: COLORS.ink }}>{v.constituency_name}</div>
                    <span
                      style={{
                        fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em",
                        color: readable("#B0473E"), background: "#B0473E1e", padding: "4px 10px", borderRadius: 999, flexShrink: 0,
                      }}
                    >
                      By-election pending
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, background: `${predecessorColor}0d`, border: `1px solid ${predecessorColor}30`, borderRadius: 10, padding: "10px 14px" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: predecessorColor, flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink }}>
                        Last held by <strong>{predecessor?.name ?? "unrecorded"}</strong>
                        {predecessor?.party ? <span style={{ color: COLORS.inkSoft }}> ({predecessor.party})</span> : null}
                      </div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>
                        {v.vacancy_reason ? (
                          <>
                            Seat vacated {v.vacancy_since ? `on ${formatDate(v.vacancy_since)}` : ""}
                            {v.vacancy_since && daysAgo(v.vacancy_since) ? ` (${daysAgo(v.vacancy_since)})` : ""}: {v.vacancy_reason.toLowerCase()}
                          </>
                        ) : (
                          "No sitting MP currently recorded for this seat"
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: COLORS.ink, marginBottom: 12 }}>Every by-election</h2>
          <div className="be-filter" role="group" aria-label="Which by-elections to show">
            {[["all", "All", completed.length], ["gain", "Changed hands", stats.gains], ["hold", "Held", stats.holds]].map(([key, label, n]) => (
              <button key={key} type="button" aria-pressed={filter === key} onClick={() => withScrollPreserved(() => setFilter(key))}>{label}<span>{n}</span></button>
            ))}
          </div>
        </>
      )}

      {groups.map((group) => (
      <section key={group.year}>
      <h3 className="be-year"><span>{group.year}</span><small>{group.items.length} by-election{group.items.length === 1 ? "" : "s"}</small></h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {group.items.map((e, i) => {
          const color = partyColour(e.winning_party_colour, COLORS.inkSoft);
          const outcome = outcomeOf(e.result);
          const isGain = outcome === "gain";
          const isOpen = expanded === e.election_id;
          const predecessor = predecessorFor(e.constituency_name, e.election_date);
          const candidates = [...(e.candidates ?? [])].sort((a, b) => a.rankOrder - b.rankOrder);
          const topVotes = candidates[0]?.votes ?? 1;

          return (
            <motion.div
              key={e.election_id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.04 }}
              style={{
                background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderLeft: `5px solid ${color}`,
                borderRadius: 12, padding: 18,
              }}
            >
              <button
                onClick={() => withScrollPreserved(() => setExpanded(isOpen ? null : e.election_id))}
                style={{ display: "block", width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
                  <div style={{ flex: "1 1 170px", minWidth: 0 }}>
                    <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: COLORS.ink }}>{e.constituency_name}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>
                      {formatDate(e.election_date)} · {daysAgo(e.election_date)}
                      {predecessor?.membership_end_reason ? ` · seat vacated by ${predecessor.membership_end_reason.toLowerCase()}` : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, maxWidth: "100%" }}>
                    <span
                      style={{
                        fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em",
                        color: readable(color), background: `${color}1e`, padding: "3px 10px", borderRadius: 999,
                      }}
                    >
                      <span className="be-tag">{outcome && <OutcomeIcon gain={isGain} />}{e.winning_party} {isGain ? "gain" : outcome === "hold" ? "hold" : (e.result ?? "")}</span>
                    </span>
                    <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ color: COLORS.inkSoft, fontSize: 12 }}>▾</motion.span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "stretch", gap: 0, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ flex: 1, minWidth: 0, padding: "10px 24px 10px 14px", borderRight: `1px solid ${COLORS.hairline}` }}>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: COLORS.inkSoft, marginBottom: 4 }}>
                      Previously
                    </div>
                    {predecessor ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: partyColour(predecessor.party_colour, COLORS.inkSoft), flexShrink: 0 }} />
                        <span style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13.5, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {predecessor.name}
                        </span>
                      </div>
                    ) : (
                      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, fontStyle: "italic" }}>Not on record</div>
                    )}
                  </div>
                  <span className="be-swap" aria-hidden="true" />
                  <div style={{ flex: 1, minWidth: 0, padding: "10px 14px 10px 24px" }}>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: COLORS.inkSoft, marginBottom: 4 }}>
                      Elected instead
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
                      <span style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13.5, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {e.winner_name}
                      </span>
                    </div>
                  </div>
                </div>
                {candidates.length > 0 && (
                  <>
                    <div className="be-share" role="img" aria-label={`Share of the vote: ${candidates.slice(0, 4).map((c) => `${c.party?.name ?? c.name} ${Math.round((c.voteShare ?? 0) * 100)}%`).join(", ")}`}>
                      {shareSegments(candidates).map((c, ci) => (
                        <i key={`${c.name}-${ci}`} style={{ "--tc": c.colour, width: `${c.share * 100}%` }} />
                      ))}
                    </div>
                    <div className="be-sharekey" aria-hidden="true">
                      {candidates.slice(0, 3).map((c, ci) => (
                        <span key={`${c.name}-${ci}`} style={{ "--tc": partyColour(c.party?.backgroundColour, COLORS.inkSoft) }}>{c.party?.name ?? c.name} <b>{Math.round((c.voteShare ?? 0) * 100)}%</b></span>
                      ))}
                      {e.majority != null && <span style={{ "--tc": "transparent" }}>Majority <b>{Number(e.majority).toLocaleString()}</b></span>}
                    </div>
                  </>
                )}
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${COLORS.hairline}` }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginBottom: 16 }}>
                        <Stat label="Majority" value={e.majority?.toLocaleString()} />
                        <Stat label="Turnout" value={e.electorate ? `${Math.round((e.turnout / e.electorate) * 100)}%` : null} />
                        <Stat label="Electorate" value={e.electorate?.toLocaleString()} />
                      </div>

                      <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                        Full result · {candidates.length} candidate{candidates.length === 1 ? "" : "s"} stood
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {candidates.map((c, ci) => {
                          const candColor = partyColour(c.party?.backgroundColour, COLORS.inkSoft);
                          const isWinner = c.rankOrder === 1;
                          const swing = c.resultChange != null && c.resultChange !== "" ? Number(c.resultChange) : null;
                          return (
                            <motion.div
                              key={`${c.name}-${ci}`}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: ci * 0.02, duration: 0.2 }}
                              style={{
                                padding: "8px 10px", borderRadius: 8,
                                background: isWinner ? `${candColor}0d` : "transparent",
                                border: isWinner ? `1px solid ${candColor}35` : "1px solid transparent",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink, marginBottom: 4 }}>
                                <span style={{ display: "flex", alignItems: "baseline", gap: 6, overflow: "hidden", minWidth: 0 }}>
                                  <span style={{ flexShrink: 0, width: 14, fontWeight: 700, color: COLORS.inkSoft, fontSize: 11 }}>{c.rankOrder}.</span>
                                  <span style={{ fontWeight: isWinner ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                                  <span style={{ color: COLORS.inkSoft, flexShrink: 0 }}>· {c.party?.name}</span>
                                </span>
                                <span style={{ flexShrink: 0, display: "flex", alignItems: "baseline", gap: 8 }}>
                                  {swing !== null && !Number.isNaN(swing) && (
                                    <span style={{ fontSize: 11, fontWeight: 600, color: swing >= 0 ? readable("#3F7D5C") : readable("#B0473E") }}>
                                      {swing >= 0 ? "+" : ""}{swing}pt
                                    </span>
                                  )}
                                  <span style={{ fontWeight: 700 }}>{c.votes?.toLocaleString()}</span>
                                  <span style={{ color: COLORS.inkSoft, fontSize: 11 }}>({Math.round((c.voteShare ?? 0) * 100)}%)</span>
                                </span>
                              </div>
                              <div style={{ height: 6, borderRadius: 999, background: COLORS.paper, overflow: "hidden" }}>
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(c.votes / topVotes) * 100}%` }}
                                  transition={{ duration: 0.4, delay: 0.05 + ci * 0.02, ease: "easeOut" }}
                                  style={{ height: "100%", borderRadius: 999, background: candColor }}
                                />
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, marginTop: 10 }}>
                        "pt" swing is the change in vote share since the last election, in percentage points.
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
      </section>
      ))}
    </div>
  );
}

// The biggest four candidates' shares as bar segments, with everyone else added up as one grey segment, so a long list of small candidates does not become a smear.
function shareSegments(candidates) {
  const top = candidates.slice(0, 4).filter((c) => (c.voteShare ?? 0) > 0).map((c) => ({ name: c.name, colour: partyColour(c.party?.backgroundColour, COLORS.inkSoft), share: c.voteShare }));
  const rest = candidates.slice(4).reduce((sum, c) => sum + (c.voteShare ?? 0), 0);
  return rest > 0 ? [...top, { name: "Others", colour: "#8A93A6", share: rest }] : top;
}

function OutcomeIcon({ gain }) {
  return gain ? (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 5.5h9.5M10 3l2.5 2.5L10 8M13 10.5H3.5M6 8l-2.5 2.5L6 13" /></svg>
  ) : (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 1.8l5 1.8v4c0 3-2.1 5.1-5 6.6-2.9-1.5-5-3.6-5-6.6v-4z" /><path d="M5.6 8l1.8 1.8L10.6 6.4" /></svg>
  );
}

function Stat({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: COLORS.inkSoft, marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, color: COLORS.ink }}>{value}</div>
    </div>
  );
}
