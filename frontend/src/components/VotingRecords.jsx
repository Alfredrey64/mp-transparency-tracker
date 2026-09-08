import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO, PAGE_PADDING } from "../theme";
import { formatDate, partyColour } from "../lib/format";
import { categoriseBill } from "../lib/bills";
import { PageHeader } from "./shared";
import { IconVote, IconBills } from "./icons";

// A division (Commons vote) is stored per-MP with no bill_id — divisions and
// bills come from two separate parliamentary data sources with no shared
// key. The Commons naming convention usually puts a bill's short title at
// the start of any division on it ("Finance Bill: Third Reading", "Finance
// Bill: New Clause 4"), so a prefix match on the title is a reasonably
// reliable — if imperfect — way to find votes related to a bill. We say so
// explicitly in the UI rather than presenting it as guaranteed complete.
//
// The full per-MP breakdown for every matched division is fetched as soon as
// the bill card opens (in parallel, one query per division) rather than
// gated behind a second click — a bill with two or three divisions is a
// handful of queries, not hundreds.
function BillEntry({ bill, politicians }) {
  const [open, setOpen] = useState(false);
  const [divisions, setDivisions] = useState(null);
  const category = categoriseBill(bill);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && divisions === null) {
      const titleMatch = (bill.short_title ?? "").trim();
      if (!titleMatch) { setDivisions([]); return; }
      const { data } = await supabase
        .from("voting_records")
        .select("division_id, title, date, aye_count, no_count")
        .ilike("title", `${titleMatch}%`);
      const byDivision = new Map();
      for (const row of data ?? []) {
        if (!byDivision.has(row.division_id)) byDivision.set(row.division_id, row);
      }
      const list = [...byDivision.values()].sort((a, b) => new Date(b.date) - new Date(a.date));
      setDivisions(list);

      const breakdowns = await Promise.all(
        list.map(async (d) => {
          const { data: rows } = await supabase
            .from("voting_records")
            .select("politician_id, voted_aye, politicians(name, party, party_colour)")
            .eq("division_id", d.division_id);
          const votedIds = new Set((rows ?? []).map((r) => r.politician_id));
          const ayes = (rows ?? []).filter((r) => r.voted_aye).map((r) => r.politicians).filter(Boolean);
          const noes = (rows ?? []).filter((r) => !r.voted_aye).map((r) => r.politicians).filter(Boolean);
          const didNotVote = politicians.filter((p) => !votedIds.has(p.id));
          return [d.division_id, { ayes, noes, didNotVote }];
        })
      );
      setDivisions((current) =>
        (current ?? []).map((d) => ({ ...d, breakdown: Object.fromEntries(breakdowns)[d.division_id] }))
      );
    }
  }

  return (
    <motion.div
      layout="position"
      whileHover={{ y: -1, boxShadow: "0 6px 18px rgba(20,30,32,0.09)" }}
      transition={{ duration: 0.15 }}
      style={{
        background: COLORS.paperCard,
        border: `1px solid ${COLORS.hairline}`,
        borderRadius: 14,
        boxShadow: "0 1px 3px rgba(20,30,32,0.05)",
        overflow: "hidden",
      }}
    >
      <button onClick={toggle} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", background: "none", border: "none", padding: 16, cursor: "pointer", textAlign: "left" }}>
        <div
          style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
            background: `${category.color}17`, color: category.color,
          }}
        >
          <IconBills size={18} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 15.5, fontWeight: 600, color: COLORS.ink, marginBottom: 5, lineHeight: 1.35 }}>{bill.short_title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <CategoryPill label={category.label} color={category.color} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>{bill.current_stage ?? "Unknown stage"} · {bill.current_house}</span>
            {bill.is_act && <StatusPill label="Now law" color="#2F6F4E" />}
            {bill.is_defeated && <StatusPill label="Defeated" color="#9C3B3B" />}
            {bill.next_sitting_date && (
              <>
                <Dot />
                <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>Next sitting {formatDate(bill.next_sitting_date)}</span>
              </>
            )}
          </div>
        </div>
        <span style={{ flexShrink: 0, fontFamily: FONT_MONO, fontSize: 13, color: COLORS.inkSoft }}>{open ? "▾" : "▸"}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "0 20px 20px 20px", borderTop: `1px solid ${COLORS.hairline}`, marginTop: -1 }}>
              <div style={{ paddingTop: 16 }}>
                {bill.long_title && (
                  <div style={{ marginBottom: 12 }}>
                    <FieldLabel>What it does</FieldLabel>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, lineHeight: 1.6 }}>{bill.long_title}</div>
                  </div>
                )}
                {bill.summary && (
                  <div style={{ marginBottom: 12 }}>
                    <FieldLabel>Summary</FieldLabel>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, lineHeight: 1.6 }}>{bill.summary}</div>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 18 }}>
                  {bill.sponsor_name && (
                    <div>
                      <FieldLabel>Sponsor</FieldLabel>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink }}>
                        {bill.sponsor_name}{bill.sponsor_party ? ` (${bill.sponsor_party})` : ""}
                      </div>
                    </div>
                  )}
                  {bill.sponsoring_department && (
                    <div>
                      <FieldLabel>Department</FieldLabel>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink }}>{bill.sponsoring_department}</div>
                    </div>
                  )}
                  {bill.last_updated && (
                    <div>
                      <FieldLabel>Last updated</FieldLabel>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink }}>{formatDate(bill.last_updated)}</div>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <IconVote size={13} />
                  <FieldLabel>Related Commons votes</FieldLabel>
                </div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.5, marginBottom: 12 }}>
                  Matched by title against official Commons divisions — this can miss votes, or occasionally pick up an
                  unrelated one with a similar name.
                </div>
                {divisions === null && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>Checking for matching votes…</div>}
                {divisions?.length === 0 && (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>No Commons division found with a matching title in our tracked votes.</div>
                )}
                {divisions && divisions.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {divisions.map((d) => (
                      <DivisionCard key={d.division_id} division={d} />
                    ))}
                  </div>
                )}

                <div style={{ marginTop: 16 }}>
                  <a href={bill.source_url} target="_blank" rel="noreferrer" style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12.5, color: category.color }}>
                    View this bill on bills.parliament.uk ↗
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Dot() {
  return <span style={{ width: 3, height: 3, borderRadius: "50%", background: COLORS.hairline, flexShrink: 0 }} />;
}

