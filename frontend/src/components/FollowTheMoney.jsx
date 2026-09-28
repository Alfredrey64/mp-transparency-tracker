import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { partyColour } from "../lib/format";
import { normalizeDonorKey } from "../lib/donorSectors";
import { IconSearch } from "./icons";

const MIN_QUERY_LENGTH = 3;
const RESULT_CAP = 25;

// Placeholder "donor" text that shows up in the party donations register in
// place of a real name — never worth grouping or displaying as if it were
// an actual donor, the same filter PartyFinances.jsx applies.
const NOT_A_REAL_DONOR = /^(agreement( starting.*)?|payment received.*|undisclosed|n\/a)$/i;

// Merges matches from two registers that never otherwise touch — MPs'
// personal financial interests and the Electoral Commission's record of
// party donations — into one donor identity per search result. Grouped by
// normalizeDonorKey (same normalisation DonorsLobbying.jsx already uses for
// this exact problem) so "Acme Ltd" and "ACME LIMITED" count as one donor
// rather than two, with the longest/most complete spelling seen kept as the
// display name.
function groupDonors(interestRows, donationRows) {
  const map = new Map();

  function entryFor(rawName) {
    const key = normalizeDonorKey(rawName);
    if (!key) return null;
    if (!map.has(key)) map.set(key, { key, displayName: rawName, mpRows: [], partyRows: [] });
    const entry = map.get(key);
    if (rawName.length > entry.displayName.length) entry.displayName = rawName;
    return entry;
  }

  for (const r of interestRows) {
    if (!r.politicians) continue;
    entryFor(r.donor_name)?.mpRows.push(r);
  }
  for (const r of donationRows) {
    if (NOT_A_REAL_DONOR.test(r.donor_name.trim())) continue;
    entryFor(r.donor_name)?.partyRows.push(r);
  }

  return [...map.values()]
    .map((e) => {
      const mpTotal = e.mpRows.reduce((s, r) => s + (r.value_amount ?? 0), 0);
      const partyTotal = e.partyRows.reduce((s, r) => s + (r.value ?? 0), 0);
      return { ...e, mpTotal, partyTotal, grandTotal: mpTotal + partyTotal };
    })
    .sort((a, b) => b.grandTotal - a.grandTotal);
}

