// entryNotes.js
//
// Pure helpers for fetch-entry-notes.js, which gives each calendar entry a little background from Parliament's own records: the select committee's purpose (Committees API)
// and, for a debate or question, the most recent earlier debate on the same subject in Hansard with the question that was put, in Parliament's own words. Nothing is
// written in our words about a subject: where no earlier record matches closely, the entry gets no note.

const STOP = new Set("the of and to in for on a an into by with at from is are be its their this that has have had how what why will would could should about after before over under bill".split(" "));

export const keyOf = (title) => String(title ?? "").toLowerCase().replace(/&amp;/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
export const wordsOf = (title) => keyOf(title).split(" ").filter((w) => w.length > 2 && !STOP.has(w));

// The distinctive words two titles share. A match needs at least three of them, and every distinctive word of one title must be in the other, so that a general word
// ("housing", "tax", "office") never links two unrelated debates.
export function overlap(a, b) {
  const x = new Set(wordsOf(a));
  const y = new Set(wordsOf(b));
  if (!x.size || !y.size) return { shared: 0, score: 0, within: false };
  let shared = 0;
  for (const w of x) if (y.has(w)) shared++;
  return { shared, score: shared / Math.min(x.size, y.size), within: shared === Math.min(x.size, y.size) };
}

export function closeEnough(a, b) {
  const { shared, within } = overlap(a, b);
  return within && shared >= 3;
}

// What to ask Hansard's search for: pairs of the longest distinctive words (it wants every word it is given in the title), the first pair first. The results are
// checked against the whole title afterwards, so a loose search never makes a loose match.
const VAGUE = new Set("findings impact future potential merits role need case current latest update recent proposed proposals plans review".split(" "));
export function searchQueries(title) {
  const words = [...new Set(wordsOf(title))].filter((w) => !VAGUE.has(w)).sort((p, q) => q.length - p.length);
  const out = [];
  for (let i = 0; i < words.length && out.length < 3; i += 2) out.push(words.slice(i, i + 2).join(" "));
  return out;
}

const YEARS = 3;
const earliestFor = (before) => `${Number(before.slice(0, 4)) - YEARS}${before.slice(4)}`;

// The best earlier debate for a title among Hansard search results ({ Title, SittingDate, House, DebateSectionExtId }), or null.
export function bestEarlier(title, results, before) {
  const cands = (results ?? [])
    .filter((r) => r?.Title && r.DebateSectionExtId && String(r.SittingDate).slice(0, 10) < before && String(r.SittingDate).slice(0, 10) >= earliestFor(before) && closeEnough(title, r.Title))
    .sort((p, q) => overlap(title, q.Title).score - overlap(title, p.Title).score || String(q.SittingDate).localeCompare(String(p.SittingDate)));
  return cands[0] ?? null;
}

export function hansardUrl(r) {
  const slug = String(r.Title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `https://hansard.parliament.uk/${r.House}/${String(r.SittingDate).slice(0, 10)}/debates/${r.DebateSectionExtId}/${slug}`;
}

const stripHtml = (h) => String(h ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#?\w+;/g, " ").replace(/\s+/g, " ").trim();

// The question that was put, if the debate opened with one ("To ask the Secretary of State ... to make a statement on ..."), in Parliament's words.
export function askedIn(items) {
  for (const it of (items ?? []).slice(0, 6)) {
    const t = stripHtml(it?.Value).replace(/^\(Urgent Question\):?\s*/i, "");
    if (/^To ask /i.test(t) && t.length < 400) return t;
  }
  return "";
}

// A committee's purpose as at most two sentences, without the links to its social media.
export function purposeOf(html) {
  const text = stripHtml(String(html ?? "").split(/Follow (?:us|the Committee)/i)[0]).trim();
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [];
  // A purpose that ends without a full stop (the social media line followed it directly) is one sentence.
  if (!sentences.length) return text ? `${text}.` : "";
  return sentences.slice(0, 2).map((s) => s.trim()).join(" ");
}