function StatusPill({ label, color }) {
  return (
    <span style={{ fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em", color, background: `${color}18`, padding: "3px 9px", borderRadius: 999 }}>
      {label}
    </span>
  );
}

function CategoryPill({ label, color }) {
  return (
    <span
      style={{
        fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color, background: `${color}15`,
        border: `1px solid ${color}30`, padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function FieldLabel({ children }) {
  return (
    <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10.5, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
      {children}
    </div>
  );
}

function DivisionCard({ division }) {
  const total = (division.aye_count ?? 0) + (division.no_count ?? 0);
  const ayePct = total > 0 ? (division.aye_count / total) * 100 : 0;

  return (
    <div style={{ border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: "14px 16px", background: COLORS.paper }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: COLORS.ink, lineHeight: 1.4, marginBottom: 8 }}>{division.title}</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 6 }}>{formatDate(division.date)}</div>

      <div style={{ display: "flex", height: 9, borderRadius: 999, overflow: "hidden", marginBottom: 6 }}>
        <div style={{ width: `${ayePct}%`, background: "#2F6F4E" }} />
        <div style={{ width: `${100 - ayePct}%`, background: "#9C3B3B" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, marginBottom: 12 }}>
        <span style={{ color: "#2F6F4E" }}>Aye {division.aye_count}</span>
        <span style={{ color: "#9C3B3B" }}>No {division.no_count}</span>
      </div>

      {!division.breakdown ? (
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>Loading full member breakdown…</div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
          <PartyBreakdownTable breakdown={division.breakdown} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>
            <VoteGroup label="Voted Aye" color="#2F6F4E" members={division.breakdown.ayes} />
            <VoteGroup label="Voted No" color="#9C3B3B" members={division.breakdown.noes} />
            <VoteGroup label="Did not vote" color={COLORS.inkSoft} members={division.breakdown.didNotVote} note="Absent, paired, or abstained — Commons records don't distinguish between these." />
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Aggregates the same per-MP breakdown by party, so you can see at a glance
// whether a party voted as a bloc or split — not just a wall of names. Rows
// use a fixed grid so the Aye/No/Absent columns line up like a real table
// instead of loose flex spacing.
// One shared CSS Grid for the header row AND every party row (rather than a
// separate grid per row) is what actually makes the Aye/No/Absent columns
// line up — independent per-row grids size their "auto" columns from that
// row's own content only, so they drift out of alignment as soon as one
// party's numbers are wider than another's.
const PARTY_TABLE_COLUMNS = "minmax(0,1fr) 52px 52px 60px";

function PartyBreakdownTable({ breakdown }) {
  const rows = useMemo(() => {
    const map = new Map();
    const bump = (list, key) => {
      for (const m of list) {
        const party = m.party ?? "Unknown";
        if (!map.has(party)) map.set(party, { party, color: partyColour(m.party_colour, COLORS.inkSoft), aye: 0, no: 0, didNotVote: 0 });
        map.get(party)[key] += 1;
      }
    };
    bump(breakdown.ayes, "aye");
    bump(breakdown.noes, "no");
    bump(breakdown.didNotVote, "didNotVote");
    return [...map.values()].sort((a, b) => (b.aye + b.no + b.didNotVote) - (a.aye + a.no + a.didNotVote));
  }, [breakdown]);

  return (
    <div style={{ marginBottom: 18, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12, color: COLORS.ink, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        By party
      </div>

      <div style={{ display: "grid", gridTemplateColumns: PARTY_TABLE_COLUMNS, columnGap: 10, rowGap: 0, alignItems: "center" }}>
        <span style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", color: COLORS.inkSoft, paddingBottom: 6, borderBottom: `1px solid ${COLORS.hairline}` }}>
          Party
        </span>
        <span style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", color: "#2F6F4E", textAlign: "center", paddingBottom: 6, borderBottom: `1px solid ${COLORS.hairline}` }}>
          Aye
        </span>
        <span style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", color: "#9C3B3B", textAlign: "center", paddingBottom: 6, borderBottom: `1px solid ${COLORS.hairline}` }}>
          No
        </span>
        <span style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", color: COLORS.inkSoft, textAlign: "center", paddingBottom: 6, borderBottom: `1px solid ${COLORS.hairline}` }}>
          Absent
        </span>

        {rows.map((r, i) => {
          const total = r.aye + r.no + r.didNotVote;
          const ayePct = total ? (r.aye / total) * 100 : 0;
          const noPct = total ? (r.no / total) * 100 : 0;
          const absentPct = total ? (r.didNotVote / total) * 100 : 0;
          const delay = Math.min(i, 12) * 0.03;
          return (
            <motion.div
              key={r.party}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay }}
              style={{ display: "grid", gridTemplateColumns: "subgrid", gridColumn: "1 / -1", alignItems: "center", paddingTop: 9 }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden", minWidth: 0 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
                <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.party}</span>
              </span>
              <CountPill value={r.aye} color="#2F6F4E" />
              <CountPill value={r.no} color="#9C3B3B" />
              <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12, color: COLORS.inkSoft, textAlign: "center" }}>{r.didNotVote}</span>

              <div style={{ gridColumn: "1 / -1", display: "flex", height: 4, borderRadius: 999, overflow: "hidden", background: COLORS.paper, marginTop: 6 }}>
                {ayePct > 0 && <div style={{ width: `${ayePct}%`, background: "#2F6F4E" }} />}
                {noPct > 0 && <div style={{ width: `${noPct}%`, background: "#9C3B3B" }} />}
                {absentPct > 0 && <div style={{ width: `${absentPct}%`, background: COLORS.hairline }} />}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function CountPill({ value, color }) {
  return (
    <span
      style={{
        fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color, background: value > 0 ? `${color}18` : "transparent",
        borderRadius: 999, textAlign: "center", display: "block", width: "100%", padding: "2px 0",
      }}
    >
      {value}
    </span>
  );
}

function VoteGroup({ label, color, members, note }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? members : members.slice(0, 6);
  return (
    <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 8, padding: 10 }}>
      <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12, color, marginBottom: note ? 2 : 6 }}>
        {label} ({members.length})
      </div>
      {note && <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: COLORS.inkSoft, marginBottom: 6, lineHeight: 1.4 }}>{note}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 160, overflowY: "auto" }}>
        {shown.map((m, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.ink }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: partyColour(m.party_colour, COLORS.inkSoft), flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
          </div>
        ))}
      </div>
      {members.length > 6 && (
        <button onClick={() => setExpanded((v) => !v)} style={{ marginTop: 6, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, color }}>
          {expanded ? "Show fewer" : `Show all ${members.length}`}
        </button>
      )}
    </div>
  );
}

function MpVotingHistory({ politician, onBack }) {
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avatarLoaded, setAvatarLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("voting_records")
        .select("*")
        .eq("politician_id", politician.id)
        .order("date", { ascending: false });
      setVotes(data ?? []);
      setLoading(false);
    }
    load();
  }, [politician.id]);

  const hasPartyMajorityConcept = !["independent", "speaker"].includes((politician.party ?? "").toLowerCase());
  const withPartyCount = votes.filter((v) => v.voted_with_party_majority === true).length;
  const againstPartyCount = votes.filter((v) => v.voted_with_party_majority === false).length;

  return (
    <div>
      <button
        onClick={onBack}
        style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, padding: 0, marginBottom: 16 }}
      >
        ← Choose a different MP
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        {politician.thumbnail_url && (
          <div style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}` }}>
            <img
              src={politician.thumbnail_url}
              alt=""
              onLoad={() => setAvatarLoaded(true)}
              style={{
                width: 43, height: 43, borderRadius: "50%", objectFit: "cover", objectPosition: "center top",
                opacity: avatarLoaded ? 1 : 0, transition: "opacity 0.25s ease",
              }}
            />
          </div>
        )}
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: COLORS.ink }}>{politician.name}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>{politician.party} · {politician.constituency}</div>
        </div>
      </div>

      {!loading && votes.length > 0 && hasPartyMajorityConcept && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginBottom: 16 }}>
          Voted with their own party's majority in <strong style={{ color: COLORS.ink }}>{withPartyCount}</strong> of the last{" "}
          {withPartyCount + againstPartyCount} recorded votes where a party majority existed.
        </div>
      )}

      {loading && <div style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft }}>Loading voting history…</div>}
      {!loading && votes.length === 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>
          No recorded votes found for this MP in the tracked period.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {votes.map((v) => (
          <div
            key={v.id}
            style={{
              background: COLORS.paperCard,
              border: `1px solid ${COLORS.hairline}`,
              borderLeft: `3px solid ${hasPartyMajorityConcept && v.voted_with_party_majority === false ? "#9C3B3B" : "transparent"}`,
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: COLORS.ink, marginBottom: 6 }}>{v.title}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span
                style={{
                  fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                  padding: "3px 9px", borderRadius: 999,
                  background: v.voted_aye ? "#E4EEE7" : "#F3E4E2",
                  color: v.voted_aye ? "#2F6F4E" : "#9C3B3B",
                }}
              >
                {v.voted_aye ? "Aye" : "No"}
              </span>
              {hasPartyMajorityConcept && v.voted_with_party_majority !== null && (
                <span
                  style={{
                    fontFamily: FONT_BODY, fontSize: 12, fontWeight: v.voted_with_party_majority === false ? 700 : 400,
                    color: v.voted_with_party_majority === false ? "#9C3B3B" : COLORS.inkSoft,
                  }}
                >
                  {v.voted_with_party_majority ? "With party majority" : "Against party majority"}
                </span>
              )}
              <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>{formatDate(v.date)}</span>
              <a href={v.source_url} target="_blank" rel="noreferrer" style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>
                source ↗
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VotingRecords() {
  const [bills, setBills] = useState([]);
  const [politicians, setPoliticians] = useState([]);
  const [loadingBills, setLoadingBills] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedMp, setSelectedMp] = useState(null);
  const [billCategory, setBillCategory] = useState("All");

  useEffect(() => {
    async function load() {
      const [billsRes, politiciansRes] = await Promise.all([
        supabase.from("bills").select("*").order("last_updated", { ascending: false }),
        supabase.from("politicians").select("*").order("name"),
      ]);
      setBills(billsRes.data ?? []);
      setPoliticians(politiciansRes.data ?? []);
      setLoadingBills(false);
    }
    load();
  }, []);

  const billsShown = useMemo(() => {
    if (billCategory === "All") return bills;
    return bills.filter((b) => categoriseBill(b).label === billCategory);
  }, [bills, billCategory]);

  const billCategories = useMemo(() => {
    const set = new Map();
    for (const b of bills) {
      const cat = categoriseBill(b);
      if (!set.has(cat.label)) set.set(cat.label, cat);
    }
    return [...set.values()];
  }, [bills]);

  const filteredPoliticians = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return politicians.filter((p) => p.name?.toLowerCase().includes(q)).slice(0, 8);
  }, [politicians, query]);

  if (selectedMp) {
    return (
      <div style={{ padding: PAGE_PADDING, maxWidth: 800, margin: "0 auto" }}>
        <MpVotingHistory politician={selectedMp} onBack={() => setSelectedMp(null)} />
      </div>
    );
  }

  return (
    <div style={{ padding: PAGE_PADDING, maxWidth: 1240, margin: "0 auto" }}>
      <PageHeader
        icon={IconVote}
        title="How They Voted"
        subtitle="Every bill going through Parliament and every recorded Commons vote, in one place — look up an MP's history, or a bill's full detail and how MPs voted on it."
      />

      <div
        style={{
          marginTop: 24, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14,
          padding: 18, boxShadow: "0 1px 3px rgba(20,30,32,0.05)",
        }}
      >
        <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13.5, color: COLORS.ink, marginBottom: 10 }}>
          Look up an MP's voting history
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by MP name"
          style={{
            width: "100%", maxWidth: 420, boxSizing: "border-box", padding: "12px 14px", fontFamily: FONT_BODY, fontSize: 15,
            border: `1px solid ${COLORS.hairline}`, borderRadius: 10, background: COLORS.paper, color: COLORS.ink,
          }}
        />
        {filteredPoliticians.length > 0 && (
          <div style={{ marginTop: 8, maxWidth: 420, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, overflow: "hidden" }}>
            {filteredPoliticians.map((p) => (
              <button
                key={p.id}
                onClick={() => { setSelectedMp(p); setQuery(""); }}
                style={{
                  display: "block", width: "100%", textAlign: "left", padding: "10px 14px", border: "none",
                  background: "transparent", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink,
                  borderBottom: `1px solid ${COLORS.hairline}`,
                }}
              >
                {p.name} <span style={{ color: COLORS.inkSoft, fontSize: 12.5 }}>· {p.party}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, color: COLORS.ink }}>
          <IconBills size={18} />
          Bills going through Parliament
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginTop: 4, marginBottom: 16 }}>
          Tap any bill for its full summary, sponsor, and how MPs and parties voted on it.
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          <FilterPill active={billCategory === "All"} color={COLORS.ink} onClick={() => setBillCategory("All")}>
            All ({bills.length})
          </FilterPill>
          {billCategories.map((cat) => (
            <FilterPill key={cat.label} active={billCategory === cat.label} color={cat.color} onClick={() => setBillCategory(cat.label)}>
              {cat.label}
            </FilterPill>
          ))}
        </div>

        {loadingBills && <div style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft }}>Loading…</div>}
        {!loadingBills && billsShown.length === 0 && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>No bills found in this category right now.</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {billsShown.map((bill) => (
            <BillEntry key={bill.bill_id} bill={bill} politicians={politicians} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterPill({ active, onClick, color, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, padding: "6px 13px", borderRadius: 999,
        border: `1px solid ${active ? color : `${color}40`}`, background: active ? `${color}20` : `${color}0d`,
        color, cursor: "pointer", transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}
