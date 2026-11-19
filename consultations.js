// consultations.js
//
// Turns GOV.UK's search results for open consultations into the list the "Have your say" page shows. Pure functions, no network, so they can be tested.

const day = (s) => (typeof s === "string" && /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null);

// The part of an organisation's name worth showing: the department, not an agency below it, where GOV.UK lists both.
export function leadOrganisation(orgs) {
  const list = Array.isArray(orgs) ? orgs : [];
  const dept = list.find((o) => o.organisation_type === "ministerial_department") ?? list[0];
  return dept ? { name: String(dept.title ?? "").trim(), short: String(dept.acronym ?? "").trim() } : null;
}

const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

// One consultation from a search result, or null when it has no title or link.
export function readConsultation(r) {
  const title = clean(r?.title);
  const link = String(r?.link ?? "");
  if (!title || !link.startsWith("/")) return null;
  const org = leadOrganisation(r.organisations);
  return {
    title,
    url: "https://www.gov.uk" + link,
    published: day(r.public_timestamp),
    closes: day(r.end_date),
    summary: clean(r.description),
    department: org?.name ?? "",
    short: org?.short ?? "",
  };
}

// The consultations still open on `generated` (a YYYY-MM-DD day), soonest closing first, with a count for each department.
export function summariseConsultations(results, generated) {
  const items = (Array.isArray(results) ? results : []).map(readConsultation).filter(Boolean)
    .filter((c) => !c.closes || c.closes >= generated);
  items.sort((a, b) => (a.closes ?? "9999") < (b.closes ?? "9999") ? -1 : (a.closes ?? "9999") > (b.closes ?? "9999") ? 1 : a.title.localeCompare(b.title));
  const counts = new Map();
  for (const c of items) if (c.department) counts.set(c.department, (counts.get(c.department) ?? 0) + 1);
  const byDepartment = [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return { generated, total: items.length, byDepartment, items };
}
