// The Claims and Gifts tabs on an MP's page.
import { ExpensesMeaning } from "./MpMeaning";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "../theme";
import { formatDate, financialYearLabel } from "../lib/format";
import { GlossaryTerm } from "./GlossaryTerm";
import { LoadFailedNote } from "./MpCards";

// The "Claims" tab: a compact IPSA summary (this year vs last, by category)
// followed by every itemised claim behind it, so it's clear not just how
// much was claimed but what it was actually for.
export function ClaimsTabContent({ politician, claims }) {
  const summary = politician.ipsa_expenses;

  if (!summary) {
    return (
      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, textAlign: "center", padding: "20px 0" }}>
        No business cost data available for this MP yet (published by IPSA, the Independent Parliamentary Standards Authority).
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderTop: `3px solid ${COLORS.accent}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: COLORS.ink }}>
            £{summary.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>
            claimed in {financialYearLabel(summary.year)}
          </span>
        </div>
        {summary.previousYear && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 10 }}>
            vs £{summary.previousYear.total.toLocaleString(undefined, { maximumFractionDigits: 0 })} in {financialYearLabel(summary.previousYear.year)}
          </div>
        )}
        {summary.byCategory?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
            {summary.byCategory.map((c) => (
              <span key={c.category} style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, background: COLORS.paper, padding: "3px 9px", borderRadius: 999 }}>
                {c.category} · £{c.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            ))}
          </div>
        )}
        <ExpensesMeaning politician={politician} />
        <div style={{ marginTop: 10, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.5 }}>
          Business costs (staffing, travel, accommodation, office running costs) claimed through{" "}
          <GlossaryTerm term="IPSA">IPSA, the Independent Parliamentary Standards Authority</GlossaryTerm>, separate
          from their salary and from the donations shown under the Donations tab.{" "}
          <a
            href="https://www.theipsa.org.uk/mp-staffing-business-costs/your-mp"
            target="_blank"
            rel="noreferrer"
            style={{ color: COLORS.ink, fontWeight: 600 }}
          >
            Full record on IPSA's site ↗
          </a>
        </div>
      </div>

      {claims.length === 0 ? (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, textAlign: "center", padding: "20px 0" }}>
          No itemised claims recorded for {financialYearLabel(summary.year)} yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {claims.map((c, i) => (
            <div key={i} style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, padding: "11px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13, color: COLORS.ink }}>
                  {c.category}{c.expenseType && c.expenseType !== c.category ? ` · ${c.expenseType}` : ""}
                </span>
                <span
                  style={{
                    fontFamily: FONT_MONO, fontSize: 14, fontWeight: 600, color: COLORS.accent, flexShrink: 0,
                    lineHeight: 1.5, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", background: `${COLORS.accent}14`,
                    padding: "2px 9px", borderRadius: 999,
                  }}
                >
                  £{Number(c.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {c.description && (
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 3 }}>{c.description}</div>
              )}
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, opacity: 0.8, marginTop: 3 }}>{formatDate(c.date)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// The "Gifts" tab — only ever populated for the MPs currently holding a
// government post; everyone else just sees the explanatory empty state.
export function GiftsTabContent({ gifts, failed }) {
  if (gifts === null) {
    return <div style={{ fontFamily: FONT_BODY, color: COLORS.inkSoft }}>Loading…</div>;
  }

  if (failed) {
    return <LoadFailedNote item="ministerial gifts data" />;
  }

  if (gifts.length === 0) {
    return (
      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, textAlign: "center", padding: "20px 0", lineHeight: 1.6 }}>
        No ministerial gifts or hospitality declared for this MP. This register only applies to MPs currently
        holding a government post.
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 12, lineHeight: 1.5 }}>
        Declared under the Cabinet Office's monthly Register of Ministers' Gifts and Hospitality, covers this
        ministerial role, not their personal financial interests shown under Donations.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {gifts.map((g, i) => (
          <div key={i} style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, padding: "11px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 4 }}>
              <span
                style={{
                  fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
                  color: COLORS.accent, background: `${COLORS.accent}18`, padding: "2px 8px", borderRadius: 999,
                }}
              >
                {g.kind}
              </span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft }}>{g.department}</span>
              {g.given_or_received && (
                <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft }}>· {g.given_or_received}</span>
              )}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink, lineHeight: 1.4 }}>
              {g.description || "(no description given)"}
              {g.counterparty && <span style={{ color: COLORS.inkSoft }}>, {g.given_or_received === "Given" ? "to" : "from"} {g.counterparty}</span>}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 4 }}>
              {g.date_or_period}
              {g.value_amount != null && ` · £${g.value_amount.toLocaleString()}`}
              {g.outcome && g.outcome !== "N/A" ? ` · ${g.outcome}` : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
