import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING, numeric } from "../theme";
import { PageHeader } from "./shared";
import { partyColour, initials, formatDate, shortCategory } from "../lib/format";
import { partyColourByName } from "../lib/careerTimeline";
import { normalizeDonorKey } from "../lib/donorSectors";
import { IconSearch } from "./icons";
import DonorVotes from "./DonorVotes";

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
    if (!map.has(pol.id)) map.set(pol.id, { politician: pol, total: 0, count: 0, gifts: [] });
    const e = map.get(pol.id);
    e.total += r.value_amount ?? 0;
    e.count += 1;
    e.gifts.push({ date: r.date_registered, amount: r.value_amount, note: r.category ? shortCategory(r.category) : null });
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

function aggregateByParty(rows) {
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.party_name)) map.set(r.party_name, { party: r.party_name, total: 0, count: 0, gifts: [] });
    const e = map.get(r.party_name);
    e.total += r.value ?? 0;
    e.count += 1;
    e.gifts.push({ date: r.accepted_date, amount: r.value, note: r.donation_type });
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

const money = (n) => `£${Math.round(n).toLocaleString("en-GB")}`;
const EXAMPLES = ["Unite", "GMB", "Co-operative", "Ltd"];

// A thin bar split in two: how much of a donor's money went to MPs and how much to parties.
function SplitBar({ mp, party }) {
  const total = mp + party || 1;
  return (
    <div>
      <div role="img" aria-label={`${money(mp)} to MPs personally and ${money(party)} to parties`} style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", gap: 2, background: COLORS.hairline }}>
        {mp > 0 && <span style={{ flex: mp / total, background: "#4F46E5" }} />}
        {party > 0 && <span style={{ flex: party / total, background: "#E0367A" }} />}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 16px", marginTop: 7, fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>
        <span><span aria-hidden="true" style={{ display: "inline-block", width: 9, height: 9, borderRadius: 3, background: "#4F46E5", marginRight: 6 }} />To MPs personally <strong style={{ color: COLORS.ink }}>{money(mp)}</strong></span>
        <span><span aria-hidden="true" style={{ display: "inline-block", width: 9, height: 9, borderRadius: 3, background: "#E0367A", marginRight: 6 }} />To parties <strong style={{ color: COLORS.ink }}>{money(party)}</strong></span>
      </div>
    </div>
  );
}

