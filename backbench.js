// backbench.js
//
// Turns what Parliament's Bills API and Early Day Motions API list into the short summaries the Backbench power page uses: how far private members' bills get, and which
// early day motions MPs sign. Pure functions, no network, so they can be tested.

export const PMB_TYPES = [
  { id: 7, key: "ballot", name: "Ballot bills" },
  { id: 5, key: "tenMinute", name: "Ten Minute Rule bills" },
  { id: 8, key: "presentation", name: "Presentation bills" },
  { id: 2, key: "lords", name: "Bills starting in the Lords" },
];

const day = (iso) => String(iso ?? "").slice(0, 10);

// How far a bill has got, in words that a reader of the page would use. A bill that has moved to the other House counts as having passed its first.
export function furthest(bill) {
  if (bill.isAct) return "law";
  if (bill.billWithdrawn) return "withdrawn";
  if (bill.isDefeated) return "defeated";
  const stage = String(bill.currentStage?.description ?? "").toLowerCase();
  const otherHouse = bill.currentHouse && bill.originatingHouse && bill.currentHouse !== bill.originatingHouse && ["Commons", "Lords"].includes(bill.currentHouse);
  if (otherHouse) return "otherHouse";
  if (/royal assent/.test(stage)) return "law";
  if (/report|3rd|third|committee|amendment/.test(stage)) return "later";
  if (/2nd|second/.test(stage)) return "second";
  return "first";
}

// Counts for one session: how many of each kind were presented and how far they got. `second` means the bill is listed at second reading, which is the stage
// a bill waits at until it is debated, so it says nothing about whether a debate took place.
export function summariseBills(items) {
  const out = {};
  for (const t of PMB_TYPES) {
    const mine = items.filter((b) => b.billTypeId === t.id);
    const counts = { total: mine.length, law: 0, otherHouse: 0, later: 0, second: 0, first: 0, withdrawn: 0, defeated: 0 };
    for (const b of mine) counts[furthest(b)] += 1;
    out[t.key] = counts;
  }
  return out;
}

export const sumCounts = (summary) => Object.values(summary).reduce((a, c) => { for (const k of Object.keys(c)) a[k] = (a[k] ?? 0) + c[k]; return a; }, {});

// The first sitting date still to come for a bill, if it has any listed.
export function nextSitting(bill, today) {
  const dates = (bill.currentStage?.stageSittings ?? []).map((s) => day(s.date)).filter((d) => d >= today).sort();
  return dates[0] ?? null;
}

// A ballot bill, as the page shows it. `detail` is the bill's own record, which names its sponsor.
export function ballotRow(bill, detail, today) {
  const lead = (detail?.sponsors ?? []).find((s) => s.member)?.member;
  return {
    id: bill.billId,
    title: bill.shortTitle,
    stage: bill.currentStage?.description ?? "",
    house: bill.currentHouse ?? "",
    next: nextSitting(bill, today),
    sponsor: lead?.name ?? "",
    party: lead?.party ?? "",
    seat: lead?.memberFrom ?? "",
    outcome: furthest(bill),
  };
}

// The day a session began: Parliament numbers its Early Day Motions afresh each session, so the day motion number 1 was tabled is the first day.
export function sessionStarts(rows) {
  return rows.filter((r) => r.UIN === 1 && !r.AmendmentSuffix).map((r) => day(r.DateTabled)).sort();
}

const motionRow = (r) => ({
  id: r.Id,
  uin: r.UIN,
  title: String(r.Title ?? "").replace(/\s+/g, " ").trim(),
  date: day(r.DateTabled),
  signatures: r.SponsorsCount ?? 0,
  sponsor: r.PrimarySponsor?.Name ?? "",
  party: r.PrimarySponsor?.Party ?? "",
});

// Summarises the motions tabled in one session: how many there are, how many signatures they draw, which are most signed, and who tables the most.
export function summariseMotions(rows, { from, top = 12 } = {}) {
  const list = rows.filter((r) => !r.AmendmentSuffix && (!from || day(r.DateTabled) >= from)).map(motionRow);
  const buckets = [
    { label: "1 to 4", min: 1, max: 4 },
    { label: "5 to 9", min: 5, max: 9 },
    { label: "10 to 24", min: 10, max: 24 },
    { label: "25 to 49", min: 25, max: 49 },
    { label: "50 or more", min: 50, max: Infinity },
  ].map((b) => ({ label: b.label, count: list.filter((m) => m.signatures >= b.min && m.signatures <= b.max).length }));
  const tablers = new Map();
  const parties = new Map();
  for (const m of list) {
    const k = m.sponsor || "Unknown";
    const t = tablers.get(k) ?? { name: k, party: m.party, count: 0 };
    t.count += 1;
    tablers.set(k, t);
    const p = parties.get(m.party || "Unknown") ?? { party: m.party || "Unknown", count: 0, signatures: 0 };
    p.count += 1;
    p.signatures += m.signatures;
    parties.set(m.party || "Unknown", p);
  }
  const total = list.length;
  const signed = list.map((m) => m.signatures).sort((a, b) => a - b);
  const median = total ? signed[Math.floor((total - 1) / 2)] : 0;
  return {
    total,
    median,
    oneSignature: list.filter((m) => m.signatures <= 1).length,
    fiftyPlus: list.filter((m) => m.signatures >= 50).length,
    buckets,
    top: [...list].sort((a, b) => b.signatures - a.signatures || a.uin - b.uin).slice(0, top),
    tablers: [...tablers.values()].sort((a, b) => b.count - a.count).slice(0, 8),
    parties: [...parties.values()].sort((a, b) => b.count - a.count).slice(0, 8),
  };
}
