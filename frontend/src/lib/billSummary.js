import { getBillDescription } from "./billDescriptions";

// A short "what is this bill for?" line. Where a hand-written plain-English
// description exists it's used; otherwise the bill's own official long title
// is simplified (the "A Bill to…" wording turned into "Aims to…", the
// "and for connected purposes" boilerplate dropped, long lists trimmed),
// never replaced with anything this site can't stand behind. Official
// titles are often vague ("make provision about health"), and that's
// reported as it is rather than dressed up.

const MAX_LENGTH = 210;

export function purposeFromLongTitle(longTitle) {
  let t = String(longTitle ?? "").replace(/\s+/g, " ").trim();
  if (!t) return null;
  t = t.replace(/[.\s]+$/, "");
  t = t.replace(/[;,]?\s*and\s+for\s+connected\s+purposes$/i, "").replace(/[;,]?\s*and\s+for\s+related\s+purposes$/i, "");
  t = t.replace(/^an?\s+bill\s+to\s+/i, "").replace(/^to\s+/i, "");
  if (!t) return null;
  t = `Aims to ${t.charAt(0).toLowerCase()}${t.slice(1)}`;
  if (t.length > MAX_LENGTH) {
    const cut = t.slice(0, MAX_LENGTH);
    const at = Math.max(cut.lastIndexOf("; "), cut.lastIndexOf(", "));
    t = `${(at > 60 ? cut.slice(0, at) : cut.slice(0, cut.lastIndexOf(" "))).trimEnd()}…`;
  }
  return `${t}.`.replace("….", "…");
}

// bill: a row from the bills table.
export function summariseBill(bill) {
  if (!bill) return null;
  const hand = getBillDescription(bill.short_title, null);
  const summary = hand ?? purposeFromLongTitle(bill.long_title);

  const context = [];
  if (bill.is_act) context.push("Became law");
  else if (bill.is_defeated) context.push("Defeated");
  else if (bill.current_stage) context.push(`Now at ${bill.current_stage}${bill.current_house ? ` in the ${bill.current_house}` : ""}`);
  if (bill.sponsoring_department) context.push(`brought by ${bill.sponsoring_department}`);

  return {
    summary,
    handWritten: Boolean(hand),
    context: context.length ? `${context.join(", ")}.`.replace(/^./, (c) => c.toUpperCase()) : null,
    url: bill.source_url ?? null,
  };
}

// For a bill that's no longer in the live list (it may have passed, or
// moved on), the one honest thing available is a pointer to Parliament's
// own page for it.
export function billSearchUrl(billName) {
  return `https://bills.parliament.uk/?SearchTerm=${encodeURIComponent(billName)}`;
}
