import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_BODY } from "../theme";
import { getDonorSector, sectorColor } from "../lib/donorSectors";
import { partyColour, formatDate } from "../lib/format";
import { fetchAllRows } from "../lib/supabasePagination";

// This is a company-first view of the same underlying data shown elsewhere
// on this page donor-first (grouped by MP and by industry sector). Here we
// group by the actual registered company (via Companies House number, not
// just the raw donor-name string, since the same company can appear under
// several name variants in the register). We can't run a general company
// search here: that would mean calling the Companies House API straight
// from the browser, which would expose the API key and isn't something
// this static frontend can do safely. So this only ever shows companies
// that are *also* declared donors — not a general business directory.
function useDonorCompanies() {
  const [companies, setCompanies] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await fetchAllRows(() =>
        supabase
          .from("financial_interests")
          .select("donor_name, value_amount, date_registered, politicians(name, party, party_colour)")
          .not("value_amount", "is", null)
          .not("donor_name", "is", null)
      );

      const byCompany = new Map(); // companyNumber -> aggregate
      for (const row of data ?? []) {
        const tag = getDonorSector(row.donor_name);
        if (!tag || tag.source !== "companies-house") continue;

        const key = tag.companyNumber;
        if (!byCompany.has(key)) {
          byCompany.set(key, {
            companyNumber: tag.companyNumber,
            companyName: tag.companyName,
            sicCode: tag.sicCode,
            sector: tag.sector,
            total: 0,
            recipients: [],
          });
        }
        const entry = byCompany.get(key);
        entry.total += row.value_amount;
        entry.recipients.push({
          mpName: row.politicians?.name ?? "Unknown MP",
          partyColor: partyColour(row.politicians?.party_colour, COLORS.inkSoft),
          amount: row.value_amount,
          date: row.date_registered ?? null,
        });
      }

      const list = [...byCompany.values()]
        .map((c) => ({ ...c, recipients: c.recipients.sort((a, b) => b.amount - a.amount) }))
        .sort((a, b) => b.total - a.total);
      setCompanies(list);
    }
    load();
  }, []);

  return companies;
}

export function CompanyDonorsView() {
  const companies = useDonorCompanies();
  const [query, setQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("All");
  const [expandedNumber, setExpandedNumber] = useState(null);

  const sectors = useMemo(() => {
    if (!companies) return [];
    const set = new Map();
    for (const c of companies) if (!set.has(c.sector)) set.set(c.sector, sectorColor(c.sector));
    return [...set.entries()];
  }, [companies]);

  const filtered = useMemo(() => {
    if (!companies) return [];
    const q = query.trim().toLowerCase();
    return companies.filter((c) => {
      if (sectorFilter !== "All" && c.sector !== sectorFilter) return false;
      if (q && !c.companyName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [companies, query, sectorFilter]);

  return (
    <div style={{ maxWidth: 1080 }}>
      <div
        style={{
          background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12,
          padding: "14px 18px", marginBottom: 24, maxWidth: 820,
          fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.6, color: COLORS.inkSoft,
        }}
      >
        This only covers companies that are <strong style={{ color: COLORS.ink }}>also declared donors</strong> to an
        MP — it isn't a general Companies House search. We can't safely query the live Companies House API from your
        browser (that would expose the API key), so this list is limited to the {companies?.length ?? "…"} companies
        already confidently matched via the same process described below.
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap", maxWidth: 900 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by company name"
          style={{
            flex: "1 1 260px", maxWidth: 400, boxSizing: "border-box", padding: "11px 14px", fontFamily: FONT_BODY,
            fontSize: 14.5, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, background: COLORS.paperCard, color: COLORS.ink,
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20, maxWidth: 900 }}>
        <FilterPill active={sectorFilter === "All"} color={COLORS.ink} onClick={() => setSectorFilter("All")}>
          All sectors ({companies?.length ?? 0})
        </FilterPill>
        {sectors.map(([sector, color]) => (
          <FilterPill key={sector} active={sectorFilter === sector} color={color} onClick={() => setSectorFilter(sector)}>
            {sector}
          </FilterPill>
        ))}
      </div>

      {companies === null && <div style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft }}>Loading…</div>}
      {companies !== null && filtered.length === 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>No matching companies found.</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 900 }}>
        {filtered.map((c) => (
          <CompanyRow
            key={c.companyNumber}
            company={c}
            isOpen={expandedNumber === c.companyNumber}
            onToggle={() => setExpandedNumber(expandedNumber === c.companyNumber ? null : c.companyNumber)}
          />
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

function CompanyRow({ company, isOpen, onToggle }) {
  const color = sectorColor(company.sector);
  const chUrl = `https://find-and-update.company-information.service.gov.uk/company/${company.companyNumber}`;

  return (
    <motion.div
      whileHover={{ y: -1, boxShadow: "0 4px 14px rgba(20,30,32,0.08)" }}
      transition={{ duration: 0.15 }}
      style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderLeft: `3px solid ${color}`, borderRadius: 12, padding: 16 }}
    >
      <button onClick={onToggle} style={{ display: "block", width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 15.5, fontWeight: 600, color: COLORS.ink, marginBottom: 6, lineHeight: 1.35 }}>
              {titleCase(company.companyName)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", color }}>
                  {company.sector}
                </span>
              </span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>
                Company no. {company.companyNumber} · SIC {company.sicCode}
              </span>
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 15, color: COLORS.ink }}>
              £{Math.round(company.total).toLocaleString()}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.brass, fontWeight: 700, marginTop: 3 }}>
              {isOpen ? "Hide" : "Details"} {isOpen ? "▾" : "▸"}
            </div>
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${COLORS.hairline}` }}>
              <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                Donations to MPs from this company
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                {company.recipients.map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: r.partyColor, flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.mpName}</span>
                      {r.date && <span style={{ color: COLORS.inkSoft, fontSize: 12, flexShrink: 0 }}>· {formatDate(r.date)}</span>}
                    </span>
                    <span style={{ fontWeight: 700, flexShrink: 0 }}>£{Math.round(r.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <a href={chUrl} target="_blank" rel="noreferrer" style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12.5, color }}>
                View official Companies House record ↗
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Companies House returns names in ALL CAPS — this is display-only, doesn't
// touch the value used for the official record link or any matching logic.
function titleCase(name) {
  if (!name) return name;
  return name.replace(/\w\S*/g, (w) => w.charAt(0) + w.slice(1).toLowerCase());
}
