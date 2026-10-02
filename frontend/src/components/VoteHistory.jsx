import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { COLORS, FONT_BODY, FONT_DISPLAY, FONT_MONO } from "../theme";
import { formatDate } from "../lib/format";
import { matchBillForVote } from "../lib/bills";
import { explainDivision } from "../lib/divisionExplainer";
import { summariseBill, billSearchUrl } from "../lib/billSummary";
import VoteExplainer from "./VoteExplainer";

// One MP's votes, grouped by bill so a bill with twenty clause votes is one
// card with a short "what is this bill?" line and twenty quiet rows, rather
// than twenty cards that each begin with procedural jargon. Each vote gets
// a plain name; the official title and the full Aye/No explanation are one
// tap away.

function AyeNo({ aye }) {
  return (
    <span
      style={{
        fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase", padding: "3px 9px", borderRadius: 999,
        background: aye ? "#E4EEE7" : "#F3E4E2", color: aye ? "#2F6F4E" : "#9C3B3B",
      }}
    >
      {aye ? "Aye" : "No"}
    </span>
  );
}

function PartyNote({ vote, hasPartyMajorityConcept }) {
  if (!hasPartyMajorityConcept || vote.voted_with_party_majority == null) return null;
  const against = vote.voted_with_party_majority === false;
  return (
    <span style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: against ? 700 : 400, color: against ? "#9C3B3B" : COLORS.inkSoft }}>
      {against ? "Voted against their party" : "With their party"}
    </span>
  );
}

function VoteRow({ vote, explanation, hasPartyMajorityConcept, showPlain, first }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ padding: "11px 0", borderTop: first ? "none" : `1px solid ${COLORS.hairline}` }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 14.5, fontWeight: 600, color: COLORS.ink, lineHeight: 1.4 }}>{explanation.label}</div>
      {showPlain && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.55, marginTop: 3 }}>{explanation.plain}</div>}
      <div style={{ display: "flex", alignItems: "center", gap: "6px 12px", flexWrap: "wrap", marginTop: 7 }}>
        <AyeNo aye={vote.voted_aye} />
        <PartyNote vote={vote} hasPartyMajorityConcept={hasPartyMajorityConcept} />
        <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>{formatDate(vote.date)}</span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: COLORS.accent }}
        >
          {open ? "Hide details" : showPlain ? "What Aye and No meant" : "What was this vote?"}
        </button>
      </div>
      {open && (
        <div style={{ marginTop: 9 }}>
          <VoteExplainer title={vote.title} />
          <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.5 }}>
            Official title: {explanation.title}
            {vote.source_url && (
              <>
                {" · "}
                <a href={vote.source_url} target="_blank" rel="noreferrer" style={{ color: COLORS.inkSoft }}>source ↗</a>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BillCard({ group, bill, hasPartyMajorityConcept, index }) {
  const info = bill ? summariseBill(bill) : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.03 }}
      style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: "16px 18px" }}
    >
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: COLORS.ink, lineHeight: 1.3 }}>{group.billName}</div>
      {info?.summary && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, lineHeight: 1.6, marginTop: 5 }}>{info.summary}</div>
      )}
      {info?.context && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 4 }}>{info.context}</div>}
      <a
        href={info?.url ?? billSearchUrl(group.billName)}
        target="_blank"
        rel="noreferrer"
        style={{ display: "inline-block", marginTop: 6, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: COLORS.accent }}
      >
        {info ? "Read about this bill ↗" : "Find this bill on Parliament's site ↗"}
      </a>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: COLORS.inkSoft, margin: "14px 0 0" }}>
        {group.rows.length === 1 ? "Their vote" : `Their ${group.rows.length} votes on it`}
      </div>
      <div>
        {group.rows.map((r, i) => (
          <VoteRow key={r.vote.id} vote={r.vote} explanation={r.explanation} hasPartyMajorityConcept={hasPartyMajorityConcept} first={i === 0} />
        ))}
      </div>
    </motion.div>
  );
}

function SoloCard({ row, hasPartyMajorityConcept, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.03 }}
      style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: "6px 18px" }}
    >
      <VoteRow vote={row.vote} explanation={row.explanation} hasPartyMajorityConcept={hasPartyMajorityConcept} showPlain first />
    </motion.div>
  );
}

export default function VoteHistory({ votes, bills, hasPartyMajorityConcept }) {
  const groups = useMemo(() => {
    const order = [];
    const byKey = new Map();
    for (const vote of votes) {
      const explanation = explainDivision(vote.title);
      const key = explanation.billName ? `bill:${explanation.billName}` : `solo:${vote.id}`;
      if (!byKey.has(key)) {
        const group = { key, billName: explanation.billName ?? null, rows: [], firstTitle: vote.title };
        byKey.set(key, group);
        order.push(group);
      }
      byKey.get(key).rows.push({ vote, explanation });
    }
    return order;
  }, [votes]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {groups.map((g, i) =>
        g.billName ? (
          <BillCard key={g.key} group={g} bill={matchBillForVote(g.firstTitle, bills)} hasPartyMajorityConcept={hasPartyMajorityConcept} index={i} />
        ) : (
          <SoloCard key={g.key} row={g.rows[0]} hasPartyMajorityConcept={hasPartyMajorityConcept} index={i} />
        )
      )}
    </div>
  );
}
