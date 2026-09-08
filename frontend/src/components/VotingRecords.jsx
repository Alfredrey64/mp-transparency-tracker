import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO, PAGE_PADDING } from "../theme";
import { formatDate, partyColour } from "../lib/format";
import { categoriseBill } from "../lib/bills";
import { PageHeader } from "./shared";
import { IconVote } from "./icons";

// A division (Commons vote) is stored per-MP with no bill_id — divisions and
// bills come from two separate parliamentary data sources with no shared
// key. The Commons naming convention usually puts a bill's short title at
// the start of any division on it ("Finance Bill: Third Reading", "Finance
// Bill: New Clause 4"), so a prefix match on the title is a reasonably
// reliable — if imperfect — way to find votes related to a bill. We say so
// explicitly in the UI rather than presenting it as guaranteed complete.
function BillEntry({ bill, politicians }) {
  const [open, setOpen] = useState(false);
  const [divisions, setDivisions] = useState(null);
  const category = categoriseBill(bill);
  const accentColor = bill.is_act ? "#2F6F4E" : bill.is_defeated ? "#9C3B3B" : "transparent";

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
      setDivisions([...byDivision.values()].sort((a, b) => new Date(b.date) - new Date(a.date)));
    }
  }

  return (
    <div
      style={{
        background: COLORS.paperCard,
        border: `1px solid ${COLORS.hairline}`,
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: 12,
        padding: 14,
      }}
    >
      <button onClick={toggle} style={{ display: "block", width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: COLORS.ink, marginBottom: 5, lineHeight: 1.4 }}>{bill.short_title}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: category.color }}>
                {category.label}
              </span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>
                {bill.current_stage ?? "Unknown stage"} · {bill.current_house}
              </span>
              {bill.is_act && (
                <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: "#2F6F4E", background: "#2F6F4E18", padding: "2px 7px", borderRadius: 999 }}>
                  NOW LAW
                </span>
              )}
              {bill.is_defeated && (
                <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: "#9C3B3B", background: "#9C3B3B18", padding: "2px 7px", borderRadius: 999 }}>
                  DEFEATED
                </span>
              )}
              {bill.next_sitting_date && (
                <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>Next sitting {formatDate(bill.next_sitting_date)}</span>
              )}
            </div>
          </div>
          <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: COLORS.inkSoft, flexShrink: 0 }}>{open ? "▾" : "▸"}</span>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${COLORS.hairline}` }}>
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 14 }}>
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

              <FieldLabel>Related Commons votes</FieldLabel>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.5, marginBottom: 10 }}>
                Matched by title against official Commons divisions — this can miss votes, or occasionally pick up an
                unrelated one with a similar name.
              </div>
              {divisions === null && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>Checking for matching votes…</div>}
              {divisions?.length === 0 && (
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>No Commons division found with a matching title in our tracked votes.</div>
              )}
              {divisions && divisions.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {divisions.map((d) => (
                    <DivisionRow key={d.division_id} division={d} politicians={politicians} />
                  ))}
                </div>
              )}

              <div style={{ marginTop: 14 }}>
                <a href={bill.source_url} target="_blank" rel="noreferrer" style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12.5, color: category.color }}>
                  View this bill on bills.parliament.uk ↗
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10.5, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
      {children}
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
    <div style={{ padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconVote}
        title="How They Voted"
        subtitle="Every bill going through Parliament and every recorded Commons vote, in one place — look up an MP's history, or a bill's full detail and how MPs voted on it."
      />

      <div style={{ marginBottom: 32, maxWidth: 480 }}>
        <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13, color: COLORS.ink, marginBottom: 8 }}>
          Look up an MP's voting history
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by MP name"
          style={{
            width: "100%", boxSizing: "border-box", padding: "13px 16px", fontFamily: FONT_BODY, fontSize: 16,
            border: `1px solid ${COLORS.hairline}`, borderRadius: 10, background: COLORS.paperCard, color: COLORS.ink,
          }}
        />
        {filteredPoliticians.length > 0 && (
          <div style={{ marginTop: 8, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, overflow: "hidden" }}>
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

      <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13, color: COLORS.ink, marginBottom: 14, maxWidth: 900 }}>
        Bills going through Parliament — tap one for its full summary and how MPs voted
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, maxWidth: 900 }}>
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
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 900 }}>
        {billsShown.map((bill) => (
          <BillEntry key={bill.bill_id} bill={bill} politicians={politicians} />
        ))}
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
        border: `1px solid ${active ? color : COLORS.hairline}`, background: active ? `${color}18` : "transparent",
        color: active ? color : COLORS.inkSoft, cursor: "pointer", transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function DivisionRow({ division, politicians }) {
  const [open, setOpen] = useState(false);
  const [breakdown, setBreakdown] = useState(null);

  async function toggle() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (breakdown || !politicians) return;
    const { data } = await supabase
      .from("voting_records")
      .select("politician_id, voted_aye, politicians(name, party, party_colour)")
      .eq("division_id", division.division_id);
    const votedIds = new Set((data ?? []).map((r) => r.politician_id));
    const ayes = (data ?? []).filter((r) => r.voted_aye).map((r) => r.politicians).filter(Boolean);
    const noes = (data ?? []).filter((r) => !r.voted_aye).map((r) => r.politicians).filter(Boolean);
    const didNotVote = politicians.filter((p) => !votedIds.has(p.id));
    setBreakdown({ ayes, noes, didNotVote });
  }

  return (
    <div style={{ border: `1px solid ${COLORS.hairline}`, borderRadius: 10, padding: "10px 12px" }}>
      <button onClick={toggle} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, lineHeight: 1.4 }}>{division.title}</div>
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.inkSoft, flexShrink: 0 }}>{open ? "▾" : "▸"}</span>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 4, fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>
          <span>{formatDate(division.date)}</span>
          <span style={{ color: "#2F6F4E", fontWeight: 600 }}>Aye {division.aye_count}</span>
          <span style={{ color: "#9C3B3B", fontWeight: 600 }}>No {division.no_count}</span>
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
            {!breakdown ? (
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, padding: "10px 0" }}>Loading full vote breakdown…</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginTop: 10 }}>
                <VoteGroup label="Voted Aye" color="#2F6F4E" members={breakdown.ayes} />
                <VoteGroup label="Voted No" color="#9C3B3B" members={breakdown.noes} />
                <VoteGroup label="Did not vote" color={COLORS.inkSoft} members={breakdown.didNotVote} note="Absent, paired, or abstained — Commons records don't distinguish between these." />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function VoteGroup({ label, color, members, note }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? members : members.slice(0, 6);
  return (
    <div style={{ background: COLORS.paper, borderRadius: 8, padding: 10 }}>
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
