// The Manifesto tab on an MP's page: what their party promised, set beside how they voted.
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_BODY, FONT_MONO, readable } from "../theme";
import { formatDate } from "../lib/format";
import { categoriseBill, matchBillForVote } from "../lib/bills";
import { findManifesto } from "../data/partyManifestos";
import { manifestoSectionToBillCategory } from "../lib/manifestoBillMapping";
import { getBillDescription } from "../lib/billDescriptions";
import { plainSentence } from "../lib/billPlain";
import { GlossaryTerm } from "./GlossaryTerm";
import { explainDivision } from "../lib/divisionExplainer";

// One manifesto policy area, its actual promises, and — where the heading
// maps onto a trackable bill category — how this MP voted on legislation
// touching that same area. Matched by title against Commons divisions, the
// same imperfect-but-reasonable heuristic VotingRecords.jsx and
// MoneyAndVotesBox already use elsewhere on this site.
function ManifestoSectionCard({ section }) {
  const hasCategory = Boolean(section.targetCategory);
  const hasVotes = section.relatedBills.length > 0;

  return (
    <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: 16 }}>
      <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 14, color: COLORS.ink, marginBottom: 8 }}>{section.heading}</div>
      <ul style={{ margin: "0 0 10px", paddingLeft: 18 }}>
        {section.points.map((p, i) => (
          <li key={i} style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginBottom: 4, lineHeight: 1.5 }}>{p}</li>
        ))}
      </ul>
      {!hasCategory ? (
        <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, fontStyle: "italic" }}>
          No single legislation category maps cleanly onto this policy area.
        </div>
      ) : !hasVotes ? (
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>
          No recorded {section.targetCategory} votes for this MP in the tracked period yet.
        </div>
      ) : (
        <div style={{ borderTop: `1px solid ${COLORS.hairline}`, paddingTop: 10 }}>
          <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
            How they voted on {section.targetCategory} legislation
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {section.relatedBills.map((bill) => (
              <div key={bill.short_title}>
                <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12.5, color: COLORS.ink, marginBottom: 2 }}>
                  {bill.short_title}
                </div>
                {bill.description && (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 7, lineHeight: 1.5 }}>
                    {bill.description}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {bill.votes.map((v, i) => {
                    const stageLabel = explainDivision(v.title)?.label ?? v.title;
                    return (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", paddingLeft: 10 }}>
                        <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {stageLabel}
                        </span>
                        <span style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
                          <span
                            style={{
                              fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase", padding: "1px 7px", borderRadius: 999,
                              background: v.voted_aye ? "#E4EEE7" : "#F3E4E2", color: v.voted_aye ? readable("#2F6F4E") : readable("#9C3B3B"),
                            }}
                          >
                            {v.voted_aye ? "Aye" : "No"}
                          </span>
                          <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft }}>{formatDate(v.date)}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// The "Manifesto" tab: this MP's own party's 2024 manifesto, section by
// section, next to their actual votes on legislation in the same policy
// area. Deliberately doesn't try to score a pledge as "kept" or "broken" —
// manifesto text is too broad for that to be defensible — it just puts the
// promise and the voting record side by side and lets the reader judge.
export function ManifestoTabContent({ politician }) {
  const [votes, setVotes] = useState(null);
  const [bills, setBills] = useState(null);

  useEffect(() => {
    async function load() {
      const [{ data: v }, { data: b }] = await Promise.all([
        supabase.from("voting_records").select("title, date, voted_aye").eq("politician_id", politician.id),
        supabase.from("bills").select("short_title, long_title, sponsoring_department"),
      ]);
      setVotes(v ?? []);
      setBills(b ?? []);
    }
    load();
  }, [politician.id]);

  const manifesto = useMemo(() => findManifesto(politician.party), [politician.party]);
  const loading = votes === null || bills === null;

  const sections = useMemo(() => {
    if (!manifesto?.sections || loading) return null;
    const categorisedBills = bills.map((b) => ({ ...b, category: categoriseBill(b) }));
    return manifesto.sections.map((section) => {
      const targetCategory = manifestoSectionToBillCategory(section.heading);
      const relatedVotes = targetCategory
        ? votes
            .map((v) => ({ ...v, bill: matchBillForVote(v.title, categorisedBills) }))
            .filter((v) => v.bill?.category.label === targetCategory)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
        : [];

      // Grouped by bill rather than shown as one long flat list of
      // near-identically-named clause/amendment votes — a real description
      // once per bill (see lib/billDescriptions.js — falling back to the
      // official long_title, which is usually generic boilerplate) does
      // far more to make "New Clause 142" legible than the vote title
      // alone ever could.
      const relatedBills = [];
      const billIndex = new Map();
      for (const v of relatedVotes) {
        const key = v.bill.short_title;
        if (!billIndex.has(key)) {
          const entry = { short_title: v.bill.short_title, description: getBillDescription(v.bill.short_title, plainSentence(v.bill.long_title) ?? v.bill.long_title), votes: [] };
          billIndex.set(key, entry);
          relatedBills.push(entry);
        }
        billIndex.get(key).votes.push(v);
      }

      return { ...section, targetCategory, relatedBills };
    });
  }, [manifesto, votes, bills, loading]);

  if (!manifesto) {
    return (
      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, textAlign: "center", padding: "20px 0" }}>
        No 2024 manifesto on record for {politician.party ?? "this MP's party"}.
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, boxShadow: `var(--shadow-1), inset 0 3px 0 ${COLORS.accent}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.55 }}>
          {manifesto.shortName}'s {manifesto.manifestoYear} <GlossaryTerm term="Manifesto">manifesto</GlossaryTerm>, <em>{manifesto.manifestoTitle}</em>, summarised
          independently rather than reproduced (manifestos are copyrighted), matched below against{" "}
          {politician.name.split(" ").slice(-1)[0]}'s actual Commons votes in the same policy area. Votes are matched
          by title against official divisions, which can occasionally miss one or pick up an unrelated vote with a
          similar name; a policy area with none listed just means no matching bill has come to a vote yet, not that
          nothing has happened.
        </div>
        <a href={manifesto.manifestoUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 8, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12.5, color: COLORS.accentText }}>
          Read {manifesto.shortName}'s full manifesto ↗
        </a>
      </div>

      {loading && <div style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft, textAlign: "center", padding: "20px 0" }}>Checking voting history…</div>}

      {!loading && sections && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sections.map((section) => (
            <ManifestoSectionCard key={section.heading} section={section} />
          ))}
        </div>
      )}

      {!loading && !sections && manifesto.highlights?.length > 0 && (
        <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12, color: COLORS.ink, marginBottom: 10 }}>Key manifesto commitments</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {manifesto.highlights.map((h, i) => (
              <li key={i} style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, marginBottom: 6, lineHeight: 1.5 }}>{h}</li>
            ))}
          </ul>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 10, lineHeight: 1.5 }}>
            This party's manifesto isn't broken into the policy-area sections used elsewhere on this site, so votes
            can't be matched to a specific pledge here.
          </div>
        </div>
      )}
    </div>
  );
}
