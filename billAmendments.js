// billAmendments.js
//
// Turns the Bills API's list of amendments to a bill at one stage into the few counts a bill card shows under that stage: how many were proposed, how they were decided, and which
// party the lead sponsor belongs to. Pure functions, no network, so they can be tested.
//
// "Proposed" means tabled: an amendment can be tabled and never moved, called or voted on, so the counts are kept apart rather than added up into a success rate. Which party tabled an
// amendment is the party of its lead sponsor as the API records it; the API does not say which amendments are the government's, so this does not either.

// The API's fourteen decisions, grouped into the few a reader needs. Anything new the API adds falls into "other" rather than being dropped.
export const GROUPS = {
  agreed: ["Agreed", "AgreedOnDivision"],
  rejected: ["Disagreed", "NegativedOnDivision"],
  withdrawn: ["Withdrawn", "WithdrawnBeforeDebate"],
  notDecided: ["NotMoved", "NotCalled", "NotSelected", "Preempted"],
  pending: ["NoDecision", "QuestionProposed"],
};
const GROUP_OF = Object.fromEntries(Object.entries(GROUPS).flatMap(([g, ds]) => ds.map((d) => [d, g])));
export const groupOf = (decision) => GROUP_OF[decision] ?? "other";

const day = (d) => (typeof d === "string" && /^\d{4}-\d{2}-\d{2}/.test(d) ? d.slice(0, 10) : null);

// Only these stages are where amendments to the bill's wording are made and decided.
export const HAS_AMENDMENTS = /^(committee stage|report stage)$/i;
export const isAmendmentStage = (stage) => HAS_AMENDMENTS.test(String(stage ?? "").trim());

export function summariseAmendments(items) {
  const counts = { agreed: 0, rejected: 0, withdrawn: 0, notDecided: 0, pending: 0, other: 0 };
  const parties = new Map();
  let total = 0;
  for (const a of items ?? []) {
    if (!a || a.amendmentId === undefined) continue;
    total += 1;
    const g = groupOf(a.decision);
    counts[g] += 1;
    const lead = (a.sponsors ?? []).find((s) => s.isLead) ?? (a.sponsors ?? [])[0];
    const party = lead?.party || "Not recorded";
    const cur = parties.get(party) ?? { party, tabled: 0, agreed: 0 };
    cur.tabled += 1;
    if (g === "agreed") cur.agreed += 1;
    parties.set(party, cur);
  }
  const sorted = [...parties.values()].sort((a, b) => b.tabled - a.tabled || a.party.localeCompare(b.party));
  const top = sorted.slice(0, 6);
  const rest = sorted.slice(6);
  if (rest.length) top.push({ party: "Other parties", tabled: rest.reduce((n, p) => n + p.tabled, 0), agreed: rest.reduce((n, p) => n + p.agreed, 0) });
  return { total, ...counts, parties: top };
}

// Which of a bill's stages to ask about: committee and report stages that have already sat. `today` is a "YYYY-MM-DD" day.
export function stagesToAsk(stages, today) {
  return (stages ?? [])
    .filter((s) => s?.id && isAmendmentStage(s.description) && s.house && (s.stageSittings ?? []).some((x) => day(x.date) && day(x.date) <= today))
    .map((s) => {
      const dates = [...new Set((s.stageSittings ?? []).map((x) => day(x.date)).filter(Boolean))].sort();
      return { id: s.id, house: s.house, stage: s.description, first: dates[0], last: dates.at(-1) };
    });
}

// The key a bill card uses to find its stage: the same three facts billStages.json holds (house, stage name and first sitting day).
export const stageKey = (house, stage, first) => `${house}|${stage}|${first ?? ""}`;

// A stage whose last sitting was this long ago is settled: its amendments no longer change, so the last answer is kept rather than asked for again.
export const SETTLED_DAYS = 60;
export function isSettled(last, today) {
  if (!last) return false;
  return (new Date(`${today}T12:00:00Z`) - new Date(`${last}T12:00:00Z`)) / 86400000 > SETTLED_DAYS;
}
