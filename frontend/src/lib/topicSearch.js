import { stripHtml } from "./format";

// The search box feeds straight into a PostgREST filter string, where
// commas, parentheses and wildcard characters all have meaning. Anything
// that isn't a letter, digit, space, hyphen or apostrophe is dropped, which
// is plenty for searching topics in plain English.
export function sanitiseTopicQuery(raw) {
  return String(raw ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 '-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

export const MIN_TOPIC_LENGTH = 3;

function tally(rows, keyOf, make) {
  const map = new Map();
  for (const row of rows) {
    const key = keyOf(row);
    if (key == null) continue;
    if (!map.has(key)) map.set(key, { ...make(row), count: 0 });
    map.get(key).count += 1;
  }
  return [...map.values()].sort((a, b) => b.count - a.count || String(a.name ?? a.party).localeCompare(String(b.name ?? b.party)));
}

// Turns a list of matching written questions into what the page shows: who
// is asking, from which parties, to which departments, and the most recent
// examples. Questions with no named asker are left out of the people and
// party tallies but still counted in the total.
export function summariseQuestions(rows, { recentLimit = 8, topLimit = 10 } = {}) {
  const asked = rows.filter((r) => r.asking_member_name);
  const people = tally(
    asked,
    (r) => r.asking_member_id ?? r.asking_member_name,
    (r) => ({ name: r.asking_member_name, party: r.asking_member_party ?? null, colour: r.asking_member_party_colour ?? null, politicianId: r.politician_id ?? null, house: r.house ?? null })
  );
  const parties = tally(
    asked.filter((r) => r.asking_member_party),
    (r) => r.asking_member_party,
    (r) => ({ party: r.asking_member_party, colour: r.asking_member_party_colour ?? null })
  );
  const departments = tally(rows, (r) => r.answering_body_name?.trim() || null, (r) => ({ name: r.answering_body_name.trim() }));
  const recent = [...rows]
    .sort((a, b) => String(b.date_tabled ?? "").localeCompare(String(a.date_tabled ?? "")))
    .slice(0, recentLimit)
    .map((r) => ({ ...r, question_text: stripHtml(r.question_text) }));

  return {
    total: rows.length,
    answered: rows.filter((r) => r.date_answered).length,
    askers: people.length,
    people: people.slice(0, topLimit),
    parties,
    departments: departments.slice(0, 8),
    recent,
  };
}

export const SUGGESTED_TOPICS = ["NHS", "housing", "immigration", "energy bills", "defence", "water", "schools", "climate"];
