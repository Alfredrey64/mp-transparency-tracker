// Career filters and sorts for the MP list, over the compact rows in
// mpCareers.json (see careerRecord() in mpCareers.js at the repo root for the
// field order). Pure and tested.

const F = { first: 0, elected: 1, gov: 2, govNow: 3, opp: 4, commNow: 5, commEver: 6, lost: 7, from: 8 };

export const CAREER_FILTERS = [
  { key: "firstTerm", words: ["first term","first-term","new mps","newest mps","new mp"], label: "First-term MPs", test: (c) => c[F.elected] <= 1 },
  { key: "veteran", words: ["veteran","long-serving","long serving","elected before"], label: "Elected before 2010", test: (c) => c[F.first] != null && c[F.first] < 2010 },
  { key: "minister", words: ["minister","ministers","former minister"], label: "Has been a minister", test: (c) => c[F.gov] > 0 },
  { key: "govNow", words: ["in government","government now"], label: "In government now", test: (c) => c[F.govNow] === 1 },
  { key: "shadow", words: ["shadow minister","shadow cabinet","shadow"], label: "Has been a shadow minister", test: (c) => c[F.opp] > 0 },
  { key: "committee", words: ["committee","committees"], label: "On a committee now", test: (c) => c[F.commNow] > 0 },
  { key: "switched", words: ["changed party","defected","defection","switched"], label: "Has changed party", test: (c) => c[F.from] != null },
  { key: "lostFirst", words: ["lost an election","lost before","defeated"], label: "Lost an election before winning", test: (c) => c[F.lost] > 0 },
];

// Keeps the MPs who pass every chosen filter. An MP with no career row yet
// passes none of them, so a filter never shows someone it can't vouch for.
export function applyCareerFilters(mps, careers, keys) {
  if (!keys.length) return mps;
  const tests = keys.map((k) => CAREER_FILTERS.find((f) => f.key === k)?.test).filter(Boolean);
  return mps.filter((p) => {
    const c = careers?.[p.parliament_member_id];
    return Array.isArray(c) && tests.every((t) => t(c));
  });
}

export const SORTS = [
  { key: "name", label: "Name" },
  { key: "constituency", label: "Constituency" },
  { key: "longest", label: "Longest-serving" },
  { key: "newest", label: "Newest" },
  { key: "posts", label: "Most government posts" },
];

export function sortMps(mps, careers, sortKey) {
  const year = (p) => careers?.[p.parliament_member_id]?.[F.first] ?? null;
  const posts = (p) => careers?.[p.parliament_member_id]?.[F.gov] ?? 0;
  const byName = (a, b) => (a.name ?? "").localeCompare(b.name ?? "");
  const list = [...mps];
  if (sortKey === "constituency") return list.sort((a, b) => (a.constituency ?? "").localeCompare(b.constituency ?? ""));
  if (sortKey === "longest") return list.sort((a, b) => (year(a) ?? 9999) - (year(b) ?? 9999) || byName(a, b));
  if (sortKey === "newest") return list.sort((a, b) => (year(b) ?? 0) - (year(a) ?? 0) || byName(a, b));
  if (sortKey === "posts") return list.sort((a, b) => posts(b) - posts(a) || byName(a, b));
  return list;
}

// "MP since 1987 · 10 elections won", or null until careers have loaded.
// Career filters a search phrase points at ("shadow", "first term"), so
// typing one can offer "MPs who…" as a result.
export function filtersForPhrase(phrase) {
  const q = String(phrase ?? "").trim().toLowerCase();
  if (q.length < 3) return [];
  return CAREER_FILTERS.filter((f) => f.words.some((w) => w.includes(q) || q.includes(w)));
}

export function careerLine(career) {
  if (!Array.isArray(career) || career[F.first] == null) return null;
  const n = career[F.elected];
  return `MP since ${career[F.first]}${n ? ` · ${n} election${n === 1 ? "" : "s"} won` : ""}`;
}
