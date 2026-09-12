import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { partyColour, formatDate } from "../lib/format";
import { PageHeader } from "./shared";
import { IconByElection } from "./icons";

function daysAgo(dateStr) {
  if (!dateStr) return null;
  const days = Math.round((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.round(days / 30.44);
  if (months < 24) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.round(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

// "RUK Gain" / "Lab Hold" — split the party abbreviation from the plain-
// English outcome so the outcome word can be styled distinctly (a "Gain"
// is the headline-worthy result; a "Hold" is a quieter one).
function resultOutcome(result) {
  if (!result) return null;
  const match = /\b(Gain|Hold)\b/i.exec(result);
  return match ? match[1] : result;
}

export default function ByElections() {
  const [elections, setElections] = useState(null);
  const [formerMps, setFormerMps] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    async function load() {
      const [{ data: byElections }, { data: former }] = await Promise.all([
        supabase.from("by_elections").select("*").order("election_date", { ascending: false }),
        supabase.from("former_mps").select("name, constituency, party, party_colour, membership_end_date, membership_end_reason"),
      ]);
      setElections(byElections ?? []);
      setFormerMps(former ?? []);
    }
    load();
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
      const outcome = resultOutcome(e.result);
      if (outcome === "Gain") gains++;
      else if (outcome === "Hold") holds++;
    }
    return { gains, holds };
  }, [completed]);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconByElection}
        kicker="Public Record · Elections"
        title="Elections"
        subtitle="Seats that have changed hands outside a general election — a by-election is held whenever one falls vacant mid-Parliament, usually through a resignation, a death, or an expulsion — plus any seat currently sitting empty awaiting one. Often watched as an early signal of how the governing party is doing. Pulled daily from the official record."
      />

      {elections !== null && (completed.length > 0 || vacantSeats.length > 0) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24, marginBottom: 24 }}>
          {vacantSeats.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#B0473E14", border: "1px solid #B0473E40", borderRadius: 10, padding: "9px 14px" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#B0473E", flexShrink: 0 }} />
              <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink }}>
                <strong>{vacantSeats.length}</strong> <span style={{ color: COLORS.inkSoft }}>seat{vacantSeats.length === 1 ? "" : "s"} currently vacant</span>
              </span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, padding: "9px 14px" }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink }}>
              <strong>{completed.length}</strong> <span style={{ color: COLORS.inkSoft }}>by-election{completed.length === 1 ? "" : "s"} since the last general election</span>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, padding: "9px 14px" }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink }}>
              <strong>{stats.gains}</strong> <span style={{ color: COLORS.inkSoft }}>seat{stats.gains === 1 ? "" : "s"} changed hands (Gain)</span>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, padding: "9px 14px" }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink }}>
              <strong>{stats.holds}</strong> <span style={{ color: COLORS.inkSoft }}>seat{stats.holds === 1 ? "" : "s"} held by the same party</span>
            </span>
          </div>
        </div>
      )}

      {elections === null && <div style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft, marginTop: 24 }}>Loading…</div>}
      {elections !== null && completed.length === 0 && vacantSeats.length === 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>
          No by-elections recorded since the last general election yet.
        </div>
      )}

      {vacantSeats.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: COLORS.ink, marginBottom: 4 }}>Upcoming Elections</h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginTop: 0, marginBottom: 14 }}>
            A seat with no sitting MP right now — a by-election to fill it is expected, though Parliament doesn't
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
                    <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: COLORS.ink }}>{v.constituency_name}</div>
                    <span
                      style={{
                        fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em",
                        color: "#B0473E", background: "#B0473E1e", padding: "4px 10px", borderRadius: 999, flexShrink: 0,
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
                            {v.vacancy_since && daysAgo(v.vacancy_since) ? ` (${daysAgo(v.vacancy_since)})` : ""} — {v.vacancy_reason.toLowerCase()}
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
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: COLORS.ink, marginBottom: 14 }}>Recent By-Elections</h2>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {completed.map((e, i) => {
          const color = partyColour(e.winning_party_colour, COLORS.inkSoft);
          const outcome = resultOutcome(e.result);
          const isGain = outcome === "Gain";
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
                onClick={() => setExpanded(isOpen ? null : e.election_id)}
                style={{ display: "block", width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: COLORS.ink }}>{e.constituency_name}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>
                      {formatDate(e.election_date)} · {daysAgo(e.election_date)}
                      {predecessor?.membership_end_reason ? ` · seat vacated by ${predecessor.membership_end_reason.toLowerCase()}` : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <span
                      style={{
                        fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em",
                        color, background: `${color}1e`, padding: "3px 10px", borderRadius: 999,
                      }}
                    >
                      {e.winning_party} {isGain ? "Gain" : outcome ?? ""}
                    </span>
                    <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ color: COLORS.inkSoft, fontSize: 12 }}>▾</motion.span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "stretch", gap: 0, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ flex: 1, minWidth: 0, padding: "10px 14px", borderRight: `1px solid ${COLORS.hairline}` }}>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: COLORS.inkSoft, marginBottom: 4 }}>
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
                  <div style={{ flex: 1, minWidth: 0, padding: "10px 14px" }}>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: COLORS.inkSoft, marginBottom: 4 }}>
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

                      <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10.5, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
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
                                    <span style={{ fontSize: 11, fontWeight: 600, color: swing >= 0 ? "#3F7D5C" : "#B0473E" }}>
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
                      <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, opacity: 0.75, marginTop: 10 }}>
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
    </div>
  );
}

function Stat({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: COLORS.inkSoft, marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, color: COLORS.ink }}>{value}</div>
    </div>
  );
}
