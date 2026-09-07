import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO, PAGE_PADDING } from "../theme";
import { formatDate } from "../lib/format";
import { BILL_CATEGORIES, categoriseBill } from "../lib/bills";
import { PageHeader } from "./shared";
import { IconVote } from "./icons";

function BillRow({ bill, index, isLast }) {
  const category = categoriseBill(bill);
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "80px" }}
      transition={{ duration: 0.3, delay: (index % 14) * 0.03, ease: "easeOut" }}
      style={{ position: "relative", paddingBottom: isLast ? 0 : 20 }}
    >
      <span
        style={{
          position: "absolute",
          left: -20,
          top: 12,
          width: 11,
          height: 11,
          borderRadius: "50%",
          background: category.color,
          border: `2px solid ${COLORS.paper}`,
          zIndex: 1,
        }}
      />
      <motion.div
        whileHover={{ y: -2, boxShadow: "0 8px 18px rgba(30,42,68,0.1)" }}
        style={{
          border: `1.5px solid ${category.color}`,
          borderRadius: 14,
          padding: "10px 18px 16px",
          background: COLORS.paperCard,
          boxShadow: "0 1px 4px rgba(30,42,68,0.04)",
        }}
      >
        <div
          style={{
            display: "inline-block",
            fontFamily: FONT_BODY,
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: category.color,
            background: `${category.color}1A`,
            padding: "3px 9px",
            borderRadius: 999,
            marginBottom: 5,
          }}
        >
          {category.label}
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 19, color: COLORS.ink }}>{bill.short_title}</div>
        {bill.long_title && (
          <div style={{ marginTop: 6, maxWidth: 700 }}>
            <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 10.5, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
              What it does
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.55 }}>
              {bill.long_title}
            </div>
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginTop: 10 }}>
          {[
            `Current stage: ${bill.current_stage ?? "Unknown"} (${bill.current_house})`,
            bill.sponsor_name
              ? `Sponsored by ${bill.sponsor_name}${bill.sponsoring_department ? ` · ${bill.sponsoring_department}` : ""}`
              : null,
            bill.next_sitting_date ? `Next sitting: ${formatDate(bill.next_sitting_date)}` : null,
          ]
            .filter(Boolean)
            .map((line, i) => (
              <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 6, fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, lineHeight: 1.5 }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: category.color, flexShrink: 0 }} />
                <span>{line}</span>
              </div>
            ))}
        </div>
        <div style={{ marginTop: 8 }}>
          <a href={bill.source_url} target="_blank" rel="noreferrer" style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, color: category.color }}>
            Full bill page ↗
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MpVotingHistory({ politician, onBack }) {
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);

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
          <img src={politician.thumbnail_url} alt="" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", objectPosition: "center top", border: `1px solid ${COLORS.hairline}` }} />
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

  useEffect(() => {
    async function load() {
      const [billsRes, politiciansRes] = await Promise.all([
        supabase
          .from("bills")
          .select("*")
          .not("next_sitting_date", "is", null)
          .order("next_sitting_date", { ascending: true })
          .limit(40),
        supabase.from("politicians").select("*").order("name"),
      ]);
      setBills(billsRes.data ?? []);
      setPoliticians(politiciansRes.data ?? []);
      setLoadingBills(false);
    }
    load();
  }, []);

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
        subtitle="See how any MP voted, and whether they voted with or against their own party's majority — plus what's coming up next in Parliament."
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

      <div
        style={{
          background: COLORS.paperCard,
          border: `1px solid ${COLORS.hairline}`,
          borderRadius: 12,
          padding: "14px 16px",
          marginBottom: 20,
          maxWidth: 760,
        }}
      >
        <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10.5, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
          Category Key
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
          {BILL_CATEGORIES.map((cat) => (
            <div key={cat.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color }} />
              <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>{cat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13, color: COLORS.ink, marginBottom: 14 }}>
        Upcoming Bills
      </div>
      {loadingBills && <div style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft }}>Loading…</div>}
      {!loadingBills && bills.length === 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>
          No bills with a scheduled sitting date found right now.
        </div>
      )}
      <div style={{ position: "relative", paddingLeft: 20, maxWidth: 760 }}>
        {bills.length > 0 && (
          <div style={{ position: "absolute", left: 4, top: 6, bottom: 6, width: 1, background: COLORS.hairline }} />
        )}
        {bills.map((bill, i) => (
          <BillRow key={bill.bill_id} bill={bill} index={i} isLast={i === bills.length - 1} />
        ))}
      </div>
    </div>
  );
}