// One list of recipients with a bar behind each row, so the biggest stands out. Tap a row to see each gift.
function Recipients({ title, total, accent, rows }) {
  const max = Math.max(...rows.map((r) => r.total), 1);
  const [openKey, setOpenKey] = useState(null);
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, paddingBottom: 8, borderBottom: `2px solid ${accent}` }}>
        <h4 style={{ margin: 0, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink }}>{title}</h4>
        <span style={{ ...numeric, fontSize: 14, fontWeight: 700, color: accent }}>{money(total)}</span>
      </div>
      <ul style={{ listStyle: "none", margin: "6px 0 0", padding: 0, display: "grid", gap: 2 }}>
        {rows.map((r) => {
          const open = openKey === r.key;
          return (
            <li key={r.key}>
              <button type="button" onClick={() => setOpenKey(open ? null : r.key)} aria-expanded={open} className="nclick" style={{ ...rowStyle, cursor: "pointer" }}>{rowBody(r, max, open)}</button>
              {open && (
                <div style={{ margin: "2px 0 8px 3px", padding: "8px 12px", borderLeft: `3px solid ${r.colour}`, background: `${r.colour}0f`, borderRadius: "0 10px 10px 0" }}>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
                    {[...r.gifts].sort((x, y) => String(y.date ?? "").localeCompare(String(x.date ?? ""))).map((g, i) => (
                      <li key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink }}>
                        <span style={{ minWidth: 0 }}>
                          {g.date ? formatDate(g.date) : "Date not given"}
                          {g.note && <span style={{ color: COLORS.inkSoft }}> · {g.note}</span>}
                        </span>
                        <span style={{ ...numeric, flexShrink: 0, fontWeight: 600 }}>{g.amount != null ? money(g.amount) : "No value"}</span>
                      </li>
                    ))}
                  </ul>
                  {r.onClick && (
                    <button type="button" onClick={r.onClick} className="ons-chip" style={{ marginTop: 10, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.accent }}>Open {r.label}&apos;s profile</button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
const rowStyle = { position: "relative", display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: "9px 8px", borderRadius: 10, overflow: "hidden", font: "inherit", color: "inherit" };
function rowBody(r, max, open) {
  return (
    <>
      <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.max(4, (r.total / max) * 100)}%`, background: `${r.colour}1f`, borderLeft: `3px solid ${r.colour}` }} />
      <span style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
          {r.sub && <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>{r.sub}</span>}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ ...numeric, fontSize: 14, fontWeight: 600, color: COLORS.ink, textAlign: "right" }}>
            {money(r.total)}
            <span style={{ display: "block", fontFamily: FONT_BODY, fontWeight: 400, fontSize: 11.5, color: COLORS.inkSoft }}>{r.count} {r.count === 1 ? "gift" : "gifts"}</span>
          </span>
          <span aria-hidden="true" style={{ fontSize: 16, color: COLORS.inkSoft, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>⌄</span>
        </span>
      </span>
    </>
  );
}

function DonorResultCard({ result, index, onSelectPolitician }) {
  const mpAgg = useMemo(() => aggregateByPolitician(result.mpRows), [result]);
  const partyAgg = useMemo(() => aggregateByParty(result.partyRows), [result]);
  const companyNumbers = useMemo(
    () => [...new Set(result.partyRows.map((r) => r.company_registration_number).filter(Boolean))],
    [result]
  );
  const gifts = result.mpRows.length + result.partyRows.length;
  const [open, setOpen] = useState(true);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 6) * 0.05 }}
      style={{ position: "relative", overflow: "hidden", background: `linear-gradient(135deg, ${COLORS.accent}0f, ${COLORS.paperCard} 45%)`, border: `1px solid ${COLORS.hairline}`, borderRadius: 20, padding: "clamp(16px, 3vw, 24px)", boxShadow: "0 18px 40px -28px rgba(0,0,0,0.5)" }}
    >
      <div
        role="button" tabIndex={0} aria-expanded={open} aria-label={`${result.displayName}: ${open ? "hide" : "show"} who got the money`}
        onClick={() => setOpen(!open)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(!open); } }}
        style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", cursor: "pointer" }}
      >
        <span aria-hidden="true" style={{ flexShrink: 0, width: 52, height: 52, borderRadius: 16, display: "grid", placeItems: "center", background: `linear-gradient(145deg, ${COLORS.accent}, ${COLORS.accent}99)`, color: "#fff", fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 700 }}>{initials(result.displayName)}</span>
        <div style={{ flex: "1 1 220px", minWidth: 0 }}>
          <h3 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: "clamp(19px, 2.6vw, 24px)", fontWeight: 700, color: COLORS.ink, lineHeight: 1.2, overflowWrap: "anywhere" }}>{result.displayName}</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 8px", marginTop: 6 }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: COLORS.inkSoft, border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: "2px 10px" }}>{gifts} declared {gifts === 1 ? "gift" : "gifts"}</span>
            {companyNumbers.length > 0 && <span style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: COLORS.inkSoft, border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: "2px 10px" }}>Companies House {companyNumbers.join(", ")}</span>}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ ...numeric, fontSize: "clamp(26px, 4vw, 34px)", fontWeight: 700, letterSpacing: "-0.03em", color: COLORS.ink, lineHeight: 1 }}>{money(result.grandTotal)}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 3 }}>given in total</div>
        </div>
        <span aria-hidden="true" style={{ fontSize: 20, color: COLORS.inkSoft, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>⌄</span>
      </div>

      <div style={{ marginTop: 18 }}><SplitBar mp={result.mpTotal} party={result.partyTotal} /></div>

      {open && (<>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: "22px 28px", marginTop: 22 }}>
        {mpAgg.length > 0 && (
          <Recipients
            title="Given to MPs personally" total={result.mpTotal} accent="#4F46E5"
            rows={mpAgg.map((m) => ({ key: m.politician.id, label: m.politician.name, sub: m.politician.party, colour: partyColour(m.politician.party_colour, COLORS.inkSoft), total: m.total, count: m.count, gifts: m.gifts, onClick: () => onSelectPolitician?.(m.politician) }))}
          />
        )}
        {partyAgg.length > 0 && (
          <Recipients
            title="Given to political parties" total={result.partyTotal} accent="#E0367A"
            rows={partyAgg.map((p) => ({ key: p.party, label: p.party, colour: partyColourByName(p.party), total: p.total, count: p.count, gifts: p.gifts }))}
          />
        )}
      </div>

      <DonorVotes donorName={result.displayName} mps={mpAgg.map((m) => m.politician)} />
      </>)}
    </motion.article>
  );
}

function Steps() {
  const steps = [
    ["1", "Type a name", "A company, a union or a person."],
    ["2", "We check two registers", "MPs' declared interests and the Electoral Commission's party donations."],
    ["3", "See who got the money", "Every MP and party, with the amounts."],
  ];
  return (
    <ol style={{ listStyle: "none", margin: "22px 0 0", padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 12 }}>
      {steps.map(([n, t, d]) => (
        <li key={n} style={{ display: "grid", gridTemplateColumns: "32px minmax(0, 1fr)", gap: 12, alignItems: "start", padding: "12px 14px", borderRadius: 14, background: `${COLORS.paper}`, border: `1px solid ${COLORS.hairline}` }}>
          <span aria-hidden="true" style={{ width: 28, height: 28, borderRadius: 9, display: "grid", placeItems: "center", background: `${COLORS.accent}22`, color: COLORS.accent, fontFamily: FONT_BODY, fontWeight: 800, fontSize: 14 }}>{n}</span>
          <span>
            <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink }}>{t}</span>
            <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.5, color: COLORS.inkSoft, marginTop: 2 }}>{d}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function Skeleton() {
  return (
    <div aria-hidden="true" style={{ display: "grid", gap: 16 }}>
      {[0, 1].map((i) => (
        <div key={i} style={{ height: 190, borderRadius: 20, border: `1px solid ${COLORS.hairline}`, background: `linear-gradient(100deg, ${COLORS.paperCard} 30%, ${COLORS.paper} 50%, ${COLORS.paperCard} 70%)`, backgroundSize: "200% 100%", animation: "donorShimmer 1.4s linear infinite" }} />
      ))}
      <style>{"@keyframes donorShimmer { from { background-position: 100% 0; } to { background-position: -100% 0; } } @media (prefers-reduced-motion: reduce) { [style*='donorShimmer'] { animation: none !important; } }"}</style>
    </div>
  );
}

export default function FollowTheMoney({ onSelectPolitician, initialQuery = null }) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [debounced, setDebounced] = useState((initialQuery ?? "").trim());
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
          .select("donor_name, value_amount, date_registered, category, politicians(id, name, party, party_colour, constituency)")
          .ilike("donor_name", `%${debounced}%`)
          .not("value_amount", "is", null)
          .limit(500),
        supabase
          .from("party_donations")
          .select("donor_name, value, party_name, company_registration_number, accepted_date, donation_type")
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
  const shownResults = activeResults?.slice(0, RESULT_CAP) ?? [];
  const totalGiven = shownResults.reduce((n, r) => n + r.grandTotal, 0);

  return (
    <div style={{ padding: PAGE_PADDING, maxWidth: 1000, margin: "0 auto" }}>
      <PageHeader
        icon={IconSearch}
        kicker="Follow the Money"
        title="Trace a donor"
        subtitle="Search any company, union or individual donor to see every MP and party they have given declared money to. It draws on two official registers at once."
      />

      <section aria-label="Search for a donor" style={{ marginTop: 22, padding: "clamp(18px, 3vw, 28px)", borderRadius: 24, border: `1px solid ${COLORS.hairline}`, background: `radial-gradient(640px 260px at 90% -20%, ${COLORS.accent}2b, transparent 70%), radial-gradient(420px 220px at 0% 120%, #E0367A1c, transparent 70%), ${COLORS.paperCard}` }}>
        <label htmlFor="donor-q" style={{ display: "block", fontFamily: FONT_DISPLAY, fontSize: "clamp(18px, 2.4vw, 22px)", fontWeight: 700, color: COLORS.ink, marginBottom: 12 }}>Who do you want to look up?</label>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: COLORS.accent, display: "flex" }}>
            <IconSearch size={20} />
          </span>
          <input
            id="donor-q" type="search" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off"
            placeholder="A donor's name, such as Unite"
            style={{ width: "100%", boxSizing: "border-box", padding: "17px 20px 17px 50px", fontFamily: FONT_BODY, fontSize: 17, border: `2px solid ${COLORS.hairline}`, borderRadius: 16, background: COLORS.paper, color: COLORS.ink, outline: "none" }}
            onFocus={(e) => (e.target.style.borderColor = COLORS.accent)}
            onBlur={(e) => (e.target.style.borderColor = COLORS.hairline)}
          />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 14 }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>Try</span>
          {EXAMPLES.map((e) => (
            <button key={e} type="button" className="ons-chip" onClick={() => setQuery(e)} style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: COLORS.ink, background: "transparent", border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: "6px 14px", cursor: "pointer" }}>{e}</button>
          ))}
        </div>
        {!hasSearched && <Steps />}
      </section>

      <div style={{ marginTop: 22 }}>
        {isTooShort && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft }}>Keep typing, at least {MIN_QUERY_LENGTH} characters.</div>
        )}

        {!isTooShort && hasSearched && loading && <Skeleton />}

        {!isTooShort && hasSearched && !loading && activeResults?.length === 0 && (
          <div style={{ padding: "22px 24px", borderRadius: 18, border: `1px dashed ${COLORS.hairline}`, background: COLORS.paperCard }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: COLORS.ink }}>No donor called &ldquo;{debounced}&rdquo; in either register</div>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.6, maxWidth: 600, margin: "8px 0 0" }}>
              If it is a company, try a shorter piece of the name. The search only matches text that appears exactly as typed, so punctuation like &ldquo;K.G.L&rdquo; won&apos;t be found by searching &ldquo;KGL&rdquo;.
            </p>
          </div>
        )}

        {!isTooShort && hasSearched && !loading && activeResults?.length > 0 && (
          <div style={{ display: "grid", gap: 18 }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: "6px 20px" }}>
              <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: COLORS.ink }}>
                {activeResults.length} {activeResults.length === 1 ? "donor matches" : "donors match"} &ldquo;{debounced}&rdquo;
              </h2>
              <span style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Biggest first, {money(totalGiven)} between them</span>
            </div>
            {shownResults.map((r, i) => (
              <DonorResultCard key={r.key} result={r} index={i} onSelectPolitician={onSelectPolitician} />
            ))}
            {activeResults.length > RESULT_CAP && (
              <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>
                Showing the top {RESULT_CAP} of {activeResults.length} matching donor names, by total value. Narrow your search for a more exact match.
              </div>
            )}
            <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, lineHeight: 1.55, maxWidth: 680, margin: 0 }}>
              Results only include donor names containing &ldquo;{debounced}&rdquo; exactly: a differently punctuated spelling of the same name (for example &ldquo;K.G.L&rdquo; and &ldquo;KGL&rdquo;) may sit under a separate result. Where a Companies House number is shown, that is the most reliable way to confirm it is really the same donor.
            </p>
          </div>
        )}

        {!isTooShort && !hasSearched && (
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.6, maxWidth: 680, margin: 0 }}>
            Near-identical spellings of the same name (with or without &ldquo;Ltd&rdquo;, different punctuation or capitalisation) are merged into a single result. Where a Companies House number is on record it is shown, so you can double-check who it is.
          </p>
        )}
      </div>
    </div>
  );
}
