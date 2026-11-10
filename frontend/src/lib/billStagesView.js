import STAGES from "../data/billStages.json";

export function stagesFor(bill) {
  return STAGES[String(bill.bill_id)] ?? null;
}

// Which stage is "now": the last listed stage that matches where the bill is. A bill that has become law or fallen has finished its journey, so nothing is marked as current.
export function currentIndex(stages, bill) {
  if (bill.is_act || bill.is_defeated) return stages.length;
  let at = -1;
  stages.forEach((s, i) => { if (s.stage === bill.current_stage && s.house === bill.current_house) at = i; });
  return at;
}


// The glossary term for a stage as Parliament names it: its numbered readings are spelled out ("2nd reading" is the glossary's Second Reading), and any other stage is looked
// up under its own name (Committee stage, Report stage, Royal Assent, Programme motion and so on). A stage the glossary has nothing on is left as plain text by GlossaryTerm.
export function stageTerm(stage) {
  const s = String(stage ?? "").trim();
  if (/^1st reading/i.test(s)) return "First Reading";
  if (/^2nd reading/i.test(s)) return "Second Reading";
  if (/^3rd reading/i.test(s)) return "Third Reading";
  return s;
}

const DAY = 86400000;
const dayCount = (a, b) => Math.round((new Date(`${b}T12:00:00Z`) - new Date(`${a}T12:00:00Z`)) / DAY);

// How long a bill has been going, from the days Parliament recorded: when its first recorded day was, how many days that is, and the latest day recorded. Everything here is a
// count of days between two recorded dates; nothing says how long a bill "should" take, as this site has no way to know that. A bill that has become law or fallen is counted
// to its last recorded day rather than to today. `today` is a "YYYY-MM-DD" day.
export function paceOf(stages, bill, today) {
  const dated = [];
  for (const s of stages ?? []) for (const d of s.dates ?? []) dated.push({ date: d, stage: s.stage, house: s.house });
  if (!dated.length) return null;
  dated.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const first = dated[0];
  const last = dated.at(-1);
  const finished = Boolean(bill?.is_act || bill?.is_defeated);
  const end = finished ? last.date : today;
  return { start: first.date, last, days: Math.max(0, dayCount(first.date, end)), sinceLast: Math.max(0, dayCount(last.date, today)), finished };
}