function aggregateByPolitician(rows) {
  const map = new Map();
  for (const r of rows) {
    const pol = r.politicians;
    if (!map.has(pol.id)) map.set(pol.id, { politician: pol, total: 0, count: 0 });
    const e = map.get(pol.id);
    e.total += r.value_amount ?? 0;
    e.count += 1;
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

function aggregateByParty(rows) {
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.party_name)) map.set(r.party_name, { party: r.party_name, total: 0, count: 0 });
    const e = map.get(r.party_name);
    e.total += r.value ?? 0;
    e.count += 1;
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

function DonorResultCard({ result, onSelectPolitician }) {
  const mpAgg = useMemo(() => aggregateByPolitician(result.mpRows), [result]);
  const partyAgg = useMemo(() => aggregateByParty(result.partyRows), [result]);
  const companyNumbers = useMemo(
    () => [...new Set(result.partyRows.map((r) => r.company_registration_number).filter(Boolean))],
    [result]
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderTop: `4px solid ${COLORS.accent}`, borderRadius: 14, padding: 20 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 19, color: COLORS.ink, minWidth: 0 }}>{result.displayName}</div>
        <div style={{ flexShrink: 0, fontFamily: FONT_BODY, fontSize: 16, fontWeight: 700, color: COLORS.accent }}>
          £{Math.round(result.grandTotal).toLocaleString()} total
        </div>
      </div>
      {companyNumbers.length > 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, marginTop: 4 }}>
          Companies House no. {companyNumbers.join(", ")}
        </div>
      )}

      {mpAgg.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
            Given to MPs personally · £{Math.round(result.mpTotal).toLocaleString()}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {mpAgg.map((m) => {
              const color = partyColour(m.politician.party_colour, COLORS.inkSoft);
              return (
                <button
                  key={m.politician.id}
                  onClick={() => onSelectPolitician?.(m.politician)}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, width: "100%", background: "none", border: "none", padding: "6px 4px", borderRadius: 8, cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.paper; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0, fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.politician.name}</span>
                    <span style={{ color: COLORS.inkSoft, fontSize: 12, flexShrink: 0 }}>· {m.politician.party}</span>
                  </span>
                  <span style={{ flexShrink: 0, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13, color: COLORS.inkSoft }}>
                    £{Math.round(m.total).toLocaleString()}{m.count > 1 ? ` (${m.count})` : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {partyAgg.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
            Given to political parties · £{Math.round(result.partyTotal).toLocaleString()}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {partyAgg.map((p) => (
              <div key={p.party} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "2px 4px", fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.party}</span>
                <span style={{ flexShrink: 0, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13, color: COLORS.inkSoft }}>
                  £{Math.round(p.total).toLocaleString()}{p.count > 1 ? ` (${p.count})` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function FollowTheMoney({ onSelectPolitician }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (debounced.length < MIN_QUERY_LENGTH) return;
    let cancelled = false;
    async function run() {
      setLoading(true);
      const [interestsRes, donationsRes] = await Promise.all([
        supabase
          .from("financial_interests")
          .select("donor_name, value_amount, politicians(id, name, party, party_colour, constituency)")
          .ilike("donor_name", `%${debounced}%`)
          .not("value_amount", "is", null)
          .limit(500),
        supabase
          .from("party_donations")
          .select("donor_name, value, party_name, company_registration_number")
          .ilike("donor_name", `%${debounced}%`)
          .not("value", "is", null)
          .limit(500),
      ]);
      if (cancelled) return;
      setResults(groupDonors(interestsRes.data ?? [], donationsRes.data ?? []));
      setLoading(false);
    }
    run();
    return () => { cancelled = true; };
  }, [debounced]);

  const trimmedQuery = query.trim();
  const isTooShort = trimmedQuery.length > 0 && trimmedQuery.length < MIN_QUERY_LENGTH;
  const hasSearched = debounced.length >= MIN_QUERY_LENGTH;
  const activeResults = hasSearched ? results : null;

  return (
    <div style={{ padding: PAGE_PADDING, maxWidth: 900, margin: "0 auto" }}>
      <PageHeader
        icon={IconSearch}
        kicker="Public Record · Follow the Money"
        title="Follow the money"
        subtitle="Search any company, union, or individual donor's name to see every MP and political party they've given declared money to — pulled from two official registers at once."
      />

      <div style={{ position: "relative", maxWidth: 480, marginTop: 20, marginBottom: 24 }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: COLORS.inkSoft, display: "flex" }}>
          <IconSearch size={16} />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a donor's name…"
          style={{
            width: "100%", boxSizing: "border-box", padding: "13px 16px 13px 40px", fontFamily: FONT_BODY, fontSize: 15,
            border: `1px solid ${COLORS.hairline}`, borderRadius: 12, background: COLORS.paperCard, color: COLORS.ink,
          }}
        />
      </div>

      {isTooShort && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>Keep typing — at least {MIN_QUERY_LENGTH} characters.</div>
      )}

      {!isTooShort && hasSearched && loading && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Searching the registers…</div>
      )}

      {!isTooShort && hasSearched && !loading && activeResults?.length === 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6, maxWidth: 560 }}>
          No donor matching "{debounced}" found in either register. If it's a company, try a shorter fragment of the
          name — the search only matches text that appears exactly as typed, so punctuation like "K.G.L" won't be
          found by searching "KGL".
        </div>
      )}

      {!isTooShort && hasSearched && !loading && activeResults?.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.5, maxWidth: 620 }}>
            Results only include donor names containing "{debounced}" exactly — a differently punctuated spelling of
            the same name (e.g. "K.G.L" vs "KGL") may sit under a separate result below. Where a Companies House
            number is shown, that's the most reliable way to confirm it's really the same donor.
          </div>
          {activeResults.slice(0, RESULT_CAP).map((r) => (
            <DonorResultCard key={r.key} result={r} onSelectPolitician={onSelectPolitician} />
          ))}
          {activeResults.length > RESULT_CAP && (
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>
              Showing the top {RESULT_CAP} of {activeResults.length} matching donor names, by total value — narrow your search for a more exact match.
            </div>
          )}
        </div>
      )}

      {!isTooShort && !hasSearched && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.6, maxWidth: 620 }}>
          Searches MPs' declared financial interests and the Electoral Commission's register of party donations at
          once, for any donor name containing what you type. Once found, near-identical spellings of the same name
          (with or without "Ltd", different punctuation or capitalisation) are merged into a single result
          automatically; where a Companies House number is on record, it's shown so you can double-check identity
          yourself.
        </div>
      )}
    </div>
  );
}
