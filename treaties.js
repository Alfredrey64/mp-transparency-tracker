// treaties.js
//
// Turns what Parliament's Treaties API lists (treaties-api.parliament.uk) into the short file the "UK abroad" page uses: every treaty laid before Parliament in the last 12 months,
// plus any treaty whose scrutiny is still open, each with the steps Parliament recorded and the day its objection period ends.
// Pure functions, no network, so they can be tested.
//
// The "objection period" is the 21 sitting days Parliament has to object (Constitutional Reform and Governance Act 2010, s.20). The API publishes the day it ends as a step called
// "Objection period A ends", so the site never has to count sitting days itself.

const day = (iso) => (iso ? String(iso).slice(0, 10) : null);

// The Treaties API's own three outcomes, in plain English. "CantRatify" is how it records a treaty that was withdrawn from Parliament (the step reads "Parliamentary scrutiny
// concluded, Government cannot ratify treaty"), so the site says "withdrawn", not "blocked".
export const STATUS = { NotConcluded: "open", CanRatify: "clear", CantRatify: "withdrawn" };

// "Agreement, done at Paris on 13 November 2025, between ..." -> "Agreement". "Exchange of Notes ..." and "Memorandum of Understanding ..." likewise.
export function kindOf(name) {
  const first = String(name ?? "").split(/,|\bdone at\b/i)[0].trim();
  return first && first.length <= 60 ? first : "Treaty";
}

const STEP_LABELS = [
  [/^Treaty signed$/i, "Signed"],
  [/^Laid before the House of Commons$/i, "Laid before the Commons"],
  [/^Laid before the House of Lords$/i, "Laid before the Lords"],
  [/^Noted by the International Agreements Committee/i, "Lords committee looked at it"],
  [/^Correspondence published by the International Agreements Committee/i, "Lords committee published a letter"],
  [/^Extended objection period A ends/i, "Extended objection period ends"],
  [/^Objection period A ends/i, "Objection period ends"],
  [/withdrawn from the House of Commons/i, "Withdrawn from the Commons"],
  [/withdrawn from the House of Lords/i, "Withdrawn from the Lords"],
  [/^Parliamentary scrutiny concluded, Government cannot ratify/i, "Scrutiny ended: cannot be ratified as laid"],
  [/^Parliamentary scrutiny concluded/i, "Scrutiny ended"],
];
export const stepLabel = (raw) => STEP_LABELS.find(([re]) => re.test(raw))?.[1] ?? String(raw ?? "").trim();

// One treaty from the list, optionally with its business items (the steps).
export function tidyTreaty(item, steps) {
  const v = item?.value ?? item ?? {};
  if (!v.id || !v.name) return null;
  const laid = day(v.commonsLayingDate) ?? day(v.lordsLayingDate);
  const out = {
    id: v.id,
    title: String(v.name).replace(/\s+/g, " ").trim(),
    kind: kindOf(v.name),
    paper: v.commandPaperNumber ? `${v.commandPaperPrefix ?? "CP"} ${v.commandPaperNumber}` : null,
    series: v.treatySeriesMembership?.citation ?? null,
    department: v.leadDepartment?.name ?? null,
    signed: day(v.signedDate),
    laid,
    // Treaties the API lists but that have not been laid before Parliament yet (signed, or an old record) are not "open": nothing is running.
    status: !laid && STATUS[v.parliamentaryConclusion] === "open" ? "unlaid" : (STATUS[v.parliamentaryConclusion] ?? "open"),
    debate: v.debateScheduled && v.debateScheduled !== "DebateNotScheduled" ? String(v.debateScheduled).replace(/([a-z])([A-Z])/g, "$1 $2") : null,
    url: /^https:\/\/(www\.)?gov\.uk\//i.test(v.webLink ?? "") ? v.webLink : null,
    objectionEnds: null,
    steps: [],
  };
  if (steps) {
    const rows = steps
      .map((s) => s?.value ?? s)
      .filter((s) => s && s.itemDate && s.steps?.length)
      .map((s) => ({ date: day(s.itemDate), label: stepLabel(s.steps[0]), raw: s.steps[0], link: /^https:\/\/(commonsbusiness|lordsbusiness|www)\.parliament\.uk\//i.test(s.link ?? "") ? s.link : null }))
      .sort((a, b) => a.date.localeCompare(b.date));
    // If the period was extended there are two end dates; the later one is the one that counts.
    out.objectionEnds = rows.filter((r) => /^(Extended )?objection period A ends/i.test(r.raw)).map((r) => r.date).sort().at(-1) ?? null;
    out.steps = rows.map(({ date, label, link }) => (link ? { date, label, link } : { date, label }));
  }
  return out;
}

// Which treaties get their steps fetched and are kept: laid in the last 12 months, or still open.
export function wanted(item, today) {
  const t = tidyTreaty(item);
  if (!t) return false;
  const from = new Date(`${today}T00:00:00Z`);
  from.setUTCFullYear(from.getUTCFullYear() - 1);
  return t.status !== "unlaid" && (t.status === "open" || (t.laid ?? "") >= from.toISOString().slice(0, 10));
}

const count = (rows, keyOf) => {
  const m = new Map();
  for (const r of rows) { const k = keyOf(r); if (k) m.set(k, (m.get(k) ?? 0) + 1); }
  return [...m].map(([name, n]) => ({ name, count: n })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
};

// `all` is every treaty on the list (names and dates only); `kept` is the shaped treaties with their steps.
export function summariseTreaties(all, kept, { generated }) {
  const tidy = all.map((i) => tidyTreaty(i)).filter(Boolean);
  const perYear = count(tidy, (t) => t.laid?.slice(0, 4)).sort((a, b) => a.name.localeCompare(b.name)).map((y) => ({ year: Number(y.name), count: y.count }));
  const sorted = [...kept].sort((a, b) => (b.laid ?? "").localeCompare(a.laid ?? "") || a.title.localeCompare(b.title));
  const lastYear = sorted.filter((t) => (t.laid ?? "") >= yearBefore(generated));
  return {
    generated,
    total: tidy.length,
    perYear,
    byDepartment: count(lastYear, (t) => t.department).slice(0, 12),
    byKind: count(lastYear, (t) => t.kind).slice(0, 8),
    lastYear: { count: lastYear.length, withdrawn: lastYear.filter((t) => t.status === "withdrawn").length },
    treaties: sorted,
  };
}

export function yearBefore(today) {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  return d.toISOString().slice(0, 10);
}
