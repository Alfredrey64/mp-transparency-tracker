// "Who has held this office?": every government and shadow post held by
// anyone sitting in Parliament today, grouped by the post's name. It can
// only see people who sit now (their biographies are what we hold), so it
// is a partial history and the page says so. Pure and tested.

// careers: { [memberId]: { g: [[post, dept, start, end]], o: [...] } }
// people:  { [memberId]: { name, party, colour, house, profileId } }
export function buildOffices(careers, people) {
  const posts = new Map();
  for (const [memberId, detail] of Object.entries(careers)) {
    const person = people[memberId];
    if (!person) continue;
    for (const [kind, rows] of [["gov", detail.g ?? []], ["opp", detail.o ?? []]]) {
      for (const [post, dept, start, end] of rows) {
        if (!post || !start) continue;
        if (!posts.has(post)) posts.set(post, { post, kind, departments: new Set(), holders: [] });
        const entry = posts.get(post);
        if (dept) entry.departments.add(dept);
        entry.holders.push({ memberId, ...person, start, end: end ?? null });
      }
    }
  }
  return [...posts.values()]
    .map((e) => ({ ...e, departments: [...e.departments], holders: e.holders.sort((a, b) => b.start.localeCompare(a.start)), current: e.holders.filter((h) => !h.end).length }))
    .sort((a, b) => b.holders.length - a.holders.length || a.post.localeCompare(b.post));
}

const norm = (s) => String(s ?? "").toLowerCase();

// Offices whose name or department matches every word typed. With nothing
// typed, the most-held offices come first.
export function searchOffices(offices, query, limit = 30) {
  const words = norm(query).split(/\s+/).filter(Boolean);
  const hits = words.length
    ? offices.filter((o) => {
        const hay = `${norm(o.post)} ${o.departments.map(norm).join(" ")}`;
        return words.every((w) => hay.includes(w));
      })
    : offices;
  return hits.slice(0, limit);
}

export const OFFICE_KINDS = { gov: "Government", opp: "Shadow front bench" };
