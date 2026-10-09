import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_BODY, FONT_DISPLAY } from "../theme";
import { buildMpSummary } from "../lib/mpSummary";
import { CardShell } from "./shared";

const NO_PARTY_MAJORITY = ["independent", "speaker"];

// Head-only counts: three small requests that return a number, not rows.
// A failed count comes back as null so the summary leaves that line out
// rather than reporting a zero it doesn't actually know.
async function count(query) {
  const { count: n, error } = await query;
  return error ? null : n ?? 0;
}

async function loadExtras(politician) {
  const votes = () => supabase.from("voting_records").select("*", { count: "exact", head: true }).eq("politician_id", politician.id);
  const hasPartyConcept = !NO_PARTY_MAJORITY.includes((politician.party ?? "").toLowerCase());
  const [total, partyTotal, against, standardsCount, questions30d] = await Promise.all([
    count(votes()),
    hasPartyConcept ? count(votes().not("voted_with_party_majority", "is", null)) : 0,
    hasPartyConcept ? count(votes().eq("voted_with_party_majority", false)) : 0,
    count(supabase.from("standards_reports").select("*", { count: "exact", head: true }).eq("politician_id", politician.id)),
    count(supabase.from("written_questions").select("*", { count: "exact", head: true }).eq("politician_id", politician.id)),
  ]);
  return {
    votes: total == null ? null : { total, partyTotal: partyTotal ?? 0, against: against ?? 0 },
    standardsCount,
    questions30d,
  };
}

// A plain-English reading of everything else on this page, for someone who
// doesn't want to work through the register line by line. Strictly a
// description of what's on record — see lib/mpSummary.js for why the
// wording is built the way it is.
export default function MpSummary({ politician, interests, interestsLoading, interestsFailed, gifts, committees }) {
  const [extras, setExtras] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadExtras(politician).then((result) => {
      if (!cancelled) setExtras(result);
    });
    return () => {
      cancelled = true;
    };
  }, [politician]);

  const ready = !interestsLoading && extras !== null;

  const summary = useMemo(
    () =>
      buildMpSummary({
        politician,
        interests: interestsFailed || interestsLoading ? null : interests,
        gifts,
        committees,
        votes: extras?.votes ?? null,
        standardsCount: extras?.standardsCount ?? null,
        questions30d: extras?.questions30d ?? null,
      }),
    [politician, interests, interestsFailed, interestsLoading, gifts, committees, extras]
  );

  return (
    <div style={{ marginTop: 24 }}>
      <CardShell title="In Plain English">
        <p style={{ fontFamily: FONT_DISPLAY, fontSize: 18, lineHeight: 1.5, color: COLORS.ink, margin: "0 0 14px" }}>{summary.lead}</p>

        {!ready && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>Reading their records…</div>}

        {ready && (
          <div>
            {summary.items.map((item, i) => (
              <div
                key={item.key}
                style={{
                  display: "flex", flexWrap: "wrap", gap: "4px 18px", padding: "10px 0",
                  borderTop: i === 0 ? `1px solid ${COLORS.hairline}` : "none",
                  borderBottom: `1px solid ${COLORS.hairline}`,
                }}
              >
                <div style={{ flex: "0 0 150px", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.accent, paddingTop: 2 }}>{item.label}</div>
                <div style={{ flex: "1 1 280px", minWidth: 0, fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: COLORS.ink }}>{item.text}</div>
              </div>
            ))}
            <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, lineHeight: 1.55, color: COLORS.inkSoft, marginTop: 12 }}>
              Written automatically from official records: the register of interests, Commons votes, IPSA, Hansard and the Standards
              Commissioner. It says what is on record, not whether any of it is right or wrong; declaring an interest is what the
              rules require. "Voted the other way" compares them with the majority of their own party, not the whip's actual
              instruction, which is never published.
            </div>
          </div>
        )}
      </CardShell>
    </div>
  );
}
